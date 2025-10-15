// src/app/api/admin/engagement/run-now/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { SmartEngagementOrchestrator } from '@/lib/engagement/SmartEngagementOrchestrator';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🚀 Manual campaign triggered by admin');
    
    const results = await SmartEngagementOrchestrator.runDailyCampaign();
    
    return NextResponse.json({
      success: true,
      processed: results.processed,
      sent: results.sent
    });

  } catch (error) {
    console.error('Error running campaign:', error);
    return NextResponse.json(
      { error: 'Campaign failed' },
      { status: 500 }
    );
  }
}