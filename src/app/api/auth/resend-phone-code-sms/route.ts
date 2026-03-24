// app/api/auth/resend-phone-code-sms/route.ts
// SMS fallback for phone verification when WhatsApp delivery fails
import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from '@/lib/rate-limiter';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateOtp, sendOtpViaSms } from '@/lib/phoneVerificationService';
import { VerificationType } from '@prisma/client';

export async function POST(req: NextRequest) {
    const rateLimitResponse = await applyRateLimit(req, { requests: 3, window: '1 h' });
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        // Find pending phone verification
        const lastVerification = await prisma.verification.findFirst({
            where: {
                userId,
                type: VerificationType.PHONE_WHATSAPP,
                status: 'PENDING',
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!lastVerification) {
            return NextResponse.json(
                { error: 'לא נמצאה בקשת אימות פעילה.' },
                { status: 404 }
            );
        }

        // Rate limit: 60 seconds between requests
        const now = new Date();
        const timeSince = now.getTime() - lastVerification.createdAt.getTime();
        if (timeSince < 60 * 1000) {
            const timeLeft = Math.ceil((60 * 1000 - timeSince) / 1000);
            return NextResponse.json(
                { error: `אנא המתן ${timeLeft} שניות לפני בקשת קוד חדש.` },
                { status: 429 }
            );
        }

        // Get phone number
        let targetPhone = lastVerification.target;
        let userFirstName = session.user.firstName || '';

        if (!targetPhone) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { phone: true, firstName: true },
            });
            if (!user?.phone) {
                return NextResponse.json(
                    { error: 'לא ניתן לאתר את מספר הטלפון.' },
                    { status: 500 }
                );
            }
            targetPhone = user.phone;
            userFirstName = user.firstName || '';
        }

        // Generate new OTP
        const newOtpCode = generateOtp();
        const newOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Update verification record
        await prisma.verification.update({
            where: { id: lastVerification.id },
            data: {
                token: newOtpCode,
                expiresAt: newOtpExpiresAt,
                attempts: 0,
                createdAt: new Date(),
            },
        });

        // Send via SMS
        const smsSent = await sendOtpViaSms(targetPhone, newOtpCode, userFirstName);

        if (!smsSent) {
            console.error(`[resend-phone-code-sms] Failed to send SMS for user ${userId}`);
            return NextResponse.json(
                { error: 'שליחת קוד אימות ב-SMS נכשלה. אנא נסה שוב.' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: 'קוד אימות חדש נשלח ב-SMS.' },
            { status: 200 }
        );
    } catch (error) {
        console.error('[resend-phone-code-sms] Error:', error);
        return NextResponse.json(
            { error: 'אירעה שגיאה פנימית. נסה שוב מאוחר יותר.' },
            { status: 500 }
        );
    }
}
