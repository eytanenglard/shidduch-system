  // src/app/api/matchmaker/suggestions/[id]/status/route.ts

  import { NextRequest, NextResponse } from "next/server";
  import { getServerSession } from "next-auth";
  import { authOptions } from "@/lib/auth";
  import prisma from "@/lib/prisma";
  import { MatchSuggestionStatus, UserRole } from "@prisma/client";
  import { z } from "zod";
  import { getDictionary } from "@/lib/dictionaries";
  import { statusTransitionService } from "@/components/matchmaker/suggestions/services/suggestions/StatusTransitionService";

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

      // ─── שליפת ההצעה עם כל הצדדים (נדרש ל-StatusTransitionService) ───
      const suggestion = await prisma.matchSuggestion.findUnique({
        where: { id: suggestionId },
        include: {
          firstParty: { include: { profile: true } },
          secondParty: { include: { profile: true } },
          matchmaker: true,
        },
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

      // ─── טעינת מילונים לשליחת מיילים ───
      const [heFullDict, enFullDict] = await Promise.all([
        getDictionary('he'),
        getDictionary('en'),
      ]);
      const heDict = heFullDict.email;
      const enDict = enFullDict.email;

      // ─── זיהוי שפות הצדדים ───
      const firstPartyLang = ((suggestion.firstParty as any).language || 'he') as 'he' | 'en';
      const secondPartyLang = ((suggestion.secondParty as any).language || 'he') as 'he' | 'en';
      const matchmakerLang = ((suggestion.matchmaker as any).language || 'he') as 'he' | 'en';

      // ─── שימוש ב-StatusTransitionService שמטפל ב:
      //     1. עדכון DB + היסטוריה
      //     2. שליחת מייל + WhatsApp
      //     3. שליחת Push Notification
      // ───
      const updatedSuggestion = await statusTransitionService.transitionStatus(
        suggestion,
        status,
        { he: heDict, en: enDict },
        notes || `סטטוס שונה ל-${status} על ידי ${session.user.firstName} ${session.user.lastName}`,
        {
        sendNotifications: true,
        notifyParties: ['first', 'second', 'matchmaker'],
        skipValidation: true,
      },
        {
          firstParty: firstPartyLang,
          secondParty: secondPartyLang,
          matchmaker: matchmakerLang,
        }
      );

      return NextResponse.json({
        success: true,
        message: "Status updated successfully",
        suggestion: {
          id: updatedSuggestion.id,
          status: updatedSuggestion.status,
          previousStatus: updatedSuggestion.previousStatus,
          lastStatusChange: updatedSuggestion.lastStatusChange,
          category: (updatedSuggestion as any).category,
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