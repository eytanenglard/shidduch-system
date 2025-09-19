// src/app/api/profile/testimonials/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET all testimonials for the logged-in user
export async function GET() {
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

    const testimonials = await prisma.friendTestimonial.findMany({
      where: { profileId: userProfile.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, testimonials });
  } catch (error) {
    console.error("Error in GET /api/profile/testimonials:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

// POST a new manual testimonial
export async function POST(req: Request) {
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
    
    const body = await req.json();
    const { authorName, relationship, content, authorPhone, isPhoneVisibleToMatch } = body;

    if (!authorName || !relationship || !content) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const newTestimonial = await prisma.friendTestimonial.create({
      data: {
        profileId: userProfile.id,
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
  } catch (error) {
    console.error("Error in POST /api/profile/testimonials:", error);
    if (error instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json({ success: false, message: "Invalid data provided for testimonial.", details: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}