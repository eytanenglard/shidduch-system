import { NextResponse } from 'next/server';
import { PrismaClient, UserRole, Gender, UserStatus, Prisma, VerificationType } from '@prisma/client';
import { hash } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { emailService } from '@/lib/email/emailService';

const prisma = new PrismaClient();

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
  phone?: string;
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
  console.log('Starting registration process...');
  
  try {
    console.log('Checking database connection...');
    await prisma.$connect();
    console.log('Database connection successful');
    const body: RegistrationData = await req.json();
    console.log('Registration data received:', {
      ...body,
      password: '[REDACTED]'
    });

    if (body.invitationToken) {
      const invitation = await prisma.invitation.findUnique({
        where: { token: body.invitationToken }
      });

      if (!invitation) throw new Error("קישור ההזמנה אינו תקין");
      if (invitation.expires < new Date()) throw new Error("קישור ההזמנה פג תוקף");
      if (invitation.status !== "PENDING") throw new Error("ההזמנה כבר נוצלה או בוטלה");
    }

    if (!body.email || !body.password || !body.firstName || !body.lastName || !body.gender || !body.birthDate) {
      throw new Error('חסרים פרטים חובה');
    }

    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(body.email)) {
      throw new Error('כתובת אימייל לא תקינה');
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!passwordRegex.test(body.password)) {
      throw new Error('הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה ומספר');
    }

    const birthDateObj = new Date(body.birthDate);
    const age = Math.floor((new Date().getTime() - birthDateObj.getTime()) / 31557600000);
    if (age < 18) {
      throw new Error('גיל מינימלי להרשמה הוא 18');
    }

    const hashedPassword = await hash(body.password, 12);
    
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: body.email,
          password: hashedPassword,
          firstName: body.firstName,
          lastName: body.lastName,
          role: UserRole.CANDIDATE,
          status: UserStatus.PENDING,
          isVerified: false,
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

      if (body.invitationToken) {
        await tx.invitation.update({
          where: { token: body.invitationToken },
          data: {
            status: "ACCEPTED",
            userId: user.id
          }
        });
      }

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

    try {
      await emailService.sendWelcomeEmail({
        email: result.user.email,
        firstName: result.user.firstName,
        requiresVerification: true,
        dashboardUrl: '/profile',
        supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
        privacyNote: true
      });

      await emailService.sendVerificationEmail({
        email: result.user.email,
        verificationLink: result.verification.token,
        firstName: result.user.firstName,
        expiresIn: '24 שעות'
      });
    } catch (error) {
      console.error('Failed to send welcome/verification emails:', error);
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

    console.error('Registration error:', errorDetails);
    
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
  }
}