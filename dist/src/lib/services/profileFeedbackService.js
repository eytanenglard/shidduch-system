"use strict";
// src/lib/services/profileFeedbackService.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileFeedbackService = void 0;
const prisma_1 = __importDefault(require("../../lib/prisma"));
const aiService_1 = __importDefault(require("./aiService"));
const profileAiService_1 = require("./profileAiService");
class ProfileFeedbackService {
    constructor() { }
    static getInstance() {
        if (!ProfileFeedbackService.instance) {
            ProfileFeedbackService.instance = new ProfileFeedbackService();
        }
        return ProfileFeedbackService.instance;
    }
    async compileFeedbackReport(userId, locale = 'he', questionsDict, skipAI = false // 🆕 פרמטר חדש
    ) {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
                images: true,
                questionnaireResponses: { take: 1, orderBy: { lastSaved: 'desc' } }
            },
        });
        if (!user || !user.profile) {
            throw new Error(`User or profile not found for userId: ${userId}`);
        }
        // ✅ תיקון הטיפוס - לא null אלא AiProfileAnalysisResult | null
        let aiAnalysis = null;
        if (!skipAI) {
            try {
                const narrativeProfile = await (0, profileAiService_1.generateNarrativeProfile)(userId);
                if (narrativeProfile) {
                    aiAnalysis = await aiService_1.default.getProfileAnalysis(narrativeProfile, locale);
                }
            }
            catch (error) {
                console.error('AI analysis failed, continuing without it:', error);
            }
        }
        const { completed, missing } = this.analyzeProfileFields(user, locale);
        const missingQuestionnaireItems = this.analyzeMissingQuestionnaireAnswers(user.questionnaireResponses[0], locale, questionsDict);
        const completionPercentage = this.calculateCompletionPercentage(user);
        return {
            name: user.firstName,
            aiSummary: aiAnalysis ? {
                personality: aiAnalysis.personalitySummary,
                lookingFor: aiAnalysis.lookingForSummary,
            } : null,
            completedProfileItems: completed,
            missingProfileItems: missing,
            missingQuestionnaireItems,
            completionPercentage,
        };
    }
    // ... שאר המתודות נשארות אותו דבר
    calculateCompletionPercentage(user) {
        var _a, _b;
        if (!user.profile)
            return 0;
        const checks = [];
        const p = user.profile;
        checks.push(((_b = (_a = user.images) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) >= 1);
        checks.push(!!p.profileHeadline);
        checks.push(!!p.about && p.about.trim().length >= 100);
        checks.push(!!p.inspiringCoupleStory);
        checks.push(p.height !== null && p.height !== undefined);
        checks.push(!!p.city);
        checks.push(!!p.maritalStatus);
        checks.push(!!p.religiousLevel);
        checks.push(!!p.educationLevel);
        checks.push(!!p.occupation);
        checks.push(!!(p.matchingNotes && p.matchingNotes.trim().length > 0));
        const totalProfileChecks = checks.length;
        const completedProfileChecks = checks.filter(Boolean).length;
        const profileScore = totalProfileChecks > 0 ? (completedProfileChecks / totalProfileChecks) : 0;
        const totalQuestions = 100;
        const answeredQuestionsCount = this.getAnsweredQuestionIds(user.questionnaireResponses[0]).size;
        const questionnaireScore = totalQuestions > 0 ? (answeredQuestionsCount / totalQuestions) : 0;
        const finalPercentage = (profileScore * 60) + (questionnaireScore * 40);
        return Math.round(finalPercentage);
    }
    analyzeProfileFields(user, locale = 'he') {
        const completed = [];
        const missing = [];
        const profile = user.profile;
        const t = (he, en) => locale === 'he' ? he : en;
        const fields = [
            {
                key: 'images',
                label: t("תמונת פרופיל אחת לפחות", "At least one profile photo"),
                check: () => { var _a, _b; return ((_b = (_a = user.images) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) > 0; }
            },
            {
                key: 'profileHeadline',
                label: t("כותרת פרופיל אישית", "Personal headline"),
                check: () => !!(profile === null || profile === void 0 ? void 0 : profile.profileHeadline)
            },
            {
                key: 'about',
                label: t("שדה 'אודותיי' (לפחות 100 תווים)", "About section (at least 100 chars)"),
                check: () => !!(profile === null || profile === void 0 ? void 0 : profile.about) && profile.about.trim().length >= 100
            },
            {
                key: 'inspiringCoupleStory',
                label: t("סיפור על זוג מעורר השראה", "Inspiring couple story"),
                check: () => !!(profile === null || profile === void 0 ? void 0 : profile.inspiringCoupleStory)
            },
            {
                key: 'height',
                label: t("גובה", "Height"),
                check: () => !!(profile === null || profile === void 0 ? void 0 : profile.height)
            },
            {
                key: 'city',
                label: t("עיר מגורים", "City"),
                check: () => !!(profile === null || profile === void 0 ? void 0 : profile.city)
            },
            {
                key: 'maritalStatus',
                label: t("מצב משפחתי", "Marital status"),
                check: () => !!(profile === null || profile === void 0 ? void 0 : profile.maritalStatus)
            },
            {
                key: 'religiousLevel',
                label: t("רמה דתית", "Religious level"),
                check: () => !!(profile === null || profile === void 0 ? void 0 : profile.religiousLevel)
            },
            {
                key: 'educationLevel',
                label: t("רמת השכלה", "Education level"),
                check: () => !!(profile === null || profile === void 0 ? void 0 : profile.educationLevel)
            },
            {
                key: 'occupation',
                label: t("עיסוק", "Occupation"),
                check: () => !!(profile === null || profile === void 0 ? void 0 : profile.occupation)
            },
            {
                key: 'matchingNotes',
                label: t("תיאור על בן/בת הזוג", "Partner description"),
                check: () => !!(profile === null || profile === void 0 ? void 0 : profile.matchingNotes) && profile.matchingNotes.trim().length > 0
            },
        ];
        fields.forEach(field => {
            if (field.check()) {
                completed.push(field.label);
            }
            else {
                missing.push(field.label);
            }
        });
        return { completed, missing };
    }
    getAnsweredQuestionIds(questionnaire) {
        const answeredIds = new Set();
        if (!questionnaire)
            return answeredIds;
        const worldKeys = [
            'valuesAnswers',
            'personalityAnswers',
            'relationshipAnswers',
            'partnerAnswers',
            'religionAnswers'
        ];
        worldKeys.forEach(worldKey => {
            const answers = questionnaire[worldKey];
            if (Array.isArray(answers)) {
                answers.forEach(ans => ans && ans.questionId && answeredIds.add(ans.questionId));
            }
        });
        return answeredIds;
    }
    analyzeMissingQuestionnaireAnswers(questionnaire, locale = 'he', questionsDict) {
        const answeredIds = this.getAnsweredQuestionIds(questionnaire);
        const worldNames = {
            'personality': { he: 'האישיות', en: 'Personality' },
            'values': { he: 'הערכים', en: 'Values' },
            'relationship': { he: 'הזוגיות', en: 'Relationship' },
            'partner': { he: 'הפרטנר', en: 'Partner' },
            'religion': { he: 'דת ומסורת', en: 'Religion' }
        };
        const missingItems = [];
        const worlds = [
            { key: 'valuesAnswers', worldId: 'values', completed: (questionnaire === null || questionnaire === void 0 ? void 0 : questionnaire.valuesCompleted) || false },
            { key: 'personalityAnswers', worldId: 'personality', completed: (questionnaire === null || questionnaire === void 0 ? void 0 : questionnaire.personalityCompleted) || false },
            { key: 'relationshipAnswers', worldId: 'relationship', completed: (questionnaire === null || questionnaire === void 0 ? void 0 : questionnaire.relationshipCompleted) || false },
            { key: 'partnerAnswers', worldId: 'partner', completed: (questionnaire === null || questionnaire === void 0 ? void 0 : questionnaire.partnerCompleted) || false },
            { key: 'religionAnswers', worldId: 'religion', completed: (questionnaire === null || questionnaire === void 0 ? void 0 : questionnaire.religionCompleted) || false },
        ];
        worlds.forEach(world => {
            if (!world.completed) {
                const worldName = worldNames[world.worldId];
                const translatedWorld = locale === 'he' ? worldName.he : worldName.en;
                const translatedQuestion = locale === 'he'
                    ? `השלם את שאלות עולם ${translatedWorld}`
                    : `Complete ${translatedWorld} questionnaire`;
                missingItems.push({
                    world: translatedWorld,
                    question: translatedQuestion,
                    link: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/${locale}/questionnaire?world=${world.worldId.toUpperCase()}`
                });
            }
        });
        return missingItems;
    }
}
exports.profileFeedbackService = ProfileFeedbackService.getInstance();
