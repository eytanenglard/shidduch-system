// src/lib/engagement/onboardingEngagementService.ts
import prisma from '@/lib/prisma';
import { CampaignStatus } from '@prisma/client';
import aiService from '@/lib/services/aiService';
import profileAiService from '@/lib/services/profileAiService';
import { notificationService } from './notificationService';

interface OnboardingProgress {
  userId: string;
  daysInSystem: number;
  
  // מה השלים?
  completed: {
    hasPhoto: boolean;
    hasAbout: boolean;
    hasQuestionnaire: boolean; // 80%+
    hasPreferences: boolean;
  };
  
  // ציון כולל
  completionScore: number; // 0-100
  
  // מה הצעד הבא הכי חשוב?
  nextCriticalStep: string;
  
  // תובנת AI
  aiMotivation?: string;
}

export class OnboardingEngagementService {
  
  /**
   * בדיקה: האם המשתמש בתקופת ה-onboarding? (ימים 1-14)
   */
  static isInOnboarding(daysInSystem: number): boolean {
    return daysInSystem <= 14;
  }
  
  /**
   * ניתוח התקדמות onboarding
   */
  static async analyzeOnboardingProgress(userId: string): Promise<OnboardingProgress> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        images: true,
        questionnaireResponses: { 
          orderBy: { lastSaved: 'desc' }, 
          take: 1 
        },
      },
    });

    if (!user) throw new Error('User not found');

    const daysInSystem = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // בדיקות מה הושלם
    const hasPhoto = user.images.length >= 1;
    const hasAbout = !!(user.profile?.about && user.profile.about.length >= 50);
    const hasPreferences = !!(user.profile?.preferredAgeMin && user.profile?.preferredAgeMax);
    
    // חישוב שאלון
    let questionnaireScore = 0;
    const qr = user.questionnaireResponses[0];
    if (qr) {
      const worlds = ['valuesAnswers', 'personalityAnswers', 'relationshipAnswers', 
                      'partnerAnswers', 'religionAnswers'];
      let totalAnswered = 0;
      worlds.forEach(w => {
        const answers = qr[w];
        if (Array.isArray(answers)) totalAnswered += answers.length;
      });
      questionnaireScore = Math.min((totalAnswered / 50) * 100, 100);
    }
    const hasQuestionnaire = questionnaireScore >= 80;

    // חישוב ציון כולל
    let score = 0;
    if (hasPhoto) score += 30;
    if (hasAbout) score += 25;
    if (hasQuestionnaire) score += 30;
    if (hasPreferences) score += 15;

    // מה הצעד הבא?
    let nextStep = '';
    if (!hasPhoto) nextStep = 'העלאת תמונת פרופיל';
    else if (!hasAbout) nextStep = 'כתיבת תיאור אישי';
    else if (!hasQuestionnaire) nextStep = 'השלמת השאלון';
    else if (!hasPreferences) nextStep = 'הגדרת העדפות שידוך';
    else nextStep = 'הפרופיל מוכן!';

    // קבלת תובנת AI (אם יש מספיק מידע)
    let aiMotivation;
    if (score >= 30) {
      aiMotivation = await this.getAIMotivation(userId, score, nextStep);
    }

    return {
      userId,
      daysInSystem,
      completed: {
        hasPhoto,
        hasAbout,
        hasQuestionnaire,
        hasPreferences,
      },
      completionScore: Math.round(score),
      nextCriticalStep: nextStep,
      aiMotivation,
    };
  }

  /**
   * קבלת מסר מוטיבציה מותאם אישית מ-AI
   */
  static async getAIMotivation(
    userId: string, 
    currentScore: number, 
    nextStep: string
  ): Promise<string | undefined> {
    try {
      const narrative = await profileAiService.generateNarrativeProfile(userId);
      if (!narrative) return undefined;

      const analysis = await aiService.getProfileAnalysis(narrative);
      if (!analysis) return undefined;

      // בנה prompt מותאם
      const motivationPrompt = `
        המשתמש נמצא בתהליך בניית הפרופיל שלו.
        ציון נוכחי: ${currentScore}/100
        הצעד הבא: ${nextStep}
        
        נקודות חוזק שזיהינו:
        ${analysis.completenessReport
          .filter(r => r.status === 'COMPLETE')
          .map(r => `- ${r.feedback}`)
          .join('\n')}
        
        כתוב משפט מוטיבציה אחד (מקסימום 2 שורות) בעברית שמעודד אותו להמשיך.
        השתמש במידע הספציפי שלו, אל תהיה גנרי.
        תן לו הרגשה שהוא מתקדם יפה ושהצעד הבא הוא הגיוני.
      `;

      // כאן תקרא ל-AI - לצורך הדוגמה:
      return analysis.actionableTips[0]?.tip || 
             `הפרופיל שלך כבר ב-${currentScore}%! ${nextStep} יעלה אותך למעל 70% ואז תהיה מוכן לקבל הצעות.`;
      
    } catch (error) {
      console.error('Failed to get AI motivation:', error);
      return undefined;
    }
  }

  /**
   * יצירת מייל onboarding עם AI
   */
  static async createOnboardingEmail(progress: OnboardingProgress) {
    const { daysInSystem, completionScore, nextCriticalStep, aiMotivation } = progress;

    // תבנית מייל לפי יום
    if (daysInSystem === 1) {
      return {
        subject: 'ברוכים הבאים ל-NeshamaTech! הצעד הראשון שלך',
        mainMessage: 'מרגש שהצטרפת! בואו נתחיל בצעד הראשון והכי חשוב.',
        specificAction: nextCriticalStep,
        progressBar: `התקדמות: ${completionScore}%`,
        aiContent: aiMotivation,
        cta: 'בואו נתחיל',
      };
    }
    
    if (daysInSystem === 3) {
      return {
        subject: 'איך מתקדמים? עדכון מהיר',
        mainMessage: `הפרופיל שלך כבר ב-${completionScore}%. כל הכבוד!`,
        specificAction: `הצעד הבא: ${nextCriticalStep}`,
        progressBar: this.generateProgressBar(completionScore),
        aiContent: aiMotivation,
        cta: 'להמשך בניית הפרופיל',
      };
    }
    
    if (daysInSystem === 7) {
      return {
        subject: 'שבוע עבר - בואו נראה איפה אנחנו',
        mainMessage: `עבר שבוע מאז הצטרפת. את/ה ב-${completionScore}%.`,
        specificAction: `כדי להגיע ל-100%: ${nextCriticalStep}`,
        progressBar: this.generateProgressBar(completionScore),
        aiContent: aiMotivation || 'פרופילים מושלמים מקבלים פי 3 יותר הצעות איכותיות.',
        cta: 'לסיום הפרופיל',
      };
    }

    return null;
  }

  /**
   * יצירת progress bar ויזואלי
   */
  static generateProgressBar(score: number): string {
    const filled = Math.floor(score / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty) + ` ${score}%`;
  }

  /**
   * שליחת מייל onboarding בפועל
   */
  static async sendOnboardingEmail(user: any, emailData: any) {
    const recipient = {
      name: user.firstName,
      email: user.email,
      phone: user.phone,
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #f7fafc; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #06b6d4, #8b5cf6); padding: 40px 20px; text-align: center; color: white; }
          .content { padding: 40px 30px; line-height: 1.8; }
          .progress { background: #e2e8f0; border-radius: 20px; height: 30px; margin: 20px 0; overflow: hidden; }
          .progress-fill { background: linear-gradient(90deg, #06b6d4, #8b5cf6); height: 100%; transition: width 0.5s; }
          .ai-box { background: #f0f9ff; border-right: 4px solid #06b6d4; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .cta { display: inline-block; background: #06b6d4; color: white; padding: 14px 32px; 
                 border-radius: 8px; text-decoration: none; margin: 20px 0; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${emailData.subject}</h1>
          </div>
          <div class="content">
            <p>${emailData.mainMessage}</p>
            
            <div class="progress">
              <div class="progress-fill" style="width: ${emailData.progressBar}"></div>
            </div>
            <p style="text-align: center; color: #64748b;">${emailData.progressBar}</p>
            
            <h3>הצעד הבא שלך:</h3>
            <p><strong>${emailData.specificAction}</strong></p>
            
            ${emailData.aiContent ? `
              <div class="ai-box">
                <strong>💡 התובנה האישית שלך:</strong><br>
                ${emailData.aiContent}
              </div>
            ` : ''}
            
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/profile" class="cta">
              ${emailData.cta}
            </a>
            
            <p style="margin-top: 40px; color: #64748b; font-size: 14px;">
              בברכה,<br>צוות NeshamaTech
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { EmailAdapter } = await import('./adapters/email.adapter');
    const emailAdapter = new EmailAdapter();
    
    await emailAdapter.send(recipient, {
      subject: emailData.subject,
      body: emailData.mainMessage,
      htmlBody: htmlContent,
    });
  }
}