// src/app/api/matchmaker/daily-suggestions/rollback/route.ts
// =============================================================================
// V4.0: Rollback an auto-suggestion — cancel it and restore PotentialMatch
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== 'MATCHMAKER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { suggestionId } = body as { suggestionId: string };

    if (!suggestionId) {
      return NextResponse.json(
        { success: false, error: 'suggestionId is required' },
        { status: 400 }
      );
    }

    // Load the suggestion
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      select: {
        id: true,
        status: true,
        isAutoSuggestion: true,
        internalNotes: true,
        firstPartyId: true,
        secondPartyId: true,
      },
    });

    if (!suggestion) {
      return NextResponse.json(
        { success: false, error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    // Verify it's rollback-eligible
    const ROLLBACK_ELIGIBLE = ['DRAFT', 'PENDING_FIRST_PARTY', 'PENDING_SECOND_PARTY'];
    if (!ROLLBACK_ELIGIBLE.includes(suggestion.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot rollback — status is ${suggestion.status}` },
        { status: 400 }
      );
    }

    // Extract PotentialMatch ID from internalNotes (format: "...PotentialMatch: <id>...")
    let potentialMatchId: string | null = null;
    if (suggestion.internalNotes) {
      const match = suggestion.internalNotes.match(/PotentialMatch:\s*(\S+)/);
      if (match) potentialMatchId = match[1];
    }

    // Also try to find by sentAt + suggestionId relation
    if (!potentialMatchId) {
      const pm = await prisma.potentialMatch.findFirst({
        where: {
          suggestionId: suggestionId,
        },
        select: { id: true },
      });
      if (pm) potentialMatchId = pm.id;
    }

    // Transaction: cancel suggestion + restore PotentialMatch
    await prisma.$transaction(async (tx) => {
      // 1. Cancel the suggestion
      await tx.matchSuggestion.update({
        where: { id: suggestionId },
        data: {
          status: 'CANCELLED',
          previousStatus: suggestion.status,
          lastStatusChange: new Date(),
          lastActivity: new Date(),
          internalNotes: (suggestion.internalNotes || '') + '\n[ROLLBACK] Cancelled by matchmaker',
        },
      });

      // 2. Add status history
      await tx.suggestionStatusHistory.create({
        data: {
          suggestionId,
          status: 'CANCELLED',
          reason: 'Rollback — הצעה בוטלה על ידי השדכן',
        },
      });

      // 3. Restore PotentialMatch to PENDING
      if (potentialMatchId) {
        await tx.potentialMatch.update({
          where: { id: potentialMatchId },
          data: {
            status: 'PENDING',
            suggestionId: null,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: 'ההצעה בוטלה וההתאמה הוחזרה למאגר',
      restoredPotentialMatchId: potentialMatchId,
    });
  } catch (error) {
    console.error('[Rollback] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
