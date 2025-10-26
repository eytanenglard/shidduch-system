// src/app/api/matchmaker/candidates/[id]/invite-setup/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole, VerificationType, Prisma, VerificationStatus } from "@prisma/client";
import { VerificationService } from "@/lib/services/verificationService";
import { emailService } from "@/lib/email/emailService";
import { applyRateLimitWithRoleCheck } from '@/lib/rate-limiter';

export async function POST(req: NextRequest, context: { params: { id: string } }) {
  const rateLimitResponse = await applyRateLimitWithRoleCheck(req, { requests: 15, window: '1 h' });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'he';

    const candidateId = context.params.id;
    const body = await req.json();
    const { email } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "כתובת אימייל תקינה היא שדה חובה." }, { status: 400 });
    }
    const normalizedEmail = email.toLowerCase();

    const candidate = await prisma.user.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      return NextResponse.json({ success: false, error: "Candidate not found." }, { status: 404 });
    }
    
    const expiresInHours = 72;
    const { otp: setupToken, verification } = await VerificationService.createVerification(
      candidateId,
      VerificationType.ACCOUNT_SETUP,
      normalizedEmail,
      expiresInHours
    );

    await prisma.$transaction(async (tx) => {
      if (candidate.email !== normalizedEmail) {
          await tx.user.update({
            where: { id: candidateId },
            data: { email: normalizedEmail },
          });
      }
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

    const expiresInText = locale === 'he' ? '3 ימים' : '3 days';
    await emailService.sendAccountSetupEmail({
      locale,
      email: normalizedEmail,
      firstName: candidate.firstName,
      matchmakerName: session.user.firstName || "השדכן/ית שלך",
      setupToken: setupToken,
      expiresIn: expiresInText,
    });

    return NextResponse.json({ success: true, message: "הזמנה להגדרת חשבון נשלחה בהצלחה." });

  } catch (error) {
    console.error("Error sending account setup invite:", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = error.meta?.target as string[] | undefined;
      if (target?.includes('email')) {
        return NextResponse.json(
          { success: false, error: "כתובת אימייל זו כבר משויכת לחשבון אחר." },
          { status: 409 }
        );
      }
    }

    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ success: false, error: "אירעה שגיאה בשליחת ההזמנה.", details: errorMessage }, { status: 500 });
  }
}