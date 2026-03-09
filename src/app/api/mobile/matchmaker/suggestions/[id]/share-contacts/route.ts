// =============================================================================
// src/app/api/mobile/matchmaker/suggestions/[id]/share-contacts/route.ts
// =============================================================================
//
// POST — Share contact details between both parties
//        Only allowed when status is SECOND_PARTY_APPROVED
//        Transitions status to CONTACT_DETAILS_SHARED
//        Sends push notifications to both parties with each other's phone
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
import { pushContactsShared } from '@/lib/sendPushNotification';

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function POST(
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

    const suggestion = await prisma.matchSuggestion.findFirst({
      where: { id: suggestionId, matchmakerId },
      include: {
        firstParty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        secondParty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!suggestion) {
      return corsError(req, 'Suggestion not found', 404);
    }

    // Only allow sharing when both parties approved
    if (suggestion.status !== MatchSuggestionStatus.SECOND_PARTY_APPROVED) {
      return corsError(
        req,
        'Cannot share contacts until both parties have approved',
        400
      );
    }

    // Transition status
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.matchSuggestion.update({
        where: { id: suggestionId },
        data: {
          status: MatchSuggestionStatus.CONTACT_DETAILS_SHARED,
          previousStatus: suggestion.status,
          lastStatusChange: new Date(),
          lastActivity: new Date(),
          category: 'ACTIVE',
        },
      });

      await tx.suggestionStatusHistory.create({
        data: {
          suggestionId,
          status: MatchSuggestionStatus.CONTACT_DETAILS_SHARED,
          notes: `פרטי קשר שותפו דרך אפליקציית המובייל`,
        },
      });

      return result;
    });

    // Send push notifications to both parties (non-blocking)
    const matchmaker = await prisma.user.findUnique({
      where: { id: matchmakerId },
      select: { firstName: true, lastName: true },
    });
    const matchmakerName = matchmaker
      ? `${matchmaker.firstName} ${matchmaker.lastName}`
      : 'השדכן/ית';

    if (typeof pushContactsShared === 'function') {
      pushContactsShared(
        suggestion.firstPartyId,
        matchmakerName,
        suggestion.secondParty.firstName,
        suggestion.secondParty.phone || '',
        suggestionId
      ).catch(console.error);

      pushContactsShared(
        suggestion.secondPartyId,
        matchmakerName,
        suggestion.firstParty.firstName,
        suggestion.firstParty.phone || '',
        suggestionId
      ).catch(console.error);
    }

    return corsJson(req, {
      success: true,
      message: 'Contact details shared successfully',
      suggestion: {
        id: updated.id,
        status: updated.status,
      },
      contacts: {
        firstParty: {
          name: `${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName}`,
          phone: suggestion.firstParty.phone,
          email: suggestion.firstParty.email,
        },
        secondParty: {
          name: `${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName}`,
          phone: suggestion.secondParty.phone,
          email: suggestion.secondParty.email,
        },
      },
    });
  } catch (error) {
    console.error(
      '[mobile/matchmaker/suggestions/share-contacts] POST error:',
      error
    );
    return corsError(req, 'Internal server error', 500);
  }
}