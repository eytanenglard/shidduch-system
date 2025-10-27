// src/app/api/matchmaker/suggestions/[id]/status/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MatchSuggestionStatus, UserRole } from "@prisma/client";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.nativeEnum(MatchSuggestionStatus),
  notes: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    console.log("Received status update request:", body);
    
    const validationResult = updateStatusSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error);
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid request data", 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }
    
    const { status, notes } = validationResult.data;
    const params = await props.params;
    const suggestionId = params.id;
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      include: {
        matchmaker: {
          select: { id: true }
        }
      }
    });

    if (!suggestion) {
      return NextResponse.json(
        { success: false, error: "Suggestion not found" },
        { status: 404 }
      );
    }

    if (suggestion.matchmaker.id !== session.user.id && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: "You don't have permission to update this suggestion" },
        { status: 403 }
      );
    }

    const getCategory = (status: MatchSuggestionStatus) => {
      switch (status) {
        case "DRAFT":
        case "AWAITING_MATCHMAKER_APPROVAL":
        case "PENDING_FIRST_PARTY":
        case "PENDING_SECOND_PARTY":
          return "PENDING";
        
        case "FIRST_PARTY_DECLINED":
        case "SECOND_PARTY_DECLINED":
        case "MATCH_DECLINED":
        case "ENDED_AFTER_FIRST_DATE":
        case "ENGAGED":
        case "MARRIED":
        case "EXPIRED":
        case "CLOSED":
        case "CANCELLED":
          return "HISTORY";
        
        default:
          return "ACTIVE";
      }
    };

    const result = await prisma.$transaction(async (tx) => {
      const previousStatus = suggestion.status;
      const updatedSuggestion = await tx.matchSuggestion.update({
        where: { id: suggestionId },
        data: {
          status: status,
          previousStatus: previousStatus,
          lastStatusChange: new Date(),
          lastActivity: new Date(),
          category: getCategory(status),
          ...(status === MatchSuggestionStatus.CLOSED ? { closedAt: new Date() } : {}),
          ...(status === MatchSuggestionStatus.PENDING_FIRST_PARTY ? { firstPartySent: new Date() } : {}),
          ...(status === MatchSuggestionStatus.PENDING_SECOND_PARTY ? { secondPartySent: new Date() } : {}),
        },
      });

      await tx.suggestionStatusHistory.create({
        data: {
          suggestionId,
          status,
          notes: notes || `סטטוס שונה ל-${status} על ידי ${session.user.firstName} ${session.user.lastName}`,
        },
      });

      return updatedSuggestion;
    });

    return NextResponse.json({
      success: true,
      message: "Status updated successfully",
      suggestion: {
        id: result.id,
        status: result.status,
        previousStatus: result.previousStatus,
        lastStatusChange: result.lastStatusChange,
        category: result.category,
      },
    });

  } catch (error) {
    console.error("Error updating suggestion status:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to update status", 
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await props.params;
    const searchParams = new URL(req.url).searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50;

    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        status: true,
        lastStatusChange: true,
        matchmakerId: true,
        firstPartyId: true,
        secondPartyId: true,
      }
    });
    
    if (!suggestion) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }
    
    const canView = 
      session.user.role === UserRole.ADMIN ||
      suggestion.matchmakerId === session.user.id ||
      suggestion.firstPartyId === session.user.id ||
      suggestion.secondPartyId === session.user.id;
      
    if (!canView) {
      return NextResponse.json({ error: "Not authorized to view this suggestion" }, { status: 403 });
    }
    
    const historyQuery = {
      where: {
        suggestionId: params.id,
        ...(startDate && {
          createdAt: {
            gte: new Date(startDate),
            ...(endDate && {
              lte: new Date(endDate),
            }),
          },
        }),
      },
      include: {
        suggestion: {
          select: {
            firstParty: {
              select: { id: true, firstName: true, lastName: true },
            },
            secondParty: {
              select: { id: true, firstName: true, lastName: true },
            },
            matchmaker: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" as const },
      take: limit,
    };

    const history = await prisma.suggestionStatusHistory.findMany(historyQuery);

    const formattedHistory = history.map(entry => ({
      id: entry.id,
      status: entry.status,
      notes: entry.notes,
      createdAt: entry.createdAt,
      actors: {
        firstParty: {
          id: entry.suggestion.firstParty.id,
          name: `${entry.suggestion.firstParty.firstName} ${entry.suggestion.firstParty.lastName}`,
        },
        secondParty: {
          id: entry.suggestion.secondParty.id,
          name: `${entry.suggestion.secondParty.firstName} ${entry.suggestion.secondParty.lastName}`,
        },
        matchmaker: {
          id: entry.suggestion.matchmaker.id,
          name: `${entry.suggestion.matchmaker.firstName} ${entry.suggestion.matchmaker.lastName}`,
        },
      },
    }));

    return NextResponse.json({
      history: formattedHistory,
      suggestion: {
        id: suggestion.id,
        currentStatus: suggestion.status,
        lastStatusChange: suggestion.lastStatusChange?.toISOString() ?? null,
      },
    });

  } catch (error) {
    console.error("Error fetching suggestion history:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { error: "Failed to fetch history", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function HEAD(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(null, { status: 401 });
    }

    const params = await props.params;
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        status: true,
        lastStatusChange: true,
        firstPartyId: true,
        secondPartyId: true,
        matchmakerId: true,
      }
    });

    if (!suggestion) {
      return new Response(null, { status: 404 });
    }

    const canView = 
      session.user.role === UserRole.ADMIN ||
      suggestion.matchmakerId === session.user.id ||
      suggestion.firstPartyId === session.user.id ||
      suggestion.secondPartyId === session.user.id;
      
    if (!canView) {
      return new Response(null, { status: 403 });
    }

    const headers: Record<string, string> = {
      'X-Suggestion-Status': suggestion.status,
      'X-First-Party': suggestion.firstPartyId,
      'X-Second-Party': suggestion.secondPartyId,
    };

    if (suggestion.lastStatusChange) {
      headers['X-Last-Status-Change'] = suggestion.lastStatusChange.toISOString();
    }

    return new Response(null, { headers });

  } catch (error) {
    console.error("Error fetching suggestion status:", error);
    return new Response(null, { status: 500 });
  }
}