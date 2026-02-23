// src/app/api/mobile/apple/route.ts
// ==========================================
// NeshamaTech Mobile API - Apple Auth
// POST /api/mobile/apple
// Supports both LOGIN (existing user) and REGISTER (new user)
// Required for App Store guideline 4.8
// ==========================================

import { NextRequest } from "next/server";
import * as jwt from "jsonwebtoken";
import * as jwksClient from "jwks-rsa";
import prisma from "@/lib/prisma";
import { UserRole, UserStatus, UserSource, Gender } from "@prisma/client";
import {
  createMobileToken,
  formatUserForMobile,
  corsJson,
  corsError,
  corsOptions,
} from "@/lib/mobile-auth";

// ==========================================
// Apple JWKS client for verifying tokens
// ==========================================
const appleJwksClient = jwksClient({
  jwksUri: "https://appleid.apple.com/auth/keys",
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
});

/**
 * Get Apple's signing key for token verification
 */
async function getAppleSigningKey(kid: string): Promise<string> {
  const key = await appleJwksClient.getSigningKey(kid);
  return key.getPublicKey();
}

/**
 * Verify and decode an Apple identity token
 */
async function verifyAppleToken(identityToken: string): Promise<{
  sub: string; // Apple user ID (unique, stable)
  email?: string;
  email_verified?: string | boolean;
  is_private_email?: string | boolean;
}> {
  // Decode the header to get the key ID
  const decoded = jwt.decode(identityToken, { complete: true });
  if (!decoded || !decoded.header || !decoded.header.kid) {
    throw new Error("Invalid Apple token format");
  }

  // Get Apple's public key
  const signingKey = await getAppleSigningKey(decoded.header.kid);

  // Verify the token
  const payload = jwt.verify(identityToken, signingKey, {
    algorithms: ["RS256"],
    issuer: "https://appleid.apple.com",
    audience: process.env.APPLE_BUNDLE_ID || "com.neshamatech.app",
  }) as any;

  return {
    sub: payload.sub,
    email: payload.email,
    email_verified: payload.email_verified,
    is_private_email: payload.is_private_email,
  };
}

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identityToken, fullName, email: clientEmail } = body;

    if (!identityToken) {
      return corsError(req, "Identity token is required", 400);
    }

    // --- Verify Apple token ---
    let applePayload;
    try {
      applePayload = await verifyAppleToken(identityToken);
    } catch (error) {
      console.error("[mobile/apple] Apple token verification failed:", error);
      return corsError(req, "Invalid Apple token", 401);
    }

    const appleUserId = applePayload.sub;
    const email = applePayload.email || clientEmail;

    if (!email) {
      return corsError(req, "Could not get email from Apple", 401);
    }

    // --- Check if user exists (by email or Apple ID) ---
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { appleId: appleUserId },
        ],
      },
    });

    let isNewUser = false;

    if (!user) {
      // ✅ Auto-register new Apple user
      // Apple only sends fullName on the FIRST sign-in, so we capture it here
      const firstName = fullName?.givenName || "";
      const lastName = fullName?.familyName || "";

      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          appleId: appleUserId,
          firstName,
          lastName,
          isVerified: applePayload.email_verified === "true" || applePayload.email_verified === true,
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
              availabilityStatus: "AVAILABLE",
              isProfileVisible: false,
              gender: Gender.FEMALE, // ערך זמני
              birthDate: new Date("2000-01-01T00:00:00.000Z"), // ערך זמני
              birthDateIsApproximate: true,
            },
          },
        },
      });

      isNewUser = true;
      console.log(`[mobile/apple] Created new user ${user.email} via Apple Sign-In`);
    } else if (!user.appleId) {
      // Link Apple ID to existing account
      await prisma.user.update({
        where: { id: user.id },
        data: { appleId: appleUserId },
      }).catch((err) =>
        console.error("[mobile/apple] Failed to link Apple ID:", err)
      );
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
        ...(applePayload.email_verified &&
          !user.isVerified && {
            isVerified: true,
          }),
      },
    }).catch((err) =>
      console.error("[mobile/apple] Failed to update user:", err)
    );

    // --- Create JWT token ---
    const { token, expiresAt } = createMobileToken(user);

    console.log(
      `[mobile/apple] User ${user.email} ${isNewUser ? "registered and" : ""} logged in via Apple`
    );

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
    console.error("[mobile/apple] Unexpected error:", error);
    return corsError(req, "Authentication failed", 500);
  }
}

export async function GET(req: NextRequest) {
  return corsJson(req, {
    success: true,
    message:
      "Mobile Apple login endpoint is working. Use POST with identityToken.",
    method: "POST",
    body: {
      identityToken: "string (required) - The Apple identity token",
      fullName:
        "object (optional) - { givenName, familyName } - only sent on first sign-in",
      email: "string (optional) - fallback email from Apple credential",
    },
  });
}