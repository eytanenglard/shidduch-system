// app/api/auth/resend-verification-code/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient, VerificationType, UserStatus } from '@prisma/client';
import { VerificationService } from '@/lib/services/verificationService';
import { emailService } from '@/lib/email/emailService';

const prisma = new PrismaClient();

// Updated LogMetadata type
type LogMetadata = {
  email?: string;
  error?: unknown;
  timestamp?: string; // Note: logger already adds a timestamp. This allows overriding or adding a specific one.
  userId?: string;
  verificationId?: string; // Added to fix the error
  status?: UserStatus;     // Added for metadata in a logger.warn call
  isVerified?: boolean;    // Added for metadata in a logger.warn call
};

// Updated logger object with 'warn' method
const logger = {
  info: (message: string, meta?: LogMetadata) => console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'info', message, ...meta })),
  error: (message: string, meta?: LogMetadata) => console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'error', message, ...meta })),
  warn: (message: string, meta?: LogMetadata) => console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: 'warn', message, ...meta })) // Added 'warn' method
};

interface ResendCodeRequest {
  email: string;
}

export async function POST(req: Request) {
  let requestBody: ResendCodeRequest | null = null;
  try {
    requestBody = await req.json();
    const { email } = requestBody!;

    logger.info('Resend verification code process initiated', { email });


    if (!email) {
      logger.error('Missing email for resending code');
      return NextResponse.json({ success: false, error: 'חסרה כתובת אימייל.' }, { status: 400 });
    }
    
    const normalizedEmail = email.toLowerCase();
    logger.info('Attempting to resend verification code', { email: normalizedEmail });

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      logger.warn('User not found for resending code', { email: normalizedEmail }); // Now valid
      return NextResponse.json({ success: false, error: 'משתמש עם כתובת אימייל זו אינו רשום.' }, { status: 404 });
    }

    // ודא שהמשתמש עדיין צריך לאמת אימייל
    if (user.isVerified || user.status !== UserStatus.PENDING_EMAIL_VERIFICATION) {
        // This log call now correctly uses properties defined in LogMetadata
        logger.warn('User email already verified or not pending email verification', { email: normalizedEmail, userId: user.id, status: user.status, isVerified: user.isVerified });
        return NextResponse.json({ success: false, error: 'כתובת האימייל כבר מאומתת או שאינה ממתינה לאימות.' }, { status: 400 });
    }
    
    // יצירת קוד אימות חדש ושליחתו
    const expiresInHoursForOtp = 1; // תוקף של שעה
    const { otp: newOtp, verification: newVerificationRecord } = await VerificationService.createVerification(
      user.id,
      VerificationType.EMAIL,
      user.email, // השתמש באימייל מהמשתמש (שכבר מנורמל)
      expiresInHoursForOtp
    );
    // This log call now correctly uses verificationId defined in LogMetadata
    logger.info('New verification record created for resend', { verificationId: newVerificationRecord.id, userId: user.id });


    // שליחת המייל עם הקוד החדש
    const emailOtpExpiryText = "שעה אחת"; // התאם ל-expiresInHoursForOtp
    await emailService.sendVerificationEmail({
      email: user.email,
      verificationCode: newOtp,
      firstName: user.firstName,
      expiresIn: emailOtpExpiryText,
    });

    logger.info('New verification code sent successfully', { email: user.email, userId: user.id });

    return NextResponse.json({
      success: true,
      message: `קוד אימות חדש נשלח לכתובת ${user.email}.`,
    }, { status: 200 });

  } catch (error: unknown) {
    const emailForLog = requestBody?.email;
    const errorDetails = error instanceof Error ? { name: error.name, message: error.message } : { message: String(error) };
    logger.error('Failed to resend verification code', { email: emailForLog, error: errorDetails, timestamp: new Date().toISOString() });

    let errorMessage = 'אירעה שגיאה בשליחה חוזרת של הקוד.';
    let errorStatus = 500;

    if (error instanceof Error) {
        if (error.message === 'אירעה שגיאה ביצירת קוד אימות') {
            errorMessage = error.message; // השתמש בהודעה הספציפית מהשירות
        }
        // אפשר להוסיף טיפול בשגיאות ספציפיות אחרות משירות המייל למשל
    }
    

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: errorStatus }
    );
  } finally {
    await prisma.$disconnect();
    logger.info('Database connection closed for resend-verification-code');
  }
}