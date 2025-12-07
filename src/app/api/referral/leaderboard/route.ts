// src/app/api/referral/leaderboard/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard, getActiveCampaign } from '@/lib/services/referralService';
import prisma from '@/lib/prisma'; // 🔴 תיקון: import ישיר

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignSlug = searchParams.get('campaign');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const currentUserCode = searchParams.get('myCode');

    // מצא קמפיין פעיל
    const campaign = await getActiveCampaign(campaignSlug || undefined);
    
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'NO_ACTIVE_CAMPAIGN' },
        { status: 404 }
      );
    }

    // הבא לידרבורד
    const leaderboard = await getLeaderboard(
      campaign.id, 
      limit, 
      currentUserCode || undefined
    );

    // ספור סה"כ משתתפים
    const countResult = await prisma.referrer.aggregate({ // 🔴 תיקון: שימוש ישיר ב-prisma
      where: { campaignId: campaign.id },
      _count: { id: true },
    });

    return NextResponse.json({
      success: true,
      leaderboard,
      totalParticipants: countResult._count.id,
      campaign: {
        name: campaign.name,
        endsAt: campaign.endDate.toISOString(),
      },
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Referral Leaderboard] Error:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}