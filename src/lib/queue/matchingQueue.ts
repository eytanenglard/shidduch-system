// src/lib/queue/matchingQueue.ts
// 🎯 Bull Queue Setup for Background Matching Jobs

import Queue from 'bull';

// Redis URL from Heroku (REDIS_URL is automatically set by Heroku Redis addon)
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// יצירת התור
export const matchingQueue = new Queue('matching-jobs', REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 100,  // שמור 100 עבודות אחרונות שהסתיימו
    removeOnFail: 50,       // שמור 50 עבודות אחרונות שנכשלו
    attempts: 2,            // נסה שוב פעם אחת אם נכשל
    backoff: {
      type: 'exponential',
      delay: 5000,          // התחל עם 5 שניות
    },
  },
  settings: {
    lockDuration: 600000,   // 10 דקות - מספיק זמן לאלגוריתם
    stalledInterval: 60000, // בדוק עבודות תקועות כל דקה
  },
});

// טיפוס לנתוני העבודה
export interface MatchingJobData {
  jobId: string;           // ID ב-DB
  targetUserId: string;
  matchmakerId: string;
  forceRefresh: boolean;
}

// פונקציה להוספת עבודה לתור
export async function addMatchingJob(data: MatchingJobData): Promise<void> {
  await matchingQueue.add(data, {
    jobId: data.jobId,  // משתמשים ב-jobId מה-DB כ-ID של העבודה בתור
  });
  console.log(`[Queue] Added matching job ${data.jobId} to queue`);
}

// ניקוי התור (לשימוש בטסטים או מחיקה ידנית)
export async function clearQueue(): Promise<void> {
  await matchingQueue.empty();
  await matchingQueue.clean(0, 'completed');
  await matchingQueue.clean(0, 'failed');
  console.log('[Queue] Cleared matching queue');
}

// סטטיסטיקות התור
export async function getQueueStats() {
  const [waiting, active, completed, failed] = await Promise.all([
    matchingQueue.getWaitingCount(),
    matchingQueue.getActiveCount(),
    matchingQueue.getCompletedCount(),
    matchingQueue.getFailedCount(),
  ]);
  
  return { waiting, active, completed, failed };
}

export default matchingQueue;