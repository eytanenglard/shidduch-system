// src/app/api/profile/[userId]/password/complete/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

const MAX_ATTEMPTS = 3;

export async function POST(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.id !== params.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { verificationCode, newPassword } = await req.json();

    // Find valid verification record
    const verification = await prisma.verification.findFirst({
      where: {
        userId: params.userId,
        token: verificationCode,
        type: 'EMAIL',
        status: 'PENDING',
        expiresAt: { gt: new Date() }
      }
    });

    if (!verification) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification code" },
        { status: 400 }
      );
    }

    // Check attempts
    if (verification.attempts >= MAX_ATTEMPTS) {
      await prisma.verification.update({
        where: { id: verification.id },
        data: { status: 'FAILED' }
      });
      return NextResponse.json(
        { success: false, error: "Too many failed attempts" },
        { status: 400 }
      );
    }

    // Increment attempts
    await prisma.verification.update({
      where: { id: verification.id },
      data: { attempts: { increment: 1 } }
    });

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and verification record
    await prisma.$transaction([
      prisma.user.update({
        where: { id: params.userId },
        data: { password: hashedPassword }
      }),
      prisma.verification.update({
        where: { id: verification.id },
        data: { 
          status: 'COMPLETED',
          completedAt: new Date()
        }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password change completion error:', error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}