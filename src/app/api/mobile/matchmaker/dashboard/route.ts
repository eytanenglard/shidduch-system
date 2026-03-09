// =============================================================================
// src/app/api/mobile/matchmaker/dashboard/route.ts
// =============================================================================
//
// GET — Matchmaker Dashboard: single endpoint that returns:
//   1. All active suggestions with party names, status, phones, last activity
//   2. "Action required" suggestions (status changed, needs matchmaker attention)
//   3. Quick stats (total, pending, active, success)
//   4. Unread message counts per suggestion
//
// This replaces multiple calls and gives the mobile app everything in one shot.
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

export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

// =============================================================================
// Helpers
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

/**
 * Statuses that require matchmaker action (the suggestion moved to a state
 * where the matchmaker needs to do something).
 */
const ACTION_REQUIRED_STATUSES: MatchSuggestionStatus[] = [
  'FIRST_PARTY_APPROVED',       // צד א' אישר → שלח לצד ב'
  'FIRST_PARTY_INTERESTED',     // צד א' מעוניין → שדכן צריך לטפל
  'FIRST_PARTY_DECLINED',       // צד א' דחה → שדכן צריך לעדכן
  'SECOND_PARTY_APPROVED',      // צד ב' אישר → שדכן צריך לשתף פרטים
  'SECOND_PARTY_DECLINED',      // צד ב' דחה → שדכן צריך לעדכן
  'AWAITING_MATCHMAKER_APPROVAL', // ממתין לשדכן
];

// =============================================================================
// GET — Main Dashboard Endpoint
// =============================================================================
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    if (auth.role !== UserRole.MATCHMAKER && auth.role !== UserRole.ADMIN) {
      return corsError(req, 'Insufficient permissions', 403);
    }

    const matchmakerId = auth.userId;

    // Optional query params
    const url = new URL(req.url);
    const category = url.searchParams.get('category'); // 'ACTIVE' | 'PENDING' | 'HISTORY' | null (all)
    const includeHistory = url.searchParams.get('includeHistory') === 'true';

    // =========================================================================
    // Query 1: All suggestions with party info + phone + last status change
    // =========================================================================
    const whereClause: any = { matchmakerId };
    if (category) {
      whereClause.category = category;
    } else if (!includeHistory) {
      // By default, don't include history (too many)
      whereClause.category = { not: 'HISTORY' };
    }

    const suggestions = await prisma.matchSuggestion.findMany({
      where: whereClause,
      select: {
        id: true,
        status: true,
        previousStatus: true,
        priority: true,
        category: true,
        matchingReason: true,
        internalNotes: true,
        firstPartyNotes: true,
        secondPartyNotes: true,
        lastActivity: true,
        lastStatusChange: true,
        createdAt: true,
        firstPartySent: true,
        firstPartyResponded: true,
        secondPartySent: true,
        secondPartyResponded: true,
        closedAt: true,
        firstPartyId: true,
        secondPartyId: true,
        firstPartyInterestedAt: true,
        firstPartyRank: true,
        firstParty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            profile: {
              select: {
                gender: true,
                birthDate: true,
                city: true,
                religiousLevel: true,
                occupation: true,
                availabilityStatus: true,
              },
            },
            images: {
              where: { isMain: true },
              select: { url: true },
              take: 1,
            },
          },
        },
        secondParty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            profile: {
              select: {
                gender: true,
                birthDate: true,
                city: true,
                religiousLevel: true,
                occupation: true,
                availabilityStatus: true,
              },
            },
            images: {
              where: { isMain: true },
              select: { url: true },
              take: 1,
            },
          },
        },
        // Last 2 status history entries for timeline context
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: {
            status: true,
            notes: true,
            createdAt: true,
          },
        },
      },
      orderBy: [
        { lastActivity: 'desc' },
      ],
    });

    // =========================================================================
    // Query 2: Unread message counts per suggestion
    // =========================================================================
    const unreadCounts = await prisma.suggestionMessage.groupBy({
      by: ['suggestionId'],
      where: {
        senderType: 'USER',
        isRead: false,
        suggestion: {
          matchmakerId,
        },
      },
      _count: { id: true },
    });

    const unreadMap = new Map(
      unreadCounts.map((u) => [u.suggestionId, u._count.id])
    );

    // =========================================================================
    // Query 3: Direct message unread count (for badge)
    // =========================================================================
    const directUnreadTotal = await prisma.directMessage.count({
      where: {
        receiverId: matchmakerId,
        isRead: false,
      },
    });

    // =========================================================================
    // Format response
    // =========================================================================
    const now = new Date();

    const formattedSuggestions = suggestions.map((s) => {
      const unread = unreadMap.get(s.id) || 0;
      const isActionRequired = ACTION_REQUIRED_STATUSES.includes(s.status);
      const cat = s.category || getSuggestionCategory(s.status);

      // Calculate age from birthDate
      const calcAge = (birthDate: Date | null) => {
        if (!birthDate) return null;
        const age = now.getFullYear() - new Date(birthDate).getFullYear();
        const m = now.getMonth() - new Date(birthDate).getMonth();
        if (m < 0 || (m === 0 && now.getDate() < new Date(birthDate).getDate())) {
          return age - 1;
        }
        return age;
      };

      return {
        id: s.id,
        status: s.status,
        previousStatus: s.previousStatus,
        priority: s.priority,
        category: cat,
        matchingReason: s.matchingReason,
        internalNotes: s.internalNotes,
        firstPartyNotes: s.firstPartyNotes,
        secondPartyNotes: s.secondPartyNotes,
        lastActivity: s.lastActivity?.toISOString(),
        lastStatusChange: s.lastStatusChange?.toISOString(),
        createdAt: s.createdAt.toISOString(),
        closedAt: s.closedAt?.toISOString(),
        unreadCount: unread,
        isActionRequired,

        // Timing info
        firstPartySent: s.firstPartySent?.toISOString(),
        firstPartyResponded: s.firstPartyResponded?.toISOString(),
        secondPartySent: s.secondPartySent?.toISOString(),
        secondPartyResponded: s.secondPartyResponded?.toISOString(),
        firstPartyInterestedAt: s.firstPartyInterestedAt?.toISOString(),
        firstPartyRank: s.firstPartyRank,

        // Party info with phone numbers for quick access
        firstParty: {
          id: s.firstParty.id,
          firstName: s.firstParty.firstName,
          lastName: s.firstParty.lastName,
          phone: s.firstParty.phone,
          email: s.firstParty.email,
          age: calcAge(s.firstParty.profile?.birthDate ?? null),
          city: s.firstParty.profile?.city,
          religiousLevel: s.firstParty.profile?.religiousLevel,
          occupation: s.firstParty.profile?.occupation,
          gender: s.firstParty.profile?.gender,
          availabilityStatus: s.firstParty.profile?.availabilityStatus,
          mainImage: s.firstParty.images[0]?.url || null,
        },
        secondParty: {
          id: s.secondParty.id,
          firstName: s.secondParty.firstName,
          lastName: s.secondParty.lastName,
          phone: s.secondParty.phone,
          email: s.secondParty.email,
          age: calcAge(s.secondParty.profile?.birthDate ?? null),
          city: s.secondParty.profile?.city,
          religiousLevel: s.secondParty.profile?.religiousLevel,
          occupation: s.secondParty.profile?.occupation,
          gender: s.secondParty.profile?.gender,
          availabilityStatus: s.secondParty.profile?.availabilityStatus,
          mainImage: s.secondParty.images[0]?.url || null,
        },

        // Recent status history for timeline
        statusHistory: s.statusHistory.map((h) => ({
          status: h.status,
          notes: h.notes,
          createdAt: h.createdAt.toISOString(),
        })),
      };
    });

    // =========================================================================
    // Separate into sections
    // =========================================================================
    const actionRequired = formattedSuggestions.filter((s) => s.isActionRequired);
    const activeSuggestions = formattedSuggestions.filter(
      (s) => s.category === 'ACTIVE' && !s.isActionRequired
    );
    const pendingSuggestions = formattedSuggestions.filter(
      (s) => s.category === 'PENDING' && !s.isActionRequired
    );
    const historySuggestions = formattedSuggestions.filter(
      (s) => s.category === 'HISTORY'
    );

    // =========================================================================
    // Stats
    // =========================================================================
    const allSuggestions = formattedSuggestions;
    const stats = {
      total: allSuggestions.length,
      actionRequired: actionRequired.length,
      pending: allSuggestions.filter((s) => s.category === 'PENDING').length,
      active: allSuggestions.filter((s) => s.category === 'ACTIVE').length,
      dating: allSuggestions.filter((s) => s.status === 'DATING').length,
      success: allSuggestions.filter((s) =>
        ['MARRIED', 'ENGAGED'].includes(s.status)
      ).length,
      totalUnreadMessages:
        allSuggestions.reduce((sum, s) => sum + s.unreadCount, 0) +
        directUnreadTotal,
      directUnread: directUnreadTotal,
    };

    return corsJson(req, {
      success: true,
      stats,
      actionRequired,
      active: activeSuggestions,
      pending: pendingSuggestions,
      history: historySuggestions,
      // Flat list for search/filter
      all: formattedSuggestions,
    });
  } catch (error) {
    console.error('[mobile/matchmaker/dashboard] GET error:', error);
    return corsError(req, 'Internal server error', 500);
  }
}