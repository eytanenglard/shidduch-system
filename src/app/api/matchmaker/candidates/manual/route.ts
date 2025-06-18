// src/app/api/matchmaker/candidates/manual/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Gender, UserSource, UserStatus, UserRole } from '@prisma/client';
import { v2 as cloudinary } from "cloudinary";
import { updateUserAiProfile } from '@/lib/services/profileAiService';
import { createId } from '@paralleldrive/cuid2';

// Define the type for Cloudinary upload result for clarity
type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
};

// Configure Cloudinary
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error("CRITICAL: Missing required Cloudinary environment variables.");
  throw new Error("Missing required Cloudinary environment variables.");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to upload image to Cloudinary
async function uploadImageToCloudinary(file: File, userId: string): Promise<{ url: string; publicId: string }> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: `manual-candidates/${userId}/images`, resource_type: "image" },
      (error, result) => {
        if (error) return reject(new Error("Failed to upload image to Cloudinary."));
        if (!result) return reject(new Error("Cloudinary upload failed: no result object."));
        const cloudinaryResult = result as CloudinaryUploadResult;
        resolve({ url: cloudinaryResult.secure_url, publicId: cloudinaryResult.public_id });
      }
    );
    uploadStream.end(buffer);
  });
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const matchmakerId = session.user.id;

    const formData = await request.formData();
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const emailValue = formData.get('email') as string | null;
    const gender = formData.get('gender') as Gender;
    const birthDateStr = formData.get('birthDate') as string;
    const manualEntryText = formData.get('manualEntryText') as string;
    const images = formData.getAll('images') as File[];
    const birthDateIsApproximate = formData.get('birthDateIsApproximate') === 'true';

    if (!firstName || !lastName || !gender || !birthDateStr || !manualEntryText) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const birthDate = new Date(birthDateStr);
    if (isNaN(birthDate.getTime())) {
      return NextResponse.json({ success: false, error: "Invalid birth date" }, { status: 400 });
    }

    let email: string;
    if (emailValue && emailValue.trim() !== '') {
        email = emailValue.trim().toLowerCase();
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ success: false, error: "משתמש עם כתובת אימייל זו כבר קיים במערכת." }, { status: 409 });
        }
    } else {
        email = `manual_${createId()}@shidduch.placeholder.com`;
    }

    const newManualCandidate = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: null,
        role: UserRole.CANDIDATE,
        status: UserStatus.ACTIVE,
        isVerified: true,
        isPhoneVerified: false,
        isProfileComplete: true,
        source: UserSource.MANUAL_ENTRY,
        addedByMatchmakerId: matchmakerId,
        profile: {
          create: {
            gender,
            birthDate,
            birthDateIsApproximate,
            manualEntryText,
            availabilityStatus: 'AVAILABLE',
          },
        },
      },
      include: {
        profile: true,
      },
    });

    // --- START OF FIX ---
    // 1. Define the type for the image data objects that will be created.
    type UserImageCreateInput = {
      userId: string;
      url: string;
      cloudinaryPublicId: string;
      isMain: boolean;
    };

    // 2. Explicitly type the array upon initialization to avoid the 'never[]' type inference.
    const uploadedImageData: UserImageCreateInput[] = [];
    // --- END OF FIX ---

    if (images && images.length > 0) {
      // (Optional but good practice) File validation loop
      for (const file of images) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            return NextResponse.json({ success: false, error: `Invalid file type: ${file.name}. Only JPG, PNG, WEBP allowed.` }, { status: 400 });
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            return NextResponse.json({ success: false, error: `File too large: ${file.name}. Max 5MB.` }, { status: 400 });
        }
      }
      
      for (let i = 0; i < images.length; i++) {
        try {
          const { url, publicId } = await uploadImageToCloudinary(images[i], newManualCandidate.id);
          // 3. Push an object that matches the defined type.
          uploadedImageData.push({
            userId: newManualCandidate.id,
            url: url,
            cloudinaryPublicId: publicId,
            isMain: i === 0,
          });
        } catch (uploadError) {
            console.error("Failed to upload an image during manual candidate creation:", uploadError);
            return NextResponse.json({
                success: false,
                error: `Failed to upload image ${images[i].name}. ${(uploadError as Error).message}`
            }, { status: 500 });
        }
      }

      if (uploadedImageData.length > 0) {
        // 4. The `createMany` call is now simpler and type-safe.
        await prisma.userImage.createMany({
          data: uploadedImageData,
        });
      }
    }
   
    updateUserAiProfile(newManualCandidate.id).catch(err => {
        console.error(`[AI Profile Trigger] Failed to create AI profile for manual candidate ${newManualCandidate.id}:`, err);
    });

    const candidateToReturn = await prisma.user.findUnique({
        where: { id: newManualCandidate.id },
        include: { profile: true, images: true }
    });

    return NextResponse.json({ success: true, candidate: candidateToReturn });

  } catch (error) {
    console.error("Error in POST /api/matchmaker/candidates/manual:", error);
    let errorMessage = "Internal server error.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    if (error instanceof SyntaxError && error.message.includes("Unexpected token") && error.message.includes("in JSON at position")) {
        errorMessage = "Invalid request body or FormData. Ensure all fields are correctly formatted.";
    } else if (error instanceof TypeError && error.message.includes("Could not parse content as FormData")) {
        errorMessage = "Invalid request format. Expected FormData.";
    }

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}