// src/app/api/profile/testimonials/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET all testimonials for the logged-in user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.profile?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const testimonials = await prisma.friendTestimonial.findMany({
    where: { profileId: session.user.profile.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ success: true, testimonials });
}

// POST a new manual testimonial
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.profile?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await req.json();
  const { authorName, relationship, content, authorPhone, isPhoneVisibleToMatch } = body;

  if (!authorName || !relationship || !content) {
    return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
  }

  const newTestimonial = await prisma.friendTestimonial.create({
    data: {
      profileId: session.user.profile.id,
      authorName,
      relationship,
      content,
      authorPhone: authorPhone || null,
      isPhoneVisibleToMatch: isPhoneVisibleToMatch && !!authorPhone,
      status: 'APPROVED', // Manual entries are pre-approved by the user
      submittedBy: 'USER',
    },
  });

  return NextResponse.json({ success: true, testimonial: newTestimonial }, { status: 201 });
}