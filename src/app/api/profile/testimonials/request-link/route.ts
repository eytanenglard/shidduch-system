// src/app/api/profile/testimonials/request-link/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find the user's profile to link the request to
    const userProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    });

    if (!userProfile) {
        return NextResponse.json({ success: false, message: 'Profile not found' }, { status: 404 });
    }

    // 1. Generate a secure, random token
    const token = randomBytes(32).toString('hex');

    // 2. Set an expiration date (e.g., 7 days from now)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // 3. Create the request record in the new database table
    await prisma.testimonialRequest.create({
      data: {
        token: token,
        expiresAt: expiresAt,
        profileId: userProfile.id, // Use the fetched profile ID
      },
    });

    // 4. Construct the full link to return to the client
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const link = `${baseUrl}/testimonial/${token}`;

    return NextResponse.json({ success: true, link });
  } catch (error) {
    console.error("Failed to create testimonial request link:", error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}