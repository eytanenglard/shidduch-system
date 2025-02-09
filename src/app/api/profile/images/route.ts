// src/app/api/profile/images/route.ts
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

// GET - Fetch all images for a user
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userImages = await prisma.userImage.findMany({
      where: { 
        user: {
          email: session.user.email 
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ success: true, images: userImages });
  } catch (error) {
    console.error("[GetImages] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}

// POST - Upload a new image
export async function POST(req: Request) {
  try {
    console.log("[Upload] Starting upload process");
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error("[Upload] Authentication failed - No user session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { images: true },
    });

    if (!user) {
      console.error(`[Upload] User not found for email: ${session.user.email}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.images.length >= 5) {
      console.warn(`[Upload] User ${user.id} has reached maximum images limit`);
      return NextResponse.json(
        { error: "Maximum number of images reached" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      console.error("[Upload] No file provided in request");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      console.error(`[Upload] Invalid file type: ${file.type}`);
      return NextResponse.json(
        { error: "Invalid file type. Only JPG and PNG are allowed" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      console.error(`[Upload] File too large: ${file.size} bytes`);
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    try {
      const uploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "profile-images",
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });

      const result = await uploadPromise as any;

      const image = await prisma.userImage.create({
        data: {
          userId: user.id,
          url: result.secure_url,
          cloudinaryPublicId: result.public_id,
          isMain: user.images.length === 0,
        },
      });

      return NextResponse.json({ success: true, image });
    } catch (cloudinaryError) {
      console.error("[Upload] Cloudinary upload failed:", cloudinaryError);
      return NextResponse.json(
        { error: "Failed to upload image to cloud storage" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Upload] General error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}