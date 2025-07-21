// src/app/api/profile/images/route.ts - גרסה פשוטה שעובדת
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
  secure: true,
});

// פונקציה עוטפת ל-Upload עם Promise נכון
function uploadToCloudinary(buffer: Buffer): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "profile-images",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          console.error("[Cloudinary] Upload error:", error);
          reject(error);
        } else if (result) {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        } else {
          reject(new Error("Upload failed - no result"));
        }
      }
    );
    uploadStream.end(buffer);
  });
}

// GET - Fetch all images for a user
export async function GET() {
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

// POST - Upload a new image מותאם ל-Heroku
export async function POST(req: Request) {
  const startTime = Date.now();
  
  try {
    console.log("[Upload] Starting upload process");
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error("[Upload] Authentication failed - No user session");
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    // שאילתה מהירה יותר - רק הנתונים שאנחנו צריכים
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        _count: {
          select: {
            images: true
          }
        }
      },
    });

    if (!user) {
      console.error(`[Upload] User not found for email: ${session.user.email}`);
      return NextResponse.json({ 
        success: false, 
        error: "User not found" 
      }, { status: 404 });
    }

    if (user._count.images >= 5) {
      console.warn(`[Upload] User ${user.id} has reached maximum images limit`);
      return NextResponse.json({
        success: false,
        error: "Maximum number of images reached"
      }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      console.error("[Upload] No file provided in request");
      return NextResponse.json({ 
        success: false, 
        error: "No file provided" 
      }, { status: 400 });
    }

    // אימות קובץ מהיר
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      console.error(`[Upload] Invalid file type: ${file.type}`);
      return NextResponse.json({
        success: false,
        error: "Invalid file type. Only JPG, PNG and WEBP are allowed"
      }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      console.error(`[Upload] File too large: ${file.size} bytes`);
      return NextResponse.json({
        success: false,
        error: "File size must be less than 5MB"
      }, { status: 400 });
    }

    // המרה לבאפר
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log(`[Upload] File processed in ${Date.now() - startTime}ms, uploading to Cloudinary...`);

    // העלאה לCloudinary עם timeout
    let cloudinaryResult: { secure_url: string; public_id: string };
    try {
      cloudinaryResult = await uploadToCloudinary(buffer);
      console.log(`[Upload] Cloudinary upload completed in ${Date.now() - startTime}ms`);
    } catch (cloudinaryError) {
      console.error("[Upload] Cloudinary upload failed:", cloudinaryError);
      return NextResponse.json({
        success: false,
        error: "Failed to upload image to cloud storage"
      }, { status: 500 });
    }

    // בדיקה אם זו התמונה הראשונה (שאילתה מהירה)
    const isFirstImage = user._count.images === 0;

    // שמירה בבסיס הנתונים
    try {
      const image = await prisma.userImage.create({
        data: {
          userId: user.id,
          url: cloudinaryResult.secure_url,
          cloudinaryPublicId: cloudinaryResult.public_id,
          isMain: isFirstImage,
        },
      });

      console.log(`[Upload] Database save completed in ${Date.now() - startTime}ms`);
      
      return NextResponse.json({ 
        success: true, 
        image,
        timing: `${Date.now() - startTime}ms`
      });
    } catch (dbError) {
      console.error("[Upload] Database save failed:", dbError);
      
      // אם שמירת הDB נכשלה, נסה למחוק מCloudinary
      try {
        await cloudinary.uploader.destroy(cloudinaryResult.public_id);
        console.log("[Upload] Cleaned up Cloudinary image after DB failure");
      } catch (cleanupError) {
        console.error("[Upload] Cleanup failed:", cleanupError);
      }
      
      return NextResponse.json({
        success: false,
        error: "Failed to save image metadata"
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error("[Upload] General error:", error);
    console.log(`[Upload] Failed after ${Date.now() - startTime}ms`);
    return NextResponse.json({
      success: false,
      error: "Failed to upload image"
    }, { status: 500 });
  }
}