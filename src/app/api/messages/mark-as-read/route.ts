// src/app/api/messages/mark-as-read/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, type } = await req.json();
    const userId = session.user.id;

    // טיפול בהצעה (MatchSuggestion)
    // ה-ID שמגיע מהפיד הוא בפורמט "suggestionId-status", אנחנו צריכים רק את ה-UUID
    if (type === 'NEW_SUGGESTION' || type === 'STATUS_UPDATE' || type === 'ACTION_REQUIRED') {
      // חילוץ ה-ID הנקי (למקרה שהגיע ID מורכב מהפיד)
      const cleanId = id.includes('-') ? id.split('-')[0] : id;

      const suggestion = await prisma.matchSuggestion.findUnique({
        where: { id: cleanId },
        select: { firstPartyId: true, secondPartyId: true }
      });

      if (suggestion) {
        if (suggestion.firstPartyId === userId) {
          await prisma.matchSuggestion.update({
            where: { id: cleanId },
            data: { firstPartyLastViewedAt: new Date() }
          });
        } else if (suggestion.secondPartyId === userId) {
          await prisma.matchSuggestion.update({
            where: { id: cleanId },
            data: { secondPartyLastViewedAt: new Date() }
          });
        }
      }
    } 
    
    // טיפול בהודעת צ'אט (SuggestionInquiry)
    else if (type === 'MATCHMAKER_MESSAGE' || type === 'INQUIRY_RESPONSE') {
      await prisma.suggestionInquiry.update({
        where: { id: id }, // כאן ה-ID הוא ישיר
        data: { recipientReadAt: new Date() }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking as read:", error);
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
  }
}