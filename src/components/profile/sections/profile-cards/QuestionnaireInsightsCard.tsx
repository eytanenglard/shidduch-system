'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ProfileCardHeader from '@/components/profile/ProfileCardHeader';
import { Sparkles, Heart, MessageCircle, Users, GraduationCap } from 'lucide-react';
import { ProfileSectionDict } from '@/types/dictionary';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QuestionnaireAnswers = Record<string, any[]>;

interface QuestionnaireInsightsCardProps {
  questionnaireAnswers?: QuestionnaireAnswers | null;
  dict: ProfileSectionDict;
  direction: 'rtl' | 'ltr';
  onNavigateToQuestionnaire?: () => void;
}

// Helper to find an answer value from a world's answer array
function findAnswer(answers: unknown[] | undefined, questionId: string): unknown {
  if (!Array.isArray(answers)) return undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const found = answers.find((a: any) => a.questionId === questionId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (found as any)?.value;
}

// Maps for displaying readable values
const LOVE_LANGUAGE_ICONS: Record<string, string> = {
  words_of_affirmation: 'words',
  quality_time: 'quality_time',
  physical_touch: 'touch',
  acts_of_service: 'service',
  receiving_gifts: 'gifts',
};

const QuestionnaireInsightsCard: React.FC<QuestionnaireInsightsCardProps> = ({
  questionnaireAnswers,
  dict,
  direction,
  onNavigateToQuestionnaire,
}) => {
  if (!questionnaireAnswers) return null;

  const personality = questionnaireAnswers.personality;
  const relationship = questionnaireAnswers.relationship;
  const religion = questionnaireAnswers.religion;

  // Extract insights
  const loveLanguages = findAnswer(relationship, 'relationship_love_languages') as string[] | undefined;
  const communicationStyle = findAnswer(personality, 'personality_communication_style_revised') as Record<string, number> | undefined;
  const togetherness = findAnswer(relationship, 'relationship_daily_togetherness_vs_autonomy_revised') as number | undefined;
  const childrenEducation = findAnswer(religion, 'religion_children_education_religious_vision_revised') as string | undefined;

  const insightsDict = dict.cards.questionnaireInsights;
  if (!insightsDict) return null;

  // Check if there's any data to show
  const hasData = loveLanguages || communicationStyle || togetherness !== undefined || childrenEducation;
  if (!hasData) return null;

  // Get top 2 communication styles from budget allocation
  const topCommStyles = communicationStyle
    ? Object.entries(communicationStyle)
        .filter(([, score]) => score > 0)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2)
        .map(([style]) => style)
    : [];

  return (
    <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-teal-200/40 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-teal-300/50">
      <ProfileCardHeader
        icon={<Sparkles className="w-4 h-4 text-teal-600" />}
        title={insightsDict.title}
        gradientFrom="from-teal-50/60 to-cyan-50/60"
        iconGradient="from-teal-500/10 to-teal-600/10"
      />
      <CardContent className="p-3 md:p-4 space-y-4">
        {/* Love Languages */}
        {loveLanguages && loveLanguages.length > 0 && (
          <InsightRow
            icon={<Heart className="w-4 h-4 text-rose-500" />}
            label={insightsDict.loveLanguages}
          >
            <div className="flex flex-wrap gap-1.5">
              {loveLanguages.map((lang) => (
                <Badge
                  key={lang}
                  variant="secondary"
                  className="bg-rose-50 text-rose-700 text-xs px-2 py-0.5 rounded-full"
                >
                  {insightsDict.loveLanguageOptions?.[LOVE_LANGUAGE_ICONS[lang] || lang] || lang}
                </Badge>
              ))}
            </div>
          </InsightRow>
        )}

        {/* Communication Style */}
        {topCommStyles.length > 0 && (
          <InsightRow
            icon={<MessageCircle className="w-4 h-4 text-sky-500" />}
            label={insightsDict.communicationStyle}
          >
            <div className="flex flex-wrap gap-1.5">
              {topCommStyles.map((style) => (
                <Badge
                  key={style}
                  variant="secondary"
                  className="bg-sky-50 text-sky-700 text-xs px-2 py-0.5 rounded-full"
                >
                  {insightsDict.communicationOptions?.[style] || style}
                </Badge>
              ))}
            </div>
          </InsightRow>
        )}

        {/* Togetherness vs Autonomy */}
        {togetherness !== undefined && togetherness !== null && (
          <InsightRow
            icon={<Users className="w-4 h-4 text-purple-500" />}
            label={insightsDict.togetherness}
          >
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all"
                  style={{ width: `${(togetherness / 10) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 min-w-[60px] text-center" dir={direction}>
                {togetherness <= 3
                  ? insightsDict.togethernessLabels?.independent
                  : togetherness >= 8
                    ? insightsDict.togethernessLabels?.together
                    : insightsDict.togethernessLabels?.balanced}
              </span>
            </div>
          </InsightRow>
        )}

        {/* Children Education Vision */}
        {childrenEducation && childrenEducation.trim().length > 0 && (
          <InsightRow
            icon={<GraduationCap className="w-4 h-4 text-amber-500" />}
            label={insightsDict.childrenEducation}
          >
            <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
              {childrenEducation}
            </p>
          </InsightRow>
        )}

        {/* Link to edit in questionnaire */}
        {onNavigateToQuestionnaire && (
          <button
            type="button"
            onClick={onNavigateToQuestionnaire}
            className="w-full text-center text-xs text-teal-600 hover:text-teal-700 hover:underline pt-2 border-t border-gray-100"
          >
            {insightsDict.editInQuestionnaire}
          </button>
        )}
      </CardContent>
    </Card>
  );
};

/** A single insight row with icon + label + content */
const InsightRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}> = ({ icon, label, children }) => (
  <div className="space-y-1.5">
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-xs font-medium text-gray-600">{label}</span>
    </div>
    <div className="ps-6">{children}</div>
  </div>
);

export default React.memo(QuestionnaireInsightsCard);
