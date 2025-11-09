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

export async function generateNarrativeProfile(userId: string): Promise<string | null> {
  const user: UserWithRelations | null = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          testimonials: {
            where: { status: 'APPROVED' }
          }
        }
      },
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

  const religiousJourneyMap: Record<ReligiousJourney, string> = {
      BORN_INTO_CURRENT_LIFESTYLE: "גדל/ה בסביבה דתית הדומה לרמתו/ה כיום",
      BORN_SECULAR: "גדל/ה בסביבה חילונית",
      BAAL_TESHUVA: "חוזר/ת בתשובה",
      DATLASH: "יצא/ה בשאלה (דתל\"ש)",
      CONVERT: "גר/גיורת",
      IN_PROCESS: "בתהליך של שינוי/התחזקות/התלבטות דתית",
      OTHER: "בעל/ת רקע דתי אחר או מורכב"
  };

  const narrativeParts: string[] = [
    `# פרופיל AI עבור ${user.firstName} ${user.lastName}, ${profile.gender === 'MALE' ? 'גבר' : 'אישה'} בן/בת ${age}`,
    `## סיכום כללי`,
    `- **שם:** ${user.firstName} ${user.lastName}`,
    `- **גיל:** ${age} ${profile.birthDateIsApproximate ? '(משוער)' : ''}`,
    `- **מצב משפחתי:** ${formatDisplayValue(profile.maritalStatus)}`,
    `- **מגורים:** ${formatDisplayValue(profile.city)}`,
    `- **רמה דתית:** ${formatDisplayValue(profile.religiousLevel)}`,
    profile.religiousJourney ? `- **רקע/מסע דתי:** ${formatDisplayValue(religiousJourneyMap[profile.religiousJourney])}` : '',
    `- **עיסוק:** ${formatDisplayValue(profile.occupation)}`,
    `- **השכלה:** ${formatDisplayValue(profile.educationLevel)}, ${formatDisplayValue(profile.education)}`,
    `- **שומר/ת נגיעה:** ${formatDisplayValue(profile.shomerNegiah)}`,
    `- **רקע משפחתי:** מצב הורי: ${formatDisplayValue(profile.parentStatus)}. מקצוע האב: ${formatDisplayValue(profile.fatherOccupation)}. מקצוע האם: ${formatDisplayValue(profile.motherOccupation)}.`,
  ].filter(Boolean);

  if (user.source === 'MANUAL_ENTRY' && profile.manualEntryText) {
    narrativeParts.push(`\n**הערת שדכן (למועמד ידני):** ${profile.manualEntryText}`);
  }
  if (profile.cvSummary) {
    narrativeParts.push(`## ניתוח קורות חיים (מבוסס AI)\n${profile.cvSummary}`);
  }

  if (profile.about) {
    narrativeParts.push(`## קצת עליי (מהפרופיל)\n"${profile.about}"`);
  }

  const personalInsightsParts = [
    profile.profileHeadline ? `**הכותרת האישית שלי:**\n"${profile.profileHeadline}"` : '',
    profile.inspiringCoupleStory ? `**זוג שמעורר בי השראה:**\n${profile.inspiringCoupleStory}` : '',
    profile.influentialRabbi ? `**דמות רוחנית שהשפיעה עליי:**\n${profile.influentialRabbi}` : ''
  ].filter(Boolean);

  if (personalInsightsParts.length > 0) {
    narrativeParts.push(`## תובנות אישיות נוספות\n${personalInsightsParts.join('\n\n')}`);
  }

  if (profile.hasMedicalInfo) {
    narrativeParts.push(
      `## מידע רפואי`,
      `- **פירוט המידע:** ${formatDisplayValue(profile.medicalInfoDetails)}`,
      `- **תזמון חשיפה:** ${formatDisplayValue(profile.medicalInfoDisclosureTiming)}`,
      `- **המידע גלוי בפרופיל הציבורי:** ${profile.isMedicalInfoVisible ? 'כן' : 'לג'}`
    );
  }
  
  narrativeParts.push(
    `## תכונות אופי ותחביבים`,
    `- **תכונות בולטות:** ${formatArray(profile.profileCharacterTraits)}`,
    `- **תחביבים עיקריים:** ${formatArray(profile.profileHobbies)}`
  );
  
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

  narrativeParts.push(
    `\n## ניתוח השלמת השאלון`,
    `- **סך הכל שאלות במערכת:** ${questionnaireData.totalCount}`,
    `- **שאלות שנענו:** ${questionnaireData.answeredCount}`,
    `- **אחוז השלמה:** ${questionnaireData.completionPercentage}%`,
    `\n## תובנות מהשאלון (תשובות מפורטות)\n${questionnaireData.answersNarrative}`
  );

  const approvedTestimonials = profile.testimonials;
  if (approvedTestimonials && approvedTestimonials.length > 0) {
    narrativeParts.push(`## המלצות מחברים`);
    approvedTestimonials.forEach(t => {
      narrativeParts.push(
        `**ממליץ/ה:** ${t.authorName} (${t.relationship})\n` +
        `**תוכן ההמלצה:** "${t.content}"`
      );
    });
  }
  
  return narrativeParts.join('\n\n').trim();
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