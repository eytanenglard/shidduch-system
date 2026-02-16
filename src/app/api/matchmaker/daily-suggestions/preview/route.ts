// src/app/api/matchmaker/daily-suggestions/preview/route.ts
// =============================================================================
// NeshamaTech - Daily Suggestions Preview API
// GET  → הכן תצוגה מקדימה של הצעות לכל היוזרים (לא שומר ב-DB)
// POST → שלח הצעות שאושרו ע"י השדכן
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { DailySuggestionOrchestrator } from '@/lib/engagement/DailySuggestionOrchestrator';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// =============================================================================
// Auth helper
// =============================================================================

async function verifyMatchmaker() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!user || (user.role !== 'MATCHMAKER' && user.role !== 'ADMIN')) return null;
  return user;
}

// =============================================================================
// GET - Generate preview (no DB writes)
// =============================================================================

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const matchmaker = await verifyMatchmaker();
    if (!matchmaker) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const preview = await DailySuggestionOrchestrator.generatePreview();

    return NextResponse.json({
      success: true,
      ...preview,
    });
  } catch (error) {
    console.error('[Preview GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Send approved suggestions
// Body: { assignments: [{ userId, matchId }] }
// =============================================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const matchmaker = await verifyMatchmaker();
    if (!matchmaker) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { assignments } = body as { assignments: { userId: string; matchId: string }[] };

    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json(
        { success: false, error: 'assignments array is required' },
        { status: 400 }
      );
    }

    const result = await DailySuggestionOrchestrator.sendApprovedSuggestions(
      assignments,
      matchmaker.id
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Preview POST] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}