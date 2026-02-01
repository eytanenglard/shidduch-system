// src/app/api/auth/mobile-login/route.ts
// התחברות עם Email/Password למובייל

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { compare } from "bcryptjs";
import prisma from "@/lib/prisma";
import { createMobileToken, formatUserForMobile } from "@/lib/mobile-auth";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // מציאת המשתמש
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // בדיקה שיש סיסמה (אם נרשם רק עם Google, אין סיסמה)
    if (!user.password) {
      return NextResponse.json(
        { success: false, error: "Please use Google Sign-In for this account" },
        { status: 401 }
      );
    }

    // אימות סיסמה
    const isValidPassword = await compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // בדיקת סטטוס משתמש
    if (user.status === "BLOCKED") {
      return NextResponse.json(
        { success: false, error: "Account is blocked" },
        { status: 403 }
      );
    }

    if (user.status === "INACTIVE") {
      return NextResponse.json(
        { success: false, error: "Account is inactive" },
        { status: 403 }
      );
    }

    // עדכון lastLogin
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    }).catch(err => console.error("[mobile-login] Failed to update lastLogin:", err));

    // יצירת token
    const { token, expiresAt } = createMobileToken(user);

    console.log(`[mobile-login] User ${user.email} logged in successfully from mobile`);

    return NextResponse.json({
      success: true,
      user: formatUserForMobile(user),
      tokens: {
        accessToken: token,
        expiresAt,
      },
    });

  } catch (error) {
    console.error("[mobile-login] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
