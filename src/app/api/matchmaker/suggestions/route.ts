// src/app/api/matchmaker/suggestions/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { MatchSuggestionStatus, Prisma, UserRole } from '@prisma/client';
import { suggestionService } from '@/app/components/matchmaker/suggestions/services/suggestions/SuggestionService';
import { updateUserAiProfile } from '@/lib/services/profileAiService';
import type { CreateSuggestionData } from '@/types/suggestions';

export const dynamic = 'force-dynamic';

/**
 * מחשב את הקטגוריה של ההצעה בהתבסס על הסטטוס שלה.
 * @param status - סטטוס ההצעה הנוכחי.
 * @returns 'PENDING', 'ACTIVE', או 'HISTORY'.
 */
const getSuggestionCategory = (status: MatchSuggestionStatus) => {
  switch (status) {
    case 'DRAFT':
    case 'AWAITING_MATCHMAKER_APPROVAL':
    case 'PENDING_FIRST_PARTY':
    case 'PENDING_SECOND_PARTY':
      return 'PENDING';

    case 'FIRST_PARTY_DECLINED':
    case 'SECOND_PARTY_DECLINED':
    case 'MATCH_DECLINED':
    case 'ENDED_AFTER_FIRST_DATE':
    case 'ENGAGED':
    case 'MARRIED':
    case 'EXPIRED':
    case 'CLOSED':
    case 'CANCELLED':
      return 'HISTORY';

    default:
      return 'ACTIVE';
  }
};

/**
 * POST: יוצר הצעת שידוך חדשה.
 * רק שדכנים ומנהלים יכולים ליצור הצעות.
 * לפני היצירה, הפונקציה מוודאת שפרופילי ה-AI של שני המועמדים מעודכנים.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid session' },
        { status: 401 }
      );
    }

    const allowedRolesToCreate: UserRole[] = [
      UserRole.MATCHMAKER,
      UserRole.ADMIN,
    ];
    if (!allowedRolesToCreate.includes(session.user.role as UserRole)) {
      return NextResponse.json(
        {
          error:
            'Unauthorized - Matchmaker or Admin access required to create suggestions',
        },
        { status: 403 }
      );
    }

    const data = await req.json();

    // שלב 1: אימות ראשוני של הנתונים הנכנסים מהקליינט.
    // כאן אפשר להוסיף Zod schema אם רוצים ולידציה מחמירה יותר.
    if (!data.firstPartyId || !data.secondPartyId || !data.decisionDeadline) {
      return NextResponse.json(
        { error: 'Invalid input: Missing required fields.' },
        { status: 400 }
      );
    }

    // שלב 2: בדיקה ועדכון פרופילי AI לפי הצורך (הלוגיקה החדשה)
    try {
      const [firstParty, secondParty] = await Promise.all([
        prisma.user.findUnique({
          where: { id: data.firstPartyId },
          include: { profile: true },
        }),
        prisma.user.findUnique({
          where: { id: data.secondPartyId },
          include: { profile: true },
        }),
      ]);

      if (!firstParty || !secondParty) {
        return NextResponse.json(
          { error: 'One or both candidates not found.' },
          { status: 404 }
        );
      }

      const profilesToUpdate: { userId: string; profileId: string }[] = [];
      if (firstParty.profile?.needsAiProfileUpdate) {
        profilesToUpdate.push({
          userId: firstParty.id,
          profileId: firstParty.profile.id,
        });
      }
      if (secondParty.profile?.needsAiProfileUpdate) {
        profilesToUpdate.push({
          userId: secondParty.id,
          profileId: secondParty.profile.id,
        });
      }

      if (profilesToUpdate.length > 0) {
        console.log(
          `[AI Update Trigger] Updating AI profiles for users: ${profilesToUpdate
            .map((p) => p.userId)
            .join(', ')} before creating suggestion.`
        );
        // עדכון פרופילי ה-AI במקביל
        await Promise.all(
          profilesToUpdate.map((p) => updateUserAiProfile(p.userId))
        );

        // איפוס הדגל לאחר העדכון המוצלח
        await prisma.profile.updateMany({
          where: { id: { in: profilesToUpdate.map((p) => p.profileId) } },
          data: { needsAiProfileUpdate: false },
        });
        console.log(
          `[AI Update Trigger] Flags reset for users: ${profilesToUpdate
            .map((p) => p.userId)
            .join(', ')}.`
        );
      }
    } catch (aiUpdateError) {
      console.error('Failed during pre-suggestion AI profile update:', aiUpdateError);
      // מחזירים שגיאה ספציפית כדי שהשדכן ידע שהייתה בעיה בעדכון ה-AI
      return NextResponse.json(
        { error: 'Failed to update AI profiles for candidates. Please try again.' },
        { status: 500 }
      );
    }

    // שלב 3: יצירת ההצעה באמצעות השירות הייעודי
    const suggestionData: CreateSuggestionData = {
      ...data,
      matchmakerId: session.user.id,
    };

    const newSuggestion = await suggestionService.createSuggestion(suggestionData);

    return NextResponse.json(newSuggestion, { status: 201 });
  } catch (error) {
    console.error('Error creating suggestion:', error);
    let message = 'Failed to create suggestion';
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET: מאחזר רשימה של הצעות שידוך בהתבסס על הרשאות המשתמש ופרמטרי סינון.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid session' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const timeframe = searchParams.get('timeframe');

    const where: Prisma.MatchSuggestionWhereInput = {};

    // לוגיקת הרשאות:
    // - אדמין רואה הכל.
    // - שדכן רואה רק את ההצעות שהוא יצר.
    // - מועמד רואה רק הצעות שהוא צד בהן.
    if (session.user.role === UserRole.MATCHMAKER) {
      where.matchmakerId = session.user.id;
    } else if (session.user.role === UserRole.CANDIDATE) {
      where.OR = [
        { firstPartyId: session.user.id },
        { secondPartyId: session.user.id },
      ];
    }

    if (status) where.status = status as MatchSuggestionStatus;
    if (priority)
      where.priority =
        priority as Prisma.EnumPriorityFieldUpdateOperationsInput['set'];

    if (timeframe) {
      const date = new Date();
      switch (timeframe) {
        case 'today':
          date.setHours(0, 0, 0, 0);
          where.createdAt = { gte: date };
          break;
        case 'week':
          date.setDate(date.getDate() - 7);
          where.createdAt = { gte: date };
          break;
        case 'month':
          date.setMonth(date.getMonth() - 1);
          where.createdAt = { gte: date };
          break;
      }
    }

    const suggestions = await prisma.matchSuggestion.findMany({
      where,
      include: {
        firstParty: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
            isVerified: true,
            images: {
              select: { id: true, url: true, isMain: true },
              orderBy: [{ isMain: 'desc' }, { createdAt: 'asc' }],
            },
            profile: true,
          },
        },
        secondParty: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
            isVerified: true,
            images: {
              select: { id: true, url: true, isMain: true },
              orderBy: [{ isMain: 'desc' }, { createdAt: 'asc' }],
            },
            profile: true,
          },
        },
        matchmaker: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        statusHistory: { orderBy: { createdAt: 'desc' } },
        meetings: { orderBy: { createdAt: 'desc' } },
        inquiries: {
          include: {
            fromUser: { select: { id: true, firstName: true, lastName: true } },
            toUser: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { lastActivity: 'desc' },
    });

    // פורמט תאריכים למחרוזות ISO כדי למנוע שגיאות סריאליזציה
    const formattedSuggestions = suggestions.map((suggestion) => ({
      ...suggestion,
      category: getSuggestionCategory(suggestion.status),
      firstParty: {
        ...suggestion.firstParty,
        profile: suggestion.firstParty.profile
          ? {
              ...suggestion.firstParty.profile,
              birthDate:
                suggestion.firstParty.profile.birthDate?.toISOString(),
              lastActive:
                suggestion.firstParty.profile.lastActive?.toISOString(),
              availabilityUpdatedAt:
                suggestion.firstParty.profile.availabilityUpdatedAt?.toISOString(),
              createdAt:
                suggestion.firstParty.profile.createdAt?.toISOString(),
              updatedAt:
                suggestion.firstParty.profile.updatedAt?.toISOString(),
            }
          : null,
      },
      secondParty: {
        ...suggestion.secondParty,
        profile: suggestion.secondParty.profile
          ? {
              ...suggestion.secondParty.profile,
              birthDate:
                suggestion.secondParty.profile.birthDate?.toISOString(),
              lastActive:
                suggestion.secondParty.profile.lastActive?.toISOString(),
              availabilityUpdatedAt:
                suggestion.secondParty.profile.availabilityUpdatedAt?.toISOString(),
              createdAt:
                suggestion.secondParty.profile.createdAt?.toISOString(),
              updatedAt:
                suggestion.secondParty.profile.updatedAt?.toISOString(),
            }
          : null,
      },
      statusHistory: suggestion.statusHistory.map((history) => ({
        ...history,
        createdAt: history.createdAt.toISOString(),
      })),
      meetings: suggestion.meetings.map((meeting) => ({
        ...meeting,
        scheduledDate: meeting.scheduledDate.toISOString(),
        createdAt: meeting.createdAt.toISOString(),
        updatedAt: meeting.updatedAt.toISOString(),
      })),
      responseDeadline: suggestion.responseDeadline?.toISOString(),
      decisionDeadline: suggestion.decisionDeadline?.toISOString(),
      lastStatusChange: suggestion.lastStatusChange?.toISOString(),
      firstPartySent: suggestion.firstPartySent?.toISOString(),
      firstPartyResponded: suggestion.firstPartyResponded?.toISOString(),
      secondPartySent: suggestion.secondPartySent?.toISOString(),
      secondPartyResponded: suggestion.secondPartyResponded?.toISOString(),
      firstMeetingScheduled: suggestion.firstMeetingScheduled?.toISOString(),
      closedAt: suggestion.closedAt?.toISOString(),
      createdAt: suggestion.createdAt.toISOString(),
      updatedAt: suggestion.updatedAt.toISOString(),
      lastActivity: suggestion.lastActivity.toISOString(),
    }));

    console.log(
      `[API GET /suggestions] User: ${session.user.id} (Role: ${
        session.user.role
      }). Found ${suggestions.length} suggestions matching query.`
    );

    return NextResponse.json(formattedSuggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    let message = 'Failed to fetch suggestions';
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}