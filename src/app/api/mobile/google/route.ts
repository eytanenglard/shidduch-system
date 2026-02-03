// src/app/api/mobile/google/route.ts
// התחברות עם Google למובייל
// נתיב: POST /api/mobile/google

import { NextRequest } from "next/server";
import { OAuth2Client } from "google-auth-library";
import prisma from "@/lib/prisma";
import { 
  createMobileToken, 
  formatUserForMobile,
  corsJson,
  corsError,
  corsOptions
} from "@/lib/mobile-auth";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return corsError(req, "ID token is required", 400);
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: [
          process.env.GOOGLE_CLIENT_ID!,
          process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
          process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
        ].filter(Boolean) as string[],
      });
      payload = ticket.getPayload();
    } catch (error) {
      console.error("[mobile/google] Google token verification failed:", error);
      return corsError(req, "Invalid Google token", 401);
    }

    if (!payload || !payload.email) {
      return corsError(req, "Could not get email from Google", 401);
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
    });

    if (!user) {
      return corsJson(req, { 
        success: false, 
        error: "Account not found. Please register at neshamatech.com first.",
        errorCode: "USER_NOT_FOUND"
      }, { status: 404 });
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
    }).catch(err => console.error("[mobile/google] Failed to update lastLogin:", err));

    const { token, expiresAt } = createMobileToken(user);

    console.log(`[mobile/google] User ${user.email} logged in via Google from mobile`);

    return corsJson(req, {
      success: true,
      user: formatUserForMobile(user),
      tokens: {
        accessToken: token,
        expiresAt,
      },
    });

  } catch (error) {
    console.error("[mobile/google] Error:", error);
    return corsError(req, "Authentication failed", 500);
  }
}

export async function GET(req: NextRequest) {
  return corsJson(req, {
    success: true,
    message: "Mobile Google login endpoint is working. Use POST with idToken.",
  });
}