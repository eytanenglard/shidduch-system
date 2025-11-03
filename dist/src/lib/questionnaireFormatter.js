"use strict";
// src/lib/questionnaireFormatter.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.KEY_MAPPING = void 0;
exports.formatAnswers = formatAnswers;
const valuesQuestions_1 = require("../components/questionnaire/questions/values/valuesQuestions");
const personalityQuestions_1 = require("../components/questionnaire/questions/personality/personalityQuestions");
const relationshipQuestions_1 = require("../components/questionnaire/questions/relationship/relationshipQuestions");
const partnerQuestions_1 = require("../components/questionnaire/questions/partner/partnerQuestions");
const religionQuestions_1 = require("../components/questionnaire/questions/religion/religionQuestions");
// איחוד כל השאלות למקור מידע אחד
const allQuestions = [
    ...valuesQuestions_1.valuesQuestions,
    ...personalityQuestions_1.personalityQuestions,
    ...relationshipQuestions_1.relationshipQuestions,
    ...partnerQuestions_1.partnerQuestions,
    ...religionQuestions_1.religionQuestions
];
const allQuestionsMap = new Map(allQuestions.map(q => [q.id, q]));
exports.KEY_MAPPING = {
    VALUES: 'valuesAnswers',
    PERSONALITY: 'personalityAnswers',
    RELATIONSHIP: 'relationshipAnswers',
    PARTNER: 'partnerAnswers',
    RELIGION: 'religionAnswers'
};
const valueTranslations = { yes: 'כן', no: 'לא' };
function formatValue(value) {
    if (value === null || value === undefined)
        return 'לא נענה';
    if (typeof value === 'boolean')
        return value ? 'כן' : 'לא';
    if (Array.isArray(value))
        return value
            .map((v) => valueTranslations[String(v)] || String(v))
            .join(', ');
    if (typeof value === 'object' && !Array.isArray(value)) {
        return Object.entries(value)
            .map(([key, val]) => `${key}: ${val}`)
            .join('; ');
    }
    const stringValue = String(value);
    return valueTranslations[stringValue] || stringValue;
}
function isValidAnswerObject(item) {
    return (typeof item === 'object' &&
        item !== null &&
        'questionId' in item &&
        'value' in item &&
        'answeredAt' in item);
}
function safeParseJson(jsonValue) {
    if (Array.isArray(jsonValue)) {
        return jsonValue.filter(isValidAnswerObject).map((item) => ({
            questionId: String(item.questionId),
            value: item.value,
            answeredAt: String(item.answeredAt),
            isVisible: typeof item.isVisible === 'boolean' ? item.isVisible : true,
        }));
    }
    return [];
}
/**
 * הפונקציה המרכזית והמתוקנת: מקבלת תשובות גולמיות ומחזירה מערך מעוצב עם כל המידע.
 */
function formatAnswers(answersJson) {
    const parsedAnswers = safeParseJson(answersJson);
    const formattedResult = parsedAnswers.map((answer) => {
        const fullQuestion = allQuestionsMap.get(answer.questionId);
        // --- START: התיקון המרכזי ---
        return {
            questionId: answer.questionId,
            question: (fullQuestion === null || fullQuestion === void 0 ? void 0 : fullQuestion.question) || answer.questionId,
            questionType: (fullQuestion === null || fullQuestion === void 0 ? void 0 : fullQuestion.type) || 'unknown', // <-- הוספנו את סוג השאלה
            rawValue: answer.value, // <-- הוספנו את הערך הגולמי
            displayText: formatValue(answer.value),
            isVisible: answer.isVisible,
            answeredAt: new Date(answer.answeredAt),
        };
        // --- END: התיקון המרכזי ---
    });
    return formattedResult.sort((a, b) => a.questionId.localeCompare(b.questionId));
}
