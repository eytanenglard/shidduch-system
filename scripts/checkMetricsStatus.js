// scripts/checkMetricsStatus.js
// הרצה: node scripts/checkMetricsStatus.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAllUsersMetrics() {
  console.log('🔍 בודק מצב מדדים לכל המשתמשים...\n');

  // סטטיסטיקות כלליות
  const stats = await prisma.$queryRaw`
    SELECT 
      COUNT(DISTINCT p.id)::int as "totalProfiles",
      COUNT(DISTINCT pm."profileId")::int as "withMetrics",
      COUNT(DISTINCT CASE WHEN pv."selfVector" IS NOT NULL THEN pv."profileId" END)::int as "withSelfVector",
      COUNT(DISTINCT CASE WHEN pv."seekingVector" IS NOT NULL THEN pv."profileId" END)::int as "withSeekingVector",
      COUNT(DISTINCT CASE WHEN pm."aiPersonalitySummary" IS NOT NULL THEN pm."profileId" END)::int as "withAiSummary"
    FROM "Profile" p
    JOIN "User" u ON u.id = p."userId"
    LEFT JOIN "profile_metrics" pm ON pm."profileId" = p.id
    LEFT JOIN "profile_vectors" pv ON pv."profileId" = p.id
    WHERE u.role = 'CANDIDATE'
  `;

  const s = stats[0];
  const total = s.totalProfiles;

  console.log('═'.repeat(60));
  console.log('📊 סיכום כללי - מצב מדדים');
  console.log('═'.repeat(60));
  console.log(`סה"כ פרופילים של מועמדים: ${total}`);
  console.log('');
  console.log(`✅ עם מדדים (profile_metrics): ${s.withMetrics} (${pct(s.withMetrics, total)})`);
  console.log(`✅ עם selfVector: ${s.withSelfVector} (${pct(s.withSelfVector, total)})`);
  console.log(`✅ עם seekingVector: ${s.withSeekingVector} (${pct(s.withSeekingVector, total)})`);
  console.log(`✅ עם AI Summary: ${s.withAiSummary} (${pct(s.withAiSummary, total)})`);
  console.log('');
  
  // חישוב חסרים
  const missingMetrics = total - s.withMetrics;
  const missingSelfVector = total - s.withSelfVector;
  const missingSeekingVector = total - s.withSeekingVector;
  
  console.log('⚠️ חסרים:');
  console.log(`   מדדים: ${missingMetrics}`);
  console.log(`   selfVector: ${missingSelfVector}`);
  console.log(`   seekingVector: ${missingSeekingVector}`);

  // רשימת משתמשים חסרים
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('📋 משתמשים עם רכיבים חסרים (עד 20)');
  console.log('═'.repeat(60));

  const usersWithMissing = await prisma.$queryRaw`
    SELECT 
      u."firstName",
      u."lastName",
      p.gender::text,
      p.id as "profileId",
      (pm.id IS NULL) as "missingMetrics",
      (pv."selfVector" IS NULL) as "missingSelfVector",
      (pv."seekingVector" IS NULL) as "missingSeekingVector"
    FROM "Profile" p
    JOIN "User" u ON u.id = p."userId"
    LEFT JOIN "profile_metrics" pm ON pm."profileId" = p.id
    LEFT JOIN "profile_vectors" pv ON pv."profileId" = p.id
    WHERE 
      u.role = 'CANDIDATE'
      AND (
        pm.id IS NULL
        OR pv."selfVector" IS NULL
        OR pv."seekingVector" IS NULL
      )
    ORDER BY p."updatedAt" DESC
    LIMIT 20
  `;

  if (usersWithMissing.length === 0) {
    console.log('✅ כל המשתמשים מעודכנים!');
  } else {
    for (const user of usersWithMissing) {
      const missing = [];
      if (user.missingMetrics) missing.push('metrics');
      if (user.missingSelfVector) missing.push('selfVec');
      if (user.missingSeekingVector) missing.push('seekingVec');
      
      console.log(`  ${user.firstName} ${user.lastName} (${user.gender}) - חסר: ${missing.join(', ')}`);
    }
    
    if (usersWithMissing.length === 20) {
      console.log('  ... ועוד');
    }
  }

  // דוגמה למשתמש עם מדדים מלאים
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('🔬 דוגמה למדדים של משתמש מושלם');
  console.log('═'.repeat(60));

  const sampleMetrics = await prisma.$queryRaw`
    SELECT 
      u."firstName",
      u."lastName",
      pm."confidenceScore",
      pm."socialEnergy",
      pm."religiousStrictness",
      pm."careerOrientation",
      pm."urbanScore",
      pm."appearancePickiness",
      pm."emotionalExpression",
      pm."ambitionLevel",
      LEFT(pm."aiPersonalitySummary", 150) as "aiPersonalitySummary",
      LEFT(pm."aiSeekingSummary", 150) as "aiSeekingSummary"
    FROM "profile_metrics" pm
    JOIN "Profile" p ON p.id = pm."profileId"
    JOIN "User" u ON u.id = p."userId"
    WHERE 
      pm."socialEnergy" IS NOT NULL
      AND pm."religiousStrictness" IS NOT NULL
    LIMIT 1
  `;

  if (sampleMetrics.length > 0) {
    const m = sampleMetrics[0];
    console.log(`שם: ${m.firstName} ${m.lastName}`);
    console.log(`רמת ביטחון: ${m.confidenceScore}%`);
    console.log('');
    console.log('מדדים מספריים (0-100):');
    console.log(`  socialEnergy (חברותיות): ${m.socialEnergy ?? 'N/A'}`);
    console.log(`  religiousStrictness (הקפדה דתית): ${m.religiousStrictness ?? 'N/A'}`);
    console.log(`  careerOrientation (קריירה): ${m.careerOrientation ?? 'N/A'}`);
    console.log(`  urbanScore (עירוניות): ${m.urbanScore ?? 'N/A'}`);
    console.log(`  appearancePickiness (בררנות מראה): ${m.appearancePickiness ?? 'N/A'}`);
    console.log(`  emotionalExpression (ביטוי רגשי): ${m.emotionalExpression ?? 'N/A'}`);
    console.log(`  ambitionLevel (שאפתנות): ${m.ambitionLevel ?? 'N/A'}`);
    
    if (m.aiPersonalitySummary) {
      console.log('');
      console.log(`סיכום אישיות AI:`);
      console.log(`  "${m.aiPersonalitySummary}..."`);
    }
  } else {
    console.log('❌ לא נמצא משתמש עם מדדים מלאים');
  }
}

function pct(n, total) {
  if (total === 0) return '0%';
  return `${Math.round((n / total) * 100)}%`;
}

// הרצה
checkAllUsersMetrics()
  .catch(console.error)
  .finally(() => prisma.$disconnect());