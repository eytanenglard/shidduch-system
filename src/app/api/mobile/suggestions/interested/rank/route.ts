// src/app/api/mobile/suggestions/interested/rank/route.ts
// עדכון סדר עדיפויות של הצעות INTERESTED - למובייל

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from "@/lib/mobile-auth";

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);

    if (!auth) {
      return corsError(req, "Unauthorized", 401);
    }

    const userId = auth.userId;
    const body = await req.json();
    const { rankedSuggestionIds } = body as { rankedSuggestionIds: string[] };

    if (
      !rankedSuggestionIds ||
      !Array.isArray(rankedSuggestionIds) ||
      rankedSuggestionIds.length === 0
    ) {
      return corsError(req, "rankedSuggestionIds is required", 400);
    }

    // Verify all suggestions belong to this user and are INTERESTED
    const suggestions = await prisma.matchSuggestion.findMany({
      where: {
        id: { in: rankedSuggestionIds },
        firstPartyId: userId,
        status: "FIRST_PARTY_INTERESTED",
      },
      select: { id: true },
    });

    const validIds = new Set(suggestions.map((s) => s.id));
    const invalidIds = rankedSuggestionIds.filter((id) => !validIds.has(id));

    if (invalidIds.length > 0) {
      return corsError(req, "Some suggestions are not valid for ranking", 400);
    }

    // Update ranks in transaction
    await prisma.$transaction(
      rankedSuggestionIds.map((id, index) =>
        prisma.matchSuggestion.update({
          where: { id },
          data: {
            firstPartyRank: index + 1,
            lastActivity: new Date(),
          },
        })
      )
    );

    console.log(
      `[mobile/suggestions/interested/rank] User ${userId} reordered ${rankedSuggestionIds.length} suggestions`
    );

    return corsJson(req, {
      success: true,
      message: "Ranks updated successfully",
      count: rankedSuggestionIds.length,
    });
  } catch (error) {
    console.error("[mobile/suggestions/interested/rank] Error:", error);
    return corsError(req, "Internal server error", 500);
  }
}