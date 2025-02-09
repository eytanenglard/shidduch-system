// src/app/api/profile/[userId]/password/initiate/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createTransport } from "nodemailer";
import { randomBytes } from "crypto";

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

    const { currentPassword } = await req.json();
    
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid password" },
        { status: 400 }
      );
    }

    // Generate verification code
    const verificationCode = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Create verification record
    await prisma.verification.create({
      data: {
        userId: user.id,
        type: 'EMAIL',
        token: verificationCode,
        expiresAt,
        status: 'PENDING'
      }
    });

    // Send verification email
    const transporter = createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'קוד אימות לשינוי סיסמה',
      html: `
        <div dir="rtl">
          <h1>שינוי סיסמה</h1>
          <p>קוד האימות שלך לשינוי הסיסמה הוא:</p>
          <h2>${verificationCode}</h2>
          <p>הקוד תקף ל-30 דקות.</p>
          <p>אם לא ביקשת לשנות את הסיסמה, אנא התעלם מהודעה זו.</p>
        </div>
      `
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password change initiation error:', error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}