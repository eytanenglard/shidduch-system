const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');

dotenv.config();

const prisma = new PrismaClient();

// 1. בדיקת מפתח API
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error('❌ Error: Missing GOOGLE_API_KEY or GEMINI_API_KEY in .env file');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

// ==========================================
// 1. פונקציות עזר (הועתקו מ-profileAiService.ts)
// ==========================================

function calculateAge(birthDate: any) {
  if (!birthDate) return 0;
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

// פונקציה שמייצרת את הטקסט (הנרטיב) עליו מבוסס הווקטור
// (לוגיקה זהה ל-generateNarrativeProfile)
function generateNarrativeProfile(user: any) {
  if (!user || !user.profile) return '';

  const p = user.profile;
  const q = user.questionnaireResponses?.[0]; 
  const parts: string[] = [];

  // --- חלק 1: פרופיל אישי ---
  const childrenStatus = p.hasChildrenFromPrevious ? 'Has children' : 'No children';

  const personalInfo = `User Profile Summary:
  Name: ${user.firstName} ${user.lastName}
  Gender: ${p.gender}
  Age: ${calculateAge(p.birthDate)}
  Height: ${p.height ? p.height + 'cm' : 'Not specified'}
  Location: ${p.city || 'Not specified'}
  Marital Status: ${p.maritalStatus || 'Not specified'} (${childrenStatus})
  
  Religious Identity:
  - Level: ${p.religiousLevel || 'Not specified'}
  - Journey: ${p.religiousJourney || 'Not specified'}
  - Shomer Negiah: ${p.shomerNegiah ? 'Yes' : 'No/Unknown'}
  ${p.kippahType ? `- Kippah: ${p.kippahType}` : ''}
  ${p.headCovering ? `- Head Covering: ${p.headCovering}` : ''}
  
  Professional & Education:
  - Occupation: ${p.occupation || 'Not specified'}
  - Education: ${p.education || 'Not specified'}`;

  parts.push(personalInfo);

  // --- חלק 2: טקסט חופשי ---
  if (p.about) parts.push(`About Me (Personal Statement):\n${p.about}`);
  if (p.profileHeadline) parts.push(`Headline:\n${p.profileHeadline}`);
  if (p.inspiringCoupleStory) parts.push(`Inspiring Couple Story:\n${p.inspiringCoupleStory}`);
  if (p.manualEntryText) parts.push(`Additional Info:\n${p.manualEntryText}`);

  // --- חלק 3: העדפות (Looking For) ---
  let lookingFor = `Looking For (Preferences):\n`;
  if (p.matchingNotes) lookingFor += `Notes: ${p.matchingNotes}\n`;
  
  const preferences: string[] = [];
  if (p.preferredAgeMin || p.preferredAgeMax) preferences.push(`Age Range: ${p.preferredAgeMin || '?'} - ${p.preferredAgeMax || '?'}`);
  if (p.preferredHeightMin || p.preferredHeightMax) preferences.push(`Height Range: ${p.preferredHeightMin || '?'} - ${p.preferredHeightMax || '?'} cm`);
  if (p.preferredReligiousLevels && p.preferredReligiousLevels.length > 0) preferences.push(`Religious Levels: ${p.preferredReligiousLevels.join(', ')}`);
  if (p.preferredLocations && p.preferredLocations.length > 0) preferences.push(`Locations: ${p.preferredLocations.join(', ')}`);
  
  if (preferences.length > 0) {
    lookingFor += `Technical Preferences:\n- ${preferences.join('\n- ')}`;
  }
  parts.push(lookingFor);

  // --- חלק 4: שאלון עומק ---
  if (q) {
    const formatQ = (json: any) => {
        if (!json) return '';
        if (Array.isArray(json)) {
            return json.map((v: any) => v.value || v).join('. ');
        }
        return Object.values(json).map((v: any) => v.answer || v.value || v).join('. ');
    };

    if (q.valuesAnswers) parts.push(`Deep Values & Worldview:\n${formatQ(q.valuesAnswers)}`);
    if (q.personalityAnswers) parts.push(`Personality Traits:\n${formatQ(q.personalityAnswers)}`);
    if (q.relationshipAnswers) parts.push(`Relationship View:\n${formatQ(q.relationshipAnswers)}`);
    if (q.partnerAnswers) parts.push(`Partner Expectations:\n${formatQ(q.partnerAnswers)}`);
  }

  // --- חלק 5: מידע מקצועי ו-CV ---
  if (p.internalMatchmakerNotes) {
    parts.push(`Matchmaker Internal Insights (High Importance):\n${p.internalMatchmakerNotes}`);
  }

  if (p.cvSummary) {
    parts.push(`Professional Background (CV Analysis):\n${p.cvSummary}`);
  }

  // --- חלק 6: סיכום AI ---
  if (p.aiProfileSummary) {
    let summaryText = '';
    
    if (typeof p.aiProfileSummary === 'string') {
      summaryText = p.aiProfileSummary;
    } else {
      const summaryObj = p.aiProfileSummary; // הוסר as any
      
      // בדיקה בטוחה של שדות אופציונליים
      if (summaryObj.analysis) summaryText += `Deep Analysis: ${summaryObj.analysis}\n`;
      if (summaryObj.strengths) summaryText += `Strengths: ${Array.isArray(summaryObj.strengths) ? summaryObj.strengths.join(', ') : summaryObj.strengths}\n`;
      if (summaryObj.needs) summaryText += `Relationship Needs: ${summaryObj.needs}\n`;
      
      // הוספת השדות החדשים שיצרנו בסקריפטים הקודמים
      if (summaryObj.summary) summaryText += `Executive Summary: ${summaryObj.summary}\n`;
      if (summaryObj.personalitySummary) summaryText += `Personality Insights: ${summaryObj.personalitySummary}\n`;
      if (summaryObj.lookingForSummary) summaryText += `Looking For Insights: ${summaryObj.lookingForSummary}\n`;

      if (!summaryText) {
        summaryText = JSON.stringify(summaryObj, null, 2);
      }
    }

    if (summaryText) {
      parts.push(`AI Comprehensive Insight (Synthesized Profile):\n${summaryText}`);
    }
  }

  return parts.join('\n\n---\n\n');
}

// ==========================================
// 2. פונקציה ליצירת וקטור (מועתקת מ-aiService.ts)
// ==========================================

async function generateTextEmbedding(text: string) {
  try {
    const result = await embeddingModel.embedContent(text);
    const embedding = result.embedding;
    if (embedding && embedding.values) {
      return embedding.values;
    }
    console.error('Embedding generation returned no values.');
    return null;
  } catch (error) {
    console.error('Error generating text embedding:', (error as any).message);
    return null;
  }
}

// ==========================================
// 3. הפונקציה הראשית
// ==========================================

async function main() {
  console.log('🚀 מתחיל בתהליך עדכון וקטורים עבור כל המשתמשים...');

  // 1. שליפת כל המשתמשים הרלוונטיים (CANDIDATE עם פרופיל)
  const allCandidates = await prisma.user.findMany({
    where: {
      role: 'CANDIDATE',
      profile: { isNot: null }
    },
    include: {
      profile: true,
      questionnaireResponses: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  console.log(`📊 סה"כ מועמדים לעדכון: ${allCandidates.length}`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < allCandidates.length; i++) {
    const user = allCandidates[i];
    const progress = `[${i + 1}/${allCandidates.length}]`;

    try {
      // א. יצירת הטקסט (הנרטיב)
      const narrative = generateNarrativeProfile(user);
      
      if (!narrative || narrative.length < 20) {
          console.log(`${progress} 🔸 דילוג על ${user.firstName}: פרופיל ריק.`);
          failCount++;
          continue;
      }

      // ב. שליחה ל-Google ליצירת הוקטור
      const vector = await generateTextEmbedding(narrative);
      
      if (!vector) {
          console.log(`${progress} ❌ נכשל ביצירת וקטור עבור ${user.firstName}.`);
          failCount++;
          continue;
      }

      // ג. שמירת הוקטור ב-DB (שימוש ב-Raw SQL בגלל סוג הנתונים vector)
      // הערה: user.profile לא null בגלל ה-where בשליפה
      const profileId = user.profile.id;
      const vectorSqlString = `[${vector.join(',')}]`;

      await prisma.$executeRaw`
        INSERT INTO "profile_vectors" ("profileId", vector, "updatedAt")
        VALUES (${profileId}, ${vectorSqlString}::vector, NOW())
        ON CONFLICT ("profileId")
        DO UPDATE SET
          vector = EXCLUDED.vector,
          "updatedAt" = NOW();
      `;

      console.log(`${progress} ✅ וקטור עודכן בהצלחה: ${user.firstName} ${user.lastName}`);
      successCount++;

      // השהייה קטנה למניעת חסימת Rate Limit
      await new Promise(resolve => setTimeout(resolve, 500)); 

    } catch (error) {
      console.error(`${progress} ❌ שגיאה קריטית עבור ${user.id}:`, (error as any).message);
      failCount++;
    }
  }

  console.log('\n--- סיכום ריצה ---');
  console.log(`✅ עודכנו בהצלחה: ${successCount}`);
  console.log(`❌ נכשלו: ${failCount}`);
}

main()
  .catch((e) => {
    console.error('Fatal Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });