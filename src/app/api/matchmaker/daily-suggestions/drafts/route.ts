// src/app/api/matchmaker/daily-suggestions/drafts/route.ts
// =============================================================================
// NeshamaTech - Review Mode: Create & Manage Draft Auto-Suggestions
// Matchmaker creates drafts, reviews, then approves or rejects them
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { DailySuggestionOrchestrator } from '@/lib/engagement/DailySuggestionOrchestrator';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// =============================================================================
// POST - Create draft suggestions for matchmaker review
// =============================================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
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

    const body = await req.json().catch(() => ({}));
    const action = body?.action as string;

    // Action: approve — approve selected draft suggestions
    if (action === 'approve') {
      const suggestionIds = body?.suggestionIds as string[];
      if (!suggestionIds?.length) {
        return NextResponse.json({ success: false, error: 'No suggestion IDs provided' }, { status: 400 });
      }

      const result = await DailySuggestionOrchestrator.approveDraftSuggestions(
        suggestionIds,
        session.user.id
      );

      return NextResponse.json({
        success: true,
        action: 'approve',
        ...result,
      });
    }

    // Action: reject — delete selected draft suggestions
    if (action === 'reject') {
      const suggestionIds = body?.suggestionIds as string[];
      if (!suggestionIds?.length) {
        return NextResponse.json({ success: false, error: 'No suggestion IDs provided' }, { status: 400 });
      }

      const deleted = await prisma.matchSuggestion.deleteMany({
        where: {
          id: { in: suggestionIds },
          status: 'DRAFT',
          isAutoSuggestion: true,
        },
      });

      return NextResponse.json({
        success: true,
        action: 'reject',
        deleted: deleted.count,
      });
    }

    // Default action: create drafts
    const result = await DailySuggestionOrchestrator.createDraftSuggestions(session.user.id);

    return NextResponse.json({
      success: true,
      action: 'create',
      ...result,
    });
  } catch (error) {
    console.error('[Drafts] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET - List pending draft suggestions for review
// =============================================================================

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
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

    const drafts = await prisma.matchSuggestion.findMany({
      where: {
        isAutoSuggestion: true,
        status: 'DRAFT',
      },
      include: {
        firstParty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profile: {
              select: {
                gender: true,
                birthDate: true,
                city: true,
                religiousLevel: true,
              },
            },
            images: {
              where: { isMain: true },
              select: { url: true },
              take: 1,
            },
          },
        },
        secondParty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profile: {
              select: {
                gender: true,
                birthDate: true,
                city: true,
                religiousLevel: true,
              },
            },
            images: {
              where: { isMain: true },
              select: { url: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      total: drafts.length,
      drafts: drafts.map((d) => ({
        id: d.id,
        createdAt: d.createdAt,
        matchingReason: d.matchingReason,
        internalNotes: d.internalNotes,
        firstParty: {
          id: d.firstParty.id,
          name: `${d.firstParty.firstName} ${d.firstParty.lastName}`,
          email: d.firstParty.email,
          gender: d.firstParty.profile?.gender,
          city: d.firstParty.profile?.city,
          religiousLevel: d.firstParty.profile?.religiousLevel,
          birthDate: d.firstParty.profile?.birthDate,
          mainImage: d.firstParty.images[0]?.url || null,
        },
        secondParty: {
          id: d.secondParty.id,
          name: `${d.secondParty.firstName} ${d.secondParty.lastName}`,
          email: d.secondParty.email,
          gender: d.secondParty.profile?.gender,
          city: d.secondParty.profile?.city,
          religiousLevel: d.secondParty.profile?.religiousLevel,
          birthDate: d.secondParty.profile?.birthDate,
          mainImage: d.secondParty.images[0]?.url || null,
        },
      })),
    });
  } catch (error) {
    console.error('[Drafts GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
