// FILENAME: src/app/api/notifications/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Session } from "next-auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. ספירת בקשות זמינות כלליות שממתינות למשתמש זה
    const pendingAvailabilityRequests = await prisma.availabilityInquiry.count({
      where: {
        OR: [
          { 
            firstPartyId: userId,
            firstPartyResponse: null,
            expiresAt: { gt: new Date() }
          },
          { 
            secondPartyId: userId,
            secondPartyResponse: null,
            expiresAt: { gt: new Date() }
          }
        ]
      },
    });

    // 2. ספירת הודעות צ'אט חדשות שממתינות למשתמש זה
    // (הודעות שהמשתמש הוא הנמען שלהן והסטטוס שלהן הוא "ממתין")
    const unreadChatMessages = await prisma.suggestionInquiry.count({
        where: {
            toUserId: userId,
            status: 'PENDING'
        }
    });

    const total = pendingAvailabilityRequests + unreadChatMessages;

    return NextResponse.json({
      availabilityRequests: pendingAvailabilityRequests,
      messages: unreadChatMessages, // זה עכשיו סופר הודעות צ'אט אמיתיות
      total: total
    });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}