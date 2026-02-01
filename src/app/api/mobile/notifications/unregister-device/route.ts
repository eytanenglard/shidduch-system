// src/app/api/notifications/unregister-device/route.ts
// הסרת מכשיר מהתראות

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

    console.log(`[unregister-device] Device token removed`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[unregister-device] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
