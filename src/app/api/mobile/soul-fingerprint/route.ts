import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyMobileToken } from '@/lib/mobile-auth';

export async function GET(req: NextRequest) {
  try {
    const payload = await verifyMobileToken(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId;

    const profileTags = await prisma.profileTags.findUnique({
      where: { userId },
    });

    return NextResponse.json({ profileTags });
  } catch (error) {
    console.error('GET /api/mobile/soul-fingerprint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await verifyMobileToken(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = payload.userId;

    const body = await req.json();
    const {
      sectionAnswers,
      sectorTags = [],
      backgroundTags = [],
      personalityTags = [],
      careerTags = [],
      lifestyleTags = [],
      familyVisionTags = [],
      relationshipTags = [],
      diasporaTags = [],
      partnerTags,
      isComplete = false,
    } = body;

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profileTags = await prisma.profileTags.upsert({
      where: { userId },
      create: {
        userId,
        profileId: profile.id,
        sectionAnswers,
        sectorTags,
        backgroundTags,
        personalityTags,
        careerTags,
        lifestyleTags,
        familyVisionTags,
        relationshipTags,
        diasporaTags,
        partnerTags,
        aiDerivedTags: [],
        completedAt: isComplete ? new Date() : null,
        source: 'SELF_REPORTED',
      },
      update: {
        sectionAnswers,
        sectorTags,
        backgroundTags,
        personalityTags,
        careerTags,
        lifestyleTags,
        familyVisionTags,
        relationshipTags,
        diasporaTags,
        partnerTags,
        completedAt: isComplete ? new Date() : undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ profileTags, success: true });
  } catch (error) {
    console.error('POST /api/mobile/soul-fingerprint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
