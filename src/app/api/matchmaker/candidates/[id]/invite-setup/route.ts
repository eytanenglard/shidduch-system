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

    // Check if the email is already in use by another user
    const emailExists = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        id: { not: candidateId },
      },
    });

    if (emailExists) {
      return NextResponse.json({ success: false, error: "כתובת אימייל זו כבר משויכת לחשבון אחר." }, { status: 409 });
    }

    // Find the candidate to invite
    const candidate = await prisma.user.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      return NextResponse.json({ success: false, error: "Candidate not found." }, { status: 404 });
    }

    // --- START OF FIX ---
    // The createVerification function returns an object with `otp` and `verification`.
    // We will destructure the `otp` property and rename it to `setupToken` for clarity.
    // The `verification` object contains the full record from the database.
    const { otp: setupToken, verification } = await VerificationService.createVerification(
      candidateId,
      VerificationType.ACCOUNT_SETUP,
      normalizedEmail,
      72 // Token valid for 72 hours
    );
    // --- END OF FIX ---

    // Update user's email and invalidate previous tokens in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: candidateId },
        data: { email: normalizedEmail },
      });

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

    // Send the email with the correct token (which is the OTP)
    await emailService.sendAccountSetupEmail({
      email: normalizedEmail,
      firstName: candidate.firstName,
      matchmakerName: session.user.firstName || "השדכן/ית שלך",
      setupToken: setupToken, // Use the correctly destructured token here
      expiresIn: "3 ימים",
    });

    return NextResponse.json({ success: true, message: "הזמנה להגדרת חשבון נשלחה בהצלחה." });

  } catch (error) {
    console.error("Error sending account setup invite:", error);
    let errorMessage = "An unexpected error occurred.";
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        errorMessage = "Database error occurred.";
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}