// src/app/api/profile/viewed-preview/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const updatedProfile = await prisma.profile.update({
      where: {
        userId: session.user.id,
      },
      data: {
        hasViewedProfilePreview: true,
      },
      select: {
        userId: true,
        hasViewedProfilePreview: true,
      }
    });

    if (!updatedProfile) {
        return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile: updatedProfile }, { status: 200 });

  } catch (error) {
    console.error('Error updating profile preview status:', error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}