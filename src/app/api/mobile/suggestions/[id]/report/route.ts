// src/app/api/mobile/suggestions/[id]/report/route.ts
// ============================================================
// דיווח על תוכן פוגעני בהצעת שידוך
// Apple Guideline 1.2 compliance: mechanism for flagging objectionable content
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
    const { reason, details } = body as {
      reason: string;
      details?: string;
    };

    // Validate reason
    const validReasons = [
      "INAPPROPRIATE_CONTENT",
      "FAKE_PROFILE",
      "HARASSMENT",
      "OFFENSIVE_PHOTOS",
      "MISLEADING_INFO",
      "OTHER",
    ];

    if (!reason || !validReasons.includes(reason)) {
      return corsError(
        req,
        "Invalid reason. Must be one of: " + validReasons.join(", "),
        400
      );
    }

    // Get the suggestion to find the reported user
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      select: {
        id: true,
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

    // The reported user is the OTHER party
    const reportedUserId = isFirstParty
      ? suggestion.secondPartyId
      : suggestion.firstPartyId;

    // Check for duplicate report (same reporter + suggestion)
    const existingReport = await prisma.userReport.findFirst({
      where: {
        reporterId: userId,
        suggestionId: suggestionId,
      },
    });

    if (existingReport) {
      return corsError(req, "You have already reported this suggestion", 409);
    }

    // Create the report
    const report = await prisma.userReport.create({
      data: {
        reporterId: userId,
        reportedUserId,
        suggestionId,
        reason: reason as any,
        details: details || null,
      },
    });

    console.log(
      `[mobile/suggestions/${suggestionId}/report] User ${userId} reported user ${reportedUserId}, reason: ${reason}`
    );

    // ============================================================
    // Send email notification to matchmaker + admin
    // ============================================================
    try {
      // Get reporter info
      const reporter = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, email: true, language: true },
      });

      // Get reported user info
      const reportedUser = await prisma.user.findUnique({
        where: { id: reportedUserId },
        select: { firstName: true, lastName: true, email: true },
      });

      // Get matchmaker info
      const matchmaker = await prisma.user.findUnique({
        where: { id: suggestion.matchmakerId },
        select: { firstName: true, lastName: true, email: true },
      });

      if (reporter && reportedUser && matchmaker) {
        const emailParams = {
          locale: (reporter.language as "he" | "en") || "he",
          reporterName: `${reporter.firstName} ${reporter.lastName}`,
          reporterEmail: reporter.email,
          reportedUserName: `${reportedUser.firstName} ${reportedUser.lastName}`,
          reportedUserEmail: reportedUser.email,
          reason,
          details: details || undefined,
          reportType: "REPORT" as const,
          suggestionId,
          reportId: report.id,
        };

        // Send to matchmaker
        await emailService.sendReportNotification({
          ...emailParams,
          toEmail: matchmaker.email,
          toName: `${matchmaker.firstName} ${matchmaker.lastName}`,
        });

        console.log(
          `[Report] Email notification sent to matchmaker: ${matchmaker.email}`
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

          console.log(`[Report] Email notification sent to admin: ${adminEmail}`);
        }
      }
    } catch (emailError) {
      // Don't fail the request if email fails - report is still saved
      console.error("[Report] Failed to send email notification:", emailError);
    }

    return corsJson(req, {
      success: true,
      message: "הדיווח נשלח בהצלחה. הצוות שלנו יבדוק את הפנייה תוך 24 שעות.",
      data: {
        reportId: report.id,
      },
    });
  } catch (error) {
    console.error("[mobile/suggestions/[id]/report] Error:", error);
    return corsError(req, "Internal server error", 500);
  }
}