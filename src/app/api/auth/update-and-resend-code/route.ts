// app/api/auth/update-and-resend-code/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateOtp, sendOtpViaWhatsApp } from '@/lib/phoneVerificationService';
import { VerificationType, Prisma } from '@prisma/client';
import { z } from 'zod';

const updatePhoneSchema = z.object({
  newPhone: z.string().refine(
    (phone) => /^\+[1-9]\d{1,14}$/.test(phone), 
    { message: "Invalid international phone number format (E.164 required)." }
  ),
});


export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const body = await req.json();
        const validation = updatePhoneSchema.safeParse(body);

        if (!validation.success) {
          return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
        }
        const { newPhone } = validation.data;

        // 1. בדוק שהמספר החדש לא תפוס על ידי משתמש מאומת אחר
        const existingVerifiedPhoneUser = await prisma.user.findFirst({
            where: {
              phone: newPhone,
              isPhoneVerified: true,
              id: { not: userId } // לא המשתמש הנוכחי
            }
          });

          if (existingVerifiedPhoneUser) {
            console.warn(`API update-and-resend: Attempt to update to phone ${newPhone} already verified by user ${existingVerifiedPhoneUser.id}`);
            return NextResponse.json({ error: 'מספר הטלפון כבר רשום ופעיל במערכת עבור משתמש אחר.' }, { status: 409 }); // Conflict
          }

        // 2. עדכן את מספר הטלפון של המשתמש
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { phone: newPhone },
            select: { firstName: true, phone: true } // קח את השם המעודכן אם צריך
        });
         console.log(`API update-and-resend: Updated phone number for user ${userId} to ${newPhone}`);


        // 3. צור OTP חדש
        const otpCode = generateOtp();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 דקות תפוגה

        // 4. צור/עדכן רשומת אימות עבור המספר החדש
        // בטל רשומות קודמות אם היו
         await prisma.verification.updateMany({
             where: {
                 userId: userId,
                 type: VerificationType.PHONE_WHATSAPP,
                 status: 'PENDING',
             },
             data: { status: 'EXPIRED' } // סמן קודמים כפגי תוקף
         });
         // צור רשומה חדשה
         await prisma.verification.create({
             data: {
                 userId: userId,
                 type: VerificationType.PHONE_WHATSAPP,
                 target: newPhone, // המספר החדש
                 token: otpCode,
                 expiresAt: otpExpiresAt,
                 status: 'PENDING',
             }
         });
         console.log(`API update-and-resend: Created new verification record for user ${userId} with new phone ${newPhone}`);

        // 5. שלח את ה-OTP למספר החדש
        const otpSent = await sendOtpViaWhatsApp(newPhone, otpCode, updatedUser.firstName);

        if (!otpSent) {
            console.error(`API update-and-resend: Failed to send OTP via WhatsApp to new phone ${newPhone} for user ${userId}.`);
            // החזר שגיאה, ייתכן שהמספר החדש לא תקין בוואטסאפ
            return NextResponse.json({ error: 'Failed to send verification code to the new phone number via WhatsApp. Please check the number.' }, { status: 500 });
        }

        console.log(`API update-and-resend: OTP sent successfully to new phone ${newPhone} for user ${userId}`);
        return NextResponse.json({ message: 'Phone number updated and new verification code sent successfully via WhatsApp.' }, { status: 200 });

    } catch (error: unknown) { // הגדרת error כ-unknown
        console.error("API update-and-resend: An error occurred:", error);

        // טיפול בשגיאות ספציפיות
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request data', details: error.flatten() }, { status: 400 });
        }
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
             // שגיאת כפילות - למרות שבדקנו, ייתכן מצב race condition
            return NextResponse.json({ error: 'מספר הטלפון כבר רשום במערכת.' }, { status: 409 });
        }

        // שגיאה כללית
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}