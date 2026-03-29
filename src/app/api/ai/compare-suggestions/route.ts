// src/app/api/ai/compare-suggestions/route.ts
// Compares two suggestions for the same user using AI analysis
// Features: caching via structuredRationale, enriched context (scores, tags, rejection patterns)

import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimitWithRoleCheck } from '@/lib/rate-limiter';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import profileAiService from '@/lib/services/profileAiService';
import { compareSuggestionsForUser } from '@/lib/services/aiService';
import type { SuggestionAnalysisContext } from '@/lib/services/aiService';
import rejectionFeedbackService from '@/lib/services/rejectionFeedbackService';
import prisma from '@/lib/prisma';
import type { StructuredRationale } from '@/types/structuredRationale';

// Cache TTL: 7 days for comparisons (shorter than single analyses since they combine data)
const COMPARISON_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface CachedComparison {
  data: Record<string, unknown>;
  generatedAt: string;
  pairKey: string;
  profileAUpdatedAt: string | null;
  profileBUpdatedAt: string | null;
  currentUserProfileUpdatedAt: string | null;
}

function isComparisonCacheValid(
  cached: CachedComparison | undefined,
  profileAUpdatedAt: Date | string | null | undefined,
  profileBUpdatedAt: Date | string | null | undefined,
  currentUserUpdatedAt: Date | string | null | undefined
): boolean {
  if (!cached) return false;

  // Check TTL
  const generatedAt = new Date(cached.generatedAt).getTime();
  if (Date.now() - generatedAt > COMPARISON_CACHE_TTL_MS) return false;

  // Check if any profile changed
  const checks = [
    { current: profileAUpdatedAt, snapshot: cached.profileAUpdatedAt },
    { current: profileBUpdatedAt, snapshot: cached.profileBUpdatedAt },
    { current: currentUserUpdatedAt, snapshot: cached.currentUserProfileUpdatedAt },
  ];

  for (const { current, snapshot } of checks) {
    if (current && snapshot) {
      if (new Date(current).getTime() > new Date(snapshot).getTime()) return false;
    }
  }

  return true;
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = await applyRateLimitWithRoleCheck(req, {
    requests: 10,
    window: '1 h',
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // ── 1. Auth ──
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    const currentUserId = session.user.id;

    // ── 2. Parse request ──
    const body = await req.json();
    const { suggestionIdA, suggestionIdB } = body;

    if (!suggestionIdA || !suggestionIdB || typeof suggestionIdA !== 'string' || typeof suggestionIdB !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Bad Request: suggestionIdA and suggestionIdB are required.' },
        { status: 400 }
      );
    }

    // ── 3. Fetch both suggestions with enrichment data ──
    const suggestions = await prisma.matchSuggestion.findMany({
      where: {
        id: { in: [suggestionIdA, suggestionIdB] },
        OR: [
          { firstPartyId: currentUserId },
          { secondPartyId: currentUserId },
        ],
      },
      select: {
        id: true,
        firstPartyId: true,
        secondPartyId: true,
        matchingReason: true,
        structuredRationale: true,
        potentialMatch: {
          select: {
            aiScore: true,
            shortReasoning: true,
            scoreBreakdown: true,
          },
        },
        firstParty: {
          select: {
            firstName: true,
            profile: { select: { contentUpdatedAt: true } },
            profileTags: {
              select: {
                sectorTags: true,
                backgroundTags: true,
                personalityTags: true,
                careerTags: true,
                lifestyleTags: true,
                familyVisionTags: true,
                relationshipTags: true,
              },
            },
          },
        },
        secondParty: {
          select: {
            firstName: true,
            profile: { select: { contentUpdatedAt: true } },
            profileTags: {
              select: {
                sectorTags: true,
                backgroundTags: true,
                personalityTags: true,
                careerTags: true,
                lifestyleTags: true,
                familyVisionTags: true,
                relationshipTags: true,
              },
            },
          },
        },
      },
    });

    if (suggestions.length !== 2) {
      return NextResponse.json(
        { success: false, message: 'One or both suggestions not found or not accessible.' },
        { status: 404 }
      );
    }

    const sugA = suggestions.find((s) => s.id === suggestionIdA)!;
    const sugB = suggestions.find((s) => s.id === suggestionIdB)!;

    // Determine the "other party" for each suggestion
    const isFirstPartyA = sugA.firstPartyId === currentUserId;
    const isFirstPartyB = sugB.firstPartyId === currentUserId;
    const otherPartyIdA = isFirstPartyA ? sugA.secondPartyId : sugA.firstPartyId;
    const otherPartyIdB = isFirstPartyB ? sugB.secondPartyId : sugB.firstPartyId;
    const nameA = isFirstPartyA ? sugA.secondParty.firstName : sugA.firstParty.firstName;
    const nameB = isFirstPartyB ? sugB.secondParty.firstName : sugB.firstParty.firstName;

    // ── 4. Check cache ──
    // Store comparison cache on suggestion A's structuredRationale under a comparison key
    const pairKey = [suggestionIdA, suggestionIdB].sort().join('_');
    const rationaleA = (sugA.structuredRationale as StructuredRationale & { comparisons?: Record<string, CachedComparison> }) || {};

    const profileAUpdatedAt = isFirstPartyA
      ? sugA.secondParty?.profile?.contentUpdatedAt
      : sugA.firstParty?.profile?.contentUpdatedAt;
    const profileBUpdatedAt = isFirstPartyB
      ? sugB.secondParty?.profile?.contentUpdatedAt
      : sugB.firstParty?.profile?.contentUpdatedAt;
    const currentUserUpdatedAt = isFirstPartyA
      ? sugA.firstParty?.profile?.contentUpdatedAt
      : sugA.secondParty?.profile?.contentUpdatedAt;

    const cached = rationaleA.comparisons?.[pairKey];
    if (cached && isComparisonCacheValid(cached, profileAUpdatedAt, profileBUpdatedAt, currentUserUpdatedAt)) {
      console.log(`[compare-suggestions] Cache HIT for pair ${pairKey}`);
      return NextResponse.json({ success: true, data: cached.data, cached: true });
    }

    console.log(`[compare-suggestions] Cache MISS for pair ${pairKey}, generating...`);

    // ── 5. Generate narratives (current user + both other parties) ──
    const [currentUserNarrative, otherPartyANarrative, otherPartyBNarrative] =
      await Promise.all([
        profileAiService.generateNarrativeProfile(currentUserId),
        profileAiService.generateNarrativeProfile(otherPartyIdA),
        profileAiService.generateNarrativeProfile(otherPartyIdB),
      ]);

    if (!currentUserNarrative || !otherPartyANarrative || !otherPartyBNarrative) {
      return NextResponse.json(
        { success: false, message: 'Could not generate profile narratives.' },
        { status: 500 }
      );
    }

    // ── 6. Build enrichment context for the AI prompt ──
    const buildContext = (sug: typeof sugA, isFirstParty: boolean): SuggestionAnalysisContext => {
      const ctx: SuggestionAnalysisContext = {};

      if (sug.matchingReason) ctx.matchmakerReason = sug.matchingReason;

      const pm = sug.potentialMatch;
      if (pm?.scoreBreakdown && typeof pm.scoreBreakdown === 'object') {
        ctx.scoreBreakdown = pm.scoreBreakdown as Record<string, number>;
      }
      if (pm?.aiScore != null) ctx.systemScore = Math.round(pm.aiScore);
      if (pm?.shortReasoning) ctx.systemReasoning = pm.shortReasoning;

      // Fallback to structuredRationale.ai
      const rat = (sug.structuredRationale as StructuredRationale) || {};
      if (!ctx.systemScore && rat.ai?.score) ctx.systemScore = Math.round(rat.ai.score);
      if (!ctx.systemReasoning && rat.ai?.shortReasoning) ctx.systemReasoning = rat.ai.shortReasoning;
      if (!ctx.scoreBreakdown && rat.ai?.scoreBreakdown) {
        ctx.scoreBreakdown = rat.ai.scoreBreakdown as Record<string, number>;
      }

      // Profile tags
      const currentUserTags = isFirstParty ? sug.firstParty?.profileTags : sug.secondParty?.profileTags;
      const otherUserTags = isFirstParty ? sug.secondParty?.profileTags : sug.firstParty?.profileTags;
      if (currentUserTags || otherUserTags) {
        ctx.profileTags = {
          currentUser: currentUserTags || undefined,
          otherUser: otherUserTags || undefined,
        };
      }

      return ctx;
    };

    const contextA = buildContext(sugA, isFirstPartyA);
    const contextB = buildContext(sugB, isFirstPartyB);

    // Fetch rejection patterns for current user
    let rejectionPatterns: string[] = [];
    try {
      const rejectionProfile = await rejectionFeedbackService.getUserRejectionProfile(currentUserId);
      if (rejectionProfile?.patterns?.length) {
        rejectionPatterns = rejectionProfile.patterns;
      }
    } catch (rejErr) {
      console.warn('[compare-suggestions] Rejection profile lookup failed:', rejErr);
    }

    // ── 7. Detect locale ──
    const acceptLang = req.headers.get('accept-language') || '';
    const locale: 'he' | 'en' = acceptLang.startsWith('en') ? 'en' : 'he';

    // ── 8. Call AI comparison (with enriched context) ──
    const comparisonResult = await compareSuggestionsForUser(
      currentUserNarrative,
      otherPartyANarrative,
      otherPartyBNarrative,
      nameA,
      nameB,
      locale,
      { contextA, contextB, rejectionPatterns }
    );

    if (!comparisonResult) {
      return NextResponse.json(
        { success: false, message: 'AI service failed to produce comparison.' },
        { status: 500 }
      );
    }

    // ── 9. Cache result on suggestion A's structuredRationale ──
    try {
      const cacheEntry: CachedComparison = {
        data: comparisonResult as unknown as Record<string, unknown>,
        generatedAt: new Date().toISOString(),
        pairKey,
        profileAUpdatedAt: profileAUpdatedAt ? new Date(profileAUpdatedAt).toISOString() : null,
        profileBUpdatedAt: profileBUpdatedAt ? new Date(profileBUpdatedAt).toISOString() : null,
        currentUserProfileUpdatedAt: currentUserUpdatedAt ? new Date(currentUserUpdatedAt).toISOString() : null,
      };

      const existingComparisons = rationaleA.comparisons || {};

      await prisma.matchSuggestion.update({
        where: { id: suggestionIdA },
        data: {
          structuredRationale: {
            ...rationaleA,
            comparisons: {
              ...existingComparisons,
              [pairKey]: cacheEntry,
            },
          } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        },
      });

      console.log(`[compare-suggestions] Cached comparison for pair ${pairKey}`);
    } catch (cacheErr) {
      console.error('[compare-suggestions] Cache write failed:', cacheErr);
    }

    // ── 10. Return ──
    return NextResponse.json({ success: true, data: comparisonResult });
  } catch (error) {
    console.error('[compare-suggestions] Fatal error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, message: 'Internal Server Error', details: msg },
      { status: 500 }
    );
  }
}
