// src/app/api/profile/testimonials/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


/**
 * POST - Creates a new testimonial from a one-time use token.
 * This is used by the public testimonial submission form.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // 'token' is now the random hex string from the URL, not a JWT
    const { token, authorName, relationship, content, authorPhone, isPhoneVisibleToMatch } = body;

    // Basic validation
    if (!token || !authorName || !relationship || !content) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }

    // Use a transaction to ensure both operations (create testimonial, update token) succeed or fail together.
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find the token request. It MUST be valid and PENDING.
      const request = await tx.testimonialRequest.findUnique({
        where: {
          token: token,
          status: 'PENDING',
          expiresAt: { gt: new Date() },
        },
      });

      // If no valid request is found, throw an error to abort the transaction.
      if (!request) {
        throw new Error('Invalid, expired, or already used link.');
      }

      // 2. Create the actual testimonial record.
      const testimonial = await tx.friendTestimonial.create({
        data: {
          profileId: request.profileId,
          authorName,
          relationship,
          content,
          authorPhone: authorPhone || null,
          isPhoneVisibleToMatch: isPhoneVisibleToMatch || false,
          status: 'PENDING', // Always pending user's approval
          submittedBy: 'FRIEND', // Set the source based on your schema enum
        },
      });

      // 3. IMPORTANT: Mark the token as COMPLETED so it cannot be used again.
      await tx.testimonialRequest.update({
        where: { id: request.id },
        data: { status: 'COMPLETED' },
      });

      return { success: true, testimonial };
    });

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Thank you! Your testimonial has been submitted.' });
    } else {
       // This part should not be reached if the transaction logic is correct
       throw new Error("Transaction failed unexpectedly.");
    }

  } catch (error) {
    console.error('Error in POST /api/profile/testimonials:', error);
    if (error instanceof Error && error.message.includes('Invalid, expired, or already used link')) {
      return NextResponse.json({ success: false, message: 'This link is invalid, has expired, or has already been used.' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'An internal server error occurred.' }, { status: 500 });
  }
}