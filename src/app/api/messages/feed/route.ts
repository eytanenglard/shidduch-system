// FILENAME: src/app/api/messages/feed/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { FeedItem, FeedItemType } from "@/types/messages";
import type { ExtendedMatchSuggestion } from "@/app/components/suggestions/types";
import { MatchSuggestionStatus, UserRole } from "@prisma/client";

export const dynamic = 'force-dynamic';

// הגדרה אחידה לשליפת פרטי משתמשים
const partySelect = {
  id: true, email: true, firstName: true, lastName: true, isProfileComplete: true, 
  profile: true,
  images: {
    select: { 
      id: true, url: true, isMain: true, createdAt: true, updatedAt: true,
      cloudinaryPublicId: true, userId: true
    },
    orderBy: { isMain: "desc" as const },
  },
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const userRole = session.user.role as UserRole;

  try {
    // 1. שלוף הצעות שידוך רלוונטיות
    const suggestionsFromDb = await prisma.matchSuggestion.findMany({
      where: {
        OR: [{ firstPartyId: userId }, { secondPartyId: userId }],
        status: { notIn: [MatchSuggestionStatus.DRAFT, MatchSuggestionStatus.CANCELLED] },
      },
      include: {
        matchmaker: { select: { firstName: true, lastName: true } },
        firstParty: { select: partySelect },
        secondParty: { select: partySelect },
        statusHistory: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { lastActivity: "desc" },
    });
    const suggestions: ExtendedMatchSuggestion[] = suggestionsFromDb.filter(
      (s) => s.firstParty?.profile && s.secondParty?.profile
    ) as ExtendedMatchSuggestion[];

    // 2. שלוף הודעות צ'אט רלוונטיות
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
        take: 30 // הגבלת כמות ההודעות לביצועים טובים יותר
    });

    // 3. המרת הצעות למבנה FeedItem
    const suggestionFeedItems: FeedItem[] = suggestions.map((s) => {
      const isFirstParty = s.firstPartyId === userId;
      const otherParty = isFirstParty ? s.secondParty : s.firstParty;
      let type: FeedItemType = 'STATUS_UPDATE';
      let title = `עדכון בהצעה עם ${otherParty.firstName}`;
      let description = "הסטטוס התעדכן. לחץ/י לפרטים.";

      if ((s.status === "PENDING_FIRST_PARTY" && isFirstParty) || (s.status === "PENDING_SECOND_PARTY" && !isFirstParty)) {
        type = 'ACTION_REQUIRED';
        title = `הצעה חדשה ממתינה לך!`;
        description = `${s.matchmaker.firstName} חושב/ת שיש כאן פוטנציאל גדול.`;
      } else if (s.status === "CONTACT_DETAILS_SHARED") {
        title = "מזל טוב, יש התאמה!";
        description = `פרטי הקשר הועברו. זה הזמן ליצור קשר.`;
      } else if (s.status === "AWAITING_FIRST_DATE_FEEDBACK") {
        type = 'ACTION_REQUIRED';
        title = "איך הייתה הפגישה הראשונה?";
        description = "נשמח לשמוע את דעתך כדי להמשיך ולסייע.";
      }
      
      return {
        id: `${s.id}-${s.status}`, type, title, description,
        timestamp: s.lastActivity, isRead: false,
        link: `/matches?suggestionId=${s.id}`,
        payload: { suggestion: s },
      };
    });

    // 4. המרת הודעות צ'אט למבנה FeedItem
    const inquiryFeedItems: FeedItem[] = inquiriesFromDb.map((inquiry): FeedItem => {
        const isMyMessage = inquiry.fromUserId === userId;
        const otherUser = isMyMessage ? inquiry.toUser : inquiry.fromUser;
        const suggestionParticipant = inquiry.suggestion.firstPartyId === userId ? inquiry.suggestion.secondParty : inquiry.suggestion.firstParty;
        
        let title: string;
        let description: string;
        let type: FeedItemType;

        if (isMyMessage) {
            // זו הודעה שאני שלחתי
            title = `שלחת שאלה ל${otherUser.firstName}`;
            description = `"${inquiry.question.substring(0, 50)}..."`;
            type = inquiry.answer ? 'INQUIRY_RESPONSE' : 'MATCHMAKER_MESSAGE';
        } else {
            // זו הודעה שקיבלתי
            if (inquiry.answer) {
                 title = `התקבלה תשובה מ${otherUser.firstName}`;
                 description = `לגבי שאלתך על ${suggestionParticipant.firstName}: "${inquiry.answer.substring(0, 40)}..."`;
                 type = 'INQUIRY_RESPONSE';
            } else {
                 title = `הודעה חדשה מ${otherUser.firstName}`;
                 description = `לגבי ההצעה עם ${suggestionParticipant.firstName}`;
                 type = userRole === 'MATCHMAKER' && inquiry.status === 'PENDING' ? 'ACTION_REQUIRED' : 'MATCHMAKER_MESSAGE';
            }
        }

        return {
            id: inquiry.id,
            type: type,
            title,
            description,
            timestamp: inquiry.answeredAt ? inquiry.answeredAt : inquiry.createdAt,
            isRead: isMyMessage || inquiry.status !== 'PENDING',
            link: `/matches?suggestionId=${inquiry.suggestionId}&view=chat`,
            payload: { 
                suggestion: inquiry.suggestion as unknown as ExtendedMatchSuggestion,
                suggestionInquiry: inquiry as any // ניתן לשפר טיפוסים בהמשך
            }
        };
    });

    // 5. איחוד, מיון והחזרה
    const allFeedItems = [...suggestionFeedItems, ...inquiryFeedItems];
    allFeedItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return NextResponse.json({ success: true, feed: allFeedItems });

  } catch (error) {
    console.error("Error fetching activity feed:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch activity feed" }, { status: 500 });
  }
}