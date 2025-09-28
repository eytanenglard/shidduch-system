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

  const targetLanguage = language === 'he' ? 'Hebrew' : 'English';

  const prompt = `
    You are a "Matchmaking AI Expert" for a religious Jewish dating platform. Your goal is to analyze the compatibility of two user profiles and provide a structured, insightful, and helpful analysis for the matchmaker.
    
    IMPORTANT: Your entire JSON output, including all string values (keys and explanations), must be in ${targetLanguage}.

    Your output MUST be a valid JSON object. Do NOT wrap the JSON in markdown backticks (e.g., \`\`\`json). Output ONLY the raw JSON object.
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
    // כאן אין צורך בניקוי מיוחד כי אנחנו מצפים ל-JSON נקי, אבל אם יתחילו בעיות נוסיף גם פה
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
}

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

  const prompt = `
    You are an expert, warm, and encouraging dating profile coach for a religious Jewish audience. Your goal is to help the user improve their profile to attract the best possible matches. Based on the following comprehensive user profile, provide a structured JSON analysis.
    The entire output MUST be a valid JSON object in Hebrew.
    IMPORTANT: Do NOT wrap the JSON in markdown backticks (e.g., \`\`\`json). Output ONLY the raw JSON object.
    The JSON structure must be: { "personalitySummary": "string", "lookingForSummary": "string", "completenessReport": [{ "area": "string", "status": "COMPLETE" | "PARTIAL" | "MISSING", "feedback": "string" }], "actionableTips": [{ "area": "string", "tip": "string" }] }
    
    --- User Profile Narrative ---
    ${userNarrativeProfile}
    --- End of User Profile Narrative ---
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    let jsonString = response.text();

    if (!jsonString) {
      console.error(
        '[AI Profile Advisor] Gemini API returned an empty response.'
      );
      return null;
    }

    // ======================= תהליך הניקוי והפענוח הבטוח =======================
    
    // שלב 1: בדוק אם התשובה עטופה ב-markdown והסר אותו אם כן.
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7, -3).trim();
    } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.slice(3, -3).trim();
    }

    try {
        // שלב 2: נסה לפענח את ה-JSON הנקי.
        const parsedJson = JSON.parse(jsonString) as AiProfileAnalysisResult;
        console.log(
          '--- [AI Profile Advisor] Successfully received and parsed analysis from Gemini API. ---'
        );
        return parsedJson;
    } catch (parseError) {
        // שלב 3: אם הפענוח נכשל, הדפס שגיאה מפורטת ואת התשובה הגולמית לטובת דיבאגינג.
        console.error(
          '[AI Profile Advisor] Failed to parse JSON response from Gemini.',
          parseError
        );
        console.error('--- RAW AI RESPONSE THAT FAILED PARSING ---');
        console.error(jsonString);
        console.error('--- END OF RAW AI RESPONSE ---');
        
        // זרוק שגיאה חדשה כדי שהפונקציה שקראה לנו תדע שהתהליך נכשל.
        throw new Error('Invalid JSON response from AI service.');
    }
    // ======================= סוף תהליך הניקוי =======================

  } catch (error) {
    // תפיסת שגיאות תקשורת עם ה-API או את השגיאה שזרקנו מה-catch הפנימי.
    console.error(
      '[AI Profile Advisor] Error during profile analysis process:',
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
 * מנתח התאמה בין שני פרופילים ומחזיר ניתוח מותאם למשתמש הקצה.
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
    IMPORTANT: Do NOT wrap the JSON in markdown backticks (e.g., \`\`\`json). Output ONLY the raw JSON object.
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
 * מייצר חבילת נימוקים מלאה עבור הצעת שידוך.
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
    IMPORTANT: Do NOT wrap the JSON in markdown backticks (e.g., \`\`\`json). Output ONLY the raw JSON object.

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
export interface AiNeshamaTechSummary {
  summaryText: string;
}

/**
 * יוצר סיכום היכרות מקצועי וחם עבור פרופיל מועמד.
 * @param userNarrativeProfile הטקסט הנרטיבי המקיף של פרופיל המשתמש.
 * @returns Promise שמחזיר אובייקט עם טקסט הסיכום, או null במקרה של כישלון.
 */
export async function generateNeshamaTechSummary(
  userNarrativeProfile: string,
  locale: 'he' | 'en' = 'he' // קבלת פרמטר שפה עם ערך ברירת מחדל
): Promise<AiNeshamaTechSummary | null> {
  console.log(
    `--- [AI NeshamaTech Summary] Starting DYNAMIC summary generation for locale: ${locale} ---`
  );

  if (!userNarrativeProfile) {
    console.error(
      '[AI NeshamaTech Summary] Called with an empty user narrative profile.'
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

  // --- הגדרת פרומפטים נפרדים לכל שפה ---

  const hebrewPromptInstructions = `
    את/ה שדכן/ית מומחה/ית וקופירייטר/ית ב-NeshamaTech, שירות שידוכים יוקרתי לקהילה הדתית-לאומית/אקדמית בישראל. את/ה משלב/ת אינטליגנציה רגשית עמוקה עם יכולות אנליטיות חדות. המשימה שלך היא לכתוב "תקציר היכרות" בעברית – שהוא חם, מרגש, מקצועי ובעל תובנות – עבור מועמד/ת, בהתבסס על פרופיל הנתונים המקיף שלו/ה.

    הסיכום מיועד להצגה בפני התאמות פוטנציאליות. המטרה היא לרקום נרטיב סוחף הלוכד את מהות האדם, מעבר לרשימת עובדות. הטון צריך להיות אותנטי, מכבד, מקצועי, ועם זאת להרגיש אישי וחם.

    **יש לבנות את הפלט מ-3-4 פסקאות נפרדות בעברית, לפי המבנה הבא:**

    1.  **הפורטרט האישי (פתיחה):** פתח/י במשפט סוחף הלוכד את אישיות הליבה של המועמד/ת. שלב/י את שמם עם תכונה מרכזית או שילוב ייחודי שמאפיין אותם.
    2.  **עמודי התווך של החיים (גוף הסיכום):** בפסקה זו, סנתז/י את המידע על עמודי התווך המרכזיים בחייו/ה (מקצועי/אקדמי, רוחני/ערכי, ואישי/חברתי) וקשר/י ביניהם כדי לספר סיפור על מי הם.
    3.  **החזון לזוגיות (לקראת סיום):** תאר/י מה הם מחפשים בבן/בת זוג ובחיים המשותפים כחזון לבית שהם שואפים לבנות.
    4.  **הערת NeshamaTech (סיום אופציונלי):** סיים/י במשפט מקצועי קצר מנקודת המבט של השירות.

    **הנחיות מפתח:** השתמש/י בשפה חיובית ועשירה, הדגש/י סינתזה וחיבור בין נתונים, ושמור/י על טון מקצועי אך נגיש וחם.
  `;

  const englishPromptInstructions = `
    You are an expert matchmaker and copywriter at NeshamaTech, a premium matchmaking service for the Israeli National-Religious/Academic community. You blend deep emotional intelligence with sharp analytical skills. Your task is to write an "Introduction Summary" in English – one that is warm, engaging, professional, and insightful – for a candidate, based on their comprehensive profile data.

    This summary is for potential matches. Your goal is to weave a compelling narrative that captures the person's essence, moving beyond a simple list of facts. The tone must be authentic, respectful, and professional, yet feel personal and warm.

    **Structure the output into 3-4 distinct paragraphs in English, following this structure:**

    1.  **The Personal Portrait (Opening):** Start with a compelling sentence that captures the candidate's core personality. Blend their name with a key trait or a unique combination that defines them.
    2.  **Pillars of Life (Body):** In this paragraph, synthesize information about the main pillars of their life (Professional/Academic, Spiritual/Values, and Personal/Social), connecting the facts to tell a story of who they are.
    3.  **The Vision for Partnership (Towards the end):** Describe what they are looking for in a life partner and the home they envision building, focusing on shared values and mutual growth.
    4.  **NeshamaTech's Note (Optional Closing):** Conclude with a brief, professional sentence from the service's perspective.

    **Key Guidelines:** Use positive, rich language. Emphasize synthesis and connection over mere listing. Maintain a professional yet warm and accessible tone.
  `;

  // בחירה דינמית של הפרומפט ושפת היעד
  const targetLanguage = locale === 'he' ? 'Hebrew' : 'English';
  const promptInstructions = locale === 'he' ? hebrewPromptInstructions : englishPromptInstructions;

  const prompt = `
    ${promptInstructions}

    **Output Format:** Your entire output MUST be a valid JSON object in ${targetLanguage}. Do NOT wrap it in markdown backticks. Output ONLY the raw JSON object with the following structure:
      {
        "summaryText": "The full, multi-paragraph summary text in ${targetLanguage}, with paragraphs separated by a newline character (\\n)."
      }

    --- User Profile Narrative for Analysis ---
    ${userNarrativeProfile}
    --- End of User Profile Narrative ---
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const jsonString = response.text();

    if (!jsonString) {
      console.error(
        `[AI NeshamaTech Summary] Gemini API returned an empty response for locale: ${locale}.`
      );
      return null;
    }

    // ניקוי ופענוח בטוח של ה-JSON
    let cleanJsonString = jsonString;
    if (cleanJsonString.startsWith('```json')) {
      cleanJsonString = cleanJsonString.slice(7, -3).trim();
    } else if (cleanJsonString.startsWith('```')) {
      cleanJsonString = cleanJsonString.slice(3, -3).trim();
    }
    
    try {
      const parsedJson = JSON.parse(cleanJsonString) as AiNeshamaTechSummary;
      console.log(
        `--- [AI NeshamaTech Summary] Successfully received and parsed summary from Gemini API for locale: ${locale}. ---`
      );
      return parsedJson;
    } catch (parseError) {
      console.error(
        `[AI NeshamaTech Summary] Failed to parse JSON response for locale: ${locale}.`,
        parseError
      );
      console.error('--- RAW AI RESPONSE THAT FAILED PARSING ---');
      console.error(jsonString);
      console.error('--- END OF RAW AI RESPONSE ---');
      throw new Error('Invalid JSON response from AI service.');
    }

  } catch (error) {
    console.error(
      `[AI NeshamaTech Summary] Error during summary generation for locale: ${locale}:`,
      error
    );
    return null;
  }
}


// ייצוא כל הפונקציות כאובייקט אחד
const aiService = {
  generateTextEmbedding,
  analyzePairCompatibility,
  getProfileAnalysis,
  analyzeSuggestionForUser,
  generateSuggestionRationale,
  generateFullSuggestionRationale,
  generateNeshamaTechSummary, 
};

export default aiService;