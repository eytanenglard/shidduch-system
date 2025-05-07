// app/api/auth/register/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient, UserRole, UserStatus, Prisma, VerificationType } from '@prisma/client';
import { hash } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { emailService } from '@/lib/email/emailService'; // ודא שהנתיב נכון

// הסר ייבוא של דברים שלא נחוצים בשלב זה (כמו sendOtpViaWhatsApp, Gender, generateOtp)
// import { Gender } from '@prisma/client';
// import { generateOtp, sendOtpViaWhatsApp } from '@/lib/phoneVerificationService';

const prisma = new PrismaClient();

// הגדרת logger נשארת זהה
type LogMetadata = {
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  token?: string;
  expiry?: Date;
  status?: string;
  error?: unknown;
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
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      ...meta
    }));
  }
};

// Interface מצומצם לקלט הראשוני
interface InitialRegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// Updated error handler - התאם את הודעות השגיאה בהתאם לשדות הקיימים
function handleError(error: unknown): { message: string; status: number } {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          const target = error.meta?.target as string[] | undefined;
          if (target?.includes('email')) {
            return { message: 'משתמש עם כתובת אימייל זו כבר קיים במערכת', status: 409 };
          }
          // הסר בדיקה של P2002 עבור טלפון, כי הוא לא נשלח בשלב זה
          return { message: 'משתמש עם פרטים אלה כבר קיים במערכת', status: 409 };
        case 'P2014': return { message: 'שגיאה בנתונים שהוזנו', status: 400 };
        default: return { message: 'שגיאה בשמירת הנתונים', status: 500 };
      }
    }
    if (error instanceof Error) {
      // עדכן את רשימת הודעות השגיאה הצפויות
       if (['חסרים פרטים חובה', 'כתובת אימייל לא תקינה', 'הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה ומספר'].includes(error.message)) {
           return { message: error.message, status: 400 };
       }
      return { message: error.message, status: 400 }; // Default to 400 for other errors
    }
    return { message: 'אירעה שגיאה בלתי צפויה', status: 500 };
  }

// --- Main POST Handler ---
export async function POST(req: Request) {
  logger.info('Initial registration process initiated');

  try {
    logger.info('Attempting database connection');
    await prisma.$connect();
    logger.info('Database connection established');

    const body: InitialRegistrationData = await req.json();
    logger.info('Initial registration data received', {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      hasPassword: !!body.password // בדוק אם סיסמה קיימת
    });

    // --- Input Validation ---
    // בדוק רק את השדות הנשלחים בשלב זה
    if (!body.email || !body.password || !body.firstName || !body.lastName) {
        logger.error('Missing required fields for initial registration', { /* log individual fields */ });
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

    // הסר ולידציות שלא רלוונטיות לשלב זה (גיל, טלפון)
    // --- End Input Validation ---


    // --- Check for existing email (שמור על הבדיקה הזו) ---
    const existingUser = await prisma.user.findUnique({
        where: { email: body.email },
    });
    if (existingUser) {
        // שקול האם להחזיר שגיאה או לאפשר 'upsert' אם המשתמש התחיל ולא סיים
        // כרגע, נחזיר שגיאה כדי למנוע דריסה לא מכוונת
        logger.error('Email already exists', { email: body.email });
        throw new Error('משתמש עם כתובת אימייל זו כבר קיים במערכת');
    }
    // --- End Email Check ---


    // --- Prepare data ---
    logger.info('Starting password hashing');
    const hashedPassword = await hash(body.password, 12);
    logger.info('Password hashed successfully');

    // הסר יצירת OTP לטלפון בשלב זה
    // const otpCode = generateOtp();
    // const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const emailVerificationToken = randomBytes(32).toString('hex'); // Generate email token
    const emailTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Email token expires in 24 hours
    // --- End Prepare data ---


    // --- Database Transaction ---
    logger.info('Starting database transaction for initial user creation');
    const result = await prisma.$transaction(async (tx) => {
      // Create the user record - אין צורך ב-upsert אם בדקנו למעלה שהאימייל לא קיים
      const user = await tx.user.create({
          data: {
            email: body.email,
            password: hashedPassword,
            firstName: body.firstName,
            lastName: body.lastName,
            role: UserRole.CANDIDATE,
            // סטטוסים התחלתיים:
            status: UserStatus.PENDING_EMAIL_VERIFICATION, // או סטטוס מתאים אחר
            isVerified: false, // Email not verified yet
            isProfileComplete: false, // Profile not complete
            isPhoneVerified: false, // Phone not verified
            // לא מוסיפים profile או phone בשלב זה
          },
      });

      logger.info('User created successfully', { userId: user.id });

      // Delete previous *pending* EMAIL verification records for this user (אם רוצים למנוע טוקנים כפולים)
      await tx.verification.deleteMany({
          where: {
              userId: user.id,
              status: 'PENDING',
              type: VerificationType.EMAIL
          }
      });
      logger.info('Deleted previous pending email verification records', { userId: user.id });

      // Create *new* email verification record
      const emailVerification = await tx.verification.create({
          data: {
              userId: user.id,
              type: VerificationType.EMAIL,
              target: user.email, // Store the email
              token: emailVerificationToken, // Store the email token
              expiresAt: emailTokenExpiresAt,
              status: 'PENDING',
          }
      });
      logger.info('Email verification record created', { verificationId: emailVerification.id });

      // הסר יצירת רשומת אימות לטלפון
      // const phoneVerification = await tx.verification.create(...)

      // Return user and email verification token needed for the email link
      return { user, emailVerificationToken };
    });

    logger.info('Database transaction completed successfully', { userId: result.user.id });
    // --- End Database Transaction ---


    // --- Send Email Notification ---
    // הסר שליחת OTP לוואטסאפ
    let emailSentSuccess = false;
    try {
      logger.info('Sending verification email', { userId: result.user.id, email: result.user.email });
      await emailService.sendVerificationEmail({
        email: result.user.email,
        // ודא שהשם 'verificationLink' מתאים למה שהפונקציה מצפה לו (אולי זה צריך להיות הטוקן עצמו?)
        // אם הפונקציה בונה את הלינק, שלח לה את הטוקן
        verificationLink: `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${result.emailVerificationToken}`, // בנה את הלינק המלא
        firstName: result.user.firstName,
        expiresIn: '24 שעות'
      });
      emailSentSuccess = true;
      logger.info('Verification email sent successfully', { userId: result.user.id });
    } catch (error) {
      logger.error('Failed to send verification email', {
        error: error instanceof Error ? error.message : String(error),
        userId: result.user.id
      });
      // חשוב: אם שליחת המייל נכשלת, תהליך ההרשמה נתקע.
      // אולי כדאי להחזיר שגיאה 500 אם המייל הוא קריטי.
      // לחילופין, לאפשר למשתמש לבקש שליחה מחדש בדף האימות.
      // כרגע נמשיך ונחזיר הצלחה, אך עם הודעה מתאימה.
    }
    // --- End Send Email Notification ---


    // --- Prepare Response ---
    let message = 'החשבון נוצר בהצלחה. ';
    if (emailSentSuccess) {
        message += 'נשלח מייל לאימות כתובת הדוא"ל שלך. אנא בדוק את תיבת הדואר ולחץ על הקישור.';
    } else {
        message += 'הייתה בעיה בשליחת מייל האימות. אנא נסה שוב מאוחר יותר או פנה לתמיכה.';
    }

    logger.info('Initial registration API call completed, user needs to verify email', { userId: result.user.id });
    // החזר רק הודעה, אין צורך ב-userId או דגלים נוספים לקליינט בשלב זה
    return NextResponse.json(
      {
        success: true,
        message: message,
      },
      { status: 201 } // 201 Created
    );
    // --- End Prepare Response ---

  } catch (error: unknown) { // Catch error as unknown
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
    } : { message: String(error) };

    logger.error('Initial registration failed', {
      error: errorDetails,
      timestamp: new Date().toISOString()
    });

    const { message, status } = handleError(error); // Use updated error handler

    return NextResponse.json(
      {
        success: false,
        error: message,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status }
    );
  } finally {
    await prisma.$disconnect();
    logger.info('Database connection closed');
  }
}