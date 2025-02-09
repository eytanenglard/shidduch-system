import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
if (!process.env.CLOUDINARY_CLOUD_NAME || 
    !process.env.CLOUDINARY_API_KEY || 
    !process.env.CLOUDINARY_API_SECRET) {
  throw new Error("Missing required Cloudinary environment variables");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function DELETE(
  request: Request,
  { params }: { params: { imageId: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const { imageId } = params;
    
    // Find the image and include user data for ownership verification
    const image = await prisma.userImage.findUnique({
      where: { id: imageId },
      include: { user: true },
    });

    // Check if image exists
    if (!image) {
      return NextResponse.json(
        { success: false, error: "Image not found" }, 
        { status: 404 }
      );
    }

    // Verify image ownership
    if (image.user.email !== session.user.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" }, 
        { status: 403 }
      );
    }

    // Delete from Cloudinary if cloudinaryPublicId exists
    if (image.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(image.cloudinaryPublicId);
      } catch (error) {
        console.error("[Delete Image] Cloudinary deletion error:", error);
        // Continue with database deletion even if Cloudinary deletion fails
      }
    }

    // Delete from database
    await prisma.userImage.delete({
      where: { id: imageId },
    });

    // If this was the main image, set another image as main if available
    if (image.isMain) {
      const remainingImage = await prisma.userImage.findFirst({
        where: { userId: image.userId },
        orderBy: { createdAt: 'desc' },
      });

      if (remainingImage) {
        await prisma.userImage.update({
          where: { id: remainingImage.id },
          data: { isMain: true },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Delete Image] Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to delete image",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { imageId: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const { imageId } = params;

    // Find the image and include user data for ownership verification
    const image = await prisma.userImage.findUnique({
      where: { id: imageId },
      include: { user: true },
    });

    // Check if image exists
    if (!image) {
      return NextResponse.json(
        { success: false, error: "Image not found" }, 
        { status: 404 }
      );
    }

    // Verify image ownership
    if (image.user.email !== session.user.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" }, 
        { status: 403 }
      );
    }

    // Reset all user's images to non-main
    await prisma.userImage.updateMany({
      where: { userId: image.userId },
      data: { isMain: false },
    });

    // Set the selected image as main
    await prisma.userImage.update({
      where: { id: imageId },
      data: { isMain: true },
    });

    // Get updated images list
    const updatedImages = await prisma.userImage.findMany({
      where: { userId: image.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ 
      success: true, 
      images: updatedImages 
    });
  } catch (error) {
    console.error("[Set Main Image] Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to set main image",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}