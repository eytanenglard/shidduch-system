import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Session } from "next-auth";
import { MatchSuggestionStatus, Prisma } from "@prisma/client";
import { suggestionService } from "@/app/components/matchmaker/suggestions/services/suggestions/SuggestionService";
import type { CreateSuggestionData } from "@/app/types/suggestions";

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
    const session = await getServerSession(authOptions) as Session | null;
    
    if (!session?.user?.id || session.user.role !== 'MATCHMAKER') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    
    const suggestionData: CreateSuggestionData = {
      ...data,
      matchmakerId: session.user.id,
    };

    const suggestion = await suggestionService.createSuggestion(suggestionData);
    
    return NextResponse.json(suggestion);
    
  } catch (error) {
    console.error('Error creating suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to create suggestion' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const timeframe = searchParams.get("timeframe");

    const where: Prisma.MatchSuggestionWhereInput = {};
    
    if (session.user.role === 'MATCHMAKER') {
      where.matchmakerId = session.user.id;
    } else {
      where.OR = [
        { firstPartyId: session.user.id },
        { secondPartyId: session.user.id }
      ];
    }

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
              }
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
              }
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
        statusHistory: true,
        meetings: true
      },
      orderBy: {
        lastActivity: 'desc'
      }
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
        createdAt: meeting.createdAt.toISOString(),
        updatedAt: meeting.updatedAt.toISOString()
      })),
      createdAt: suggestion.createdAt.toISOString(),
      updatedAt: suggestion.updatedAt.toISOString(),
      lastActivity: suggestion.lastActivity.toISOString()
    }));

    return NextResponse.json(formattedSuggestions);
    
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}