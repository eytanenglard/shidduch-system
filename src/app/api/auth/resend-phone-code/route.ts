// app/api/auth/resend-phone-code/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // Adjust path if needed
import prisma from '@/lib/prisma'; // Adjust path if needed
import { generateOtp, sendOtpViaWhatsApp } from '@/lib/phoneVerificationService'; // Adjust path if needed
import { VerificationType } from '@prisma/client'; // Import necessary enums/types

// --- Configuration ---
// How long (in seconds) the user must wait between resend requests
const RESEND_RATE_LIMIT_SECONDS = 60;

// --- Helper: Logger (optional but recommended) ---
const logger = {
    info: (message: string, meta?: Record<string, unknown> | object) => { // <-- שינוי הטיפוס
      console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'info', message, ...(meta || {}) }));
    },
    warn: (message: string, meta?: Record<string, unknown> | object) => { // <-- שינוי הטיפוס
      console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: 'warn', message, ...(meta || {}) }));
    },
    error: (message: string, meta?: Record<string, unknown> | object) => { // <-- שינוי הטיפוס
      // במקרה של שגיאה, נרצה אולי לטפל ב-meta בצורה שונה אם הוא אובייקט Error
      let logMeta = meta || {};
      if (meta instanceof Error) {
          // אם ה-meta הוא אובייקט Error, נרצה אולי לפרק אותו
          logMeta = { name: meta.name, message: meta.message, stack: meta.stack };
      }
      console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'error', message, ...logMeta }));
    },
  };
// --- End Helper ---


// --- Main POST Handler ---
export async function POST() {
    logger.info("Resend phone code request received");

    // 1. --- Authentication Check ---
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        logger.warn("Unauthorized attempt to resend code");
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    logger.info("User authenticated", { userId });
    // --- End Authentication Check ---

    try {
        // 2. --- Find Last Pending Verification ---
        const lastVerification = await prisma.verification.findFirst({
            where: {
                userId: userId,
                type: VerificationType.PHONE_WHATSAPP,
                status: 'PENDING', // Only find codes that haven't been used, expired, or failed
            },
            orderBy: {
                createdAt: 'desc' // Get the most recent one if multiple exist (shouldn't happen often with cleanup)
            }
        });

        if (!lastVerification) {
            logger.warn("No pending verification found to resend", { userId });
            // This could mean the user is already verified, the code expired and wasn't updated, etc.
            // Provide a generic message.
            return NextResponse.json({ error: 'לא נמצאה בקשת אימות פעילה. ייתכן שכבר אימתת את מספרך או שהקוד פג תוקף.' }, { status: 404 });
        }
        logger.info("Found pending verification record", { userId, verificationId: lastVerification.id });
        // --- End Find Last Pending Verification ---


        // 3. --- Rate Limiting Check ---
        const now = new Date();
        // Use 'createdAt' as the timestamp of the last *send attempt* for pending codes
        const timeSinceLastAttempt = now.getTime() - lastVerification.createdAt.getTime();

        if (timeSinceLastAttempt < RESEND_RATE_LIMIT_SECONDS * 1000) {
            const timeLeft = Math.ceil((RESEND_RATE_LIMIT_SECONDS * 1000 - timeSinceLastAttempt) / 1000);
            logger.warn("Resend rate limit hit", { userId, timeLeft });
            return NextResponse.json({ error: `אנא המתן ${timeLeft} שניות לפני בקשת קוד חדש.` }, { status: 429 }); // Too Many Requests
        }
        logger.info("Rate limit check passed", { userId });
        // --- End Rate Limiting Check ---


        // 4. --- Determine Target Phone and User Name ---
        // Initialize with 'let' to allow modification in fallback
        let targetPhone = lastVerification.target;
        // Try to get name from session first for personalization
        let userFirstName = session.user.firstName || ''; // Use empty string as fallback

        // Fallback: If target phone wasn't stored in verification, fetch from User model
        if (!targetPhone) {
             logger.warn(`Target phone missing in verification record ${lastVerification.id}. Fetching from user ${userId}.`);
             const user = await prisma.user.findUnique({
                 where: { id: userId },
                 select: { phone: true, firstName: true } // Select only needed fields
             });
             if (!user?.phone) {
                // This is a more critical error, shouldn't happen if registration flow is correct
                logger.error(`Cannot find phone number for user ${userId} in fallback during resend.`);
                // Don't expose internal details, give a generic error
                return NextResponse.json({ error: 'שגיאה: לא ניתן לאתר את מספר הטלפון לשליחת הקוד.' }, { status: 500 });
             }
             targetPhone = user.phone; // Assign the fetched phone number
             userFirstName = user.firstName || ''; // Update first name if fetched
             logger.info("Successfully fetched phone number from user model as fallback", { userId });
        }

        // Final check to ensure we have a phone number
        if (!targetPhone) {
             logger.error(`Target phone is still null/undefined after fallback for user ${userId}.`);
             return NextResponse.json({ error: 'שגיאה: לא ניתן לקבוע את מספר הטלפון ליצירת קשר.' }, { status: 500 });
        }
        // --- End Determine Target Phone ---


        // 5. --- Generate New OTP ---
        const newOtpCode = generateOtp();
        const newOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // New 10-minute expiration
        logger.info("Generated new OTP", { userId });
        // --- End Generate New OTP ---


        // 6. --- Update Verification Record ---
        // Update the *existing* pending record with the new code, expiry, reset attempts, and timestamp
        await prisma.verification.update({
            where: { id: lastVerification.id },
            data: {
                token: newOtpCode,
                expiresAt: newOtpExpiresAt,
                attempts: 0, // Reset attempts count for the new code
                createdAt: new Date() // Update timestamp to reflect this new send attempt (for rate limiting)
            }
        });
        logger.info(`Updated verification record ${lastVerification.id} with new OTP`, { userId });
        // --- End Update Verification Record ---


        // 7. --- Send New OTP via WhatsApp ---
        logger.info("Attempting to send new OTP via WhatsApp", { userId, phone: targetPhone });
        const otpSent = await sendOtpViaWhatsApp(
            targetPhone,
            newOtpCode,
            userFirstName // Pass name for personalization
        );

        if (!otpSent) {
            // Log the failure but still return a potentially helpful message to the user
            logger.error(`Failed to resend OTP via WhatsApp for user ${userId}.`, { userId, phone: targetPhone });
            // Let the user know there was an issue, maybe suggest trying again later
            return NextResponse.json({ error: 'שליחת קוד האימות החדש באמצעות WhatsApp נכשלה. אנא נסה שוב בעוד מספר רגעים.' }, { status: 500 });
        }
        // --- End Send New OTP ---


        // 8. --- Success Response ---
        logger.info("New OTP resent successfully via WhatsApp", { userId });
        return NextResponse.json({ message: 'קוד אימות חדש נשלח בהצלחה באמצעות WhatsApp.' }, { status: 200 });
        // --- End Success Response ---

    } catch (error: unknown) { // Catch errors as unknown
        logger.error("An error occurred during the resend code process", {
            userId: session?.user?.id, // Log userId if available
            error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : String(error)
        });
        // Return a generic server error response
        return NextResponse.json({ error: 'אירעה שגיאה פנימית בשרת. נסה שוב מאוחר יותר.' }, { status: 500 });
    } finally {
        // Disconnect Prisma client if necessary (depends on Prisma setup)
        // await prisma.$disconnect();
        // logger.info("Database connection closed (if applicable)");
    }
}