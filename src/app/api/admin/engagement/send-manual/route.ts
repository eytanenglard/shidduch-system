import { NextRequest, NextResponse } from 'next/server';
import { SmartEngagementOrchestrator } from '@/lib/engagement/SmartEngagementOrchestrator';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getEmailDictionary } from '@/lib/dictionaries';
import { Language, Prisma } from '@prisma/client';
import { EmailDictionary } from '@/types/dictionaries/email';

// ✅ הגדרת מבנה השאילתה לשימוש חוזר וליצירת טיפוס דינמי
const userWithEngagementDataInclude = {
  include: {
    profile: true,
    images: true,
    questionnaireResponses: { take: 1, orderBy: { lastSaved: 'desc' } as const },
    dripCampaign: true,
  },
};

// ✅ יצירת טיפוס מדויק עבור אובייקט המשתמש על בסיס השאילתה, כדי למנוע שימוש ב-any
type UserWithEngagementData = Prisma.UserGetPayload<typeof userWithEngagementDataInclude>;


// 🎯 הגדר timeout של 55 שניות
export const maxDuration = 55;

// 🎯 הגדר את סוגי התשובה
interface EmailGenerationResult {
  timeout: false;
  emailType: string;
}

interface TimeoutResult {
  timeout: true;
}

type GenerationResult = EmailGenerationResult | TimeoutResult;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, emailType } = await request.json();

    console.log('📧 [Manual Email] Starting send process...', {
      userId,
      emailType,
    });

    if (!userId || !emailType) {
      return NextResponse.json(
        { error: 'Missing userId or emailType' },
        { status: 400 }
      );
    }

    // מצא את המשתמש
    const user = await prisma.user.findUnique({
      where: { id: userId },
      ...userWithEngagementDataInclude, // ✅ שימוש בקבוע שהגדרנו
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.email) {
      return NextResponse.json(
        { error: 'User has no email address' },
        { status: 400 }
      );
    }

    console.log('👤 [Manual Email] User found:', {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      language: user.language,
    });

    // טען את מילון המיילים
    const dict = await getEmailDictionary(user.language as Language);

    // 🔥 הוספת לוג לבדיקת תוכן המילון שנטען בפועל
    console.log('DEBUG: Loaded Dictionary Object:', JSON.stringify(dict, null, 2));

    // 🎯 עטוף את כל התהליך ב-timeout wrapper
    const emailGenerationPromise = generateEmailWithTimeout(
      userId,
      emailType,
      user,
      dict
    );

    const result: GenerationResult = await Promise.race([
      emailGenerationPromise,
      timeoutPromise(50000), // 50 שניות
    ]);

    // 🎯 בדיקה עם Type Guard
    if (result.timeout) {
      console.error('❌ [Manual Email] Request timed out after 50 seconds');
      return NextResponse.json(
        {
          error: 'Request timed out',
          details: 'AI processing took too long. Please try again or choose a different email type.',
        },
        { status: 504 }
      );
    }

    console.log('🎉 [Manual Email] Email sent successfully!');

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      emailType: result.emailType,
      recipient: user.email,
    });

  } catch (error) {
    console.error('❌ [Manual Email] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// 🎯 פונקציה עוזרת ליצירת timeout promise
function timeoutPromise(ms: number): Promise<TimeoutResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ timeout: true });
    }, ms);
  });
}

// 🎯 פונקציה עוזרת שעוטפת את כל תהליך יצירת המייל
async function generateEmailWithTimeout(
  userId: string,
  emailType: string,
  user: UserWithEngagementData, // ✅ שינוי: שימוש בטיפוס המדויק במקום any
  dict: EmailDictionary        // ✅ שינוי: שימוש בטיפוס המדויק במקום any
): Promise<EmailGenerationResult> {
  try {
    // בנה פרופיל engagement
    const profile = await SmartEngagementOrchestrator.testBuildUserEngagementProfile(userId);

    console.log('📊 [Manual Email] Profile built:', {
      completionPercentage: profile.completionStatus.overall,
      daysInSystem: profile.daysInSystem,
    });

    // צור מייל מתאים
    let email;
    switch (emailType) {
case 'EVENING_FEEDBACK': {
        // --- תחילת התיקון ---
        console.log('🌙 [Manual Email] Evening Feedback requires AI. Loading insights...');
        // טעינת תובנות ה-AI באופן יזום לתוך אובייקט הפרופיל
        await SmartEngagementOrchestrator['loadAiInsights'](profile, user.language as Language);
        console.log(`✅ [Manual Email] AI insights ${profile.aiInsights ? 'loaded' : 'not available'}.`);
        // --- סוף התיקון ---

        const dailyActivity = await SmartEngagementOrchestrator.testDetectDailyActivity(userId);
        email = await SmartEngagementOrchestrator.testGetEveningFeedbackEmail(
          profile,
          dailyActivity,
          dict
        );
        break;
      }
            case 'AI_SUMMARY': {
        console.log('🧠 [Manual Email] Generating AI Summary email...');
        email = await SmartEngagementOrchestrator.testGetAiSummaryEmail(profile, dict, user.language as Language);
        break;
      }
      case 'NUDGE': {
        if (!profile.completionStatus.photos.isDone) {
          email = await SmartEngagementOrchestrator.testGetPhotoNudgeEmail(profile, dict);
        } else {
          email = await SmartEngagementOrchestrator.testGetQuestionnaireNudgeEmail(profile, dict);
        }
        break;
      }
      case 'CELEBRATION': {
        email = await SmartEngagementOrchestrator.testGetAlmostDoneEmail(profile, dict);
        break;
      }
      case 'VALUE': {
        email = await SmartEngagementOrchestrator.testGetValueEmail(profile, dict);
        break;
      }
      case 'ONBOARDING_DAY_1': {
        email = await SmartEngagementOrchestrator.testGetOnboardingDay1Email(profile, dict);
        break;
      }
      case 'ONBOARDING_PHOTOS': {
        email = await SmartEngagementOrchestrator.testGetOnboardingPhotosEmail(profile, dict);
        break;
      }
      case 'ONBOARDING_AI_TEASER': {
        console.log('🧠 [Manual Email] Generating Onboarding AI Teaser email...');
        email = await SmartEngagementOrchestrator.testGetOnboardingAiTeaserEmail(profile, dict, user.language as Language);
        break;
      }
      case 'ONBOARDING_QUESTIONNAIRE_WHY': {
        email = await SmartEngagementOrchestrator.testGetOnboardingQuestionnaireWhyEmail(profile, dict);
        break;
      }
      case 'ONBOARDING_VALUE_ADD': {
        console.log('💎 [Manual Email] Generating Onboarding Value Add email...');
        email = await SmartEngagementOrchestrator.testGetOnboardingValueAddEmail(profile, dict, user.language as Language);
        break;
      }
      case 'ONBOARDING': { // Fallback for old value
        email = await SmartEngagementOrchestrator.testGetOnboardingDay1Email(profile, dict);
        break;
      }
      default:
        throw new Error(`Unsupported email type: ${emailType}`);
    }

    if (!email) {
      throw new Error('Could not generate email for this user state');
    }

    console.log('✅ [Manual Email] Email generated:', { type: email.type });

    // שלח
    await SmartEngagementOrchestrator['sendEmail'](user, email);
    await SmartEngagementOrchestrator['updateCampaignRecord'](userId, emailType);

    return {
      emailType: email.type,
      timeout: false,
    };

  } catch (error) {
    console.error('❌ [Manual Email] Error in generateEmailWithTimeout:', error);
    throw error;
  }
}