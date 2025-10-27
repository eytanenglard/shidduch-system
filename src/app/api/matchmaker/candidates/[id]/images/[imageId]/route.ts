// src/app/api/matchmaker/candidates/[id]/images/[imageId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function DELETE(
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

    console.log(`Handling DELETE request for candidate ${id}, image ${imageId}`);

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

    const image = await prisma.userImage.findFirst({
      where: {
        id: imageId,
        userId: id
      }
    });

    if (!image) {
      return NextResponse.json(
        { success: false, error: "Image not found" },
        { status: 404 }
      );
    }

    console.log(`Found image to delete: ${image.id}, isMain: ${image.isMain}`);

    if (image.isMain) {
      const otherImage = await prisma.userImage.findFirst({
        where: {
          userId: id,
          id: { not: imageId }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (otherImage) {
        console.log(`Setting image ${otherImage.id} as new main image`);
        await prisma.userImage.update({
          where: { id: otherImage.id },
          data: { isMain: true }
        });
      }
    }

    if (image.cloudinaryPublicId) {
      try {
        console.log(`Deleting from Cloudinary: ${image.cloudinaryPublicId}`);
        await cloudinary.uploader.destroy(image.cloudinaryPublicId);
      } catch (cloudinaryError) {
        console.error("Cloudinary deletion error:", cloudinaryError);
      }
    }

    await prisma.userImage.delete({
      where: { id: imageId }
    });

    await prisma.profile.update({
      where: { userId: id },
      data: { lastActive: new Date() }
    });

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete image" },
      { status: 500 }
    );
  }
}