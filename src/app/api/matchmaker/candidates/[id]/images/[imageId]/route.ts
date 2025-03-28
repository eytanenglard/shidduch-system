// /api/matchmaker/candidates/[id]/images/[imageId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// DELETE request handler for deleting an image
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify that the user is a matchmaker
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || user.role !== UserRole.MATCHMAKER) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Matchmaker access required" },
        { status: 403 }
      );
    }

    // Get params
    const { id, imageId } = params;

    console.log(`Handling DELETE request for candidate ${id}, image ${imageId}`);

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

    // Find the image
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

    // Check if this is the main image and there are other images
    if (image.isMain) {
      const otherImage = await prisma.userImage.findFirst({
        where: {
          userId: id,
          id: { not: imageId }
        },
        orderBy: { createdAt: 'desc' }
      });

      // If there are other images, set the most recent one as main
      if (otherImage) {
        console.log(`Setting image ${otherImage.id} as new main image`);
        await prisma.userImage.update({
          where: { id: otherImage.id },
          data: { isMain: true }
        });
      }
    }

    // Delete from Cloudinary
    if (image.cloudinaryPublicId) {
      try {
        console.log(`Deleting from Cloudinary: ${image.cloudinaryPublicId}`);
        await cloudinary.uploader.destroy(image.cloudinaryPublicId);
      } catch (cloudinaryError) {
        console.error("Cloudinary deletion error:", cloudinaryError);
        // Continue with DB deletion even if Cloudinary fails
      }
    }

    // Delete from database
    await prisma.userImage.delete({
      where: { id: imageId }
    });

    // Update lastActive timestamp
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