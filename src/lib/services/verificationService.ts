// lib/services/verificationService.ts

import globalPrismaClient from '@/lib/prisma'; // שינוי שם הייבוא כדי למנוע התנגשות
import { Verification, VerificationType, VerificationStatus, UserStatus, Prisma, PrismaClient } from '@prisma/client';

const OTP_LENGTH = 6;

// טיפוס עזר עבור לקוח פריזמה או לקוח טרנזקציה אינטראקטיבית
// זה מאפשר לפונקציות שלנו לקבל או את ה-PrismaClient הגלובלי או את ה-tx מטרנזקציה
type PrismaTransactionalClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export class VerificationService {
  private static generateOtp(length: number = OTP_LENGTH): string {
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10).toString();
    }
    return otp;
  }

  static async createVerification(
    userId: string,
    type: VerificationType,
    target: string,
    expiresInHours: number = 1,
    // הוספת פרמטר לקבלת אובייקט ה-Prisma הרלוונטי (יכול להיות tx או ה-client הגלובלי)
    prismaInstance: PrismaTransactionalClient = globalPrismaClient 
  ): Promise<{ verification: Verification, otp: string }> {
    try {
      const otp = this.generateOtp();
      const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

      // השתמש ב-prismaInstance (שהוא tx מהקריאה ב-register/route.ts, או globalPrismaClient)
      await prismaInstance.verification.updateMany({
        where: {
          target,
          type,
          status: VerificationStatus.PENDING
        },
        data: {
          status: VerificationStatus.EXPIRED
        }
      });
      const actionSource = prismaInstance === globalPrismaClient ? 'global prisma' : 'transactional prisma (tx)';
      console.log(`Expired previous PENDING verifications of type ${type} for target ${target}. (Using ${actionSource})`);

      const newVerification = await prismaInstance.verification.create({
        data: {
          userId,
          type,
          token: otp,
          target,
          expiresAt,
          status: VerificationStatus.PENDING,
          attempts: 0
        }
      });
      console.log(`Created new verification (ID: ${newVerification.id}) with OTP for type ${type}, target ${target}. Expires at ${expiresAt.toISOString()}. (Using ${actionSource})`);
      return { verification: newVerification, otp };

    } catch (error) {
      console.error(`Error creating verification for user ${userId}, type ${type}, target ${target}:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
         console.error("Detailed P2003 error during createVerification (meta):", JSON.stringify(error.meta));
         console.error("Attempted to create verification for userId:", userId, "which should exist from the same transaction.");
      }
      // חשוב לזרוק את השגיאה המקורית כדי לא לאבד מידע
      throw error; 
    }
  }

  static async verifyCode(
    code: string,
    type: VerificationType,
    target: string,
    // אין צורך להעביר prismaInstance לכאן כרגע, כי היא מנהלת טרנזקציה משלה
    // אבל אם בעתיד נרצה לשרשר אותה, אפשר להוסיף
  ): Promise<Verification> {
    console.info(`Attempting to verify code: ${code}, type: ${type}, target: ${target}`);
    try {
      // הפונקציה הזו מנהלת טרנזקציה משלה, זה בסדר עבור פעולת אימות.
      const result = await globalPrismaClient.$transaction(async (txInternal) => {
        const verification = await txInternal.verification.findFirst({
          where: {
            target,
            type,
            status: VerificationStatus.PENDING,
          },
          include: { user: true }
        });

        if (!verification) {
          console.warn(`No PENDING verification record found for target: ${target}, type: ${type}. Checking for already used or invalid code.`);
          const existingVerificationByCodeAndTarget = await txInternal.verification.findFirst({
            where: { token: code, target, type }
          });
          if (existingVerificationByCodeAndTarget) {
            if (existingVerificationByCodeAndTarget.status === VerificationStatus.COMPLETED) {
              throw new Error('הקוד כבר נוצל.');
            }
            if (existingVerificationByCodeAndTarget.status === VerificationStatus.EXPIRED) {
              throw new Error('תוקף הקוד פג. אנא בקש קוד חדש.');
            }
          }
          throw new Error('קוד אימות לא תקין או שלא קיימת בקשת אימות פעילה.');
        }

        if (verification.token !== code) {
          console.warn(`Verification attempt failed for target: ${target}, type: ${type}. Submitted code ${code} does not match stored token ${verification.token}. Verification ID: ${verification.id}`);
          await txInternal.verification.update({
            where: { id: verification.id },
            data: { attempts: { increment: 1 } }
          });
          throw new Error('קוד אימות שגוי.');
        }

        if (verification.expiresAt < new Date()) {
          console.warn(`Verification attempt failed: Code for target ${target} (${type}) expired. Verification ID: ${verification.id}`);
          await txInternal.verification.update({
            where: { id: verification.id },
            data: { status: VerificationStatus.EXPIRED, attempts: { increment: 1 } }
          });
          throw new Error('תוקף הקוד פג. אנא בקש קוד חדש.');
        }

        if (!verification.userId || !verification.user) {
          console.error(`Verification error: No user ID or user object associated with verification record ${verification.id}`);
          throw new Error('שגיאה פנימית: לא נמצא משתמש משויך לאימות.');
        }

        const updatedVerification = await txInternal.verification.update({
          where: { id: verification.id },
          data: {
            status: VerificationStatus.COMPLETED,
            completedAt: new Date(),
            attempts: { increment: 1 }
          }
        });
        console.info(`Verification record ${verification.id} status updated to COMPLETED.`);

        let newStatus = verification.user.status;
        const userUpdateData: Prisma.UserUpdateInput = {};

        if (type === VerificationType.EMAIL) {
          userUpdateData.isVerified = true;
          if (verification.user.status === UserStatus.PENDING_EMAIL_VERIFICATION) {
            newStatus = UserStatus.PENDING_PHONE_VERIFICATION;
          }
        } else if (type === VerificationType.PHONE_WHATSAPP) {
          userUpdateData.isPhoneVerified = true;
          if (verification.user.status === UserStatus.PENDING_PHONE_VERIFICATION) {
            newStatus = UserStatus.ACTIVE;
          }
        }
        userUpdateData.status = newStatus;

        await txInternal.user.update({
          where: { id: verification.userId },
          data: userUpdateData,
        });
        console.info(`User ${verification.userId} flags updated and status potentially changed to ${newStatus}.`);

        return updatedVerification;
      });

      console.info(`Code verification successful for code ${code}, type ${type}, target ${target}.`);
      return result;

    } catch (error) {
      const knownErrors = [
        'הקוד כבר נוצל.',
        'תוקף הקוד פג. אנא בקש קוד חדש.',
        'קוד אימות לא תקין או שלא קיימת בקשת אימות פעילה.',
        'קוד אימות שגוי.',
        'שגיאה פנימית: לא נמצא משתמש משויך לאימות.'
      ];
      if (error instanceof Error && knownErrors.includes(error.message)) {
        console.warn(`Verification for ${target} failed with known error: ${error.message}`);
        throw error;
      }
      console.error(`Error during code verification for ${target}, type ${type}:`, error);
      // שקול לא לזרוק שגיאה כללית אם השגיאה המקורית יותר אינפורמטיבית
      if (error instanceof Error) throw error;
      throw new Error('אירעה שגיאה בתהליך האימות. אנא נסה שנית.');
    }
  }
}