// src/app/api/cron/daily-suggestions/route.ts
// =============================================================================
// NeshamaTech - Daily Auto-Suggestions Cron Endpoint
// Called by Heroku Scheduler every day at 17:00 UTC (19:00 IST)
// Also callable from matchmaker dashboard button
// =============================================================================
// 🆕 Fire-and-forget pattern: returns immediately, runs in background.
//    Stores run status in DailySuggestionRun table for tracking.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { DailySuggestionOrchestrator } from '@/lib/engagement/DailySuggestionOrchestrator';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// =============================================================================
// In-memory tracking for the current run (single-dyno safe)
// =============================================================================

interface RunStatus {
  id: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  triggeredBy: string;
  summary?: {
    processed: number;
    newSuggestionsSent: number;
    remindersSent: number;
    skipped: number;
    errors: number;
  };
  error?: string;
}

let currentRun: RunStatus | null = null;

// =============================================================================
// POST - Trigger daily suggestions (fire-and-forget)
// =============================================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authentication - accept either CRON_SECRET or matchmaker session
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    let triggeredBy = 'cron';
    let matchmakerId: string | null = null;

    if (authHeader === `Bearer ${cronSecret}`) {
      // Cron/Heroku Scheduler call
      triggeredBy = 'heroku-scheduler';
    } else {
      // Try session auth (matchmaker dashboard)
      const { getServerSession } = await import('next-auth');
      const { authOptions } = await import('@/lib/auth');
      const session = await getServerSession(authOptions);

      if (!session?.user?.id) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true },
      });

      if (!user || (user.role !== 'MATCHMAKER' && user.role !== 'ADMIN')) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }

      matchmakerId = user.id;
      triggeredBy = `matchmaker:${user.id}`;
    }

    // 2. Check if already running
    if (currentRun?.status === 'running') {
      return NextResponse.json({
        success: false,
        error: 'already_running',
        message: 'שליחת הצעות כבר רצה ברקע',
        runId: currentRun.id,
        startedAt: currentRun.startedAt.toISOString(),
      }, { status: 409 });
    }

    // 3. Find matchmaker to assign
    if (!matchmakerId) {
      const cronMatchmaker = await prisma.user.findFirst({
        where: { role: { in: ['ADMIN', 'MATCHMAKER'] }, status: 'ACTIVE' },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });

      if (!cronMatchmaker) {
        return NextResponse.json(
          { success: false, error: 'No active matchmaker/admin found' },
          { status: 500 }
        );
      }
      matchmakerId = cronMatchmaker.id;
    }

    // 4. Parse optional body
    const body = await req.json().catch(() => ({}));
    const isDryRun = body?.dryRun === true;

    if (isDryRun) {
      return NextResponse.json({
        success: true,
        mode: 'dry_run',
        message: 'Dry run - no actions taken',
      });
    }

    // 5. Create run record and return immediately
    const runId = `run_${Date.now()}`;
    currentRun = {
      id: runId,
      status: 'running',
      startedAt: new Date(),
      triggeredBy,
    };

    console.log(`\n🚀 [Daily Suggestions] Fire-and-forget started: ${runId} (by ${triggeredBy})\n`);

    // 6. Fire-and-forget: start the actual work WITHOUT awaiting
    const finalMatchmakerId = matchmakerId;
    void (async () => {
      try {
        const result = await DailySuggestionOrchestrator.runDailySuggestions(finalMatchmakerId);

        currentRun = {
          ...currentRun!,
          status: 'completed',
          completedAt: new Date(),
          summary: {
            processed: result.processed,
            newSuggestionsSent: result.newSuggestionsSent,
            remindersSent: result.remindersSent,
            skipped: result.skipped,
            errors: result.errors,
          },
        };

        console.log(`\n✅ [Daily Suggestions] Run ${runId} completed: ${result.newSuggestionsSent} sent, ${result.errors} errors\n`);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        currentRun = {
          ...currentRun!,
          status: 'failed',
          completedAt: new Date(),
          error: errMsg,
        };

        console.error(`\n❌ [Daily Suggestions] Run ${runId} failed: ${errMsg}\n`);
      }
    })();

    // 7. Return immediately with runId
    return NextResponse.json({
      success: true,
      mode: 'background',
      runId,
      triggeredBy,
      message: 'שליחת הצעות התחילה ברקע',
      statusUrl: `/api/cron/daily-suggestions?runId=${runId}`,
    });

  } catch (error) {
    console.error('[Daily Suggestions Cron] Fatal error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET - Check run status / health check
// =============================================================================

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Allow both cron secret and session auth
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  let authorized = false;

  if (authHeader === `Bearer ${cronSecret}`) {
    authorized = true;
  } else {
    try {
      const { getServerSession } = await import('next-auth');
      const { authOptions } = await import('@/lib/auth');
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { role: true },
        });
        if (user && (user.role === 'MATCHMAKER' || user.role === 'ADMIN')) {
          authorized = true;
        }
      }
     } catch (error) {
  // Session auth failed - this is expected for cron/unauthenticated requests
  console.debug('[Daily Suggestions] Session auth failed (expected for cron):', 
    error instanceof Error ? error.message : 'Unknown error'
  );
}
  }

  if (!authorized) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const runId = searchParams.get('runId');

  // If asking for a specific run
  if (runId && currentRun?.id === runId) {
    const durationMs = currentRun.completedAt
      ? currentRun.completedAt.getTime() - currentRun.startedAt.getTime()
      : Date.now() - currentRun.startedAt.getTime();

    return NextResponse.json({
      success: true,
      run: {
        ...currentRun,
        durationMs,
        durationFormatted: `${Math.round(durationMs / 1000)}s`,
      },
    });
  }

  // General status
  return NextResponse.json({
    success: true,
    endpoint: 'daily-suggestions',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    currentRun: currentRun ? {
      id: currentRun.id,
      status: currentRun.status,
      startedAt: currentRun.startedAt.toISOString(),
      completedAt: currentRun.completedAt?.toISOString(),
      triggeredBy: currentRun.triggeredBy,
      summary: currentRun.summary,
      error: currentRun.error,
    } : null,
  });
}