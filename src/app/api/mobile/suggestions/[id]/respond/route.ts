// src/app/api/mobile/suggestions/[id]/respond/route.ts
// תגובה להצעת שידוך - למובייל
// UPDATED: Added 'interested' response type for "save for later"

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from "@/lib/mobile-auth";
import type { MatchSuggestionStatus } from "@prisma/client";

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
    const { response, reason, notes } = body as {
      response: "approve" | "decline" | "interested"; // ← NEW: 'interested'
      reason?: string;
      notes?: string;
    };

    if (
      !response ||
      !["approve", "decline", "interested"].includes(response)
    ) {
      return corsError(
        req,
        "Invalid response. Must be 'approve', 'decline', or 'interested'",
        400
      );
    }

    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      select: {
        id: true,
        status: true,
        firstPartyId: true,
        secondPartyId: true,
        matchmakerId: true,
        firstPartyRank: true,
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

    // ======================================================================
    // Determine valid transitions
    // ======================================================================

    // For 'interested': only first party from PENDING_FIRST_PARTY
    if (response === "interested") {
      if (!isFirstParty) {
        return corsError(req, "Only first party can save for later", 400);
      }
      if (suggestion.status !== "PENDING_FIRST_PARTY") {
        return corsError(
          req,
          "Can only save for later when pending your response",
          400
        );
      }
    }

    // For 'approve' from FIRST_PARTY_INTERESTED (activating from waitlist)
    const isActivatingFromInterested =
      response === "approve" &&
      isFirstParty &&
      suggestion.status === "FIRST_PARTY_INTERESTED";

    // Standard canRespond check (for approve/decline from PENDING)
    const canRespondStandard =
      (isFirstParty && suggestion.status === "PENDING_FIRST_PARTY") ||
      (isSecondParty && suggestion.status === "PENDING_SECOND_PARTY");

    if (
      response !== "interested" &&
      !canRespondStandard &&
      !isActivatingFromInterested
    ) {
      return corsError(req, "Cannot respond at this stage", 400);
    }

    // For 'decline' from FIRST_PARTY_INTERESTED (removing from waitlist)
    const isRemovingFromInterested =
      response === "decline" &&
      isFirstParty &&
      suggestion.status === "FIRST_PARTY_INTERESTED";

    if (
      response === "decline" &&
      !canRespondStandard &&
      !isRemovingFromInterested
    ) {
      return corsError(req, "Cannot decline at this stage", 400);
    }

    // ======================================================================
    // Determine new status
    // ======================================================================

    let newStatus: MatchSuggestionStatus;

    if (response === "interested") {
      newStatus = "FIRST_PARTY_INTERESTED";
    } else if (response === "approve") {
      newStatus = isFirstParty
        ? "FIRST_PARTY_APPROVED"
        : "SECOND_PARTY_APPROVED";
    } else {
      // decline
      newStatus = isFirstParty
        ? "FIRST_PARTY_DECLINED"
        : "SECOND_PARTY_DECLINED";
    }

    // ======================================================================
    // Build update data
    // ======================================================================

    const updateData: any = {
      status: newStatus,
      lastStatusChange: new Date(),
      lastActivity: new Date(),
    };

    // Handle 'interested' - assign rank
    if (response === "interested") {
      // Find the highest existing rank for this user
      const highestRank = await prisma.matchSuggestion.findFirst({
        where: {
          firstPartyId: userId,
          status: "FIRST_PARTY_INTERESTED",
          id: { not: suggestionId },
        },
        orderBy: { firstPartyRank: "desc" },
        select: { firstPartyRank: true },
      });

      updateData.firstPartyRank = (highestRank?.firstPartyRank ?? 0) + 1;
      updateData.firstPartyInterestedAt = new Date();
    }

    // Handle activation from INTERESTED to APPROVED
    if (isActivatingFromInterested) {
      updateData.firstPartyRank = null;
      updateData.firstPartyResponded = new Date();
    }

    // Handle removal from INTERESTED (decline)
    if (isRemovingFromInterested) {
      updateData.firstPartyRank = null;
      updateData.firstPartyInterestedAt = null;
    }

    // Standard fields
    if (response !== "interested") {
      if (isFirstParty) {
        updateData.firstPartyResponded = new Date();
        if (notes) {
          updateData.firstPartyNotes = notes;
        }
      } else {
        updateData.secondPartyResponded = new Date();
        if (notes) {
          updateData.secondPartyNotes = notes;
        }
      }
    }

    if (response === "decline" && reason) {
      updateData.internalNotes =
        `[${new Date().toISOString()}] ${isFirstParty ? "צד א" : "צד ב"} דחה: ${reason}`.trim();
    }

    // ======================================================================
    // Execute update in transaction
    // ======================================================================

    const updatedSuggestion = await prisma.$transaction(async (tx) => {
      // 1. Update the suggestion
      const updated = await tx.matchSuggestion.update({
        where: { id: suggestionId },
        data: updateData,
        select: {
          id: true,
          status: true,
          lastStatusChange: true,
        },
      });

      // 2. Create status history entry
      let historyNotes = "";
      if (response === "interested") {
        historyNotes = "צד א שמר לגיבוי";
      } else if (isActivatingFromInterested) {
        historyNotes = "צד א אישר מרשימת ההמתנה";
      } else if (isRemovingFromInterested) {
        historyNotes = reason
          ? `צד א הסיר מרשימת ההמתנה: ${reason}`
          : "צד א הסיר מרשימת ההמתנה";
      } else if (response === "approve") {
        historyNotes = notes || (isFirstParty ? "צד א אישר" : "צד ב אישר");
      } else {
        historyNotes =
          reason || (isFirstParty ? "צד א דחה" : "צד ב דחה");
      }

      await tx.suggestionStatusHistory.create({
        data: {
          suggestionId,
          status: newStatus,
          notes: historyNotes,
        },
      });

      // 3. Re-rank remaining INTERESTED suggestions if removing/activating
      if (isActivatingFromInterested || isRemovingFromInterested) {
        const remaining = await tx.matchSuggestion.findMany({
          where: {
            firstPartyId: userId,
            status: "FIRST_PARTY_INTERESTED",
          },
          orderBy: { firstPartyRank: "asc" },
          select: { id: true },
        });

        for (let i = 0; i < remaining.length; i++) {
          await tx.matchSuggestion.update({
            where: { id: remaining[i].id },
            data: { firstPartyRank: i + 1 },
          });
        }
      }

      // 4. Handle SECOND_PARTY_APPROVED → CONTACT_DETAILS_SHARED
      if (newStatus === "SECOND_PARTY_APPROVED") {
        const firstPartyApproved =
          await tx.suggestionStatusHistory.findFirst({
            where: {
              suggestionId,
              status: "FIRST_PARTY_APPROVED",
            },
          });

        if (firstPartyApproved) {
          await tx.matchSuggestion.update({
            where: { id: suggestionId },
            data: {
              status: "CONTACT_DETAILS_SHARED",
              lastStatusChange: new Date(),
            },
          });

          await tx.suggestionStatusHistory.create({
            data: {
              suggestionId,
              status: "CONTACT_DETAILS_SHARED",
              notes: "שני הצדדים אישרו - פרטי קשר שותפו",
            },
          });
        }
      }

      return updated;
    });

    console.log(
      `[mobile/suggestions/${suggestionId}/respond] User ${userId} responded: ${response}, new status: ${newStatus}`
    );

    const messageMap = {
      approve: "ההצעה אושרה בהצלחה",
      decline: "ההצעה נדחתה",
      interested: "ההצעה נשמרה ברשימת ההמתנה",
    };

    return corsJson(req, {
      success: true,
      message: messageMap[response],
      data: {
        id: updatedSuggestion.id,
        status: updatedSuggestion.status,
        lastStatusChange: updatedSuggestion.lastStatusChange,
      },
    });
  } catch (error) {
    console.error("[mobile/suggestions/[id]/respond] Error:", error);
    return corsError(req, "Internal server error", 500);
  }
}