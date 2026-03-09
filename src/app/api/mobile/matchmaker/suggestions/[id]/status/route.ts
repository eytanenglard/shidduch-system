// =============================================================================
// src/app/api/mobile/matchmaker/suggestions/[id]/status/route.ts
// =============================================================================
//
// PATCH — Update suggestion status from mobile matchmaker interface
//         Handles status transitions + push notifications + status history
//
// This is the mobile equivalent of:
//   src/app/api/matchmaker/suggestions/[id]/status/route.ts
// but uses mobile JWT auth instead of NextAuth sessions.
// =============================================================================

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { MatchSuggestionStatus, UserRole } from '@prisma/client';
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from '@/lib/mobile-auth';
import { pushSuggestionStatusChange } from '@/lib/sendPushNotification';

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

// =============================================================================
// Helper: compute category from status
// =============================================================================
const getSuggestionCategory = (status: MatchSuggestionStatus) => {
  switch (status) {
    case 'DRAFT':
    case 'AWAITING_MATCHMAKER_APPROVAL':
    case 'PENDING_FIRST_PARTY':
    case 'PENDING_SECOND_PARTY':
      return 'PENDING';
    case 'FIRST_PARTY_DECLINED':
    case 'SECOND_PARTY_DECLINED':
    case 'MATCH_DECLINED':
    case 'ENDED_AFTER_FIRST_DATE':
    case 'ENGAGED':
    case 'MARRIED':
    case 'EXPIRED':
    case 'CLOSED':
    case 'CANCELLED':
      return 'HISTORY';
    default:
      return 'ACTIVE';
  }
};

// =============================================================================
// Status-specific field updates
// =============================================================================
const getStatusSpecificUpdates = (newStatus: MatchSuggestionStatus) => {
  const updates: Record<string, any> = {};

  switch (newStatus) {
    case 'PENDING_FIRST_PARTY':
      updates.firstPartySent = new Date();
      break;
    case 'PENDING_SECOND_PARTY':
      updates.secondPartySent = new Date();
      break;
    case 'FIRST_PARTY_APPROVED':
    case 'FIRST_PARTY_DECLINED':
    case 'FIRST_PARTY_INTERESTED':
      updates.firstPartyResponded = new Date();
      break;
    case 'SECOND_PARTY_APPROVED':
    case 'SECOND_PARTY_DECLINED':
      updates.secondPartyResponded = new Date();
      break;
    case 'CLOSED':
    case 'CANCELLED':
      updates.closedAt = new Date();
      break;
  }

  return updates;
};

// =============================================================================
// PATCH — Update status
// =============================================================================
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    if (auth.role !== UserRole.MATCHMAKER && auth.role !== UserRole.ADMIN) {
      return corsError(req, 'Insufficient permissions', 403);
    }

    const { id: suggestionId } = await params;
    const matchmakerId = auth.userId;
    const body = await req.json();

    const { status: newStatusStr, notes } = body;

    // Validate status
    if (!newStatusStr || !Object.values(MatchSuggestionStatus).includes(newStatusStr)) {
      return corsError(req, 'Invalid status value', 400);
    }

    const newStatus = newStatusStr as MatchSuggestionStatus;

    // Get current suggestion
    const suggestion = await prisma.matchSuggestion.findFirst({
      where: { id: suggestionId, matchmakerId },
      include: {
        firstParty: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        secondParty: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
      },
    });

    if (!suggestion) {
      return corsError(req, 'Suggestion not found', 404);
    }

    // Don't update if status is the same
    if (suggestion.status === newStatus) {
      return corsJson(req, {
        success: true,
        message: 'Status unchanged',
        suggestion: {
          id: suggestion.id,
          status: suggestion.status,
          category: getSuggestionCategory(suggestion.status),
        },
      });
    }

    // Perform the transition in a transaction
    const updatedSuggestion = await prisma.$transaction(async (tx) => {
      const statusUpdates = getStatusSpecificUpdates(newStatus);

      const updated = await tx.matchSuggestion.update({
        where: { id: suggestionId },
        data: {
          status: newStatus,
          previousStatus: suggestion.status,
          lastStatusChange: new Date(),
          lastActivity: new Date(),
          category: getSuggestionCategory(newStatus),
          ...statusUpdates,
        },
      });

      // Create status history entry
      await tx.suggestionStatusHistory.create({
        data: {
          suggestionId,
          status: newStatus,
          notes:
            notes ||
            `סטטוס שונה ל-${newStatus} דרך אפליקציית המובייל`,
        },
      });

      return updated;
    });

    // Get matchmaker name for push notifications
    const matchmaker = await prisma.user.findUnique({
      where: { id: matchmakerId },
      select: { firstName: true, lastName: true },
    });
    const matchmakerName = matchmaker
      ? `${matchmaker.firstName} ${matchmaker.lastName}`
      : 'השדכן/ית';

    // Send push notifications (non-blocking)
    // Determine who to notify based on the new status
    const notifyTargets: string[] = [];
    
    if (['PENDING_SECOND_PARTY'].includes(newStatus)) {
      notifyTargets.push(suggestion.secondPartyId);
    }
    if (['PENDING_FIRST_PARTY'].includes(newStatus)) {
      notifyTargets.push(suggestion.firstPartyId);
    }
    if (['CONTACT_DETAILS_SHARED', 'MATCH_APPROVED'].includes(newStatus)) {
      notifyTargets.push(suggestion.firstPartyId, suggestion.secondPartyId);
    }

    // Fire-and-forget push notifications
    if (typeof pushSuggestionStatusChange === 'function') {
      for (const targetId of notifyTargets) {
        pushSuggestionStatusChange(
          targetId,
          matchmakerName,
          newStatus,
          suggestionId
        ).catch(console.error);
      }
    }

    return corsJson(req, {
      success: true,
      message: 'Status updated successfully',
      suggestion: {
        id: updatedSuggestion.id,
        status: updatedSuggestion.status,
        previousStatus: updatedSuggestion.previousStatus,
        lastStatusChange: updatedSuggestion.lastStatusChange?.toISOString(),
        category: getSuggestionCategory(updatedSuggestion.status),
      },
    });
  } catch (error) {
    console.error('[mobile/matchmaker/suggestions/status] PATCH error:', error);
    return corsError(req, 'Internal server error', 500);
  }
}