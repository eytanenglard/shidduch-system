// src/app/api/mobile/feedback/route.ts
// ==========================================
// NeshamaTech Mobile - Feedback API Route
// Receives feedback + optional image from mobile app
// ==========================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import prisma from '@/lib/prisma';
import { FeedbackType } from '@prisma/client';
import { emailService } from '@/lib/email/emailService';
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from '@/lib/mobile-auth'; // ← same helper as settings/route.ts

// ==========================================
// Redis / Rate Limiter (module-level is fine)
// ==========================================
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
});

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

// ==========================================
// POST /api/mobile/feedback
// Content-Type: multipart/form-data
//   - content       (string, required)
//   - feedbackType  (string, required) — 'suggestion' | 'bug' | 'positive'
//   - pageUrl       (string, required) — screen name / route sent from app
//   - screenshot    (File,   optional) — image picked from gallery
// ==========================================
export async function POST(req: NextRequest) {
  // ---- Cloudinary config (inside handler for serverless safety) ----
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  // ---- Auth (optional — anonymous feedback is allowed, same as web) ----
  // verifyMobileToken returns null if no/invalid token, so we don't hard-block here
  const auth = await verifyMobileToken(req).catch(() => null);
  const userId: string | undefined = auth?.userId ?? undefined;

  // ---- Rate limiting ----
  if (process.env.NODE_ENV === 'production' && process.env.UPSTASH_REDIS_REST_URL) {
    try {
      const ip = (req.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0];
      const identifier = userId ?? ip;
      const { success } = await ratelimit.limit(`mobile_feedback:${identifier}`);
      if (!success) {
        return corsError(req, 'Too many requests. Please try again later.', 429);
      }
    } catch (e) {
      console.error('[mobile/feedback] Rate limiter error:', e);
    }
  }

  try {
    const formData  = await req.formData();
    const content      = formData.get('content')      as string | null;
    const feedbackType = formData.get('feedbackType') as FeedbackType | null;
    const pageUrl      = formData.get('pageUrl')      as string | null;
    const screenshot   = formData.get('screenshot')   as File   | null;
    const userAgent    = req.headers.get('user-agent') || 'Mobile Unknown';

    if (!content || !feedbackType || !pageUrl) {
      return corsError(req, 'Missing required fields: content, feedbackType, pageUrl', 400);
    }

    // Validate feedbackType matches Prisma enum (uppercase)
    // FeedbackType enum values: SUGGESTION, BUG, POSITIVE
    const validTypes = Object.values(FeedbackType);
    if (!validTypes.includes(feedbackType)) {
      return corsError(
        req,
        `Invalid feedbackType. Must be one of: ${validTypes.join(', ')}`,
        400
      );
    }

    // ---- Screenshot upload (optional) ----
    let screenshotUrl: string | undefined;

    if (screenshot) {
      if (
        !process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY    ||
        !process.env.CLOUDINARY_API_SECRET
      ) {
        console.error('[mobile/feedback] Cloudinary env vars missing — skipping upload');
      } else {
        const bytes  = await screenshot.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const result = await new Promise<{ secure_url?: string; error?: unknown }>((resolve) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'feedback_screenshots/mobile', resource_type: 'image' },
            (error, res) => {
              if (error) resolve({ error });
              else if (res) resolve({ secure_url: res.secure_url });
              else resolve({ error: new Error('No result from Cloudinary') });
            }
          );
          stream.end(buffer);
        });

        if (result.error) {
          console.error('[mobile/feedback] Screenshot upload failed:', result.error);
          // Don't block submission — just save without screenshot
        } else {
          screenshotUrl = result.secure_url;
        }
      }
    }

    // ---- Save to DB ----
    const newFeedback = await prisma.feedback.create({
      data: {
        userId,
        content,
        feedbackType,
        pageUrl,
        userAgent,
        screenshotUrl,
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    // ---- Email notification (fire-and-forget) ----
    try {
      const adminEmail = 'neshamatech.jsmatch@gmail.com';
      const ip = (req.headers.get('x-forwarded-for') ?? 'N/A').split(',')[0];
      const userIdentifier = newFeedback.user
        ? `${newFeedback.user.firstName} ${newFeedback.user.lastName} (${newFeedback.user.email})`
        : `Anonymous Mobile User (IP: ${ip})`;

      await emailService.sendEmail({
        to: adminEmail,
        subject: `[Mobile] New Feedback (${feedbackType}): ${userIdentifier}`,
        templateName: 'internal-feedback-notification',
        context: {
          feedbackType,
          userIdentifier,
          content,
          pageUrl,
          screenshotUrl,
          feedbackId: newFeedback.id,
        },
      });
    } catch (emailError) {
      console.error('[mobile/feedback] Email notification failed (feedback saved):', emailError);
    }

    return corsJson(req, { success: true, message: 'Feedback submitted successfully' });

  } catch (error) {
    console.error('[mobile/feedback] Fatal error:', error);
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return corsError(req, `Internal Server Error: ${message}`, 500);
  }
}