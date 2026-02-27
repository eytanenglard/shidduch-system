// src/app/api/suggestions/interested/rank/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// ===================================================================
// PUT: עדכון סדר העדיפויות של הצעות INTERESTED
// היוזר שולח מערך מסודר של suggestion IDs לפי סדר העדיפות החדש
// ===================================================================

const updateRanksSchema = z.object({
  rankedSuggestionIds: z.array(z.string()).min(1),
});

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = updateRanksSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { rankedSuggestionIds } = validation.data;
    const userId = session.user.id;

    // וידוא שכל ההצעות שייכות ליוזר ובסטטוס INTERESTED
    const suggestions = await prisma.matchSuggestion.findMany({
      where: {
        id: { in: rankedSuggestionIds },
        firstPartyId: userId,
        status: "FIRST_PARTY_INTERESTED",
      },
      select: { id: true },
    });

    const validIds = new Set(suggestions.map((s) => s.id));
    const invalidIds = rankedSuggestionIds.filter((id) => !validIds.has(id));

    if (invalidIds.length > 0) {
      return NextResponse.json(
        {
          error: "Some suggestions are not valid for ranking",
          invalidIds,
        },
        { status: 400 }
      );
    }

    // עדכון ה-rank ב-transaction
    await prisma.$transaction(
      rankedSuggestionIds.map((id, index) =>
        prisma.matchSuggestion.update({
          where: { id },
          data: {
            firstPartyRank: index + 1, // rank 1 = עדיפות הכי גבוהה
            lastActivity: new Date(),
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: "Ranks updated successfully",
      count: rankedSuggestionIds.length,
    });
  } catch (error) {
    console.error("Error updating suggestion ranks:", error);
    return NextResponse.json(
      { error: "Failed to update ranks" },
      { status: 500 }
    );
  }
}