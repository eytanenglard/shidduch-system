// src/app/api/cron/send-delayed-notifications/route.ts
// ════════════════════════════════════════════════════════════════
// Cron endpoint: Send delayed matchmaker notifications for
// FIRST_PARTY_APPROVED suggestions after the grace period expires.
//
// Should be called every 1-2 minutes by Heroku Scheduler or similar.
// Finds suggestions where:
//   - status = FIRST_PARTY_APPROVED
//   - matchmakerNotifiedAt IS NULL (not yet notified)
//   - firstPartyResponded + GRACE_PERIOD < now (grace period expired)
// Then sends notifications and marks them as notified.
// ════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { MatchSuggestionStatus } from "@prisma/client";
import { notifyStatusChange } from "@/lib/pushNotifications";
import { notificationService } from "@/components/matchmaker/suggestions/services/notification/NotificationService";
import { getDictionary } from "@/lib/dictionaries";

export const dynamic = "force-dynamic";

const GRACE_PERIOD_MINUTES = 5;
const STALE_REMINDER_HOURS = 12;

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

    const gracePeriodAgo = new Date(Date.now() - GRACE_PERIOD_MINUTES * 60 * 1000);

    // Find suggestions awaiting delayed notification
    const pendingSuggestions = await prisma.matchSuggestion.findMany({
      where: {
        status: MatchSuggestionStatus.FIRST_PARTY_APPROVED,
        matchmakerNotifiedAt: null,
        firstPartyResponded: {
          lt: gracePeriodAgo,
        },
      },
      include: {
        firstParty: { include: { profile: true } },
        secondParty: { include: { profile: true } },
        matchmaker: true,
      },
    });

    // Load dictionaries for email notifications (needed by both sections)
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

    for (const suggestion of pendingSuggestions) {
      try {
        // 1. Send push notification to matchmaker
        await notifyStatusChange({
          userId: suggestion.matchmakerId,
          suggestionId: suggestion.id,
          statusMessage: `${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName} אישר/ה את ההצעה! ✅`,
        });

        // 2. Send email/WhatsApp notification
        await notificationService.handleSuggestionStatusChange(
          suggestion,
          dictionaries,
          {
            channels: ["email", "whatsapp"],
            notifyParties: ["matchmaker"],
          },
          {
            firstParty: (suggestion.firstParty as any).language || "he",
            secondParty: (suggestion.secondParty as any).language || "he",
            matchmaker: (suggestion.matchmaker as any).language || "he",
          }
        );

        // 3. Mark as notified
        await prisma.matchSuggestion.update({
          where: { id: suggestion.id },
          data: { matchmakerNotifiedAt: new Date() },
        });

        processed++;
        console.log(
          `[delayed-notifications] Sent notification for suggestion ${suggestion.id} ` +
          `(${suggestion.firstParty.firstName} → matchmaker ${suggestion.matchmaker.firstName})`
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        errors.push(`${suggestion.id}: ${msg}`);
        console.error(
          `[delayed-notifications] Error processing suggestion ${suggestion.id}:`,
          err
        );
      }
    }

    // ════════════════════════════════════════════════════════════════
    // Section 2: Stale reminders for auto-suggestions
    // Find FIRST_PARTY_APPROVED auto-suggestions that were notified
    // 12+ hours ago but still haven't been acted on by the matchmaker.
    // ════════════════════════════════════════════════════════════════

    const staleThreshold = new Date(Date.now() - STALE_REMINDER_HOURS * 60 * 60 * 1000);

    const staleSuggestions = await prisma.matchSuggestion.findMany({
      where: {
        status: MatchSuggestionStatus.FIRST_PARTY_APPROVED,
        isAutoSuggestion: true,
        matchmakerNotifiedAt: {
          not: null,
          lt: staleThreshold,
        },
        // Exclude suggestions that already received a stale reminder in the last 12h
        NOT: {
          statusHistory: {
            some: {
              notes: { contains: "stale-reminder" },
              createdAt: { gt: staleThreshold },
            },
          },
        },
      },
      include: {
        firstParty: { include: { profile: true } },
        secondParty: { include: { profile: true } },
        matchmaker: true,
      },
    });

    let staleProcessed = 0;
    const staleErrors: string[] = [];

    for (const suggestion of staleSuggestions) {
      try {
        // 1. Send push notification to matchmaker
        await notifyStatusChange({
          userId: suggestion.matchmakerId,
          suggestionId: suggestion.id,
          statusMessage: "⏰ הצעה אוטומטית ממתינה לפעולה שלך!",
        });

        // 2. Send email reminder
        await notificationService.handleSuggestionStatusChange(
          suggestion,
          dictionaries,
          {
            channels: ["email"],
            notifyParties: ["matchmaker"],
          },
          {
            firstParty: (suggestion.firstParty as any).language || "he",
            secondParty: (suggestion.secondParty as any).language || "he",
            matchmaker: (suggestion.matchmaker as any).language || "he",
          }
        );

        // 3. Record stale reminder in status history to prevent duplicate reminders
        await prisma.suggestionStatusHistory.create({
          data: {
            suggestionId: suggestion.id,
            status: MatchSuggestionStatus.FIRST_PARTY_APPROVED,
            notes: "stale-reminder: matchmaker reminded about pending auto-suggestion",
          },
        });

        staleProcessed++;
        console.log(
          `[delayed-notifications] Sent stale reminder for suggestion ${suggestion.id} ` +
          `(matchmaker ${suggestion.matchmaker.firstName}, pending since ${suggestion.matchmakerNotifiedAt?.toISOString()})`
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        staleErrors.push(`${suggestion.id}: ${msg}`);
        console.error(
          `[delayed-notifications] Error sending stale reminder for suggestion ${suggestion.id}:`,
          err
        );
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      total: pendingSuggestions.length,
      errors: errors.length > 0 ? errors : undefined,
      staleReminders: {
        processed: staleProcessed,
        total: staleSuggestions.length,
        errors: staleErrors.length > 0 ? staleErrors : undefined,
      },
    });
  } catch (error) {
    console.error("[delayed-notifications] Cron error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process delayed notifications",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
