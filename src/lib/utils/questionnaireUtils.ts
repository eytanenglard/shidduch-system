// src/lib/questionnaireUtils.ts

import { QuestionnaireResponse } from "@/types/next-auth";

/**
 * Finds a specific answer from the questionnaire response object.
 * @param questionnaire The full questionnaire response object.
 * @param questionId The ID of the question to find.
 * @returns The answer string (displayText or answer), or null if not found.
 */
export const findAnswer = (questionnaire: QuestionnaireResponse | null, questionId: string): string | null => {
    if (!questionnaire?.formattedAnswers) {
        return null;
    }

    // Iterate over each "world" (category) of answers
    for (const worldAnswers of Object.values(questionnaire.formattedAnswers)) {
        if (Array.isArray(worldAnswers)) {
            // Find the answer object within the current world
            const answerObject = worldAnswers.find(a => a.questionId === questionId);
            if (answerObject) {
                // Return the display text if available, otherwise the raw answer
                return answerObject.displayText || answerObject.answer;
            }
        }
    }
    
    // Return null if the answer was not found in any world
    return null;
};