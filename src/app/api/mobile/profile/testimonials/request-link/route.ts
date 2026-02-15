// src/app/api/mobile/profile/testimonials/request-link/route.ts
// ==========================================
// NeshamaTech Mobile - Testimonial Link Generator
// POST: Generate a one-time link for a friend to submit a testimonial
// ==========================================

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { randomBytes } from "crypto";
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from "@/lib/mobile-auth";

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

// ==========================================
// POST /api/mobile/profile/testimonials/request-link
// Generate a testimonial submission link
// ==========================================
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, "Unauthorized", 401);

    const userId = auth.userId;

    // Find user's profile
    const userProfile = await prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!userProfile) {
      return corsError(req, "Profile not found", 404);
    }

    // Generate secure token
    const token = randomBytes(32).toString("hex");

    // Set expiration (7 days)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create request record
    await prisma.testimonialRequest.create({
      data: {
        token,
        expiresAt,
        profileId: userProfile.id,
      },
    });

    // Build the link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.neshamatech.com";
    const link = `${baseUrl}/testimonial/${token}`;

    console.log(`[mobile/testimonials] Link created for user ${userId}`);

    return corsJson(req, {
      success: true,
      data: { link },
    });
  } catch (error) {
    console.error("[mobile/testimonials] POST Error:", error);
    return corsError(req, "Internal server error", 500);
  }
}