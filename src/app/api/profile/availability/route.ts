// src/app/api/profile/availability/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { UpdateAvailabilityRequest } from "@/types/profile";

// ✅ חדש: GET handler לשליפת הסטטוס
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: {
        availabilityStatus: true,
        availabilityNote: true,
      }
    });

    return NextResponse.json({
      success: true,
      availabilityStatus: profile?.availabilityStatus || 'AVAILABLE',
      availabilityNote: profile?.availabilityNote || null,
    });

  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch status" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await req.json() as UpdateAvailabilityRequest;

    const updatedProfile = await prisma.profile.update({
      where: { userId: session.user.id },
      data: {
        availabilityStatus: data.availabilityStatus,
        availabilityNote: data.availabilityNote || null,
        updatedAt: new Date()
      },
      // ✅ מחזיר רק את מה שצריך
      select: {
        availabilityStatus: true,
        availabilityNote: true,
      }
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({
      success: true,
      availabilityStatus: updatedProfile.availabilityStatus,
      availabilityNote: updatedProfile.availabilityNote,
    });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update status" },
      { status: 500 }
    );
  }
}