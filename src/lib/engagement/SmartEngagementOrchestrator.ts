// src/lib/engagement/SmartEngagementOrchestrator.ts
// 🎯 OPTIMIZED VERSION - AI only when needed

import prisma from '@/lib/prisma';
import { CampaignStatus, Language, User } from '@prisma/client';
import aiService from '@/lib/services/aiService';
import profileAiService from '@/lib/services/profileAiService';
import { profileFeedbackService } from '@/lib/services/profileFeedbackService';
import { getEmailDictionary } from '@/lib/dictionaries';
import type { EmailDictionary } from '@/types/dictionaries/email';

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
  triggers: {
    stagnant?: boolean;
    almostDone?: boolean;
  };
}

interface EmailToSend {
  type: 'ONBOARDING' | 'NUDGE' | 'CELEBRATION' | 'INSIGHT' | 'VALUE' | 'EVENING_FEEDBACK' | 'AI_SUMMARY';
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

  // ========== Main Campaign Methods ==========
  
  static async runDailyCampaign() {
    console.log('🚀 [Smart Engagement] Starting daily campaign run...');
    const usersToProcess = await this.getActiveUsers();
    console.log(`📊 [Smart Engagement] Found ${usersToProcess.length} users to process`);
    
    let emailsSent = 0;
    
    for (const user of usersToProcess) {
      try {
        // ✅ STEP 1: Build profile WITHOUT expensive AI
        const profile = await this.buildUserEngagementProfile(user.id, false); // false = no AI yet
        const dict = await getEmailDictionary(user.language as Language);
        
        // ✅ STEP 2: Decide if email is needed (cheap check)
        const emailType = await this.determineEmailType(profile, dict);
        
        if (!emailType) {
          console.log(`⏭️ [Smart Engagement] No email needed for user ${user.id} at this time`);
          continue; // 🎯 Skip expensive AI if no email needed!
        }
        
        // ✅ STEP 3: Only NOW get AI insights if needed
        const needsAI = emailType === 'AI_SUMMARY' || emailType === 'INSIGHT';
        if (needsAI && !profile.aiInsights) {
          console.log(`🧠 [Smart Engagement] Fetching AI insights for ${emailType} email...`);
          await this.loadAiInsights(profile, user.language as Language);
        }
        
        // ✅ STEP 4: Generate the actual email
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

  static async runEveningCampaign() {
    console.log('🌙 [Smart Engagement] Starting evening feedback campaign run...');
    const usersToProcess = await this.getTodaysActiveUsers();
    console.log(`📊 [Smart Engagement] Found ${usersToProcess.length} active users today`);
    
    let emailsSent = 0;
    
    for (const user of usersToProcess) {
      try {
        const profile = await this.buildUserEngagementProfile(user.id, false);
        const dict = await getEmailDictionary(user.language as Language);
        const dailyActivity = await this.detectDailyActivity(profile.userId);
        
        if (!dailyActivity.hasActivity) {
          console.log(`⏭️ [Smart Engagement] No activity detected for user ${user.id}, skipping.`);
          continue;
        }
        
        const emailToSend = await this.getEveningFeedbackEmail(profile, dailyActivity, dict);
        
        if (emailToSend) {
          await this.sendEmail(user, emailToSend);
          await this.updateCampaignRecord(user.id, emailToSend.type);
          emailsSent++;
          console.log(`✅ [Smart Engagement] Sent EVENING_FEEDBACK to user ${user.id}`);
        }
        
      } catch (error) {
        console.error(`❌ [Smart Engagement] Error processing user ${user.id}:`, error);
      }
    }
    
    console.log(`🎉 [Smart Engagement] Evening campaign complete. Sent ${emailsSent} emails.`);
    return { processed: usersToProcess.length, sent: emailsSent };
  }

  // ========== Core Logic Methods ==========
  
  private static async buildUserEngagementProfile(
    userId: string, 
    includeAI: boolean = false // 🎯 New parameter
  ): Promise<UserEngagementProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
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
    undefined,  // questionsDict
    !includeAI  // 🔍 skipAI = true כש-includeAI = false
  );


    // 🎯 AI is optional now
    let aiInsights: UserEngagementProfile['aiInsights'] = null;
    if (includeAI) {
      aiInsights = await this.getAiInsights(userId, user.language as Language);
    }

    const campaign = user.dripCampaign;
    const lastActiveDate = user.lastLogin || user.updatedAt;
    const daysSinceActive = Math.floor((Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));

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
            total: 19,
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
      triggers: {
        stagnant: daysSinceActive >= 5,
        almostDone: feedbackReport.completionPercentage >= 90
      }
    };
  }

  // 🆕 Separate method to load AI only when needed
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
  }

  // 🆕 Determine email type BEFORE expensive AI calls
  private static async determineEmailType(
    profile: UserEngagementProfile,
    dict: EmailDictionary
  ): Promise<string | null> {
    const { daysInSystem, completionStatus, triggers, lastEmailSent } = profile;

    // Check if it's too soon to send
    if (lastEmailSent) {
      const daysSinceLastEmail = Math.floor(
        (Date.now() - lastEmailSent.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastEmail < 3) {
        return null; // 🎯 Exit early - save money!
      }
    }

    // Determine email type (no AI needed yet)
    if (daysInSystem <= 7) return 'ONBOARDING';
    if (triggers.almostDone) return 'CELEBRATION';
    if (triggers.stagnant) return 'NUDGE';
    if (!completionStatus.photos.isDone) return 'NUDGE';
    if (completionStatus.questionnaire.completionPercent < 50) return 'NUDGE';
    if (completionStatus.overall >= 40 && completionStatus.overall < 90) return 'AI_SUMMARY';
    if (daysInSystem % 14 === 0) return 'VALUE';
    
    return null;
  }

  // 🆕 Generate email based on type
  private static async generateEmail(
    emailType: string,
    profile: UserEngagementProfile,
    dict: EmailDictionary
  ): Promise<EmailToSend | null> {
    switch (emailType) {
      case 'ONBOARDING':
        return this.getOnboardingEmail(profile, dict);
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

  // ========== Email Generators (existing methods) ==========
  
  private static getOnboardingEmail(profile: UserEngagementProfile, dict: EmailDictionary): EmailToSend {
    const { daysInSystem, completionStatus } = profile;
    const { engagement } = dict;
    
    if (daysInSystem === 1) {
      const emailDict = engagement.onboardingDay1;
      return {
        type: 'ONBOARDING',
        priority: 'HIGH',
        subject: populateTemplate(emailDict.subject, { firstName: profile.firstName }),
        content: {
          hook: emailDict.hook,
          mainMessage: emailDict.mainMessage,
          specificAction: this.getNextBestAction(profile),
          encouragement: emailDict.encouragement
        },
        sendInDays: 0
      };
    }
    
    // Add other onboarding days...
    return this.getOnboardingEmail(profile, dict); // Placeholder
  }

   private static getPhotoNudgeEmail(profile: UserEngagementProfile, dict: EmailDictionary): EmailToSend {
    // ✅ שיפרנו את התוכן להיות ממוקד ב"למה"
    const emailDict = dict.engagement.photoNudge;
    const missingCount = 3 - profile.completionStatus.photos.current;
    
    return {
      type: 'NUDGE',
      priority: 'HIGH',
      subject: populateTemplate(emailDict.subject, { firstName: profile.firstName }),
      content: {
        // ✅ הוק (Hook) חם ומסביר יותר
        hook: populateTemplate(emailDict.hook, { firstName: profile.firstName }),
        // ✅ מסר מרכזי שמדבר על חיבור אנושי, לא על דרישה טכנית
        mainMessage: populateTemplate(emailDict.mainMessage, { missingCount }),
        // ✅ קריאה לפעולה ספציפית
        specificAction: emailDict.specificAction,
        // ✅ עידוד שמחבר את הפעולה למטרה הגדולה
        encouragement: emailDict.encouragement
      },
      sendInDays: 0
    };
  }



  private static getQuestionnaireNudgeEmail(profile: UserEngagementProfile, dict: EmailDictionary): EmailToSend {
    // ✅ שיפרנו את התוכן כדי להדגיש את הערך למשתמש
    const emailDict = dict.engagement.questionnaireNudge;
    const { worldsStatus } = profile.completionStatus.questionnaire;
    
    // знаходи את העולם הכי פחות מלא כדי לתת הנחיה ממוקדת
    const mostEmptyWorld = worldsStatus
        .filter(w => !w.isDone)
        .sort((a, b) => a.completed - b.completed)[0] || { world: 'כללי' };
    
    return {
      type: 'NUDGE',
      priority: 'NORMAL',
      subject: populateTemplate(emailDict.subject, { firstName: profile.firstName }),
      content: {
        hook: populateTemplate(emailDict.hook, { firstName: profile.firstName }),
        // ✅ מסר מרכזי שמסביר שהשאלון הוא "מצפן" ולא "מטלה"
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
    const { aiInsights, completionStatus } = profile;
    
    if (!aiInsights || completionStatus.overall < 40) return null;
    
    const emailDict = dict.engagement.aiSummary;
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
    // ✅ שיפרנו את הלוגיקה כדי לתמוך במגוון נושאים
    const topics = dict.engagement.value; // 'value' הוא עכשיו מערך של אובייקטים
    
    // בחר נושא אקראי מתוך המערך
    const topic = topics[Math.floor(Math.random() * topics.length)];
    
    return {
      type: 'VALUE',
      priority: 'LOW',
      subject: populateTemplate(topic.subject, { firstName: profile.firstName }),
      content: {
        hook: populateTemplate(topic.hook, { firstName: profile.firstName }),
        // ✅ התוכן מגיע ישירות מהמילון, מה שמאפשר גמישות רבה
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
      return profile.completionStatus.personalDetails.missing[0];
    }
    if (profile.completionStatus.questionnaire.completionPercent < 80) {
      return 'השלם את השאלון';
    }
    if (!profile.completionStatus.hasSeenPreview) {
      return 'עיין בתצוגה המקדימה של הפרופיל';
    }
    return 'הפרופיל כמעט מושלם!';
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
        marketingConsent: true,
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
        marketingConsent: true,
        isProfileComplete: false,
        OR: [
          { lastLogin: { gte: today } },
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const recentUpdates = await prisma.profile.findUnique({
      where: { userId },
      select: {
        updatedAt: true,
        user: {
          select: {
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
    
    const hasActivity = (
      (recentUpdates?.updatedAt && recentUpdates.updatedAt >= today) ||
      (recentUpdates?.user.questionnaireResponses.length ?? 0) > 0 ||
      (recentUpdates?.user.images.length ?? 0) > 0
    );
    
    const completedToday: string[] = [];
    
    if (recentUpdates?.user.images.length) {
      completedToday.push(`${recentUpdates.user.images.length} תמונות חדשות`);
    }
    if (recentUpdates?.user.questionnaireResponses.length) {
      completedToday.push('התקדמות בשאלון');
    }
    if (recentUpdates?.updatedAt && recentUpdates.updatedAt >= today) {
      completedToday.push('עדכון פרופיל');
    }
    
    return { hasActivity, completedToday, progressDelta: 0 };
  }

  private static async getEveningFeedbackEmail(
    profile: UserEngagementProfile,
    dailyActivity: Awaited<ReturnType<typeof SmartEngagementOrchestrator.detectDailyActivity>>,
    dict: EmailDictionary
  ): Promise<EmailToSend | null> {
    if (!dailyActivity.hasActivity) return null;
    
    const emailDict = dict.engagement.eveningFeedback;
    
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
        systemSummary: profile.aiInsights?.personalitySummary 
          ? populateTemplate(emailDict.systemSummary || '', { 
              summary: profile.aiInsights.personalitySummary.slice(0, 200) 
            })
          : undefined,
        aiInsight: profile.aiInsights?.topStrengths[0],
        specificAction: this.getNextBestAction(profile),
        progressVisualization: this.generateProgressBar(profile.completionStatus.overall),
        encouragement: emailDict.encouragement
      },
      sendInDays: 0
    };
  }
private static getEstimatedTime(profile: UserEngagementProfile, locale: Language = 'he'): string {
  const { completionStatus } = profile;
  
  // אם חסרות תמונות - זה הכי מהיר
  if (!completionStatus.photos.isDone) {
    const missingPhotos = 3 - completionStatus.photos.current;
    return locale === 'he' 
      ? `${missingPhotos * 2}-${missingPhotos * 3} דקות` 
      : `${missingPhotos * 2}-${missingPhotos * 3} minutes`;
  }
  
  // אם חסרים פרטים אישיים
  if (completionStatus.personalDetails.missing.length > 0) {
    const missingCount = completionStatus.personalDetails.missing.length;
    if (missingCount <= 3) {
      return locale === 'he' ? '3-5 דקות' : '3-5 minutes';
    } else {
      return locale === 'he' ? '5-10 דקות' : '5-10 minutes';
    }
  }
  
  // אם השאלון לא מלא
  if (completionStatus.questionnaire.completionPercent < 100) {
    const remaining = 100 - completionStatus.questionnaire.completionPercent;
    if (remaining < 30) {
      return locale === 'he' ? '5-8 דקות' : '5-8 minutes';
    } else if (remaining < 60) {
      return locale === 'he' ? '10-15 דקות' : '10-15 minutes';
    } else {
      return locale === 'he' ? '15-20 דקות' : '15-20 minutes';
    }
  }
  
  // אם חסרות העדפות בן/בת זוג
  if (completionStatus.partnerPreferences.missing.length > 0) {
    return locale === 'he' ? '5-7 דקות' : '5-7 minutes';
  }
  
  // ברירת מחדל
  return locale === 'he' ? '5 דקות' : '5 minutes';
}

 private static async sendEmail(user: User, email: EmailToSend) {
  const { emailService } = await import('./emailService');
  const locale = user.language || 'he';
  
  try {
    let success = false;
    
    if (email.type === 'AI_SUMMARY') {
      success = await emailService.sendTemplateEmail({
        locale: locale as Language,
        to: user.email!,
        subject: email.subject,
        templateName: 'aiInsight',
        context: {
          firstName: user.firstName,
          personalitySummary: email.content.systemSummary
        }
      });
    } else if (email.type === 'EVENING_FEEDBACK') {
      // 🔥 כאן התיקון - חישוב דינמי של הזמן
      const profile = await this.buildUserEngagementProfile(user.id, false);
      const estimatedTime = this.getEstimatedTime(profile, locale as Language);
      
      success = await emailService.sendTemplateEmail({
        locale: locale as Language,
        to: user.email!,
        subject: email.subject,
        templateName: 'evening_feedback',
        context: {
          firstName: user.firstName,
          progressPercentage: email.content.progressVisualization?.match(/\d+/)?.[0] || '0',
          todayCompletedItems: email.content.todayProgress?.itemsCompleted || [],
          systemSummary: email.content.systemSummary,
          aiInsight: email.content.aiInsight,
          nextAction: email.content.specificAction,
          estimatedTime: estimatedTime, // 🎯 עכשיו דינמי!
          ctaLink: `${process.env.NEXT_PUBLIC_BASE_URL}/profile`,
          ctaText: locale === 'he' ? 'להמשך בניית הפרופיל' : 'Continue building profile'
        }
      });
    } else {
      // עבור מיילים אחרים
      const profile = await this.buildUserEngagementProfile(user.id, false);
      const estimatedTime = this.getEstimatedTime(profile, locale as Language);
      
      success = await emailService.sendCustomEmail(
        user.email!,
        email.subject,
        'generic',
        {
          firstName: user.firstName,
          headerTitle: email.content.hook,
          mainMessage: email.content.mainMessage,
          encouragement: email.content.encouragement,
          specificAction: email.content.specificAction,
          estimatedTime: estimatedTime, // גם כאן דינמי
          ctaLink: `${process.env.NEXT_PUBLIC_BASE_URL}/profile`,
          ctaText: locale === 'he' ? 'להמשך בניית הפרופיל' : 'Continue building profile'
        },
        locale as Language
      );
    }
    
    if (success) {
      console.log(`📧 Successfully sent ${email.type} email to ${user.email} in ${locale}`);
    }
  } catch (error) {
    console.error(`❌ Error in sendEmail for user ${user.id}:`, error);
  }
}

  private static async updateCampaignRecord(userId: string, emailType: string) {
    const updateData: any = {
      currentStep: { increment: 1 },
      lastSentType: emailType,
      updatedAt: new Date()
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
        nextSendDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
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