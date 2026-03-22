// src/lib/services/profileFeedbackService.ts

import prisma from "@/lib/prisma";
import aiService from "./aiService";
import { generateNarrativeProfile } from "./profileAiService";

// Import types
import type { UserProfile, QuestionnaireResponse, UserImage } from '@/types/next-auth';
import type { User, Language } from '@prisma/client';

// ✅ הוסף את הטיפוס הזה
import type { AiProfileAnalysisResult } from './aiService';

// טיפוס מפושט רק לשאלות
type GenderedTextOrString = string | { male: string; female: string };
type QuestionnaireQuestionsDict = {
  [worldKey: string]: {
    [questionId: string]: {
      question: GenderedTextOrString;
      placeholder?: GenderedTextOrString;
      helpText?: GenderedTextOrString;
      [key: string]: any;
    };
  };
};

export interface ProfileFeedbackReport {
  name: string;
  aiSummary: {
    personality: string;
    lookingFor: string;
  } | null;
  completedProfileItems: string[];
  missingProfileItems: string[];
  missingQuestionnaireItems: {
    world: string;
    question: string;
    link: string;
  }[];
  completionPercentage: number;
}

type FullUserForFeedback = User & {
    profile: UserProfile | null;
    images: UserImage[];
    questionnaireResponses: QuestionnaireResponse[];
};

class ProfileFeedbackService {
  private static instance: ProfileFeedbackService;
  private constructor() {}

  public static getInstance(): ProfileFeedbackService {
    if (!ProfileFeedbackService.instance) {
      ProfileFeedbackService.instance = new ProfileFeedbackService();
    }
    return ProfileFeedbackService.instance;
  }

  public async compileFeedbackReport(
    userId: string, 
    locale: Language = 'he',
    questionsDict?: QuestionnaireQuestionsDict,
    skipAI: boolean = false // 🆕 פרמטר חדש
  ): Promise<ProfileFeedbackReport> {
    const user = await prisma.user.findUnique({
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
    let aiAnalysis: AiProfileAnalysisResult | null = null;
    
    if (!skipAI) {
      try {
        const narrativeProfile = await generateNarrativeProfile(userId);
        if (narrativeProfile) {
          aiAnalysis = await aiService.getProfileAnalysis(narrativeProfile, locale);
        }
      } catch (error) {
        console.error('AI analysis failed, continuing without it:', error);
      }
    }
    
    const { completed, missing } = this.analyzeProfileFields(user as FullUserForFeedback, locale);
    
    const missingQuestionnaireItems = this.analyzeMissingQuestionnaireAnswers(
      user.questionnaireResponses[0], 
      locale,
      questionsDict
    );

    const completionPercentage = this.calculateCompletionPercentage(user as FullUserForFeedback);

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
  
  private calculateCompletionPercentage(user: FullUserForFeedback): number {
    if (!user.profile) return 0;
    
    const checks: boolean[] = [];
    const p = user.profile;

    checks.push((user.images?.length ?? 0) >= 1);
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

  private analyzeProfileFields(
    user: FullUserForFeedback, 
    locale: Language = 'he'
  ): { completed: string[], missing: string[] } {
    const completed: string[] = [];
    const missing: string[] = [];
    const profile = user.profile;

    const t = (he: string, en: string) => locale === 'he' ? he : en;

    const fields = [
      { 
        key: 'images', 
        label: t("תמונת פרופיל אחת לפחות", "At least one profile photo"), 
        check: () => (user.images?.length ?? 0) > 0 
      },
      { 
        key: 'profileHeadline', 
        label: t("כותרת פרופיל אישית", "Personal headline"), 
        check: () => !!profile?.profileHeadline 
      },
      { 
        key: 'about', 
        label: t("שדה 'אודותיי' (לפחות 100 תווים)", "About section (at least 100 chars)"), 
        check: () => !!profile?.about && profile.about.trim().length >= 100 
      },
      { 
        key: 'inspiringCoupleStory', 
        label: t("סיפור על זוג מעורר השראה", "Inspiring couple story"), 
        check: () => !!profile?.inspiringCoupleStory 
      },
      { 
        key: 'height', 
        label: t("גובה", "Height"), 
        check: () => !!profile?.height 
      },
      { 
        key: 'city', 
        label: t("עיר מגורים", "City"), 
        check: () => !!profile?.city 
      },
      { 
        key: 'maritalStatus', 
        label: t("מצב משפחתי", "Marital status"), 
        check: () => !!profile?.maritalStatus 
      },
      { 
        key: 'religiousLevel', 
        label: t("רמה דתית", "Religious level"), 
        check: () => !!profile?.religiousLevel 
      },
      { 
        key: 'educationLevel', 
        label: t("רמת השכלה", "Education level"), 
        check: () => !!profile?.educationLevel 
      },
      { 
        key: 'occupation', 
        label: t("עיסוק", "Occupation"), 
        check: () => !!profile?.occupation 
      },
      { 
        key: 'matchingNotes', 
        label: t("תיאור על בן/בת הזוג", "Partner description"), 
        check: () => !!profile?.matchingNotes && profile.matchingNotes.trim().length > 0 
      },
    ];

    fields.forEach(field => {
      if (field.check()) {
        completed.push(field.label);
      } else {
        missing.push(field.label);
      }
    });

    return { completed, missing };
  }
  
  private getAnsweredQuestionIds(questionnaire: QuestionnaireResponse | undefined): Set<string> {
    const answeredIds = new Set<string>();
    if (!questionnaire) return answeredIds;

    const worldKeys: (keyof QuestionnaireResponse)[] = [
      'valuesAnswers', 
      'personalityAnswers', 
      'relationshipAnswers', 
      'partnerAnswers', 
      'religionAnswers'
    ];
    
    worldKeys.forEach(worldKey => {
      const answers = questionnaire[worldKey] as { questionId: string }[] | undefined;
      if(Array.isArray(answers)) {
        answers.forEach(ans => ans && ans.questionId && answeredIds.add(ans.questionId));
      }
    });
    return answeredIds;
  }

  private analyzeMissingQuestionnaireAnswers(
    questionnaire: QuestionnaireResponse | undefined, 
    locale: Language = 'he',
    questionsDict?: QuestionnaireQuestionsDict
  ): { world: string; question: string; link: string }[] {
    const answeredIds = this.getAnsweredQuestionIds(questionnaire);

    const worldNames: Record<string, { he: string; en: string }> = {
      'personality': { he: 'האישיות', en: 'Personality' },
      'values': { he: 'הערכים', en: 'Values' },
      'relationship': { he: 'הזוגיות', en: 'Relationship' },
      'partner': { he: 'הפרטנר', en: 'Partner' },
      'religion': { he: 'דת ומסורת', en: 'Religion' }
    };

    const missingItems: { world: string; question: string; link: string }[] = [];

    const worlds: Array<{ 
      key: keyof QuestionnaireResponse; 
      worldId: string; 
      completed: boolean 
    }> = [
      { key: 'valuesAnswers', worldId: 'values', completed: questionnaire?.valuesCompleted || false },
      { key: 'personalityAnswers', worldId: 'personality', completed: questionnaire?.personalityCompleted || false },
      { key: 'relationshipAnswers', worldId: 'relationship', completed: questionnaire?.relationshipCompleted || false },
      { key: 'partnerAnswers', worldId: 'partner', completed: questionnaire?.partnerCompleted || false },
      { key: 'religionAnswers', worldId: 'religion', completed: questionnaire?.religionCompleted || false },
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

export const profileFeedbackService = ProfileFeedbackService.getInstance();