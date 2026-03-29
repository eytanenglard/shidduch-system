// src/app/api/messages/feed/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { FeedItem, FeedItemType, ExtendedSuggestionInquiry } from "@/types/messages";
import type { ExtendedMatchSuggestion } from '@/types/suggestions';
import { MatchSuggestionStatus, UserRole } from "@prisma/client";

export const dynamic = 'force-dynamic';

const partySelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  isProfileComplete: true,
  phone: true,
  profile: true,
  images: {
    select: {
      id: true,
      url: true,
      isMain: true,
      createdAt: true,
      updatedAt: true,
      cloudinaryPublicId: true,
      userId: true
    },
    orderBy: { isMain: "desc" as const },
  },
};

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const userRole = session.user.role as UserRole;

  // Pagination params
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor'); // ID of last item for cursor-based pagination
  const limit = Math.min(parseInt(searchParams.get('limit') || String(PAGE_SIZE)), 50);
  const countOnly = searchParams.get('countOnly') === 'true'; // Lightweight mode for polling

  try {
    // === Lightweight count-only mode for notification polling ===
    if (countOnly) {
      const actionRequiredCount = await prisma.matchSuggestion.count({
        where: {
          OR: [
            { firstPartyId: userId, status: MatchSuggestionStatus.PENDING_FIRST_PARTY },
            { secondPartyId: userId, status: MatchSuggestionStatus.PENDING_SECOND_PARTY },
          ],
        },
      });

      // Count suggestions where lastViewedAt is null (never viewed)
      const neverViewedCount = await prisma.matchSuggestion.count({
        where: {
          OR: [
            {
              firstPartyId: userId,
              status: { notIn: [MatchSuggestionStatus.DRAFT, MatchSuggestionStatus.CANCELLED] },
              firstPartyLastViewedAt: null,
            },
            {
              secondPartyId: userId,
              status: { notIn: [MatchSuggestionStatus.DRAFT, MatchSuggestionStatus.CANCELLED] },
              secondPartyLastViewedAt: null,
            },
          ],
        },
      });

      return NextResponse.json({
        success: true,
        actionRequiredCount,
        unreadCount: neverViewedCount,
        totalCount: actionRequiredCount + neverViewedCount,
      });
    }

    // === Full feed mode ===

    // 1. Fetch relevant suggestions with pagination
    const suggestionsFromDb = await prisma.matchSuggestion.findMany({
      where: {
        OR: [{ firstPartyId: userId }, { secondPartyId: userId }],
        status: { notIn: [MatchSuggestionStatus.DRAFT, MatchSuggestionStatus.CANCELLED] },
      },
      include: {
        matchmaker: { select: { firstName: true, lastName: true } },
        firstParty: { select: partySelect },
        secondParty: { select: partySelect },
        statusHistory: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { lastActivity: "desc" },
      take: limit + 10, // Extra buffer for dedup
    });

    const suggestions: ExtendedMatchSuggestion[] = suggestionsFromDb.filter(
      (s) => s.firstParty?.profile && s.secondParty?.profile
    ) as ExtendedMatchSuggestion[];

    // 2. Fetch chat inquiries (only those NOT already covered by suggestion items)
    const inquiriesFromDb = await prisma.suggestionInquiry.findMany({
      where: {
        OR: [{ fromUserId: userId }, { toUserId: userId }]
      },
      include: {
        fromUser: { select: { id: true, firstName: true, lastName: true } },
        toUser: { select: { id: true, firstName: true, lastName: true } },
        suggestion: {
          include: {
            firstParty: { select: partySelect },
            secondParty: { select: partySelect },
            matchmaker: { select: { firstName: true, lastName: true } },
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 30
    });

    // 3. Fetch availability inquiries
    const availabilityInquiries = await prisma.availabilityInquiry.findMany({
      where: {
        OR: [{ firstPartyId: userId }, { secondPartyId: userId }],
        expiresAt: { gt: new Date() }, // Only non-expired
      },
      include: {
        matchmaker: { select: { firstName: true, lastName: true } },
        firstParty: { select: { firstName: true, lastName: true, profile: true } },
        secondParty: { select: { firstName: true, lastName: true, profile: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // 4. Convert suggestions to FeedItems (returning type keys, not hardcoded text)
    const suggestionFeedItems: FeedItem[] = suggestions.map((s) => {
      const isFirstParty = s.firstPartyId === userId;
      const otherParty = isFirstParty ? s.secondParty : s.firstParty;

      let type: FeedItemType = 'STATUS_UPDATE';
      // Title/description keys for client-side i18n
      let titleKey = 'statusUpdate';
      let descriptionKey = 'statusUpdate';

      const lastViewedAt = isFirstParty ? s.firstPartyLastViewedAt : s.secondPartyLastViewedAt;
      const isRead = lastViewedAt
        ? new Date(lastViewedAt).getTime() >= new Date(s.lastActivity).getTime()
        : false;

      const link = userRole === 'CANDIDATE'
        ? `/matches?suggestionId=${s.id}`
        : `/matchmaker/suggestions?suggestionId=${s.id}`;

      if ((s.status === "PENDING_FIRST_PARTY" && isFirstParty) || (s.status === "PENDING_SECOND_PARTY" && !isFirstParty)) {
        type = 'ACTION_REQUIRED';
        titleKey = 'actionRequired';
        descriptionKey = 'actionRequired';
      } else if (s.status === "CONTACT_DETAILS_SHARED") {
        titleKey = 'contactShared';
        descriptionKey = 'contactShared';
      } else if (s.status === "AWAITING_FIRST_DATE_FEEDBACK") {
        type = 'ACTION_REQUIRED';
        titleKey = 'dateFeedback';
        descriptionKey = 'dateFeedback';
      } else if (s.status === "RE_OFFERED_TO_FIRST_PARTY" && isFirstParty) {
        type = 'ACTION_REQUIRED';
        titleKey = 'reOffered';
        descriptionKey = 'reOffered';
      } else if (s.status === "ENGAGED") {
        titleKey = 'engaged';
        descriptionKey = 'engaged';
      } else if (s.status === "MARRIED") {
        titleKey = 'married';
        descriptionKey = 'married';
      }

      return {
        id: `suggestion-${s.id}`,
        type,
        title: titleKey,
        description: descriptionKey,
        timestamp: s.lastActivity,
        isRead,
        link,
        payload: {
          suggestion: s,
        },
      };
    });

    // 5. Convert inquiries — deduplicate by grouping per suggestion
    // Only create inquiry feed items for suggestions that DON'T already have an ACTION_REQUIRED entry
    const suggestionIdsWithAction = new Set(
      suggestionFeedItems
        .filter(item => item.type === 'ACTION_REQUIRED')
        .map(item => item.payload.suggestion?.id)
    );

    const latestInquiryPerSuggestion = new Map<string, typeof inquiriesFromDb[0]>();
    for (const inquiry of inquiriesFromDb) {
      if (!latestInquiryPerSuggestion.has(inquiry.suggestionId)) {
        latestInquiryPerSuggestion.set(inquiry.suggestionId, inquiry);
      }
    }

    const inquiryFeedItems: FeedItem[] = [];
    for (const [, inquiry] of latestInquiryPerSuggestion) {
      // Skip if suggestion already has an action-required entry
      if (suggestionIdsWithAction.has(inquiry.suggestionId)) continue;

      const isMyMessage = inquiry.fromUserId === userId;
      const otherUser = isMyMessage ? inquiry.toUser : inquiry.fromUser;
      const suggestionParticipant = inquiry.suggestion.firstPartyId === userId
        ? inquiry.suggestion.secondParty
        : inquiry.suggestion.firstParty;

      let titleKey: string;
      let descriptionKey: string;
      let type: FeedItemType;

      const link = userRole === 'CANDIDATE'
        ? `/matches?suggestionId=${inquiry.suggestionId}&view=chat`
        : `/matchmaker/suggestions?suggestionId=${inquiry.suggestionId}&view=chat`;

      const isRead = isMyMessage || !!inquiry.recipientReadAt;

      if (isMyMessage) {
        titleKey = 'sentQuestion';
        descriptionKey = 'sentQuestion';
        type = inquiry.answer ? 'INQUIRY_RESPONSE' : 'MATCHMAKER_MESSAGE';
      } else {
        if (inquiry.answer) {
          titleKey = 'receivedAnswer';
          descriptionKey = 'receivedAnswer';
          type = 'INQUIRY_RESPONSE';
        } else {
          titleKey = 'newMessage';
          descriptionKey = 'newMessage';
          type = userRole === 'MATCHMAKER' && inquiry.status === 'PENDING' ? 'ACTION_REQUIRED' : 'MATCHMAKER_MESSAGE';
        }
      }

      inquiryFeedItems.push({
        id: `inquiry-${inquiry.id}`,
        type,
        title: titleKey,
        description: descriptionKey,
        timestamp: inquiry.answeredAt ? inquiry.answeredAt : inquiry.createdAt,
        isRead,
        link,
        payload: {
          suggestion: inquiry.suggestion as unknown as ExtendedMatchSuggestion,
          suggestionInquiry: inquiry as unknown as ExtendedSuggestionInquiry
        }
      });
    }

    // 6. Convert availability inquiries to feed items
    const availabilityFeedItems: FeedItem[] = availabilityInquiries.map((inquiry) => {
      const isFirstParty = inquiry.firstPartyId === userId;
      const myResponse = isFirstParty ? inquiry.firstPartyResponse : inquiry.secondPartyResponse;
      const isRead = myResponse !== null; // Read if user has responded

      return {
        id: `availability-${inquiry.id}`,
        type: 'AVAILABILITY_INQUIRY' as FeedItemType,
        title: 'availabilityRequest',
        description: 'availabilityRequest',
        timestamp: inquiry.createdAt,
        isRead,
        link: `/matches?availabilityId=${inquiry.id}`,
        payload: {
          availabilityInquiry: {
            ...inquiry,
            matchmaker: inquiry.matchmaker,
            firstParty: { ...inquiry.firstParty, profile: inquiry.firstParty.profile },
            secondParty: { ...inquiry.secondParty, profile: inquiry.secondParty.profile },
          } as any,
        },
      };
    });

    // 7. Merge, sort, apply cursor pagination
    let allFeedItems = [...suggestionFeedItems, ...inquiryFeedItems, ...availabilityFeedItems];
    allFeedItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Cursor-based pagination
    if (cursor) {
      const cursorIndex = allFeedItems.findIndex(item => item.id === cursor);
      if (cursorIndex !== -1) {
        allFeedItems = allFeedItems.slice(cursorIndex + 1);
      }
    }

    const hasMore = allFeedItems.length > limit;
    const paginatedItems = allFeedItems.slice(0, limit);
    const nextCursor = hasMore ? paginatedItems[paginatedItems.length - 1]?.id : null;

    return NextResponse.json({
      success: true,
      feed: paginatedItems,
      pagination: {
        hasMore,
        nextCursor,
        totalCount: allFeedItems.length + (cursor ? limit : 0), // Approximate
      },
    });

  } catch (error) {
    console.error("Error fetching activity feed:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch activity feed" }, { status: 500 });
  }
}
