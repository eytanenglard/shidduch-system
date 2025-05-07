// app/api/auth/send-phone-code/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateOtp, sendOtpViaWhatsApp } from '@/lib/phoneVerificationService';
import { VerificationType } from '@prisma/client';

export async function POST() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        // 1. קבל את פרטי המשתמש מה-DB (בעיקר מספר הטלפון)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { phone: true, firstName: true }
        });

        if (!user || !user.phone) {
            console.error(`API send-phone-code: User ${userId} not found or phone number missing.`);
            // שגיאה זו לא אמורה לקרות אם המשתמש הגיע לכאן דרך השלמת פרופיל
            return NextResponse.json({ error: 'User phone number not found.' }, { status: 400 });
        }

        // 2. יצירת OTP חדש
        const otpCode = generateOtp();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 דקות תפוגה

        // 3. שמירת/עדכון רשומת האימות
        // מחק רשומות קודמות לאותו משתמש כדי למנוע בלבול
        await prisma.verification.deleteMany({
            where: {
                userId: userId,
                type: VerificationType.PHONE_WHATSAPP,
                status: 'PENDING'
            }
        });
        // צור רשומה חדשה
        await prisma.verification.create({
            data: {
                userId: userId,
                type: VerificationType.PHONE_WHATSAPP,
                target: user.phone,
                token: otpCode,
                expiresAt: otpExpiresAt,
                status: 'PENDING',
            }
        });
        console.log(`API send-phone-code: Verification record created/updated for user ${userId}`);

        // 4. שליחת ה-OTP בוואטסאפ
        const otpSent = await sendOtpViaWhatsApp(user.phone, otpCode, user.firstName);

        if (!otpSent) {
            console.error(`API send-phone-code: Failed to send OTP via WhatsApp for user ${userId}.`);
            // החזר שגיאה כדי שהקליינט יוכל להציג הודעה מתאימה
            return NextResponse.json({ error: 'Failed to send verification code via WhatsApp.' }, { status: 500 });
        }

        console.log(`API send-phone-code: OTP sent successfully via WhatsApp for user ${userId}`);
        return NextResponse.json({ message: 'Verification code sent successfully via WhatsApp.' }, { status: 200 });

    } catch (error) {
        console.error("API send-phone-code: An error occurred:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}