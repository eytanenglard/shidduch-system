// src/app/api/mobile/images/route.ts
// ==========================================
// NeshamaTech Mobile API - User Images
// GET: List images | POST: Upload | DELETE: Bulk delete
// ==========================================

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from '@/lib/mobile-auth';

export const dynamic = 'force-dynamic';

// ---- Cloudinary config ----
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

function uploadToCloudinary(
  buffer: Buffer
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'profile-images', resource_type: 'image' },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Upload error:', error);
          reject(error);
        } else if (result) {
          resolve({ secure_url: result.secure_url, public_id: result.public_id });
        } else {
          reject(new Error('Upload failed - no result'));
        }
      }
    );
    uploadStream.end(buffer);
  });
}

// ---- OPTIONS ----
export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

// ---- GET: List user's images ----
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) {
      return corsError(req, 'Unauthorized', 401);
    }

    const images = await prisma.userImage.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
    });

    return corsJson(req, { success: true, images });
  } catch (error) {
    console.error('[Mobile Images GET] Error:', error);
    return corsError(req, 'Failed to fetch images', 500);
  }
}

// ---- POST: Upload image (FormData with "file" field) ----
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) {
      return corsError(req, 'Unauthorized', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, _count: { select: { images: true } } },
    });

    if (!user) {
      return corsError(req, 'User not found', 404);
    }

    // Max 5 images
    if (user._count.images >= 5) {
      return corsError(req, 'Maximum number of images reached (5)', 400);
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return corsError(req, 'No file provided', 400);
    }

    // Validate type
// src/app/api/mobile/images/route.ts
// בתוך POST:

const validTypes = [
  'image/jpeg', 
  'image/png', 
  'image/jpg', 
  'image/webp',
  'image/heic',  // ✅ iOS format
  'image/heif',  // ✅ iOS format
];
    if (!validTypes.includes(file.type)) {
      return corsError(req, 'Invalid file type. Only JPG, PNG and WEBP allowed', 400);
    }

    // Validate size (10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return corsError(req, 'File size must be less than 10MB', 400);
    }

    // Upload to Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const cloudinaryResult = await uploadToCloudinary(buffer);

    // First image => set as main
    const isFirstImage = user._count.images === 0;

    const image = await prisma.userImage.create({
      data: {
        userId: user.id,
        url: cloudinaryResult.secure_url,
        cloudinaryPublicId: cloudinaryResult.public_id,
        isMain: isFirstImage,
      },
    });

    // Update timestamps
    await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() },
    });
    await prisma.profile.update({
      where: { userId: user.id },
      data: { contentUpdatedAt: new Date() },
    });

    return corsJson(req, { success: true, image });
  } catch (error) {
    console.error('[Mobile Images POST] Error:', error);
    return corsError(req, 'Failed to upload image', 500);
  }
}

// ---- DELETE: Bulk delete images ----
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) {
      return corsError(req, 'Unauthorized', 401);
    }

    let body: { imageIds?: string[] };
    try {
      body = await req.json();
    } catch {
      return corsError(req, 'Invalid JSON body', 400);
    }

    const { imageIds } = body;
    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return corsError(req, 'imageIds must be a non-empty array', 400);
    }

    // Find images owned by this user
    const imagesToDelete = await prisma.userImage.findMany({
      where: {
        id: { in: imageIds },
        userId: auth.userId,
      },
      select: { id: true, cloudinaryPublicId: true, isMain: true },
    });

    if (imagesToDelete.length === 0) {
      return corsError(req, 'No matching images found', 404);
    }

    const wasMainDeleted = imagesToDelete.some((img) => img.isMain);

    // Delete from Cloudinary
    const publicIds = imagesToDelete
      .map((img) => img.cloudinaryPublicId)
      .filter((id): id is string => !!id);

    if (publicIds.length > 0) {
      await Promise.all(
        publicIds.map((id) =>
          cloudinary.uploader.destroy(id).catch((err) => {
            console.error(`[Mobile Images DELETE] Cloudinary error for ${id}:`, err);
          })
        )
      );
    }

    // Delete from DB
    await prisma.userImage.deleteMany({
      where: {
        id: { in: imagesToDelete.map((img) => img.id) },
        userId: auth.userId,
      },
    });

    await prisma.profile.update({
      where: { userId: auth.userId },
      data: { contentUpdatedAt: new Date() },
    });

    // If main was deleted, set newest remaining as main
    if (wasMainDeleted) {
      const newMain = await prisma.userImage.findFirst({
        where: { userId: auth.userId },
        orderBy: { createdAt: 'desc' },
      });
      if (newMain) {
        await prisma.userImage.update({
          where: { id: newMain.id },
          data: { isMain: true },
        });
      }
    }

    // Return updated list
    const updatedImages = await prisma.userImage.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
    });

    return corsJson(req, { success: true, images: updatedImages });
  } catch (error) {
    console.error('[Mobile Images DELETE] Error:', error);
    return corsError(req, 'Failed to delete images', 500);
  }
}