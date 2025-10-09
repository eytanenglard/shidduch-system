// src/lib/engagement/SmartEngagementOrchestrator.ts

import prisma from '@/lib/prisma';
import { CampaignStatus } from '@prisma/client';
import aiService from '@/lib/services/aiService';
import profileAiService from '@/lib/services/profileAiService';
import { profileFeedbackService } from '@/lib/services/profileFeedbackService';
import { getQuestionnaireQuestionsDictionary } from '@/lib/dictionaries';

/**
 * 🧠 המוח המרכזי של מערכת ה-Engagement
 * מתזמן את כל סוגי התקשורת עם המשתמשים בצורה חכמה
 */

// ================== טייפים מרכזיים ==================

interface UserEngagementProfile {
  userId: string;
  daysInSystem: number;

  // מצב השלמת הפרופיל
  completionStatus: {
    overall: number; // 0-100
    photos: { current: number; needed: number; isDone: boolean };
    personalDetails: { missing: string[]; isDone: boolean };
    partnerPreferences: { missing: string[]; isDone: boolean };
    questionnaire: {
      completionPercent: number;
      worldsStatus: Array<{
        world: string;
        completed: number;
        total: number;
        isDone: boolean;
      }>;
    };
    hasSeenPreview: boolean;
  };

  // תובנות AI
  aiInsights: {
    personalitySummary?: string;
    lookingForSummary?: string;
    topStrengths: string[];
    topGaps: string[];
  } | null;

  // היסטוריית אינטראקציות
  lastEmailSent?: Date;
  lastEmailType?: string;
  emailsSentCount: number;
  lastActiveDate?: Date;

  // טריגרים מיוחדים
  triggers: {
    justCompletedSection?: string; // הרגע השלים משהו
    stagnant?: boolean; // לא פעיל 5+ ימים
    almostDone?: boolean; // מעל 90%
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
    // שדות חדשים למיילי ערב ו-AI
    systemSummary?: string;  // דבר המערכת
    aiInsight?: string;       // תובנת AI ראשונית
    todayProgress?: {         // התקדמות היום
      itemsCompleted: string[];
      newCompletion: number;
    };
  };
  sendInDays: number;
}


// ================== השירות המרכזי ==================

export class SmartEngagementOrchestrator {
  // ========== פונקציה חדשה: זיהוי פעילות יומית ==========
  private static async detectDailyActivity(userId: string): Promise<{
    hasActivity: boolean;
    completedToday: string[];
    progressDelta: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // בדיקת עדכונים מהיום
    const recentUpdates = await prisma.profile.findUnique({
      where: { userId },
      select: {
        updatedAt: true,
        user: {
          select: {
            questionnaireResponses: {
              where: {
                lastSaved: { gte: today }
              },
              orderBy: { lastSaved: 'desc' },
              take: 1
            },
            images: {
              where: {
                createdAt: { gte: today }
              }
            }
          }
        }
      }
    });

    const hasActivity =
      (recentUpdates?.updatedAt && recentUpdates.updatedAt >= today) ||
      (recentUpdates?.user.questionnaireResponses.length ?? 0) > 0 ||
      (recentUpdates?.user.images.length ?? 0) > 0;

    const completedToday: string[] = [];

    if (recentUpdates?.user.images.length) {
      completedToday.push(`${recentUpdates.user.images.length} תמונות חדשות`);
    }

    if (recentUpdates?.user.questionnaireResponses.length) {
      completedToday.push('התקדמות בשאלון');
    }

    // חישוב שינוי באחוזים (דורש השוואה למצב אתמול)
    const progressDelta = 0; // TODO: לממש לוגיקה מלאה

    return { hasActivity, completedToday, progressDelta };
  }

  static async testBuildUserEngagementProfile(userId: string) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test methods not available in production');
  }
  return this.buildUserEngagementProfile(userId);
}

static async testDecideNextEmail(profile: UserEngagementProfile) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test methods not available in production');
  }
  return this.decideNextEmail(profile);
}

static async testDetectDailyActivity(userId: string) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test methods not available in production');
  }
  return this.detectDailyActivity(userId);
}

static async testGetEveningFeedbackEmail(
  profile: UserEngagementProfile,
  dailyActivity: Awaited<ReturnType<typeof SmartEngagementOrchestrator.detectDailyActivity>>
) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test methods not available in production');
  }
  return this.getEveningFeedbackEmail(profile, dailyActivity);
}

  // ========== פונקציה חדשה: יצירת מייל פידבק ערב ==========
  private static async getEveningFeedbackEmail(
    profile: UserEngagementProfile,
    dailyActivity: Awaited<ReturnType<typeof SmartEngagementOrchestrator.detectDailyActivity>>
  ): Promise<EmailToSend | null> {

    if (!dailyActivity.hasActivity) {
      return null; // אין פעילות היום = אין מייל
    }

    const { completionStatus, aiInsights } = profile;

    return {
      type: 'EVENING_FEEDBACK',
      priority: 'NORMAL',
      subject: `${profile.userId}, סיכום יום מעולה! ✨`,
      content: {
        hook: `כל הכבוד על ההשקעה שלך היום!`,
        mainMessage: `ראינו את ההתקדמות שלך היום ורצינו לשתף אותך במה שלמדנו`,
        todayProgress: {
          itemsCompleted: dailyActivity.completedToday,
          newCompletion: dailyActivity.progressDelta
        },
        systemSummary: aiInsights?.personalitySummary
          ? `דבר המערכת: ${aiInsights.personalitySummary.slice(0, 200)}...`
          : undefined,
        aiInsight: aiInsights?.topStrengths[0],
        specificAction: this.getNextBestAction(profile),
        progressVisualization: this.generateProgressBar(completionStatus.overall),
        encouragement: 'ממשיכים לעבוד! מחר נמשיך 💪'
      },
      sendInDays: 0
    };
  }

  // ========== פונקציה חדשה: מייל סיכום AI ==========
 private static async getAiSummaryEmail(
  profile: UserEngagementProfile
): Promise<EmailToSend | null> {

  const { aiInsights, completionStatus } = profile;

  if (!aiInsights || completionStatus.overall < 40) {
    return null;
  }

  return {
    type: 'AI_SUMMARY',
    priority: 'NORMAL',
    subject: `${profile.userId}, גילינו משהו מעניין עליך 🧠`,
    content: {
      hook: 'המערכת שלנו ניתחה את הפרופיל שלך...',
      mainMessage: 'הנה תובנה מיוחדת:',
      systemSummary: `הבר המערכת (סיכום השידכן):\n"${aiInsights.personalitySummary}"`,
      aiInsight: aiInsights.lookingForSummary,
      specificAction: 'כדי שנוכל להבין אותך עוד יותר טוב, נשאר רק: ' + this.getNextBestAction(profile),
      encouragement: 'פרופילים מלאים מקבלים פי 3 יותר התאמות איכותיות!'
    },
    sendInDays: 0
  };
}


  /**
   * 🎬 הפונקציה הראשית - רצה על כל המשתמשים ותחליט מה לשלוח
   */
  static async runDailyCampaign() {
    console.log('🚀 [Smart Engagement] Starting daily campaign run...');

    // שלב 1: מצא את כל המשתמשים הפעילים שצריכים תשומת לב
    const usersToProcess = await this.getActiveUsers();

    console.log(`📊 [Smart Engagement] Found ${usersToProcess.length} users to process`);

    let emailsSent = 0;

    for (const user of usersToProcess) {
      try {
        // שלב 2: בנה פרופיל engagement מלא עבור המשתמש
        const profile = await this.buildUserEngagementProfile(user.id);

        // שלב 3: החלט איזה מייל לשלוח (אם בכלל)
        const emailToSend = await this.decideNextEmail(profile);

        if (emailToSend) {
          // שלב 4: שלח את המייל
          await this.sendEmail(user, emailToSend);

          // שלב 5: עדכן את הקמפיין במסד הנתונים
          await this.updateCampaignRecord(user.id, emailToSend.type);

          emailsSent++;
          console.log(`✅ [Smart Engagement] Sent ${emailToSend.type} email to user ${user.id}`);
        } else {
          console.log(`⏭️ [Smart Engagement] No email needed for user ${user.id} at this time`);
        }

      } catch (error) {
        console.error(`❌ [Smart Engagement] Error processing user ${user.id}:`, error);
      }
    }

    console.log(`🎉 [Smart Engagement] Campaign complete. Sent ${emailsSent} emails.`);
    return { processed: usersToProcess.length, sent: emailsSent };
  }

  /**
   * 🌙 הפונקציה הראשית לקמפיין ערב - רצה על משתמשים שפעלו היום
   */
  static async runEveningCampaign() {
    console.log('🌙 [Smart Engagement] Starting evening feedback campaign run...');

    // שלב 1: מצא את כל המשתמשים שהיו פעילים היום
    const usersToProcess = await this.getTodaysActiveUsers();

    console.log(`📊 [Smart Engagement] Found ${usersToProcess.length} active users today`);

    let emailsSent = 0;

    for (const user of usersToProcess) {
      try {
        // שלב 2: בנה פרופיל engagement מלא עבור המשתמש
        const profile = await this.buildUserEngagementProfile(user.id);

        // שלב 3: בדוק פעילות יומית וצור את מייל הפידבק
        const dailyActivity = await this.detectDailyActivity(profile.userId);
        const emailToSend = await this.getEveningFeedbackEmail(profile, dailyActivity);

        if (emailToSend) {
          // שלב 4: שלח את המייל
          await this.sendEmail(user, emailToSend);

          // שלב 5: עדכן את הקמפיין במסד הנתונים
          await this.updateCampaignRecord(user.id, emailToSend.type);

          emailsSent++;
          console.log(`✅ [Smart Engagement] Sent EVENING_FEEDBACK email to user ${user.id}`);
        } else {
          console.log(`⏭️ [Smart Engagement] No activity detected for user ${user.id}, skipping evening email.`);
        }

      } catch (error) {
        console.error(`❌ [Smart Engagement] Error processing user ${user.id} in evening campaign:`, error);
      }
    }

    console.log(`🎉 [Smart Engagement] Evening campaign complete. Sent ${emailsSent} emails.`);
    return { processed: usersToProcess.length, sent: emailsSent };
  }

  /**
   * 🔍 מצא משתמשים שזקוקים לתשומת לב (לקמפיין יומי כללי)
   */
  private static async getActiveUsers() {
    return await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        marketingConsent: true,
        // רק משתמשים שלא השלימו 100%
        isProfileComplete: false,
      },
      include: {
        profile: true,
        images: true,
        questionnaireResponses: { take: 1, orderBy: { lastSaved: 'desc' } },
        dripCampaign: true,
      },
    });
  }

  /**
   * 🌙 מצא משתמשים שהיו פעילים היום (לקמפיין ערב)
   */
  private static async getTodaysActiveUsers() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        marketingConsent: true,
        isProfileComplete: false, // נמשיך לעודד השלמת פרופיל
        // מצא משתמשים שהתחברו או עודכנו היום
        OR: [
          { lastLogin: { gte: today } },
          { updatedAt: { gte: today } },
          {
            questionnaireResponses: {
              some: { lastSaved: { gte: today } }
            }
          }
        ],
      },
    });
  }

  /**
   * 🧩 בנה פרופיל engagement מקיף
   */
  private static async buildUserEngagementProfile(userId: string): Promise<UserEngagementProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        images: true,
        questionnaireResponses: { take: 1, orderBy: { lastSaved: 'desc' } },
        dripCampaign: true,
      },
    });

    if (!user) throw new Error(`User ${userId} not found`);

    const daysInSystem = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // שימוש בלוגיקה של ProfileChecklist
    const questionsDict = await getQuestionnaireQuestionsDictionary('he');
    const feedbackReport = await profileFeedbackService.compileFeedbackReport(
      userId,
      'he',
      questionsDict
    );

    // קבלת תובנות AI
    let aiInsights: UserEngagementProfile['aiInsights'] = null;
    const narrativeProfile = await profileAiService.generateNarrativeProfile(userId);
    if (narrativeProfile) {
      const analysis = await aiService.getProfileAnalysis(narrativeProfile);
      if (analysis) {
        aiInsights = {
          personalitySummary: analysis.personalitySummary,
          lookingForSummary: analysis.lookingForSummary,
          topStrengths: analysis.completenessReport
            .filter(r => r.status === 'COMPLETE')
            .slice(0, 3)
            .map(r => r.feedback),
          topGaps: analysis.actionableTips.slice(0, 3).map(t => t.tip),
        };
      }
    }

    const campaign = user.dripCampaign;
    const lastActiveDate = user.lastLogin || user.updatedAt;
    const daysSinceActive = Math.floor(
      (Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      userId,
      daysInSystem,
      completionStatus: {
        overall: feedbackReport.completionPercentage,
        photos: {
          current: user.images.length,
          needed: 3,
          isDone: user.images.length >= 3,
        },
        personalDetails: {
          missing: feedbackReport.missingProfileItems,
          isDone: feedbackReport.missingProfileItems.length === 0,
        },
        partnerPreferences: {
          missing: feedbackReport.missingProfileItems.filter(item =>
            item.includes('העדפ') || item.includes('מחפש')
          ),
          isDone: feedbackReport.missingProfileItems.filter(item =>
            item.includes('העדפ') || item.includes('מחפש')
          ).length === 0,
        },
        questionnaire: {
          completionPercent: feedbackReport.completionPercentage,
          worldsStatus: feedbackReport.missingQuestionnaireItems.map(item => ({
            world: item.world,
            completed: 0, // יש להשלים מהדאטה
            total: 19,
            isDone: false,
          })),
        },
        hasSeenPreview: user.profile?.hasViewedProfilePreview || false,
      },
      aiInsights,
      lastEmailSent: campaign?.updatedAt,
      lastEmailType: campaign?.lastSentType || undefined,
      emailsSentCount: campaign?.currentStep || 0,
      lastActiveDate,
      triggers: {
        stagnant: daysSinceActive >= 5,
        almostDone: feedbackReport.completionPercentage >= 90,
      },
    };
  }

  /**
   * 🎲 הכרעה: איזה מייל לשלוח? (עבור הקמפיין היומי)
   */
  private static async decideNextEmail(profile: UserEngagementProfile): Promise<EmailToSend | null> {
    const { daysInSystem, completionStatus, triggers, lastEmailSent } = profile;

    // כלל 1: אל תשלח מייל אם שלחנו משהו לפני פחות מ-3 ימים
    if (lastEmailSent) {
      const daysSinceLastEmail = Math.floor(
        (Date.now() - lastEmailSent.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastEmail < 3) {
        return null;
      }
    }

    // === משתמשים חדשים (ימים 1-7) ===
    if (daysInSystem <= 7) {
      return this.getOnboardingEmail(profile);
    }

    // === משתמשים ותיקים (8+ ימים) ===

    // טריגר 1: יש מספיק מידע ל-AI אבל עדיין לא שלחנו סיכום
    if (completionStatus.overall >= 40 && completionStatus.overall < 90) {
      const aiEmail = await this.getAiSummaryEmail(profile);
      if (aiEmail) return aiEmail;
    }

    // טריגר 2: כמעט סיים (90%+)
    if (triggers.almostDone) {
      return this.getAlmostDoneEmail(profile);
    }

    // טריגר 3: לא פעיל 5+ ימים
    if (triggers.stagnant) {
      return this.getReengagementEmail(profile);
    }

    // טריגר 4: יש פערים קריטיים
    if (!completionStatus.photos.isDone) {
      return this.getPhotoNudgeEmail(profile);
    }

    if (completionStatus.questionnaire.completionPercent < 50) {
      return this.getQuestionnaireNudgeEmail(profile);
    }

    // ברירת מחדל: מייל ערך כללי
    if (daysInSystem % 14 === 0) {
      return this.getValueEmail(profile);
    }

    return null;
  }

  // ================== יוצרי מיילים ספציפיים ==================

  private static getOnboardingEmail(profile: UserEngagementProfile): EmailToSend {
    const { daysInSystem, completionStatus, aiInsights } = profile;

    if (daysInSystem === 1) {
      return {
        type: 'ONBOARDING',
        priority: 'HIGH',
        subject: `${profile.userId}, ברוך הבא! הצעד הראשון שלך 🎉`,
        content: {
          hook: 'מרגש שהצטרפת! בואו נתחיל בצעד הראשון והכי חשוב.',
          mainMessage: `יש לך ${3 - completionStatus.photos.current} תמונות להעלות, ו-${completionStatus.personalDetails.missing.length} פרטים בסיסיים למלא. זה ייקח בערך 5 דקות ויעשה הבדל ענק.`,
          aiContent: aiInsights?.topGaps[0],
          specificAction: completionStatus.photos.current === 0
            ? 'הוסף תמונה אחת לפחות'
            : completionStatus.personalDetails.missing[0],
          encouragement: 'אנחנו כאן בשבילך בכל שלב! 💙',
        },
        sendInDays: 0,
      };
    }

    if (daysInSystem === 3) {
      return {
        type: 'NUDGE',
        priority: 'NORMAL',
        subject: 'איך מתקדמים? עדכון מהיר 📊',
        content: {
          hook: `הפרופיל שלך כבר ב-${completionStatus.overall}%! כל הכבוד!`,
          mainMessage: `כל פרט שאת/ה מוסיף/ה עוזר למערכת ה-AI שלנו להבין אותך יותר לעומק. למשל, ${aiInsights?.topStrengths[0] || 'המידע שמילאת עד כה מרשים'}`,
          specificAction: this.getNextBestAction(profile),
          progressVisualization: this.generateProgressBar(completionStatus.overall),
          encouragement: 'את/ה בדרך הנכונה! 🚀',
        },
        sendInDays: 0,
      };
    }

    // יום 7
    return {
      type: 'INSIGHT',
      priority: 'NORMAL',
      subject: 'שבוע עבר - הנה מה שגילינו עלייך 🔍',
      content: {
        hook: `${profile.userId}, עברלך שבוע מאז הצטרפת. הנה תובנה מיוחדת:`,
        mainMessage: aiInsights?.personalitySummary || 'המערכת שלנו כבר מתחילה ללמוד עליך',
        aiContent: `בהתבסס על מה שמילאת, נראה ש${aiInsights?.topStrengths[0] || 'יש לך פרופיל מעניין'}. ${aiInsights?.lookingForSummary || ''}`,
        specificAction: 'כדי שנוכל להבין אותך עוד יותר טוב, נשאר רק: ' + this.getNextBestAction(profile),
        encouragement: 'פרופילים מלאים מקבלים פי 3 יותר התאמות איכותיות!',
      },
      sendInDays: 0,
    };
  }

  private static getPhotoNudgeEmail(profile: UserEngagementProfile): EmailToSend {
    return {
      type: 'NUDGE',
      priority: 'HIGH',
      subject: 'תמונה אחת = אלף מילים (ממש!) 📸',
      content: {
        hook: 'הפרופיל שלך מעניין ועשיר בתוכן, אבל...',
        mainMessage: `חסרות ${3 - profile.completionStatus.photos.current} תמונות. זו לא שאלה של יופי - זו שאלה של התאמה אמיתית. 98% מהמשתמשים עם תמונות מקבלים הצעות תוך שבועיים.`,
        aiContent: profile.aiInsights?.personalitySummary
          ? `המערכת שלנו כבר מכירה אותך: "${profile.aiInsights.personalitySummary.slice(0, 150)}..." - עכשיו זמן שגם האדם האמיתי מהצד השני יראה מי מאחורי המילים.`
          : undefined,
        specificAction: 'העלה 3 תמונות - ייקח 2 דקות',
        encouragement: 'תמונה אחת = קפיצה ל-30%+ בפרופיל שלך!',
      },
      sendInDays: 0,
    };
  }

  private static getQuestionnaireNudgeEmail(profile: UserEngagementProfile): EmailToSend {
    const { worldsStatus } = profile.completionStatus.questionnaire;
    const mostEmptyWorld = worldsStatus.reduce((prev, curr) =>
      curr.completed < prev.completed ? curr : prev
    );

    return {
      type: 'NUDGE',
      priority: 'NORMAL',
      subject: 'השאלון - לא עוד שאלון משעמם 🧠',
      content: {
        hook: `${profile.userId}, שמנו לב שהתחלת למלא את השאלון - מעולה!`,
        mainMessage: `השאלון שלנו הוא לא "עוד שאלון". כל תשובה מאפשרת ל-AI שלנו ללמוד עליך משהו עמוק. למשל, עולם "${mostEmptyWorld.world}" - ${mostEmptyWorld.completed}/${mostEmptyWorld.total} שאלות.`,
        aiContent: profile.aiInsights?.topGaps[0],
        specificAction: `השלם את עולם "${mostEmptyWorld.world}" (${mostEmptyWorld.total - mostEmptyWorld.completed} שאלות נותרו)`,
        encouragement: 'משתמשים עם שאלון מלא מקבלים פי 3 יותר התאמות מדויקות!',
      },
      sendInDays: 0,
    };
  }

  private static getAlmostDoneEmail(profile: UserEngagementProfile): EmailToSend {
    return {
      type: 'CELEBRATION',
      priority: 'HIGH',
      subject: `${profile.userId}, את/ה כמעט שם! 🎊`,
      content: {
        hook: `וואו! ${profile.completionStatus.overall}% - זה מדהים!`,
        mainMessage: 'הפרופיל שלך כמעט מושלם. נשאר רק פרט אחד קטן ואת/ה ב-100%.',
        specificAction: this.getNextBestAction(profile),
        aiContent: profile.aiInsights?.personalitySummary
          ? `הנה מה שה-AI שלנו כבר מבין עליך: "${profile.aiInsights.personalitySummary.slice(0, 200)}..." - מרשים!`
          : undefined,
        encouragement: 'צעד אחד קטן והפרופיל שלך מוכן לקבל הצעות!',
      },
      sendInDays: 0,
    };
  }

  private static getReengagementEmail(profile: UserEngagementProfile): EmailToSend {
    return {
      type: 'NUDGE',
      priority: 'NORMAL',
      subject: 'זוכר/ת אותנו? יש לנו חדשות בשבילך 💌',
      content: {
        hook: `${profile.userId}, עבר זמן מאז שדיברנו...`,
        mainMessage: `הפרופיל שלך עומד על ${profile.completionStatus.overall}% - וזה נהדר! המערכת שלנו השתפרה מאז, ועכשיו זה הזמן המושלם לחזור ולהשלים.`,
        aiContent: profile.aiInsights?.topStrengths[0]
          ? `אנחנו זוכרים: ${profile.aiInsights.topStrengths[0]}. עכשיו בוא/י נשלים את התמונה.`
          : undefined,
        specificAction: this.getNextBestAction(profile),
        encouragement: 'לא מאוחר לחזור. אנחנו כאן בשבילך.',
      },
      sendInDays: 0,
    };
  }

  private static getValueEmail(profile: UserEngagementProfile): EmailToSend {
    const topics = [
      {
        subject: 'למה תמונות הן כל כך חשובות? התשובה מפתיעה',
        content: 'מחקר חדש מראה שתמונות עוזרות לזהות תאימות רגשית...',
      },
      {
        subject: '3 טעויות נפוצות בבניית פרופיל שידוכים',
        content: 'שדכנים עם 20 שנות ניסיון חושפים מה באמת עובד...',
      },
      {
        subject: 'הסיפור של דני ויעל - איך השאלון שלנו עזר להם',
        content: 'דני היסס למלא את השאלון. יעל כמעט ויתרה. הנה מה שקרה...',
      },
    ];

    const topic = topics[Math.floor(Math.random() * topics.length)];

    return {
      type: 'VALUE',
      priority: 'LOW',
      subject: topic.subject,
      content: {
        hook: topic.content,
        mainMessage: 'קרא/י את הסיפור המלא >>',
        encouragement: 'אנחנו כאן כדי לעזור לך, בכל שלב.',
      },
      sendInDays: 0,
    };
  }

  // ================== פונקציות עזר ==================

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

// קובץ: src/lib/engagement/SmartEngagementOrchestrator.ts

  private static async sendEmail(user: any, email: EmailToSend) {
    // השתמשנו בנתיב הנכון לקובץ כפי שציינת
const { emailService } = await import('./emailService'); // <-- זו השורה הנכונה (הפניה יחסית)
    
    const locale = user.language || 'he';

    try {
      let success = false;

      // בחירת הפונקציה המתאימה לפי סוג המייל
      switch (email.type) {
        case 'ONBOARDING':
          if (email.content.specificAction) {
            success = await emailService.sendOnboardingDay1({
              locale,
              email: user.email,
              firstName: user.firstName,
              completionData: {
                progressPercentage: 15,
                completedItems: ['נרשמת למערכת'],
                missingItemsCount: 5,
                nextAction: email.content.specificAction,
                aiInsight: email.content.aiContent,
              }
            });
          }
          break;

        case 'NUDGE':
          if (email.subject.includes('איך מתקדמים')) {
            success = await emailService.sendProgressUpdate({
              locale, 
              email: user.email,
              firstName: user.firstName,
              progressData: {
                progressPercentage: 45,
                aiLearning: email.content.aiContent || 'המערכת לומדת עליך',
                photosCount: 2,
                photosComplete: false,
                photosPercent: 66,
                personalComplete: true,
                personalMissingCount: 0,
                personalPercent: 100,
                questionnaireComplete: false,
                questionnairePercent: 60,
                preferencesComplete: false,
                preferencesMissingCount: 3,
                preferencesPercent: 40,
                nextAction: email.content.specificAction || 'המשך למלא את הפרופיל',
                estimatedTime: '5 דקות',
                nextMilestone: 70,
                aiPersonalInsight: email.content.aiContent,
                ctaLink: `${process.env.NEXT_PUBLIC_BASE_URL}/profile`,
                ctaText: 'להמשך השלמת הפרופיל'
              }
            });
          }
          break;

        case 'CELEBRATION':
          success = await emailService.sendAlmostDone({
            locale,
            email: user.email,
            firstName: user.firstName,
            celebrationData: {
              progressPercentage: 95,
              remainingItem: email.content.specificAction || 'צעד אחד אחרון',
              estimatedTime: '2 דקות',
              aiSummary: email.content.aiContent,
              ctaLink: `${process.env.NEXT_PUBLIC_BASE_URL}/profile`
            }
          });
          break;

        case 'EVENING_FEEDBACK':
          success = await emailService.sendTemplateEmail({
            locale,
            to: user.email,
            subject: email.subject,
            templateName: 'evening_feedback',
            context: {
              firstName: user.firstName,
              progressPercentage: email.content.progressVisualization?.match(/\d+/)?.[0] || '0',
              todayCompletedItems: email.content.todayProgress?.itemsCompleted || [],
              systemSummary: email.content.systemSummary,
              aiInsight: email.content.aiInsight,
              nextAction: email.content.specificAction,
              estimatedTime: '5 דקות',
              ctaLink: `${process.env.NEXT_PUBLIC_BASE_URL}/profile`,
              ctaText: 'להמשך בניית הפרופיל'
            }
          });
          break;

        case 'AI_SUMMARY':
          success = await emailService.sendTemplateEmail({
            locale, 
            to: user.email,
            subject: email.subject,
            templateName: 'aiInsight',
            context: {
              firstName: user.firstName,
              personalitySummary: email.content.systemSummary || email.content.aiContent,
            }
          });
          break;

        default:
          // fallback - שליחת מייל פשוט
          success = await emailService.sendCustomEmail(
            user.email,
            email.subject,
            'generic',
            { // <-- פרמטר רביעי: context
              firstName: user.firstName,
              mainMessage: email.content.mainMessage,
              encouragement: email.content.encouragement
            },
            locale // <-- פרמטר חמישי: locale (עם פסיק לפניו)
          );
      }

      if (success) {
        console.log(`📧 Successfully sent ${email.type} email to ${user.email} in ${locale}`);
      } else {
        console.error(`❌ Failed to send ${email.type} email to ${user.email}`);
      }

    } catch (error) {
      console.error(`❌ Error in sendEmail for user ${user.id}:`, error);
    }
  } 

  private static async updateCampaignRecord(userId: string, emailType: string) {
    const updateData: any = {
      currentStep: { increment: 1 },
      lastSentType: emailType,
      updatedAt: new Date(),
    };

    // 🆕 עדכון ספציפי לפי סוג המייל
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
      },
    });
  }

}

export default SmartEngagementOrchestrator;