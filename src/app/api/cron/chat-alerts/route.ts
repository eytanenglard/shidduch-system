// src/app/api/cron/chat-alerts/route.ts
// =============================================================================
// Cron endpoint: Detect unresponsive users & stale suggestions,
// then create MatchmakerAlert records for the responsible matchmaker.
//
// Should be called once or twice daily by Heroku Scheduler:
//   curl -X POST $NEXT_PUBLIC_APP_URL/api/cron/chat-alerts \
//     -H "x-cron-secret: $CRON_SECRET"
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  MatchSuggestionStatus,
  MessageSenderType,
  MatchmakerAlertType,
} from "@prisma/client";

export const dynamic = "force-dynamic";

// Terminal statuses — suggestions in these states are not "stale"
const TERMINAL_STATUSES: MatchSuggestionStatus[] = [
  MatchSuggestionStatus.MARRIED,
  MatchSuggestionStatus.CLOSED,
  MatchSuggestionStatus.EXPIRED,
  MatchSuggestionStatus.CANCELLED,
];

// How old a matchmaker message must be (with no reply) to trigger an alert
const NO_RESPONSE_DAYS = 3;

// How long since last activity on a non-terminal suggestion to be "stale"
const STALE_SUGGESTION_DAYS = 7;

// Don't create a duplicate alert if a similar non-dismissed one exists within this window
const DEDUP_DAYS = 7;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // ── Auth via x-cron-secret header ──
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json(
        { success: false, error: "CRON_SECRET not configured" },
        { status: 500 }
      );
    }

    const headerSecret = req.headers.get("x-cron-secret");
    if (headerSecret !== cronSecret) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    const noResponseCutoff = new Date(
      now.getTime() - NO_RESPONSE_DAYS * 24 * 60 * 60 * 1000
    );
    const staleCutoff = new Date(
      now.getTime() - STALE_SUGGESTION_DAYS * 24 * 60 * 60 * 1000
    );
    const dedupCutoff = new Date(
      now.getTime() - DEDUP_DAYS * 24 * 60 * 60 * 1000
    );

    let noResponseCount = 0;
    let staleCount = 0;
    const errors: string[] = [];

    // =====================================================================
    // 1. Detect unresponsive users
    //    Find SuggestionMessages sent by matchmaker 3+ days ago where the
    //    target user has NOT replied since that message.
    // =====================================================================
    try {
      // Find the latest matchmaker message per suggestion where the message
      // is older than the cutoff
      const matchmakerMessages = await prisma.suggestionMessage.findMany({
        where: {
          senderType: MessageSenderType.MATCHMAKER,
          createdAt: { lt: noResponseCutoff },
        },
        select: {
          id: true,
          suggestionId: true,
          senderId: true,
          targetUserId: true,
          createdAt: true,
          suggestion: {
            select: {
              id: true,
              matchmakerId: true,
              status: true,
              firstPartyId: true,
              secondPartyId: true,
              firstParty: {
                select: { firstName: true, lastName: true },
              },
              secondParty: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Group by suggestion — only consider the latest matchmaker message per suggestion
      const latestBysuggestion = new Map<
        string,
        (typeof matchmakerMessages)[0]
      >();
      for (const msg of matchmakerMessages) {
        if (
          !latestBysuggestion.has(msg.suggestionId) ||
          msg.createdAt >
            latestBysuggestion.get(msg.suggestionId)!.createdAt
        ) {
          latestBysuggestion.set(msg.suggestionId, msg);
        }
      }

      for (const [suggestionId, msg] of latestBysuggestion) {
        // Skip terminal suggestions
        if (TERMINAL_STATUSES.includes(msg.suggestion.status)) continue;

        // Check if there's a reply from the target user after this message
        const targetUserId =
          msg.targetUserId ||
          // If no targetUserId, the target is whichever party is NOT the matchmaker
          (msg.suggestion.firstPartyId !== msg.senderId
            ? msg.suggestion.firstPartyId
            : msg.suggestion.secondPartyId);

        const replyExists = await prisma.suggestionMessage.findFirst({
          where: {
            suggestionId,
            senderId: targetUserId,
            createdAt: { gt: msg.createdAt },
          },
          select: { id: true },
        });

        if (replyExists) continue;

        // Deduplicate: check if a similar alert already exists
        const existingAlert = await prisma.matchmakerAlert.findFirst({
          where: {
            matchmakerId: msg.suggestion.matchmakerId,
            alertType: MatchmakerAlertType.NO_RESPONSE,
            suggestionId,
            isDismissed: false,
            createdAt: { gte: dedupCutoff },
          },
          select: { id: true },
        });

        if (existingAlert) continue;

        // Determine which user is not responding
        const isFirstParty = targetUserId === msg.suggestion.firstPartyId;
        const targetName = isFirstParty
          ? `${msg.suggestion.firstParty.firstName} ${msg.suggestion.firstParty.lastName}`
          : `${msg.suggestion.secondParty.firstName} ${msg.suggestion.secondParty.lastName}`;

        const daysSinceMessage = Math.floor(
          (now.getTime() - msg.createdAt.getTime()) / (24 * 60 * 60 * 1000)
        );

        await prisma.matchmakerAlert.create({
          data: {
            matchmakerId: msg.suggestion.matchmakerId,
            alertType: MatchmakerAlertType.NO_RESPONSE,
            userId: targetUserId,
            suggestionId,
            message: `${targetName} has not responded for ${daysSinceMessage} days`,
          },
        });

        noResponseCount++;
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      errors.push(`[no-response] ${errMsg}`);
      console.error("[chat-alerts] Error detecting unresponsive users:", err);
    }

    // =====================================================================
    // 2. Detect stale suggestions
    //    Suggestions with non-terminal status and no activity for 7+ days
    // =====================================================================
    try {
      const staleSuggestions = await prisma.matchSuggestion.findMany({
        where: {
          status: { notIn: TERMINAL_STATUSES },
          lastActivity: { lt: staleCutoff },
        },
        select: {
          id: true,
          matchmakerId: true,
          firstPartyId: true,
          secondPartyId: true,
          status: true,
          lastActivity: true,
          firstParty: {
            select: { firstName: true, lastName: true },
          },
          secondParty: {
            select: { firstName: true, lastName: true },
          },
        },
      });

      for (const suggestion of staleSuggestions) {
        // Deduplicate
        const existingAlert = await prisma.matchmakerAlert.findFirst({
          where: {
            matchmakerId: suggestion.matchmakerId,
            alertType: MatchmakerAlertType.STALE_SUGGESTION,
            suggestionId: suggestion.id,
            isDismissed: false,
            createdAt: { gte: dedupCutoff },
          },
          select: { id: true },
        });

        if (existingAlert) continue;

        const daysSinceActivity = Math.floor(
          (now.getTime() - suggestion.lastActivity.getTime()) /
            (24 * 60 * 60 * 1000)
        );

        await prisma.matchmakerAlert.create({
          data: {
            matchmakerId: suggestion.matchmakerId,
            alertType: MatchmakerAlertType.STALE_SUGGESTION,
            suggestionId: suggestion.id,
            message: `Suggestion ${suggestion.firstParty.firstName} ↔ ${suggestion.secondParty.firstName}: no activity for ${daysSinceActivity} days (status: ${suggestion.status})`,
          },
        });

        staleCount++;
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      errors.push(`[stale-suggestion] ${errMsg}`);
      console.error("[chat-alerts] Error detecting stale suggestions:", err);
    }

    console.log(
      `[chat-alerts] Created ${noResponseCount} no-response alerts, ${staleCount} stale-suggestion alerts`
    );

    return NextResponse.json({
      success: true,
      alerts: {
        noResponse: noResponseCount,
        staleSuggestion: staleCount,
        total: noResponseCount + staleCount,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[chat-alerts] Cron error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process chat alerts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
