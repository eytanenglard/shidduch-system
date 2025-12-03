// src/app/components/suggestions/compatibility/UserAiAnalysisDisplay.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Heart,
  Lightbulb,
  MessageSquareQuote,
  Sparkles,
  Target,
  Brain,
  CheckCircle,
  AlertCircle,
  Star,
} from 'lucide-react';
import type { AiSuggestionAnalysisResult } from '@/lib/services/aiService';
import { cn } from '@/lib/utils';

// =============================================================================
// COLOR PALETTE REFERENCE (Matching HeroSection.tsx)
// =============================================================================
// Primary Colors:
//   - Teal/Emerald: from-teal-400 via-teal-500 to-emerald-500 (Knowledge/New)
//   - Orange/Amber: from-orange-400 via-amber-500 to-yellow-500 (Action/Warmth)
//   - Rose/Pink:    from-rose-400 via-pink-500 to-red-500 (Love/Connection)
//
// Score Colors (Hero-aligned):
//   - Excellent (85+): Teal/Emerald
//   - Good (70+): Teal
//   - Moderate (55+): Orange/Amber
//   - Challenging (<55): Rose
//
// Section Colors:
//   - Compatibility Points: Teal/Emerald (positive connections)
//   - Points to Consider: Orange/Amber (attention/growth)
//   - Conversation Starters: Rose (relationship/connection)
// =============================================================================

interface UserAiAnalysisDisplayProps {
  analysis: AiSuggestionAnalysisResult;
}

// Hero-aligned score colors
const getScoreColor = (score: number) => {
  if (score >= 85)
    return {
      text: 'text-teal-600',
      bg: 'from-teal-50 to-emerald-50',
      progress: 'bg-gradient-to-r from-teal-500 to-emerald-500',
      badge: 'bg-gradient-to-r from-teal-500 to-emerald-500',
    };
  if (score >= 70)
    return {
      text: 'text-teal-600',
      bg: 'from-teal-50 to-emerald-50',
      progress: 'bg-gradient-to-r from-teal-500 to-emerald-500',
      badge: 'bg-gradient-to-r from-teal-500 to-emerald-500',
    };
  if (score >= 55)
    return {
      text: 'text-orange-600',
      bg: 'from-orange-50 to-amber-50',
      progress: 'bg-gradient-to-r from-orange-500 to-amber-500',
      badge: 'bg-gradient-to-r from-orange-500 to-amber-500',
    };
  return {
    text: 'text-rose-600',
    bg: 'from-rose-50 to-red-50',
    progress: 'bg-gradient-to-r from-rose-500 to-red-500',
    badge: 'bg-gradient-to-r from-rose-500 to-red-500',
  };
};

// Score interpretation helper
const getScoreInterpretation = (score: number) => {
  if (score >= 85)
    return {
      level: 'התאמה מעולה',
      description: 'רמת התאמה גבוהה מאוד עם פוטנציאל רב להצלחה',
      icon: <Star className="w-5 h-5" fill="currentColor" />,
    };
  if (score >= 70)
    return {
      level: 'התאמה טובה',
      description: 'בסיס חזק לקשר משמעותי עם אתגרים מינימליים',
      icon: <CheckCircle className="w-5 h-5" />,
    };
  if (score >= 55)
    return {
      level: 'התאמה בינונית',
      description: 'פוטנציאל טוב עם נקודות לעבודה משותפת',
      icon: <Target className="w-5 h-5" />,
    };
  return {
    level: 'התאמה מאתגרת',
    description: 'דורש השקעה ותקשורת מעמיקה יותר',
    icon: <AlertCircle className="w-5 h-5" />,
  };
};

const Section: React.FC<{
  title: string;
  icon: React.ElementType;
  iconColorClass: string;
  bgColorClass: string;
  children: React.ReactNode;
}> = ({ title, icon: Icon, iconColorClass, bgColorClass, children }) => (
  <Card className={cn('overflow-hidden border-0 shadow-lg', bgColorClass)}>
    <CardHeader className="pb-4">
      <CardTitle className="flex items-center gap-3 text-xl">
        <div
          className={cn(
            'p-3 rounded-xl shadow-md',
            iconColorClass.replace('text-', 'bg-').replace('-600', '-100')
          )}
        >
          <Icon className={cn('w-6 h-6', iconColorClass)} />
        </div>
        <span className="font-bold text-gray-800">{title}</span>
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-0">{children}</CardContent>
  </Card>
);

// Compatibility Point: Teal/Emerald (positive connections)
const CompatibilityPoint: React.FC<{
  point: { area: string; explanation: string };
  index: number;
}> = ({ point, index }) => (
  <div className="group p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-teal-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 text-white flex items-center justify-center text-sm font-bold shadow-md">
        {index + 1}
      </div>
      <div className="flex-1 space-y-2">
        <h4 className="font-semibold text-teal-800 text-base leading-tight">
          {point.area}
        </h4>
        <p className="text-sm text-teal-900/80 leading-relaxed">
          {point.explanation}
        </p>
      </div>
    </div>
  </div>
);

// Consideration Point: Orange/Amber (attention/growth areas)
const ConsiderationPoint: React.FC<{
  point: { area: string; explanation: string };
  index: number;
}> = ({ point, index }) => (
  <div className="group p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-orange-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-amber-500 text-white flex items-center justify-center text-sm font-bold shadow-md">
        {index + 1}
      </div>
      <div className="flex-1 space-y-2">
        <h4 className="font-semibold text-orange-800 text-base leading-tight">
          {point.area}
        </h4>
        <p className="text-sm text-orange-900/80 leading-relaxed">
          {point.explanation}
        </p>
      </div>
    </div>
  </div>
);

// Conversation Starter: Rose (relationship/connection)
const ConversationStarter: React.FC<{
  starter: string;
  index: number;
}> = ({ starter, index }) => (
  <div className="group flex items-start gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-rose-100 hover:bg-white/80 transition-all duration-300 hover:shadow-sm">
    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
      {index + 1}
    </div>
    <p className="text-sm text-rose-900 leading-relaxed font-medium">
      {starter}
    </p>
  </div>
);

const UserAiAnalysisDisplay: React.FC<UserAiAnalysisDisplayProps> = ({
  analysis,
}) => {
  const scoreColors = getScoreColor(analysis.overallScore);
  const scoreInterpretation = getScoreInterpretation(analysis.overallScore);

  return (
    <div className="space-y-8 p-2">
      {/* Header Summary Card */}
      <Card
        className={cn(
          'text-center border-0 shadow-xl overflow-hidden bg-gradient-to-br',
          scoreColors.bg
        )}
      >
        <CardContent className="p-8 relative">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>

          <div className="relative z-10 space-y-6">
            <div className="flex justify-center mb-4">
              <div
                className={cn('p-4 rounded-2xl shadow-lg', scoreColors.badge)}
              >
                <Brain className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
                {analysis.matchTitle}
              </h2>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
                {analysis.matchSummary}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <span className={scoreColors.text}>
                  {scoreInterpretation.icon}
                </span>
                <Badge
                  className={cn(
                    'text-xl font-bold px-6 py-3 rounded-2xl text-white border-0 shadow-lg',
                    scoreColors.badge
                  )}
                >
                  ציון התאמה: {analysis.overallScore}%
                </Badge>
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <Progress
                  value={analysis.overallScore}
                  className="h-3 bg-white/50"
                />
                <div className="flex justify-between text-sm font-medium text-gray-600">
                  <span>{scoreInterpretation.level}</span>
                  <span>{analysis.overallScore}%</span>
                </div>
                <p className="text-sm text-gray-600 text-center">
                  {scoreInterpretation.description}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compatibility Points: Teal/Emerald */}
      <Section
        title="נקודות חיבור חזקות"
        icon={Heart}
        iconColorClass="text-teal-600"
        bgColorClass="bg-gradient-to-br from-teal-50/80 to-emerald-50/60"
      >
        <ul className="space-y-4">
          {analysis.compatibilityPoints.length > 0 ? (
            analysis.compatibilityPoints.map((point, index) => (
              <li key={index}>
                <CompatibilityPoint point={point} index={index} />
              </li>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>לא נמצאו נקודות חיבור ספציפיות בניתוח</p>
            </div>
          )}
        </ul>
      </Section>

      {/* Points to Consider: Orange/Amber */}
      <Section
        title="נקודות למחשבה וצמיחה"
        icon={Lightbulb}
        iconColorClass="text-orange-600"
        bgColorClass="bg-gradient-to-br from-orange-50/80 to-amber-50/60"
      >
        <div className="space-y-4">
          {analysis.pointsToConsider.length > 0 ? (
            analysis.pointsToConsider.map((point, index) => (
              <ConsiderationPoint key={index} point={point} index={index} />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>לא נמצאו נקודות מיוחדות לתשומת לב</p>
            </div>
          )}
        </div>
      </Section>

      {/* Conversation Starters: Rose */}
      <Section
        title="נושאים מומלצים לפתיחת שיחה"
        icon={MessageSquareQuote}
        iconColorClass="text-rose-600"
        bgColorClass="bg-gradient-to-br from-rose-50/80 to-pink-50/60"
      >
        <ul className="space-y-3">
          {analysis.suggestedConversationStarters.length > 0 ? (
            analysis.suggestedConversationStarters.map((starter, index) => (
              <li key={index}>
                <ConversationStarter starter={starter} index={index} />
              </li>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquareQuote className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>לא נמצאו הצעות ספציפיות לפתיחת שיחה</p>
            </div>
          )}
        </ul>
      </Section>

      {/* Bottom Note: Teal/Orange gradient */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-teal-50 to-orange-50">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-teal-600" />
            <span className="font-semibold text-teal-800">הערה חשובה</span>
          </div>
          <p className="text-sm text-teal-700 leading-relaxed max-w-2xl mx-auto">
            זכרו, ניתוח זה הוא כלי עזר והמלצה בלבד. הוא נועד להאיר נקודות למחשבה
            ולעורר שיחה. הכימיה האמיתית והחיבור העמוק נוצרים במפגש האנושי.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserAiAnalysisDisplay;
