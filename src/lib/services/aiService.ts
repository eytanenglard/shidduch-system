// File: src/lib/services/aiService.ts

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error("[FATAL ERROR] GOOGLE_API_KEY is not set in .env or .env.local!");
    throw new Error("GOOGLE_API_KEY must be set.");
}

const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Generates a text embedding vector for a given text using a specified model.
 * @param text The text to embed.
 * @returns A promise that resolves to an array of numbers (the vector), or null on failure.
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
 * Defines the structured JSON output for compatibility analysis.
 */
export interface AiAnalysisResult {
  overallScore: number;
  matchSummary: string;
  compatibilityPoints: Array<{ area: string; explanation: string; strength: 'HIGH' | 'MEDIUM' | 'LOW' }>;
  potentialChallenges: Array<{ area: string; explanation: string; severity: 'HIGH' | 'MEDIUM' | 'LOW' }>;
  suggestedConversationStarters: string[];
}

/**
 * Analyzes the compatibility of two narrative profiles.
 * @param profileAText The narrative profile of the first user.
 * @param profileBText The narrative profile of the second user.
 * @param language The desired output language ('he' for Hebrew, 'en' for English).
 * @returns A promise that resolves to a structured analysis object, or null on failure.
 */
export async function analyzePairCompatibility(
    profileAText: string, 
    profileBText: string, 
    language: 'he' | 'en' = 'he'
): Promise<AiAnalysisResult | null> {
    console.log(`--- Attempting to analyze compatibility using Direct Gemini API in ${language} ---`);
    
    if (!profileAText || !profileBText) {
        console.error("analyzePairCompatibility called with one or more empty profiles.");
        return null;
    }

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro-latest",
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3, // Lower temperature for more predictable, structured output
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
        // We cast the parsed JSON to our defined interface for type safety.
        return JSON.parse(jsonString) as AiAnalysisResult;

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