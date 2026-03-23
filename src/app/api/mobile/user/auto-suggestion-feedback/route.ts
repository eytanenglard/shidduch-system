// src/app/api/mobile/user/auto-suggestion-feedback/route.ts
// Mobile endpoint for auto-suggestion feedback history

import { NextRequest } from 'next/server';
import { verifyMobileToken, corsJson, corsError, corsOptions } from '@/lib/mobile-auth';
import { AutoSuggestionFeedbackService } from '@/lib/services/autoSuggestionFeedbackService';

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);

    if (!auth) {
      return corsError(req, 'Unauthorized', 401, 'AUTH_REQUIRED');
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    const feedbacks = await AutoSuggestionFeedbackService.getFeedbackHistory(
      auth.userId,
      limit,
    );

    return corsJson(req, { success: true, feedbacks });
  } catch (error) {
    console.error('[Mobile Auto-Suggestion Feedback History] Error:', error);
    return corsError(req, 'Internal error', 500, 'INTERNAL_ERROR');
  }
}
