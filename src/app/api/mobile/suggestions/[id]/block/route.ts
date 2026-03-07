// src/app/api/mobile/suggestions/[id]/block/route.ts
// ============================================================
// חסימת משתמש מהצעת שידוך
// Apple Guideline 1.2 compliance: mechanism for blocking abusive users
// Blocking removes content from user's feed instantly + notifies developer
// UPDATED: Now sends email notification to matchmaker + admin
// ============================================================

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from "@/lib/mobile-auth";
import { emailService } from "@/lib/email/emailService";

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const suggestionId = params.id;

    const auth = await verifyMobileToken(req);
    if (!auth) {
      return corsError(req, "Unauthorized", 401);
    }

    const userId = auth.userId;

    const body = await req.json();
    const { reason } = body as { reason?: string };

    // Get the suggestion
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      select: {
        id: true,
        status: true,
        firstPartyId: true,
        secondPartyId: true,
        matchmakerId: true,
      },
    });

    if (!suggestion) {
      return corsError(req, "Suggestion not found", 404);
    }

    const isFirstParty = suggestion.firstPartyId === userId;
    const isSecondParty = suggestion.secondPartyId === userId;

    if (!isFirstParty && !isSecondParty) {
      return corsError(req, "Access denied", 403);
    }

    // The blocked user is the OTHER party
    const blockedUserId = isFirstParty
      ? suggestion.secondPartyId
      : suggestion.firstPartyId;

    // Variable to store the report ID for email notification
    let autoReportId: string | null = null;

    // Execute block in a transaction:
    // 1. Create block record (or skip if already blocked)
    // 2. Close/cancel the suggestion immediately
    // 3. Create status history entry
    // 4. Auto-create a report for the dev team
    await prisma.$transaction(async (tx) => {
      // 1. Create the block (upsert to handle duplicates gracefully)
      await tx.userBlock.upsert({
        where: {
          blockerId_blockedUserId: {
            blockerId: userId,
            blockedUserId,
          },
        },
        create: {
          blockerId: userId,
          blockedUserId,
          suggestionId,
          reason: reason || null,
        },
        update: {
          // Already blocked — update reason if provided
          reason: reason || undefined,
        },
      });

      // 2. Close the suggestion (remove from user's feed instantly)
      const closableStatuses = [
        "PENDING_FIRST_PARTY",
        "FIRST_PARTY_APPROVED",
        "FIRST_PARTY_INTERESTED",
        "PENDING_SECOND_PARTY",
        "SECOND_PARTY_APPROVED",
        "AWAITING_MATCHMAKER_APPROVAL",
        "CONTACT_DETAILS_SHARED",
        "MATCH_APPROVED",
      ];

      if (closableStatuses.includes(suggestion.status)) {
        await tx.matchSuggestion.update({
          where: { id: suggestionId },
          data: {
            status: "CANCELLED",
            lastStatusChange: new Date(),
            lastActivity: new Date(),
            closedAt: new Date(),
            category: "HISTORY",
            // Clear rank if it was in INTERESTED
            firstPartyRank: null,
          },
        });

        // 3. Status history
        await tx.suggestionStatusHistory.create({
          data: {
            suggestionId,
            status: "CANCELLED",
            notes: `חסימת משתמש: ${isFirstParty ? "צד א" : "צד ב"} חסם את הצד השני${reason ? ` - ${reason}` : ""}`,
          },
        });
      }

      // 4. Auto-create a report for the dev team to review within 24 hours
      const autoReport = await tx.userReport.create({
        data: {
          reporterId: userId,
          reportedUserId: blockedUserId,
          suggestionId,
          reason: "HARASSMENT",
          details: `[Auto-created from block] ${reason || "User blocked without specific reason"}`,
        },
      });

      autoReportId = autoReport.id;
    });

    console.log(
      `[mobile/suggestions/${suggestionId}/block] User ${userId} blocked user ${blockedUserId}`
    );

    // ============================================================
    // Send email notification to matchmaker + admin
    // ============================================================
    try {
      // Get blocker (reporter) info
      const blocker = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, email: true, language: true },
      });

      // Get blocked user info
      const blockedUser = await prisma.user.findUnique({
        where: { id: blockedUserId },
        select: { firstName: true, lastName: true, email: true },
      });

      // Get matchmaker info
      const matchmaker = await prisma.user.findUnique({
        where: { id: suggestion.matchmakerId },
        select: { firstName: true, lastName: true, email: true },
      });

      if (blocker && blockedUser && matchmaker && autoReportId) {
        const emailParams = {
          locale: (blocker.language as "he" | "en") || "he",
          reporterName: `${blocker.firstName} ${blocker.lastName}`,
          reporterEmail: blocker.email,
          reportedUserName: `${blockedUser.firstName} ${blockedUser.lastName}`,
          reportedUserEmail: blockedUser.email,
          reason: "HARASSMENT",
          details: reason
            ? `[Block] ${reason}`
            : "[Block] User blocked without specific reason",
          reportType: "BLOCK" as const,
          suggestionId,
          reportId: autoReportId,
        };

        // Send to matchmaker
        await emailService.sendReportNotification({
          ...emailParams,
          toEmail: matchmaker.email,
          toName: `${matchmaker.firstName} ${matchmaker.lastName}`,
        });

        console.log(
          `[Block] Email notification sent to matchmaker: ${matchmaker.email}`
        );

        // Also send to admin email (if configured and different from matchmaker)
        const adminEmail =
          process.env.ADMIN_REPORT_EMAIL || process.env.SUPPORT_EMAIL;
        if (adminEmail && adminEmail !== matchmaker.email) {
          await emailService.sendReportNotification({
            ...emailParams,
            locale: "he",
            toEmail: adminEmail,
            toName: "Admin",
          });

          console.log(`[Block] Email notification sent to admin: ${adminEmail}`);
        }
      }
    } catch (emailError) {
      // Don't fail the request if email fails - block is still processed
      console.error("[Block] Failed to send email notification:", emailError);
    }

    return corsJson(req, {
      success: true,
      message: "המשתמש נחסם בהצלחה. ההצעה הוסרה מהרשימה שלך.",
      data: {
        blockedUserId,
        suggestionCancelled: true,
      },
    });
  } catch (error) {
    console.error("[mobile/suggestions/[id]/block] Error:", error);
    return corsError(req, "Internal server error", 500);
  }
}