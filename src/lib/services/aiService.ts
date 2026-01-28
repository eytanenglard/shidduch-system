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

interface GenerateTextOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// src/lib/services/aiService.ts

async function generateText(
  prompt: string,
  options: GenerateTextOptions = {}
): Promise<string> {
  // תיקון: שימוש במודל יציב יותר אם 2.0 עושה בעיות, אבל נשאיר את הבחירה שלך כברירת מחדל
  const { model = 'gemini-2.0-flash', temperature = 0.3, maxTokens = 4000 } = options;
  
  // תיקון: שימוש במפתח הנכון (fallback למה שמוגדר)
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GOOGLE_API_KEY in environment variables");
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature, maxOutputTokens: maxTokens },
        }),
      }
    );

    if (!response.ok) {
      // תיקון: קריאת תוכן השגיאה מגוגל כדי להבין למה זה נכשל
      const errorBody = await response.text();
      console.error(`[Gemini Error] Status: ${response.status}`, errorBody);
      throw new Error(`Gemini API error: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
  } catch (error) {
    console.error('[generateText] Unexpected error:', error);
    throw error;
  }
}

export async function generateTextEmbedding(
  text: string
): Promise<number[] | null> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
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
 * מגדיר את מבנה ה-JSON של ניתוח CV עמוק.
 */
export interface AiCvAnalysisResult {
  executiveSummary: string;
  personalityInsights: string[];
  valuesInsights: string[];
  careerTrajectory: {
    narrative: string;
    milestones: Array<{
      title: string;
      period: string;
      keyLearnings: string;
    }>;
  };
  redFlags: string[];
}

/**
 * מנתח קורות חיים לעומק ומפיק תובנות שדכניות.
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
        "Based on their roles, transitions, and achievements, list 3-4 inferred personality traits."
      ],
      "valuesInsights": [
        "Based on their choices (e.g., working in non-profit vs. finance, volunteering), list 2-3 inferred core values."
      ],
      "careerTrajectory": {
        "narrative": "Tell the story of their career. Is it a linear path of specialization? A journey of exploration?",
        "milestones": [
          {
            "title": "Role/Degree and Company/University",
            "period": "Timeframe",
            "keyLearnings": "What does this specific milestone teach us about the person?"
          }
        ]
      },
      "redFlags": [
        "List any potential points for the matchmaker to gently clarify."
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
    return parsedJson;

  } catch (error) {
    console.error(`[AI CV Deep Analysis] Error during deep CV analysis for locale: ${locale}:`, error);
    return null;
  }
}

/**
 * מנתח את ההתאמה בין שני פרופילים נרטיביים עבור שדכן.
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
 * מגדיר את מבנה ה-JSON של ניתוח פרופיל עבור המשתמש עצמו (הגרסה המקורית והמלאה).
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
 * מנתח פרופיל של משתמש ומספק משוב וטיפים לשיפור (הפונקציה המקורית).
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
    The entire output MUST be a valid JSON object in ${targetLanguage}.
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

    // ניקוי Markdown במידה וקיים
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7, -3).trim();
    } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.slice(3, -3).trim();
    }

    try {
        const parsedJson = JSON.parse(jsonString) as AiProfileAnalysisResult;
        console.log(
          '--- [AI Profile Advisor] Successfully received and parsed analysis from Gemini API. ---'
        );
        return parsedJson;
    } catch (parseError) {
        console.error(
          '[AI Profile Advisor] Failed to parse JSON response from Gemini.',
          parseError
        );
        throw new Error('Invalid JSON response from AI service.');
    }

  } catch (error) {
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
    The JSON structure must be: { "overallScore": number, "matchTitle": "string", "matchSummary": "string", "compatibilityPoints": [{ "area": "string", "explanation": "string (user-friendly explanation)" }], "pointsToConsider": [{ "area": "string", "explanation": "string (rephrased positively)" }], "suggestedConversationStarters": ["string"] }
    
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
      "generalRationale": "A general, objective summary of the compatibility points.",
      "rationaleForParty1": "A personal and warm message for Party 1, explaining why Party 2 is a great match for them.",
      "rationaleForParty2": "A personal and warm message for Party 2, explaining why Party 1 is a great match for them."
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
 * --- עודכן: דוח מודיעין לשדכן ---
 * יוצר "דוח מודיעין אופרטיבי לשדכן" (Matchmaker Intelligence Report).
 * פונקציה זו משתמשת בפרומפט החדש לניתוח עומק של השאלון והפרופיל.
 */
export async function generateNeshamaTechSummary(
  userNarrativeProfile: string,
  locale: 'he' | 'en' = 'he'
): Promise<AiNeshamaTechSummary | null> {
  console.log(
    `--- [AI Matchmaker Intelligence Report] Starting DYNAMIC report generation for locale: ${locale} ---`
  );

  if (!userNarrativeProfile) {
    console.error(
      '[AI Matchmaker Intelligence Report] Called with an empty user narrative profile.'
    );
    return null;
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.5, // Balanced for analytical tasks
    },
  });

  // הפרומפט החדש ("דוח מודיעין")
  const englishPromptInstructions = `
    Role: You are the Senior Analyst and Lead Matchmaker at NeshamaTech.
    Objective: Analyze the candidate's raw data (Technical Profile + Deep Questionnaire) and produce a sharp "Operational Intelligence Report" for the assigned matchmaker.
    
    Target Audience: Professional matchmakers only. This text will NOT be shown to the candidate.
    Tone: Clinical, diagnostic, psychological, "bottom-line". No marketing fluff, no sugar-coating.

    --- Critical Instruction: Data Depth Assessment ---
    1. **Full Scenario (Questionnaire available):** Perform a deep cross-analysis using "Budget Allocations" (Values/Personality), Dilemmas, and Open-ended answers.
    2. **Partial Scenario (Only "About Me" & Tech specs):** 
       - Do NOT hallucinate missing data.
       - Infer personality from the **writing style** in the "About Me" section (laconic vs. detailed, emotional vs. logical, formal vs. slang).
       - Explicitly state in the report that critical questionnaire data is missing.

    --- Report Structure (6 Mandatory Paragraphs + Action Item) ---

    Paragraph 1: Identity & Family Roots (The Roots)
    Combine the dry stats with the family background to provide a socio-economic and sectorial context.
    - **Stats:** Age, Height, Marital Status (+Children), City, Origin/Ethnicity.
    - **Family:** Parents' occupations (indicates educational/economic background), Parents' marital status, Sibling position (E.g., Eldest/Youngest).
    - *Example:* "26, Single, Jerusalemite (Ashkenazi). Youngest son of an academic family (Father Doctor, Mother Teacher), parents divorced."

    Paragraph 2: Career, Education & Drive (The Drive)
    Analyze the professional status and ambition level.
    - **Track:** Service type (Combat/Hesder/National Service/Exempt), Education (Academic/Torah), Current Occupation.
    - **Ambition Analysis:** Correlate the job with questionnaire answers regarding "Money Attitude," "Definition of Success," and "Values Budget" (Career vs. Family focus).
    - **Diagnosis:** Is he a "High-Achiever/Careerist" or seeking "Balance/Simplicity"? Is there occupational stability?

    Paragraph 3: Religious-Hashkafic Profile (The Hashkafa)
    Drill down beyond the dry label.
    - **External Markers:** Kippah type/Head covering, Shomer Negiah (Yes/No/Flexible).
    - **Essence:** Attitude towards Army/State (Zionism), Secular culture consumption, Daily Torah study (Fixed times vs. Occasional).
    - **Resolution:** Is he "Hardcore Torah" looking for a closed environment, or "Light/Modern"? Is there a gap between his declaration and his practice?

    Paragraph 4: Personality & Vibe (The Persona)
    Who is the person in the room?
    - **Budget Analysis:** Which traits got the most points? (Humor? Sensitivity? Intellect?).
    - **Energy:** Based on "Social Battery" and "Ideal Vacation" – Is he Extroverted/High-energy or Introverted/Homebody? "Heavy" or "Chill"?
    - **Resilience:** How did he answer the "Bad Day" or "Failure" questions?

    Paragraph 5: Relationship & Family Dynamics (The Relationship)
    How will he function as a partner?
    - **Conflict Style:** Withdraws? Confronts? Analyzes logically?
    - **Extended Family:** What was his answer regarding "Parental Involvement"? (Crucial for potential friction).
    - **Roles:** Egalitarian or Traditional approach to household/career?

    Paragraph 6: The Desired Partner (Target Audience)
    Who is he looking for (vs. who he needs)?
    - Summarize his "Deal Breakers."
    - What does he value in a partner? (Beauty vs. Intellect vs. Character - based on point allocation).
    - Note if there is an unrealistic gap between what he brings and what he demands.

    === Bottom Line for Matchmaker (Action Item) ===
    A concise operational summary. Who to search for?
    - *Example:* "Look for a girl from a high-quality, intelligent home, National-Religious (Ulpana style), who values a quiet and serious type. Do NOT suggest loud personalities or aggressive careerists."
    - *If data is partial:* Start with: "Must urge candidate to complete the deep questionnaire."

    --- Output Format ---
    The output must be a valid JSON object containing a single field: 'summaryText'.
    The text inside must be in **Hebrew**.
    Use \n for line breaks between paragraphs.
  `;

  // אנחנו משתמשים בפרומפט האנגלית (שמחזיר עברית) עבור שתי השפות,
  // כדי לשמור על אחידות במבנה הדוח המקצועי לשדכן.
  const prompt = `
    ${englishPromptInstructions}

    --- User Profile Narrative for Analysis ---
    ${userNarrativeProfile}
    --- End of User Profile Narrative ---
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

    return JSON.parse(jsonString) as AiNeshamaTechSummary;
  } catch (error) {
    console.error(
      `[AI Matchmaker Intelligence Report] Error during report generation for locale: ${locale}:`,
      error
    );
    return null;
  }
}

/**
 * --- חדש: ממשק לסיכום ממוקד לשדכן ---
 * מכיל רק סיכום אישיות ומה מחפש.
 */
export interface AiProfileSummaryResult {
  personalitySummary: string;
  lookingForSummary: string;
}

/**
 * --- חדש: פונקציה לסיכום ממוקד לשדכן ---
 * מייצרת סיכום ממוקד (אישיות + מה מחפש) לשמירה ב-DB עבור השדכנים.
 */
export async function generateProfileSummary(
  userNarrativeProfile: string,
  language: 'he' | 'en' = 'he'
): Promise<AiProfileSummaryResult | null> {
  console.log('--- [AI Profile Summary (Detailed)] Starting detailed summary generation ---');

  if (!userNarrativeProfile) return null;

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.4, // שמרני יותר כדי להישמד לעובדות
    },
  });

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

    const parsedJson = JSON.parse(jsonString) as AiProfileSummaryResult;
    return parsedJson;

  } catch (error) {
    console.error('[AI Profile Summary] Error:', error);
    return null;
  }
}
// ===========================================
// הוסף את הקוד הבא לקובץ src/lib/services/aiService.ts
// מיקום: לפני ה-export הסופי (לפני const aiService = { ... })
// ===========================================

/**
 * מבנה הפרופיל הוירטואלי שה-AI מייצר
 */
export interface GeneratedVirtualProfile {
  // מידע בסיסי שנוסח מהטקסט
  inferredAge: number;
  inferredCity: string | null;
  inferredOccupation: string | null;
  inferredMaritalStatus: string | null;
  inferredEducation: string | null;
  
  // סיכומים (פורמט זהה ל-aiProfileSummary)
  personalitySummary: string;
  lookingForSummary: string;
  
  // העדפות לחיפוש (מה המועמד הוירטואלי מחפש)
  preferredAgeMin: number;
  preferredAgeMax: number;
  preferredReligiousLevels: string[];
  preferredLocations: string[];
  
  // נקודות מפתח לאלגוריתם
  keyTraits: string[];
  idealPartnerTraits: string[];
  dealBreakers: string[];
  
  // טקסט סיכום מאוחד להצגה לשדכן
  displaySummary: string;
}

/**
 * יוצר פרופיל וירטואלי מטקסט חופשי שהשדכן מזין.
 * הפרופיל משמש לחיפוש התאמות כאילו היה יוזר אמיתי.
 * 
 * @param sourceText - הטקסט החופשי שהשדכן כתב
 * @param gender - מגדר המועמד הוירטואלי
 * @param religiousLevel - רמה דתית (נבחרת ע"י השדכן)
 * @returns פרופיל וירטואלי מובנה, או null במקרה של כשלון
 */
export async function generateVirtualProfile(
  sourceText: string,
  gender: 'MALE' | 'FEMALE',
  religiousLevel: string
): Promise<GeneratedVirtualProfile | null> {
  console.log(`--- [AI Virtual Profile] Starting generation for ${gender}, ${religiousLevel} ---`);

  if (!sourceText || sourceText.trim().length < 20) {
    console.error('[AI Virtual Profile] Source text is too short.');
    return null;
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.4,
    },
  });

  const genderHebrew = gender === 'MALE' ? 'גבר' : 'אישה';
  const lookingForGender = gender === 'MALE' ? 'אישה' : 'גבר';

  const prompt = `
    אתה שדכן מקצועי מנוסה בקהילה הדתית-לאומית בישראל.
    קיבלת תיאור טקסטואלי של מועמד/ת משדכן אחר, והמשימה שלך היא ליצור "פרופיל וירטואלי" מובנה שישמש למציאת התאמות.

    === פרטים שנבחרו על ידי השדכן ===
    - מגדר: ${genderHebrew}
    - רמה דתית: ${religiousLevel}

    === הטקסט שהשדכן כתב ===
    ${sourceText}
    === סוף הטקסט ===

    === המשימה שלך ===
    נתח את הטקסט וצור פרופיל מובנה. אם מידע מסוים לא מופיע בטקסט, נסה להסיק אותו באופן הגיוני או השאר null.

    === פורמט הפלט (JSON בעברית) ===
    {
      "inferredAge": <מספר - גיל משוער, אם לא צוין הערך 25-30 לפי הקשר>,
      "inferredCity": "<עיר אם צוינה, או null>",
      "inferredOccupation": "<מקצוע אם צוין, או null>",
      "inferredMaritalStatus": "<רווק/גרוש/אלמן וכו', או null>",
      "inferredEducation": "<השכלה אם צוינה, או null>",
      
      "personalitySummary": "<פסקה של 3-5 משפטים המתארת את האישיות, הערכים, והאופי של המועמד/ת. כתוב בגוף שלישי.>",
      
      "lookingForSummary": "<פסקה של 3-5 משפטים המתארת מה המועמד/ת מחפש/ת בבן/בת זוג. כתוב בגוף שלישי.>",
      
      "preferredAgeMin": <מספר - גיל מינימלי לבן/בת זוג>,
      "preferredAgeMax": <מספר - גיל מקסימלי לבן/בת זוג>,
      "preferredReligiousLevels": ["<רמות דתיות מתאימות>"],
      "preferredLocations": ["<מיקומים מועדפים, או מערך ריק אם לא צוין>"],
      
      "keyTraits": ["<3-5 תכונות מרכזיות של המועמד/ת>"],
      "idealPartnerTraits": ["<3-5 תכונות שהמועמד/ת מחפש/ת בבן/בת זוג>"],
      "dealBreakers": ["<קווים אדומים אם צוינו, או מערך ריק>"],
      
      "displaySummary": "<סיכום מאוחד של 4-6 משפטים להצגה לשדכן. כולל: מי המועמד, מה האופי, ומה מחפש. זה הטקסט שהשדכן יראה ויוכל לערוך.>"
    }

    === הנחיות חשובות ===
    1. אם הטקסט מזכיר "${lookingForGender}" ספציפי/ת - השתמש במידע הזה עבור העדפות.
    2. טווח גילאים לבן/בת זוג: בדרך כלל גברים מחפשים צעירות ב-1-5 שנים, נשים מחפשות גדולים ב-0-4 שנים.
    3. רמות דתיות תואמות: בדרך כלל +-2 רמות מהרמה שנבחרה.
    4. הסיכום (displaySummary) צריך להיות טבעי, קריא, ומקצועי - כאילו שדכן כתב אותו.
    5. כל הטקסטים בעברית.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    let jsonString = response.text();

    if (!jsonString) {
      console.error('[AI Virtual Profile] Empty response from Gemini.');
      return null;
    }

    // ניקוי markdown אם יש
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7, -3).trim();
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.slice(3, -3).trim();
    }

    const parsedProfile = JSON.parse(jsonString) as GeneratedVirtualProfile;
    
    console.log(`[AI Virtual Profile] Successfully generated profile. Age: ${parsedProfile.inferredAge}, Traits: ${parsedProfile.keyTraits?.length || 0}`);
    
    return parsedProfile;

  } catch (error) {
    console.error('[AI Virtual Profile] Error generating profile:', error);
    return null;
  }
}


// ייצוא כל הפונקציות כאובייקט אחד
const aiService = {
  generateTextEmbedding,
  analyzePairCompatibility,
  getProfileAnalysis, // פונקציה מקורית (יועץ למשתמש) - נשמרה!
  analyzeSuggestionForUser,
  generateSuggestionRationale,
  generateFullSuggestionRationale,
  generateNeshamaTechSummary, // פונקציה מעודכנת (דוח מודיעין)
  analyzeCvInDepth,
  generateProfileSummary, // פונקציה חדשה (סיכום ממוקד לשדכן ב-DB)
  generateVirtualProfile, 
    generateText,
};

export default aiService;


