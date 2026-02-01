// src/app/api/mobile/notifications/unregister-device/route.ts
// הסרת מכשיר מהתראות
// נתיב: POST /api/mobile/notifications/unregister-device

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      );
    }

    await prisma.deviceToken.deleteMany({
      where: { token },
    });

    console.log(`[mobile/notifications] Device token removed`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[mobile/notifications/unregister-device] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
