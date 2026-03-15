// =================================================================
// FILE 3: MOBILE API ROUTE (with smart cache)
// Save as: src/app/api/mobile/suggestions/[id]/ai-analysis/route.ts
// =================================================================

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from "@/lib/mobile-auth";
import profileAiService from "@/lib/services/profileAiService";
import aiService from "@/lib/services/aiService";
import type {
  StructuredRationale,
  CachedUserAnalysis,
} from "@/types/structuredRationale";
import { isCacheValid } from "@/types/structuredRationale";

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const suggestionId = params.id;

    // ── 1. Auth ──
    const auth = await verifyMobileToken(req);
    if (!auth) {
      return corsError(req, "Unauthorized", 401);
    }
    const currentUserId = auth.userId;

    // ── 2. Load suggestion with rationale + profile timestamps ──
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      select: {
        id: true,
        firstPartyId: true,
        secondPartyId: true,
        structuredRationale: true,
        firstParty: {
          select: {
            profile: {
              select: { contentUpdatedAt: true },
            },
          },
        },
        secondParty: {
          select: {
            profile: {
              select: { contentUpdatedAt: true },
            },
          },
        },
      },
    });

    if (!suggestion) {
      return corsError(req, "Suggestion not found", 404);
    }

    // ── 3. Verify access ──
    const isFirstParty = suggestion.firstPartyId === currentUserId;
    const isSecondParty = suggestion.secondPartyId === currentUserId;

    if (!isFirstParty && !isSecondParty) {
      return corsError(req, "Access denied", 403);
    }

    const otherUserId = isFirstParty
      ? suggestion.secondPartyId
      : suggestion.firstPartyId;

    // The OTHER party's profile update timestamp (to detect staleness)
    const otherPartyContentUpdatedAt = isFirstParty
      ? suggestion.secondParty?.profile?.contentUpdatedAt
      : suggestion.firstParty?.profile?.contentUpdatedAt;

    // ── 4. Check cache ──
    const rationale = (suggestion.structuredRationale as StructuredRationale) || {};
    const cacheKey = isFirstParty ? "firstPartyAnalysis" : "secondPartyAnalysis";
    const cached = rationale[cacheKey];

    if (isCacheValid(cached, otherPartyContentUpdatedAt)) {
      console.log(
        `[mobile/ai-analysis] Cache HIT for ${cacheKey} on suggestion ${suggestionId}`
      );
      return corsJson(req, {
        success: true,
        data: cached,
        cached: true,
      });
    }

    console.log(
      `[mobile/ai-analysis] Cache MISS for ${cacheKey} on suggestion ${suggestionId}, generating...`
    );

    // ── 5. Verify both profiles exist ──
    const profilesExist = await prisma.profile.findMany({
      where: { userId: { in: [currentUserId, otherUserId] } },
      select: { userId: true },
    });

    if (profilesExist.length !== 2) {
      return corsError(req, "One or both user profiles not found", 404);
    }

    // ── 6. Generate narrative profiles in parallel ──
    const [currentUserNarrative, otherUserNarrative] = await Promise.all([
      profileAiService.generateNarrativeProfile(currentUserId),
      profileAiService.generateNarrativeProfile(otherUserId),
    ]);

    if (!currentUserNarrative || !otherUserNarrative) {
      console.error(
        `[mobile/ai-analysis] Failed to generate narratives for suggestion ${suggestionId}`
      );
      return corsError(req, "Could not generate profile narratives", 500);
    }

    // ── 7. Call Gemini AI ──
    const analysisResult = await aiService.analyzeSuggestionForUser(
      currentUserNarrative,
      otherUserNarrative
    );

    if (!analysisResult) {
      console.error(
        `[mobile/ai-analysis] AI returned null for suggestion ${suggestionId}`
      );
      return corsError(req, "AI service failed to produce analysis", 500);
    }

    // ── 8. Build cache entry ──
    const cacheEntry: CachedUserAnalysis = {
      ...analysisResult,
      generatedAt: new Date().toISOString(),
      generatedForUserId: currentUserId,
      otherPartyProfileUpdatedAt: otherPartyContentUpdatedAt
        ? new Date(otherPartyContentUpdatedAt).toISOString()
        : null,
    };

    // ── 9. Save to DB (merge with existing rationale) ──
    try {
      const updatedRationale: StructuredRationale = {
        ...rationale,
        [cacheKey]: cacheEntry,
      };

      await prisma.matchSuggestion.update({
        where: { id: suggestionId },
        data: {
          structuredRationale: updatedRationale as any,
        },
      });

      console.log(
        `[mobile/ai-analysis] Cached ${cacheKey} for suggestion ${suggestionId}, score: ${analysisResult.overallScore}`
      );
    } catch (cacheError) {
      // Don't fail the request if caching fails — just log
      console.error(
        `[mobile/ai-analysis] Failed to cache analysis for suggestion ${suggestionId}:`,
        cacheError
      );
    }

    // ── 10. Return ──
    return corsJson(req, {
      success: true,
      data: analysisResult,
      cached: false,
    });
  } catch (error) {
    console.error("[mobile/suggestions/[id]/ai-analysis] Error:", error);
    return corsError(req, "Internal server error", 500);
  }
}