// src/app/api/admin/engagement/run-evening/route.ts

import { NextResponse } from 'next/server';
import { SmartEngagementOrchestrator } from '@/lib/engagement/SmartEngagementOrchestrator';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * 🌙 Evening Feedback Campaign Runner
 * 
 * מריץ קמפיין ערב - שולח פידבק למשתמשים שהיו פעילים היום
 * רק משתמש ADMIN יכול להריץ את הקמפיין הזה
 */
export async function POST() {
  const timestamp = new Date().toISOString();
  
  try {
    // אימות והרשאות
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      console.warn(`[${timestamp}] Unauthorized evening campaign attempt`);
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    console.log(`[${timestamp}] 🌙 Manual evening campaign triggered by admin: ${session.user.id}`);
    console.log('========================================');
    console.log('🌙 EVENING FEEDBACK CAMPAIGN - MANUAL RUN');
    console.log('========================================');
    
    // הרצת הקמפיין
    const results = await SmartEngagementOrchestrator.runEveningCampaign();
    
    console.log('========================================');
    console.log(`✅ Evening campaign completed successfully`);
    console.log(`📊 Results: Processed ${results.processed} users, Sent ${results.sent} emails`);
    console.log('========================================');
    
    return NextResponse.json({
      success: true,
      processed: results.processed,
      sent: results.sent,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('========================================');
    console.error('❌ Evening campaign failed!');
    console.error('========================================');
    
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
      console.error(error.stack);
    } else {
      console.error('Unknown error:', error);
    }
    
    console.error('========================================');
    
    return NextResponse.json(
      { 
        error: 'Evening campaign failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}