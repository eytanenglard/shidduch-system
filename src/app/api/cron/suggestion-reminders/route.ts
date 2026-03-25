// src/app/api/cron/suggestion-reminders/route.ts
// =============================================================================
// NeshamaTech - Daily Auto-Suggestion Reminder Cron
// Runs daily (independent of daily-suggestions cron which runs Sun/Wed).
// Sends reminders for pending auto-suggestions that haven't been responded to.
//
// Called by Heroku Scheduler:
//   curl -X POST $NEXT_PUBLIC_APP_URL/api/cron/suggestion-reminders \
//     -H "Authorization: Bearer $CRON_SECRET"
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { MatchSuggestionStatus } from "@prisma/client";
import { initNotificationService } from "@/components/matchmaker/suggestions/services/notification/initNotifications";

export const dynamic = "force-dynamic";

// Statuses that indicate the suggestion is waiting for a party's response
const PENDING_STATUSES: MatchSuggestionStatus[] = [
  MatchSuggestionStatus.PENDING_FIRST_PARTY,
  MatchSuggestionStatus.PENDING_SECOND_PARTY,
];

// Minimum hours before first reminder is sent
const MIN_HOURS_BEFORE_REMINDER = 24;

// Minimum hours between consecutive reminders
const REMINDER_COOLDOWN_HOURS = 24;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // 1. Auth via CRON_SECRET
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json(
        { success: false, error: "CRON_SECRET not configured" },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(
      now.getTime() - MIN_HOURS_BEFORE_REMINDER * 60 * 60 * 1000
    );

    // 2. Find all pending auto-suggestions older than 24h with a valid deadline
    const pendingSuggestions = await prisma.matchSuggestion.findMany({
      where: {
        isAutoSuggestion: true,
        status: { in: PENDING_STATUSES },
        createdAt: { lt: twentyFourHoursAgo },
        decisionDeadline: {
          not: null,
          gt: now, // Deadline hasn't passed yet
        },
      },
      include: {
        firstParty: {
          select: {
            id: true,
            email: true,
            firstName: true,
            phone: true,
            language: true,
          },
        },
        secondParty: {
          select: {
            id: true,
            email: true,
            firstName: true,
            phone: true,
            language: true,
          },
        },
        statusHistory: {
          where: {
            notes: { contains: "reminder" },
            createdAt: {
              gte: new Date(
                now.getTime() - REMINDER_COOLDOWN_HOURS * 60 * 60 * 1000
              ),
            },
          },
          select: { id: true },
          take: 1,
        },
      },
    });

    console.log(
      `[suggestion-reminders] Found ${pendingSuggestions.length} pending auto-suggestions`
    );

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    const notificationService = initNotificationService();

    for (const suggestion of pendingSuggestions) {
      // 3. Skip if a reminder was already sent in the last 24h
      if (suggestion.statusHistory.length > 0) {
        skipped++;
        continue;
      }

      // 4. Determine recipient based on status
      const recipient =
        suggestion.status === MatchSuggestionStatus.PENDING_FIRST_PARTY
          ? suggestion.firstParty
          : suggestion.secondParty;

      if (!recipient?.email) {
        console.warn(
          `[suggestion-reminders] No email for recipient on suggestion ${suggestion.id}`
        );
        skipped++;
        continue;
      }

      const locale = (recipient.language as "he" | "en") || "he";
      const isHebrew = locale === "he";
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const reviewUrl = `${baseUrl}/matches`;

      const greeting = isHebrew
        ? `שלום ${recipient.firstName},`
        : `Hello ${recipient.firstName},`;

      const subject = isHebrew
        ? "⏰ ההצעה שלך עדיין מחכה לך"
        : "⏰ Your match is still waiting for you";

      const body = [
        greeting,
        "",
        isHebrew
          ? "שלחנו לך הצעת שידוך שנבחרה במיוחד עבורך. היא עדיין מחכה לתגובתך."
          : "We sent you a specially selected match that's still waiting for your response.",
        "",
        isHebrew
          ? `👉 צפה בהצעה: ${reviewUrl}`
          : `👉 View match: ${reviewUrl}`,
        "",
        isHebrew ? "בברכה," : "Best regards,",
        isHebrew ? "NeshamaTech - המערכת החכמה" : "NeshamaTech Smart System",
      ].join("\n");

      const htmlBody = `
        <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%); color: #ffffff; padding: 35px 25px; text-align: center; border-radius: 16px 16px 0 0;">
          <span style="font-size: 32px; display: block; margin-bottom: 10px;">⏰</span>
          <h1 style="margin: 0; font-size: 24px; color: #fbbf24;">${isHebrew ? "ההצעה שלך מחכה" : "Your Match is Waiting"}</h1>
        </div>
        <div style="padding: 30px 25px; font-family: 'Segoe UI', sans-serif; direction: ${isHebrew ? "rtl" : "ltr"}; text-align: ${isHebrew ? "right" : "left"};">
          <p style="font-size: 20px; color: #1e293b; margin-bottom: 15px;">${greeting}</p>
          <p style="color: #475569; line-height: 1.8; margin-bottom: 25px;">
            ${
              isHebrew
                ? "שלחנו לך הצעת שידוך שנבחרה במיוחד עבורך על בסיס הלמידה של המערכת. היא עדיין מחכה לתגובתך. קח/י רגע לצפות בה – אולי זה הדבר הכי חשוב שתעשה/י היום."
                : "We sent you a specially selected match based on our system's learning. It's still waiting for your response. Take a moment to review it – this could be the most important thing you do today."
            }
          </p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${reviewUrl}" style="display: inline-block; padding: 16px 45px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #1e293b !important; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px;">
              ${isHebrew ? "👀 צפה בהצעה" : "👀 View Match"}
            </a>
          </div>
          <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p>NeshamaTech - ${isHebrew ? "המערכת החכמה" : "Smart System"}</p>
          </div>
        </div>
      `;

      try {
        // 5. Send reminder notification
        await notificationService.sendNotification(
          {
            email: recipient.email,
            phone: recipient.phone || undefined,
            name: recipient.firstName || "",
          },
          { subject, body, htmlBody },
          { channels: ["email", "whatsapp"] }
        );

        // 6. Log a SuggestionStatusHistory entry
        await prisma.suggestionStatusHistory.create({
          data: {
            suggestionId: suggestion.id,
            status: suggestion.status,
            notes: "תזכורת אוטומטית - ההצעה ממתינה לתגובה",
          },
        });

        sent++;
        console.log(
          `[suggestion-reminders] Reminder sent to ${recipient.email} for suggestion ${suggestion.id}`
        );
      } catch (error) {
        failed++;
        console.error(
          `[suggestion-reminders] Failed to send reminder for suggestion ${suggestion.id}:`,
          error
        );
      }
    }

    const elapsed = Date.now() - startTime;

    const summary = {
      total: pendingSuggestions.length,
      sent,
      skipped,
      failed,
      elapsedMs: elapsed,
    };

    console.log(`[suggestion-reminders] Done.`, summary);

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error("[suggestion-reminders] Cron failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
