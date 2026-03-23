// src/app/api/cron/value-emails/route.ts
// =============================================================================
// NeshamaTech - Value Emails Cron Endpoint
// Called by Heroku Scheduler daily, but only runs on Monday (1) and Thursday (4)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { ValueEmailOrchestrator } from '@/lib/engagement/ValueEmailOrchestrator';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authentication
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Day-of-week check: value emails only on Monday (1) and Thursday (4)
    const dayOfWeek = new Date().getUTCDay();
    const isValueEmailDay = dayOfWeek === 1 || dayOfWeek === 4;

    if (!isValueEmailDay) {
      console.log(`[Value Emails] Skipped: not a value email day (day=${dayOfWeek}, Monday=1/Thursday=4 only)`);
      return NextResponse.json({
        success: true,
        mode: 'skipped',
        message: 'Not a value email day (Monday/Thursday only)',
        dayOfWeek,
      });
    }

    // 3. Run the value email campaign
    console.log(`\n🚀 [Value Emails] Starting value email campaign...\n`);
    const result = await ValueEmailOrchestrator.runValueCampaign();

    console.log(`\n✅ [Value Emails] Complete: processed=${result.processed}, sent=${result.sent}\n`);

    return NextResponse.json({
      success: true,
      mode: 'completed',
      result,
    });
  } catch (error) {
    console.error('[Value Emails Cron] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
