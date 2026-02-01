// src/app/api/auth/me/route.ts
// קבלת פרטי המשתמש הנוכחי (למובייל)

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyMobileToken, formatUserForMobile } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
  try {
    // אימות ה-token
    const auth = await verifyMobileToken(req);
    
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // שליפת המשתמש מהדאטאבייס
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: formatUserForMobile(user),
    });

  } catch (error) {
    console.error("[auth/me] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
