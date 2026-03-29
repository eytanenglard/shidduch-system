// src/app/api/mobile/suggestions/compare/route.ts
// Mobile endpoint: Compare two suggestions using AI
// Pattern: JWT auth + CORS (matches other mobile endpoints)

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from '@/lib/mobile-auth';
import profileAiService from '@/lib/services/profileAiService';
import { compareSuggestionsForUser } from '@/lib/services/aiService';
import type { SuggestionAnalysisContext } from '@/lib/services/aiService';
import rejectionFeedbackService from '@/lib/services/rejectionFeedbackService';
import type { StructuredRationale } from '@/types/structuredRationale';

// Cache TTL: 7 days
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
  const generatedAt = new Date(cached.generatedAt).getTime();
  if (Date.now() - generatedAt > COMPARISON_CACHE_TTL_MS) return false;

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

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth ──
    const auth = await verifyMobileToken(req);
    if (!auth) {
      return corsError(req, 'Unauthorized', 401);
    }
    const currentUserId = auth.userId;

    // ── 2. Parse request ──
    const body = await req.json();
    const { suggestionIdA, suggestionIdB, locale: reqLocale } = body;

    if (!suggestionIdA || !suggestionIdB) {
      return corsError(req, 'suggestionIdA and suggestionIdB are required', 400);
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
      return corsError(req, 'One or both suggestions not found or not accessible', 404);
    }

    const sugA = suggestions.find((s) => s.id === suggestionIdA)!;
    const sugB = suggestions.find((s) => s.id === suggestionIdB)!;

    const isFirstPartyA = sugA.firstPartyId === currentUserId;
    const isFirstPartyB = sugB.firstPartyId === currentUserId;
    const otherPartyIdA = isFirstPartyA ? sugA.secondPartyId : sugA.firstPartyId;
    const otherPartyIdB = isFirstPartyB ? sugB.secondPartyId : sugB.firstPartyId;
    const nameA = isFirstPartyA ? sugA.secondParty.firstName : sugA.firstParty.firstName;
    const nameB = isFirstPartyB ? sugB.secondParty.firstName : sugB.firstParty.firstName;

    // ── 4. Check cache ──
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
      console.log(`[mobile/compare] Cache HIT for pair ${pairKey}`);
      return corsJson(req, { success: true, data: cached.data, cached: true });
    }

    // ── 5. Generate narratives ──
    const [currentUserNarrative, otherPartyANarrative, otherPartyBNarrative] =
      await Promise.all([
        profileAiService.generateNarrativeProfile(currentUserId),
        profileAiService.generateNarrativeProfile(otherPartyIdA),
        profileAiService.generateNarrativeProfile(otherPartyIdB),
      ]);

    if (!currentUserNarrative || !otherPartyANarrative || !otherPartyBNarrative) {
      return corsError(req, 'Could not generate profile narratives', 500);
    }

    // ── 6. Build enrichment context ──
    const buildContext = (sug: typeof sugA, isFirstParty: boolean): SuggestionAnalysisContext => {
      const ctx: SuggestionAnalysisContext = {};
      if (sug.matchingReason) ctx.matchmakerReason = sug.matchingReason;

      const pm = sug.potentialMatch;
      if (pm?.scoreBreakdown && typeof pm.scoreBreakdown === 'object') {
        ctx.scoreBreakdown = pm.scoreBreakdown as Record<string, number>;
      }
      if (pm?.aiScore != null) ctx.systemScore = Math.round(pm.aiScore);
      if (pm?.shortReasoning) ctx.systemReasoning = pm.shortReasoning;

      const rat = (sug.structuredRationale as StructuredRationale) || {};
      if (!ctx.systemScore && rat.ai?.score) ctx.systemScore = Math.round(rat.ai.score);
      if (!ctx.systemReasoning && rat.ai?.shortReasoning) ctx.systemReasoning = rat.ai.shortReasoning;

      const otherUserTags = isFirstParty ? sug.secondParty?.profileTags : sug.firstParty?.profileTags;
      if (otherUserTags) {
        ctx.profileTags = { otherUser: otherUserTags || undefined };
      }
      return ctx;
    };

    const contextA = buildContext(sugA, isFirstPartyA);
    const contextB = buildContext(sugB, isFirstPartyB);

    let rejectionPatterns: string[] = [];
    try {
      const rejProfile = await rejectionFeedbackService.getUserRejectionProfile(currentUserId);
      if (rejProfile?.patterns?.length) rejectionPatterns = rejProfile.patterns;
    } catch { /* ignore */ }

    // ── 7. Call AI ──
    const locale: 'he' | 'en' = reqLocale === 'en' ? 'en' : 'he';
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
      return corsError(req, 'AI service failed to produce comparison', 500);
    }

    // ── 8. Cache result ──
    try {
      const cacheEntry: CachedComparison = {
        data: comparisonResult as unknown as Record<string, unknown>,
        generatedAt: new Date().toISOString(),
        pairKey,
        profileAUpdatedAt: profileAUpdatedAt ? new Date(profileAUpdatedAt).toISOString() : null,
        profileBUpdatedAt: profileBUpdatedAt ? new Date(profileBUpdatedAt).toISOString() : null,
        currentUserProfileUpdatedAt: currentUserUpdatedAt ? new Date(currentUserUpdatedAt).toISOString() : null,
      };

      await prisma.matchSuggestion.update({
        where: { id: suggestionIdA },
        data: {
          structuredRationale: {
            ...rationaleA,
            comparisons: { ...(rationaleA.comparisons || {}), [pairKey]: cacheEntry },
          } as any,
        },
      });
    } catch (cacheErr) {
      console.error('[mobile/compare] Cache write failed:', cacheErr);
    }

    // ── 9. Return ──
    return corsJson(req, { success: true, data: comparisonResult });
  } catch (error) {
    console.error('[mobile/compare] Fatal error:', error);
    return corsError(req, 'Internal Server Error', 500);
  }
}
