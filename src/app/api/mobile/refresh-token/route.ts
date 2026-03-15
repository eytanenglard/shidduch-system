// src/app/api/mobile/refresh-token/route.ts
// ==========================================
// NeshamaTech Mobile - Token Refresh API
// POST /api/mobile/refresh-token
// Extends session by issuing a new JWT when the current one is still valid
// ==========================================

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifyMobileToken,
  createMobileToken,
  formatUserForMobile,
  corsJson,
  corsError,
  corsOptions,
} from "@/lib/mobile-auth";

// ==========================================
// POST - Refresh token
// ==========================================
export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyMobileToken(req);
    if (!authResult?.userId) {
      return corsError(req, "Invalid token", 401);
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
      include: {
        profile: {
          select: {
            gender: true,
            city: true,
            religiousLevel: true,
            availabilityStatus: true,
          },
        },
      },
    });

    if (!user) {
      return corsError(req, "User not found", 401);
    }

    if (user.status === "BLOCKED" || user.status === "INACTIVE") {
      return corsError(req, "Account is not active", 403);
    }

    // Issue new token
    const { token, expiresAt } = createMobileToken(user);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return corsJson(req, {
      success: true,
      user: formatUserForMobile(user),
      tokens: {
        accessToken: token,
        expiresAt,
      },
    });
  } catch (error) {
    console.error("[mobile/refresh-token] Error:", error);
    return corsError(req, "Token refresh failed", 401);
  }
}

// ==========================================
// OPTIONS - CORS preflight
// ==========================================
export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}