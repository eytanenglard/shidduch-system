// src/app/api/mobile/suggestions/[id]/update-status/route.ts
// Direct status update for dating-phase statuses (mobile)

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from "@/lib/mobile-auth";
import { MatchSuggestionStatus } from "@prisma/client";
import { z } from "zod";
import { statusTransitionService } from "@/components/matchmaker/suggestions/services/suggestions/StatusTransitionService";
import { getDictionary } from "@/lib/dictionaries";
import type { EmailDictionary } from "@/types/dictionary";

// Statuses that candidates can transition to during the dating phase
const CANDIDATE_ALLOWED_STATUSES: MatchSuggestionStatus[] = [
  "MEETING_SCHEDULED",
  "AWAITING_FIRST_DATE_FEEDBACK",
  "THINKING_AFTER_DATE",
  "PROCEEDING_TO_SECOND_DATE",
  "ENDED_AFTER_FIRST_DATE",
  "DATING",
];

const updateStatusSchema = z.object({
  status: z.nativeEnum(MatchSuggestionStatus),
  notes: z.string().max(2000).optional(),
});

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
      return corsError(req, "Unauthorized", 401, "AUTH_REQUIRED");
    }

    const userId = auth.userId;
    const body = await req.json();

    const validation = updateStatusSchema.safeParse(body);
    if (!validation.success) {
      return corsError(
        req,
        validation.error.errors[0]?.message || "Invalid input",
        400,
        "VALIDATION_ERROR"
      );
    }

    const { status: newStatus, notes } = validation.data;

    // Only allow dating-phase statuses for candidates
    if (!CANDIDATE_ALLOWED_STATUSES.includes(newStatus)) {
      return corsError(
        req,
        "This status update is not available for candidates",
        403,
        "STATUS_NOT_ALLOWED"
      );
    }

    // Fetch suggestion with full relations
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      include: {
        firstParty: { include: { profile: true } },
        secondParty: { include: { profile: true } },
        matchmaker: true,
      },
    });

    if (!suggestion) {
      return corsError(req, "Suggestion not found", 404, "NOT_FOUND");
    }

    // Verify user is a party in this suggestion
    const isFirstParty = suggestion.firstPartyId === userId;
    const isSecondParty = suggestion.secondPartyId === userId;

    if (!isFirstParty && !isSecondParty) {
      return corsError(req, "Access denied", 403, "AUTH_INSUFFICIENT_PERMISSIONS");
    }

    // Load dictionaries for email notifications
    const [heDict, enDict] = await Promise.all([
      getDictionary("he"),
      getDictionary("en"),
    ]);

    const dictionaries = {
      he: heDict.email as EmailDictionary,
      en: enDict.email as EmailDictionary,
    };

    const firstPartyLang = (suggestion.firstParty as any).language || "he";
    const secondPartyLang = (suggestion.secondParty as any).language || "he";
    const matchmakerLang = (suggestion.matchmaker as any).language || "he";

    // Execute transition (validation is NOT skipped — candidates follow the rules)
    const updatedSuggestion = await statusTransitionService.transitionStatus(
      suggestion,
      newStatus,
      dictionaries,
      notes || `סטטוס עודכן ל-${newStatus} על ידי ${isFirstParty ? "צד א" : "צד ב"}`,
      {
        sendNotifications: true,
        notifyParties: ["first", "second", "matchmaker"],
        skipValidation: false,
      },
      {
        firstParty: firstPartyLang,
        secondParty: secondPartyLang,
        matchmaker: matchmakerLang,
      }
    );

    console.log(
      `[mobile/suggestions/${suggestionId}/update-status] User ${userId} updated status to: ${newStatus}`
    );

    return corsJson(req, {
      success: true,
      message: "Status updated successfully",
      data: {
        id: updatedSuggestion.id,
        status: updatedSuggestion.status,
        lastStatusChange: updatedSuggestion.lastStatusChange,
      },
    });
  } catch (error) {
    console.error("[mobile/suggestions/[id]/update-status] Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    // Return specific error for invalid transitions
    if (errorMessage.includes("Invalid status transition")) {
      return corsError(req, errorMessage, 400, "INVALID_TRANSITION");
    }

    return corsError(req, "Internal server error", 500, "INTERNAL_ERROR");
  }
}
