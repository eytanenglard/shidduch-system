// src/app/api/profile/images/[imageId]/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

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
  props: { params: Promise<{ imageId: string }> } // ✅ שינוי: התאמה ל-Next.js 15
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const params = await props.params; // ✅ שינוי: הוספת await
    const { imageId } = params;
    
    const image = await prisma.userImage.findUnique({
      where: { id: imageId },
      include: { user: true },
    });

    if (!image) {
      return NextResponse.json(
        { success: false, error: "Image not found" }, 
        { status: 404 }
      );
    }

    if (image.user.email !== session.user.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" }, 
        { status: 403 }
      );
    }

    if (image.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(image.cloudinaryPublicId);
      } catch (error) {
        console.error("[Delete Image] Cloudinary deletion error:", error);
      }
    }

    await prisma.userImage.delete({
      where: { id: imageId },
    });

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
  props: { params: Promise<{ imageId: string }> } // ✅ שינוי: התאמה ל-Next.js 15
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const params = await props.params; // ✅ שינוי: הוספת await
    const { imageId } = params;

    const image = await prisma.userImage.findUnique({
      where: { id: imageId },
      include: { user: true },
    });

    if (!image) {
      return NextResponse.json(
        { success: false, error: "Image not found" }, 
        { status: 404 }
      );
    }

    if (image.user.email !== session.user.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" }, 
        { status: 403 }
      );
    }

    await prisma.userImage.updateMany({
      where: { userId: image.userId },
      data: { isMain: false },
    });

    await prisma.userImage.update({
      where: { id: imageId },
      data: { isMain: true },
    });

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