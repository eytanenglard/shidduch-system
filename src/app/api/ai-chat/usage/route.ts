// src/app/api/ai-chat/usage/route.ts
// =============================================================================
// Returns the user's weekly suggestion usage for the Smart Assistant
// =============================================================================

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WeeklyLimitService } from '@/lib/services/weeklyLimitService';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const usage = await WeeklyLimitService.getUsage(session.user.id);

    return NextResponse.json({
      success: true,
      ...usage,
    });
  } catch (error) {
    console.error('[AiChat Usage] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    );
  }
}
