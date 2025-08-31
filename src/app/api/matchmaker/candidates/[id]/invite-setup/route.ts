// src/app/api/matchmaker/candidates/[id]/invite-setup/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole, VerificationType, Prisma, VerificationStatus } from "@prisma/client";
import { VerificationService } from "@/lib/services/verificationService";
import { emailService } from "@/lib/email/emailService";
import { applyRateLimit } from "@/lib/rate-limiter";

/**
 * Handles a matchmaker's request to send an account setup invitation to a candidate.
 * This allows a manually-created user to set their own password and take control of their profile.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // 1. Apply Rate Limiting
  const rateLimitResponse = await applyRateLimit(req, { requests: 20, window: '1 h' });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  
  try {
    // 2. Authenticate and authorize the matchmaker/admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 3. Get Locale from URL for translation
    const url = new URL(req.url);
    const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'he';

    // 4. Validate request parameters and body
    const candidateId = params.id;
    const body = await req.json();
    const { email } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "כתובת אימייל תקינה היא שדה חובה." }, { status: 400 });
    }
    const normalizedEmail = email.toLowerCase();

    // 5. Fetch the candidate to invite
    const candidate = await prisma.user.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      return NextResponse.json({ success: false, error: "Candidate not found." }, { status: 404 });
    }
    
    // 6. Create an account setup token using the Verification Service
    const expiresInHours = 72; // 3 days
    const { otp: setupToken, verification } = await VerificationService.createVerification(
      candidateId,
      VerificationType.ACCOUNT_SETUP,
      normalizedEmail,
      expiresInHours
    );

    // 7. Update candidate's email and invalidate old tokens in a transaction
    await prisma.$transaction(async (tx) => {
      // Only update the email if it's different from the current one.
      if (candidate.email !== normalizedEmail) {
          await tx.user.update({
            where: { id: candidateId },
            data: { email: normalizedEmail },
          });
      }
      // Invalidate any other pending setup tokens for this user
      await tx.verification.updateMany({
        where: {
          userId: candidateId,
          type: VerificationType.ACCOUNT_SETUP,
          status: VerificationStatus.PENDING,
          id: { not: verification.id }, // Exclude the one we just created
        },
        data: {
          status: VerificationStatus.EXPIRED,
        },
      });
    });

    // 8. Send the account setup email using the updated Email Service
    const expiresInText = locale === 'he' ? '3 ימים' : '3 days';
    await emailService.sendAccountSetupEmail({
      locale, // <-- Pass the correct locale
      email: normalizedEmail,
      firstName: candidate.firstName,
      matchmakerName: session.user.firstName || "השדכן/ית שלך",
      setupToken: setupToken,
      expiresIn: expiresInText,
    });

    // 9. Return success response
    return NextResponse.json({ success: true, message: "הזמנה להגדרת חשבון נשלחה בהצלחה." });

  } catch (error) {
    // 10. Handle unexpected errors, including unique email constraint violations
    console.error("Error sending account setup invite:", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = error.meta?.target as string[] | undefined;
      if (target?.includes('email')) {
        return NextResponse.json(
          { success: false, error: "כתובת אימייל זו כבר משויכת לחשבון אחר." },
          { status: 409 } // 409 Conflict
        );
      }
    }

    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ success: false, error: "אירעה שגיאה בשליחת ההזמנה.", details: errorMessage }, { status: 500 });
  }
}