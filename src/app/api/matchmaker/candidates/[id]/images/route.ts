// src/app/api/matchmaker/candidates/[id]/images/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error("Missing Cloudinary environment variables");
} else {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
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

    const { id } = context.params;

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

    const formData = await req.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { success: false, error: "No image provided" },
        { status: 400 }
      );
    }

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await cloudinary.uploader.upload(
      `data:${image.type};base64,${buffer.toString('base64')}`,
      {
        folder: `shidduch-system/users/${id}`,
        resource_type: 'image',
        transformation: [
          { width: 1000, height: 1000, crop: 'limit' },
          { quality: 'auto:good' }
        ] as unknown as Record<string, unknown>
      }
    );

    const existingImages = await prisma.userImage.count({
      where: { userId: id }
    });

    const newImage = await prisma.userImage.create({
      data: {
        userId: id,
        url: uploadResult.secure_url,
        cloudinaryPublicId: uploadResult.public_id,
        isMain: existingImages === 0
      }
    });

    await prisma.profile.update({
      where: { userId: id },
      data: { lastActive: new Date() }
    });

    return NextResponse.json({
      success: true,
      image: newImage
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
