// src/app/api/mobile/images/[imageId]/route.ts
// ==========================================
// NeshamaTech Mobile API - Single Image Actions
// PUT: Set as main | DELETE: Delete single image
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

// Cloudinary config
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

// ---- OPTIONS ----
export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

// ---- PUT: Set image as main ----
export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ imageId: string }> }
) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) {
      return corsError(req, 'Unauthorized', 401);
    }

    const { imageId } = await props.params;

    const image = await prisma.userImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return corsError(req, 'Image not found', 404);
    }

    if (image.userId !== auth.userId) {
      return corsError(req, 'Unauthorized', 403);
    }

    // Unset all as main, then set this one
    await prisma.userImage.updateMany({
      where: { userId: auth.userId },
      data: { isMain: false },
    });

    await prisma.userImage.update({
      where: { id: imageId },
      data: { isMain: true },
    });

    const updatedImages = await prisma.userImage.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
    });

    return corsJson(req, { success: true, images: updatedImages });
  } catch (error) {
    console.error('[Mobile Images PUT] Error:', error);
    return corsError(req, 'Failed to set main image', 500);
  }
}

// ---- DELETE: Delete single image ----
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ imageId: string }> }
) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) {
      return corsError(req, 'Unauthorized', 401);
    }

    const { imageId } = await props.params;

    const image = await prisma.userImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return corsError(req, 'Image not found', 404);
    }

    if (image.userId !== auth.userId) {
      return corsError(req, 'Unauthorized', 403);
    }

    // Delete from Cloudinary
    if (image.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(image.cloudinaryPublicId);
      } catch (err) {
        console.error('[Mobile Images DELETE] Cloudinary error:', err);
      }
    }

    // Delete from DB
    await prisma.userImage.delete({ where: { id: imageId } });

    await prisma.profile.update({
      where: { userId: auth.userId },
      data: { contentUpdatedAt: new Date() },
    });

    // If main was deleted, set newest remaining
    if (image.isMain) {
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

    return corsJson(req, { success: true });
  } catch (error) {
    console.error('[Mobile Images DELETE] Error:', error);
    return corsError(req, 'Failed to delete image', 500);
  }
}