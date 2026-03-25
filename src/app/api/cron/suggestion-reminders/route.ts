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

// Status for "saved for later" — needs a gentle revisit reminder
const INTERESTED_STATUS = MatchSuggestionStatus.FIRST_PARTY_INTERESTED;

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
      select: {
        id: true,
        status: true,
        decisionDeadline: true,
        secondPartyContested: true,
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
            notes: { contains: "תזכורת" },
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

    // Hours threshold to consider "last reminder before expiration"
    const LAST_REMINDER_THRESHOLD_HOURS = 30;

    console.log(
      `[suggestion-reminders] Found ${pendingSuggestions.length} pending auto-suggestions`
    );

    let sent = 0;
    let sentContested = 0;
    let sentLastReminder = 0;
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

      // Detect reminder variant
      const hoursUntilDeadline = suggestion.decisionDeadline
        ? (new Date(suggestion.decisionDeadline).getTime() - now.getTime()) / (1000 * 60 * 60)
        : Infinity;
      const isLastReminder = hoursUntilDeadline <= LAST_REMINDER_THRESHOLD_HOURS;
      const isContested = suggestion.secondPartyContested === true;

      const greeting = isHebrew
        ? `שלום ${recipient.firstName},`
        : `Hello ${recipient.firstName},`;

      // Subject varies by variant
      const subject = isLastReminder
        ? (isHebrew ? "⚡ תזכורת אחרונה – ההצעה עומדת לפוג" : "⚡ Last reminder – your match is about to expire")
        : isContested
          ? (isHebrew ? "🔥 ההצעה שלך מבוקשת – מומלץ להגיב בהקדם" : "🔥 Your match is in demand – respond soon")
          : (isHebrew ? "⏰ ההצעה שלך עדיין מחכה לך" : "⏰ Your match is still waiting for you");

      // Body text varies by variant
      const mainText = isLastReminder
        ? (isHebrew
            ? "ההצעה שקיבלת עומדת לפוג בקרוב. אם ההצעה לא מתאימה לך – זה בסדר גמור, לחצ/י על 'לא מתאים' כדי שנוכל להמשיך למצוא עבורך את ההצעה הנכונה."
            : "Your match is about to expire soon. If it's not the right fit – that's perfectly okay, click 'Not interested' so we can continue finding the right match for you.")
        : isContested
          ? (isHebrew
              ? "שלחנו לך הצעת שידוך שנבחרה במיוחד עבורך. ההצעה מבוקשת ומומלץ להגיב בהקדם. קח/י רגע לצפות בה – זה יכול לעשות את ההבדל."
              : "We sent you a specially selected match. This match is in demand – we recommend responding soon. Take a moment to review it – it could make all the difference.")
          : (isHebrew
              ? "שלחנו לך הצעת שידוך שנבחרה במיוחד עבורך על בסיס הלמידה של המערכת. היא עדיין מחכה לתגובתך. קח/י רגע לצפות בה – אולי זה הדבר הכי חשוב שתעשה/י היום."
              : "We sent you a specially selected match based on our system's learning. It's still waiting for your response. Take a moment to review it – this could be the most important thing you do today.");

      const body = [
        greeting,
        "",
        mainText,
        "",
        isHebrew
          ? `👉 צפה בהצעה: ${reviewUrl}`
          : `👉 View match: ${reviewUrl}`,
        "",
        isHebrew ? "בברכה," : "Best regards,",
        isHebrew ? "NeshamaTech - המערכת החכמה" : "NeshamaTech Smart System",
      ].join("\n");

      // Header icon + title vary by variant
      const headerEmoji = isLastReminder ? "⚡" : isContested ? "🔥" : "⏰";
      const headerTitle = isLastReminder
        ? (isHebrew ? "תזכורת אחרונה" : "Last Reminder")
        : isContested
          ? (isHebrew ? "ההצעה שלך מבוקשת" : "Your Match is In Demand")
          : (isHebrew ? "ההצעה שלך מחכה" : "Your Match is Waiting");
      const headerGradient = isLastReminder
        ? "linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #7f1d1d 100%)"
        : isContested
          ? "linear-gradient(135deg, #78350f 0%, #92400e 50%, #78350f 100%)"
          : "linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)";

      const htmlBody = `
        <div style="background: ${headerGradient}; color: #ffffff; padding: 35px 25px; text-align: center; border-radius: 16px 16px 0 0;">
          <span style="font-size: 32px; display: block; margin-bottom: 10px;">${headerEmoji}</span>
          <h1 style="margin: 0; font-size: 24px; color: #fbbf24;">${headerTitle}</h1>
        </div>
        <div style="padding: 30px 25px; font-family: 'Segoe UI', sans-serif; direction: ${isHebrew ? "rtl" : "ltr"}; text-align: ${isHebrew ? "right" : "left"};">
          <p style="font-size: 20px; color: #1e293b; margin-bottom: 15px;">${greeting}</p>
          <p style="color: #475569; line-height: 1.8; margin-bottom: 25px;">
            ${mainText}
          </p>
          ${isContested ? `
          <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; text-align: center;">
            <span style="color: #92400e; font-weight: 600; font-size: 14px;">
              ${isHebrew ? "🔥 ההצעה מבוקשת – מומלץ להגיב בהקדם" : "🔥 This match is in demand – respond soon"}
            </span>
          </div>` : ""}
          ${isLastReminder ? `
          <div style="background: #fef2f2; border: 1px solid #ef4444; border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; text-align: center;">
            <span style="color: #991b1b; font-weight: 600; font-size: 14px;">
              ${isHebrew ? "⏳ ההצעה עומדת לפוג – הגב/י או סרב/י כדי שנמשיך לחפש עבורך" : "⏳ This match is about to expire – respond or decline so we can keep searching for you"}
            </span>
          </div>` : ""}
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

        // 6. Log a SuggestionStatusHistory entry with variant-specific notes
        const reminderNote = isLastReminder
          ? "תזכורת אחרונה - ההצעה עומדת לפוג"
          : isContested
            ? "תזכורת - ההצעה מבוקשת"
            : "תזכורת אוטומטית - ההצעה ממתינה לתגובה";

        await prisma.suggestionStatusHistory.create({
          data: {
            suggestionId: suggestion.id,
            status: suggestion.status,
            notes: reminderNote,
          },
        });

        sent++;
        if (isContested) sentContested++;
        if (isLastReminder) sentLastReminder++;
        console.log(
          `[suggestion-reminders] Reminder sent to ${recipient.email} for suggestion ${suggestion.id}` +
          (isLastReminder ? " (last reminder)" : isContested ? " (contested)" : "")
        );
      } catch (error) {
        failed++;
        console.error(
          `[suggestion-reminders] Failed to send reminder for suggestion ${suggestion.id}:`,
          error
        );
      }
    }

    // === Part 2: Send reminders for INTERESTED (saved for later) suggestions ===
    // Remind users who saved a suggestion 48h+ ago to revisit it
    const INTERESTED_REMINDER_HOURS = 48;
    const interestedCutoff = new Date(
      now.getTime() - INTERESTED_REMINDER_HOURS * 60 * 60 * 1000
    );

    let sentInterested = 0;

    const interestedSuggestions = await prisma.matchSuggestion.findMany({
      where: {
        isAutoSuggestion: true,
        status: INTERESTED_STATUS,
        firstPartyInterestedAt: { not: null, lt: interestedCutoff },
      },
      select: {
        id: true,
        status: true,
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
            firstName: true,
          },
        },
        statusHistory: {
          where: {
            notes: { contains: "תזכורת שמירה" },
          },
          select: { id: true },
          take: 1,
        },
      },
    });

    console.log(
      `[suggestion-reminders] Found ${interestedSuggestions.length} saved/interested suggestions`
    );

    for (const suggestion of interestedSuggestions) {
      // Skip if already reminded for this "interested" state
      if (suggestion.statusHistory.length > 0) {
        skipped++;
        continue;
      }

      const recipient = suggestion.firstParty;
      if (!recipient?.email) {
        skipped++;
        continue;
      }

      const locale = (recipient.language as "he" | "en") || "he";
      const isHebrew = locale === "he";
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const reviewUrl = `${baseUrl}/matches`;

      const otherName = suggestion.secondParty?.firstName || "";
      const subject = isHebrew
        ? `💭 שמרת הצעה – ${otherName} עדיין ממתין/ה`
        : `💭 You saved a match – ${otherName} is still waiting`;

      const mainText = isHebrew
        ? `שמרת הצעת שידוך עם ${otherName} לגיבוי. ההצעה עדיין פעילה — קח/י רגע לצפות שוב ולהחליט. אם ההצעה לא מתאימה, זה בסדר גמור — דחייה עוזרת למערכת ללמוד ולהציע לך הצעות טובות יותר.`
        : `You saved a match with ${otherName} for later. The suggestion is still active — take a moment to review and decide. If it's not the right fit, that's perfectly okay — declining helps our system learn and suggest better matches.`;

      const htmlBody = `
        <div style="background: linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #4c1d95 100%); color: #ffffff; padding: 35px 25px; text-align: center; border-radius: 16px 16px 0 0;">
          <span style="font-size: 32px; display: block; margin-bottom: 10px;">💭</span>
          <h1 style="margin: 0; font-size: 24px; color: #c4b5fd;">${isHebrew ? "ההצעה ששמרת" : "Your Saved Match"}</h1>
        </div>
        <div style="padding: 30px 25px; font-family: 'Segoe UI', sans-serif; direction: ${isHebrew ? "rtl" : "ltr"}; text-align: ${isHebrew ? "right" : "left"};">
          <p style="font-size: 20px; color: #1e293b; margin-bottom: 15px;">${isHebrew ? `שלום ${recipient.firstName},` : `Hello ${recipient.firstName},`}</p>
          <p style="color: #475569; line-height: 1.8; margin-bottom: 25px;">${mainText}</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${reviewUrl}" style="display: inline-block; padding: 16px 45px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: #ffffff !important; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px;">
              ${isHebrew ? "👀 צפה בהצעה" : "👀 Review Match"}
            </a>
          </div>
          <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p>NeshamaTech - ${isHebrew ? "המערכת החכמה" : "Smart System"}</p>
          </div>
        </div>
      `;

      try {
        await notificationService.sendNotification(
          {
            email: recipient.email,
            phone: recipient.phone || undefined,
            name: recipient.firstName || "",
          },
          {
            subject,
            body: `${isHebrew ? `שלום ${recipient.firstName},` : `Hello ${recipient.firstName},`}\n\n${mainText}\n\n${isHebrew ? `👉 צפה בהצעה: ${reviewUrl}` : `👉 Review match: ${reviewUrl}`}`,
            htmlBody,
          },
          { channels: ["email"] } // Email only for gentle reminder
        );

        await prisma.suggestionStatusHistory.create({
          data: {
            suggestionId: suggestion.id,
            status: suggestion.status,
            notes: "תזכורת שמירה - ההצעה נשמרה לגיבוי וממתינה להחלטה",
          },
        });

        sentInterested++;
        sent++;
        console.log(
          `[suggestion-reminders] Interested reminder sent to ${recipient.email} for suggestion ${suggestion.id}`
        );
      } catch (error) {
        failed++;
        console.error(
          `[suggestion-reminders] Failed to send interested reminder for suggestion ${suggestion.id}:`,
          error
        );
      }
    }

    const elapsed = Date.now() - startTime;

    const summary = {
      total: pendingSuggestions.length + interestedSuggestions.length,
      sent,
      sentContested,
      sentLastReminder,
      sentInterested,
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
