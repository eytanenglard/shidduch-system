// File: src/lib/services/profileAiService.ts

import prisma from "@/lib/prisma";
import aiService from "./aiService";
// START OF CHANGE: Import the ReligiousJourney enum
import type { User, Profile, QuestionnaireResponse, Prisma as PrismaTypes, ReligiousJourney } from '@prisma/client';
// END OF CHANGE

// 1. --- Import types and questions from the questionnaire module ---
import type { Question } from '@/components/questionnaire/types/types';
import { valuesQuestions } from '@/components/questionnaire/questions/values/valuesQuestions';
import { personalityQuestions } from '@/components/questionnaire/questions/personality/personalityQuestions';
import { relationshipQuestions } from '@/components/questionnaire/questions/relationship/relationshipQuestions';
import { partnerQuestions } from '@/components/questionnaire/questions/partner/partnerQuestions';
import { religionQuestions } from '@/components/questionnaire/questions/religion/religionQuestions';

// 2. --- Centralized Question Data ---
// Combine all questions into a single map for efficient lookups by ID.
const allQuestions: Map<string, Question> = new Map();
[
  ...valuesQuestions,
  ...personalityQuestions,
  ...relationshipQuestions,
  ...partnerQuestions,
  ...religionQuestions
].forEach(q => allQuestions.set(q.id, q));

// 3. --- Strongly-typed interfaces for data handling ---
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
  value: PrismaTypes.JsonValue; // value is guaranteed to exist
  answeredAt: string;
  isVisible?: boolean;
}

type UserWithRelations = User & {
  profile: Profile | null;
  questionnaireResponses: QuestionnaireResponse[];
};

// 4. --- Helper Functions for Formatting ---

/**
 * Safely formats a value for the narrative, handling undefined/null/empty cases.
 */
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

/**
 * Formats an array of strings into a human-readable list.
 */
function formatArray(arr: string[] | null | undefined, fallback: string = "לא צוין"): string {
  if (!arr || arr.length === 0) {
    return fallback;
  }
  return arr.join(', ');
}

/**
 * Type guard to check if an item from JSON is a valid answer object.
 */
function isValidAnswerObject(item: unknown): item is PrismaTypes.JsonObject & { value: PrismaTypes.JsonValue; questionId: unknown; answeredAt: unknown } {
  return (
    typeof item === 'object' &&
    item !== null &&
    'questionId' in item &&
    'value' in item &&
    item.value !== undefined &&
    'answeredAt' in item
  );
}

/**
 * Safely parses the JSON from the database into our defined structure.
 */
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

/**
 * Intelligently formats a single questionnaire answer into a narrative sentence.
 */
function formatSingleAnswer(answer: JsonAnswerData): string | null {
  const questionDef = allQuestions.get(answer.questionId);
  if (!questionDef) {
    return `**שאלה לא מזוהה (${answer.questionId}):** ${formatDisplayValue(answer.value)}\n`;
  }

  if (answer.value === null || answer.value === undefined || answer.value === '') return null;
  if (Array.isArray(answer.value) && answer.value.length === 0) return null;

  let narrativePart = `**${questionDef.question}**\n`;
  
  switch (questionDef.type) {
    case 'singleChoice':
    case 'iconChoice':
    case 'scenario': {
      const selectedOption = questionDef.options?.find(o => o.value === answer.value);
      narrativePart += `תשובה: ${selectedOption ? selectedOption.text : formatDisplayValue(answer.value)}\n`;
      break;
    }
    case 'multiChoice':
    case 'multiSelect':
    case 'multiSelectWithOther': {
      if (Array.isArray(answer.value)) {
        const selectedTexts = answer.value.map(val => {
          if (typeof val === 'string' && val.startsWith('custom:')) {
            return `(אחר) ${val.replace('custom:', '').trim()}`;
          }
          const option = questionDef.options?.find(o => o.value === val);
          return option ? option.text : String(val);
        });
        narrativePart += `תשובות: ${selectedTexts.join(', ')}\n`;
      }
      break;
    }
    case 'openText': {
      narrativePart += `תשובה: "${formatDisplayValue(answer.value)}"\n`;
      break;
    }
    case 'scale': {
      const minLabel = questionDef.labels?.min || 'נמוך';
      const maxLabel = questionDef.labels?.max || 'גבוה';
      narrativePart += `דירוג: ${answer.value}/10 (כאשר 1=${minLabel} ו-10=${maxLabel})\n`;
      break;
    }
    case 'budgetAllocation': {
      if (typeof answer.value === 'object' && answer.value && !Array.isArray(answer.value)) {
          const allocations = Object.entries(answer.value)
              .filter(([, points]) => typeof points === 'number' && points > 0)
              .map(([category, points]) => `${category}: ${points}%`)
              .join('; ');
          narrativePart += `הקצאת חשיבות: ${allocations || 'לא צוין'}\n`;
      }
      break;
    }
    default: {
      narrativePart += `תשובה: ${formatDisplayValue(answer.value)}\n`;
    }
  }
  
  return narrativePart + '\n';
}

/**
 *  --- NEW FUNCTION ---
 * Processes questionnaire data to get completion stats and a narrative summary of answers.
 */
function processQuestionnaireData(questionnaire: QuestionnaireResponse | null | undefined) {
    const totalCount = allQuestions.size;
    if (!questionnaire) {
        return {
            answeredCount: 0,
            totalCount,
            completionPercentage: 0,
            answersNarrative: "המשתמש עדיין לא החל למלא את השאלון."
        };
    }

    const worldKeys: WorldKey[] = ['values', 'personality', 'relationship', 'partner', 'religion'];
    let answeredCount = 0;
    const narrativeChunks: string[] = [];

    worldKeys.forEach(worldKey => {
        const dbKey = KEY_MAPPING[worldKey];
        const answers = safeParseAnswers(questionnaire[dbKey]);
        
        if (answers.length > 0) {
            answeredCount += answers.length;
            
            const worldInfo = allQuestions.get(answers[0].questionId);
            const worldTitle = worldInfo?.worldId ? worldInfo.worldId.charAt(0) + worldInfo.worldId.slice(1).toLowerCase() : worldKey;
            
            narrativeChunks.push(`### עולם ה${worldTitle}`);
            
            answers.forEach(answer => {
                const formattedPart = formatSingleAnswer(answer);
                if (formattedPart) {
                    narrativeChunks.push(formattedPart);
                }
            });
        }
    });

    const completionPercentage = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;
    
    return {
        answeredCount,
        totalCount,
        completionPercentage,
        answersNarrative: narrativeChunks.length > 0 ? narrativeChunks.join('\n') : "המשתמש החל למלא את השאלון אך לא נמצאו תשובות תקפות לעיבוד."
    };
}


// 5. --- Main Service Functions ---

/**
 * Generates a comprehensive narrative profile text for a given user.
 */
export async function generateNarrativeProfile(userId: string): Promise<string | null> {
  const user: UserWithRelations | null = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      questionnaireResponses: { orderBy: { lastSaved: 'desc' }, take: 1 },
    },
  });

  if (!user || !user.profile) {
    console.error(`Could not generate narrative profile: User or Profile not found for userId: ${userId}`);
    return null;
  }

  const { profile, questionnaireResponses } = user;
  const questionnaire = questionnaireResponses[0];

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    return (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) ? age - 1 : age;
  };
  const age = calculateAge(profile.birthDate);
  
  const questionnaireData = processQuestionnaireData(questionnaire);

  // START OF CHANGE: Add helper map for religious journey translations
    const religiousJourneyMap: Record<ReligiousJourney, string> = {
      BORN_INTO_CURRENT_LIFESTYLE: "גדל/ה בסביבה דתית הדומה לרמתו/ה כיום",
      BORN_SECULAR: "גדל/ה בסביבה חילונית", // The new translation
      BAAL_TESHUVA: "חוזר/ת בתשובה",
      DATLASH: "יצא/ה בשאלה (דתל\"ש)",
      CONVERT: "גר/גיורת",
      IN_PROCESS: "בתהליך של שינוי/התחזקות/התלבטות דתית",
      OTHER: "בעל/ת רקע דתי אחר או מורכב"
  };
  // END OF CHANGE

  const narrativeParts: string[] = [
    `# פרופיל AI עבור ${user.firstName} ${user.lastName}, ${profile.gender === 'MALE' ? 'גבר' : 'אישה'} בן/בת ${age}`,
    `## סיכום כללי`,
    `- **שם:** ${user.firstName} ${user.lastName}`,
    `- **גיל:** ${age} ${profile.birthDateIsApproximate ? '(משוער)' : ''}`,
    `- **מצב משפחתי:** ${formatDisplayValue(profile.maritalStatus)}`,
    `- **מגורים:** ${formatDisplayValue(profile.city)}`,
    `- **רמה דתית:** ${formatDisplayValue(profile.religiousLevel)}`,
    // START OF CHANGE: Add personal religious journey to summary
    profile.religiousJourney ? `- **רקע/מסע דתי:** ${formatDisplayValue(religiousJourneyMap[profile.religiousJourney])}` : '',
    // END OF CHANGE
    `- **עיסוק:** ${formatDisplayValue(profile.occupation)}`,
    `- **השכלה:** ${formatDisplayValue(profile.educationLevel)}, ${formatDisplayValue(profile.education)}`,
    `- **שומר/ת נגיעה:** ${formatDisplayValue(profile.shomerNegiah)}`,
      `- **רקע משפחתי:** מצב הורים: ${formatDisplayValue(profile.parentStatus)}. מקצוע האב: ${formatDisplayValue(profile.fatherOccupation)}. מקצוע האם: ${formatDisplayValue(profile.motherOccupation)}.`,
  ].filter(Boolean); // This removes any empty strings from conditional entries

  if (user.source === 'MANUAL_ENTRY' && profile.manualEntryText) {
    narrativeParts.push(`\n**הערת שדכן (למועמד ידני):** ${profile.manualEntryText}`);
  }

  if (profile.about) {
    narrativeParts.push(`## קצת עליי (מהפרופיל)\n"${profile.about}"`);
  }

  // --- START: הוספת קטע מידע רפואי ---
  if (profile.hasMedicalInfo) {
    narrativeParts.push(
      `## מידע רפואי`,
      `- **פירוט המידע:** ${formatDisplayValue(profile.medicalInfoDetails)}`,
      `- **תזמון חשיפה:** ${formatDisplayValue(profile.medicalInfoDisclosureTiming)}`,
      `- **המידע גלוי בפרופיל הציבורי:** ${profile.isMedicalInfoVisible ? 'כן' : 'לא'}`
    );
  }
  // --- END: הוספת קטע מידע רפואי ---
  
  narrativeParts.push(
    `## תכונות אופי ותחביבים`,
    `- **תכונות בולטות:** ${formatArray(profile.profileCharacterTraits)}`,
    `- **תחביבים עיקריים:** ${formatArray(profile.profileHobbies)}`
  );
  
  // START OF CHANGE: Add preferred religious journey to preferences section
  const preferredJourneysText = (profile.preferredReligiousJourneys && profile.preferredReligiousJourneys.length > 0)
    ? formatArray(profile.preferredReligiousJourneys.map(j => religiousJourneyMap[j] || j))
    : "לא צוין";

  narrativeParts.push(
    `## מה אני מחפש/ת בבן/בת הזוג (העדפות מהפרופיל)`,
    `- **תיאור כללי:** ${formatDisplayValue(profile.matchingNotes)}`,
    `- **טווח גילאים מועדף:** ${formatDisplayValue(profile.preferredAgeMin, '?')} - ${formatDisplayValue(profile.preferredAgeMax, '?')}`,
    `- **רמות דתיות מועדפות:** ${formatArray(profile.preferredReligiousLevels)}`,
    `- **רקע/מסע דתי מועדף:** ${preferredJourneysText}`,
    `- **רמות השכלה מועדפות:** ${formatArray(profile.preferredEducation)}`,
    `- **מוצאים מועדפים:** ${formatArray(profile.preferredOrigins)}`
  );
  // END OF CHANGE

  narrativeParts.push(
    `\n## ניתוח השלמת השאלון`,
    `- **סך הכל שאלות במערכת:** ${questionnaireData.totalCount}`,
    `- **שאלות שנענו:** ${questionnaireData.answeredCount}`,
    `- **אחוז השלמה:** ${questionnaireData.completionPercentage}%`,
    `\n## תובנות מהשאלון (תשובות מפורטות)\n${questionnaireData.answersNarrative}`
  );

  return narrativeParts.join('\n\n').trim();
}

/**
 * Updates a user's AI profile by generating a new narrative and its vector embedding.
 */
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