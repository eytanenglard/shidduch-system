// src/app/api/profile/testimonials/request-link/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SignJWT } from 'jose';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.profile?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized or profile not found' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    if (!secret) throw new Error("NEXTAUTH_SECRET is not defined.");

    const payload = {
      profileId: session.user.profile.id,
      userId: session.user.id, // Include userId for verification if needed
    };

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // הקישור יהיה תקף לשבוע
      .sign(secret);

    const link = `${process.env.NEXT_PUBLIC_BASE_URL}/testimonial/${token}`;

    return NextResponse.json({ success: true, link });

  } catch (error) {
    console.error("Error creating testimonial request link:", error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}