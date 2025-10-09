// src/scripts/runEveningEngagement.ts

import 'dotenv/config';
import { SmartEngagementOrchestrator } from '../lib/engagement/SmartEngagementOrchestrator';
import db from '../lib/prisma';

/**
 * 🌙 סקריפט לריצת קמפיין ערב - פידבק על פעילות יומית
 * 
 * שימוש:
 * 1. הרץ ידנית: `npm run engagement:evening`
 * 2. Heroku Scheduler: Daily at 17:00 UTC (19:00 Israel)
 */

async function main() {
  const startTime = new Date();
  
  console.log('\n========================================');
  console.log('🌙 Evening Feedback Campaign Starting');
  console.log('========================================');
  console.log(`📅 Date: ${startTime.toLocaleString('he-IL')}`);
  console.log('========================================\n');
  
  try {
    await db.$connect();
    console.log('✅ Database connected\n');
    
    console.log('🔄 Starting evening campaign...\n');
    const results = await SmartEngagementOrchestrator.runEveningCampaign();
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    console.log('\n========================================');
    console.log('✅ Evening Campaign Completed!');
    console.log('========================================');
    console.log(`📊 Active Users Today: ${results.processed}`);
    console.log(`📧 Evening Emails Sent: ${results.sent}`);
    console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log('========================================\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n========================================');
    console.error('❌ Evening Campaign Failed!');
    console.error('========================================');
    
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
      console.error(error.stack);
    }
    
    console.error('========================================\n');
    process.exit(1);
    
  } finally {
    try {
      await db.$disconnect();
      console.log('🔌 Database disconnected');
    } catch (err) {
      console.error('Error disconnecting:', err);
    }
  }
}

main().catch((error) => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});