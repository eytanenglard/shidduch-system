// src/app/api/profile/availability/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { UpdateAvailabilityRequest, ApiResponse } from "@/types/profile";

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
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      profile: updatedProfile
    });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update status" },
      { status: 500 }
    );
  }
}