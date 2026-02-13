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
          process.env.GOOGLE_IOS_CLIENT_ID,
          process.env.GOOGLE_ANDROID_CLIENT_ID,
          process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
          process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
          // Fallback - הוספת ה-Client IDs הספציפיים במקרה שהמשתנים לא הוגדרו
          "1034451392663-hquqkr5l6fse3onvj31fi2lbfkitvv6a.apps.googleusercontent.com", // iOS
          "1034451392663-s07vnc13rnssjqhjrk6knnqrnkmqi43i.apps.googleusercontent.com", // Android
        ].filter(Boolean) as string[],
      });
      payload = ticket.getPayload();
    } catch (error) {
      console.error("[mobile/google] Google token verification failed:", error);
      console.error("[mobile/google] Attempted audiences:", [
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_IOS_CLIENT_ID,
        process.env.GOOGLE_ANDROID_CLIENT_ID,
        process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      ].filter(Boolean));
      return corsError(req, "Invalid Google token", 401);
    }

    if (!payload || !payload.email) {
      return corsError(req, "Could not get email from Google", 401);
    }

    // בדיקה אם המשתמש קיים במערכת
    const user = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
    });

    if (!user) {
      // אפשרות 1: החזר שגיאה שהמשתמש צריך להירשם באתר קודם
      return corsJson(req, { 
        success: false, 
        error: "Account not found. Please register at neshamatech.com first.",
        errorCode: "USER_NOT_FOUND"
      }, { status: 404 });

      // אפשרות 2: צור משתמש חדש אוטומטית (אם תרצה לאפשר רישום דרך האפליקציה)
      // הערה: קטע זה מוכן אך מנוטרל. הסר את הערות ה-comment כדי להפעיל
      /*
      const firstName = payload.given_name || "";
      const lastName = payload.family_name || "";
      
      user = await prisma.user.create({
        data: {
          email: payload.email.toLowerCase(),
          firstName,
          lastName,
          name: payload.name || `${firstName} ${lastName}`.trim(),
          isVerified: payload.email_verified || false,
          role: "CANDIDATE",
          status: "PENDING_PHONE_VERIFICATION",
          isProfileComplete: false,
          isPhoneVerified: false,
          source: "REGISTRATION",
          language: "he",
        },
      });
      
      console.log(`[mobile/google] Created new user ${user.email} via Google mobile auth`);
      */
    }

    // בדיקת סטטוס המשתמש
    if (user.status === "BLOCKED") {
      return corsError(req, "Account is blocked", 403);
    }

    if (user.status === "INACTIVE") {
      return corsError(req, "Account is inactive", 403);
    }

    // עדכון זמן התחברות אחרונה
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastLogin: new Date(),
        // אם האימייל מאומת בגוגל אך לא במערכת, עדכן
        ...(payload.email_verified && !user.isVerified && {
          isVerified: true
        })
      },
    }).catch(err => console.error("[mobile/google] Failed to update user:", err));

    // יצירת טוקן למובייל
    const { token, expiresAt } = createMobileToken(user);

    console.log(`[mobile/google] User ${user.email} logged in via Google from mobile`);
    console.log(`[mobile/google] Token will expire at: ${new Date(expiresAt).toISOString()}`);

    // החזרת תגובה מוצלחת
    return corsJson(req, {
      success: true,
      user: formatUserForMobile(user),
      tokens: {
        accessToken: token,
        expiresAt,
      },
    });

  } catch (error) {
    console.error("[mobile/google] Unexpected error:", error);
    return corsError(req, "Authentication failed", 500);
  }
}

export async function GET(req: NextRequest) {
  return corsJson(req, {
    success: true,
    message: "Mobile Google login endpoint is working. Use POST with idToken.",
    method: "POST",
    body: {
      idToken: "string (required) - The Google ID token from the client"
    },
    environment: {
      hasWebClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasIosClientId: !!process.env.GOOGLE_IOS_CLIENT_ID || !!process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      hasAndroidClientId: !!process.env.GOOGLE_ANDROID_CLIENT_ID || !!process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    }
  });
}