// src/lib/services/profileFeedbackService.ts

import prisma from "@/lib/prisma";
import aiService from "./aiService";
import { generateNarrativeProfile } from "./profileAiService";
import { getQuestionnaireQuestionsDictionary } from "@/lib/dictionaries";

// Import types
import type { UserProfile, QuestionnaireResponse, UserImage } from '@/types/next-auth';
import type { Question } from '@/components/questionnaire/types/types';
import type { User } from '@prisma/client';
import { Gender } from '@prisma/client';
import type { Locale } from "../../../i18n-config";
import type { QuestionnaireDictionary } from "@/types/dictionary"; // <-- ייבוא חשוב למילון השאלון

// Import all question definitions
import { personalityQuestions } from '@/components/questionnaire/questions/personality/personalityQuestions';
import { valuesQuestions } from '@/components/questionnaire/questions/values/valuesQuestions';
import { relationshipQuestions } from '@/components/questionnaire/questions/relationship/relationshipQuestions';
import { partnerQuestions } from '@/components/questionnaire/questions/partner/partnerQuestions';
import { religionQuestions } from '@/components/questionnaire/questions/religion/religionQuestions';

const allQuestions: Question[] = [
  ...personalityQuestions,
  ...valuesQuestions,
  ...relationshipQuestions,
  ...partnerQuestions,
  ...religionQuestions
];

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
    locale: Locale,
    questionnaireDict: QuestionnaireDictionary // <-- מקבלים את כל מילון השאלון
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

    const narrativeProfile = await generateNarrativeProfile(userId);
    const aiAnalysis = narrativeProfile ? await aiService.getProfileAnalysis(narrativeProfile) : null;
    
    const { completed, missing } = this.analyzeProfileFields(user as FullUserForFeedback);
    
    const missingQuestionnaireItems = this.analyzeMissingQuestionnaireAnswers(
      user.questionnaireResponses[0], 
      locale,
      questionnaireDict // <-- מעבירים את כל המילון
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
    
    const totalQuestions = allQuestions.length;
    const answeredQuestionsCount = this.getAnsweredQuestionIds(user.questionnaireResponses[0]).size;
    const questionnaireScore = totalQuestions > 0 ? (answeredQuestionsCount / totalQuestions) : 0;
    
    const finalPercentage = (profileScore * 60) + (questionnaireScore * 40);

    return Math.round(finalPercentage);
  }

  private analyzeProfileFields(user: FullUserForFeedback): { completed: string[], missing: string[] } {
    const completed: string[] = [];
    const missing: string[] = [];
    const profile = user.profile;

    const fields = [
      { key: 'images', label: "תמונת פרופיל אחת לפחות", check: () => (user.images?.length ?? 0) > 0 },
      { key: 'profileHeadline', label: "כותרת פרופיל אישית", check: () => !!profile?.profileHeadline },
      { key: 'about', label: "שדה 'אודותיי' (לפחות 100 תווים)", check: () => !!profile?.about && profile.about.trim().length >= 100 },
      { key: 'inspiringCoupleStory', label: "סיפור על זוג מעורר השראה", check: () => !!profile?.inspiringCoupleStory },
      { key: 'height', label: "גובה", check: () => !!profile?.height },
      { key: 'city', label: "עיר מגורים", check: () => !!profile?.city },
      { key: 'maritalStatus', label: "מצב משפחתי", check: () => !!profile?.maritalStatus },
      { key: 'religiousLevel', label: "רמה דתית", check: () => !!profile?.religiousLevel },
      { key: 'educationLevel', label: "רמת השכלה", check: () => !!profile?.educationLevel },
      { key: 'occupation', label: "עיסוק", check: () => !!profile?.occupation },
      { key: 'matchingNotes', label: "תיאור על בן/בת הזוג", check: () => !!profile?.matchingNotes && profile.matchingNotes.trim().length > 0 },
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

    const worldKeys: (keyof QuestionnaireResponse)[] = ['valuesAnswers', 'personalityAnswers', 'relationshipAnswers', 'partnerAnswers', 'religionAnswers'];
    
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
    locale: Locale,
    questionnaireDict: QuestionnaireDictionary // מקבלים את כל מילון השאלון
  ): { world: string; question: string; link: string }[] {
    const answeredIds = this.getAnsweredQuestionIds(questionnaire);

    return allQuestions
      .filter(q => !answeredIds.has(q.id))
      .map(q => {
        const worldId = q.worldId.toUpperCase() as keyof QuestionnaireDictionary['worlds'];
        
const translatedQuestion = questionnaireDict.questions[worldId]?.[q.id]?.question || q.question || q.id;        
        // ======================= התיקון הסופי כאן =======================
        // גישה למפתח 'worlds' שהגדרנו שיהיה ברור
        const translatedWorld = questionnaireDict.worlds[worldId]?.title || q.worldId;
        // ================================================================

        return {
            world: translatedWorld,
            question: translatedQuestion,
            link: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/${locale}/questionnaire?world=${q.worldId.toUpperCase()}&question=${q.id}`
        };
      });
  }
}

export const profileFeedbackService = ProfileFeedbackService.getInstance();