// src/app/api/auth/resend-verification-code/route.ts

import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { VerificationService } from '@/lib/services/verificationService';
import { emailService } from '@/lib/email/emailService';
import { VerificationType, UserStatus } from '@prisma/client';
import { applyRateLimit } from '@/lib/rate-limiter';

// הגדרת טיפוס למידע הנשמר בלוגים
type LogMetadata = {
  email?: string;
  error?: unknown;
  userId?: string;
  verificationId?: string;
  status?: UserStatus;
  isVerified?: boolean;
};

// אובייקט לוגר פשוט ועקבי
const logger = {
  info: (message: string, meta?: LogMetadata) => console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'info', message, ...meta })),
  warn: (message: string, meta?: LogMetadata) => console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: 'warn', message, ...meta })),
  error: (message: string, meta?: LogMetadata) => console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'error', message, ...meta })),
};

interface ResendCodeRequest {
  email: string;
}

export async function POST(req: NextRequest) {
  // 1. הגבלת קצב בקשות
  const rateLimitResponse = await applyRateLimit(req, { requests: 5, window: '1 h' });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  
  let requestBody: ResendCodeRequest | null = null;
  try {
    // 2. שליפת שפת הממשק מה-URL
    const url = new URL(req.url);
    const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'he';

    // 3. קריאת ואימות גוף הבקשה
    requestBody = await req.json();
    const { email } = requestBody!;

    logger.info('Resend verification code process initiated', { email });

    if (!email) {
      logger.error('Missing email for resending code');
      return NextResponse.json({ success: false, error: 'חסרה כתובת אימייל.' }, { status: 400 });
    }
    
    const normalizedEmail = email.toLowerCase();
    
    // 4. איתור המשתמש וולידציה
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      logger.warn('User not found for resending code', { email: normalizedEmail });
      return NextResponse.json({ success: false, error: 'משתמש עם כתובת אימייל זו אינו רשום.' }, { status: 404 });
    }

    if (user.isVerified || user.status !== UserStatus.PENDING_EMAIL_VERIFICATION) {
        logger.warn('User email already verified or not pending verification', { email: normalizedEmail, userId: user.id, status: user.status, isVerified: user.isVerified });
        return NextResponse.json({ success: false, error: 'כתובת האימייל כבר מאומתת או שאינה ממתינה לאימות.' }, { status: 400 });
    }
    
    // 5. יצירת קוד אימות חדש דרך השירות המרכזי
    const expiresInHoursForOtp = 1;
    const { otp: newOtp, verification: newVerificationRecord } = await VerificationService.createVerification(
      user.id,
      VerificationType.EMAIL,
      user.email,
      expiresInHoursForOtp
    );
    logger.info('New verification record created for resend', { verificationId: newVerificationRecord.id, userId: user.id });

    // 6. שליחת המייל עם הקוד החדש והשפה הנכונה
    const emailOtpExpiryText = locale === 'he' ? "שעה אחת" : "1 hour";
    await emailService.sendVerificationEmail({
      locale, // <<<<<<<<<<<< העברת ה-locale
      email: user.email,
      verificationCode: newOtp,
      firstName: user.firstName,
      expiresIn: emailOtpExpiryText,
    });

    logger.info('New verification code sent successfully', { email: user.email, userId: user.id });

    // 7. החזרת תשובת הצלחה
    return NextResponse.json({
      success: true,
      message: `קוד אימות חדש נשלח לכתובת ${user.email}.`,
    }, { status: 200 });

  } catch (error: unknown) {
    // 8. טיפול בשגיאות לא צפויות
    const emailForLog = requestBody?.email;
    const errorDetails = error instanceof Error ? { name: error.name, message: error.message } : { message: String(error) };
    logger.error('Failed to resend verification code', { email: emailForLog, error: errorDetails });

    let errorMessage = 'אירעה שגיאה בשליחה חוזרת של הקוד.';
    const errorStatus = 500;

    if (error instanceof Error && error.message.includes('אירעה שגיאה ביצירת קוד אימות')) {
        errorMessage = error.message;
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: errorStatus }
    );
  }
}