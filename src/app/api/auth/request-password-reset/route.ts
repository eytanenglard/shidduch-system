// src/app/api/auth/request-password-reset/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, VerificationType, UserStatus, VerificationStatus } from '@prisma/client'; // Added VerificationStatus
import { VerificationService } from '@/lib/services/verificationService';
import { emailService } from '@/lib/email/emailService';
import { z } from 'zod';

const prisma = new PrismaClient(); // Consider using your global prisma instance if you have one at @/lib/prisma

const requestPasswordResetSchema = z.object({
  email: z.string().email({ message: "כתובת מייל לא תקינה" }),
});

// Helper for logging (consistent with your existing logs)
type LogMetadata = {
  email?: string;
  userId?: string;
  verificationId?: string; // <--- הוספה של המאפיין החסר
  error?: unknown;
  timestamp?: string;
  action?: string;
  status?: UserStatus | VerificationStatus; // For logging user or verification status
};

const logger = {
  info: (message: string, meta?: LogMetadata) => console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'info', message, ...meta })),
  warn: (message: string, meta?: LogMetadata) => console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: 'warn', message, ...meta })),
  error: (message: string, meta?: LogMetadata) => console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'error', message, ...meta })),
};

export async function POST(req: Request) {
  const action = "request-password-reset";
  let requestBody: { email?: string } | undefined; // Define type for requestBody
  try {
    requestBody = await req.json();
    logger.info('Request password reset initiated', { action });

    const validation = requestPasswordResetSchema.safeParse(requestBody);
    if (!validation.success) {
      logger.warn('Invalid email format for password reset request', {
        action,
        error: validation.error.flatten().fieldErrors,
      });
      return NextResponse.json({ success: false, error: validation.error.flatten().fieldErrors.email?.[0] || "כתובת מייל לא תקינה" }, { status: 400 });
    }

    const { email } = validation.data;
    const normalizedEmail = email.toLowerCase();
    logger.info('Processing password reset request', { action, email: normalizedEmail });

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    const genericSuccessMessage = 'אם קיימת כתובת מייל זו במערכת וניתן לאפס עבורה סיסמה, קוד אימות נשלח כעת.';

    if (!user) {
      logger.info('User not found for password reset request', { action, email: normalizedEmail });
      return NextResponse.json({ success: true, message: genericSuccessMessage }, { status: 200 });
    }

    if (!user.password) {
      logger.info('Password reset attempted for account without a password (e.g., OAuth user)', { action, email: normalizedEmail, userId: user.id });
      return NextResponse.json({ success: true, message: genericSuccessMessage }, { status: 200 });
    }
    
    if (user.status === UserStatus.BLOCKED || user.status === UserStatus.INACTIVE) {
        logger.warn('Password reset attempted for blocked or inactive user', { action, email: normalizedEmail, userId: user.id, status: user.status });
        return NextResponse.json({ success: true, message: genericSuccessMessage }, { status: 200 });
    }

    await prisma.verification.updateMany({
        where: {
            userId: user.id,
            type: VerificationType.PASSWORD_RESET,
            status: VerificationStatus.PENDING, // Use VerificationStatus enum
        },
        data: {
            status: VerificationStatus.EXPIRED, // Use VerificationStatus enum
        },
    });
    logger.info('Invalidated previous pending password reset OTPs', { action, userId: user.id });

    const expiresInMinutes = 15;
    const { otp: generatedOtp, verification: passwordResetVerification } = await VerificationService.createVerification(
      user.id,
      VerificationType.PASSWORD_RESET,
      user.email,
      expiresInMinutes / 60
    );
    // Now this log line is valid because verificationId is in LogMetadata
    logger.info('Password reset OTP created in VerificationService', { action, userId: user.id, verificationId: passwordResetVerification.id });

    try {
      await emailService.sendPasswordResetOtpEmail({
        email: user.email,
        otp: generatedOtp,
        firstName: user.firstName,
        expiresIn: `${expiresInMinutes} דקות`,
      });
      logger.info('Password reset OTP email sent successfully', { action, userId: user.id, email: user.email });
    } catch (emailError) {
      logger.error('Failed to send password reset OTP email', {
        action,
        userId: user.id,
        email: user.email,
        error: emailError instanceof Error ? { name: emailError.name, message: emailError.message } : emailError,
      });
    }

    return NextResponse.json({ success: true, message: genericSuccessMessage }, { status: 200 });

  } catch (error: unknown) {
    const emailForLog = requestBody?.email;
    logger.error('Error in request password reset process', {
      action,
      email: emailForLog,
      error: error instanceof Error ? { name: error.name, message: error.message, stack: (process.env.NODE_ENV === 'development' ? error.stack : undefined) } : String(error),
    });

    return NextResponse.json(
      { success: false, error: 'אירעה שגיאה בתהליך. אנא נסה שנית מאוחר יותר.' },
      { status: 500 }
    );
  } finally {
    // Only disconnect if prisma instance was created locally in this file
    // If using a global instance from @/lib/prisma, it's usually managed globally
    // await prisma.$disconnect().catch(e => logger.error('Failed to disconnect Prisma in request-password-reset', { error: e }));
  }
}