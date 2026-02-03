// src/app/api/mobile/me/route.ts
// קבלת פרטי המשתמש הנוכחי
// נתיב: GET /api/mobile/me

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { 
  verifyMobileToken, 
  formatUserForMobile,
  corsJson,
  corsError,
  corsOptions
} from "@/lib/mobile-auth";

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    
    if (!auth) {
      return corsError(req, "Unauthorized", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
    });

    if (!user) {
      return corsError(req, "User not found", 404);
    }

    return corsJson(req, {
      success: true,
      user: formatUserForMobile(user),
    });

  } catch (error) {
    console.error("[mobile/me] Error:", error);
    return corsError(req, "Internal server error", 500);
  }
}