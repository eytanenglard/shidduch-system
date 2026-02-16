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

    // Parse filter query params
    const { searchParams } = new URL(req.url);
    const filters: Record<string, any> = {};

    const gender = searchParams.get('gender');
    if (gender === 'MALE' || gender === 'FEMALE') filters.gender = gender;

    const searchName = searchParams.get('searchName');
    if (searchName) filters.searchName = searchName;

    const noSuggestionDays = searchParams.get('noSuggestionDays');
    if (noSuggestionDays) filters.noSuggestionDays = parseInt(noSuggestionDays, 10);

    const limit = searchParams.get('limit');
    if (limit) filters.limit = parseInt(limit, 10);

    const userIds = searchParams.get('userIds');
    if (userIds) filters.userIds = userIds.split(',');

    const sortBy = searchParams.get('sortBy');
    if (sortBy) filters.sortBy = sortBy;

    const preview = await DailySuggestionOrchestrator.generatePreview(
      Object.keys(filters).length > 0 ? filters : undefined
    );

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
    const { assignments } = body as { assignments: { userId: string; matchId: string; customMatchingReason?: string }[] };

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