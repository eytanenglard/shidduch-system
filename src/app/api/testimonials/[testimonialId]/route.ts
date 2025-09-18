// src/app/api/testimonials/[testimonialId]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { jwtVerify, JWTPayload } from 'jose';

interface TokenPayload extends JWTPayload {
  profileId: string;
}

export async function POST(req: Request, { params }: { params: { testimonialId: string } }) {
  const token = params.testimonialId;
  if (!token) {
    return NextResponse.json({ success: false, message: 'Token is missing' }, { status: 400 });
  }

  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
  if (!secret) {
      console.error("FATAL: NEXTAUTH_SECRET is not defined.");
      return NextResponse.json({ success: false, message: 'Server configuration error' }, { status: 500 });
  }

  try {
    const verificationResult = await jwtVerify(token, secret);
    const payload = verificationResult.payload as TokenPayload;
    const { profileId } = payload;
    
    const body = await req.json();
    const { authorName, relationship, content, authorPhone, isPhoneVisibleToMatch } = body;

    if (!authorName || !relationship || !content) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    await prisma.friendTestimonial.create({
      data: {
        profileId,
        authorName,
        relationship,
        content,
        authorPhone: authorPhone || null,
        isPhoneVisibleToMatch: isPhoneVisibleToMatch && !!authorPhone,
        status: 'PENDING',
        submittedBy: 'FRIEND',
      },
    });

    return NextResponse.json({ success: true, message: 'Testimonial submitted successfully' });

  } catch (error) {
    console.error("Error processing testimonial submission:", error);
    if (error instanceof Error && (error.name === 'JWTExpired' || error.name === 'JWSInvalid' || error.name === 'JOSEError')) {
        return NextResponse.json({ success: false, message: 'Link is invalid or has expired.' }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}