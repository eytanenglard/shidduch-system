// src/app/api/ai-chat/discovery-greeting/route.ts
// =============================================================================
// Generate a discovery greeting question for the smart assistant
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AiChatService } from '@/lib/services/aiChatService';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const locale = (req.nextUrl.searchParams.get('locale') as 'he' | 'en') || 'he';
    const greeting = await AiChatService.generateDiscoveryGreeting(session.user.id, locale);

    return NextResponse.json({ success: true, greeting });
  } catch (error) {
    console.error('[AiChat DiscoveryGreeting] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    );
  }
}
