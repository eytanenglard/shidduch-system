// src/app/api/matchmaker/daily-suggestions/route.ts
// =============================================================================
// NeshamaTech - Matchmaker API for Daily Suggestions
// מאפשר לשדכן להריץ הצעות יומיות ידנית ולצפות בתוצאות
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { DailySuggestionOrchestrator } from '@/lib/engagement/DailySuggestionOrchestrator';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// =============================================================================
// POST - הרצה ידנית של הצעות יומיות
// =============================================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // 1. Authentication - verify matchmaker/admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== 'MATCHMAKER' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - matchmaker or admin role required' },
        { status: 403 }
      );
    }

    // 2. Parse body
    const body = await req.json().catch(() => ({}));
    const { userId, count } = body as { userId?: string; count?: number };

    // ===== Personal Mode: specific user =====
    if (userId) {
      const suggestionCount = Math.min(Math.max(count || 1, 1), 10); // clamp 1-10
      console.log(`[Daily Suggestions] Personal mode: user=${userId}, count=${suggestionCount}, triggered by ${session.user.id}`);

      const result = await DailySuggestionOrchestrator.runForSpecificUser(userId, suggestionCount, session.user.id);
      const durationMs = Date.now() - startTime;

      return NextResponse.json({
        success: result.success,
        mode: 'personal',
        triggeredBy: session.user.id,
        durationMs,
        durationFormatted: `${Math.round(durationMs / 1000)}s`,
        result,
      });
    }

    // ===== Batch Mode: all eligible users =====
    console.log(`[Daily Suggestions] Batch run triggered by ${session.user.id}`);
    
    const result = await DailySuggestionOrchestrator.runDailySuggestions(session.user.id);

    const durationMs = Date.now() - startTime;

    // 3. Return results with full details (for matchmaker view)
    return NextResponse.json({
      success: true,
      triggeredBy: session.user.id,
      durationMs,
      durationFormatted: `${Math.round(durationMs / 1000)}s`,
      summary: {
        processed: result.processed,
        newSuggestionsSent: result.newSuggestionsSent,
        remindersSent: result.remindersSent,
        skipped: result.skipped,
        errors: result.errors,
      },
      details: result.details,
    });

  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error('[Daily Suggestions] Manual run error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        durationMs,
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET - שליפת הצעות יומיות שנשלחו היום (ו/או בטווח תאריכים)
// =============================================================================

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== 'MATCHMAKER' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // 2. Parse query params
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date'); // YYYY-MM-DD or 'today'
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 100;

    // Determine date range
    let startDate: Date;
    let endDate: Date;

    if (dateParam && dateParam !== 'today') {
      startDate = new Date(dateParam);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(dateParam);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default: today
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    }

    // 3. Fetch suggestions marked as auto-suggestions in date range
    const suggestions = await prisma.matchSuggestion.findMany({
      where: {
        isAutoSuggestion: true,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        firstParty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            language: true,
            profile: {
              select: {
                gender: true,
                birthDate: true,
                city: true,
                religiousLevel: true,
                availabilityStatus: true,
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
            phone: true,
            language: true,
            profile: {
              select: {
                gender: true,
                birthDate: true,
                city: true,
                religiousLevel: true,
                availabilityStatus: true,
              },
            },
            images: {
              where: { isMain: true },
              select: { url: true },
              take: 1,
            },
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // 4. Get stats summary
    const totalToday = suggestions.length;
    const pendingCount = suggestions.filter(
      (s) => s.status === 'PENDING_FIRST_PARTY' || s.status === 'PENDING_SECOND_PARTY'
    ).length;
    const approvedCount = suggestions.filter(
      (s) => s.status === 'FIRST_PARTY_APPROVED' || s.status === 'SECOND_PARTY_APPROVED'
    ).length;
    const declinedCount = suggestions.filter(
      (s) => s.status === 'FIRST_PARTY_DECLINED' || s.status === 'SECOND_PARTY_DECLINED'
    ).length;

    // 5. Get all-time system suggestions stats
    const allTimeCount = await prisma.matchSuggestion.count({
      where: { isAutoSuggestion: true },
    });

    const allTimeApproved = await prisma.matchSuggestion.count({
      where: {
        isAutoSuggestion: true,
        status: {
          in: [
            'FIRST_PARTY_APPROVED',
            'SECOND_PARTY_APPROVED',
            'AWAITING_MATCHMAKER_APPROVAL',
            'CONTACT_DETAILS_SHARED',
            'MATCH_APPROVED',
            'DATING',
            'ENGAGED',
          ],
        },
      },
    });

    return NextResponse.json({
      success: true,
      date: dateParam || 'today',
      stats: {
        totalToday,
        pending: pendingCount,
        approved: approvedCount,
        declined: declinedCount,
        allTimeTotal: allTimeCount,
        allTimeApproved,
        acceptanceRate: allTimeCount > 0 
          ? Math.round((allTimeApproved / allTimeCount) * 100) 
          : 0,
      },
      suggestions: suggestions.map((s) => ({
        id: s.id,
        status: s.status,
        createdAt: s.createdAt,
        decisionDeadline: s.decisionDeadline,
        matchingReason: s.matchingReason,
        internalNotes: s.internalNotes,
        lastActivity: s.lastActivity,
        firstParty: {
          id: s.firstParty.id,
          name: `${s.firstParty.firstName} ${s.firstParty.lastName}`,
          email: s.firstParty.email,
          phone: s.firstParty.phone,
          gender: s.firstParty.profile?.gender,
          city: s.firstParty.profile?.city,
          religiousLevel: s.firstParty.profile?.religiousLevel,
          mainImage: s.firstParty.images[0]?.url || null,
          birthDate: s.firstParty.profile?.birthDate,
        },
        secondParty: {
          id: s.secondParty.id,
          name: `${s.secondParty.firstName} ${s.secondParty.lastName}`,
          email: s.secondParty.email,
          phone: s.secondParty.phone,
          gender: s.secondParty.profile?.gender,
          city: s.secondParty.profile?.city,
          religiousLevel: s.secondParty.profile?.religiousLevel,
          mainImage: s.secondParty.images[0]?.url || null,
          birthDate: s.secondParty.profile?.birthDate,
        },
        statusHistory: s.statusHistory,
      })),
    });

  } catch (error) {
    console.error('[Daily Suggestions GET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}