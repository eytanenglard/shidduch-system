import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MatchSuggestionStatus, Prisma, UserRole } from "@prisma/client";
import { suggestionService } from "@/app/components/matchmaker/suggestions/services/suggestions/SuggestionService";
import type { CreateSuggestionData } from "@/types/suggestions";

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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session.user.role) {
        return NextResponse.json({ error: "Unauthorized - Invalid session" }, { status: 401 });
    }

    const allowedRolesToCreate: UserRole[] = [UserRole.MATCHMAKER, UserRole.ADMIN];
    if (!allowedRolesToCreate.includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: "Unauthorized - Matchmaker or Admin access required to create suggestions" }, { status: 403 });
    }
    
    const data = await req.json();
    
    const suggestionData: CreateSuggestionData = {
      ...data,
      matchmakerId: session.user.id,
    };

    const newSuggestion = await suggestionService.createSuggestion(suggestionData);
    
    return NextResponse.json(newSuggestion);
    
  } catch (error) {
    console.error('Error creating suggestion:', error);
    let message = 'Failed to create suggestion';
    if (error instanceof Error) {
        message = error.message;
    }
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions); 
    
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: "Unauthorized - Invalid session" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const timeframe = searchParams.get("timeframe");

    const where: Prisma.MatchSuggestionWhereInput = {};
    
    // ---- START OF FIX ----
    // שינינו את הלוגיקה כדי לטפל נכון בהרשאות
    if (session.user.role === UserRole.MATCHMAKER) {
        // שדכן רואה רק את ההצעות שהוא יצר
        where.matchmakerId = session.user.id;
    } else if (session.user.role === UserRole.CANDIDATE) {
        // מועמד רואה רק הצעות שהוא צד בהן
        where.OR = [
            { firstPartyId: session.user.id },
            { secondPartyId: session.user.id }
        ];
    }
    // אם המשתמש הוא ADMIN, לא נוסיף סינון לפי מזהה משתמש, וכך הוא יראה את כל ההצעות.
    // ---- END OF FIX ----

    if (status) where.status = status as MatchSuggestionStatus;
    if (priority) where.priority = priority as Prisma.EnumPriorityFieldUpdateOperationsInput["set"];
    
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
          select: { id: true, email: true, firstName: true, lastName: true, status: true, isVerified: true, images: { select: { id: true, url: true, isMain: true }, orderBy: [{ isMain: 'desc' }, { createdAt: 'asc'}] }, profile: true }
        },
        secondParty: {
          select: { id: true, email: true, firstName: true, lastName: true, status: true, isVerified: true, images: { select: { id: true, url: true, isMain: true }, orderBy: [{ isMain: 'desc' }, { createdAt: 'asc'}] }, profile: true }
        },
        matchmaker: {
          select: { id: true, firstName: true, lastName: true, role: true }
        },
        statusHistory: { orderBy: { createdAt: 'desc' } },
        meetings: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { lastActivity: 'desc' }
    });

    const formattedSuggestions = suggestions.map(suggestion => ({
      ...suggestion,
      category: getSuggestionCategory(suggestion.status),
      firstParty: {
        ...suggestion.firstParty,
        profile: suggestion.firstParty.profile ? {
          ...suggestion.firstParty.profile,
          birthDate: suggestion.firstParty.profile.birthDate?.toISOString(),
          lastActive: suggestion.firstParty.profile.lastActive?.toISOString(),
          availabilityUpdatedAt: suggestion.firstParty.profile.availabilityUpdatedAt?.toISOString(),
          createdAt: suggestion.firstParty.profile.createdAt?.toISOString(),
          updatedAt: suggestion.firstParty.profile.updatedAt?.toISOString()
        } : null
      },
      secondParty: {
        ...suggestion.secondParty,
        profile: suggestion.secondParty.profile ? {
          ...suggestion.secondParty.profile,
          birthDate: suggestion.secondParty.profile.birthDate?.toISOString(),
          lastActive: suggestion.secondParty.profile.lastActive?.toISOString(),
          availabilityUpdatedAt: suggestion.secondParty.profile.availabilityUpdatedAt?.toISOString(),
          createdAt: suggestion.secondParty.profile.createdAt?.toISOString(),
          updatedAt: suggestion.secondParty.profile.updatedAt?.toISOString()
        } : null
      },
      statusHistory: suggestion.statusHistory.map(history => ({
        ...history,
        createdAt: history.createdAt.toISOString()
      })),
      meetings: suggestion.meetings.map(meeting => ({
        ...meeting,
        scheduledDate: meeting.scheduledDate.toISOString(),
        createdAt: meeting.createdAt.toISOString(),
        updatedAt: meeting.updatedAt.toISOString()
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
      lastActivity: suggestion.lastActivity.toISOString()
    }));
    
    // =================  LOGGING START (Improved) =================
    console.log(`[API GET /suggestions] User: ${session.user.id} (Role: ${session.user.role}). Found ${suggestions.length} suggestions matching query.`);
    if (suggestions.length > 0) {
        console.log(`[API GET /suggestions] Example suggestion being sent (ID: ${suggestions[0].id}, Status: ${suggestions[0].status})`);
    }
    // =================   LOGGING END   =================

    return NextResponse.json(formattedSuggestions);
    
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    let message = 'Failed to fetch suggestions';
    if (error instanceof Error) {
        message = error.message;
    }
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}