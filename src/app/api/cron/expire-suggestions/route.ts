// src/app/api/cron/expire-suggestions/route.ts
// ════════════════════════════════════════════════════════════════
// Cron endpoint: Expire suggestions that have passed their
// decision deadline without a response.
//
// Finds suggestions where:
//   - status IN (PENDING_FIRST_PARTY, PENDING_SECOND_PARTY)
//   - decisionDeadline IS NOT NULL
//   - decisionDeadline < now (deadline has passed)
// Then transitions each to EXPIRED via StatusTransitionService.
// ════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { MatchSuggestionStatus } from "@prisma/client";
import { statusTransitionService } from "@/components/matchmaker/suggestions/services/suggestions/StatusTransitionService";
import { getDictionary } from "@/lib/dictionaries";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Auth via CRON_SECRET
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { success: false, error: "CRON_SECRET not configured" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();

    // Find suggestions past their decision deadline
    const expiredSuggestions = await prisma.matchSuggestion.findMany({
      where: {
        status: {
          in: [
            MatchSuggestionStatus.PENDING_FIRST_PARTY,
            MatchSuggestionStatus.PENDING_SECOND_PARTY,
          ],
        },
        decisionDeadline: {
          not: null,
          lt: now,
        },
      },
      include: {
        firstParty: { include: { profile: true } },
        secondParty: { include: { profile: true } },
        matchmaker: true,
      },
    });

    if (expiredSuggestions.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: "No expired suggestions found",
      });
    }

    // Load dictionaries for email notifications
    const [heDict, enDict] = await Promise.all([
      getDictionary("he"),
      getDictionary("en"),
    ]);
    const dictionaries = {
      he: heDict.email,
      en: enDict.email,
    };

    let processed = 0;
    const errors: string[] = [];

    for (const suggestion of expiredSuggestions) {
      try {
        const firstPartyLang = (suggestion.firstParty as any).language || "he";
        const secondPartyLang = (suggestion.secondParty as any).language || "he";
        const matchmakerLang = (suggestion.matchmaker as any).language || "he";

        await statusTransitionService.transitionStatus(
          suggestion,
          MatchSuggestionStatus.EXPIRED,
          dictionaries,
          `Auto-expired: decision deadline passed (${suggestion.decisionDeadline?.toISOString()})`,
          {
            sendNotifications: true,
            notifyParties: ["first", "second", "matchmaker"],
            skipValidation: true,
          },
          {
            firstParty: firstPartyLang,
            secondParty: secondPartyLang,
            matchmaker: matchmakerLang,
          }
        );

        processed++;
        console.log(
          `[expire-suggestions] Expired suggestion ${suggestion.id} ` +
            `(${suggestion.firstParty.firstName} ↔ ${suggestion.secondParty.firstName}, ` +
            `was ${suggestion.status}, deadline: ${suggestion.decisionDeadline?.toISOString()})`
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        errors.push(`${suggestion.id}: ${msg}`);
        console.error(
          `[expire-suggestions] Error processing suggestion ${suggestion.id}:`,
          err
        );
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      total: expiredSuggestions.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[expire-suggestions] Cron error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process expired suggestions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
