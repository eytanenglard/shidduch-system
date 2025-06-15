// File: src/lib/services/profileAiService.ts

import prisma from "@/lib/prisma";
import aiService from "./aiService";
import type { User, Profile, QuestionnaireResponse } from '@prisma/client';
import { Prisma } from '@prisma/client'; // *** ייבוא חדש ***

// Helper function to format values for the narrative, handling undefined/null/empty cases
function formatValue(value: string | number | boolean | Date | null | undefined, fallback: string = "לא צוין"): string {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value ? "כן" : "לא";
  }
  if (value instanceof Date) {
    return value.toLocaleDateString('he-IL');
  }
  return String(value);
}

// Helper function to format arrays into a readable string
function formatArray(arr: string[] | null | undefined, fallback: string = "לא צוין"): string {
  if (!arr || arr.length === 0) {
    return fallback;
  }
  return arr.join(', ');
}

type UserWithRelations = User & {
  profile: Profile | null;
  questionnaireResponses: QuestionnaireResponse[];
};

/**
 * Generates a comprehensive narrative profile text for a given user.
 * This text will be used to create the vector embedding.
 * @param userId The ID of the user.
 * @returns A promise that resolves to the narrative string, or null if user not found.
 */
export async function generateNarrativeProfile(userId: string): Promise<string | null> {
  const user: UserWithRelations | null = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      questionnaireResponses: {
        orderBy: {
          lastSaved: 'desc',
        },
        take: 1, // Get the most recent questionnaire
      },
    },
  });

  if (!user || !user.profile) {
    console.error(`Could not generate narrative profile: User or Profile not found for userId: ${userId}`);
    return null;
  }

  const profile = user.profile;
  const questionnaire = user.questionnaireResponses[0];

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1;
    }
    return age;
  };
  const age = calculateAge(profile.birthDate);
  
  // Start building the narrative string
  let narrative = `# פרופיל AI עבור ${user.firstName} ${user.lastName}, ${profile.gender === 'MALE' ? 'גבר' : 'אישה'} בן/בת ${age}\n\n`;

  // --- Section: General Summary ---
  narrative += `## סיכום כללי\n`;
  narrative += `- **שם:** ${user.firstName} ${user.lastName}\n`;
  narrative += `- **גיל:** ${age} ${profile.birthDateIsApproximate ? '(משוער)' : ''}\n`;
  narrative += `- **מצב משפחתי:** ${formatValue(profile.maritalStatus)}\n`;
  narrative += `- **מגורים:** ${formatValue(profile.city)}\n`;
  narrative += `- **רמה דתית:** ${formatValue(profile.religiousLevel)}\n`;
  narrative += `- **עיסוק:** ${formatValue(profile.occupation)}\n`;
  narrative += `- **השכלה:** ${formatValue(profile.educationLevel)}, ${formatValue(profile.education)}\n`;
  narrative += `- **שומר/ת נגיעה:** ${formatValue(profile.shomerNegiah)}\n`;
  if (user.source === 'MANUAL_ENTRY' && profile.manualEntryText) {
    narrative += `\n**הערת שדכן (למועמד ידני):** ${profile.manualEntryText}\n`;
  }
  narrative += `\n`;

  // --- Section: About Me (From Profile) ---
  if (profile.about) {
    narrative += `## קצת עליי (מהפרופיל)\n`;
    narrative += `"${profile.about}"\n\n`;
  }
  
  // --- Section: Personal Traits and Hobbies ---
  narrative += `## תכונות אופי ותחביבים\n`;
  narrative += `- **תכונות בולטות:** ${formatArray(profile.profileCharacterTraits)}\n`;
  narrative += `- **תחביבים עיקריים:** ${formatArray(profile.profileHobbies)}\n\n`;
  
  // --- Section: Partner Preferences (From Profile) ---
  narrative += `## מה אני מחפש/ת בבן/בת הזוג (העדפות מהפרופיל)\n`;
  narrative += `- **תיאור כללי:** ${formatValue(profile.matchingNotes)}\n`;
  narrative += `- **טווח גילאים מועדף:** ${formatValue(profile.preferredAgeMin, '?')} - ${formatValue(profile.preferredAgeMax, '?')}\n`;
  narrative += `- **רמות דתיות מועדפות:** ${formatArray(profile.preferredReligiousLevels)}\n`;
  narrative += `- **רמות השכלה מועדפות:** ${formatArray(profile.preferredEducation)}\n`;
  narrative += `- **מוצאים מועדפים:** ${formatArray(profile.preferredOrigins)}\n\n`;
  
  // --- Section: Questionnaire Answers ---
  if (questionnaire) {
    narrative += `## תובנות מהשאלון\n\n`;
    const allAnswers = [
        ...(questionnaire.valuesAnswers as any[] || []),
        ...(questionnaire.personalityAnswers as any[] || []),
        ...(questionnaire.relationshipAnswers as any[] || []),
        ...(questionnaire.partnerAnswers as any[] || []),
        ...(questionnaire.religionAnswers as any[] || []),
    ];
    
    // Helper to extract and format answers
    const formatQuestionnaireAnswers = (answers: any[] | null) => {
        if (!answers) return 'לא ענה/ת על חלק זה.';
        let sectionText = '';
        for (const ans of answers) {
            // Assuming ans is an object with { question, answer } or similar structure
            // This part MUST be adjusted based on the actual JSON structure of your answers
            if (ans.question && (ans.answer || ans.displayText)) {
                sectionText += `### שאלה: ${ans.question}\n`;
                sectionText += `תשובה: ${ans.displayText || ans.answer}\n\n`;
            }
        }
        return sectionText || 'לא נמצאו תשובות בחלק זה.';
    };

    narrative += "--- עולם הערכים ---\n";
    narrative += formatQuestionnaireAnswers(questionnaire.valuesAnswers as any[]);
    
    narrative += "--- עולם האישיות ---\n";
    narrative += formatQuestionnaireAnswers(questionnaire.personalityAnswers as any[]);
    
    narrative += "--- עולם הזוגיות ---\n";
    narrative += formatQuestionnaireAnswers(questionnaire.relationshipAnswers as any[]);
    
    narrative += "--- ציפיות מבן/בת הזוג ---\n";
    narrative += formatQuestionnaireAnswers(questionnaire.partnerAnswers as any[]);
    
    narrative += "--- עולם הדת ---\n";
    narrative += formatQuestionnaireAnswers(questionnaire.religionAnswers as any[]);
  }

  return narrative.trim();
}

/**
 * Updates a user's AI profile by generating a new narrative and its vector embedding.
 * @param userId The ID of the user to update.
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
    
    const profileId = profile.id;

    // --- START OF MODIFIED SECTION ---
    // We use $executeRawUnsafe because Prisma doesn't natively support vector types for parameter binding.
    // We construct the vector string representation for SQL manually.
    // This is safe because the 'vector' content comes from our trusted AI service, not user input.
    const vectorSqlString = `[${vector.join(',')}]`;

    // Using raw SQL to perform the upsert operation for the vector type.
    await prisma.$executeRaw`
      INSERT INTO "profile_vectors" ("profileId", vector, "updatedAt")
      VALUES (${profileId}, ${vectorSqlString}::vector, NOW())
      ON CONFLICT ("profileId")
      DO UPDATE SET
        vector = EXCLUDED.vector,
        "updatedAt" = NOW();
    `;
    // --- END OF MODIFIED SECTION ---

    console.log(`Successfully updated AI profile and vector for userId: ${userId} (profileId: ${profileId})`);

  } catch (error) {
    console.error(`Error saving profile vector to DB for userId: ${userId}:`, error);
  }
}


const profileAiService = {
  generateNarrativeProfile,
  updateUserAiProfile,
};

export default profileAiService;