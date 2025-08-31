// src/app/api/auth/send-verification/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { VerificationType, UserStatus } from "@prisma/client";
import { VerificationService } from "@/lib/services/verificationService";
import { emailService } from "@/lib/email/emailService";
import { applyRateLimit } from "@/lib/rate-limiter";

export const runtime = 'nodejs';

/**
 * Handles requests to send a new email verification code to an existing, unverified user.
 */
export async function POST(req: NextRequest) {
  // 1. Apply Rate Limiting to prevent email spam
  const rateLimitResponse = await applyRateLimit(req, { requests: 5, window: '1 h' });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // 2. Get Locale from URL for translation
    const url = new URL(req.url);
    const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'he';

    // 3. Parse and Validate Request Body
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, error: "אימייל הוא שדה חובה" }, { status: 400 });
    }
    const normalizedEmail = email.toLowerCase();

    // 4. Find the user and perform necessary checks
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      // Security: Return a generic message even if the user doesn't exist to prevent enumeration.
      return NextResponse.json({ success: true, message: "אם קיים חשבון המשויך למייל זה, נשלח אליו קוד אימות." }, { status: 200 });
    }

    if (user.isVerified || user.status !== UserStatus.PENDING_EMAIL_VERIFICATION) {
        return NextResponse.json({ success: false, error: "חשבון זה כבר מאומת או שאינו ממתין לאימות." }, { status: 400 });
    }

    // 5. Create a new verification OTP using the central service
    const expiresInHours = 1; // 1-hour validity for the new code
    const { otp: generatedOtp } = await VerificationService.createVerification(
      user.id,
      VerificationType.EMAIL,
      user.email,
      expiresInHours
    );

    console.log(`[Send Verification] New OTP generated for user: ${user.id}`);

    // 6. Send the verification email using the updated Email Service
    const expiresInText = locale === 'he' ? 'שעה אחת' : '1 hour';
    await emailService.sendVerificationEmail({
      locale, // <-- Pass the correct locale
      email: user.email,
      verificationCode: generatedOtp,
      firstName: user.firstName,
      expiresIn: expiresInText
    });

    console.log(`[Send Verification] Verification email re-sent successfully to ${user.email} in ${locale}`);

    // 7. Return a success response
    return NextResponse.json({ success: true, message: "קוד אימות חדש נשלח בהצלחה." }, { status: 200 });

  } catch (error) {
    // 8. Handle unexpected errors
    console.error('[API Send Verification] A critical error occurred:', error);
    const errorMessage = error instanceof Error ? error.message : "שגיאה לא צפויה בשליחת קוד האימות.";
    return NextResponse.json(
      { success: false, error: "אירעה שגיאה בתהליך, אנא נסה שנית מאוחר יותר.", details: errorMessage },
      { status: 500 }
    );
  }
}