// src/worker.ts
// 🎯 Worker לעיבוד עבודות חיפוש התאמות ברקע
// רץ כ-Heroku Worker Dyno נפרד

import { matchingQueue, MatchingJobData } from './lib/queue/matchingQueue';
import { PrismaClient } from '@prisma/client';
import { findMatchesForUser } from './lib/services/matchingAlgorithmService';

// יצירת Prisma Client עבור ה-Worker
const prisma = new PrismaClient();

console.log('🚀 [Worker] Starting matching jobs worker...');

// ============================================================================
// JOB PROCESSOR
// ============================================================================

matchingQueue.process(async (job) => {
  const { jobId, targetUserId, matchmakerId, forceRefresh } = job.data as MatchingJobData;
  
  console.log(`[Worker] Processing job ${jobId} for user ${targetUserId}`);
  
  try {
    // עדכן סטטוס ל-PROCESSING
    await prisma.matchingJob.update({
      where: { id: jobId },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
        stage: 'fetching',
        progress: 5,
      },
    });

    // הרץ את האלגוריתם עם callback להתקדמות
    const result = await findMatchesForUser(targetUserId, matchmakerId, {
      forceRefresh: true, // תמיד רענן כי המשתמש ביקש במפורש
      autoSave: true,
      onProgress: async (progress: number, stage: string) => {
        // עדכן התקדמות ב-DB
        await prisma.matchingJob.update({
          where: { id: jobId },
          data: { progress, stage },
        });
        
        // עדכן גם את ה-job ב-Bull (לניטור)
        job.progress(progress);
        
        console.log(`[Worker] Job ${jobId}: ${stage} - ${progress}%`);
      },
    });

    // עדכן סטטוס ל-COMPLETED
    await prisma.matchingJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        progress: 100,
        stage: 'done',
        resultCount: result.matches.length,
      },
    });

    console.log(`[Worker] Job ${jobId} completed. Found ${result.matches.length} matches.`);
    
    return { success: true, matchCount: result.matches.length };

  } catch (error) {
    console.error(`[Worker] Job ${jobId} failed:`, error);
    
    // עדכן סטטוס ל-FAILED
    await prisma.matchingJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    throw error; // זרוק שוב כדי ש-Bull ידע שנכשל
  }
});

// ============================================================================
// EVENT HANDLERS
// ============================================================================

matchingQueue.on('completed', (job, result) => {
  console.log(`[Worker] ✅ Job ${job.id} completed:`, result);
});

matchingQueue.on('failed', (job, err) => {
  console.error(`[Worker] ❌ Job ${job.id} failed:`, err.message);
});

matchingQueue.on('stalled', (job) => {
  console.warn(`[Worker] ⚠️ Job ${job.id} stalled`);
});

matchingQueue.on('error', (error) => {
  console.error('[Worker] Queue error:', error);
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

process.on('SIGTERM', async () => {
  console.log('[Worker] Received SIGTERM. Closing...');
  await matchingQueue.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Worker] Received SIGINT. Closing...');
  await matchingQueue.close();
  await prisma.$disconnect();
  process.exit(0);
});

console.log('[Worker] ✅ Worker is ready and listening for jobs');