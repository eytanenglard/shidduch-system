// =================================================================
// FILE 4: UPDATED WEB API ROUTE (with smart cache)
// Replace: src/app/api/ai/analyze-suggestion/route.ts
//
// Same caching logic as mobile — so web users also benefit from cache.
// If user already requested analysis → return cached.
// If profile changed or cache expired → regenerate.
// =================================================================

import { NextRequest, NextResponse } from "next/server";
import { applyRateLimitWithRoleCheck } from "@/lib/rate-limiter";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import profileAiService from "@/lib/services/profileAiService";
import aiService from "@/lib/services/aiService";
import prisma from "@/lib/prisma";
import type {
  StructuredRationale,
  CachedUserAnalysis,
} from "@/types/structuredRationale";
import { isCacheValid } from "@/types/structuredRationale";

export async function POST(req: NextRequest) {
  const rateLimitResponse = await applyRateLimitWithRoleCheck(req, {
    requests: 15,
    window: "1 h",
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // ── 1. Auth ──
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const currentUserId = session.user.id;

    // ── 2. Parse request ──
    const body = await req.json();
    const { suggestedUserId } = body;

    if (!suggestedUserId || typeof suggestedUserId !== "string") {
      return NextResponse.json(
        { success: false, message: "Bad Request: suggestedUserId is required." },
        { status: 400 }
      );
    }

    // ── 3. Find the suggestion connecting these two users ──
    // The web dialog passes suggestedUserId but we need the suggestion
    // to read/write the cache. Find the active suggestion between them.
    const suggestion = await prisma.matchSuggestion.findFirst({
      where: {
        OR: [
          { firstPartyId: currentUserId, secondPartyId: suggestedUserId },
          { firstPartyId: suggestedUserId, secondPartyId: currentUserId },
        ],
        // Only look at non-closed suggestions
        NOT: {
          status: {
            in: ["CLOSED", "CANCELLED", "EXPIRED", "MARRIED"],
          },
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstPartyId: true,
        secondPartyId: true,
        structuredRationale: true,
        firstParty: {
          select: {
            profile: { select: { contentUpdatedAt: true } },
          },
        },
        secondParty: {
          select: {
            profile: { select: { contentUpdatedAt: true } },
          },
        },
      },
    });

    // ── 4. Check cache (only if suggestion found) ──
    if (suggestion) {
      const isFirstParty = suggestion.firstPartyId === currentUserId;
      const cacheKey = isFirstParty ? "firstPartyAnalysis" : "secondPartyAnalysis";
      const rationale = (suggestion.structuredRationale as StructuredRationale) || {};
      const cached = rationale[cacheKey];

      const otherPartyContentUpdatedAt = isFirstParty
        ? suggestion.secondParty?.profile?.contentUpdatedAt
        : suggestion.firstParty?.profile?.contentUpdatedAt;

      if (isCacheValid(cached, otherPartyContentUpdatedAt)) {
        console.log(
          `[analyze-suggestion] Cache HIT for ${cacheKey} on suggestion ${suggestion.id}`
        );
        return NextResponse.json({ success: true, data: cached, cached: true });
      }
    }

    // ── 5. Verify both profiles exist ──
    const profilesExist = await prisma.profile.findMany({
      where: { userId: { in: [currentUserId, suggestedUserId] } },
      select: { userId: true },
    });

    if (profilesExist.length !== 2) {
      return NextResponse.json(
        { success: false, message: "One or both user profiles not found." },
        { status: 404 }
      );
    }

    // ── 6. Generate narratives ──
    const [currentUserNarrative, suggestedUserNarrative] = await Promise.all([
      profileAiService.generateNarrativeProfile(currentUserId),
      profileAiService.generateNarrativeProfile(suggestedUserId),
    ]);

    if (!currentUserNarrative || !suggestedUserNarrative) {
      return NextResponse.json(
        { success: false, message: "Could not generate user profile narratives." },
        { status: 500 }
      );
    }

    // ── 7. Call Gemini AI ──
    const analysisResult = await aiService.analyzeSuggestionForUser(
      currentUserNarrative,
      suggestedUserNarrative
    );

    if (!analysisResult) {
      return NextResponse.json(
        { success: false, message: "AI service failed to produce analysis." },
        { status: 500 }
      );
    }

    // ── 8. Cache result (if suggestion exists) ──
    if (suggestion) {
      try {
        const isFirstParty = suggestion.firstPartyId === currentUserId;
        const cacheKey = isFirstParty ? "firstPartyAnalysis" : "secondPartyAnalysis";
        const rationale = (suggestion.structuredRationale as StructuredRationale) || {};

        const otherPartyContentUpdatedAt = isFirstParty
          ? suggestion.secondParty?.profile?.contentUpdatedAt
          : suggestion.firstParty?.profile?.contentUpdatedAt;

        const cacheEntry: CachedUserAnalysis = {
          ...analysisResult,
          generatedAt: new Date().toISOString(),
          generatedForUserId: currentUserId,
          otherPartyProfileUpdatedAt: otherPartyContentUpdatedAt
            ? new Date(otherPartyContentUpdatedAt).toISOString()
            : null,
        };

        await prisma.matchSuggestion.update({
          where: { id: suggestion.id },
          data: {
            structuredRationale: {
              ...rationale,
              [cacheKey]: cacheEntry,
            } as any,
          },
        });

        console.log(
          `[analyze-suggestion] Cached ${cacheKey} for suggestion ${suggestion.id}`
        );
      } catch (cacheErr) {
        console.error("[analyze-suggestion] Cache write failed:", cacheErr);
      }
    }

    // ── 9. Return ──
    return NextResponse.json({ success: true, data: analysisResult });
  } catch (error) {
    console.error("[analyze-suggestion] Fatal error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, message: "Internal Server Error", details: msg },
      { status: 500 }
    );
  }
}