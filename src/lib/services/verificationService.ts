// src/lib/services/verificationService.ts
import { VerificationType, VerificationStatus, UserStatus, Prisma } from '@prisma/client';
import { randomInt } from 'crypto'; // For OTP generation
import prisma from '@/lib/prisma'; // Assuming global prisma instance

const OTP_LENGTH = 6;
const MAX_VERIFICATION_ATTEMPTS = 5; // Example value

interface VerificationResult {
  success: boolean;
  message: string;
  userId?: string | null; // Can be null if user association isn't direct or fails
  id?: string; // ID of the verification record
}

export class VerificationService {
  static async createVerification(
    userId: string,
    type: VerificationType,
    target: string, // e.g., email address or phone number
    expiresInHours: number,
    tx?: Prisma.TransactionClient // Optional transaction client
  ): Promise<{ otp: string; verification: { id: string; token: string; expiresAt: Date } }> {
    const effectivePrisma = tx || prisma;
    const otp = randomInt(10**(OTP_LENGTH - 1), 10**OTP_LENGTH -1).toString().padStart(OTP_LENGTH, '0');
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    // Invalidate previous PENDING verifications of the same type for this user/target
    // This is especially important for OTPs to ensure only the latest one is active.
    // For PASSWORD_RESET, this is handled in the API route before calling createVerification.
    // For EMAIL verification during registration, this might also be good practice.
    if (type === VerificationType.EMAIL || type === VerificationType.PHONE_WHATSAPP) {
        await effectivePrisma.verification.updateMany({
            where: {
                // If userId is available and relevant for uniqueness (e.g. for EMAIL type)
                ...(userId && { userId }), 
                // For PHONE_WHATSAPP, target (phone number) is more critical for pending check
                ...(!userId && { target }), 
                type: type,
                status: VerificationStatus.PENDING,
            },
            data: {
                status: VerificationStatus.EXPIRED, // Or 'CANCELLED'
            },
        });
    }


    const verification = await effectivePrisma.verification.create({
      data: {
        userId,
        type,
        token: otp,
        target: target.toLowerCase(), // Normalize target (e.g. email)
        expiresAt,
        status: VerificationStatus.PENDING,
        attempts: 0,
      },
      select: { id: true, token: true, expiresAt: true } // Return only necessary fields
    });

    return { otp, verification };
  }

  static async verifyCode(
    code: string,
    type: VerificationType,
    target?: string // Target (e.g., email for password reset, phone for phone verify)
  ): Promise<VerificationResult & { userId: string | null }> { // Ensure userId is part of the promise
    const normalizedTarget = target?.toLowerCase();

    const verification = await prisma.verification.findFirst({
      where: {
        token: code,
        type,
        ...(normalizedTarget && { target: normalizedTarget }), // Use target if provided
        status: VerificationStatus.PENDING,
      },
      orderBy: {
        createdAt: 'desc', // Get the most recent one if multiple match (should be rare)
      },
    });

    if (!verification) {
      throw new Error('קוד אימות לא תקין או שלא קיימת בקשת אימות פעילה.');
    }

    if (new Date() > verification.expiresAt) {
      await prisma.verification.update({
        where: { id: verification.id },
        data: { status: VerificationStatus.EXPIRED },
      });
      throw new Error('תוקף הקוד פג. אנא בקש קוד חדש.');
    }

    if (verification.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      await prisma.verification.update({
        where: { id: verification.id },
        data: { status: VerificationStatus.FAILED },
      });
      throw new Error('חרגת ממספר ניסיונות האימות המותר. אנא בקש קוד חדש.');
    }

    // If code is correct (Implicitly, as we found it by token)
    // Increment attempts
    await prisma.verification.update({
      where: { id: verification.id },
      data: { 
        attempts: { increment: 1 },
        // DO NOT set to COMPLETED yet for PASSWORD_RESET.
        // Only set to COMPLETED after password has been updated in DB by the calling API.
        // For EMAIL verification, we can set to COMPLETED here.
        ...(type === VerificationType.EMAIL && { 
            status: VerificationStatus.COMPLETED,
            completedAt: new Date()
        })
      },
    });
    
    if (!verification.userId) {
        // This should not happen if the verification record was created correctly with a userId
        console.error(`VerificationService: userId missing on verification record ${verification.id} for type ${type} and target ${target}`);
        throw new Error('שגיאה פנימית: רשומת האימות אינה משויכת למשתמש.');
    }

    // For EMAIL verification type, update user status as well
    if (type === VerificationType.EMAIL && verification.userId) {
      const user = await prisma.user.findUnique({ where: {id: verification.userId }});
      if (user && !user.isVerified) { // Only update if not already verified
        await prisma.user.update({
          where: { id: verification.userId },
          data: {
            isVerified: true,
            // Only update status if it's PENDING_EMAIL_VERIFICATION
            ...(user.status === UserStatus.PENDING_EMAIL_VERIFICATION && {
                status: UserStatus.PENDING_PHONE_VERIFICATION, // Or ACTIVE if phone verification is not mandatory next
            }),
            updatedAt: new Date(),
          },
        });
      }
    }
    
    // For PASSWORD_RESET, the calling API (`/api/auth/reset-password`) will handle updating the password
    // and THEN it should explicitly mark the verification record as COMPLETED.
    // This function's role is just to validate the OTP itself.

    return {
      success: true,
      message: 'Code verified.',
      userId: verification.userId, // Return userId
      id: verification.id // Return verification record id
    };
  }

  // New method to explicitly complete a verification, e.g., after password reset
  static async completeVerification(verificationId: string): Promise<void> {
    await prisma.verification.update({
        where: { id: verificationId },
        data: {
            status: VerificationStatus.COMPLETED,
            completedAt: new Date(),
        },
    });
  }
}