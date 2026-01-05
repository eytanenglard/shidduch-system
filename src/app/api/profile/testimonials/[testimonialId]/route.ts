// src/app/api/profile/testimonials/[testimonialId]/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { TestimonialStatus } from '@prisma/client';

export async function PUT(
  req: NextRequest, 
  props: { params: Promise<{ testimonialId: string }> }
) {
  const session = await getServerSession(authOptions);
  
  // ✅ תיקון: בדיקה רק של user.id (לא profile.id)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const params = await props.params;

  const { status } = await req.json() as { status: TestimonialStatus };
  if (!Object.values(TestimonialStatus).includes(status)) {
    return NextResponse.json({ success: false, message: 'Invalid status provided' }, { status: 400 });
  }

  // ✅ תיקון: שימוש ב-nested where דרך profile.userId
  const updatedTestimonial = await prisma.friendTestimonial.updateMany({
    where: {
      id: params.testimonialId,
      profile: {
        userId: session.user.id,
      }
    },
    data: { status },
  });

  if (updatedTestimonial.count === 0) {
    return NextResponse.json({ success: false, message: 'Testimonial not found or you do not have permission to edit it' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest, 
  props: { params: Promise<{ testimonialId: string }> }
) {
  const session = await getServerSession(authOptions);
  
  // ✅ תיקון: בדיקה רק של user.id (לא profile.id)
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const params = await props.params;

  // ✅ תיקון: שימוש ב-nested where דרך profile.userId
  const deletedTestimonial = await prisma.friendTestimonial.deleteMany({
    where: {
      id: params.testimonialId,
      profile: {
        userId: session.user.id,
      }
    },
  });

  if (deletedTestimonial.count === 0) {
    return NextResponse.json({ success: false, message: 'Testimonial not found or you do not have permission to delete it' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}