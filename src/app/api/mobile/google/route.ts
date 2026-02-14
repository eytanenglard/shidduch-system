// src/app/api/mobile/google/route.ts
// ==========================================
// NeshamaTech Mobile API - Google Auth
// POST /api/mobile/google
// Supports both LOGIN (existing user) and REGISTER (new user)
// ==========================================

import { NextRequest } from "next/server";
import { OAuth2Client } from "google-auth-library";
import prisma from "@/lib/prisma";
import { UserRole, UserStatus, UserSource, Gender } from "@prisma/client";
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

    // --- Verify Google token ---
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
          "1034451392663-hquqkr5l6fse3onvj31fi2lbfkitvv6a.apps.googleusercontent.com", // iOS
          "1034451392663-s07vnc13rnssjqhjrk6knnqrnkmqi43i.apps.googleusercontent.com", // Android
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

    // --- Check if user exists ---
    let user = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
    });

    let isNewUser = false;

    if (!user) {
      // ✅ Auto-register new Google user
      const firstName = payload.given_name || "";
      const lastName = payload.family_name || "";

      user = await prisma.user.create({
        data: {
          email: payload.email.toLowerCase(),
          firstName,
          lastName,
          isVerified: payload.email_verified || false,
          role: UserRole.CANDIDATE,
          status: UserStatus.PENDING_PHONE_VERIFICATION,
          isProfileComplete: false,
          isPhoneVerified: false,
          source: UserSource.REGISTRATION,
          language: "he",
          termsAndPrivacyAcceptedAt: new Date(),
          engagementEmailsConsent: false,
          promotionalEmailsConsent: false,
          profile: {
            create: {
              availabilityStatus: 'AVAILABLE',
              isProfileVisible: false,
              gender: Gender.FEMALE, // ערך זמני
              birthDate: new Date('2000-01-01T00:00:00.000Z'), // ערך זמני
              birthDateIsApproximate: true,
            }
          }
        },
      });

      isNewUser = true;
      console.log(`[mobile/google] Created new user ${user.email} via Google mobile auth`);
    }

    // --- Check user status ---
    if (user.status === "BLOCKED") {
      return corsError(req, "Account is blocked", 403);
    }
    if (user.status === "INACTIVE") {
      return corsError(req, "Account is inactive", 403);
    }

    // --- Update last login ---
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        ...(payload.email_verified && !user.isVerified && {
          isVerified: true,
        }),
      },
    }).catch(err => console.error("[mobile/google] Failed to update user:", err));

    // --- Create JWT token ---
    const { token, expiresAt } = createMobileToken(user);

    console.log(`[mobile/google] User ${user.email} ${isNewUser ? 'registered and' : ''} logged in via Google`);

    return corsJson(req, {
      success: true,
      isNewUser,
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
