import { NextResponse } from 'next/server';
import { PrismaClient, UserRole, Gender, UserStatus, Prisma, VerificationType } from '@prisma/client';
import { hash } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { emailService } from '@/lib/email/emailService';

const prisma = new PrismaClient();

// Define types for logging metadata
type LogMetadata = {
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  hasInvitation?: boolean;
  phone?: string; // הוספת שדה phone
  token?: string;
  expiry?: Date;
  status?: string;
  age?: number;
  error?: unknown;
  timestamp?: string;
  hasEmail?: boolean;
  hasPassword?: boolean;
  hasFirstName?: boolean;
  hasLastName?: boolean;
  hasGender?: boolean;
  hasBirthDate?: boolean;
};

// Custom logger for structured logging
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

interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: string;
  maritalStatus?: string;
  height?: number;
  occupation?: string;
  education?: string;
  invitationToken?: string;
  phone: string;
}

function handleError(error: unknown): { message: string; status: number } {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': return { message: 'משתמש עם פרטים אלה כבר קיים במערכת', status: 409 };
      case 'P2014': return { message: 'שגיאה בנתונים שהוזנו', status: 400 };
      default: return { message: 'שגיאה בשמירת הנתונים', status: 500 };
    }
  } 
  
  if (error instanceof Error) {
    return { message: error.message, status: 400 };
  }

  return { message: 'אירעה שגיאה בלתי צפויה', status: 500 };
}

export async function POST(req: Request) {
  logger.info('Registration process initiated');
  
  try {
    logger.info('Attempting database connection');
    await prisma.$connect();
    logger.info('Database connection established');
    
    const body: RegistrationData = await req.json();
    logger.info('Registration data received', {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      hasInvitation: !!body.invitationToken
    });

    if (body.invitationToken) {
      logger.info('Validating invitation token', { token: body.invitationToken });
      const invitation = await prisma.invitation.findUnique({
        where: { token: body.invitationToken }
      });

      if (!invitation) {
        logger.error('Invalid invitation token', { token: body.invitationToken });
        throw new Error("קישור ההזמנה אינו תקין");
      }
      if (invitation.expires < new Date()) {
        logger.error('Expired invitation token', { token: body.invitationToken, expiry: invitation.expires });
        throw new Error("קישור ההזמנה פג תוקף");
      }
      if (invitation.status !== "PENDING") {
        logger.error('Invalid invitation status', { token: body.invitationToken, status: invitation.status });
        throw new Error("ההזמנה כבר נוצלה או בוטלה");
      }
      
      logger.info('Invitation token validated successfully');
    }

    if (!body.email || !body.password || !body.firstName || !body.lastName || !body.gender || !body.birthDate) {
      logger.error('Missing required fields', {
        hasEmail: !!body.email,
        hasPassword: !!body.password,
        hasFirstName: !!body.firstName,
        hasLastName: !!body.lastName,
        hasGender: !!body.gender,
        hasBirthDate: !!body.birthDate
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

    const birthDateObj = new Date(body.birthDate);
    const age = Math.floor((new Date().getTime() - birthDateObj.getTime()) / 31557600000);
    if (age < 18) {
      logger.error('User age below minimum', { age });
      throw new Error('גיל מינימלי להרשמה הוא 18');
    }

    // בדיקת מספר טלפון
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(body.phone)) {
      logger.error('Invalid phone number format', { phone: body.phone });
      throw new Error('מספר טלפון לא תקין');
    }
    
    // בדיקת כפילות טלפון
    const existingPhone = await prisma.user.findUnique({
      where: { phone: body.phone }
    });
    
    if (existingPhone) {
      logger.error('Phone number already exists', { phone: body.phone });
      throw new Error('מספר הטלפון כבר רשום במערכת');
    }

    logger.info('Starting password hashing');
    const hashedPassword = await hash(body.password, 12);
    logger.info('Password hashed successfully');
    
    logger.info('Starting database transaction');
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: body.email,
          password: hashedPassword,
          phone: body.phone,
          firstName: body.firstName,
          lastName: body.lastName,
          role: UserRole.CANDIDATE,
          status: UserStatus.PENDING,
          isVerified: false,
          isProfileComplete: true, // שינוי: אנחנו מסמנים את הפרופיל כהושלם מכיוון שקיבלנו את כל המידע
          profile: {
            create: {
              gender: body.gender,
              birthDate: birthDateObj,
              maritalStatus: body.maritalStatus || null,
              height: body.height || null,
              occupation: body.occupation || null,
              education: body.education || null,
              isProfileVisible: true
            }
          }
        }
      });

      logger.info('User created successfully', { userId: user.id });

      if (body.invitationToken) {
        logger.info('Updating invitation status', { token: body.invitationToken, userId: user.id });
        await tx.invitation.update({
          where: { token: body.invitationToken },
          data: {
            status: "ACCEPTED",
            userId: user.id
          }
        });
      }

      logger.info('Creating email verification token', { userId: user.id });
      const verification = await tx.verification.create({
        data: {
          userId: user.id,
          type: VerificationType.EMAIL,
          token: randomBytes(32).toString('hex'),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: 'PENDING',
          attempts: 0
        }
      });

      return { user, verification };
    });

    logger.info('Database transaction completed successfully', { userId: result.user.id });

    try {
      logger.info('Sending welcome email', { userId: result.user.id });
      await emailService.sendWelcomeEmail({
        email: result.user.email,
        firstName: result.user.firstName,
        requiresVerification: true,
        dashboardUrl: '/profile',
        supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
        privacyNote: true
      });

      logger.info('Sending verification email', { userId: result.user.id });
      await emailService.sendVerificationEmail({
        email: result.user.email,
        verificationLink: result.verification.token,
        firstName: result.user.firstName,
        expiresIn: '24 שעות'
      });

      logger.info('All emails sent successfully', { userId: result.user.id });
    } catch (error) {
      logger.error('Failed to send welcome/verification emails', {
        error: error instanceof Error ? error.message : String(error),
        userId: result.user.id
      });
      
      return NextResponse.json(
        {
          success: true,
          message: 'ההרשמה הושלמה בהצלחה, אך היתה בעיה בשליחת המייל. נא ליצור קשר עם התמיכה.',
          userId: result.user.id,
          requiresVerification: true
        },
        { status: 201 }
      );
    }

    logger.info('Registration completed successfully', { userId: result.user.id });
    return NextResponse.json(
      {
        success: true,
        message: 'ההרשמה הושלמה בהצלחה. נשלח אליך מייל לאימות החשבון',
        userId: result.user.id,
        requiresVerification: true
      },
      { status: 201 }
    );
    
  } catch (error) {
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    } : { message: String(error) };

    logger.error('Registration failed', {
      error: errorDetails,
      timestamp: new Date().toISOString()
    });
    
    const { message, status } = handleError(error);
    
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