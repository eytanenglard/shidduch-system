// FILENAME: src/app/api/suggestions/[id]/inquiries/mark-as-read/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const suggestionId = context.params.id;
    const userId = session.user.id;

    const updateResult = await prisma.suggestionInquiry.updateMany({
      where: {
        suggestionId: suggestionId,
        toUserId: userId,
        status: 'PENDING',
      },
      data: {
        status: 'ANSWERED', // A simplification: assumes viewing = handling.
      },
    });

    return NextResponse.json({ success: true, count: updateResult.count });

  } catch (error) {
    console.error("Error marking inquiries as read:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}