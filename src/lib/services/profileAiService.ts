// File: src/lib/services/profileAiService.ts

import prisma from "@/lib/prisma";
import aiService from "./aiService";
import type { User, Profile, QuestionnaireResponse, Prisma as PrismaTypes, ReligiousJourney, FriendTestimonial } from '@prisma/client';

// ❌ הסרנו את הייבוא של קבצי React components
// ✅ במקום זה נשתמש רק במידע הגולמי מה-DB

type WorldKey = 'values' | 'personality' | 'relationship' | 'partner' | 'religion';
type DbWorldKey = `${WorldKey}Answers`;

const KEY_MAPPING: Record<WorldKey, DbWorldKey> = {
  values: 'valuesAnswers',
  personality: 'personalityAnswers',
  relationship: 'relationshipAnswers',
  partner: 'partnerAnswers',
  religion: 'religionAnswers'
};

interface JsonAnswerData {
  questionId: string;
  value: PrismaTypes.JsonValue;
  answeredAt: string;
  isVisible?: boolean;
}

type UserWithRelations = User & {
  profile: (Profile & {
    testimonials?: FriendTestimonial[];
  }) | null;
  questionnaireResponses: QuestionnaireResponse[];
};

// Helper Functions
function formatDisplayValue(value: PrismaTypes.JsonValue | null | undefined, fallback: string = "לא צוין"): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value ? "כן" : "לא";
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toLocaleDateString('he-IL');
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.map(String).join(', ') : fallback;
  }
  if (typeof value === 'object') {
     if (Object.keys(value).length > 0) {
         return Object.entries(value)
             .map(([key, val]) => `${key}: ${val}`)
             .join('; ');
     }
     return fallback;
  }
  return String(value);
}

function formatArray(arr: string[] | null | undefined, fallback: string = "לא צוין"): string {
  if (!arr || arr.length === 0) {
    return fallback;
  }
  return arr.join(', ');
}

function isValidAnswerObject(item: unknown): item is PrismaTypes.JsonObject & { 
  value: PrismaTypes.JsonValue; 
  questionId: unknown; 
  answeredAt: unknown 
} {
  return (
    typeof item === 'object' &&
    item !== null &&
    'questionId' in item &&
    'value' in item &&
    item.value !== undefined &&
    'answeredAt' in item
  );
}

function safeParseAnswers(jsonValue: PrismaTypes.JsonValue | null): JsonAnswerData[] {
  if (Array.isArray(jsonValue)) {
    return jsonValue
      .filter(isValidAnswerObject)
      .map(item => ({
        questionId: String(item.questionId || ''),
        value: item.value,
        answeredAt: String(item.answeredAt || new Date().toISOString()),
        isVisible: typeof item.isVisible === 'boolean' ? item.isVisible : true,
      }))
      .filter(item => item.questionId);
  }
  return [];
}

// ✅ פונקציה מפושטת שלא תלויה בקבצי React
function formatAnswerSimplified(answer: JsonAnswerData, worldName: string): string {
  if (answer.value === null || answer.value === undefined || answer.value === '') {
    return '';
  }
  if (Array.isArray(answer.value) && answer.value.length === 0) {
    return '';
  }

  // פשוט מציג את השאלה והתשובה
  return `**שאלה מעולם ${worldName}:**\nתשובה: ${formatDisplayValue(answer.value)}\n`;
}

function processQuestionnaireData(questionnaire: QuestionnaireResponse | null | undefined) {
    if (!questionnaire) {
        return {
            answeredCount: 0,
            totalCount: 100, // הערכה גסה
            completionPercentage: 0,
            answersNarrative: "המשתמש עדיין לא החל למלא את השאלון."
        };
    }

    const worldKeys: WorldKey[] = ['values', 'personality', 'relationship', 'partner', 'religion'];
    let answeredCount = 0;
    const narrativeChunks: string[] = [];

    const worldNames: Record<WorldKey, string> = {
      values: 'ערכים',
      personality: 'אישיות',
      relationship: 'זוגיות',
      partner: 'בן/בת זוג',
      religion: 'דת ורוחניות'
    };

    worldKeys.forEach(worldKey => {
        const dbKey = KEY_MAPPING[worldKey];
        const answers = safeParseAnswers(questionnaire[dbKey]);
        
        if (answers.length > 0) {
            answeredCount += answers.length;
            
            narrativeChunks.push(`### עולם ${worldNames[worldKey]}`);
            
            answers.forEach(answer => {
                const formattedPart = formatAnswerSimplified(answer, worldNames[worldKey]);
                if (formattedPart) {
                    narrativeChunks.push(formattedPart);
                }
            });
        }
    });

    const totalCount = 100; // הערכה
    const completionPercentage = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;
    
    return {
        answeredCount,
        totalCount,
        completionPercentage,
        answersNarrative: narrativeChunks.length > 0 
          ? narrativeChunks.join('\n') 
          : "המשתמש החל למלא את השאלון אך לא נמצאו תשובות תקפות לעיבוד."
    };
}

export async function generateNarrativeProfile(userId: string): Promise<string> {
  // 1. שליפת כל המידע, כולל שדות הסיכום החדשים והערות שדכן
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      questionnaireResponses: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  if (!user || !user.profile) return '';

  const p = user.profile;
  const q = user.questionnaireResponses[0];
  const parts: string[] = [];

  // --- חלק 1: פרופיל אישי מורחב ---
  // תיקון: שימוש ב-hasChildrenFromPrevious במקום ב-children שלא קיים
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

  // --- חלק 2: טקסט חופשי (הנשמה של הפרופיל) ---
  if (p.about) parts.push(`About Me (Personal Statement):\n${p.about}`);
  if (p.profileHeadline) parts.push(`Headline:\n${p.profileHeadline}`);
  if (p.inspiringCoupleStory) parts.push(`Inspiring Couple Story:\n${p.inspiringCoupleStory}`);
  if (p.manualEntryText) parts.push(`Additional Info:\n${p.manualEntryText}`);

  // --- חלק 3: מה הוא מחפש (כולל העדפות טכניות) ---
  let lookingFor = `Looking For (Preferences):\n`;
  if (p.matchingNotes) lookingFor += `Notes: ${p.matchingNotes}\n`;
  
  // הוספת העדפות מובנות לחיזוק הווקטור
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
    const formatQ = (json: any) => 
      json ? Object.values(json).map((v: any) => v.answer || v).join('. ') : '';

    if (q.valuesAnswers) parts.push(`Deep Values & Worldview:\n${formatQ(q.valuesAnswers)}`);
    if (q.personalityAnswers) parts.push(`Personality Traits:\n${formatQ(q.personalityAnswers)}`);
    if (q.relationshipAnswers) parts.push(`Relationship View:\n${formatQ(q.relationshipAnswers)}`);
    if (q.partnerAnswers) parts.push(`Partner Expectations:\n${formatQ(q.partnerAnswers)}`);
  }

  // --- חלק 5: מידע מקצועי ---
  if (p.internalMatchmakerNotes) {
    parts.push(`Matchmaker Internal Insights (High Importance):\n${p.internalMatchmakerNotes}`);
  }

  if (p.cvSummary) {
    parts.push(`Professional Background (CV Analysis):\n${p.cvSummary}`);
  }

  // --- חלק 6: סיכום AI (אם קיים) ---
  if (p.aiProfileSummary) {
    let summaryText = '';
    
    if (typeof p.aiProfileSummary === 'string') {
      summaryText = p.aiProfileSummary;
    } else {
      const summaryObj = p.aiProfileSummary as any;
      
      if (summaryObj.analysis) summaryText += `Deep Analysis: ${summaryObj.analysis}\n`;
      if (summaryObj.strengths) summaryText += `Strengths: ${Array.isArray(summaryObj.strengths) ? summaryObj.strengths.join(', ') : summaryObj.strengths}\n`;
      if (summaryObj.challenges) summaryText += `Challenges/Growth Areas: ${Array.isArray(summaryObj.challenges) ? summaryObj.challenges.join(', ') : summaryObj.challenges}\n`;
      if (summaryObj.needs) summaryText += `Relationship Needs: ${summaryObj.needs}\n`;
      
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

// פונקציית עזר לחישוב גיל
function calculateAge(birthDate: Date): number {
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export async function updateUserAiProfile(userId: string): Promise<void> {
  console.log(`Starting AI profile update for userId: ${userId}`);
  const profileText = await generateNarrativeProfile(userId);
  if (!profileText) {
    console.error(`Failed to generate narrative profile for userId: ${userId}. Aborting AI update.`);
    return;
  }

  const vector = await aiService.generateTextEmbedding(profileText);
  if (!vector) {
    console.error(`Failed to generate vector embedding for userId: ${userId}. Aborting DB update.`);
    return;
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { id: true }
    });
    if (!profile) {
      console.error(`No profile found for userId: ${userId} to save the vector against.`);
      return;
    }
    
    const vectorSqlString = `[${vector.join(',')}]`;
    await prisma.$executeRaw`
      INSERT INTO "profile_vectors" ("profileId", vector, "updatedAt")
      VALUES (${profile.id}, ${vectorSqlString}::vector, NOW())
      ON CONFLICT ("profileId")
      DO UPDATE SET
        vector = EXCLUDED.vector,
        "updatedAt" = NOW();
    `;
    console.log(`Successfully updated AI profile and vector for userId: ${userId} (profileId: ${profile.id})`);
  } catch (error) {
    console.error(`Error saving profile vector to DB for userId: ${userId}:`, error);
  }
}

const profileAiService = {
  generateNarrativeProfile,
  updateUserAiProfile,
};

export default profileAiService;