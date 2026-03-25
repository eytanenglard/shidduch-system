// src/app/api/cron/daily-suggestions/route.ts
// =============================================================================
// NeshamaTech - Daily Auto-Suggestions Cron Endpoint
// Called by Heroku Scheduler every day at 17:00 UTC (19:00 IST)
// Also callable from matchmaker dashboard button
// =============================================================================
// Fire-and-forget pattern: returns immediately, runs in background.
// Stores run status in DailySuggestionRun table for persistent tracking.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { DailySuggestionOrchestrator } from '@/lib/engagement/DailySuggestionOrchestrator';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

    // 2. Day-of-week check: auto-suggestions only on Sunday (0) and Wednesday (3)
    const dayOfWeek = new Date().getUTCDay();
    const isAutoSuggestionDay = dayOfWeek === 0 || dayOfWeek === 3;

    if (!isAutoSuggestionDay && triggeredBy === 'heroku-scheduler') {
      console.log(`[Daily Suggestions] Skipped: not an auto-suggestion day (day=${dayOfWeek}, Sunday=0/Wednesday=3 only)`);
      return NextResponse.json({
        success: true,
        mode: 'skipped',
        message: 'Not an auto-suggestion day (Sunday/Wednesday only)',
        dayOfWeek,
      });
    }

    // 3. Check if already running (DB-based — survives dyno restarts)
    const activeRun = await prisma.dailySuggestionRun.findFirst({
      where: {
        status: 'running',
        startedAt: { gte: new Date(Date.now() - 30 * 60 * 1000) }, // Only consider runs from last 30 minutes
      },
      select: { id: true, startedAt: true },
    });

    if (activeRun) {
      return NextResponse.json({
        success: false,
        error: 'already_running',
        message: 'שליחת הצעות כבר רצה ברקע',
        runId: activeRun.id,
        startedAt: activeRun.startedAt.toISOString(),
      }, { status: 409 });
    }

    // 4. Find matchmaker to assign
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

    // 5. Parse optional body
    const body = await req.json().catch(() => ({}));
    const isDryRun = body?.dryRun === true;

    if (isDryRun) {
      return NextResponse.json({
        success: true,
        mode: 'dry_run',
        message: 'Dry run - no actions taken',
      });
    }

    // 6. Create persistent run record in DB
    const run = await prisma.dailySuggestionRun.create({
      data: {
        status: 'running',
        triggeredBy,
      },
    });

    console.log(`\n🚀 [Daily Suggestions] Fire-and-forget started: ${run.id} (by ${triggeredBy})\n`);

    // 7. Fire-and-forget: start the actual work WITHOUT awaiting
    const finalMatchmakerId = matchmakerId;
    void (async () => {
      try {
        const result = await DailySuggestionOrchestrator.runDailySuggestions(finalMatchmakerId);

        await prisma.dailySuggestionRun.update({
          where: { id: run.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
            processed: result.processed,
            sent: result.newSuggestionsSent,
            skipped: result.skipped,
            errors: result.errors,
            summary: {
              processed: result.processed,
              newSuggestionsSent: result.newSuggestionsSent,
              remindersSent: result.remindersSent,
              skipped: result.skipped,
              errors: result.errors,
            },
          },
        });

        console.log(`\n✅ [Daily Suggestions] Run ${run.id} completed: ${result.newSuggestionsSent} sent, ${result.errors} errors\n`);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';

        await prisma.dailySuggestionRun.update({
          where: { id: run.id },
          data: {
            status: 'failed',
            completedAt: new Date(),
            error: errMsg,
          },
        }).catch(dbErr => console.error('[Daily Suggestions] Failed to update run record:', dbErr));

        console.error(`\n❌ [Daily Suggestions] Run ${run.id} failed: ${errMsg}\n`);
      }
    })();

    // 8. Return immediately with runId
    return NextResponse.json({
      success: true,
      mode: 'background',
      runId: run.id,
      triggeredBy,
      message: 'שליחת הצעות התחילה ברקע',
      statusUrl: `/api/cron/daily-suggestions?runId=${run.id}`,
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
  if (runId) {
    const run = await prisma.dailySuggestionRun.findUnique({
      where: { id: runId },
    });

    if (!run) {
      return NextResponse.json({ success: false, error: 'Run not found' }, { status: 404 });
    }

    const durationMs = run.completedAt
      ? run.completedAt.getTime() - run.startedAt.getTime()
      : Date.now() - run.startedAt.getTime();

    return NextResponse.json({
      success: true,
      run: {
        ...run,
        durationMs,
        durationFormatted: `${Math.round(durationMs / 1000)}s`,
      },
    });
  }

  // General status — show latest run + recent history
  const [latestRun, recentRuns] = await Promise.all([
    prisma.dailySuggestionRun.findFirst({
      orderBy: { startedAt: 'desc' },
    }),
    prisma.dailySuggestionRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        status: true,
        triggeredBy: true,
        startedAt: true,
        completedAt: true,
        sent: true,
        skipped: true,
        errors: true,
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    endpoint: 'daily-suggestions',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    currentRun: latestRun,
    recentRuns,
  });
}
