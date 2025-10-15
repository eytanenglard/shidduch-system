// FILENAME: src/app/api/suggestions/[id]/inquiries/mark-as-read/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// This endpoint will mark all PENDING inquiries for a specific suggestion as ANSWERED (or a new status like VIEWED)
// when the recipient (matchmaker) opens the chat.

export async function POST(
  req: NextRequest, // Add the request parameter here
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const suggestionId = params.id;
    const userId = session.user.id;

    // We only mark messages as read if the current user is the recipient.
    // We change the status from PENDING to ANSWERED, assuming that viewing it
    // implies the matchmaker will now answer. A more robust solution might
    // add a 'VIEWED' status, but for now, this simplifies the flow.
    const updateResult = await prisma.suggestionInquiry.updateMany({
      where: {
        suggestionId: suggestionId,
        toUserId: userId, // Only update messages sent TO me
        status: 'PENDING',
      },
      data: {
        // Here we can choose to just mark it as ANSWERED or add a new logic.
        // For simplicity, let's assume viewing means it's being handled.
        // A better approach might be to just have a `readAt` field.
        // Let's stick to the current schema and move it to ANSWERED.
        // NOTE: This is a simplification. The best way is to have a dedicated `isRead` flag.
        // But to avoid schema changes, we will consider it "answered" when viewed by matchmaker.
        // A better flow would be to change status to 'VIEWED' and have a separate 'ANSWERED'
        status: 'ANSWERED', // A simplification: assumes viewing = handling.
      },
    });

    return NextResponse.json({ success: true, count: updateResult.count });

  } catch (error) {
    console.error("Error marking inquiries as read:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}