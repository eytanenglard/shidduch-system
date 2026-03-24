// =============================================================================
// src/app/api/mobile/messages/media/route.ts
// =============================================================================
//
// OPTIONS + POST — Upload media (image/voice) to Cloudinary for messages
//
// Mobile mirror of /api/messages/media with JWT auth.
// Accepts FormData with `file` and `contentType` (IMAGE/VOICE). Max 10MB.
// =============================================================================

import { NextRequest } from 'next/server';
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from '@/lib/mobile-auth';
import { v2 as cloudinary } from 'cloudinary';
import { z } from 'zod';

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Upload helper — wraps stream in a Promise
function uploadToCloudinary(
  buffer: Buffer,
  resourceType: 'image' | 'video' = 'image'
): Promise<{ secure_url: string; public_id: string; resource_type: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'message-media',
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Mobile message media upload error:', error);
          reject(error);
        } else if (result) {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            resource_type: result.resource_type,
          });
        } else {
          reject(new Error('Upload failed - no result'));
        }
      }
    );
    uploadStream.end(buffer);
  });
}

// Zod schema for validating the content type
const contentTypeSchema = z.enum(['IMAGE', 'VOICE']).default('IMAGE');

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

// ==========================================
// POST — Upload media for messages
// ==========================================
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return corsError(req, 'No file provided', 400);
    }

    // Validate content type from form data
    const rawContentType = formData.get('contentType') as string | null;
    const contentTypeParsed = contentTypeSchema.safeParse(rawContentType || 'IMAGE');
    if (!contentTypeParsed.success) {
      return corsError(req, 'Invalid content type. Must be IMAGE or VOICE.', 400);
    }
    const contentType = contentTypeParsed.data;

    // Max file size: 10MB
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return corsError(req, 'File size must be less than 10MB', 400);
    }

    // Validate file type based on content type
    if (contentType === 'IMAGE') {
      const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
      if (!validImageTypes.includes(file.type)) {
        return corsError(
          req,
          'Invalid file type. Only JPG, PNG, WEBP and GIF are allowed for images.',
          400
        );
      }
    } else if (contentType === 'VOICE') {
      const validAudioTypes = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav'];
      if (!validAudioTypes.includes(file.type)) {
        return corsError(req, 'Invalid file type for voice message.', 400);
      }
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const resourceType = contentType === 'VOICE' ? 'video' : 'image';
    const result = await uploadToCloudinary(buffer, resourceType);

    return corsJson(req, {
      success: true,
      url: result.secure_url,
      type: contentType,
    });
  } catch (error) {
    console.error('[mobile/messages/media] Upload error:', error);
    return corsError(req, 'Failed to upload media', 500);
  }
}
