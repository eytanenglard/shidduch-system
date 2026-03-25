// src/app/api/suggestions/[id]/status/route.ts
// ════════════════════════════════════════════════════════════════
// FIXED: Now uses StatusTransitionService for proper email/notification handling
// FIXED: Matchmaker/Admin can skip validation (any status transition allowed)
// ════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MatchSuggestionStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { statusTransitionService } from "@/components/matchmaker/suggestions/services/suggestions/StatusTransitionService";
import { getDictionary } from "@/lib/dictionaries";
import type { EmailDictionary } from "@/types/dictionary";

const updateStatusSchema = z.object({
  status: z.nativeEnum(MatchSuggestionStatus),
  notes: z.string().optional(),
});

/**
 * PATCH endpoint for updating suggestion status
 * Now routes through StatusTransitionService for proper notifications
 */
export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // 1. User authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Verify basic roles (Allow CANDIDATE, MATCHMAKER, ADMIN)
    const allowedRoles: UserRole[] = [UserRole.MATCHMAKER, UserRole.ADMIN, UserRole.CANDIDATE];
    if (!allowedRoles.includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // 3. Validate request data
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

    // 4. Verify suggestion exists (with full relations for StatusTransitionService)
    const params = await props.params;
    const suggestionId = params.id;
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

    // 5. Verify permission on specific suggestion
    const isUserAdmin = session.user.role === UserRole.ADMIN;
    const isUserMatchmakerOwner = session.user.role === UserRole.MATCHMAKER && suggestion.matchmakerId === session.user.id;
    const isUserParty = session.user.role === UserRole.CANDIDATE && (suggestion.firstPartyId === session.user.id || suggestion.secondPartyId === session.user.id);

    if (!isUserAdmin && !isUserMatchmakerOwner && !isUserParty) {
      return NextResponse.json(
        { success: false, error: "You don't have permission to update this suggestion" },
        { status: 403 }
      );
    }

    // 6. Determine if we should skip validation (matchmaker/admin can do any transition)
    const canSkipValidation = isUserAdmin || isUserMatchmakerOwner;

    // 7. Load dictionaries for email notifications
    const [heDict, enDict] = await Promise.all([
      getDictionary('he'),
      getDictionary('en'),
    ]);

    const dictionaries = {
      he: heDict.email as EmailDictionary,
      en: enDict.email as EmailDictionary,
    };

    // 8. Determine language preferences
    const firstPartyLang = (suggestion.firstParty as any).language || 'he';
    const secondPartyLang = (suggestion.secondParty as any).language || 'he';
    const matchmakerLang = (suggestion.matchmaker as any).language || 'he';

    // 9. Determine notification strategy
    // When a CANDIDATE approves as first party, delay matchmaker notification
    // to allow a grace period for withdrawal.
    const isFirstPartyApproving =
      isUserParty &&
      session.user.id === suggestion.firstPartyId &&
      status === MatchSuggestionStatus.FIRST_PARTY_APPROVED;

    const updatedSuggestion = await statusTransitionService.transitionStatus(
      suggestion,
      status,
      dictionaries,
      notes || `סטטוס שונה מ-${suggestion.status} ל-${status} על ידי משתמש ${session.user.id}`,
      {
        sendNotifications: !isFirstPartyApproving,
        notifyParties: ['first', 'second', 'matchmaker'],
        skipValidation: canSkipValidation,
      },
      {
        firstParty: firstPartyLang,
        secondParty: secondPartyLang,
        matchmaker: matchmakerLang,
      }
    );

    // 9b. If first party approved, mark notification as pending (will be sent by cron after grace period)
    if (isFirstPartyApproving) {
      await prisma.matchSuggestion.update({
        where: { id: suggestionId },
        data: { matchmakerNotifiedAt: null },
      });
    }

    // 10. Handle FIRST_PARTY_INTERESTED rank logic (kept from original)
    if (status === 'FIRST_PARTY_INTERESTED') {
      const highestRank = await prisma.matchSuggestion.findFirst({
        where: {
          firstPartyId: suggestion.firstPartyId,
          status: 'FIRST_PARTY_INTERESTED',
          id: { not: suggestionId },
        },
        orderBy: { firstPartyRank: 'desc' },
        select: { firstPartyRank: true },
      });

      const nextRank = (highestRank?.firstPartyRank ?? 0) + 1;

      await prisma.matchSuggestion.update({
        where: { id: suggestionId },
        data: {
          firstPartyRank: nextRank,
          firstPartyInterestedAt: new Date(),
        },
      });
    }

    // Handle transition from INTERESTED to APPROVED - clean up rank
    if (
      status === 'FIRST_PARTY_APPROVED' &&
      suggestion.status === 'FIRST_PARTY_INTERESTED'
    ) {
      await prisma.matchSuggestion.update({
        where: { id: suggestionId },
        data: {
          firstPartyRank: null,
          firstPartyResponded: new Date(),
        },
      });

      const remainingInterested = await prisma.matchSuggestion.findMany({
        where: {
          firstPartyId: suggestion.firstPartyId,
          status: 'FIRST_PARTY_INTERESTED',
        },
        orderBy: { firstPartyRank: 'asc' },
        select: { id: true },
      });

      for (let i = 0; i < remainingInterested.length; i++) {
        await prisma.matchSuggestion.update({
          where: { id: remainingInterested[i].id },
          data: { firstPartyRank: i + 1 },
        });
      }
    }

    // 11. Contest mechanism — handle concurrent second party suggestions
    await handleSecondPartyContest(updatedSuggestion, status, suggestion.status);

    // 12. Return success response
    return NextResponse.json({
      success: true,
      message: "Status updated successfully",
      suggestion: {
        id: updatedSuggestion.id,
        status: updatedSuggestion.status,
        previousStatus: updatedSuggestion.previousStatus,
        lastStatusChange: updatedSuggestion.lastStatusChange,
        category: updatedSuggestion.category,
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


/**
 * GET endpoint for fetching suggestion history
 */
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // 1. User authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse URL parameters
    const params = await props.params;
    const searchParams = new URL(req.url).searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50;

    // 3. Check viewing permissions
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
    
    // 4. Build history query
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
      take: limit,
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
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { error: "Failed to fetch history", details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * HEAD endpoint for getting status summary
 */
export async function HEAD(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // 1. User authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(null, { status: 401 });
    }

    // 2. Fetch suggestion details
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

    // 3. Check viewing permissions
    const canView = 
      session.user.role === UserRole.ADMIN ||
      suggestion.matchmakerId === session.user.id ||
      suggestion.firstPartyId === session.user.id ||
      suggestion.secondPartyId === session.user.id;
      
    if (!canView) {
      return new Response(null, { status: 403 });
    }

    // 4. Prepare headers
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

// =============================================================================
// Contest Mechanism — Handles concurrent second party suggestions
// =============================================================================

const CONTESTED_DEADLINE_HOURS = 24;

const TERMINAL_STATUSES: MatchSuggestionStatus[] = [
  'FIRST_PARTY_DECLINED', 'SECOND_PARTY_DECLINED', 'CLOSED', 'CANCELLED', 'EXPIRED',
];

/**
 * When a suggestion status changes, handle contest scenarios:
 * 1. FIRST_PARTY_APPROVED → mark other pending auto-suggestions for same second party as contested
 * 2. PENDING_SECOND_PARTY → freeze other suggestions for same second party
 * 3. Terminal status (DECLINED/CLOSED/CANCELLED/EXPIRED) → release queue, notify next in line
 */
async function handleSecondPartyContest(
  suggestion: { id: string; secondPartyId: string; isAutoSuggestion: boolean },
  newStatus: MatchSuggestionStatus,
  previousStatus: MatchSuggestionStatus,
) {
  try {
    const secondPartyId = suggestion.secondPartyId;

    // Case 1: First party approved → contest other pending suggestions
    if (newStatus === 'FIRST_PARTY_APPROVED') {
      const otherPending = await prisma.matchSuggestion.findMany({
        where: {
          secondPartyId,
          id: { not: suggestion.id },
          status: 'PENDING_FIRST_PARTY',
          isAutoSuggestion: true,
          secondPartyContested: false,
        },
        select: { id: true, decisionDeadline: true },
      });

      if (otherPending.length === 0) return;

      const newDeadline = new Date(Date.now() + CONTESTED_DEADLINE_HOURS * 60 * 60 * 1000);

      for (const other of otherPending) {
        const shouldShortenDeadline = !other.decisionDeadline || newDeadline < other.decisionDeadline;
        await prisma.matchSuggestion.update({
          where: { id: other.id },
          data: {
            secondPartyContested: true,
            secondPartyContestedAt: new Date(),
            originalDeadline: other.decisionDeadline,
            ...(shouldShortenDeadline ? { decisionDeadline: newDeadline } : {}),
          },
        });
      }

      console.log(`[Contest] ${otherPending.length} suggestions marked as contested for second party ${secondPartyId}`);
    }

    // Case 2: Moved to PENDING_SECOND_PARTY → freeze other suggestions
    if (newStatus === 'PENDING_SECOND_PARTY') {
      const otherActive = await prisma.matchSuggestion.findMany({
        where: {
          secondPartyId,
          id: { not: suggestion.id },
          status: 'PENDING_FIRST_PARTY',
          isAutoSuggestion: true,
        },
        select: { id: true, internalNotes: true },
      });

      for (const other of otherActive) {
        await prisma.matchSuggestion.update({
          where: { id: other.id },
          data: {
            internalNotes: `${other.internalNotes || ''}\n⏸️ Second party sent to another suggestion — on hold`.trim(),
          },
        });
      }

      if (otherActive.length > 0) {
        console.log(`[Contest] ${otherActive.length} suggestions frozen — second party ${secondPartyId} now in PENDING_SECOND_PARTY`);
      }
    }

    // Case 3: Terminal status → release queue, check for next in line
    if (TERMINAL_STATUSES.includes(newStatus)) {
      // Find next suggestion in queue (already approved by their first party, highest AI score)
      const nextInQueue = await prisma.matchSuggestion.findFirst({
        where: {
          secondPartyId,
          id: { not: suggestion.id },
          status: 'FIRST_PARTY_APPROVED',
          isAutoSuggestion: true,
        },
        include: {
          potentialMatch: { select: { aiScore: true } },
          matchmaker: { select: { id: true, firstName: true, email: true } },
        },
        orderBy: { createdAt: 'asc' }, // First approved gets priority
      });

      if (nextInQueue) {
        // Notify matchmaker that second party is available again
        console.log(`[Contest] Second party ${secondPartyId} released — next in queue: suggestion ${nextInQueue.id}`);
        // The matchmaker will see this in their dashboard and can proceed to PENDING_SECOND_PARTY
      }

      // Also release contested flags on remaining PENDING_FIRST_PARTY suggestions
      await prisma.matchSuggestion.updateMany({
        where: {
          secondPartyId,
          id: { not: suggestion.id },
          status: 'PENDING_FIRST_PARTY',
          isAutoSuggestion: true,
          secondPartyContested: true,
        },
        data: {
          secondPartyContested: false,
          secondPartyContestedAt: null,
          // Restore original deadline if it was shortened
        },
      });
    }
  } catch (error) {
    // Non-critical — log and continue (don't fail the status transition)
    console.error('[Contest] Error handling second party contest:', error);
  }
}