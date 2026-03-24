// src/app/api/user/unsubscribe/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, JWTPayload } from 'jose';
import prisma from '@/lib/prisma';

interface UnsubscribeTokenPayload extends JWTPayload {
  userId: string;
  email: string;
}

async function processUnsubscribe(token: string) {
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
  if (!secret) {
    console.error("FATAL: NEXTAUTH_SECRET is not defined.");
    throw new Error("Server configuration error.");
  }

  const { payload } = await jwtVerify(token, secret);
  const { userId, email } = payload as UnsubscribeTokenPayload;

  if (!userId || !email) {
    throw new Error("Invalid token payload.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true }
  });

  if (!user || user.email !== email) {
    throw new Error("User not found or token mismatch.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      engagementEmailsConsent: false,
      promotionalEmailsConsent: false,
    },
  });

  console.log(`[Unsubscribe] User ${userId} has successfully unsubscribed from engagement mailings.`);
}

function handleError(error: unknown) {
  console.error('Error during unsubscribe process:', error);
  let errorMessage = 'The unsubscribe link is invalid or has expired.';

  if (error instanceof Error) {
    if (error.name === 'JWTExpired') {
      errorMessage = 'This unsubscribe link has expired. Please use the link from a more recent email.';
    } else if (error.message.includes('User not found')) {
      errorMessage = 'The user associated with this link could not be found.';
    }
  }

  return errorMessage;
}

// POST — called by the UnsubscribeClient UI component
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required.' }, { status: 400 });
    }

    await processUnsubscribe(token);
    return NextResponse.json({ success: true, message: 'Successfully unsubscribed.' });

  } catch (error) {
    const errorMessage = handleError(error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}

// GET — supports RFC 8058 List-Unsubscribe one-click and direct link fallback
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required.' }, { status: 400 });
    }

    await processUnsubscribe(token);
    return NextResponse.json({ success: true, message: 'Successfully unsubscribed.' });

  } catch (error) {
    const errorMessage = handleError(error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}
