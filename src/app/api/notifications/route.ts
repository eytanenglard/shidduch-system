import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Session } from "next-auth";

export async function GET() {
  try {
    // ההמרה לטיפוס Session תשתמש כעת בטיפוס המורחב מ-next-auth
    const session = await getServerSession(authOptions) as Session | null;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // בדיקת התראות זמינות
    const pendingInquiries = await prisma.availabilityInquiry.count({
      where: {
        OR: [
          { 
            firstPartyId: session.user.id,
            firstPartyResponse: null,
            expiresAt: { gt: new Date() }
          },
          { 
            secondPartyId: session.user.id,
            secondPartyResponse: null,
            expiresAt: { gt: new Date() }
          }
        ]
      },
    });

    // בעתיד נוסיף ספירה של הודעות שלא נקראו
    const unreadMessages = 0;
    const total = pendingInquiries + unreadMessages;

    return NextResponse.json({
      availabilityRequests: pendingInquiries,
      messages: unreadMessages,
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
