// File: src/app/api/matchmaker/existing-suggestions/route.ts
// ─────────────────────────────────────────────────────────────
// מחזיר רשימת userId-ים שכבר יש להם הצעת שידוך עם המועמד הנתון
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import  prisma  from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['MATCHMAKER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // מוצא את כל ההצעות שבהן המועמד הנתון הוא צד א' או צד ב'
    const suggestions = await prisma.matchSuggestion.findMany({
      where: {
        OR: [
          { firstPartyId: userId },
          { secondPartyId: userId },
        ],
      },
      select: {
        firstPartyId: true,
        secondPartyId: true,
        status: true,
        createdAt: true,
      },
    });

    // בונה מפה של כל הצדדים הנגדיים עם הסטטוס שלהם
    const existingSuggestionsMap: Record<
      string,
      { status: string; createdAt: string }
    > = {};

    for (const suggestion of suggestions) {
      // הצד הנגדי הוא מי שאינו ה-userId הנתון
      const otherPartyId =
        suggestion.firstPartyId === userId
          ? suggestion.secondPartyId
          : suggestion.firstPartyId;

      // שומר את ההצעה העדכנית ביותר (אם יש כמה)
      const existing = existingSuggestionsMap[otherPartyId];
      if (
        !existing ||
        new Date(suggestion.createdAt) > new Date(existing.createdAt)
      ) {
        existingSuggestionsMap[otherPartyId] = {
          status: suggestion.status,
          createdAt: suggestion.createdAt.toISOString(),
        };
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      existingSuggestions: existingSuggestionsMap,
    });
  } catch (error) {
    console.error('Error fetching existing suggestions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}