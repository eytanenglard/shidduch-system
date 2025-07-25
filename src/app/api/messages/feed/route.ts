// src/app/api/messages/feed/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { FeedItem, FeedItemType } from "@/types/messages";
import type { ExtendedMatchSuggestion } from "@/app/components/suggestions/types";
import { MatchSuggestionStatus } from "@prisma/client";

// Helper function to include all necessary fields for a party
// בקובץ api/messages/feed/route.ts
const partySelect = {
  // Fields from User
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  isProfileComplete: true, 

  // Relations
  profile: true,
  images: {
    // --- START OF FIX ---
    select: { 
      id: true, 
      url: true, 
      isMain: true, 
      // Add all fields required by the `UserImage` type
      createdAt: true, 
      updatedAt: true,
      cloudinaryPublicId: true,
      userId: true
    },
    // --- END OF FIX ---
    orderBy: { isMain: "desc" as const },
  },
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
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

    // --- REVISED AND SIMPLIFIED LOGIC ---
    // The filter now only needs to check for the existence of the profiles.
    // The type casting is now safe because our types match Prisma's output.
    const suggestions: ExtendedMatchSuggestion[] = suggestionsFromDb.filter(
      (s) => s.firstParty?.profile && s.secondParty?.profile
    ) as ExtendedMatchSuggestion[];

    // Transform suggestions into UnifiedMessage format
    const feedItems: FeedItem[] = suggestions.map((s) => {
      const isFirstParty = s.firstPartyId === userId;
      const otherParty = isFirstParty ? s.secondParty : s.firstParty;
      let type: FeedItemType = 'STATUS_UPDATE';
      let title = `עדכון בהצעה עם ${otherParty.firstName}`;
      let description = "הסטטוס התעדכן. לחץ/י לפרטים.";

      if ((s.status === "PENDING_FIRST_PARTY" && isFirstParty) || (s.status === "PENDING_SECOND_PARTY" && !isFirstParty)) {
        type = 'ACTION_REQUIRED';
        title = `הצעה חדשה ומרגשת ממתינה לך!`;
        description = `השדכן/ית ${s.matchmaker.firstName} חושב/ת שיש פוטנציאל גדול בהיכרות עם ${otherParty.firstName}.`;
      } else if (s.status === 'FIRST_PARTY_APPROVED' && !isFirstParty) {
        title = "חדשות טובות!";
        description = `${s.firstParty.firstName} אישר/ה את ההצעה. עכשיו תורך להחליט.`;
      } else if (s.status === "CONTACT_DETAILS_SHARED") {
        title = "מזל טוב, יש התאמה!";
        description = `שניכם אישרתם! פרטי הקשר הועברו. זה הזמן ליצור קשר.`;
      } else if (s.status === "AWAITING_FIRST_DATE_FEEDBACK") {
        type = 'ACTION_REQUIRED';
        title = "איך הייתה הפגישה הראשונה?";
        description = "נשמח לשמוע את דעתך כדי שנוכל להמשיך ולסייע.";
      }
      
      return {
        id: `${s.id}-${s.status}`,
        type,
        title,
        description,
        timestamp: s.lastActivity,
        isRead: false,
        link: `/matches?suggestionId=${s.id}`,
        payload: { suggestion: s },
      };
    });
    
    return NextResponse.json({ success: true, feed: feedItems });

  } catch (error) {
    console.error("Error fetching activity feed:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch activity feed" }, { status: 500 });
  }
}