// src/app/api/feedback/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { v2 as cloudinary } from 'cloudinary';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis'; // <-- שינוי: ייבוא הלקוח של Upstash
import prisma from '@/lib/prisma';
import { FeedbackType } from '@prisma/client';

// Configure Cloudinary (נשאר זהה)
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- התחברות ל-Redis והגדרת Rate Limiter (זה החלק שהשתנה) ---
// ודא שמשתני הסביבה מוגדרים
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('Upstash Redis credentials are not configured in environment variables');
}

// יצירת לקוח Redis חדש
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// הגדרת Rate Limiter: 5 בקשות בשעה מאותו מזהה
const ratelimit = new Ratelimit({
  redis: redis, // שימוש בלקוח החדש
  limiter: Ratelimit.slidingWindow(5, '1 h'),
});
// --- סוף החלק שהשתנה ---

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const ip = req.ip ?? '127.0.0.1';
  
  const identifier = token?.sub ?? ip;
  const { success } = await ratelimit.limit(identifier);

  if (!success) {
    return new NextResponse('Too many requests. Please try again later.', { status: 429 });
  }

  try {
    const formData = await req.formData();
    const content = formData.get('content') as string;
    const feedbackType = formData.get('feedbackType') as FeedbackType;
    const pageUrl = formData.get('pageUrl') as string;
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const screenshot = formData.get('screenshot') as File | null;

    if (!content || !feedbackType || !pageUrl) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    let screenshotUrl: string | undefined = undefined;

    if (screenshot) {
      const bytes = await screenshot.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // --- התיקון המרכזי: הגדרת טיפוסים נכונה ל-Promise ---
      const uploadResult = await new Promise<{ secure_url?: string; error?: any }>((resolve) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'feedback_screenshots',
            resource_type: 'image',
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              resolve({ error }); // החזר אובייקט עם שגיאה
            }
            if (result) {
              resolve({ secure_url: result.secure_url }); // החזר אובייקט עם ה-URL
            } else {
              // מקרה קצה שבו אין שגיאה ואין תוצאה
              resolve({ error: new Error('Cloudinary returned no result or error.') });
            }
          }
        );
        uploadStream.end(buffer);
      });

      if (uploadResult.error) {
        // אם הייתה שגיאה בהעלאה, נרשום אותה ביומן אך לא נעצור את שליחת המשוב
        console.error('Failed to upload screenshot to Cloudinary:', uploadResult.error);
        // אפשר להוסיף כאן לוגיקה לשליחת התראה למערכת ניטור אם יש לך
      } else if (uploadResult.secure_url) {
        screenshotUrl = uploadResult.secure_url;
      }
    }

    await prisma.feedback.create({
      data: {
        userId: token?.sub,
        content,
        feedbackType,
        pageUrl,
        userAgent,
        screenshotUrl, // השדה הזה יהיה `undefined` אם ההעלאה נכשלה, וזה בסדר
      },
    });

    return NextResponse.json({ success: true, message: 'Feedback submitted successfully' });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }

}