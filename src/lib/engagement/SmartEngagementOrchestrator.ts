// src/lib/engagement/SmartEngagementOrchestrator.ts

import prisma from '@/lib/prisma';
import { CampaignStatus, Language, User, Prisma } from '@prisma/client';
import aiService from '@/lib/services/aiService';
import profileAiService from '@/lib/services/profileAiService';
import { profileFeedbackService } from '@/lib/services/profileFeedbackService';
import { getEmailDictionary } from '@/lib/dictionaries';
import type { EmailDictionary } from '@/types/dictionaries/email';
import { SignJWT } from 'jose';

interface UserEngagementProfile {
  userId: string;
  firstName: string;
  daysInSystem: number;
  completionStatus: {
    overall: number;
    photos: { current: number; needed: number; isDone: boolean };
    personalDetails: { missing: string[]; isDone: boolean };
    partnerPreferences: { missing: string[]; isDone: boolean };
    questionnaire: {
      completionPercent: number;
      worldsStatus: Array<{ world: string; completed: number; total: number; isDone: boolean; }>;
    };
    hasSeenPreview: boolean;
  };
  aiInsights: {
    personalitySummary?: string;
    lookingForSummary?: string;
    topStrengths: string[];
    topGaps: string[];
  } | null;
  lastEmailSent?: Date;
  lastEmailType?: string;
  emailsSentCount: number;
  lastActiveDate?: Date;
    dripCampaign?: {
    sentEmailTypes: string[];
  } | null;

  triggers: {
    stagnant?: boolean;
    almostDone?: boolean;
    askedForTestimonial?: boolean;
  };
}

interface EmailToSend {
  type: 'ONBOARDING_DAY_1' | 'ONBOARDING_PHOTOS' | 'ONBOARDING_AI_TEASER' | 'ONBOARDING_QUESTIONNAIRE_WHY' | 'ONBOARDING_VALUE_ADD' | 'NUDGE' | 'CELEBRATION' | 'INSIGHT' | 'VALUE' | 'EVENING_FEEDBACK' | 'AI_SUMMARY';
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  subject: string;
  content: {
    hook: string;
    mainMessage: string;
    aiContent?: string;
    specificAction?: string;
    progressVisualization?: string;
    encouragement: string;
    systemSummary?: string;
    aiInsight?: string;
    todayProgress?: {
      itemsCompleted: string[];
      newCompletion: number;
    };
  };
  sendInDays: number;
}

function populateTemplate(template: string, data: Record<string, any>): string {
  if (!template) return '';
  let result = template;
  for (const key in data) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(data[key]));
  }
  return result;
}

export class SmartEngagementOrchestrator {

  // ========== Test Methods ==========
  
  static async testBuildUserEngagementProfile(userId: string) {
    return this.buildUserEngagementProfile(userId, false);
  }

  static async testDetectDailyActivity(userId: string) {
    return this.detectDailyActivity(userId);
  }

  static async testGetEveningFeedbackEmail(
    profile: UserEngagementProfile,
    dailyActivity: Awaited<ReturnType<typeof SmartEngagementOrchestrator.detectDailyActivity>>,
    dict: EmailDictionary
  ) {
    return this.getEveningFeedbackEmail(profile, dailyActivity, dict);
  }

  // [+] Exposing morning campaign emails for manual sending from dashboard
  static async testGetOnboardingDay1Email(profile: UserEngagementProfile, dict: EmailDictionary) {
      return this.getOnboardingDay1Email(profile, dict);
  }
  
  static async testGetOnboardingPhotosEmail(profile: UserEngagementProfile, dict: EmailDictionary) {
      return this.getOnboardingPhotosEmail(profile, dict);
  }
  
  static async testGetOnboardingAiTeaserEmail(profile: UserEngagementProfile, dict: EmailDictionary, language: Language) {
      if (!profile.aiInsights) {
          await this.loadAiInsights(profile, language);
      }
      return this.getOnboardingAiTeaserEmail(profile, dict);
  }
  
  static async testGetOnboardingQuestionnaireWhyEmail(profile: UserEngagementProfile, dict: EmailDictionary) {
      return this.getOnboardingQuestionnaireWhyEmail(profile, dict);
  }
  
  static async testGetOnboardingValueAddEmail(profile: UserEngagementProfile, dict: EmailDictionary, language: Language) {
      if (!profile.aiInsights) {
          await this.loadAiInsights(profile, language);
      }
      return this.getOnboardingValueAddEmail(profile, dict);
  }

  static async testGetPhotoNudgeEmail(profile: UserEngagementProfile, dict: EmailDictionary) {
    return this.getPhotoNudgeEmail(profile, dict);
  }
  
  static async testGetQuestionnaireNudgeEmail(profile: UserEngagementProfile, dict: EmailDictionary) {
    return this.getQuestionnaireNudgeEmail(profile, dict);
  }

  static async testGetAlmostDoneEmail(profile: UserEngagementProfile, dict: EmailDictionary) {
    return this.getAlmostDoneEmail(profile, dict);
  }

  static async testGetAiSummaryEmail(profile: UserEngagementProfile, dict: EmailDictionary, language: Language) {
    if (!profile.aiInsights) {
        console.log(`🧠 [Manual AI Summary] AI insights not pre-loaded. Fetching now...`);
        await this.loadAiInsights(profile, language);
    }
    return this.getAiSummaryEmail(profile, dict);
  }

  static async testGetValueEmail(profile: UserEngagementProfile, dict: EmailDictionary) {
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
        const dict = await getEmailDictionary(user.language as Language);
        
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
          await this.loadAiInsights(profile, user.language as Language);
        }
        
        // STEP 4: Generate the actual email
        const emailToSend = await this.generateEmail(emailType, profile, dict);
        
        if (emailToSend) {
          await this.sendEmail(user, emailToSend);
          await this.updateCampaignRecord(user.id, emailToSend.type);
          emailsSent++;
          console.log(`✅ [Smart Engagement] Sent ${emailToSend.type} email to user ${user.id}`);
        }
        
      } catch (error) {
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
        const dict = await getEmailDictionary(user.language as Language);
        
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
        } else {
          console.log(`⚠️  Email generation returned null - skipping`);
        }
        
      } catch (error) {
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
  
  private static async buildUserEngagementProfile(
    userId: string, 
    includeAI: boolean = false
  ): Promise<UserEngagementProfile> {
    const user = await prisma.user.findUnique({
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
    
    if (!user) throw new Error(`User ${userId} not found`);

    const daysInSystem = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const feedbackReport = await profileFeedbackService.compileFeedbackReport(
      userId, 
      user.language as Language,
      undefined,
      !includeAI
    );

    let aiInsights: UserEngagementProfile['aiInsights'] = null;
    if (includeAI) {
      aiInsights = await this.getAiInsights(userId, user.language as Language);
    }

    const campaign = user.dripCampaign;
    const lastActiveDate = user.lastLogin || user.updatedAt;
    const daysSinceActive = Math.floor((Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
    const hasAskedForTestimonial = !!(user.profile?.testimonials && user.profile.testimonials.length > 0);

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
          missing: feedbackReport.missingProfileItems.filter(item => 
            item.includes('העדפ') || item.includes('מחפש')
          ), 
          isDone: feedbackReport.missingProfileItems.filter(item => 
            item.includes('העדפ') || item.includes('מחפש')
          ).length === 0 
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
        hasSeenPreview: user.profile?.hasViewedProfilePreview || false
      },
      aiInsights,
      lastEmailSent: campaign?.updatedAt,
      lastEmailType: campaign?.lastSentType || undefined,
      emailsSentCount: campaign?.currentStep || 0,
      lastActiveDate,
        dripCampaign: user.dripCampaign ? { sentEmailTypes: user.dripCampaign.sentEmailTypes } : null,

      triggers: {
        stagnant: daysSinceActive >= 5 && daysInSystem > 7,
        almostDone: feedbackReport.completionPercentage >= 90,
        askedForTestimonial: hasAskedForTestimonial,
      }
    };
  }

  private static async loadAiInsights(
    profile: UserEngagementProfile, 
    language: Language
  ): Promise<void> {
    const aiInsights = await this.getAiInsights(profile.userId, language);
    profile.aiInsights = aiInsights;
  }

  private static async getAiInsights(
    userId: string, 
    language: Language
  ): Promise<UserEngagementProfile['aiInsights']> {
    try {
        const narrativeProfile = await profileAiService.generateNarrativeProfile(userId);
        if (!narrativeProfile) return null;

        const analysis = await aiService.getProfileAnalysis(narrativeProfile, language);
        if (!analysis) return null;

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
    } catch (error) {
        console.error(`[AI Service] Failed to get AI insights for user ${userId}:`, error);
        return null;
    }
  }

  private static async determineEmailType(
    profile: UserEngagementProfile
  ): Promise<EmailToSend['type'] | null> {
    const { daysInSystem, completionStatus, triggers, lastEmailSent, lastEmailType } = profile;

    if (lastEmailSent) {
      const daysSinceLastEmail = Math.floor(
        (Date.now() - lastEmailSent.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastEmail < 1) {
        return null;
      }
    }

const sentEmailTypes = new Set(profile.dripCampaign?.sentEmailTypes || []); // <--- זו השורה המתוקנת
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
    if (triggers.almostDone && lastEmailType !== 'CELEBRATION') return 'CELEBRATION';
    if (triggers.stagnant && lastEmailType !== 'NUDGE') return 'NUDGE';
    if (!completionStatus.photos.isDone) return 'NUDGE';
    if (completionStatus.questionnaire.completionPercent < 50) return 'NUDGE';
    if (completionStatus.overall >= 40 && completionStatus.overall < 90 && lastEmailType !== 'AI_SUMMARY') return 'AI_SUMMARY';
    
    if (daysInSystem > 7 && daysInSystem % 14 === 0) return 'VALUE';
    
    return null;
  }

  private static async generateEmail(
    emailType: EmailToSend['type'],
    profile: UserEngagementProfile,
    dict: EmailDictionary
  ): Promise<EmailToSend | null> {
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
        } else {
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
  
  private static getOnboardingDay1Email(profile: UserEngagementProfile, dict: EmailDictionary): EmailToSend {
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
  
  private static getOnboardingPhotosEmail(profile: UserEngagementProfile, dict: EmailDictionary): EmailToSend {
    
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

  private static getOnboardingAiTeaserEmail(profile: UserEngagementProfile, dict: EmailDictionary): EmailToSend {
    
    const emailDict = dict.engagement.onboardingAiTeaser;
    const aiInsightText = profile.aiInsights?.topStrengths[0] 
        
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

  private static getOnboardingQuestionnaireWhyEmail(profile: UserEngagementProfile, dict: EmailDictionary): EmailToSend {
    
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

  private static getOnboardingValueAddEmail(profile: UserEngagementProfile, dict: EmailDictionary): EmailToSend {
    
    const emailDict = dict.engagement.onboardingValueAdd;
    const tipFromAI = profile.aiInsights?.topGaps[0] 
      
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
  
  private static getPhotoNudgeEmail(profile: UserEngagementProfile, dict: EmailDictionary): EmailToSend {
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

  private static getQuestionnaireNudgeEmail(profile: UserEngagementProfile, dict: EmailDictionary): EmailToSend {
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

  private static getAlmostDoneEmail(profile: UserEngagementProfile, dict: EmailDictionary): EmailToSend {
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

  private static async getAiSummaryEmail(
    profile: UserEngagementProfile, 
    dict: EmailDictionary
  ): Promise<EmailToSend | null> {
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

  private static getValueEmail(profile: UserEngagementProfile, dict: EmailDictionary): EmailToSend {
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
  
  private static getNextBestAction(profile: UserEngagementProfile): string {
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

  private static generateProgressBar(percentage: number): string {
    const filled = Math.floor(percentage / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty) + ` ${percentage}%`;
  }

  private static async getActiveUsers() {
    return await prisma.user.findMany({
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

  private static async getTodaysActiveUsers() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return await prisma.user.findMany({
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

  private static async detectDailyActivity(userId: string): Promise<{
    hasActivity: boolean;
    completedToday: string[];
    progressDelta: number;
  }> {
    console.log('\n==============================================');
    console.log('🔥🔥🔥 DETECT DAILY ACTIVITY - START 🔥🔥🔥');
    console.log(`🔍 User ID: ${userId}`);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const recentUpdates = await prisma.profile.findUnique({
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
    
    const completedToday: string[] = [];
    if (imagesUploaded) completedToday.push(`${recentUpdates.user.images.length} תמונות חדשות`);
    if (questionnaireUpdated) completedToday.push('התקדמות בשאלון');
    if (profileUpdated) completedToday.push('עדכון פרופיל או נתוני משתמש');
    
    console.log('🔥🔥🔥 DETECT DAILY ACTIVITY - END 🔥🔥🔥\n');
    
    return { 
      hasActivity, 
      completedToday, 
      progressDelta: 0 
    };
  }

 // src/lib/engagement/SmartEngagementOrchestrator.ts

  private static async getEveningFeedbackEmail(
    profile: UserEngagementProfile,
    dailyActivity: Awaited<ReturnType<typeof SmartEngagementOrchestrator.detectDailyActivity>>,
    dict: EmailDictionary
  ): Promise<EmailToSend | null> {
    if (!dailyActivity.hasActivity) return null;
    
    const emailDict = dict.engagement.eveningFeedback;

    // --- START FIX ---
    // The template 'evening_feedback.hbs' expects a single 'aiInsight' string.
    // We will prioritize the personality summary, as it's more comprehensive and always available if AI runs.
    // We fall back to the top strength if the summary is somehow missing.
    let bestAiInsight: string | undefined = undefined;
    if (profile.aiInsights?.personalitySummary) {
        bestAiInsight = profile.aiInsights.personalitySummary;
    } else if (profile.aiInsights?.topStrengths && profile.aiInsights.topStrengths.length > 0) {
        bestAiInsight = profile.aiInsights.topStrengths[0];
    }
    // --- END FIX ---
    
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
        // The original systemSummary is no longer needed since we are combining logic into aiInsight
        // systemSummary: profile.aiInsights?.personalitySummary ...
        
        // Use the new 'bestAiInsight' variable for the template
        aiInsight: bestAiInsight,
        
        specificAction: this.getNextBestAction(profile),
        progressVisualization: this.generateProgressBar(profile.completionStatus.overall),
        encouragement: emailDict.encouragement
      },
      sendInDays: 0
    };
  }

  private static getEstimatedTime(profile: UserEngagementProfile, locale: Language = 'he'): string {
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
      if (remaining < 30) return locale === 'he' ? '5-8 דקות' : '5-8 minutes';
      if (remaining < 60) return locale === 'he' ? '10-15 דקות' : '10-15 minutes';
      return locale === 'he' ? '15-20 דקות' : '15-20 minutes';
    }
    
    if (completionStatus.partnerPreferences.missing.length > 0) {
      return locale === 'he' ? '5-7 דקות' : '5-7 minutes';
    }
    
    return locale === 'he' ? 'כמה דקות' : 'a few minutes';
  }

  private static async sendEmail(user: User, email: EmailToSend) {
    const { emailService } = await import('./emailService');
    const locale = user.language || 'he';
    
    try {
      let success = false;
      
      let unsubscribeUrl = '';
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
      if (secret) {
          const token = await new SignJWT({ userId: user.id, email: user.email })
              .setProtectedHeader({ alg: 'HS256' })
              .setIssuedAt()
              .setExpirationTime('90d')
              .sign(secret);
          
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
          unsubscribeUrl = `${baseUrl}/${locale}/unsubscribe?token=${token}`;
      }

      const profile = await this.buildUserEngagementProfile(user.id, false);
      const estimatedTime = this.getEstimatedTime(profile, locale as Language);
      const ctaLink = `${process.env.NEXT_PUBLIC_BASE_URL}/profile`;
      const ctaText = locale === 'he' ? 'להמשך בניית הפרופיל' : 'Continue building profile';

      switch(email.type) {
        case 'AI_SUMMARY':
          success = await emailService.sendTemplateEmail({
            locale: locale as Language,
            to: user.email!,
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
            locale: locale as Language,
            to: user.email!,
            subject: email.subject,
            templateName: 'evening_feedback',
            context: {
              // --- התחלה: הוספת השדות החסרים ---
              ...email.content, // מעביר את כל השדות כמו hook, mainMessage, encouragement
              // --- סוף: הוספת השדות החסרים ---
              
              firstName: user.firstName,
              progressPercentage: email.content.progressVisualization?.match(/\d+/)?.[0] || '0',
              todayCompletedItems: email.content.todayProgress?.itemsCompleted || [],
              nextAction: email.content.specificAction, // דורס את specificAction אם יש צורך בשם אחר
              estimatedTime: estimatedTime,
              ctaLink: ctaLink,
              ctaText: ctaText,
              unsubscribeUrl,
            }
          });
          break;

        case 'CELEBRATION':
          success = await emailService.sendTemplateEmail({
              locale: locale as Language,
              to: user.email!,
              subject: email.subject,
              templateName: 'almostDone',
              context: {
                  firstName: user.firstName,
                  progressPercentage: profile.completionStatus.overall,
                  remainingItem: email.content.specificAction,
                  estimatedTime: estimatedTime,
                  aiSummary: profile.aiInsights?.personalitySummary?.slice(0, 150) + '...',
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
          success = await emailService.sendCustomEmail(
            user.email!,
            email.subject,
            'generic',
            {
              firstName: user.firstName,
              headerTitle: email.content.hook,
              mainContent: email.content.mainMessage,
              encouragement: email.content.encouragement,
              specificAction: email.content.specificAction,
              estimatedTime: estimatedTime,
              ctaLink: ctaLink,
              ctaText: ctaText,
              unsubscribeUrl,
            },
            locale as Language
          );
          break;
      }
      
      if (success) {
        console.log(`📧 Successfully sent ${email.type} email to ${user.email} in ${locale}`);
      }
    } catch (error) {
      console.error(`❌ Error in sendEmail for user ${user.id}:`, error);
    }
  }

  private static async updateCampaignRecord(userId: string, emailType: string) {
    const updateData: Prisma.UserDripCampaignUpdateInput = {
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
    
    await prisma.userDripCampaign.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        currentStep: 1,
        lastSentType: emailType,
        nextSendDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        sentEmailTypes: [emailType],
        ...(emailType === 'EVENING_FEEDBACK' && {
          lastEveningEmailSent: new Date(),
          eveningEmailsCount: 1
        }),
        ...(emailType === 'AI_SUMMARY' && {
          lastAiSummarySent: new Date(),
          aiSummaryCount: 1
        })
      }
    });
  }
}

export default SmartEngagementOrchestrator;