// src/scripts/runSmartEngagement.ts

import 'dotenv/config';
import { SmartEngagementOrchestrator } from '../lib/engagement/SmartEngagementOrchestrator';
import db from '../lib/prisma';

/**
 * 🤖 סקריפט לריצה יומית של מערכת ה-Engagement החכמה
 * 
 * שימוש:
 * 1. הרץ ידנית: `npm run engagement:daily`
 * 2. Heroku Scheduler: Daily at 09:00 UTC
 */

// =============== קונפיגורציה ===============

const CONFIG = {
  runInDev: process.env.RUN_ENGAGEMENT_IN_DEV === 'true',
  maxRuntime: 10 * 60 * 1000, // 10 דקות
  notifyOnError: process.env.NOTIFY_ON_ERROR === 'true',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@neshamatech.com',
};

// =============== פונקציות עזר ===============

function shouldRun(): boolean {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isProduction) return true;
  
  if (isDevelopment && CONFIG.runInDev) {
    console.log('⚠️  Running in DEVELOPMENT mode');
    return true;
  }
  
  console.log('❌ Skipping - not in production and dev mode not enabled');
  return false;
}

function createTimeout(): NodeJS.Timeout {
  return setTimeout(() => {
    console.error('⏱️  TIMEOUT: Script exceeded maximum runtime. Forcing exit.');
    process.exit(1);
  }, CONFIG.maxRuntime);
}

async function notifyAdminOnError(error: Error, context: string) {
  if (!CONFIG.notifyOnError) return;
  
  try {
    // TODO: implement email notification
    console.log(`📧 Would send admin notification about: ${context}`);
    console.log(`   Error: ${error.message}`);
  } catch (notifyError) {
    console.error('Failed to send admin notification:', notifyError);
  }
}

// =============== הפונקציה הראשית ===============

async function main() {
  const startTime = new Date();
  
  console.log('\n========================================');
  console.log('🚀 Smart Engagement Campaign Starting');
  console.log('========================================');
  console.log(`📅 Date: ${startTime.toLocaleString('he-IL')}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log('========================================\n');
  
  if (!shouldRun()) {
    console.log('✋ Exiting without running campaign');
    return;
  }
  
  const timeoutHandle = createTimeout();
  
  try {
    await db.$connect();
    console.log('✅ Database connected successfully\n');
    
    console.log('🔄 Starting campaign orchestrator...\n');
    const results = await SmartEngagementOrchestrator.runDailyCampaign();
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    console.log('\n========================================');
    console.log('✅ Campaign Completed Successfully!');
    console.log('========================================');
    console.log(`📊 Users Processed: ${results.processed}`);
    console.log(`📧 Emails Sent: ${results.sent}`);
    console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`🎯 Success Rate: ${results.processed > 0 ? ((results.sent / results.processed) * 100).toFixed(1) : 0}%`);
    console.log('========================================\n');
    
    process.exit(0);
    
  } catch (error) {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    console.error('\n========================================');
    console.error('❌ Campaign Failed!');
    console.error('========================================');
    
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
      console.error('\nStack Trace:');
      console.error(error.stack);
    } else {
      console.error('Unknown error:', error);
    }
    
    console.error('========================================\n');
    
    await notifyAdminOnError(
      error instanceof Error ? error : new Error(String(error)),
      'Smart Engagement Campaign'
    );
    
    process.exit(1);
    
  } finally {
    clearTimeout(timeoutHandle);
    
    try {
      await db.$disconnect();
      console.log('🔌 Database disconnected');
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError);
    }
  }
}

// =============== הרצת הסקריפט ===============

main().catch((error) => {
  console.error('💥 Unhandled error in main:', error);
  process.exit(1);
});