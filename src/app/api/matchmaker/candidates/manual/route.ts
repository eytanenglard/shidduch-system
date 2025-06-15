import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Your auth options
import prisma from "@/lib/prisma";
import { Gender, UserSource, UserStatus, UserRole } from '@prisma/client';
import { v2 as cloudinary } from "cloudinary"; // Import Cloudinary
import { updateUserAiProfile } from '@/lib/services/profileAiService'; // <--- 1. ייבוא

// Define the type for Cloudinary upload result for clarity
type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
};

// Configure Cloudinary
// Ensure these environment variables are set in your .env file
if (!process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET) {
  console.error("CRITICAL: Missing required Cloudinary environment variables. Image uploads will fail.");
  throw new Error("Missing required Cloudinary environment variables. Image uploads will fail.");
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
      {
        folder: `manual-candidates/${userId}/images`, // Store in a specific folder for manual candidates
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return reject(new Error("Failed to upload image to Cloudinary."));
        }
        if (!result) {
          console.error("Cloudinary upload error: No result returned.");
          return reject(new Error("Cloudinary upload failed: no result object."));
        }
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
    if (!session || !session.user ||
        (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN)) {
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

    // --- קריאת השדה החדש ---
    const birthDateIsApproximateStr = formData.get('birthDateIsApproximate') as string;
    // המרה לבוליאני, ברירת מחדל ל-false אם לא קיים או לא "true"
    const birthDateIsApproximate = birthDateIsApproximateStr === 'true';
    // --- סוף קריאת השדה החדש ---


    if (!firstName || !lastName || !gender || !birthDateStr || !manualEntryText) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const birthDate = new Date(birthDateStr);
    if (isNaN(birthDate.getTime())) {
         return NextResponse.json({ success: false, error: "Invalid birth date" }, { status: 400 });
    }

    const email = emailValue || `manual_${Date.now()}_${firstName.toLowerCase().replace(/\s+/g, '')}@shidduch.placeholder.com`;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        if (existingUser.source !== UserSource.MANUAL_ENTRY) {
            return NextResponse.json({ success: false, error: "An active user with this email already exists. Please use a different email or contact support." }, { status: 409 });
        } else {
             return NextResponse.json({ success: false, error: "A manually added candidate with this email already exists." }, { status: 409 });
        }
    }

    const newManualCandidate = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
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
            // --- הוספת השדה החדש ליצירת הפרופיל ---
            birthDateIsApproximate, // כאן מוסיפים את הערך הבוליאני
            // --- סוף הוספת השדה החדש ---
            manualEntryText,
            availabilityStatus: 'AVAILABLE',
          },
        },
      },
      include: {
        profile: true,
      },
    });

    const uploadedImageData: { url: string; publicId: string; isMain: boolean }[] = [];
    if (images && images.length > 0) {
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
          uploadedImageData.push({ url, publicId, isMain: i === 0 });
        } catch (uploadError) {
            console.error("Failed to upload an image during manual candidate creation:", uploadError);
            return NextResponse.json({
                success: false,
                error: `Failed to upload image ${images[i].name}. ${(uploadError as Error).message}`
            }, { status: 500 });
        }
      }

      if (uploadedImageData.length > 0) {
        await prisma.userImage.createMany({
          data: uploadedImageData.map(img => ({
            userId: newManualCandidate.id,
            url: img.url,
            cloudinaryPublicId: img.publicId,
            isMain: img.isMain,
          })),
        });
      }
    }
   
    // --- START OF NEW CODE ---
    // 2. הפעלת יצירת פרופיל ה-AI עבור המועמד החדש
    updateUserAiProfile(newManualCandidate.id).catch(err => {
        console.error(`[AI Profile Trigger - Manual Creation] Failed to create initial AI profile in the background for new manual candidate ${newManualCandidate.id}:`, err);
    });
    // --- END OF NEW CODE ---
    const candidateToReturn = await prisma.user.findUnique({
        where: { id: newManualCandidate.id },
        include: {
            profile: true,
            images: true,
        }
    });

    return NextResponse.json({ success: true, candidate: candidateToReturn });

  } catch (error) {
    console.error("Error in POST /api/matchmaker/candidates/manual:", error);
    let errorMessage = "שגיאה פנימית בשרת.";
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