// src/app/api/cron/daily-suggestions/route.ts
// =============================================================================
// NeshamaTech - Daily Auto-Suggestions Cron Endpoint
// Called by Heroku Scheduler every day at 17:00 UTC (19:00 IST)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { DailySuggestionOrchestrator } from '@/lib/engagement/DailySuggestionOrchestrator';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max (adjust for your plan)

/**
 * POST /api/cron/daily-suggestions
 * 
 * Heroku Scheduler calls this endpoint daily.
 * Protected by CRON_SECRET environment variable.
 * 
 * Usage from Heroku Scheduler:
 *   curl -X POST https://your-app.herokuapp.com/api/cron/daily-suggestions \
 *     -H "Authorization: Bearer $CRON_SECRET" \
 *     -H "Content-Type: application/json"
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // 1. Authentication - verify cron secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[Daily Suggestions Cron] CRON_SECRET environment variable not set');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[Daily Suggestions Cron] Unauthorized access attempt');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Optional: check if dry run
    const body = await req.json().catch(() => ({}));
    const isDryRun = body?.dryRun === true;

    if (isDryRun) {
      console.log('[Daily Suggestions Cron] DRY RUN mode - no suggestions will be sent');
      // In dry run mode, you could add a parameter to the orchestrator
      // For now, just return success
      return NextResponse.json({
        success: true,
        mode: 'dry_run',
        message: 'Dry run - no actions taken',
      });
    }

    // 3. Run the daily suggestion orchestrator
    console.log('[Daily Suggestions Cron] Starting daily suggestion run...');
    
const cronMatchmaker = await prisma.user.findFirst({
  where: { role: { in: ['ADMIN', 'MATCHMAKER'] }, status: 'ACTIVE' },
  select: { id: true },
  orderBy: { createdAt: 'asc' },
});
if (!cronMatchmaker) {
  return NextResponse.json({ success: false, error: 'No matchmaker found' }, { status: 500 });
}
const result = await DailySuggestionOrchestrator.runDailySuggestions(cronMatchmaker.id);
    const durationMs = Date.now() - startTime;

    // 4. Return results
    return NextResponse.json({
      success: true,
      durationMs,
      durationFormatted: `${Math.round(durationMs / 1000)}s`,
      summary: {
        processed: result.processed,
        newSuggestionsSent: result.newSuggestionsSent,
        remindersSent: result.remindersSent,
        skipped: result.skipped,
        errors: result.errors,
      },
      // Don't include full details in response for privacy/size, but log them
    });

  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error('[Daily Suggestions Cron] Fatal error:', error);

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

/**
 * GET /api/cron/daily-suggestions
 * 
 * Health check / status endpoint.
 * Can be used to verify the endpoint is accessible.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    endpoint: 'daily-suggestions',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
}