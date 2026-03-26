// src/app/api/ai-chat/candidate-profile/route.ts
// =============================================================================
// Fetch candidate profile data for display inside AI chat
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

    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const data = await AiChatService.getCandidateProfileForChat(userId, session.user.id);

    if (!data) {
      return NextResponse.json(
        { error: 'Candidate not found or not authorized' },
        { status: 404 },
      );
    }

    // Strip sensitive fields
    const { profile, images, questionnaire, isProfileComplete } = data;
    const safeProfile = { ...profile };
    delete (safeProfile as Record<string, unknown>).phone;
    delete (safeProfile as Record<string, unknown>).email;

    return NextResponse.json({
      success: true,
      profile: safeProfile,
      images,
      questionnaire,
      isProfileComplete,
    });
  } catch (error) {
    console.error('[AiChat CandidateProfile] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    );
  }
}
