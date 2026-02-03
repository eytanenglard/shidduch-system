// src/app/api/mobile/suggestions/[id]/respond/route.ts
// תגובה להצעת שידוך - למובייל

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { 
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions
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
      response: 'approve' | 'decline';
      reason?: string;
      notes?: string;
    };

    if (!response || !['approve', 'decline'].includes(response)) {
      return corsError(req, "Invalid response. Must be 'approve' or 'decline'", 400);
    }

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

    const canRespond = 
      (isFirstParty && suggestion.status === 'PENDING_FIRST_PARTY') ||
      (isSecondParty && suggestion.status === 'PENDING_SECOND_PARTY');

    if (!canRespond) {
      return corsError(req, "Cannot respond at this stage", 400);
    }

    let newStatus: MatchSuggestionStatus;
    
    if (response === 'approve') {
      if (isFirstParty) {
        newStatus = 'FIRST_PARTY_APPROVED';
      } else {
        newStatus = 'SECOND_PARTY_APPROVED';
      }
    } else {
      if (isFirstParty) {
        newStatus = 'FIRST_PARTY_DECLINED';
      } else {
        newStatus = 'SECOND_PARTY_DECLINED';
      }
    }

    const updateData: any = {
      status: newStatus,
      lastStatusChange: new Date(),
      lastActivity: new Date(),
    };

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

    if (response === 'decline' && reason) {
      updateData.internalNotes = `[${new Date().toISOString()}] ${isFirstParty ? 'צד א' : 'צד ב'} דחה: ${reason}`.trim();
    }

    const updatedSuggestion = await prisma.matchSuggestion.update({
      where: { id: suggestionId },
      data: updateData,
      select: {
        id: true,
        status: true,
        lastStatusChange: true,
      },
    });

    await prisma.suggestionStatusHistory.create({
      data: {
        suggestionId: suggestionId,
        status: newStatus,
        notes: response === 'approve' 
          ? (notes || (isFirstParty ? 'צד א אישר' : 'צד ב אישר'))
          : (reason || (isFirstParty ? 'צד א דחה' : 'צד ב דחה')),
      },
    });

    if (newStatus === 'SECOND_PARTY_APPROVED') {
      const firstPartyApproved = await prisma.suggestionStatusHistory.findFirst({
        where: {
          suggestionId: suggestionId,
          status: 'FIRST_PARTY_APPROVED',
        },
      });

      if (firstPartyApproved) {
        await prisma.matchSuggestion.update({
          where: { id: suggestionId },
          data: {
            status: 'CONTACT_DETAILS_SHARED',
            lastStatusChange: new Date(),
          },
        });

        await prisma.suggestionStatusHistory.create({
          data: {
            suggestionId: suggestionId,
            status: 'CONTACT_DETAILS_SHARED',
            notes: 'שני הצדדים אישרו - פרטי קשר שותפו',
          },
        });
      }
    }

    console.log(`[mobile/suggestions/${suggestionId}/respond] User ${userId} responded: ${response}, new status: ${newStatus}`);

    return corsJson(req, {
      success: true,
      message: response === 'approve' ? 'ההצעה אושרה בהצלחה' : 'ההצעה נדחתה',
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