import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify that the user is a matchmaker OR an admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    // ---- START OF CHANGE ----
    const allowedRoles: UserRole[] = [UserRole.MATCHMAKER, UserRole.ADMIN];
    if (!user || !allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Matchmaker or Admin access required" },
        { status: 403 }
      );
    }
    // ---- END OF CHANGE ----

    // Get params
    const { id, imageId } = params;

    // Verify candidate exists
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

    // Verify image exists and belongs to candidate
    const imageToSetMain = await prisma.userImage.findFirst({ // Renamed variable for clarity
      where: {
        id: imageId,
        userId: id
      }
    });

    if (!imageToSetMain) { // Used the new variable name
      return NextResponse.json(
        { success: false, error: "Image not found" },
        { status: 404 }
      );
    }

    // Start a transaction to update main image
    await prisma.$transaction([
      // First, unset all other images as main for this user
      prisma.userImage.updateMany({
        where: { 
            userId: id,
            id: { not: imageId } // Don't unset the one we are about to set
        },
        data: { isMain: false }
      }),
      
      // Then, set the specified image as main
      prisma.userImage.update({
        where: { id: imageId },
        data: { isMain: true }
      })
    ]);

    // Update lastActive timestamp
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