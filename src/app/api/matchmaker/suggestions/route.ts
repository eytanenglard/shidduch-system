import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Session } from "next-auth"; // Be careful with direct Session import if using JWT strategy
import { MatchSuggestionStatus, Prisma, UserRole } from "@prisma/client"; // Added UserRole
import { suggestionService } from "@/app/components/matchmaker/suggestions/services/suggestions/SuggestionService";
import type { CreateSuggestionData } from "@/app/types/suggestions";

// פונקציית עזר שמגדירה את הקטגוריה של ההצעה לפי הסטטוס שלה
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

// יצירת הצעה חדשה
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions); // Removed Session type assertion for safety
    
    // ---- START OF CHANGE ----
    if (!session?.user?.id || !session.user.role) { // Ensure role exists
        return NextResponse.json({ error: "Unauthorized - Invalid session" }, { status: 401 });
    }

    const allowedRolesToCreate: UserRole[] = [UserRole.MATCHMAKER, UserRole.ADMIN];
    if (!allowedRolesToCreate.includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: "Unauthorized - Matchmaker or Admin access required to create suggestions" }, { status: 403 });
    }
    // ---- END OF CHANGE ----

    const data = await req.json();
    
    const suggestionData: CreateSuggestionData = {
      ...data,
      matchmakerId: session.user.id, // The creator is the matchmakerId
    };

    const newSuggestion = await suggestionService.createSuggestion(suggestionData); // Renamed variable
    
    return NextResponse.json(newSuggestion); // Return the created suggestion
    
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

// קבלת רשימת הצעות
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
    // New filter: allow admin to see all, or filter by matchmakerId if they are a matchmaker
    const viewAll = searchParams.get("viewAll") === "true" && session.user.role === UserRole.ADMIN;


    const where: Prisma.MatchSuggestionWhereInput = {};
    
    if (!viewAll) { // If not admin viewing all
        if (session.user.role === UserRole.MATCHMAKER) {
          // Matchmaker sees their suggestions OR suggestions they are party to
          where.OR = [
            { matchmakerId: session.user.id },
            { firstPartyId: session.user.id },
            { secondPartyId: session.user.id }
          ];
        } else { // Candidate or Admin (not in viewAll mode) sees suggestions they are party to
          where.OR = [
            { firstPartyId: session.user.id },
            { secondPartyId: session.user.id }
          ];
        }
    } // If viewAll is true, no user-specific filters are applied here, admin sees all.

    if (status) where.status = status as MatchSuggestionStatus;
    if (priority) where.priority = priority as Prisma.EnumPriorityFieldUpdateOperationsInput["set"]; // Prisma.Priority
    
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
              select: {
                id: true,
                url: true,
                isMain: true
              },
              orderBy: [{ isMain: 'desc' }, { createdAt: 'asc'}]
            },
            profile: true
          }
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
              select: {
                id: true,
                url: true,
                isMain: true
              },
              orderBy: [{ isMain: 'desc' }, { createdAt: 'asc'}]
            },
            profile: true
          }
        },
        matchmaker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        statusHistory: {
            orderBy: { createdAt: 'desc' }
        },
        meetings: {
            orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: {
        lastActivity: 'desc'
      }
    });

    // עיבוד המידע המוחזר - המרת תאריכים וכו'
    const formattedSuggestions = suggestions.map(suggestion => ({
      ...suggestion,
      category: getSuggestionCategory(suggestion.status),
      firstParty: {
        ...suggestion.firstParty,
        profile: suggestion.firstParty.profile ? {
          ...suggestion.firstParty.profile,
          birthDate: suggestion.firstParty.profile.birthDate?.toISOString(), // birthDate is non-null in schema but profile can be null
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
        scheduledDate: meeting.scheduledDate.toISOString(), // Assuming scheduledDate is DateTime
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