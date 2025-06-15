// File: src/lib/services/aiService.ts
// --- TEST VERSION USING GOOGLE GENERATIVE AI SDK ---

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error("[FATAL ERROR] GOOGLE_API_KEY is not set in .env or .env.local!");
    throw new Error("GOOGLE_API_KEY must be set.");
}

const genAI = new GoogleGenerativeAI(apiKey);

// This function is just a placeholder now, as the embedding model is different.
export async function generateTextEmbedding(text: string): Promise<number[] | null> {
    console.warn("generateTextEmbedding is not implemented in this test version.");
    return null; 
}


export async function analyzePairCompatibility(profileAText: string, profileBText: string, language: 'he' | 'en' = 'he'): Promise<any | null> {
    console.log(`--- Attempting to analyze compatibility using Direct Gemini API in ${language} ---`);
    
    if (!profileAText || !profileBText) {
        console.error("analyzePairCompatibility called with one or more empty profiles.");
        return null;
    }

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro-latest", // Using a standard model name for this API
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

        Your output MUST be a valid JSON object and nothing else. Do not include any text before or after the JSON object. Do not wrap it in markdown backticks.

        The JSON object should have the following structure:
        {
          "overallScore": number,
          "matchSummary": "string",
          "compatibilityPoints": [
            { "area": "string", "explanation": "string", "strength": "HIGH" | "MEDIUM" | "LOW" }
          ],
          "potentialChallenges": [
            { "area": "string", "explanation": "string", "severity": "HIGH" | "MEDIUM" | "LOW" }
          ],
          "suggestedConversationStarters": [
            "string"
          ]
        }
        
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

        console.log(`--- Successfully received response from Direct Gemini API in ${language} ---`);
        return JSON.parse(jsonString);

    } catch (error) {
        console.error(`Error generating compatibility analysis from Direct Gemini API in ${language}:`, error);
        return null;
    }
}


const aiService = {
  generateTextEmbedding,
  analyzePairCompatibility,
};

export default aiService;