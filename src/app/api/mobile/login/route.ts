// src/app/api/mobile/login/route.ts
// התחברות עם Email/Password למובייל
// נתיב: POST /api/mobile/login

import { NextRequest } from "next/server";
import { z } from "zod";
import { compare } from "bcryptjs";
import prisma from "@/lib/prisma";
import { 
  createMobileToken, 
  formatUserForMobile,
  corsJson,
  corsError,
  corsOptions
} from "@/lib/mobile-auth";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return corsJson(req, { 
        success: false, 
        error: "Invalid input", 
        details: validation.error.errors 
      }, { status: 400 });
    }

    const { email, password } = validation.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return corsError(req, "Invalid credentials", 401);
    }

    if (!user.password) {
      return corsError(req, "Please use Google Sign-In for this account", 401);
    }

    const isValidPassword = await compare(password, user.password);
    if (!isValidPassword) {
      return corsError(req, "Invalid credentials", 401);
    }

    if (user.status === "BLOCKED") {
      return corsError(req, "Account is blocked", 403);
    }

    if (user.status === "INACTIVE") {
      return corsError(req, "Account is inactive", 403);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    }).catch(err => console.error("[mobile/login] Failed to update lastLogin:", err));

    const { token, expiresAt } = createMobileToken(user);

    console.log(`[mobile/login] User ${user.email} logged in successfully from mobile`);

    return corsJson(req, {
      success: true,
      user: formatUserForMobile(user),
      tokens: {
        accessToken: token,
        expiresAt,
      },
    });

  } catch (error) {
    console.error("[mobile/login] Error:", error);
    return corsError(req, "Internal server error", 500);
  }
}

export async function GET(req: NextRequest) {
  return corsJson(req, {
    success: true,
    message: "Mobile login endpoint is working. Use POST to login.",
    method: "POST",
    body: {
      email: "string (required)",
      password: "string (required, min 6 chars)"
    }
  });
}