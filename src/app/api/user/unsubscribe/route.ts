// src/app/api/user/unsubscribe/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, JWTPayload } from 'jose';
import prisma from '@/lib/prisma';

interface UnsubscribeTokenPayload extends JWTPayload {
  userId: string;
  email: string;
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required.' }, { status: 400 });
    }

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

    // This is the core action: update the consent fields
    await prisma.user.update({
      where: { id: userId },
      data: {
        engagementEmailsConsent: false, // Set to false
        // We can also set promotional to false as a safety measure
        promotionalEmailsConsent: false, 
      },
    });
    
    console.log(`[Unsubscribe] User ${userId} (${email}) has successfully unsubscribed from engagement mailings.`);

    return NextResponse.json({ success: true, message: 'Successfully unsubscribed.' });

  } catch (error) {
    console.error('Error during unsubscribe process:', error);
    let errorMessage = 'The unsubscribe link is invalid or has expired.';
    
    if (error instanceof Error) {
        if (error.name === 'JWTExpired') {
            errorMessage = 'This unsubscribe link has expired. Please use the link from a more recent email.';
        } else if (error.message.includes('User not found')) {
            errorMessage = 'The user associated with this link could not be found.';
        }
    }
    
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}