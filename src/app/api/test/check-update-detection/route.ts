// קובץ: /src/app/api/test/check-update-detection/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // עדכן משהו בפרופיל
  await prisma.profile.update({
    where: { userId: session.user.id },
    data: { matchingNotes: `Test update at ${new Date().toISOString()}` }
  });

  // בדוק מה ה-updatedAt של User
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { updatedAt: true }
  });

  // בדוק מה ה-updatedAt של Profile
  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { updatedAt: true }
  });

  return NextResponse.json({
    success: true,
    message: 'Updated profile',
    userUpdatedAt: user?.updatedAt,
    profileUpdatedAt: profile?.updatedAt,
    timeDiff: user?.updatedAt && profile?.updatedAt 
      ? Math.abs(user.updatedAt.getTime() - profile.updatedAt.getTime()) 
      : null
  });
}

