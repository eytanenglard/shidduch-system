// src/lib/services/aiService.ts

import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.error(
    '[FATAL ERROR] GOOGLE_API_KEY is not set in .env or .env.local!'
  );
  throw new Error('GOOGLE_API_KEY must be set.');
}

const genAI = new GoogleGenerativeAI(apiKey);

/**
 * יוצר וקטור הטמעה (embedding) עבור טקסט נתון.
 * @param text הטקסט להטמעה.
 * @returns Promise שמחזיר מערך של מספרים (הווקטור), או null במקרה של כישלון.
 */
export async function generateTextEmbedding(
  text: string
): Promise<number[] | null> {
  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    const embedding = result.embedding;
    if (embedding && embedding.values) {
      return embedding.values;
    }
    console.error('Embedding generation returned no values.');
    return null;
  } catch (error) {
    console.error('Error generating text embedding:', error);
    return null;
  }
}

/**
 * מגדיר את מבנה ה-JSON של ניתוח התאמה עבור שדכנים.
 */
export interface AiAnalysisResult {
  overallScore: number;
  matchSummary: string;
  compatibilityPoints: Array<{
    area: string;
    explanation: string;
    strength: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  potentialChallenges: Array<{
    area: string;
    explanation: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  suggestedConversationStarters: string[];
}

/**
 * מנתח את ההתאמה בין שני פרופילים נרטיביים עבור שדכן.
 * @param profileAText הפרופיל הנרטיבי של המשתמש הראשון.
 * @param profileBText הפרופיל הנרטיבי של המשתמש השני.
 * @param language שפת הפלט הרצויה.
 * @returns Promise שמחזיר אובייקט ניתוח מובנה, או null במקרה של כישלון.
 */
export async function analyzePairCompatibility(
  profileAText: string,
  profileBText: string,
  language: 'he' | 'en' = 'he'
): Promise<AiAnalysisResult | null> {
  console.log(
    `--- Attempting to analyze compatibility for matchmaker in ${language} ---`
  );
  if (!profileAText || !profileBText) {
    console.error(
      'analyzePairCompatibility called with one or more empty profiles.'
    );
    return null;
  }
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro-latest',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  });

  const languageInstruction =
    language === 'he'
      ? 'Your entire JSON output, including all string values (keys and explanations), must be in Hebrew.'
      : 'Your entire JSON output, including all string values, must be in English.';

  const prompt = `
    You are a "Matchmaking AI Expert" for a religious Jewish dating platform. Your goal is to analyze the compatibility of two user profiles and provide a structured, insightful, and helpful analysis for the matchmaker.
    ${languageInstruction}
    Your output MUST be a valid JSON object.
    The JSON structure: { "overallScore": number, "matchSummary": "string", "compatibilityPoints": [{ "area": "string", "explanation": "string", "strength": "HIGH" | "MEDIUM" | "LOW" }], "potentialChallenges": [{ "area": "string", "explanation": "string", "severity": "HIGH" | "MEDIUM" | "LOW" }], "suggestedConversationStarters": ["string"] }
    --- Profile 1 ---
    ${profileAText}
    --- Profile 2 ---
    ${profileBText}
    `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const jsonString = response.text();

    if (!jsonString) {
      console.error('Direct Gemini API returned an empty response.');
      return null;
    }

    console.log(
      `--- Successfully received compatibility analysis from Gemini API in ${language} ---`
    );
    return JSON.parse(jsonString) as AiAnalysisResult;
  } catch (error) {
    console.error(
      `Error generating compatibility analysis from Direct Gemini API in ${language}:`,
      error
    );
    return null;
  }
}

/**
 * מגדיר את מבנה ה-JSON של ניתוח פרופיל עבור המשתמש עצמו.
 */
// --- START OF CHANGE ---
export interface AiProfileAnalysisResult {
  personalitySummary: string;
  lookingForSummary: string;
  completenessReport: Array<{
    area: string;
    status: 'COMPLETE' | 'PARTIAL' | 'MISSING';
    feedback: string;
  }>;
  actionableTips: Array<{
    area: string;
    tip: string;
  }>;
  // photoFeedback הוסר
}
// --- END OF CHANGE ---

/**
 * מנתח פרופיל של משתמש ומספק משוב וטיפים לשיפור.
 * @param userNarrativeProfile הטקסט הנרטיבי המקיף של פרופיל המשתמש.
 * @returns Promise שמחזיר אובייקט ניתוח מובנה, או null במקרה של כישלון.
 */
export async function getProfileAnalysis(
  userNarrativeProfile: string
): Promise<AiProfileAnalysisResult | null> {
  console.log(
    '--- [AI Profile Advisor] Starting profile analysis with Gemini API ---'
  );

  if (!userNarrativeProfile) {
    console.error(
      '[AI Profile Advisor] Called with an empty user narrative profile.'
    );
    return null;
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro-latest',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.4,
    },
  });

  // --- START OF CHANGE ---
  // עודכנה ההנחיה כדי להסיר את photoFeedback ממבנה ה-JSON המבוקש
  const prompt = `
    You are an expert, warm, and encouraging dating profile coach for a religious Jewish audience. Your goal is to help the user improve their profile to attract the best possible matches. Based on the following comprehensive user profile, provide a structured JSON analysis. The entire output MUST be a valid JSON object in Hebrew.
    The JSON structure must be: { "personalitySummary": "string", "lookingForSummary": "string", "completenessReport": [{ "area": "string", "status": "COMPLETE" | "PARTIAL" | "MISSING", "feedback": "string" }], "actionableTips": [{ "area": "string", "tip": "string" }] }
    --- User Profile Narrative ---
    ${userNarrativeProfile}
    --- End of User Profile Narrative ---
  `;
  // --- END OF CHANGE ---

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const jsonString = response.text();

    if (!jsonString) {
      console.error(
        '[AI Profile Advisor] Gemini API returned an empty response.'
      );
      return null;
    }

    console.log(
      '--- [AI Profile Advisor] Successfully received analysis from Gemini API. ---'
    );
    return JSON.parse(jsonString) as AiProfileAnalysisResult;
  } catch (error) {
    console.error(
      '[AI Profile Advisor] Error generating profile analysis:',
      error
    );
    return null;
  }
}

/**
 * מגדיר את מבנה ה-JSON של ניתוח הצעה עבור משתמש הקצה.
 */
export interface AiSuggestionAnalysisResult {
  overallScore: number;
  matchTitle: string;
  matchSummary: string;
  compatibilityPoints: Array<{ area: string; explanation: string }>;
  pointsToConsider: Array<{ area: string; explanation: string }>;
  suggestedConversationStarters: string[];
}

/**
 * מנתח התאמה בין שני פרופילים ומחזיר ניתוח מותאם למשתמש הקצה,
 * עם דגש על טון חיובי ומעודד.
 * @param currentUserProfileText הפרופיל הנרטיבי של המשתמש הנוכחי.
 * @param suggestedUserProfileText הפרופיל הנרטיבי של המשתמש המוצע.
 * @returns Promise שמחזיר אובייקט ניתוח מובנה, או null במקרה של כישלון.
 */
export async function analyzeSuggestionForUser(
  currentUserProfileText: string,
  suggestedUserProfileText: string
): Promise<AiSuggestionAnalysisResult | null> {
  console.log(
    '--- [AI Suggestion Advisor] Starting suggestion analysis for user ---'
  );

  if (!currentUserProfileText || !suggestedUserProfileText) {
    console.error(
      '[AI Suggestion Advisor] Called with one or more empty profiles.'
    );
    return null;
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro-latest',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.5,
    },
  });

  const prompt = `
    You are a 'Matchmaking AI Advisor'. Your tone is positive, warm, and encouraging. Your goal is to help a user understand the potential of a match suggestion they received. Analyze the compatibility between 'My Profile' and the 'Suggested Profile'.
    Your entire output MUST be a valid JSON object in Hebrew.
    The JSON structure must be: { "overallScore": number, "matchTitle": "string", "matchSummary": "string", "compatibilityPoints": [{ "area": "string", "explanation": "string (user-friendly explanation)" }], "pointsToConsider": [{ "area": "string", "explanation": "string (rephrased positively, e.g., 'הוא אוהב טיולים ואת מעדיפה בית. זו הזדמנות נהדרת לחוות דברים חדשים יחד!')" }], "suggestedConversationStarters": ["string"] }
    
    --- My Profile ---
    ${currentUserProfileText}

    --- Suggested Profile ---
    ${suggestedUserProfileText}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const jsonString = response.text();

    if (!jsonString) {
      console.error(
        '[AI Suggestion Advisor] Gemini API returned an empty response.'
      );
      return null;
    }

    console.log(
      '--- [AI Suggestion Advisor] Successfully received analysis from Gemini API. ---'
    );
    return JSON.parse(jsonString) as AiSuggestionAnalysisResult;
  } catch (error) {
    console.error(
      '[AI Suggestion Advisor] Error generating suggestion analysis:',
      error
    );
    return null;
  }
}

/**
 * מייצר טקסט נימוק מותאם אישית עבור הצעת שידוך.
 * @param profile1Text הפרופיל הנרטיבי של צד א'.
 * @param profile2Text הפרופיל הנרטיבי של צד ב'.
 * @returns Promise שמחזיר מחרוזת טקסט עם הנימוק, או null במקרה של כישלון.
 */
export async function generateSuggestionRationale(
  profile1Text: string,
  profile2Text: string
): Promise<string | null> {
  console.log(
    '--- [AI Rationale Writer] Starting suggestion rationale generation ---'
  );
  if (!profile1Text || !profile2Text) {
    console.error(
      '[AI Rationale Writer] Called with one or more empty profiles.'
    );
    return null;
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
    You are a professional and sensitive matchmaker in the religious Jewish community. Your task is to write a warm, personal, and compelling justification ('matchingReason') for a match suggestion.
    Based on the two profiles provided, identify 2-3 key points of compatibility (values, life goals, personality traits, background) and weave them into a concise and positive paragraph.
    The output should be ONLY the justification text in Hebrew, without any additional titles, formatting, or explanations. Start directly with the text.

    **Example Output Structure:**
    "אני חושב/ת שיש כאן פוטנציאל להתאמה מצוינת מכמה סיבות. ראשית, שניכם ציינתם ש... וזה מראה על... שנית, הרקע ה... שלכם יכול להוות בסיס משותף חזק. בנוסף, נראה ששניכם חולקים... וזה יכול לתרום רבות לבניית קשר..."

    --- Profile 1 ---
    ${profile1Text}

    --- Profile 2 ---
    ${profile2Text}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    if (!text) {
      console.error(
        '[AI Rationale Writer] Gemini API returned an empty response.'
      );
      return null;
    }

    console.log(
      '--- [AI Rationale Writer] Successfully generated rationale. ---'
    );
    return text.trim();
  } catch (error) {
    console.error(
      '[AI Rationale Writer] Error generating suggestion rationale:',
      error
    );
    return null;
  }
}

/**
 * מגדיר את מבנה ה-JSON של אובייקט הנימוקים המלא.
 */
export interface FullRationaleResult {
  generalRationale: string;
  rationaleForParty1: string;
  rationaleForParty2: string;
}

/**
 * מייצר חבילת נימוקים מלאה עבור הצעת שידוך: כללי, ואישי לכל צד.
 * @param profile1Text הפרופיל הנרטיבי של צד א'.
 * @param profile2Text הפרופיל הנרטיבי של צד ב'.
 * @returns Promise שמחזיר אובייקט עם שלושת סוגי הנימוקים, או null במקרה של כישלון.
 */
export async function generateFullSuggestionRationale(
  profile1Text: string,
  profile2Text: string
): Promise<FullRationaleResult | null> {
  console.log(
    '--- [AI Rationale Writer] Starting full rationale package generation ---'
  );
  if (!profile1Text || !profile2Text) {
    console.error(
      '[AI Rationale Writer] Called with one or more empty profiles.'
    );
    return null;
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro-latest',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.6,
    },
  });

  const prompt = `
    You are a professional and sensitive matchmaker in the religious Jewish community. Your task is to write three distinct texts for a match suggestion based on the two provided user profiles.
    The entire output MUST be a valid JSON object in Hebrew, with the following exact structure:
    {
      "generalRationale": "A general, objective summary of the compatibility points. This is for the matchmaker's internal use.",
      "rationaleForParty1": "A personal and warm message for Party 1, explaining why Party 2 is a great match for them. Address them directly and highlight how Party 2's qualities align with Party 1's stated needs and desires. Use encouraging and persuasive language.",
      "rationaleForParty2": "A personal and warm message for Party 2, explaining why Party 1 is a great match for them. Do the same as above, but from Party 2's perspective."
    }

    **Key instructions for personal rationales (rationaleForParty1, rationaleForParty2):**
    - Start with a warm opening.
    - Reference specific details from the person's own profile to show you understand them.
    - Connect those details to specific strengths of the suggested partner.
    - Maintain a positive, professional, and slightly persuasive tone, without being pushy.
    - The goal is to make each person feel understood and that this suggestion was made with careful consideration for them personally.

    --- Profile 1 ---
    ${profile1Text}

    --- Profile 2 ---
    ${profile2Text}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const jsonString = response.text();

    if (!jsonString) {
      console.error(
        '[AI Rationale Writer] Gemini API returned an empty response for full rationale.'
      );
      return null;
    }

    console.log(
      '--- [AI Rationale Writer] Successfully generated full rationale package. ---'
    );
    return JSON.parse(jsonString) as FullRationaleResult;
  } catch (error) {
    console.error(
      '[AI Rationale Writer] Error generating full suggestion rationale:',
      error
    );
    return null;
  }
}

const aiService = {
  generateTextEmbedding,
  analyzePairCompatibility,
  getProfileAnalysis,
  analyzeSuggestionForUser,
  generateSuggestionRationale,
  generateFullSuggestionRationale,
};

export default aiService;
