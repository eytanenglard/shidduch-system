// src/app/api/auth/mobile-google/route.ts
// התחברות עם Google למובייל

import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import prisma from "@/lib/prisma";
import { createMobileToken, formatUserForMobile } from "@/lib/mobile-auth";

// אתחול Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "ID token is required" },
        { status: 400 }
      );
    }

    // אימות ה-token מול Google
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: [
          process.env.GOOGLE_CLIENT_ID!,
          // Client IDs של המובייל - הוסף כשיהיו לך
          process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
          process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
        ].filter(Boolean) as string[],
      });
      payload = ticket.getPayload();
    } catch (error) {
      console.error("[mobile-google] Google token verification failed:", error);
      return NextResponse.json(
        { success: false, error: "Invalid Google token" },
        { status: 401 }
      );
    }

    if (!payload || !payload.email) {
      return NextResponse.json(
        { success: false, error: "Could not get email from Google" },
        { status: 401 }
      );
    }

    // מציאת המשתמש
    const user = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
    });

    if (!user) {
      // באפליקציית מובייל לא יוצרים משתמשים חדשים - צריך להירשם קודם באתר
      return NextResponse.json(
        { 
          success: false, 
          error: "Account not found. Please register at neshamatech.com first.",
          errorCode: "USER_NOT_FOUND"
        },
        { status: 404 }
      );
    }

    // בדיקת סטטוס
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
    }).catch(err => console.error("[mobile-google] Failed to update lastLogin:", err));

    // יצירת token
    const { token, expiresAt } = createMobileToken(user);

    console.log(`[mobile-google] User ${user.email} logged in via Google from mobile`);

    return NextResponse.json({
      success: true,
      user: formatUserForMobile(user),
      tokens: {
        accessToken: token,
        expiresAt,
      },
    });

  } catch (error) {
    console.error("[mobile-google] Error:", error);
    return NextResponse.json(
      { success: false, error: "Authentication failed" },
      { status: 500 }
    );
  }
}
