import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MatchSuggestionStatus, PrismaClient } from "@prisma/client";
import { z } from "zod";
import { suggestionService } from "@/app/components/matchmaker/new/services/suggestions/SuggestionService";

// Initialize Prisma Client
const prisma = new PrismaClient();

// Validation schema for status update
const updateStatusSchema = z.object({
  status: z.nativeEnum(MatchSuggestionStatus),
  notes: z.string().optional(),
});

// Validation schema for history query parameters
const getHistorySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().min(1).max(100).optional().default(50),
});

/**
 * PATCH endpoint for updating suggestion status
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. User authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Request validation
    const body = await req.json();
    const { status, notes } = updateStatusSchema.parse(body);

    // 3. Update suggestion status
    const updatedSuggestion = await suggestionService.updateSuggestionStatus(
      params.id,
      status,
      session.user.id,
      notes
    );

    return NextResponse.json({
      message: "Status updated successfully",
      suggestion: updatedSuggestion,
    });

  } catch (error) {
    console.error("Error updating suggestion status:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for fetching suggestion history
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. User authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse URL parameters
    const searchParams = new URL(req.url).searchParams;
    const queryParams = getHistorySchema.parse({
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });

    // 3. Check viewing permissions
    const suggestion = await suggestionService.getSuggestionDetails(params.id, session.user.id);
    
    // 4. Build history query
    const historyQuery = {
      where: {
        suggestionId: params.id,
        ...(queryParams.startDate && {
          createdAt: {
            gte: new Date(queryParams.startDate),
            ...(queryParams.endDate && {
              lte: new Date(queryParams.endDate),
            }),
          },
        }),
      },
      include: {
        suggestion: {
          select: {
            firstParty: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            secondParty: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            matchmaker: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc" as const,
      },
      take: queryParams.limit,
    };

    // 5. Fetch status change history
    const history = await prisma.suggestionStatusHistory.findMany(historyQuery);

    // 6. Format results
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
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * HEAD endpoint for getting status summary
 */
export async function HEAD(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. User authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(null, { status: 401 });
    }

    // 2. Fetch suggestion details
    const suggestion = await suggestionService.getSuggestionDetails(params.id, session.user.id);

    // 3. Prepare headers
    const headers: Record<string, string> = {
      'X-Suggestion-Status': suggestion.status,
      'X-First-Party': suggestion.firstPartyId,
      'X-Second-Party': suggestion.secondPartyId,
    };

    // Add lastStatusChange header only if it exists
    if (suggestion.lastStatusChange) {
      headers['X-Last-Status-Change'] = suggestion.lastStatusChange.toISOString();
    }

    return new Response(null, { headers });

  } catch (error) {
    console.error("Error fetching suggestion status:", error);
    return new Response(null, { status: 500 });
  }
}