// src/app/api/matchmaker/candidates/[id]/invite-setup/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole, VerificationType, Prisma, VerificationStatus } from "@prisma/client";
import { VerificationService } from "@/lib/services/verificationService";
import { emailService } from "@/lib/email/emailService";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const candidateId = params.id;
    const body = await req.json();
    const { email } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "כתובת אימייל תקינה היא שדה חובה." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    // Find the candidate to invite. We fetch their current email to compare.
    const candidate = await prisma.user.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      return NextResponse.json({ success: false, error: "Candidate not found." }, { status: 404 });
    }
    
    // If the candidate's email is already the one we're trying to set,
    // we can just resend the invite without a DB update.
    if (candidate.email === normalizedEmail) {
        // Here, we can just resend the invite. For simplicity, we'll proceed,
        // but a dedicated "resend" logic would be cleaner.
        console.log(`Email ${normalizedEmail} is already set for candidate ${candidateId}. Proceeding to send invite.`);
    }

    const { otp: setupToken, verification } = await VerificationService.createVerification(
      candidateId,
      VerificationType.ACCOUNT_SETUP,
      normalizedEmail,
      72 // Token valid for 72 hours
    );

    // This transaction will now attempt to update the email.
    // The catch block below will handle the unique constraint violation if it occurs.
    await prisma.$transaction(async (tx) => {
      // Only update the email if it's different from the current one.
      if (candidate.email !== normalizedEmail) {
          await tx.user.update({
            where: { id: candidateId },
            data: { email: normalizedEmail },
          });
      }

      // Invalidate previous setup tokens for this user
      await tx.verification.updateMany({
        where: {
          userId: candidateId,
          type: VerificationType.ACCOUNT_SETUP,
          status: VerificationStatus.PENDING,
          id: { not: verification.id },
        },
        data: {
          status: VerificationStatus.EXPIRED,
        },
      });
    });

    // Send the email with the correct token
    await emailService.sendAccountSetupEmail({
      email: normalizedEmail,
      firstName: candidate.firstName,
      matchmakerName: session.user.firstName || "השדכן/ית שלך",
      setupToken: setupToken,
      expiresIn: "3 ימים",
    });

    return NextResponse.json({ success: true, message: "הזמנה להגדרת חשבון נשלחה בהצלחה." });

  } catch (error) {
    console.error("Error sending account setup invite:", error);
    
    // --- START: Enhanced Error Handling ---
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Check for unique constraint violation (P2002)
      if (error.code === 'P2002') {
        // The 'target' field in the error metadata tells us which field caused the violation.
        const target = error.meta?.target as string[] | undefined;
        if (target?.includes('email')) {
          return NextResponse.json(
            { success: false, error: "כתובת אימייל זו כבר משויכת לחשבון אחר." },
            { status: 409 } // 409 Conflict is the appropriate status code
          );
        }
      }
      // Handle other potential database errors
      return NextResponse.json({ success: false, error: "שגיאת מסד נתונים." }, { status: 500 });
    }
    // --- END: Enhanced Error Handling ---

    let errorMessage = "An unexpected error occurred.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}