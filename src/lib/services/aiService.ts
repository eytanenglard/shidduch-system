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

// בקובץ: src/lib/services/aiService.ts

/**
 * מגדיר את מבנה ה-JSON של ניתוח CV עמוק, בהשראת עולמות השאלון.
 */
export interface AiCvAnalysisResult {
  executiveSummary: string; // סיכום מנהלים קצר: מי האדם מאחורי ה-CV ב-2-3 משפטים.
  personalityInsights: string[]; // תובנות על אישיות (שאפתנות, יציבות, יצירתיות וכו').
  valuesInsights: string[]; // תובנות על ערכים (נתינה, צמיחה, ביטחון וכו').
  careerTrajectory: {
    narrative: string; // סיפור המסע המקצועי: איך התפתח/ה ולאן הוא/היא שואפ/ת.
    milestones: Array<{
      title: string;
      period: string;
      keyLearnings: string; // מה ניתן ללמוד על האדם משלב זה.
    }>;
  };
  redFlags: string[]; // דגלים אדומים פוטנציאליים (חוסר יציבות, פערים לא מוסברים וכו').
}

// בקובץ: src/lib/services/aiService.ts

/**
 * מנתח קורות חיים לעומק ומפיק תובנות שדכניות בהשראת "עולמות" השאלון של NeshamaTech.
 * @param cvText הטקסט המלא של קורות החיים.
 * @param locale שפת הפלט הרצויה.
 * @returns Promise שמחזיר אובייקט ניתוח מובנה, או null במקרה של כישלון.
 */
export async function analyzeCvInDepth(
  cvText: string,
  locale: 'he' | 'en' = 'he'
): Promise<AiCvAnalysisResult | null> {
  console.log(`--- [AI CV Deep Analysis] Starting CV analysis for matchmaker in locale: ${locale} ---`);

  if (!cvText || cvText.trim().length < 50) {
    console.error('[AI CV Deep Analysis] CV text is too short to analyze.');
    return null;
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  });

  const targetLanguage = locale === 'he' ? 'Hebrew' : 'English';

  const prompt = `
    You are an elite Matchmaker-Analyst at NeshamaTech. You are analyzing a CV not just for facts, but for deep insights into the candidate's character, values, and life story. Your analysis is guided by NeshamaTech's "Five Worlds" philosophy (Personality, Values, Partnership, Partner, Religion).

    Your task is to translate the professional journey in the CV into a rich, multi-faceted profile for the matchmaking team.
    The entire output MUST be a valid JSON object in ${targetLanguage}. Do NOT use markdown.

    The JSON structure MUST be:
    {
      "executiveSummary": "A 2-3 sentence 'bottom line' summary. Who is this person professionally and what does their career path reveal about their core being?",
      "personalityInsights": [
        "Based on their roles, transitions, and achievements, list 3-4 inferred personality traits. E.g., 'Shows high ambition and goal-orientation through rapid promotions', 'Demonstrates stability and loyalty with long tenure at one company', 'Indicates creativity by shifting from a technical role to a product role'."
      ],
      "valuesInsights": [
        "Based on their choices (e.g., working in non-profit vs. finance, volunteering), list 2-3 inferred core values. E.g., 'Choice of teaching career suggests a value of contribution and giving back', 'Focus on startups indicates a high value on innovation and risk-taking', 'Volunteering section highlights a value of community involvement'."
      ],
      "careerTrajectory": {
        "narrative": "Tell the story of their career. Is it a linear path of specialization? A journey of exploration? What is the underlying theme of their professional development?",
        "milestones": [
          {
            "title": "Role/Degree and Company/University",
            "period": "Timeframe (e.g., '2018-2022')",
            "keyLearnings": "What does this specific milestone teach us about the person? E.g., 'This demanding role at a top firm shows resilience and high standards', 'Studying philosophy alongside engineering points to intellectual curiosity'."
          }
        ]
      },
      "redFlags": [
        "List any potential points for the matchmaker to gently clarify. E.g., 'Unexplained gap between 2019-2020', 'Frequent job changes might suggest restlessness, worth exploring', 'Lack of clear progression could indicate a lack of ambition, or satisfaction with their current level'."
      ]
    }

    --- CANDIDATE'S CV TEXT ---
    ${cvText}
    --- END CV TEXT ---
  `;

  try {
    const result = await model.generateContent(prompt);
    const jsonString = result.response.text();

    if (!jsonString) {
      console.error(`[AI CV Deep Analysis] Gemini API returned an empty response for locale: ${locale}.`);
      return null;
    }

    const cleanJsonString = jsonString.replace(/^```json\s*|```\s*$/g, '').trim();
    const parsedJson = JSON.parse(cleanJsonString) as AiCvAnalysisResult;
    console.log(`--- [AI CV Deep Analysis] Successfully parsed deep CV analysis for locale: ${locale}. ---`);
    return parsedJson;

  } catch (error) {
    console.error(`[AI CV Deep Analysis] Error during deep CV analysis for locale: ${locale}:`, error);
    return null;
  }
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
    model: 'gemini-2.5-flash',
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
  userNarrativeProfile: string,
   language: 'he' | 'en' = 'he' 
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
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.4,
    },
  });
 const targetLanguage = language === 'he' ? 'Hebrew' : 'English'; 

  const prompt = `
    You are an expert, warm, and encouraging dating profile coach for a religious Jewish audience. Your goal is to help the user improve their profile to attract the best possible matches. Based on the following comprehensive user profile, provide a structured JSON analysis.
    The entire output MUST be a valid JSON object in Hebrew.
    IMPORTANT: Do NOT wrap the JSON in markdown backticks (e.g., \`\`\`json). Output ONLY the raw JSON object.
    The JSON structure must be: { "personalitySummary": "string", "lookingForSummary": "string", "completenessReport": [{ "area": "string", "status": "COMPLETE" | "PARTIAL" | "MISSING", "feedback": "string" }], "actionableTips": [{ "area": "string", "tip": "string" }] }
    The entire output MUST be a valid JSON object in ${targetLanguage}.
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
    model: 'gemini-2.5-flash',
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

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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
    model: 'gemini-2.5-flash',
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
  locale: 'he' | 'en' = 'he'
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
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.6,
    },
  });

  // --- הגדרת פרומפטים נפרדים לכל שפה ---

  const hebrewPromptInstructions = `
    את/ה שדכן/ית מומחה/ית וקופירייטר/ית ב-NeshamaTech, שירות שידוכים המשלב טכנולוגיה מתקדמת עם ליווי אנושי וחם. את/ה לא רק כותב/ת, את/ה מספר/ת סיפורים שרואה את הנשמה (Neshama) שמאחורי הנתונים. המשימה שלך היא לזקק את פרופיל הנתונים המקיף של המועמד/ת ל"תקציר היכרות" ('דבר המערכת') – טקסט פורטרט בן 3-4 פסקאות, שהוא אישי, מעורר כבוד, ומצית סקרנות אמיתית אצל התאמה פוטנציאלית. הטון הוא שיא של מקצועיות, חום, ענווה ואותנטיות.

    **עקרונות מנחים לסינתזה עמוקה (החלק החשוב ביותר):**
    המטרה שלך היא לא לדווח על עובדות, אלא לחבר אותן לנרטיב משמעותי. חפש/י את החוט המקשר בין ה"עולמות" השונים בפרופיל:
    - **חיבור אישיות-ערכים:** איך תכונות האופי של המועמד/ת (עולם האישיות) באות לידי ביטוי בסדרי העדיפויות שהגדיר/ה (עולם הערכים)?
    - **חיבור סיפור-חזון:** כיצד מסלול החיים (השכלה, קריירה, מסע דתי) עיצב את מה שהם מחפשים בזוגיות ובפרטנר (עולמות הזוגיות והפרטנר)?
    - **איתור "המתח היצירתי":** חפש/י שילובים ייחודיים ומעניינים. למשל: "איש הייטק עם נשמה של אמן", "אשת אקדמיה שמוצאת את הרוחניות שלה בטבע", "קצין קרבי שמנגן ניגונים חסידיים". אלו היהלומים שיוצרים סיפור בלתי נשכח.
- **שילוב ניתוח CV:** אם קיים בפרופיל חלק של "ניתוח קורות חיים", השתמש/י בו כעוגן מרכזי לבניית הפסקה על "מסלול החיים". סיכום ה-CV מספק את השלד המקצועי והעובדתי של הסיפור.
    **מבנה התקציר (נוסחת NeshamaTech):**

    1.  **הפתיחה (הפורטרט):** פתח/י במשפט אחד, חזק ומדויק, הלוכד קונפליקט פנימי מעניין או שילוב תכונות ייחודי של המועמד/ת. זו הכותרת הבלתי נראית של הפרופיל. (ראה דוגמת "דניאל": קוד לוגי מול סוגיה תלמודית).
    2.  **מסלול החיים (הנרטיב):** בפסקה זו, ארג/י את נקודות המפתח בחייו/ה (לימודים, צבא, קריירה, רקע דתי) לסיפור קוהרנטי של צמיחה ותכלית. הראה/י כיצד אירוע אחד הוביל לאחר, ואיך כל שלב עיצב את מי שהם היום. אל תציין/י עובדות, הסבר/י את משמעותן.
    3.  **החזון לזוגיות (השאיפה):** תאר/י באופן חי וברור את הבית והשותפות שהם שואפים לבנות, בהתבסס על תשובותיהם בעולמות הזוגיות והפרטנר. השתמש/י בשפה של ערכים, חזון וצמיחה משותפת, לא ברשימת מכולת של דרישות.
    4.  **חותמת המערכת (הערת NeshamaTech):** סיים/י במשפט מקצועי אחד, מנקודת המבט שלנו כשדכנים, המסכם תכונה מרכזית או שילוב נדיר שהופך את המועמד/ת למיוחד/ת בעינינו. (ראה דוגמת "דניאל": "אנו מתרשמים מהשילוב הנדיר של רצינות, עומק תורני ויכולת ביצוע...").

    **כללי ברזל (עשה ואל תעשה):**
    - **עשה:** השתמש/י בשפה חיובית, עשירה ומכבדת.
    - **עשה:** חבר/י את הנקודות, סנתז/י ולא רק סכם/י.
    - **אל תעשה:** אל תשתמש/י בקלישאות ("בחור/ה איכותי/ת", "טוב/ת לב"). הראה/י את האיכות, אל תצהיר/י עליה.
    - **אל תעשה:** אל תפרט/י רשימות של תכונות או תחביבים. שלב/י אותם בתוך הסיפור.
  `;

  const englishPromptInstructions = `
    You are an expert matchmaker and copywriter at NeshamaTech, a service that blends advanced technology with warm, human guidance. You are not just a writer; you are a storyteller who sees the soul (Neshama) behind the data. Your mission is to distill a candidate's comprehensive profile into an "Introduction Summary" – a 3-4 paragraph portrait that is personal, respectful, and sparks genuine curiosity in a potential match. The tone is the pinnacle of professionalism, warmth, humility, and authenticity.

    **Guiding Principles for Deep Synthesis (The Most Important Part):**
    Your goal is not to report facts, but to connect them into a meaningful narrative. Look for the thread that connects the different "Worlds" of the profile:
    - **Personality-Values Connection:** How do the candidate's character traits (Personality World) manifest in their stated priorities (Values World)?
    - **Story-Vision Connection:** How has their life path (education, career, spiritual journey) shaped what they seek in a relationship and a partner (Relationship & Partner Worlds)?
    - **Find the "Creative Tension":** Look for unique and interesting combinations. For example: "A high-tech professional with an artist's soul," "An academic who finds her spirituality in nature," "A combat officer who plays soulful Hasidic melodies." These are the gems that create an unforgettable story.
- **Integrating CV Analysis:** If the profile includes a "CV Analysis" section, use it as a central anchor for constructing the "Life Path" paragraph. The CV summary provides the professional and factual backbone of their story.
    **The Summary Structure (The NeshamaTech Formula):**

    1.  **The Overture (The Portrait):** Open with a single, powerful, and precise sentence that captures an interesting internal conflict or a unique combination of traits. This is the profile's invisible headline. (Reference the "Daniel" example: logical code vs. Talmudic discourse).
    2.  **The Life Path (The Narrative):** In this paragraph, weave the key points of their life (studies, army service, career, religious background) into a coherent story of growth and purpose. Show how one event led to the next, and how each stage shaped who they are today. Don't state facts; explain their significance.
    3.  **The Vision for Partnership (The Aspiration):** Vividly describe the home and partnership they aspire to build, based on their answers in the Relationship and Partner worlds. Use the language of values, vision, and mutual growth, not a grocery list of requirements.
    4.  **The System's Stamp (NeshamaTech's Note):** Conclude with a single professional sentence, from our perspective as matchmakers, summarizing a key trait or a rare combination that makes the candidate special in our eyes. (Reference the "Daniel" example: "we are impressed by the rare combination of seriousness, Torah depth, and executive ability...").

    **Golden Rules (Dos and Don'ts):**
    - **Do:** Use positive, rich, and respectful language.
    - **Do:** Connect the dots. Synthesize, don't just summarize.
    - **Don't:** Use clichés ("a quality person," "kind-hearted"). Show the quality, don't just state it.
    - **Don't:** List traits or hobbies. Weave them into the story.
  `;

  // בחירה דינמית של הפרומפט ושפת היעד
  const targetLanguage = locale === 'he' ? 'Hebrew' : 'English';
  const promptInstructions =
    locale === 'he' ? hebrewPromptInstructions : englishPromptInstructions;

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
  analyzeCvInDepth,
};

export default aiService;