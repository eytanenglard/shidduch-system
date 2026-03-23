// =============================================================================
// Messages Media Upload API
// Path: src/app/api/messages/media/route.ts
// =============================================================================
//
// POST — Upload media (image) to Cloudinary for use in messages
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Cloudinary configuration
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
          console.error('[Cloudinary] Message media upload error:', error);
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

// Zod schema for validating the content type query param
const contentTypeSchema = z.enum(['IMAGE', 'VOICE']).default('IMAGE');

// ==========================================
// POST — Upload media for messages
// ==========================================
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate content type from form data
    const rawContentType = formData.get('contentType') as string | null;
    const contentTypeParsed = contentTypeSchema.safeParse(rawContentType || 'IMAGE');
    if (!contentTypeParsed.success) {
      return NextResponse.json(
        { error: 'Invalid content type. Must be IMAGE or VOICE.' },
        { status: 400 }
      );
    }
    const contentType = contentTypeParsed.data;

    // Max file size: 10MB
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Validate file type based on content type
    if (contentType === 'IMAGE') {
      const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
      if (!validImageTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'Invalid file type. Only JPG, PNG, WEBP and GIF are allowed for images.' },
          { status: 400 }
        );
      }
    } else if (contentType === 'VOICE') {
      const validAudioTypes = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav'];
      if (!validAudioTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'Invalid file type for voice message.' },
          { status: 400 }
        );
      }
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const resourceType = contentType === 'VOICE' ? 'video' : 'image';
    const result = await uploadToCloudinary(buffer, resourceType);

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      type: contentType,
    });
  } catch (error) {
    console.error('[MessageMedia] Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    );
  }
}
