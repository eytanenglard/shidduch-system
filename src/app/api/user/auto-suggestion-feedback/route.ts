// src/app/api/user/auto-suggestion-feedback/route.ts
// =============================================================================
// NeshamaTech - User Auto-Suggestion Feedback History API
// Returns the user's feedback history for display in the auto-suggestions zone
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AutoSuggestionFeedbackService } from '@/lib/services/autoSuggestionFeedbackService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    const feedbacks = await AutoSuggestionFeedbackService.getFeedbackHistory(
      session.user.id,
      limit,
    );

    return NextResponse.json({ success: true, feedbacks });
  } catch (error) {
    console.error('[Auto-Suggestion Feedback History] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    );
  }
}
