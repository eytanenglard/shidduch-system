// app/api/auth/register/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, UserRole, UserStatus, Prisma, VerificationType, UserSource, Language } from '@prisma/client';
import { hash } from 'bcryptjs';
import { emailService } from '@/lib/email/emailService';
import { VerificationService } from '@/lib/services/verificationService'; 
import { applyRateLimit } from '@/lib/rate-limiter';

const prisma = new PrismaClient();

type LogMetadata = {
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  status?: string;
  errorObject?: unknown;
  errorMessage?: string;
  errorName?: string;
  errorCode?: string;
  errorMeta?: unknown;
  errorStack?: string;
  errorContext?: string;
  timestamp?: string;
  hasEmail?: boolean;
  hasPassword?: boolean;
  hasFirstName?: boolean;
  hasLastName?: boolean;
  verificationId?: string;
  marketingConsent?: boolean;
   language?: 'he' | 'en';
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
    const loggableMeta = { ...meta };
    if (loggableMeta.errorObject && process.env.NODE_ENV !== 'development') {
        // In production, we might want to remove the full object if not handled properly.
    }
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      ...loggableMeta
    }));
  }
};

interface InitialRegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  marketingConsent?: boolean;
  language?: Language;
}

function handleError(error: unknown): { message: string; status: number } {
    const logMeta: LogMetadata = { 
        errorContext: "Inside handleError before processing",
        timestamp: new Date().toISOString(),
        errorObject: error
    };

    if (error instanceof Error) {
        logMeta.errorName = error.name;
        logMeta.errorMessage = error.message;
        if (process.env.NODE_ENV === 'development') {
            logMeta.errorStack = error.stack;
        }
    } else {
        logMeta.errorMessage = String(error);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        logMeta.errorCode = error.code;
        logMeta.errorMeta = error.meta;
    } else if (typeof error === 'object' && error !== null && 'code' in error) {
        logMeta.errorCode = String((error as { code: unknown }).code);
    }
    
    logger.error("Error received in handleError", logMeta);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002': {
          const target = error.meta?.target as string[] | undefined;
          if (target?.includes('email')) {
            return { message: 'משתמש עם כתובת אימייל זו כבר קיים במערכת.', status: 409 };
          }
          return { message: `משתמש עם פרטים אלה כבר קיים במערכת (קוד ${error.code}).`, status: 409 };
        }
        case 'P2003': {
            const fieldName = error.meta?.field_name as string | undefined;
            return { message: `שגיאת תלות בנתונים (שדה: ${fieldName || 'לא ידוע'}). אנא נסה שנית.`, status: 500};
        }
        case 'P2014': return { message: 'שגיאה בנתונים שהוזנו.', status: 400 };
        default: 
            return { message: `שגיאה בשמירת הנתונים (קוד שגיאת DB: ${error.code}).`, status: 500 };
      }
    }
    if (error instanceof Error) {
       if (error.message === 'משתמש עם כתובת אימייל זו כבר קיים במערכת.') {
           return { message: error.message, status: 409 };
       }
       if (['חסרים פרטים חובה', 'כתובת אימייל לא תקינה', 'הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה ומספר'].includes(error.message)) {
           return { message: error.message, status: 400 };
       }
       if (error.message.includes('אירעה שגיאה ביצירת קוד אימות') || 
           (error.cause instanceof Prisma.PrismaClientKnownRequestError && error.cause.code === 'P2003')) {
            return { message: 'אירעה שגיאה ביצירת רשומת האימות עקב בעיית תלות. אנא נסה שנית.', status: 500 };
       }
      return { message: error.message, status: 400 }; 
    }
    return { message: 'אירעה שגיאה בלתי צפויה.', status: 500 };
}


export async function POST(req: NextRequest) {
    const rateLimitResponse = await applyRateLimit(req, { requests: 10, window: '1 h' });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  logger.info('Initial registration process initiated');

 const url = new URL(req.url);
    const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'he'; // ברירת מחדל לעברית
  try {
    const body: InitialRegistrationData = await req.json();
    logger.info('Initial registration data received', {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      hasPassword: !!body.password,
      marketingConsent: body.marketingConsent,
      language: body.language,
    });

    if (!body.email || !body.password || !body.firstName || !body.lastName) {
        logger.error('Missing required fields for initial registration', { 
            hasEmail: !!body.email, 
            hasPassword: !!body.password, 
            hasFirstName: !!body.firstName, 
            hasLastName: !!body.lastName 
        });
        throw new Error('חסרים פרטים חובה');
    }

    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(body.email)) {
      logger.error('Invalid email format', { email: body.email });
      throw new Error('כתובת אימייל לא תקינה');
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!passwordRegex.test(body.password)) {
      logger.error('Invalid password format');
      throw new Error('הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה ומספר');
    }
    
    const normalizedEmail = body.email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail }, 
    });
    if (existingUser) {
        logger.error('Email already exists in database', { email: normalizedEmail });
        throw new Error('משתמש עם כתובת אימייל זו כבר קיים במערכת.');
    }
    
    logger.info('Starting password hashing');
    const hashedPassword = await hash(body.password, 12);
    logger.info('Password hashed successfully');

    logger.info('Starting database transaction for initial user creation');
    
    const result = await prisma.$transaction(async (tx) => { 
      const user = await tx.user.create({
          data: {
            email: normalizedEmail, 
            password: hashedPassword,
            firstName: body.firstName,
            lastName: body.lastName,
            language: body.language || 'he',
            role: UserRole.CANDIDATE,
            status: UserStatus.PENDING_EMAIL_VERIFICATION,
            isVerified: false, 
            isProfileComplete: false, 
            isPhoneVerified: false, 
            source: UserSource.REGISTRATION,
            termsAndPrivacyAcceptedAt: new Date(),
            marketingConsent: body.marketingConsent || false,
          },
      });
      logger.info('User created successfully within transaction', { userId: user.id });

      const expiresInHoursForOtp = 1;
      const { verification: emailVerificationRecord, otp: generatedOtp } = await VerificationService.createVerification(
        user.id,
        VerificationType.EMAIL,
        user.email, 
        expiresInHoursForOtp,
        tx 
      );
      logger.info('Email verification record and OTP created within transaction', { verificationId: emailVerificationRecord.id, userId: user.id });

      return { user, generatedOtp }; 
    });

    logger.info('Database transaction completed successfully', { userId: result.user.id });
    
    let emailSentSuccess = false;
    const emailOtpExpiryText = locale === 'he' ? "שעה אחת" : "1 hour"; 

    try {
      logger.info('Sending verification OTP email', { userId: result.user.id, email: result.user.email });
        await emailService.sendVerificationEmail({
                locale,
                email: result.user.email,
                verificationCode: result.generatedOtp, 
                firstName: result.user.firstName,
                expiresIn: emailOtpExpiryText 
            });
      emailSentSuccess = true;
      logger.info('Verification OTP email sent successfully', { userId: result.user.id });
    } catch (error) {
      const errorLogMeta: LogMetadata = { userId: result.user.id };
      if (error instanceof Error) {
        errorLogMeta.errorName = error.name;
        errorLogMeta.errorMessage = error.message;
        errorLogMeta.errorStack = error.stack;
      } else {
        errorLogMeta.errorMessage = String(error);
      }
      logger.error('Failed to send verification OTP email', errorLogMeta);
    }
    
    let responseMessage = 'החשבון נוצר בהצלחה. ';
    if (emailSentSuccess) {
        responseMessage += `נשלח קוד אימות לכתובת הדוא"ל שלך (${result.user.email}). אנא הזן את הקוד כדי להמשיך.`;
    } else {
        responseMessage += 'הייתה בעיה בשליחת קוד האימות. תוכל לבקש קוד חדש במסך הבא או לפנות לתמיכה.';
    }

    logger.info('Initial registration API call completed, user needs to verify email with OTP', { userId: result.user.id });
    return NextResponse.json(
      {
        success: true,
        message: responseMessage,
        email: result.user.email, 
        userId: result.user.id, 
      },
      { status: 201 }
    );

  } catch (error: unknown) { 
    const logMetaForCatch: LogMetadata = { 
        errorContext: "Main catch block in POST /api/auth/register",
        timestamp: new Date().toISOString(),
        errorObject: error
    };

    if (error instanceof Error) {
        logMetaForCatch.errorName = error.name;
        logMetaForCatch.errorMessage = error.message;
        if (process.env.NODE_ENV === 'development') {
            logMetaForCatch.errorStack = error.stack;
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            logMetaForCatch.errorCode = error.code;
            logMetaForCatch.errorMeta = error.meta;
        } else if (typeof error === 'object' && error !== null && 'code' in error) {
            logMetaForCatch.errorCode = String((error as { code: unknown }).code);
        }
    } else {
        logMetaForCatch.errorMessage = String(error);
    }
    
    logger.error('Initial registration failed', logMetaForCatch);

    const { message, status } = handleError(error);

    const responseErrorDetails = process.env.NODE_ENV === 'development' ? {
        name: logMetaForCatch.errorName,
        message: logMetaForCatch.errorMessage,
        code: logMetaForCatch.errorCode,
        meta: logMetaForCatch.errorMeta,
        stack: logMetaForCatch.errorStack
    } : undefined;

    return NextResponse.json(
      {
        success: false,
        error: message, 
        details: responseErrorDetails
      },
      { status }
    );
  } 
}