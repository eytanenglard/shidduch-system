// src/app/api/profile/images/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  throw new Error('Missing required Cloudinary environment variables');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// פונקציה עוטפת ל-Upload עם Promise נכון
function uploadToCloudinary(
  buffer: Buffer
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'profile-images',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Upload error:', error);
          reject(error);
        } else if (result) {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        } else {
          reject(new Error('Upload failed - no result'));
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userImages = await prisma.userImage.findMany({
      where: {
        user: {
          email: session.user.email,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, images: userImages });
  } catch (error) {
    console.error('[GetImages] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}

// POST - Upload new images (can be adapted for multiple files)
export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    console.log('[Upload] Starting upload process');

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error('[Upload] Authentication failed - No user session');
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, _count: { select: { images: true } } },
    });

    if (!user) {
      console.error(`[Upload] User not found for email: ${session.user.email}`);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('[Upload] No file provided in request');
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (user._count.images >= 5) {
      console.warn(`[Upload] User ${user.id} has reached maximum images limit`);
      return NextResponse.json(
        { success: false, error: 'Maximum number of images reached' },
        { status: 400 }
      );
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      console.error(`[Upload] Invalid file type: ${file.type}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type. Only JPG, PNG and WEBP are allowed',
        },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      console.error(`[Upload] File too large: ${file.size} bytes`);
      return NextResponse.json(
        { success: false, error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log(`[Upload] File processed, uploading to Cloudinary...`);

    const cloudinaryResult = await uploadToCloudinary(buffer);

    const isFirstImage = user._count.images === 0;

    const image = await prisma.userImage.create({
      data: {
        userId: user.id,
        url: cloudinaryResult.secure_url,
        cloudinaryPublicId: cloudinaryResult.public_id,
        isMain: isFirstImage,
      },
    });

    console.log(
      `[Upload] Database save completed in ${Date.now() - startTime}ms`
    );
    return NextResponse.json({
      success: true,
      image,
      timing: `${Date.now() - startTime}ms`,
    });
  } catch (error) {
    console.error('[Upload] General error:', error);
    console.log(`[Upload] Failed after ${Date.now() - startTime}ms`);
    return NextResponse.json(
      { success: false, error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

// --- NEW ---
// DELETE - Bulk delete images
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const userId = session.user.id;

    const { imageIds } = await req.json();

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Image IDs must be a non-empty array' },
        { status: 400 }
      );
    }

    // 1. Find images to verify ownership and get necessary data
    const imagesToDelete = await prisma.userImage.findMany({
      where: {
        id: { in: imageIds },
        userId: userId, // CRUCIAL: Ensures user only deletes their own images
      },
      select: {
        id: true,
        cloudinaryPublicId: true,
        isMain: true,
      },
    });

    if (imagesToDelete.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No matching images found to delete.' },
        { status: 404 }
      );
    }

    // 2. Check if the main image is being deleted
    const wasMainImageDeleted = imagesToDelete.some((image) => image.isMain);

    // 3. Delete from Cloudinary
    const cloudinaryIdsToDelete = imagesToDelete
      .map((image) => image.cloudinaryPublicId)
      .filter((id): id is string => !!id);

    if (cloudinaryIdsToDelete.length > 0) {
      const cloudinaryDeletions = cloudinaryIdsToDelete.map((publicId) =>
        cloudinary.uploader.destroy(publicId).catch((err) => {
          console.error(
            `[Bulk Delete] Failed to delete image ${publicId} from Cloudinary:`,
            err
          );
        })
      );
      await Promise.all(cloudinaryDeletions);
    }

    // 4. Delete from database
    await prisma.userImage.deleteMany({
      where: {
        id: { in: imagesToDelete.map((img) => img.id) }, // Use validated IDs
        userId: userId,
      },
    });

    // 5. If main image was deleted, assign a new one if possible
    if (wasMainImageDeleted) {
      const newMainImage = await prisma.userImage.findFirst({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
      });

      if (newMainImage) {
        await prisma.userImage.update({
          where: { id: newMainImage.id },
          data: { isMain: true },
        });
      }
    }

    // 6. Fetch the updated list of images to return to the client
    const updatedImages = await prisma.userImage.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, images: updatedImages });
  } catch (error) {
    console.error('[Bulk Delete Images] Error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete images',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
