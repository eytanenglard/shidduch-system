import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Your auth options
import prisma from "@/lib/prisma";
import { Gender, UserSource, UserStatus, UserRole } from '@prisma/client';
import { v2 as cloudinary } from "cloudinary"; // Import Cloudinary

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
  // Throwing an error here will prevent the API route from loading if Cloudinary is not configured.
  // This is generally a good practice for critical configurations.
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
        // You can add other Cloudinary upload options here if needed
        // e.g., transformations, tags, etc.
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
        // Assert result type for TypeScript
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
    const images = formData.getAll('images') as File[]; // Array of File objects

    if (!firstName || !lastName || !gender || !birthDateStr || !manualEntryText) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }
    
    const birthDate = new Date(birthDateStr);
    if (isNaN(birthDate.getTime())) {
         return NextResponse.json({ success: false, error: "Invalid birth date" }, { status: 400 });
    }

    // Generate a placeholder email if not provided
    const email = emailValue || `manual_${Date.now()}_${firstName.toLowerCase().replace(/\s+/g, '')}@shidduch.placeholder.com`;

    // Check if email (even placeholder) already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        if (existingUser.source !== UserSource.MANUAL_ENTRY) {
            return NextResponse.json({ success: false, error: "An active user with this email already exists. Please use a different email or contact support." }, { status: 409 });
        } else {
            // Potentially allow updating if it's the same matchmaker, or just error out
            // For now, let's error out to keep it simple
             return NextResponse.json({ success: false, error: "A manually added candidate with this email already exists." }, { status: 409 });
        }
    }

    const newManualCandidate = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        // No password for manual users
        role: UserRole.CANDIDATE,
        status: UserStatus.ACTIVE, // Manually added users are active by default
        isVerified: true,          // Verified by the matchmaker adding them
        isPhoneVerified: false,    // No phone to verify
        isProfileComplete: true,   // Considered complete for a manual user
        source: UserSource.MANUAL_ENTRY,
        addedByMatchmakerId: matchmakerId,
        profile: {
          create: {
            gender,
            birthDate,
            manualEntryText,
            availabilityStatus: 'AVAILABLE', // Default for new manual candidate
            // Ensure other non-nullable Profile fields have defaults or are made nullable
          },
        },
      },
      include: {
        profile: true,
      },
    });

    const uploadedImageData: { url: string; publicId: string; isMain: boolean }[] = [];
    if (images && images.length > 0) {
      // Validate image types and sizes before uploading (optional, client-side usually handles this)
      for (const file of images) {
          if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
              // Or collect all errors and return
              return NextResponse.json({ success: false, error: `Invalid file type: ${file.name}. Only JPG, PNG, WEBP allowed.` }, { status: 400 });
          }
          if (file.size > 5 * 1024 * 1024) { // 5MB limit
              return NextResponse.json({ success: false, error: `File too large: ${file.name}. Max 5MB.` }, { status: 400 });
          }
      }
      
      for (let i = 0; i < images.length; i++) {
        try {
          const { url, publicId } = await uploadImageToCloudinary(images[i], newManualCandidate.id);
          uploadedImageData.push({ url, publicId, isMain: i === 0 }); // First image is main
        } catch (uploadError) {
            console.error("Failed to upload an image during manual candidate creation:", uploadError);
            // Decide how to handle partial failures:
            // 1. Stop and return error (current approach below for simplicity)
            // 2. Continue and skip failed images
            // 3. Rollback user creation (more complex)
            // For now, if any image upload fails, we return an error.
            // You might want to delete the created user or mark it as incomplete.
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
            cloudinaryPublicId: img.publicId, // Store the Cloudinary public ID
            isMain: img.isMain,
          })),
        });
      }
    }

    // Fetch the complete candidate object to return, including images
    const candidateToReturn = await prisma.user.findUnique({
        where: { id: newManualCandidate.id },
        include: {
            profile: true,
            images: true, // Ensure images are included
        }
    });

    return NextResponse.json({ success: true, candidate: candidateToReturn });

  } catch (error) {
    console.error("Error in POST /api/matchmaker/candidates/manual:", error);
    let errorMessage = "שגיאה פנימית בשרת.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    // Specific check for JSON parsing error, which might occur with malformed FormData
    if (error instanceof SyntaxError && error.message.includes("Unexpected token") && error.message.includes("in JSON at position")) {
        errorMessage = "Invalid request body or FormData. Ensure all fields are correctly formatted.";
    } else if (error instanceof TypeError && error.message.includes("Could not parse content as FormData")) {
        errorMessage = "Invalid request format. Expected FormData.";
    }
    
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}