export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { PrismaClient, VerificationType } from "@prisma/client";
import { generateToken } from "@/lib/tokens";
import { emailService } from "@/lib/email/emailService";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: "אימייל הוא שדה חובה" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });
    }

    await prisma.verification.updateMany({
      where: {
        userId: user.id,
        type: VerificationType.EMAIL,
        status: "PENDING"
      },
      data: { status: "EXPIRED" }
    });

    const token = await generateToken();
    const verification = await prisma.verification.create({
      data: {
        token,
        userId: user.id,
        type: VerificationType.EMAIL,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: "PENDING"
      }
    });

    await emailService.sendVerificationEmail({
      email: user.email,
      verificationLink: verification.token,
      firstName: user.firstName,
      expiresIn: '24 שעות'
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Error sending verification:', error);
    return NextResponse.json({ error: "שגיאה בשליחת קוד האימות" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}