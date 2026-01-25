const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');

dotenv.config();

const prisma = new PrismaClient();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('❌ שגיאה: חסר GEMINI_API_KEY בקובץ .env');
  process.exit(1);
}

// שימוש במודל הזהה למה שמוגדר ב-aiService.ts
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.4,
    },
});

// ==========================================
// 1. פונקציות עזר
// ==========================================

function calculateAge(birthDate: any) {
  if (!birthDate) return 0;
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

// פונקציה לבניית הנרטיב
function generateNarrativeProfile(user: any) {
  if (!user || !user.profile) return '';

  const p = user.profile;
  const q = user.questionnaireResponses?.[0]; // לוקח את האחרון
  
  // תיקון: הגדרת טיפוס מפורשת למערך
  const parts: string[] = [];

  // --- חלק 1: פרופיל אישי מורחב ---
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

  // --- חלק 3: מה הוא מחפש ---
  let lookingFor = `Looking For (Preferences):\n`;
  if (p.matchingNotes) lookingFor += `Notes: ${p.matchingNotes}\n`;
  
  // תיקון: הגדרת טיפוס מפורשת למערך
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
    // תיקון: שימוש ב-any כדי למנוע שגיאות unknown
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

  return parts.join('\n\n---\n\n');
}

// ==========================================
// 2. פונקציית AI
// ==========================================

async function generateProfileSummary(userNarrativeProfile: string, language = 'he') {
  if (!userNarrativeProfile) return null;

  const targetLanguage = language === 'he' ? 'Hebrew' : 'English';

  const prompt = `
    You are the Senior Analyst at NeshamaTech. Your task is to create a **Comprehensive Intelligence Dossier** for the matchmaker, stored in two distinct sections.
    This is NOT a short summary. This is a detailed, high-resolution breakdown of the candidate based on all available data (technical, family, career, religious, personality).

    **Audience:** Professional Matchmaker (Internal Use).
    **Tone:** Diagnostic, Detailed, Analytical, Thorough.

    --- INSTRUCTIONS FOR FIELD 1: 'personalitySummary' ---
    This field must be a rich, multi-paragraph text covering:
    1.  **Bio & Family Roots:** Age, location, origin, parents' background, sibling status. Connect this to their socio-economic standing.
    2.  **Career & Drive:** Education, military service, current job, financial attitude, and ambition level (based on questionnaire).
    3.  **Religious Profile:** Detailed hashkafa, observances (Shabbat, Kashrut, Dress), and the gap between definition and practice.
    4.  **Personality & Vibe:** Energy level (High/Low), Social battery (Introvert/Extrovert), emotional resilience, and key traits from the "budget allocation" questions.

    --- INSTRUCTIONS FOR FIELD 2: 'lookingForSummary' ---
    This field must be a rich, multi-paragraph text covering:
    1.  **Relationship Dynamics:** Communication style, conflict resolution, need for space vs. togetherness.
    2.  **Deal Breakers:** Explicit red lines mentioned in the data.
    3.  **Partner Specs:** What are they looking for? (Look, character, intellect, background).
    4.  **Matchmaker Directive:** A clear instruction on who to search for and who to avoid.

    **Handling Missing Data:**
    If the deep questionnaire is missing, analyze the "About Me" writing style and the technical details to infer the vibe, but explicitly state that data is partial.

    **Output Format:**
    A valid JSON object in ${targetLanguage}.
    {
      "personalitySummary": "Detailed text with line breaks (\\n)...",
      "lookingForSummary": "Detailed text with line breaks (\\n)..."
    }

    --- User Data ---
    ${userNarrativeProfile}
    --- End Data ---
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    let jsonString = response.text();

    if (!jsonString) return null;

    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7, -3).trim();
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.slice(3, -3).trim();
    }

    return JSON.parse(jsonString);

  } catch (error) {
    // תיקון: המרה ל-any כדי לגשת ל-message
    console.error('⚠️ שגיאת AI:', (error as any).message);
    return null;
  }
}

// ==========================================
// 3. הפונקציה הראשית
// ==========================================

async function main() {
  console.log('🚀 מתחיל סריקה לניתוח עומק חסר (Long Analysis)...');

  // 1. שליפת מועמדים
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

  // 2. סינון: מי שחסר לו personalitySummary או lookingForSummary
  const usersMissingAnalysis = allCandidates.filter((user: any) => {
    const aiData = user.profile?.aiProfileSummary;
    
    if (!aiData) return true;
    
    const hasPersonality = aiData.personalitySummary && aiData.personalitySummary.length > 20;
    const hasLookingFor = aiData.lookingForSummary && aiData.lookingForSummary.length > 20;

    return (!hasPersonality || !hasLookingFor);
  });

  console.log(`📊 סה"כ מועמדים: ${allCandidates.length}`);
  console.log(`⚠️ חסרי ניתוח עומק: ${usersMissingAnalysis.length}`);

  if (usersMissingAnalysis.length === 0) {
    console.log('✅ הכל מעודכן! לכל המשתמשים יש ניתוח עומק מלא.');
    return;
  }

  console.log('--- מתחיל ביצירת ניתוחי עומק ---');
  let successCount = 0;
  let failCount = 0;

  for (const user of usersMissingAnalysis) {
    try {
      console.log(`\n🧠 מנתח את: ${user.firstName} ${user.lastName}...`);

      const narrative = generateNarrativeProfile(user);
      
      if (!narrative || narrative.length < 50) {
          console.log(`   🔸 דילוג: פרופיל דל מדי.`);
          failCount++;
          continue;
      }

      const analysisResult = await generateProfileSummary(narrative, 'he');
      
      if (!analysisResult) {
          console.log(`   ❌ נכשל ביצירת הניתוח.`);
          failCount++;
          continue;
      }

      const currentAiProfile: any = user.profile.aiProfileSummary || {};
      
      const updatedAiProfile = {
          ...currentAiProfile,
          personalitySummary: analysisResult.personalitySummary,
          lookingForSummary: analysisResult.lookingForSummary,
          lastDeepAnalysisAt: new Date().toISOString()
      };

      await prisma.user.update({
          where: { id: user.id },
          data: {
              neshamaInsightLastGeneratedAt: new Date(),
              neshamaInsightGeneratedCount: { increment: 1 },
              profile: {
                  update: {
                      aiProfileSummary: updatedAiProfile
                  }
              }
          }
      });

      console.log(`   ✅ נשמר! אישיות: ${analysisResult.personalitySummary.length} תווים | מחפש: ${analysisResult.lookingForSummary.length} תווים`);
      successCount++;
      
      await new Promise(resolve => setTimeout(resolve, 1500));

    } catch (error) {
      console.error(`   ❌ שגיאה:`, (error as any).message);
      failCount++;
    }
  }

  console.log(`\n✅ סיום: ${successCount} עודכנו, ${failCount} נכשלו.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });