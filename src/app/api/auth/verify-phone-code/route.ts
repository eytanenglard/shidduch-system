// app/api/auth/verify-phone-code/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { VerificationType, UserStatus } from '@prisma/client';
import { z } from 'zod';

const verifyCodeSchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits").regex(/^\d+$/, "Invalid code format"),
});

// Define Max Attempts
const MAX_VERIFICATION_ATTEMPTS = 5;

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const body = await req.json();
        const validation = verifyCodeSchema.safeParse(body);

        if (!validation.success) {
          return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
        }
        const { code } = validation.data;

        // 1. מצא את רשומת האימות הרלוונטית
        const verification = await prisma.verification.findFirst({
            where: {
                userId: userId,
                type: VerificationType.PHONE_WHATSAPP,
                status: 'PENDING',
            },
            orderBy: {
                createdAt: 'desc' // קח את הרשומה האחרונה
            }
        });

        if (!verification) {
            return NextResponse.json({ error: 'No pending verification found or already verified.' }, { status: 404 });
        }

        // 2. בדוק אם פג תוקף
        if (new Date() > verification.expiresAt) {
            // עדכן את סטטוס הרשומה ל-EXPIRED
            await prisma.verification.update({
                where: { id: verification.id },
                data: { status: 'EXPIRED' }
            });
            return NextResponse.json({ error: 'Verification code expired.' }, { status: 410 }); // 410 Gone
        }

        // 3. בדוק מספר ניסיונות
        if (verification.attempts >= MAX_VERIFICATION_ATTEMPTS) {
             // עדכן סטטוס ל-FAILED אם עבר את המגבלה
            await prisma.verification.update({
                where: { id: verification.id },
                data: { status: 'FAILED' }
            });
            return NextResponse.json({ error: 'Too many verification attempts.' }, { status: 429 }); // 429 Too Many Requests
        }

        // 4. השווה את הקודים
        if (verification.token !== code) {
            // עדכן מספר ניסיונות
            await prisma.verification.update({
                where: { id: verification.id },
                data: { attempts: { increment: 1 } }
            });
            const attemptsLeft = MAX_VERIFICATION_ATTEMPTS - (verification.attempts + 1);
            return NextResponse.json({ error: `Invalid verification code. ${attemptsLeft} attempts remaining.` }, { status: 400 });
        }

        // 5. אימות הצליח! עדכן את המשתמש ואת רשומת האימות
        const [, updatedUser] = await prisma.$transaction([
            prisma.verification.update({
                where: { id: verification.id },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                    attempts: verification.attempts + 1
                 }
            }),
            prisma.user.update({
                where: { id: userId },
                data: {
                    isPhoneVerified: true,
                    isProfileComplete: true, // לאחר אימות טלפון, הפרופיל נחשב שלם
                    status: UserStatus.ACTIVE, // הפוך את המשתמש לפעיל
                    updatedAt: new Date(),
                },
                select: { // החזר רק את המידע הנדרש לעדכון הסשן
                    id: true,
                    isPhoneVerified: true,
                    isProfileComplete: true,
                    status: true,
                 }
            })
        ]);

        console.log(`API verify-phone-code: Phone verified successfully for user ${userId}`);

        // החזר את פרטי המשתמש המעודכנים כדי שהקליינט יוכל לעדכן את הסשן
        return NextResponse.json({
             message: 'Phone number verified successfully!',
             user: updatedUser // מכיל isPhoneVerified, isProfileComplete, status
             }, { status: 200 });

    } catch (error) {
        console.error("API verify-phone-code: An error occurred:", error);
        if (error instanceof z.ZodError) { // Catch potential Zod errors during validation
            return NextResponse.json({ error: 'Invalid request data', details: error.flatten() }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}