const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config();

const prisma = new PrismaClient();

// ==========================================
// מיפוי שיטות לשדות
// ==========================================

const METHOD_FIELD_MAP: Record<string, { score: string; reasoning: string; scannedAt: string }> = {
  hybrid: {
    score: 'hybridScore',
    reasoning: 'hybridReasoning',
    scannedAt: 'hybridScannedAt',
  },
  algorithmic: {
    score: 'algorithmicScore',
    reasoning: 'algorithmicReasoning',
    scannedAt: 'algorithmicScannedAt',
  },
  vector: {
    score: 'vectorScore',
    reasoning: 'vectorReasoning',
    scannedAt: 'vectorScannedAt',
  },
  metrics_v2: {
    score: 'metricsV2Score',
    reasoning: 'metricsV2Reasoning',
    scannedAt: 'metricsV2ScannedAt',
  },
  // שיטות ישנות
  ai_deep: {
    score: 'algorithmicScore',
    reasoning: 'algorithmicReasoning',
    scannedAt: 'algorithmicScannedAt',
  },
  deep: {
    score: 'algorithmicScore',
    reasoning: 'algorithmicReasoning',
    scannedAt: 'algorithmicScannedAt',
  },
};

function normalizeMethod(method: string): string {
  const m = method.toLowerCase();
  const map: Record<string, string> = {
    'ai_deep': 'algorithmic',
    'deep': 'algorithmic',
    'ai': 'algorithmic',
    'fast': 'vector',
    'quick': 'vector',
    'similarity': 'vector',
    // 🆕 הוסף את אלה:
    'nightly-scan': 'algorithmic',
    'algorithmic-virtual': 'algorithmic',
    'vector-virtual': 'vector',
  };
  return map[m] || m;
}

// ==========================================
// פונקציה ראשית
// ==========================================

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🔄 עדכון ציונים קיימים לשדות השיטה');
  console.log('='.repeat(60) + '\n');

  // ═══════════════════════════════════════════════════════════
  // שלב 1: בדיקת מצב נוכחי
  // ═══════════════════════════════════════════════════════════
  
  const total = await prisma.potentialMatch.count();
  const withMethod = await prisma.potentialMatch.count({ 
    where: { 
      lastScanMethod: { not: null } 
    } 
  });
  
  console.log(`📊 מצב נוכחי:`);
  console.log(`   סה"כ התאמות: ${total}`);
  console.log(`   עם lastScanMethod: ${withMethod}`);
  console.log(`   ללא lastScanMethod: ${total - withMethod}\n`);

  // ═══════════════════════════════════════════════════════════
  // שלב 2: שליפת MatchingJobs
  // ═══════════════════════════════════════════════════════════

  console.log('📋 בודק MatchingJobs...');
  
  const jobs = await prisma.matchingJob.findMany({
    where: {
      status: 'completed',
    },
    select: {
      id: true,
      targetUserId: true,
      method: true,
      completedAt: true,
    },
    orderBy: { completedAt: 'desc' },
  });

  // סינון רק jobs עם method
  const jobsWithMethod = jobs.filter((j: any) => j.method && j.method.length > 0);
  
  console.log(`   נמצאו ${jobs.length} jobs מוצלחים`);
  console.log(`   מתוכם ${jobsWithMethod.length} עם method מוגדר\n`);

  // ניתוח שיטות
  const methodCounts: Record<string, number> = {};
  jobsWithMethod.forEach((job: any) => {
    const method = job.method || 'unknown';
    methodCounts[method] = (methodCounts[method] || 0) + 1;
  });
  
  console.log('📊 התפלגות שיטות:');
  Object.entries(methodCounts).forEach(([method, count]) => {
    console.log(`   ${method}: ${count} jobs`);
  });
  console.log('');

  // ═══════════════════════════════════════════════════════════
  // שלב 3: יצירת מיפוי userId -> method
  // ═══════════════════════════════════════════════════════════

  console.log('🔄 מעדכן לפי MatchingJobs...\n');

  // מיפוי: userId -> method (האחרון לכל user)
  const userMethodMap = new Map<string, string>();
  for (const job of jobsWithMethod) {
    if (!userMethodMap.has(job.targetUserId) && job.method) {
      userMethodMap.set(job.targetUserId, normalizeMethod(job.method));
    }
  }

  console.log(`   נמצאו ${userMethodMap.size} משתמשים עם jobs\n`);

  // ═══════════════════════════════════════════════════════════
  // שלב 4: עדכון PotentialMatch
  // ═══════════════════════════════════════════════════════════

  let updatedCount = 0;
  let skippedCount = 0;
  let userIndex = 0;

  for (const [userId, method] of userMethodMap) {
    userIndex++;
    
    const fieldMap = METHOD_FIELD_MAP[method];
    if (!fieldMap) {
      console.log(`   ⚠️ שיטה לא מוכרת: ${method}`);
      skippedCount++;
      continue;
    }

    // שליפת כל ההתאמות של המשתמש
    const matches = await prisma.potentialMatch.findMany({
      where: {
        OR: [
          { maleUserId: userId },
          { femaleUserId: userId },
        ],
      },
      select: { 
        id: true, 
        aiScore: true, 
        shortReasoning: true, 
        scannedAt: true,
        lastScanMethod: true,
      },
    });

    for (const match of matches) {
      try {
        // בניית אובייקט עדכון
        const updateData: any = {};
        
        // עדכון השדה הספציפי לשיטה
        updateData[fieldMap.score] = match.aiScore;
        updateData[fieldMap.reasoning] = match.shortReasoning;
        updateData[fieldMap.scannedAt] = match.scannedAt;
        
        // עדכון lastScanMethod רק אם לא קיים
        if (!match.lastScanMethod) {
          updateData.lastScanMethod = method;
        }

        await prisma.potentialMatch.update({
          where: { id: match.id },
          data: updateData,
        });

        updatedCount++;
      } catch (error: any) {
        console.error(`   ❌ שגיאה בעדכון:`, error.message);
      }
    }

// הדפסת התקדמות - כל משתמש
console.log(`   [${userIndex}/${userMethodMap.size}] ${userId.slice(0,8)}... (${method}) - ${matches.length} התאמות`);
  }

  console.log(`\n   ✅ עודכנו ${updatedCount} התאמות לפי jobs`);

  // ═══════════════════════════════════════════════════════════
  // שלב 5: עדכון ברירת מחדל לשאר
  // ═══════════════════════════════════════════════════════════

  console.log('\n🔄 מעדכן התאמות ללא שיטה מוגדרת...');

  // שליפת כל ההתאמות ללא lastScanMethod
  const remaining = await prisma.potentialMatch.findMany({
    where: {
      lastScanMethod: null,
    },
    select: { 
      id: true, 
      aiScore: true, 
      shortReasoning: true, 
      scannedAt: true 
    },
  });

  console.log(`   נמצאו ${remaining.length} התאמות ללא שיטה`);

  let defaultUpdated = 0;
  for (const match of remaining) {
    try {
      await prisma.potentialMatch.update({
        where: { id: match.id },
        data: {
          algorithmicScore: match.aiScore,
          algorithmicReasoning: match.shortReasoning,
          algorithmicScannedAt: match.scannedAt,
          lastScanMethod: 'algorithmic',
        },
      });
      defaultUpdated++;
    } catch (error: any) {
      // skip
    }
  }

  console.log(`   ✅ עודכנו ${defaultUpdated} התאמות לברירת מחדל (algorithmic)`);

  // ═══════════════════════════════════════════════════════════
  // סיכום סופי
  // ═══════════════════════════════════════════════════════════

  console.log('\n' + '='.repeat(60));
  console.log('📊 סיכום סופי:');
  console.log('='.repeat(60));

  const finalStats = await prisma.potentialMatch.groupBy({
    by: ['lastScanMethod'],
    _count: { id: true },
  });

  finalStats.forEach((stat: any) => {
    console.log(`   ${stat.lastScanMethod || 'לא מוגדר'}: ${stat._count.id} התאמות`);
  });

  // ספירת ציונים מאוכלסים
  const hybridCount = await prisma.potentialMatch.count({ 
    where: { hybridScore: { not: null } } 
  });
  const algoCount = await prisma.potentialMatch.count({ 
    where: { algorithmicScore: { not: null } } 
  });
  const vectorCount = await prisma.potentialMatch.count({ 
    where: { vectorScore: { not: null } } 
  });
  const metricsCount = await prisma.potentialMatch.count({ 
    where: { metricsV2Score: { not: null } } 
  });

  console.log('\n   ציונים מאוכלסים:');
  console.log(`   - hybridScore: ${hybridCount}`);
  console.log(`   - algorithmicScore: ${algoCount}`);
  console.log(`   - vectorScore: ${vectorCount}`);
  console.log(`   - metricsV2Score: ${metricsCount}`);
  console.log('='.repeat(60) + '\n');
}

main()
  .catch((e) => {
    console.error('❌ שגיאה קריטית:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });