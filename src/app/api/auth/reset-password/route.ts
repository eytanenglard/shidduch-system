// src/app/api/auth/reset-password/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, VerificationType} from '@prisma/client';
import { VerificationService } from '@/lib/services/verificationService';
import { emailService } from '@/lib/email/emailService'; // For password change confirmation
import { hash } from 'bcryptjs';
import { z } from 'zod';

const prisma = new PrismaClient();

const resetPasswordSchema = z.object({
  email: z.string().email({ message: "כתובת מייל לא תקינה" }),
  otp: z.string().length(6, { message: "קוד האימות חייב להכיל 6 ספרות" }).regex(/^\d+$/, { message: "קוד אימות יכול להכיל ספרות בלבד" }),
  newPassword: z.string().min(8, { message: "הסיסמה חייבת להכיל לפחות 8 תווים" })
    .regex(/[a-z]/, { message: "הסיסמה חייבת להכיל לפחות אות קטנה אחת באנגלית" })
    .regex(/[A-Z]/, { message: "הסיסמה חייבת להכיל לפחות אות גדולה אחת באנגלית" })
    .regex(/[0-9]/, { message: "הסיסמה חייבת להכיל לפחות ספרה אחת" }),
});

// Helper for logging
type LogMetadata = {
  email?: string;
  userId?: string;
  verificationId?: string;
  error?: unknown;
  timestamp?: string;
  action?: string;
};

const logger = {
  info: (message: string, meta?: LogMetadata) => console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'info', message, ...meta })),
  warn: (message: string, meta?: LogMetadata) => console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: 'warn', message, ...meta })),
  error: (message: string, meta?: LogMetadata) => console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'error', message, ...meta })),
};

export async function POST(req: Request) {
  const action = "reset-password-with-otp";
  let requestBody;

  try {
    requestBody = await req.json();
    logger.info('Reset password with OTP process initiated', { action });

    const validation = resetPasswordSchema.safeParse(requestBody);
    if (!validation.success) {
      logger.warn('Invalid input for password reset', {
        action,
        error: validation.error.flatten().fieldErrors,
      });
      const errors = validation.error.flatten().fieldErrors;
      let errorMessage = "נתונים לא תקינים.";
      if (errors.email?.[0]) errorMessage = errors.email[0];
      else if (errors.otp?.[0]) errorMessage = errors.otp[0];
      else if (errors.newPassword?.[0]) errorMessage = errors.newPassword[0];
      
      return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
    }

    const { email, otp, newPassword } = validation.data;
    const normalizedEmail = email.toLowerCase();

    logger.info('Attempting to verify OTP for password reset', { action, email: normalizedEmail });

    // Step 1: Verify the OTP using VerificationService
    // This should not mark the verification as 'COMPLETED' yet for PASSWORD_RESET type.
    const verificationResult = await VerificationService.verifyCode(
      otp,
      VerificationType.PASSWORD_RESET,
      normalizedEmail
    );

    // If verifyCode doesn't throw an error, it means the OTP is valid (not expired, not too many attempts, exists).
    // It returns { success: true, message: 'Code verified.', userId: '...', id: '...' }
    
   if (!verificationResult.success || !verificationResult.userId || !verificationResult.id) {
      // This scenario should ideally be handled by verifyCode throwing an error.
      // If verifyCode is changed to return success:false instead of throwing for some cases, handle here.
      logger.error('OTP verification failed or did not return expected data', { 
        action, 
        email: normalizedEmail, 
        error: verificationResult // Changed 'result' to 'error'
      });
      throw new Error(verificationResult.message || 'שגיאה באימות הקוד.');
    }
    
    const userId = verificationResult.userId;
    const verificationId = verificationResult.id; // ID of the verification record

    logger.info('OTP verified successfully for password reset', { action, email: normalizedEmail, userId, verificationId });

    // Step 2: Hash the new password
    const hashedPassword = await hash(newPassword, 12);
    logger.info('New password hashed', { action, userId });

    // Step 3: Update the user's password in the database
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
        // Optional: Reset login attempts if you track them, or other security measures
      },
    });
    logger.info('User password updated in database', { action, userId });

    // Step 4: Explicitly mark the verification record as COMPLETED
    await VerificationService.completeVerification(verificationId);
    logger.info('Password reset verification record marked as completed', { action, verificationId });

    // Step 5: Optional - Send password change confirmation email
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, firstName: true } });
    if (user) {
        try {
            await emailService.sendPasswordChangedConfirmationEmail({
                email: user.email,
                firstName: user.firstName,
            });
            logger.info('Password change confirmation email sent', { action, userId });
        } catch (emailError) {
            logger.error('Failed to send password change confirmation email', {
                action,
                userId,
                error: emailError instanceof Error ? { name: emailError.name, message: emailError.message } : emailError,
            });
            // Non-critical error for the overall success of password reset, proceed
        }
    }

    return NextResponse.json({ success: true, message: 'הסיסמה אופסה בהצלחה. כעת תוכל להתחבר עם הסיסמה החדשה.' }, { status: 200 });

  } catch (error: unknown) {
    const emailForLog = typeof requestBody === 'object' && requestBody && 'email' in requestBody ? String(requestBody.email) : undefined;
    logger.error('Error in reset password with OTP process', {
      action,
      email: emailForLog,
      error: error instanceof Error ? { name: error.name, message: error.message, stack: (process.env.NODE_ENV === 'development' ? error.stack : undefined) } : String(error),
    });

    let errorMessage = 'אירעה שגיאה באיפוס הסיסמה.';
    let errorStatus = 500;

    if (error instanceof Error) {
      const knownClientErrors = [
        'הקוד כבר נוצל.', // This shouldn't happen if completeVerification is called after successful password update.
        'תוקף הקוד פג. אנא בקש קוד חדש.',
        'קוד אימות לא תקין או שלא קיימת בקשת אימות פעילה.',
        'קוד אימות שגוי.',
        'חרגת ממספר ניסיונות האימות המותר. אנא בקש קוד חדש.',
        'שגיאה פנימית: אימות הקוד הצליח אך לא נמצא משתמש משויך.',
        'שגיאה פנימית: רשומת האימות אינה משויכת למשתמש.' // from verifyCode
      ];
      if (knownClientErrors.includes(error.message)) {
        errorMessage = error.message;
        errorStatus = 400; 
        if (error.message.includes("פג תוקפו")) errorStatus = 410; // Gone
        if (error.message.includes("חרגת ממספר ניסיונות")) errorStatus = 429; // Too Many Requests
      }
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: errorStatus }
    );
  } finally {
    await prisma.$disconnect().catch(e => logger.error('Failed to disconnect Prisma in reset-password API', { error: e }));
  }
}