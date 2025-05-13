// app/api/auth/verify-email-code/route.ts

import { NextResponse } from 'next/server';
import { VerificationService } from '@/lib/services/verificationService';
import { VerificationType, PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

type LogMetadata = {
  email?: string;
  code?: string; 
  codePresent?: boolean;
  codeLength?: number;
  error?: unknown;
  timestamp?: string;
  verificationId?: string;
  userId?: string; // userId כאן יכול להיות string או undefined אם הוא לא קיים במטאדאטה
  authTokenGenerated?: boolean;
};

const logger = {
  info: (message: string, meta?: LogMetadata) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      ...meta
    }));
  },
  error: (message: string, meta?: LogMetadata) => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      ...meta
    }));
  }
};

interface VerifyEmailCodeRequest {
  email: string;
  code: string;
}

export async function POST(req: Request) {
  let requestBody: VerifyEmailCodeRequest | null = null;
  try {
    requestBody = await req.json();
    const { email, code } = requestBody!;

    logger.info('Email code verification process initiated', { email });

    if (!email || !code) {
      logger.error('Missing email or code for verification', { email: email, codePresent: !!code });
      return NextResponse.json({ success: false, error: 'חסרים פרטי אימייל או קוד.' }, { status: 400 });
    }
    
    const OTP_LENGTH_FROM_SERVICE = 6;
    if (code.length !== OTP_LENGTH_FROM_SERVICE || !/^\d+$/.test(code)) {
        logger.error('Invalid code format', { email, code });
        return NextResponse.json({ success: false, error: `פורמט קוד לא תקין. הקוד צריך להכיל ${OTP_LENGTH_FROM_SERVICE} ספרות.` }, { status: 400 });
    }

    logger.info('Attempting to verify email code', { email, codeLength: code.length });

    const verificationResult = await VerificationService.verifyCode(code, VerificationType.EMAIL, email.toLowerCase());
    
    // --- התיקון מתחיל כאן ---
    // וודא ש-userId קיים והוא מחרוזת לפני שנמשיך
    // סביר להניח ש-verificationResult.userId יכול להיות string | null
    // על פי ההגדרה של VerificationService.verifyCode
    if (!verificationResult.userId) {
      logger.error(
        'User ID is missing from verification result after successful code verification.', 
        { 
          email, 
          verificationId: verificationResult.id 
        }
      );
      // זרוק שגיאה שתטופל בלוק ה-catch הכללי, או טפל בה באופן ספציפי יותר
      // שגיאה זו מצביעה על בעיה לוגית פנימית אם הקוד אומת אך אין משתמש משויך
      throw new Error('שגיאה פנימית: לא נמצא משתמש משויך לאימות לאחר אימות קוד מוצלח.');
    }
    
    // כעת, לאחר הבדיקה, TypeScript יכול להסיק (או שנוכל להצהיר במפורש)
    // ש-userId הוא string.
    const userId: string = verificationResult.userId; 
    // --- סוף התיקון ---

    logger.info('Email code verified successfully, user isVerified updated.', { email, verificationId: verificationResult.id, userId });

    const oneTimeTokenValue = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.oneTimeAuthToken.create({
      data: {
        token: oneTimeTokenValue,
        userId: userId, // כאן userId מובטח להיות string
        expiresAt: expiresAt,
      }
    });
    logger.info('OneTimeAuthToken created successfully for auto-login', { userId, authTokenGenerated: true });

    return NextResponse.json({
      success: true,
      message: 'כתובת האימייל אומתה בהצלחה! מתבצעת התחברות אוטומטית...',
      authToken: oneTimeTokenValue
    }, { status: 200 });

  } catch (error: unknown) {
    const emailForLog = requestBody?.email;
    const errorDetails = error instanceof Error ? { name: error.name, message: error.message } : { message: String(error) };
    logger.error('Email code verification or token generation failed', { email: emailForLog, error: errorDetails, timestamp: new Date().toISOString() });

    let errorMessage = 'אירעה שגיאה באימות הקוד.';
    let errorStatus = 500;

    if (error instanceof Error) {
      const knownClientErrors = [
        'הקוד כבר נוצל.', 
        'תוקף הקוד פג. אנא בקש קוד חדש.', 
        'קוד אימות לא תקין או שלא קיימת בקשת אימות פעילה.', 
        'קוד אימות שגוי.'
      ];
      if (knownClientErrors.includes(error.message)) {
        errorMessage = error.message;
        errorStatus = 400; 
      } else if (error.message === 'שגיאה פנימית: לא נמצא משתמש משויך לאימות.' || 
                 error.message === 'שגיאה פנימית: לא נמצא משתמש משויך לאימות לאחר אימות קוד מוצלח.') { // הוספת השגיאה החדשה אם רוצים טיפול מיוחד
        errorMessage = 'אירעה שגיאה פנימית. אנא נסה שנית מאוחר יותר.';
        // errorStatus נשאר 500 כברירת מחדל לשגיאות פנימיות, או שתשנה לפי הצורך
      }
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
    await prisma.$disconnect().catch(e => console.error("Failed to disconnect Prisma in verify-email-code API", e));
  }
}