// src/app/api/profile/testimonials/[testimonialId]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { TestimonialStatus } from '@prisma/client';

// PUT - Update a testimonial's status
export async function PUT(req: Request, { params }: { params: { testimonialId: string } }) {
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

    const { status } = await req.json() as { status: TestimonialStatus };
    if (!Object.values(TestimonialStatus).includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid status provided' }, { status: 400 });
    }

    const updatedTestimonial = await prisma.friendTestimonial.updateMany({
      where: {
        id: params.testimonialId,
        profileId: userProfile.id, // Ensure ownership
      },
      data: { status },
    });

    if (updatedTestimonial.count === 0) {
      return NextResponse.json({ success: false, message: 'Testimonial not found or you do not have permission to edit it' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Testimonial status updated.' });
  } catch (error) {
    console.error("Error in PUT /api/profile/testimonials/[id]:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE a testimonial
export async function DELETE(req: Request, { params }: { params: { testimonialId: string } }) {
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

    const deletedTestimonial = await prisma.friendTestimonial.deleteMany({
        where: {
            id: params.testimonialId,
            profileId: userProfile.id, // Ensure ownership
        },
    });

    if (deletedTestimonial.count === 0) {
        return NextResponse.json({ success: false, message: 'Testimonial not found or you do not have permission to delete it' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Testimonial deleted.' });
  } catch (error) {
    console.error("Error in DELETE /api/profile/testimonials/[id]:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}