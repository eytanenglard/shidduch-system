import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";

// Define Cloudinary upload result type
type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  [key: string]: unknown;
};

// Check for required environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Validate environment variables
if (!cloudName || !apiKey || !apiSecret) {
  console.error("Missing Cloudinary environment variables");
} else {
  // Configure Cloudinary only if all values are defined
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Get candidate ID from params
    const { id } = params;

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

    // Process the form data
    const formData = await req.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { success: false, error: "No image provided" },
        { status: 400 }
      );
    }

    // Check if Cloudinary is properly configured
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { success: false, error: "Server configuration error - image upload service unavailable" },
        { status: 500 }
      );
    }

    // Convert file to base64 for Cloudinary upload
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const dataURI = `data:${image.type};base64,${base64Image}`;

    // Upload to Cloudinary using the upload_stream method (which is available in the types)
    const uploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `shidduch-system/users/${id}`,
          resource_type: 'image',
          transformation: [
            { width: 1000, height: 1000, crop: 'limit' },
            { quality: 'auto:good' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else if (result) resolve(result as CloudinaryUploadResult);
          else reject(new Error('No result from Cloudinary upload'));
        }
      );
      
      // Convert the dataURI to buffer and pipe it to the upload stream
      const bufferData = Buffer.from(dataURI.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      uploadStream.end(bufferData);
    });

    // Check if this is the first image, to make it the main image
    const existingImages = await prisma.userImage.count({
      where: { userId: id }
    });

    // Create image record in database
    const newImage = await prisma.userImage.create({
      data: {
        userId: id,
        url: uploadResult.secure_url,
        cloudinaryPublicId: uploadResult.public_id,
        isMain: existingImages === 0 // Make it main if it's the first image
      }
    });

    // Update lastActive timestamp
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