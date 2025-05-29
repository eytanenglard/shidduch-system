// app/api/auth/register/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient, UserRole, UserStatus, Prisma, VerificationType, UserSource  } from '@prisma/client';
import { hash } from 'bcryptjs';
import { emailService } from '@/lib/email/emailService';
import { VerificationService } from '@/lib/services/verificationService'; 

const prisma = new PrismaClient();

// עדכון LogMetadata סופי ומלא
type LogMetadata = {
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  status?: string;
  errorObject?: unknown;     // לשמירת אובייקט השגיאה המקורי
  errorMessage?: string;     // הודעת השגיאה כטקסט
  errorName?: string;        // error.name
  errorCode?: string;        // error.code (למשל, שגיאות Prisma)
  errorMeta?: unknown;       // error.meta (למשל, שגיאות Prisma)
  errorStack?: string;       // error.stack
  errorContext?: string;     // להוספת הקשר לשגיאה (למשל, "Main catch block", "Inside handleError")
  timestamp?: string;
  hasEmail?: boolean;
  hasPassword?: boolean;
  hasFirstName?: boolean;
  hasLastName?: boolean;
  verificationId?: string;
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
    // נוודא ש-errorObject לא נשלח ישירות אם הוא מכיל מידע רגיש או גדול מדי בצורה לא מבוקרת.
    // לרוב, המאפיינים שחילצנו (errorMessage, errorName וכו') מספיקים ללוג.
    const loggableMeta = { ...meta };
    if (loggableMeta.errorObject && process.env.NODE_ENV !== 'development') {
        // בסביבת פרודקשן, אולי נרצה להסיר את האובייקט המלא אם הוא לא טופל כראוי
        // delete loggableMeta.errorObject; 
        // או להשאיר רק חלקים נבחרים ממנו. כרגע נשאיר אותו.
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
}

function handleError(error: unknown): { message: string; status: number } {
    const logMeta: LogMetadata = { 
        errorContext: "Inside handleError before processing",
        timestamp: new Date().toISOString(),
        errorObject: error // שמירת האובייקט המקורי
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
        // טיפול במקרים שבהם error הוא אובייקט עם שדה code אך אינו PrismaClientKnownRequestError
        logMeta.errorCode = String((error as { code: unknown }).code);
    }
    
    logger.error("Error received in handleError", logMeta);


    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002': 
          const target = error.meta?.target as string[] | undefined;
          if (target?.includes('email')) {
            return { message: 'משתמש עם כתובת אימייל זו כבר קיים במערכת.', status: 409 };
          }
          return { message: `משתמש עם פרטים אלה כבר קיים במערכת (קוד ${error.code}).`, status: 409 };
        case 'P2003': 
            const fieldName = error.meta?.field_name as string | undefined;
            return { message: `שגיאת תלות בנתונים (שדה: ${fieldName || 'לא ידוע'}). אנא נסה שנית.`, status: 500};
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
       // אם השגיאה הגיעה מ-VerificationService.createVerification, היא תהיה Error instance
       // וההודעה שלה תהיה השגיאה המקורית מ-Prisma או הודעה מותאמת אישית מהשירות.
       // כאן אנחנו נותנים להודעה המקורית לעבור, או שיש טיפול ספציפי אם ההודעה ידועה.
       if (error.message.includes('אירעה שגיאה ביצירת קוד אימות') || 
           (error.cause instanceof Prisma.PrismaClientKnownRequestError && error.cause.code === 'P2003')) {
            // אם השגיאה המקורית היא P2003 (מ-cause), החזר הודעה מתאימה
            return { message: 'אירעה שגיאה ביצירת רשומת האימות עקב בעיית תלות. אנא נסה שנית.', status: 500 };
       }
      return { message: error.message, status: 400 }; 
    }
    return { message: 'אירעה שגיאה בלתי צפויה.', status: 500 };
  }


export async function POST(req: Request) {
  logger.info('Initial registration process initiated');

  try {
    const body: InitialRegistrationData = await req.json();
    logger.info('Initial registration data received', {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      hasPassword: !!body.password
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
            role: UserRole.CANDIDATE,
            status: UserStatus.PENDING_EMAIL_VERIFICATION,
            isVerified: false, 
            isProfileComplete: false, 
            isPhoneVerified: false, 
              source: UserSource.REGISTRATION,
               termsAndPrivacyAcceptedAt: new Date(), 
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
    const emailOtpExpiryText = "שעה אחת"; 

    try {
      logger.info('Sending verification OTP email', { userId: result.user.id, email: result.user.email });
      await emailService.sendVerificationEmail({
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
    // בניית אובייקט הלוג בצורה מבוקרת
    const logMetaForCatch: LogMetadata = { 
        errorContext: "Main catch block in POST /api/auth/register",
        timestamp: new Date().toISOString(),
        errorObject: error // שמור את האובייקט המקורי
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

    const { message, status } = handleError(error); // handleError יבצע לוגינג משלו גם כן

    // בניית details עבור תגובת השגיאה לקליינט
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