// src/app/api/profile/testimonials/[testimonialId]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { TestimonialStatus } from '@prisma/client';

// PUT - Update a testimonial's status
export async function PUT(req: Request, { params }: { params: { testimonialId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.profile?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { status } = await req.json() as { status: TestimonialStatus };
  if (!Object.values(TestimonialStatus).includes(status)) {
    return NextResponse.json({ success: false, message: 'Invalid status provided' }, { status: 400 });
  }

  const updatedTestimonial = await prisma.friendTestimonial.updateMany({
    where: {
      id: params.testimonialId,
      profileId: session.user.profile.id, // Ensure ownership
    },
    data: { status },
  });

  if (updatedTestimonial.count === 0) {
    return NextResponse.json({ success: false, message: 'Testimonial not found or you do not have permission to edit it' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

// DELETE a testimonial
export async function DELETE(req: Request, { params }: { params: { testimonialId: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.profile?.id) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const deletedTestimonial = await prisma.friendTestimonial.deleteMany({
        where: {
            id: params.testimonialId,
            profileId: session.user.profile.id, // Ensure ownership
        },
    });

    if (deletedTestimonial.count === 0) {
        return NextResponse.json({ success: false, message: 'Testimonial not found or you do not have permission to delete it' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
}