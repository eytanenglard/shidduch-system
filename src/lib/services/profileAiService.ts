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
  // 1. שליפת כל המידע, כולל שדות הסיכום החדשים
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true, // מכיל את aiProfileSummary, cvSummary
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

  // --- חלק 1: פרטים יבשים (בסיס) ---
  parts.push(`User Profile Summary:
  Name: ${user.firstName} ${user.lastName}
  Gender: ${p.gender}
  Age: ${calculateAge(p.birthDate)}
  Marital Status: ${p.maritalStatus || 'Not specified'}
  Religious Level: ${p.religiousLevel || 'Not specified'}
  Location: ${p.city || 'Not specified'}`);

  // --- חלק 2: טקסט חופשי שהיוזר כתב ---
  if (p.about) parts.push(`About Me:\n${p.about}`);
  if (p.profileHeadline) parts.push(`Headline:\n${p.profileHeadline}`);
  if (p.inspiringCoupleStory) parts.push(`Inspiring Story:\n${p.inspiringCoupleStory}`);
  
  // --- חלק 3: מה הוא מחפש ---
  if (p.matchingNotes) parts.push(`Looking For:\n${p.matchingNotes}`);

  // --- חלק 4: שאלון עומק (Questionnaire) ---
  if (q) {
    // פונקציית עזר פנימית שמפרמטת תשובות JSON לטקסט
    const formatQ = (json: any) => 
      json ? Object.values(json).map((v: any) => v.answer || v).join('. ') : '';

    if (q.valuesAnswers) parts.push(`Values & Worldview:\n${formatQ(q.valuesAnswers)}`);
    if (q.personalityAnswers) parts.push(`Personality:\n${formatQ(q.personalityAnswers)}`);
    if (q.relationshipAnswers) parts.push(`Relationship View:\n${formatQ(q.relationshipAnswers)}`);
  }

  // --- חלק 5: סיכום קו"ח (אם קיים) ---
  if (p.cvSummary) {
    parts.push(`Professional Background (CV Analysis):\n${p.cvSummary}`);
  }

  // ========================================================================
  // 🆕 התוספת שביקשת: הכללת ניתוח ה-AI בתוך הווקטור
  // ========================================================================
  if (p.aiProfileSummary) {
    // מכיוון שזה שדה JSON, אנחנו צריכים להפוך אותו לטקסט קריא
    let summaryText = '';
    
    // בדיקה אם זה אובייקט או מחרוזת
    if (typeof p.aiProfileSummary === 'string') {
      summaryText = p.aiProfileSummary;
    } else {
      // אם זה אובייקט מורכב (למשל מכיל נקודות חוזק, חולשה וכו')
      const summaryObj = p.aiProfileSummary as any;
      
      // נבנה טקסט עשיר מתוך האובייקט
      if (summaryObj.analysis) summaryText += `Deep Analysis: ${summaryObj.analysis}\n`;
      if (summaryObj.strengths) summaryText += `Strengths: ${Array.isArray(summaryObj.strengths) ? summaryObj.strengths.join(', ') : summaryObj.strengths}\n`;
      if (summaryObj.needs) summaryText += `Relationship Needs: ${summaryObj.needs}\n`;
      
      // fallback: אם המבנה לא ידוע, נמיר את הכל לטקסט
      if (!summaryText) {
        summaryText = JSON.stringify(summaryObj, null, 2);
      }
    }

    if (summaryText) {
      parts.push(`AI Professional Insight (Matchmaker Perspective):\n${summaryText}`);
    }
  }
  // ========================================================================

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