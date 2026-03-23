// =============================================================================
// File: src/app/api/matchmaker/candidates/[id]/prepare-ai/route.ts
// Description: Triggers full AI preparation for a candidate (metrics, vectors, tags)
//   so they're ready for matching without waiting for the first scan.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { updateProfileVectorsAndMetrics } from '@/lib/services/dualVectorService';
import { generateTagsFromProfileData } from '@/lib/services/aiTagGenerationService';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user?.id ||
      (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN)
    ) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;
    const userId = params.id;

    // Find user + profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: { select: { id: true } } },
    });

    if (!user || !user.profile) {
      return NextResponse.json(
        { success: false, error: 'User or profile not found' },
        { status: 404 }
      );
    }

    const profileId = user.profile.id;

    // 1. Extract metrics + generate dual vectors
    console.log(`[PrepareAI] Starting full AI preparation for user ${userId}, profile ${profileId}`);
    const { metricsUpdated, vectorsUpdated, errors } = await updateProfileVectorsAndMetrics(profileId);

    // 2. Generate Soul Fingerprint tags
    let tagsGenerated = false;
    try {
      tagsGenerated = await generateTagsFromProfileData(userId, profileId);
    } catch (err) {
      console.error(`[PrepareAI] Tag generation failed:`, err);
      errors.push(`Tag generation failed: ${err}`);
    }

    // 3. Fetch the generated data to return to the client
    const [profileMetrics, profileTags] = await Promise.all([
      prisma.profileMetrics.findUnique({
        where: { profileId },
        select: {
          aiPersonalitySummary: true,
          aiSeekingSummary: true,
          aiBackgroundSummary: true,
          aiMatchmakerGuidelines: true,
          inferredPersonalityType: true,
          inferredAttachmentStyle: true,
          inferredLoveLanguages: true,
          inferredRelationshipGoals: true,
          socialEnergy: true,
          emotionalExpression: true,
          stabilityVsSpontaneity: true,
          independenceLevel: true,
          optimismLevel: true,
          ambitionLevel: true,
          careerOrientation: true,
          intellectualOrientation: true,
          spiritualDepth: true,
          adventureScore: true,
          communicationStyle: true,
          conflictStyle: true,
          humorStyle: true,
          confidenceScore: true,
          dataCompleteness: true,
          difficultyFlags: true,
          aiInferredDealBreakers: true,
          aiInferredMustHaves: true,
        },
      }),
      prisma.profileTags.findUnique({
        where: { profileId },
        select: {
          sectorTags: true,
          backgroundTags: true,
          personalityTags: true,
          careerTags: true,
          lifestyleTags: true,
          familyVisionTags: true,
          relationshipTags: true,
          aiDerivedTags: true,
          source: true,
        },
      }),
    ]);

    console.log(
      `[PrepareAI] Completed for user ${userId}. Metrics: ${metricsUpdated}, Vectors: ${vectorsUpdated}, Tags: ${tagsGenerated}`
    );

    return NextResponse.json({
      success: true,
      data: {
        metricsUpdated,
        vectorsUpdated,
        tagsGenerated,
        errors: errors.length > 0 ? errors : undefined,
        metrics: profileMetrics || null,
        tags: profileTags || null,
      },
    });
  } catch (error) {
    console.error('[PrepareAI] Fatal error:', error);
    return NextResponse.json(
      { success: false, error: 'AI preparation failed' },
      { status: 500 }
    );
  }
}
