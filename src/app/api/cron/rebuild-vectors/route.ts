// ============================================================
// NeshamaTech - Cron: Rebuild Stale Vectors
// src/app/api/cron/rebuild-vectors/route.ts
// ============================================================
// Called by Heroku Scheduler daily at 02:00 UTC (1 hour before
// the nightly scan) so all vectors are fresh before scanning.
//
// Heroku Scheduler command:
//   curl -X POST $NEXT_PUBLIC_APP_URL/api/cron/rebuild-vectors \
//     -H "Authorization: Bearer $CRON_SECRET" \
//     -H "Content-Type: application/json"
//
// Optional body params:
//   dryRun: true     — preview count without rebuilding
//   maxProfiles: 50  — cap how many profiles to process (default 50)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { findAllStaleProfiles, runRebuild } from '@/lib/services/vectorRebuildService';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // Auth — CRON_SECRET only (no session auth for scheduled jobs)
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const isDryRun = body?.dryRun === true;
  const maxProfiles: number = body?.maxProfiles ?? 50;

  const staleProfiles = await findAllStaleProfiles();
  const missingCount = staleProfiles.filter(p => p.reason === 'missing').length;
  const staleCount   = staleProfiles.filter(p => p.reason === 'stale').length;

  console.log(`[CronRebuild] Found ${staleProfiles.length} stale profiles (${missingCount} missing, ${staleCount} stale). Limit: ${maxProfiles}`);

  if (isDryRun) {
    return NextResponse.json({
      success: true,
      mode: 'dry_run',
      total: staleProfiles.length,
      wouldProcess: Math.min(staleProfiles.length, maxProfiles),
      missing: missingCount,
      stale: staleCount,
    });
  }

  const limited = staleProfiles.slice(0, maxProfiles);
  const result = await runRebuild(limited);

  return NextResponse.json({
    success: true,
    durationMs: Date.now() - startTime,
    totalStale: staleProfiles.length,
    processed: limited.length,
    remaining: Math.max(0, staleProfiles.length - maxProfiles),
    rebuilt: result.success,
    failed: result.failed,
  });
}

// Health-check
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ success: true, endpoint: 'rebuild-vectors', status: 'healthy' });
}
