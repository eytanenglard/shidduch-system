import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - fetch existing soul fingerprint tags
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileTags = await prisma.profileTags.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ profileTags });
  } catch (error) {
    console.error('GET /api/user/soul-fingerprint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - save soul fingerprint answers and tags
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Get the profile for this user
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profileTags = await prisma.profileTags.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
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

    // Mark profile as having significant content change (triggers rescan logic)
    await prisma.profile.update({
      where: { id: profile.id },
      data: { contentUpdatedAt: new Date(), needsAiProfileUpdate: true },
    });

    // Fire-and-forget AI enrichment when questionnaire is completed
    if (isComplete) {
      import('@/lib/services/soulFingerprintAIService')
        .then(({ enrichSoulFingerprintWithAI }) => enrichSoulFingerprintWithAI(session.user.id))
        .catch((err) => console.error('[SoulFingerprint] AI enrichment failed:', err));
    }

    return NextResponse.json({ profileTags, success: true });
  } catch (error) {
    console.error('POST /api/user/soul-fingerprint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - AI enrichment endpoint (for adding AI-derived tags)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { aiDerivedTags = [], customCategories } = body;

    const profileTags = await prisma.profileTags.update({
      where: { userId: session.user.id },
      data: {
        aiDerivedTags,
        customCategories,
        updatedAt: new Date(),
      },
    });

    // AI-derived tags are also a significant change — update profile signal
    await prisma.profile.update({
      where: { userId: session.user.id },
      data: { contentUpdatedAt: new Date() },
    });

    return NextResponse.json({ profileTags, success: true });
  } catch (error) {
    console.error('PATCH /api/user/soul-fingerprint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
