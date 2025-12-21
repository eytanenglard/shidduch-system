// src/app/api/feedback/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { v2 as cloudinary } from 'cloudinary';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import prisma from '@/lib/prisma';
import { FeedbackType } from '@prisma/client';
import { emailService } from '@/lib/email/emailService';

// The Redis and Rate Limiter configurations remain at the global level. This is correct.
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.warn('Upstash Redis credentials are not configured. Rate limiting will not be active.');
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
});

export async function POST(req: NextRequest) {
  // --- Start of the critical fix ---
  // The Cloudinary configuration is set within the POST function.
  // This ensures that every time the API is called (in a Serverless environment),
  // the environment variables will be loaded and available to the code before they are used.
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  // --- End of the critical fix ---

  // Rate Limiting Logic
  if (process.env.NODE_ENV === 'production' && process.env.UPSTASH_REDIS_REST_URL) {
    try {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      // --- FIX: Accessing the 'x-forwarded-for' header to get the IP address ---
      const ip = (req.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0];
      const identifier = token?.sub ?? ip;
      const { success } = await ratelimit.limit(identifier);

      if (!success) {
        return new NextResponse('Too many requests. Please try again later.', { status: 429 });
      }
    } catch (e) {
        console.error("Error with rate limiter:", e);
    }
  }

  try {
    const formData = await req.formData();
    const content = formData.get('content') as string;
    const feedbackType = formData.get('feedbackType') as FeedbackType;
    const pageUrl = formData.get('pageUrl') as string;
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const screenshot = formData.get('screenshot') as File | null;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!content || !feedbackType || !pageUrl) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    let screenshotUrl: string | undefined = undefined;

    if (screenshot) {
      // Explicit check of environment variables before attempting upload
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
          const errorMsg = "Server configuration error: Cloudinary environment variables are missing at the time of upload.";
          console.error(`CRITICAL: ${errorMsg}`);
          return NextResponse.json({ success: false, error: "Server configuration error preventing image upload." }, { status: 500 });
      }
        
      const bytes = await screenshot.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadResult = await new Promise<{ secure_url?: string; error?: any }>((resolve) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'feedback_screenshots', resource_type: 'image' },
          (error, result) => {
            if (error) resolve({ error });
            else if (result) resolve({ secure_url: result.secure_url });
            else resolve({ error: new Error('Cloudinary returned no result or error.') });
          }
        );
        uploadStream.end(buffer);
      });

      if (uploadResult.error) {
        console.error('Failed to upload screenshot to Cloudinary:', uploadResult.error);
      } else if (uploadResult.secure_url) {
        screenshotUrl = uploadResult.secure_url;
      }
    }

    const newFeedback = await prisma.feedback.create({
      data: {
        userId: token?.sub,
        content,
        feedbackType,
        pageUrl,
        userAgent,
        screenshotUrl,
      },
      include: { user: { select: { firstName: true, lastName: true, email: true } } }
    });

    try {
      const adminEmail = "neshamatech.jsmatch@gmail.com";
      const userIp = (req.headers.get('x-forwarded-for') ?? 'N/A').split(',')[0];
      const userIdentifier = newFeedback.user 
        ? `${newFeedback.user.firstName} ${newFeedback.user.lastName} (${newFeedback.user.email})`
        : `Anonymous User (IP: ${userIp})`;

      await emailService.sendEmail({
        to: adminEmail,
        subject: `New Feedback Received (${feedbackType}): ${userIdentifier}`,
        templateName: 'internal-feedback-notification',
        context: {
          feedbackType: feedbackType,
          userIdentifier: userIdentifier,
          content: content,
          pageUrl: pageUrl,
          screenshotUrl: screenshotUrl,
          feedbackId: newFeedback.id,
        }
      });
      console.log(`Feedback notification sent successfully to ${adminEmail}`);
    } catch (emailError) {
      console.error("Failed to send feedback notification email, but feedback was saved to DB. Error:", emailError);
    }

    return NextResponse.json({ success: true, message: 'Feedback submitted successfully' });

  } catch (error) {
    console.error('Fatal error in feedback submission process:', error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ success: false, error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}