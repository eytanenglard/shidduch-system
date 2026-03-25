// src/app/api/user/opt-out-first-party/route.ts
// ════════════════════════════════════════════════════════════════
// Token-based endpoint to opt out of being first party in auto-suggestions.
// Works without login — uses signed JWT from email link.
// Supports GET (direct link from email) and POST (from UI).
// ════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, JWTPayload } from 'jose';
import prisma from '@/lib/prisma';

interface OptOutTokenPayload extends JWTPayload {
  userId: string;
  email: string;
  action: 'opt-out-first-party';
}

async function processOptOut(token: string) {
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
  if (!secret) {
    console.error('FATAL: NEXTAUTH_SECRET is not defined.');
    throw new Error('Server configuration error.');
  }

  const { payload } = await jwtVerify(token, secret);
  const { userId, email, action } = payload as OptOutTokenPayload;

  if (!userId || !email) {
    throw new Error('Invalid token payload.');
  }

  if (action !== 'opt-out-first-party') {
    throw new Error('Invalid token action.');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!user || user.email !== email) {
    throw new Error('User not found or token mismatch.');
  }

  await prisma.profile.update({
    where: { userId },
    data: { wantsToBeFirstParty: false },
  });

  console.log(`[OptOutFirstParty] User ${userId} opted out of being first party.`);
}

function handleError(error: unknown) {
  console.error('Error during opt-out-first-party process:', error);
  let errorMessage = 'הקישור אינו תקין או שפג תוקפו.';

  if (error instanceof Error) {
    if (error.name === 'JWTExpired') {
      errorMessage = 'תוקף הקישור פג. ניתן לעדכן את ההעדפה בהגדרות הפרופיל.';
    } else if (error.message.includes('User not found')) {
      errorMessage = 'המשתמש המשויך לקישור זה לא נמצא.';
    }
  }

  return errorMessage;
}

// POST — called by OptOutFirstPartyClient UI
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required.' }, { status: 400 });
    }

    await processOptOut(token);
    return NextResponse.json({ success: true, message: 'Successfully opted out of being first party.' });
  } catch (error) {
    const errorMessage = handleError(error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}

// GET — direct link from email
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required.' }, { status: 400 });
    }

    await processOptOut(token);
    return NextResponse.json({ success: true, message: 'Successfully opted out of being first party.' });
  } catch (error) {
    const errorMessage = handleError(error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}
