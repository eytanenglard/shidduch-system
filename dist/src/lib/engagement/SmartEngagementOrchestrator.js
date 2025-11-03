"use strict";
// src/lib/engagement/SmartEngagementOrchestrator.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartEngagementOrchestrator = void 0;
const prisma_1 = __importDefault(require("../../lib/prisma"));
const aiService_1 = __importDefault(require("../../lib/services/aiService"));
const profileAiService_1 = __importDefault(require("../../lib/services/profileAiService"));
const profileFeedbackService_1 = require("../../lib/services/profileFeedbackService");
const dictionaries_1 = require("../../lib/dictionaries");
const jose_1 = require("jose");
function populateTemplate(template, data) {
    if (!template)
        return '';
    let result = template;
    for (const key in data) {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(data[key]));
    }
    return result;
}
class SmartEngagementOrchestrator {
    // ========== Test Methods ==========
    static async testBuildUserEngagementProfile(userId) {
        return this.buildUserEngagementProfile(userId, false);
    }
    static async testDetectDailyActivity(userId) {
        return this.detectDailyActivity(userId);
    }
    static async testGetEveningFeedbackEmail(profile, dailyActivity, dict) {
        return this.getEveningFeedbackEmail(profile, dailyActivity, dict);
    }
    // [+] Exposing morning campaign emails for manual sending from dashboard
    static async testGetOnboardingDay1Email(profile, dict) {
        return this.getOnboardingDay1Email(profile, dict);
    }
    static async testGetOnboardingPhotosEmail(profile, dict) {
        return this.getOnboardingPhotosEmail(profile, dict);
    }
    static async testGetOnboardingAiTeaserEmail(profile, dict, language) {
        if (!profile.aiInsights) {
            await this.loadAiInsights(profile, language);
        }
        return this.getOnboardingAiTeaserEmail(profile, dict);
    }
    static async testGetOnboardingQuestionnaireWhyEmail(profile, dict) {
        return this.getOnboardingQuestionnaireWhyEmail(profile, dict);
    }
    static async testGetOnboardingValueAddEmail(profile, dict, language) {
        if (!profile.aiInsights) {
            await this.loadAiInsights(profile, language);
        }
        return this.getOnboardingValueAddEmail(profile, dict);
    }
    static async testGetPhotoNudgeEmail(profile, dict) {
        return this.getPhotoNudgeEmail(profile, dict);
    }
    static async testGetQuestionnaireNudgeEmail(profile, dict) {
        return this.getQuestionnaireNudgeEmail(profile, dict);
    }
    static async testGetAlmostDoneEmail(profile, dict) {
        return this.getAlmostDoneEmail(profile, dict);
    }
    static async testGetAiSummaryEmail(profile, dict, language) {
        if (!profile.aiInsights) {
            console.log(`🧠 [Manual AI Summary] AI insights not pre-loaded. Fetching now...`);
            await this.loadAiInsights(profile, language);
        }
        return this.getAiSummaryEmail(profile, dict);
    }
    static async testGetValueEmail(profile, dict) {
        return this.getValueEmail(profile, dict);
    }
    // ========== Main Campaign Methods ==========
    static async runDailyCampaign() {
        console.log('🚀 [Smart Engagement] Starting daily campaign run...');
        const usersToProcess = await this.getActiveUsers();
        console.log(`📊 [Smart Engagement] Found ${usersToProcess.length} users to process`);
        let emailsSent = 0;
        for (const user of usersToProcess) {
            try {
                // STEP 1: Build profile WITHOUT expensive AI
                const profile = await this.buildUserEngagementProfile(user.id, false);
                const dict = await (0, dictionaries_1.getEmailDictionary)(user.language);
                // STEP 2: Decide if email is needed (smart check)
                const emailType = await this.determineEmailType(profile);
                if (!emailType) {
                    console.log(`⏭️ [Smart Engagement] No email needed for user ${user.id} at this time`);
                    continue;
                }
                // STEP 3: Only NOW get AI insights if needed
                const needsAI = emailType === 'AI_SUMMARY' || emailType === 'INSIGHT' || emailType === 'ONBOARDING_AI_TEASER' || emailType === 'ONBOARDING_VALUE_ADD';
                if (needsAI && !profile.aiInsights) {
                    console.log(`🧠 [Smart Engagement] Fetching AI insights for ${emailType} email...`);
                    await this.loadAiInsights(profile, user.language);
                }
                // STEP 4: Generate the actual email
                const emailToSend = await this.generateEmail(emailType, profile, dict);
                if (emailToSend) {
                    await this.sendEmail(user, emailToSend);
                    await this.updateCampaignRecord(user.id, emailToSend.type);
                    emailsSent++;
                    console.log(`✅ [Smart Engagement] Sent ${emailToSend.type} email to user ${user.id}`);
                }
            }
            catch (error) {
                console.error(`❌ [Smart Engagement] Error processing user ${user.id}:`, error);
            }
        }
        console.log(`🎉 [Smart Engagement] Campaign complete. Sent ${emailsSent} emails.`);
        return { processed: usersToProcess.length, sent: emailsSent };
    }
    // ========== Evening Campaign (Enhanced with Detailed Logging) ==========
    static async runEveningCampaign() {
        console.log('\n========================================');
        console.log('🌙 [Evening Campaign] Starting...');
        console.log('========================================\n');
        const usersToProcess = await this.getTodaysActiveUsers();
        console.log(`📊 [Evening Campaign] Found ${usersToProcess.length} potentially active users today\n`);
        let emailsSent = 0;
        let skippedNoActivity = 0;
        let errors = 0;
        for (let i = 0; i < usersToProcess.length; i++) {
            const user = usersToProcess[i];
            console.log(`\n--- Processing User ${i + 1}/${usersToProcess.length} ---`);
            console.log(`👤 User: ${user.firstName} ${user.lastName} (${user.id})`);
            console.log(`📧 Email: ${user.email}`);
            try {
                // בניית פרופיל
                console.log(`🔨 Building engagement profile...`);
                const profile = await this.buildUserEngagementProfile(user.id, true);
                // טעינת dictionary
                const dict = await (0, dictionaries_1.getEmailDictionary)(user.language);
                // בדיקת פעילות יומית
                console.log(`🔍 Detecting daily activity...`);
                const dailyActivity = await this.detectDailyActivity(profile.userId);
                if (!dailyActivity.hasActivity) {
                    console.log(`⏭️  SKIPPING: No activity detected for user ${user.id}`);
                    console.log(`   Reason: User didn't update profile, upload images, or answer questionnaire today`);
                    skippedNoActivity++;
                    continue;
                }
                console.log(`✅ Activity detected! Preparing evening feedback email...`);
                // יצירת המייל
                const emailToSend = await this.getEveningFeedbackEmail(profile, dailyActivity, dict);
                if (emailToSend) {
                    console.log(`📧 Sending EVENING_FEEDBACK email...`);
                    await this.sendEmail(user, emailToSend);
                    await this.updateCampaignRecord(user.id, emailToSend.type);
                    emailsSent++;
                    console.log(`✅ Successfully sent EVENING_FEEDBACK to ${user.email}`);
                }
                else {
                    console.log(`⚠️  Email generation returned null - skipping`);
                }
            }
            catch (error) {
                errors++;
                console.error(`❌ Error processing user ${user.id}:`, error);
                if (error instanceof Error) {
                    console.error(`   Error message: ${error.message}`);
                    console.error(`   Stack trace:`, error.stack);
                }
            }
        }
        console.log('\n========================================');
        console.log('🎉 Evening Campaign Complete!');
        console.log('========================================');
        console.log(`📊 Summary:`);
        console.log(`   Total Users Checked: ${usersToProcess.length}`);
        console.log(`   ✅ Emails Sent: ${emailsSent}`);
        console.log(`   ⏭️  Skipped (No Activity): ${skippedNoActivity}`);
        console.log(`   ❌ Errors: ${errors}`);
        console.log('========================================\n');
        return { processed: usersToProcess.length, sent: emailsSent };
    }
    // ========== Core Logic Methods ==========
    static async buildUserEngagementProfile(userId, includeAI = false) {
        var _a, _b;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: {
                profile: {
                    include: {
                        testimonials: { where: { status: 'APPROVED' } }
                    }
                },
                images: true,
                questionnaireResponses: { take: 1, orderBy: { lastSaved: 'desc' } },
                dripCampaign: true
            }
        });
        if (!user)
            throw new Error(`User ${userId} not found`);
        const daysInSystem = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const feedbackReport = await profileFeedbackService_1.profileFeedbackService.compileFeedbackReport(userId, user.language, undefined, !includeAI);
        let aiInsights = null;
        if (includeAI) {
            aiInsights = await this.getAiInsights(userId, user.language);
        }
        const campaign = user.dripCampaign;
        const lastActiveDate = user.lastLogin || user.updatedAt;
        const daysSinceActive = Math.floor((Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
        const hasAskedForTestimonial = !!(((_a = user.profile) === null || _a === void 0 ? void 0 : _a.testimonials) && user.profile.testimonials.length > 0);
        return {
            userId,
            firstName: user.firstName,
            daysInSystem,
            completionStatus: {
                overall: feedbackReport.completionPercentage,
                photos: {
                    current: user.images.length,
                    needed: 3,
                    isDone: user.images.length >= 3
                },
                personalDetails: {
                    missing: feedbackReport.missingProfileItems,
                    isDone: feedbackReport.missingProfileItems.length === 0
                },
                partnerPreferences: {
                    missing: feedbackReport.missingProfileItems.filter(item => item.includes('העדפ') || item.includes('מחפש')),
                    isDone: feedbackReport.missingProfileItems.filter(item => item.includes('העדפ') || item.includes('מחפש')).length === 0
                },
                questionnaire: {
                    completionPercent: feedbackReport.completionPercentage,
                    worldsStatus: feedbackReport.missingQuestionnaireItems.map(item => ({
                        world: item.world,
                        completed: 0,
                        total: 19, // This is an approximation
                        isDone: false
                    }))
                },
                hasSeenPreview: ((_b = user.profile) === null || _b === void 0 ? void 0 : _b.hasViewedProfilePreview) || false
            },
            aiInsights,
            lastEmailSent: campaign === null || campaign === void 0 ? void 0 : campaign.updatedAt,
            lastEmailType: (campaign === null || campaign === void 0 ? void 0 : campaign.lastSentType) || undefined,
            emailsSentCount: (campaign === null || campaign === void 0 ? void 0 : campaign.currentStep) || 0,
            lastActiveDate,
            dripCampaign: user.dripCampaign ? { sentEmailTypes: user.dripCampaign.sentEmailTypes } : null,
            triggers: {
                stagnant: daysSinceActive >= 5 && daysInSystem > 7,
                almostDone: feedbackReport.completionPercentage >= 90,
                askedForTestimonial: hasAskedForTestimonial,
            }
        };
    }
    static async loadAiInsights(profile, language) {
        const aiInsights = await this.getAiInsights(profile.userId, language);
        profile.aiInsights = aiInsights;
    }
    static async getAiInsights(userId, language) {
        try {
            const narrativeProfile = await profileAiService_1.default.generateNarrativeProfile(userId);
            if (!narrativeProfile)
                return null;
            const analysis = await aiService_1.default.getProfileAnalysis(narrativeProfile, language);
            if (!analysis)
                return null;
            return {
                personalitySummary: analysis.personalitySummary,
                lookingForSummary: analysis.lookingForSummary,
                topStrengths: analysis.completenessReport
                    .filter(r => r.status === 'COMPLETE')
                    .slice(0, 3)
                    .map(r => r.feedback),
                topGaps: analysis.actionableTips
                    .slice(0, 3)
                    .map(t => t.tip)
            };
        }
        catch (error) {
            console.error(`[AI Service] Failed to get AI insights for user ${userId}:`, error);
            return null;
        }
    }
    static async determineEmailType(profile) {
        var _a;
        const { daysInSystem, completionStatus, triggers, lastEmailSent, lastEmailType } = profile;
        if (lastEmailSent) {
            const daysSinceLastEmail = Math.floor((Date.now() - lastEmailSent.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceLastEmail < 1) {
                return null;
            }
        }
        const sentEmailTypes = new Set(((_a = profile.dripCampaign) === null || _a === void 0 ? void 0 : _a.sentEmailTypes) || []); // <--- זו השורה המתוקנת
        // Smart Onboarding Campaign (First 7 Days)
        if (daysInSystem <= 7) {
            if (daysInSystem <= 1 && !sentEmailTypes.has('ONBOARDING_DAY_1')) {
                return 'ONBOARDING_DAY_1';
            }
            if (daysInSystem >= 2 && !completionStatus.photos.isDone && !sentEmailTypes.has('ONBOARDING_PHOTOS')) {
                return 'ONBOARDING_PHOTOS';
            }
            if (daysInSystem >= 3 && completionStatus.photos.isDone && completionStatus.questionnaire.completionPercent < 20 && !sentEmailTypes.has('ONBOARDING_AI_TEASER')) {
                return 'ONBOARDING_AI_TEASER';
            }
            if (daysInSystem >= 5 && completionStatus.questionnaire.completionPercent >= 20 && completionStatus.questionnaire.completionPercent < 80 && !sentEmailTypes.has('ONBOARDING_QUESTIONNAIRE_WHY')) {
                return 'ONBOARDING_QUESTIONNAIRE_WHY';
            }
            if (daysInSystem >= 7 && completionStatus.questionnaire.completionPercent >= 80 && !triggers.askedForTestimonial && !sentEmailTypes.has('ONBOARDING_VALUE_ADD')) {
                return 'ONBOARDING_VALUE_ADD';
            }
        }
        // Post-Onboarding Logic (After Day 7)
        if (triggers.almostDone && lastEmailType !== 'CELEBRATION')
            return 'CELEBRATION';
        if (triggers.stagnant && lastEmailType !== 'NUDGE')
            return 'NUDGE';
        if (!completionStatus.photos.isDone)
            return 'NUDGE';
        if (completionStatus.questionnaire.completionPercent < 50)
            return 'NUDGE';
        if (completionStatus.overall >= 40 && completionStatus.overall < 90 && lastEmailType !== 'AI_SUMMARY')
            return 'AI_SUMMARY';
        if (daysInSystem > 7 && daysInSystem % 14 === 0)
            return 'VALUE';
        return null;
    }
    static async generateEmail(emailType, profile, dict) {
        switch (emailType) {
            case 'ONBOARDING_DAY_1':
                return this.getOnboardingDay1Email(profile, dict);
            case 'ONBOARDING_PHOTOS':
                return this.getOnboardingPhotosEmail(profile, dict);
            case 'ONBOARDING_AI_TEASER':
                return this.getOnboardingAiTeaserEmail(profile, dict);
            case 'ONBOARDING_QUESTIONNAIRE_WHY':
                return this.getOnboardingQuestionnaireWhyEmail(profile, dict);
            case 'ONBOARDING_VALUE_ADD':
                return this.getOnboardingValueAddEmail(profile, dict);
            case 'NUDGE':
                if (!profile.completionStatus.photos.isDone) {
                    return this.getPhotoNudgeEmail(profile, dict);
                }
                else {
                    return this.getQuestionnaireNudgeEmail(profile, dict);
                }
            case 'CELEBRATION':
                return this.getAlmostDoneEmail(profile, dict);
            case 'AI_SUMMARY':
                return this.getAiSummaryEmail(profile, dict);
            case 'VALUE':
                return this.getValueEmail(profile, dict);
            default:
                return null;
        }
    }
    // ========== Email Generators (New & Existing) ==========
    static getOnboardingDay1Email(profile, dict) {
        const emailDict = dict.engagement.onboardingDay1;
        let mainMessage = emailDict.mainMessage;
        if (profile.completionStatus.overall > 50 && emailDict.fastUserMainMessage) {
            mainMessage = emailDict.fastUserMainMessage;
        }
        return {
            type: 'ONBOARDING_DAY_1',
            priority: 'HIGH',
            subject: populateTemplate(emailDict.subject, { firstName: profile.firstName }),
            content: {
                hook: emailDict.hook,
                mainMessage: mainMessage,
                specificAction: this.getNextBestAction(profile),
                encouragement: emailDict.encouragement
            },
            sendInDays: 0
        };
    }
    static getOnboardingPhotosEmail(profile, dict) {
        const emailDict = dict.engagement.onboardingPhotos;
        const missingCount = 3 - profile.completionStatus.photos.current;
        return {
            type: 'ONBOARDING_PHOTOS',
            priority: 'HIGH',
            subject: populateTemplate(emailDict.subject, { firstName: profile.firstName }),
            content: {
                hook: emailDict.hook,
                mainMessage: populateTemplate(emailDict.mainMessage, { missingCount }),
                specificAction: emailDict.specificAction,
                encouragement: emailDict.encouragement
            },
            sendInDays: 0
        };
    }
    static getOnboardingAiTeaserEmail(profile, dict) {
        var _a;
        const emailDict = dict.engagement.onboardingAiTeaser;
        const aiInsightText = ((_a = profile.aiInsights) === null || _a === void 0 ? void 0 : _a.topStrengths[0])
            ? populateTemplate(emailDict.aiInsight, { insight: profile.aiInsights.topStrengths[0] })
            : emailDict.genericInsight;
        return {
            type: 'ONBOARDING_AI_TEASER',
            priority: 'NORMAL',
            subject: populateTemplate(emailDict.subject, { firstName: profile.firstName }),
            content: {
                hook: emailDict.hook,
                mainMessage: `${emailDict.mainMessage} ${aiInsightText}`,
                specificAction: emailDict.specificAction,
                encouragement: emailDict.encouragement
            },
            sendInDays: 0
        };
    }
    static getOnboardingQuestionnaireWhyEmail(profile, dict) {
        const emailDict = dict.engagement.onboardingQuestionnaireWhy;
        return {
            type: 'ONBOARDING_QUESTIONNAIRE_WHY',
            priority: 'NORMAL',
            subject: populateTemplate(emailDict.subject, { firstName: profile.firstName }),
            content: {
                hook: emailDict.hook,
                mainMessage: emailDict.mainMessage,
                specificAction: emailDict.specificAction,
                encouragement: emailDict.encouragement
            },
            sendInDays: 0
        };
    }
    static getOnboardingValueAddEmail(profile, dict) {
        var _a;
        const emailDict = dict.engagement.onboardingValueAdd;
        const tipFromAI = ((_a = profile.aiInsights) === null || _a === void 0 ? void 0 : _a.topGaps[0])
            ? populateTemplate(emailDict.aiTip, { tip: profile.aiInsights.topGaps[0] })
            : emailDict.genericTip;
        return {
            type: 'ONBOARDING_VALUE_ADD',
            priority: 'LOW',
            subject: populateTemplate(emailDict.subject, { firstName: profile.firstName }),
            content: {
                hook: emailDict.hook,
                mainMessage: `${emailDict.mainMessage} ${tipFromAI}`,
                specificAction: emailDict.specificAction,
                encouragement: emailDict.encouragement
            },
            sendInDays: 0
        };
    }
    static getPhotoNudgeEmail(profile, dict) {
        const emailDict = dict.engagement.photoNudge;
        const missingCount = 3 - profile.completionStatus.photos.current;
        return {
            type: 'NUDGE',
            priority: 'HIGH',
            subject: populateTemplate(emailDict.subject, { firstName: profile.firstName }),
            content: {
                hook: populateTemplate(emailDict.hook, { firstName: profile.firstName }),
                mainMessage: populateTemplate(emailDict.mainMessage, { missingCount }),
                specificAction: emailDict.specificAction,
                encouragement: emailDict.encouragement
            },
            sendInDays: 0
        };
    }
    static getQuestionnaireNudgeEmail(profile, dict) {
        const emailDict = dict.engagement.questionnaireNudge;
        const { worldsStatus } = profile.completionStatus.questionnaire;
        const mostEmptyWorld = worldsStatus
            .filter(w => !w.isDone)
            .sort((a, b) => a.completed - b.completed)[0] || { world: 'כללי' };
        return {
            type: 'NUDGE',
            priority: 'NORMAL',
            subject: populateTemplate(emailDict.subject, { firstName: profile.firstName }),
            content: {
                hook: populateTemplate(emailDict.hook, { firstName: profile.firstName }),
                mainMessage: populateTemplate(emailDict.mainMessage, { worldName: mostEmptyWorld.world }),
                specificAction: this.getNextBestAction(profile),
                encouragement: emailDict.encouragement
            },
            sendInDays: 0
        };
    }
    static getAlmostDoneEmail(profile, dict) {
        const emailDict = dict.engagement.almostDone;
        return {
            type: 'CELEBRATION',
            priority: 'HIGH',
            subject: populateTemplate(emailDict.subject, { firstName: profile.firstName }),
            content: {
                hook: populateTemplate(emailDict.hook, { completion: profile.completionStatus.overall }),
                mainMessage: emailDict.mainMessage,
                specificAction: this.getNextBestAction(profile),
                encouragement: emailDict.encouragement
            },
            sendInDays: 0
        };
    }
    static async getAiSummaryEmail(profile, dict) {
        const { aiInsights } = profile;
        const emailDict = dict.engagement.aiSummary;
        if (!aiInsights) {
            console.warn('⚠️ [AI Summary Email] No AI insights, using generic message');
            return {
                type: 'AI_SUMMARY',
                priority: 'NORMAL',
                subject: populateTemplate(emailDict.subject, { firstName: profile.firstName }),
                content: {
                    hook: emailDict.hook,
                    mainMessage: emailDict.mainMessage,
                    systemSummary: 'התחלנו לנתח את הפרופיל שלך. ככל שתוסיף יותר מידע, נוכל לספק תובנות מדויקות יותר על מי שמתאים לך.',
                    specificAction: this.getNextBestAction(profile),
                    encouragement: emailDict.encouragement
                },
                sendInDays: 0
            };
        }
        return {
            type: 'AI_SUMMARY',
            priority: 'NORMAL',
            subject: populateTemplate(emailDict.subject, { firstName: profile.firstName }),
            content: {
                hook: emailDict.hook,
                mainMessage: emailDict.mainMessage,
                systemSummary: aiInsights.personalitySummary,
                aiInsight: aiInsights.lookingForSummary,
                specificAction: this.getNextBestAction(profile),
                encouragement: emailDict.encouragement
            },
            sendInDays: 0
        };
    }
    static getValueEmail(profile, dict) {
        const topics = dict.engagement.value;
        const topic = topics[Math.floor(Math.random() * topics.length)];
        return {
            type: 'VALUE',
            priority: 'LOW',
            subject: populateTemplate(topic.subject, { firstName: profile.firstName }),
            content: {
                hook: populateTemplate(topic.hook, { firstName: profile.firstName }),
                mainMessage: topic.mainMessage,
                encouragement: topic.encouragement
            },
            sendInDays: 0
        };
    }
    // ========== Helper Methods ==========
    static getNextBestAction(profile) {
        if (!profile.completionStatus.photos.isDone) {
            return `העלה ${3 - profile.completionStatus.photos.current} תמונות נוספות`;
        }
        if (profile.completionStatus.personalDetails.missing.length > 0) {
            return `השלם את הפרט: ${profile.completionStatus.personalDetails.missing[0]}`;
        }
        if (profile.completionStatus.questionnaire.completionPercent < 100) {
            return 'המשך למלא את שאלון העומק';
        }
        if (!profile.completionStatus.hasSeenPreview) {
            return 'צפה בתצוגה המקדימה של הפרופיל שלך';
        }
        return 'הפרופיל שלך במצב מצוין! אנו מתחילים לחפש עבורך.';
    }
    static generateProgressBar(percentage) {
        const filled = Math.floor(percentage / 10);
        const empty = 10 - filled;
        return '█'.repeat(filled) + '░'.repeat(empty) + ` ${percentage}%`;
    }
    static async getActiveUsers() {
        return await prisma_1.default.user.findMany({
            where: {
                status: 'ACTIVE',
                engagementEmailsConsent: true,
                isProfileComplete: false
            },
            include: {
                profile: true,
                images: true,
                questionnaireResponses: { take: 1, orderBy: { lastSaved: 'desc' } },
                dripCampaign: true
            }
        });
    }
    static async getTodaysActiveUsers() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return await prisma_1.default.user.findMany({
            where: {
                status: 'ACTIVE',
                engagementEmailsConsent: true,
                OR: [
                    { updatedAt: { gte: today } },
                    { questionnaireResponses: { some: { lastSaved: { gte: today } } } }
                ]
            },
            include: {
                profile: true,
                images: true,
                questionnaireResponses: { take: 1, orderBy: { lastSaved: 'desc' } },
                dripCampaign: true
            }
        });
    }
    static async detectDailyActivity(userId) {
        console.log('\n==============================================');
        console.log('🔥🔥🔥 DETECT DAILY ACTIVITY - START 🔥🔥🔥');
        console.log(`🔍 User ID: ${userId}`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const recentUpdates = await prisma_1.default.profile.findUnique({
            where: { userId },
            select: {
                updatedAt: true,
                user: {
                    select: {
                        updatedAt: true,
                        questionnaireResponses: {
                            where: { lastSaved: { gte: today } },
                            orderBy: { lastSaved: 'desc' },
                            take: 1
                        },
                        images: {
                            where: { createdAt: { gte: today } }
                        }
                    }
                }
            }
        });
        if (!recentUpdates) {
            console.log('❌ ERROR: No profile found for this user!');
            return { hasActivity: false, completedToday: [], progressDelta: 0 };
        }
        const userUpdated = recentUpdates.user.updatedAt && recentUpdates.user.updatedAt >= today;
        const profileTableUpdated = recentUpdates.updatedAt && recentUpdates.updatedAt >= today;
        const profileUpdated = userUpdated || profileTableUpdated;
        const questionnaireUpdated = recentUpdates.user.questionnaireResponses.length > 0;
        const imagesUploaded = recentUpdates.user.images.length > 0;
        const hasActivity = profileUpdated || questionnaireUpdated || imagesUploaded;
        const completedToday = [];
        if (imagesUploaded)
            completedToday.push(`${recentUpdates.user.images.length} תמונות חדשות`);
        if (questionnaireUpdated)
            completedToday.push('התקדמות בשאלון');
        if (profileUpdated)
            completedToday.push('עדכון פרופיל או נתוני משתמש');
        console.log('🔥🔥🔥 DETECT DAILY ACTIVITY - END 🔥🔥🔥\n');
        return {
            hasActivity,
            completedToday,
            progressDelta: 0
        };
    }
    static async getEveningFeedbackEmail(profile, dailyActivity, dict) {
        var _a, _b;
        if (!dailyActivity.hasActivity)
            return null;
        const emailDict = dict.engagement.eveningFeedback;
        // --- תחילת התיקון ---
        // תבנית המייל 'evening_feedback.hbs' מצפה למשתנה יחיד בשם 'aiInsight'.
        // ניתן עדיפות לסיכום האישיות המלא, מכיוון שהוא מקיף יותר וכמעט תמיד זמין אם ה-AI רץ.
        // נשתמש ב"נקודת החוזק" רק כגיבוי אם הסיכום הכללי חסר מסיבה כלשהי.
        let bestAiInsight = undefined;
        if ((_a = profile.aiInsights) === null || _a === void 0 ? void 0 : _a.personalitySummary) {
            bestAiInsight = profile.aiInsights.personalitySummary;
        }
        else if (((_b = profile.aiInsights) === null || _b === void 0 ? void 0 : _b.topStrengths) && profile.aiInsights.topStrengths.length > 0) {
            bestAiInsight = profile.aiInsights.topStrengths[0];
        }
        // --- סוף התיקון ---
        return {
            type: 'EVENING_FEEDBACK',
            priority: 'NORMAL',
            subject: populateTemplate(emailDict.subject, { firstName: profile.firstName }),
            content: {
                hook: emailDict.hook,
                mainMessage: emailDict.mainMessage,
                todayProgress: {
                    itemsCompleted: dailyActivity.completedToday,
                    newCompletion: dailyActivity.progressDelta
                },
                // נשתמש במשתנה החדש והמשופר 'bestAiInsight' עבור התבנית
                aiInsight: bestAiInsight,
                specificAction: this.getNextBestAction(profile),
                progressVisualization: this.generateProgressBar(profile.completionStatus.overall),
                encouragement: emailDict.encouragement
            },
            sendInDays: 0
        };
    }
    static getEstimatedTime(profile, locale = 'he') {
        const { completionStatus } = profile;
        if (!completionStatus.photos.isDone) {
            const missingPhotos = 3 - completionStatus.photos.current;
            return locale === 'he'
                ? `${missingPhotos * 2}-${missingPhotos * 3} דקות`
                : `${missingPhotos * 2}-${missingPhotos * 3} minutes`;
        }
        if (completionStatus.personalDetails.missing.length > 0) {
            return locale === 'he' ? '3-5 דקות' : '3-5 minutes';
        }
        if (completionStatus.questionnaire.completionPercent < 100) {
            const remaining = 100 - completionStatus.questionnaire.completionPercent;
            if (remaining < 30)
                return locale === 'he' ? '5-8 דקות' : '5-8 minutes';
            if (remaining < 60)
                return locale === 'he' ? '10-15 דקות' : '10-15 minutes';
            return locale === 'he' ? '15-20 דקות' : '15-20 minutes';
        }
        if (completionStatus.partnerPreferences.missing.length > 0) {
            return locale === 'he' ? '5-7 דקות' : '5-7 minutes';
        }
        return locale === 'he' ? 'כמה דקות' : 'a few minutes';
    }
    static async sendEmail(user, email) {
        var _a, _b, _c, _d, _e;
        const { emailService } = await Promise.resolve().then(() => __importStar(require('./emailService')));
        const locale = user.language || 'he';
        try {
            let success = false;
            let unsubscribeUrl = '';
            const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
            if (secret) {
                const token = await new jose_1.SignJWT({ userId: user.id, email: user.email })
                    .setProtectedHeader({ alg: 'HS256' })
                    .setIssuedAt()
                    .setExpirationTime('90d')
                    .sign(secret);
                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
                unsubscribeUrl = `${baseUrl}/${locale}/unsubscribe?token=${token}`;
            }
            const profile = await this.buildUserEngagementProfile(user.id, false);
            const estimatedTime = this.getEstimatedTime(profile, locale);
            const ctaLink = `${process.env.NEXT_PUBLIC_BASE_URL}/profile`;
            const ctaText = locale === 'he' ? 'להמשך בניית הפרופיל' : 'Continue building profile';
            switch (email.type) {
                case 'AI_SUMMARY':
                    success = await emailService.sendTemplateEmail({
                        locale: locale,
                        to: user.email,
                        subject: email.subject,
                        templateName: 'aiInsight',
                        context: {
                            firstName: user.firstName,
                            personalitySummary: email.content.systemSummary,
                            unsubscribeUrl,
                        }
                    });
                    break;
                // src/lib/engagement/SmartEngagementOrchestrator.ts -> sendEmail()
                case 'EVENING_FEEDBACK':
                    success = await emailService.sendTemplateEmail({
                        locale: locale,
                        to: user.email,
                        subject: email.subject,
                        templateName: 'evening_feedback',
                        context: Object.assign(Object.assign({}, email.content), { 
                            // --- סוף: הוספת השדות החסרים ---
                            firstName: user.firstName, progressPercentage: ((_b = (_a = email.content.progressVisualization) === null || _a === void 0 ? void 0 : _a.match(/\d+/)) === null || _b === void 0 ? void 0 : _b[0]) || '0', todayCompletedItems: ((_c = email.content.todayProgress) === null || _c === void 0 ? void 0 : _c.itemsCompleted) || [], nextAction: email.content.specificAction, estimatedTime: estimatedTime, ctaLink: ctaLink, ctaText: ctaText, unsubscribeUrl })
                    });
                    break;
                case 'CELEBRATION':
                    success = await emailService.sendTemplateEmail({
                        locale: locale,
                        to: user.email,
                        subject: email.subject,
                        templateName: 'almostDone',
                        context: {
                            firstName: user.firstName,
                            progressPercentage: profile.completionStatus.overall,
                            remainingItem: email.content.specificAction,
                            estimatedTime: estimatedTime,
                            aiSummary: ((_e = (_d = profile.aiInsights) === null || _d === void 0 ? void 0 : _d.personalitySummary) === null || _e === void 0 ? void 0 : _e.slice(0, 150)) + '...',
                            ctaLink: ctaLink,
                            unsubscribeUrl,
                        }
                    });
                    break;
                case 'NUDGE':
                case 'ONBOARDING_DAY_1':
                case 'ONBOARDING_PHOTOS':
                case 'ONBOARDING_AI_TEASER':
                case 'ONBOARDING_QUESTIONNAIRE_WHY':
                case 'ONBOARDING_VALUE_ADD':
                case 'VALUE':
                default:
                    success = await emailService.sendCustomEmail(user.email, email.subject, 'generic', {
                        firstName: user.firstName,
                        headerTitle: email.content.hook,
                        mainContent: email.content.mainMessage,
                        encouragement: email.content.encouragement,
                        specificAction: email.content.specificAction,
                        estimatedTime: estimatedTime,
                        ctaLink: ctaLink,
                        ctaText: ctaText,
                        unsubscribeUrl,
                    }, locale);
                    break;
            }
            if (success) {
                console.log(`📧 Successfully sent ${email.type} email to ${user.email} in ${locale}`);
            }
        }
        catch (error) {
            console.error(`❌ Error in sendEmail for user ${user.id}:`, error);
        }
    }
    static async updateCampaignRecord(userId, emailType) {
        const updateData = {
            currentStep: { increment: 1 },
            lastSentType: emailType,
            updatedAt: new Date(),
            sentEmailTypes: { push: emailType }
        };
        if (emailType === 'EVENING_FEEDBACK') {
            updateData.lastEveningEmailSent = new Date();
            updateData.eveningEmailsCount = { increment: 1 };
        }
        if (emailType === 'AI_SUMMARY') {
            updateData.lastAiSummarySent = new Date();
            updateData.aiSummaryCount = { increment: 1 };
        }
        await prisma_1.default.userDripCampaign.upsert({
            where: { userId },
            update: updateData,
            create: Object.assign(Object.assign({ userId, currentStep: 1, lastSentType: emailType, nextSendDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), status: 'ACTIVE', sentEmailTypes: [emailType] }, (emailType === 'EVENING_FEEDBACK' && {
                lastEveningEmailSent: new Date(),
                eveningEmailsCount: 1
            })), (emailType === 'AI_SUMMARY' && {
                lastAiSummarySent: new Date(),
                aiSummaryCount: 1
            }))
        });
    }
}
exports.SmartEngagementOrchestrator = SmartEngagementOrchestrator;
exports.default = SmartEngagementOrchestrator;
