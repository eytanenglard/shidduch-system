// src/app/api/matchmaker/candidates/[id]/images/[imageId]/main/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    const allowedRoles: UserRole[] = [UserRole.MATCHMAKER, UserRole.ADMIN];
    if (!user || !allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Matchmaker or Admin access required" },
        { status: 403 }
      );
    }
    
    // Await params before destructuring
    const params = await props.params;
    const { id, imageId } = params;

    const candidate = await prisma.user.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!candidate) {
      return NextResponse.json(
        { success: false, error: "Candidate not found" },
        { status: 404 }
      );
    }

    const imageToSetMain = await prisma.userImage.findFirst({
      where: {
        id: imageId,
        userId: id
      }
    });

    if (!imageToSetMain) {
      return NextResponse.json(
        { success: false, error: "Image not found" },
        { status: 404 }
      );
    }

    await prisma.$transaction([
      prisma.userImage.updateMany({
        where: { 
            userId: id,
            id: { not: imageId }
        },
        data: { isMain: false }
      }),
      
      prisma.userImage.update({
        where: { id: imageId },
        data: { isMain: true }
      })
    ]);

    await prisma.profile.update({
      where: { userId: id },
      data: { lastActive: new Date() }
    });

    return NextResponse.json({
      success: true,
      message: "Main image updated successfully"
    });
  } catch (error) {
    console.error("Error setting main image:", error);
    return NextResponse.json(
      { success: false, error: "Failed to set main image" },
      { status: 500 }
    );
  }
}