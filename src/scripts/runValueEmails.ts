// src/scripts/runValueEmails.ts
//
// 🌟 סקריפט לשליחת מיילי ערך לכל היוזרים
//
// שימוש:
//   npm run engagement:value           (מריץ קמפיין רגיל)
//   npm run engagement:value -- --test <userId>  (שולח מייל בדיקה ליוזר ספציפי)
//
// Heroku Scheduler: כל 3 ימים, 10:00 UTC (12:00 ישראל)

import 'dotenv/config';
import { ValueEmailOrchestrator } from '../lib/engagement/ValueEmailOrchestrator';
import db from '../lib/prisma';

// ─── Config ───────────────────────────────────────────────────────────────────

const CONFIG = {
  runInDev: process.env.RUN_ENGAGEMENT_IN_DEV === 'true',
  maxRuntime: 15 * 60 * 1000, // 15 minutes
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shouldRun(): boolean {
  if (process.env.NODE_ENV === 'production') return true;
  if (process.env.NODE_ENV === 'development' && CONFIG.runInDev) {
    console.log('⚠️  Running in DEVELOPMENT mode (RUN_ENGAGEMENT_IN_DEV=true)');
    return true;
  }
  console.log('❌ Skipping — not in production. Set RUN_ENGAGEMENT_IN_DEV=true to run locally.');
  return false;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const testIndex = args.indexOf('--test');
  const testUserId = testIndex !== -1 ? args[testIndex + 1] : null;

  const startTime = new Date();

  console.log('\n========================================');
  console.log('🌟 Value Email Campaign Starting');
  console.log('========================================');
  console.log(`📅 Date: ${startTime.toLocaleString('he-IL')}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  if (testUserId) console.log(`🧪 Test mode: userId = ${testUserId}`);
  console.log('========================================\n');

  if (!testUserId && !shouldRun()) {
    console.log('✋ Exiting without running campaign');
    return;
  }

  const timeout = setTimeout(() => {
    console.error('⏱️  TIMEOUT: Script exceeded maximum runtime. Forcing exit.');
    process.exit(1);
  }, CONFIG.maxRuntime);

  try {
    await db.$connect();
    console.log('✅ Database connected\n');

    let results: { processed: number; sent: number };

    if (testUserId) {
      console.log(`🧪 Sending test value email to user: ${testUserId}`);
      const sent = await ValueEmailOrchestrator.sendTestToUser(testUserId);
      results = { processed: 1, sent: sent ? 1 : 0 };
    } else {
      results = await ValueEmailOrchestrator.runValueCampaign();
    }

    const duration = new Date().getTime() - startTime.getTime();

    console.log('\n========================================');
    console.log('✅ Value Campaign Completed!');
    console.log('========================================');
    console.log(`📊 Processed: ${results.processed}`);
    console.log(`📧 Sent:      ${results.sent}`);
    console.log(`⏱️  Duration:  ${(duration / 1000).toFixed(2)}s`);
    if (results.processed > 0) {
      console.log(`🎯 Rate:      ${((results.sent / results.processed) * 100).toFixed(1)}%`);
    }
    console.log('========================================\n');

    process.exit(0);

  } catch (error) {
    console.error('\n========================================');
    console.error('❌ Value Campaign Failed!');
    console.error('========================================');
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
      console.error(error.stack);
    } else {
      console.error('Unknown error:', error);
    }
    console.error('========================================\n');
    process.exit(1);

  } finally {
    clearTimeout(timeout);
    try {
      await db.$disconnect();
      console.log('🔌 Database disconnected');
    } catch (_e) {
      // ignore disconnect errors
    }
  }
}

main().catch((err) => {
  console.error('💥 Unhandled error:', err);
  process.exit(1);
});
