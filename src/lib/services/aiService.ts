// src/lib/services/aiService.ts

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.error("[FATAL ERROR] GOOGLE_API_KEY is not set in .env or .env.local!");
  throw new Error("GOOGLE_API_KEY must be set.");
}

const genAI = new GoogleGenerativeAI(apiKey);

/**
 * יוצר וקטור הטמעה (embedding) עבור טקסט נתון.
 * @param text הטקסט להטמעה.
 * @returns Promise שמחזיר מערך של מספרים (הווקטור), או null במקרה של כישלון.
 */
export async function generateTextEmbedding(text: string): Promise<number[] | null> {
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    const embedding = result.embedding;
    if (embedding && embedding.values) {
      return embedding.values;
    }
    console.error("Embedding generation returned no values.");
    return null;
  } catch (error) {
    console.error("Error generating text embedding:", error);
    return null;
  }
}

/**
 * מגדיר את מבנה ה-JSON של ניתוח התאמה עבור שדכנים.
 */
export interface AiAnalysisResult {
  overallScore: number;
  matchSummary: string;
  compatibilityPoints: Array<{ area: string; explanation: string; strength: 'HIGH' | 'MEDIUM' | 'LOW' }>;
  potentialChallenges: Array<{ area: string; explanation: string; severity: 'HIGH' | 'MEDIUM' | 'LOW' }>;
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
  console.log(`--- Attempting to analyze compatibility for matchmaker in ${language} ---`);
  if (!profileAText || !profileBText) {
    console.error("analyzePairCompatibility called with one or more empty profiles.");
    return null;
  }
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro-latest",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3, 
    }
  });
  
  const languageInstruction = language === 'he' 
    ? "Your entire JSON output, including all string values (keys and explanations), must be in Hebrew." 
    : "Your entire JSON output, including all string values, must be in English.";

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
      console.error("Direct Gemini API returned an empty response.");
      return null;
    }
    
    console.log(`--- Successfully received compatibility analysis from Gemini API in ${language} ---`);
    return JSON.parse(jsonString) as AiAnalysisResult;
  } catch (error) {
    console.error(`Error generating compatibility analysis from Direct Gemini API in ${language}:`, error);
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
  photoFeedback: { 
    imageCount: number; 
    feedback: string; 
  };
}

/**
 * מנתח פרופיל של משתמש ומספק משוב וטיפים לשיפור.
 * @param userNarrativeProfile הטקסט הנרטיבי המקיף של פרופיל המשתמש.
 * @returns Promise שמחזיר אובייקט ניתוח מובנה, או null במקרה של כישלון.
 */
export async function getProfileAnalysis(
  userNarrativeProfile: string
): Promise<AiProfileAnalysisResult | null> {
  console.log("--- [AI Profile Advisor] Starting profile analysis with Gemini API ---");
  
  if (!userNarrativeProfile) {
    console.error("[AI Profile Advisor] Called with an empty user narrative profile.");
    return null;
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro-latest",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
    }
  });

  const prompt = `
    You are an expert, warm, and encouraging dating profile coach for a religious Jewish audience. Your goal is to help the user improve their profile to attract the best possible matches. Based on the following comprehensive user profile, provide a structured JSON analysis. The entire output MUST be a valid JSON object in Hebrew.
    The JSON structure must be: { "personalitySummary": "string", "lookingForSummary": "string", "completenessReport": [{ "area": "string", "status": "COMPLETE" | "PARTIAL" | "MISSING", "feedback": "string" }], "actionableTips": [{ "area": "string", "tip": "string" }], "photoFeedback": { "imageCount": number, "feedback": "string" } }
    --- User Profile Narrative ---
    ${userNarrativeProfile}
    --- End of User Profile Narrative ---
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const jsonString = response.text();

    if (!jsonString) {
      console.error("[AI Profile Advisor] Gemini API returned an empty response.");
      return null;
    }

    console.log("--- [AI Profile Advisor] Successfully received analysis from Gemini API. ---");
    return JSON.parse(jsonString) as AiProfileAnalysisResult;
  } catch (error) {
    console.error("[AI Profile Advisor] Error generating profile analysis:", error);
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
  console.log("--- [AI Suggestion Advisor] Starting suggestion analysis for user ---");

  if (!currentUserProfileText || !suggestedUserProfileText) {
    console.error("[AI Suggestion Advisor] Called with one or more empty profiles.");
    return null;
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro-latest",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.5,
    }
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
      console.error("[AI Suggestion Advisor] Gemini API returned an empty response.");
      return null;
    }

    console.log("--- [AI Suggestion Advisor] Successfully received analysis from Gemini API. ---");
    return JSON.parse(jsonString) as AiSuggestionAnalysisResult;
  } catch (error) {
    console.error("[AI Suggestion Advisor] Error generating suggestion analysis:", error);
    return null;
  }
}

// --- ייצוא מאוחד של כל שירותי ה-AI ---
const aiService = {
  generateTextEmbedding,
  analyzePairCompatibility,
  getProfileAnalysis,
  analyzeSuggestionForUser,
};

export default aiService;