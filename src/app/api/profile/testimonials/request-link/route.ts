// src/app/api/profile/testimonials/request-link/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { SignJWT } from 'jose';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    const userProfile = await prisma.profile.findUnique({
        where: { userId: session.user.id },
        select: { id: true }
    });

    if (!userProfile) {
        return NextResponse.json({ success: false, message: 'Profile not found for current user' }, { status: 404 });
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    if (!secret) {
        console.error("FATAL: NEXTAUTH_SECRET is not defined for JWT signing.");
        throw new Error("NEXTAUTH_SECRET is not defined.");
    }

    const payload = {
      profileId: userProfile.id,
      userId: session.user.id,
    };

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);

    const link = `${process.env.NEXT_PUBLIC_BASE_URL}/testimonial/${token}`;

    return NextResponse.json({ success: true, link });

  } catch (error) {
    console.error("Error creating testimonial request link:", error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}