// =============================================================================
// src/app/api/matchmaker/suggestions/list/route.ts
// =============================================================================
// גרסה קלילה של /api/matchmaker/suggestions
// מחזיר רק שדות שנחוצים לרשימה/כרטיסים
// ~5-15KB במקום ~50-200KB
// ה-endpoint הישן נשאר ל-SuggestionDetailsDialog

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { MatchSuggestionStatus, Prisma, UserRole } from '@prisma/client';

export const dynamic = 'force-dynamic';

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

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const where: Prisma.MatchSuggestionWhereInput = {};

    if (session.user.role === UserRole.MATCHMAKER) {
      where.matchmakerId = session.user.id;
    } else if (session.user.role === UserRole.CANDIDATE) {
      where.OR = [
        { firstPartyId: session.user.id },
        { secondPartyId: session.user.id },
      ];
    }

    // select מינימלי - רק שדות שנחוצים לכרטיסים
    const suggestions = await prisma.matchSuggestion.findMany({
      where,
      select: {
        id: true,
        status: true,
        priority: true,
        matchingReason: true,
        createdAt: true,
        updatedAt: true,
        lastActivity: true,
        decisionDeadline: true,
        category: true,
        isAutoSuggestion: true,

        // צד א' - רק מה שנחוץ לכרטיס
        firstParty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: {
              select: {
                gender: true,
                birthDate: true,
                city: true,
                occupation: true,
                education: true,
                religiousLevel: true,
                availabilityStatus: true,
              },
            },
            // רק תמונה ראשית
            images: {
              where: { isMain: true },
              select: { id: true, url: true, isMain: true },
              take: 1,
            },
          },
        },

        // צד ב' - אותו דבר
        secondParty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: {
              select: {
                gender: true,
                birthDate: true,
                city: true,
                occupation: true,
                education: true,
                religiousLevel: true,
                availabilityStatus: true,
              },
            },
            images: {
              where: { isMain: true },
              select: { id: true, url: true, isMain: true },
              take: 1,
            },
          },
        },

        // שדכן - רק שם
        matchmaker: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },

        // ❌ אין statusHistory, meetings, inquiries (לא נחוץ לרשימה)
      },
      orderBy: { lastActivity: 'desc' },
    });

    // Unread counts בקריאה אחת (groupBy במקום N+1)
    const unreadCounts = await prisma.suggestionMessage.groupBy({
      by: ['suggestionId'],
      where: {
        senderType: 'USER',
        isRead: false,
        suggestion: {
          matchmakerId: session.user.id,
        },
      },
      _count: { id: true },
    });

    const unreadMap: Record<string, number> = {};
    for (const item of unreadCounts) {
      unreadMap[item.suggestionId] = item._count.id;
    }

    const formattedSuggestions = suggestions.map((s) => ({
      ...s,
      category: getSuggestionCategory(s.status),
      unreadChatCount: unreadMap[s.id] || 0,
    }));

    return NextResponse.json(formattedSuggestions);
  } catch (error) {
    console.error('Error fetching suggestions list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}