// src/components/questionnaire/worlds/WorldComponent.tsx
'use client';

import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import QuestionCard from '../common/QuestionCard';
import AnswerInput from '../common/AnswerInput';
import QuestionsList from '../common/QuestionsList';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  List,
  Loader2,
  Save,
  ListChecks,
  Sparkles,
  Target,
  Star,
  Award,
  Heart,
  Compass,
  Bookmark,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type {
  AnswerValue,
  Question,
  QuestionnaireAnswer,
  QuestionConditions,
  WorldId,
} from '../types/types';
import type { UserProfile } from '../MatchmakingQuestionnaire';
import { cn, resolveGenderedText } from '@/lib/utils';
import type { GenderedText } from '@/types/dictionary';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { motion, AnimatePresence } from 'framer-motion';
import { OVERLAPPING_QUESTION_IDS } from '../soulFingerprintOverlap';
import type {
  WorldComponentDict,
  QuestionCardDict,
  AnswerInputDict,
  InteractiveScaleDict,
  QuestionsListDict,
  QuestionsDictionary,
} from '@/types/dictionary';

// Questions Imports
import { personalityQuestions } from '../questions/personality/personalityQuestions';
import { valuesQuestions } from '../questions/values/valuesQuestions';
import { relationshipQuestions } from '../questions/relationship/relationshipQuestions';
import { partnerQuestions } from '../questions/partner/partnerQuestions';
import { religionQuestions } from '../questions/religion/religionQuestions';

const worldConfig: Record<
  WorldId,
  {
    questions: Question[];
    themeColor: 'sky' | 'rose' | 'purple' | 'teal' | 'amber';
    icon: React.ReactNode;
    gradient: string;
    intro: { he: string; en: string };
  }
> = {
  PERSONALITY: {
    questions: personalityQuestions,
    themeColor: 'sky',
    icon: <Sparkles className="w-5 h-5" />,
    gradient: 'from-cyan-400 via-sky-500 to-blue-500',
    intro: {
      he: 'בעולם זה נחקור את מי שאת/ה — אופי, הרגלים, אנרגיה ודרך ההתמודדות עם חיי היומיום. התשובות כאן עוזרות לנו להבין את מי שנסתתר מאחורי הפרופיל.',
      en: 'In this world we explore who you are — your character, habits, energy, and how you handle daily life. Your answers here help us understand the real you behind the profile.',
    },
  },
  VALUES: {
    questions: valuesQuestions,
    themeColor: 'rose',
    icon: <Heart className="w-5 h-5" />,
    gradient: 'from-rose-400 via-pink-500 to-red-500',
    intro: {
      he: 'מה מניע אותך? מה חשוב לך בחיים? בעולם הערכים נחקור את העקרונות, המוסר וסדרי העדיפויות שמעצבים את חיי היומיום שלך.',
      en: 'What drives you? What matters most to you in life? In the values world we explore the principles, ethics, and priorities that shape who you are.',
    },
  },
  RELATIONSHIP: {
    questions: relationshipQuestions,
    themeColor: 'purple',
    icon: <Target className="w-5 h-5" />,
    gradient: 'from-purple-400 via-violet-500 to-indigo-500',
    intro: {
      he: 'איך אהבה נראית עבורך ביומיום? בעולם הזוגיות נחקור את הציפיות, צורת התקשורת ותפיסת הקשר הזוגי שלך — מה אתה/את מביא/ה לזוגיות.',
      en: 'What does love look like in everyday life? In this world we explore your expectations, communication style, and vision of a relationship.',
    },
  },
  PARTNER: {
    questions: partnerQuestions,
    themeColor: 'teal',
    icon: <Star className="w-5 h-5" />,
    gradient: 'from-teal-400 via-emerald-500 to-green-500',
    intro: {
      he: 'מי הוא/היא האדם שאתה/את מחפש/ת? בעולם השותפ/ה נחקור את ה"מה", ה"למה" וה"גבולות" — מה חשוב לך, מה לא מתאים לך, ומה אתה/את מביא/ה לקשר.',
      en: 'Who is the person you\'re looking for? In this world we explore what you want, what matters, and what doesn\'t work for you in a partner.',
    },
  },
  RELIGION: {
    questions: religionQuestions,
    themeColor: 'amber',
    icon: <Award className="w-5 h-5" />,
    gradient: 'from-amber-400 via-orange-500 to-yellow-500',
    intro: {
      he: 'אמונה, מסורת, וזהות יהודית — בעולם הדת נחקור את הקשר שלך לדת, לאמונה ולפרקטיקה יומיומית. אין תשובות נכונות, רק כנות.',
      en: 'Faith, tradition, and Jewish identity — in this world we explore your relationship with religion, belief, and daily practice. There are no right answers, only honesty.',
    },
  },
};

// Returns true if question should be shown based on user profile
export function shouldShowQuestion(q: Question, profile: UserProfile): boolean {
  const { conditions } = q;
  if (!conditions) return true;

  const age = profile.birthDate
    ? new Date().getFullYear() - new Date(profile.birthDate).getFullYear()
    : null;

  if (conditions.maritalStatus && conditions.maritalStatus.length > 0) {
    if (!profile.maritalStatus) return true; // unknown — show by default
    if (!(conditions.maritalStatus as string[]).includes(profile.maritalStatus)) return false;
  }
  if (conditions.ageRange && age !== null) {
    if (age < conditions.ageRange[0] || age > conditions.ageRange[1]) return false;
  }
  if (conditions.religiousLevel && conditions.religiousLevel.length > 0) {
    if (!profile.religiousLevel) return true; // unknown — show by default
    if (!conditions.religiousLevel.includes(profile.religiousLevel)) return false;
  }
  if (conditions.gender && conditions.gender.length > 0) {
    if (!profile.gender) return true; // unknown — show by default
    if (!(conditions.gender as string[]).includes(profile.gender)) return false;
  }
  if (conditions.hasChildren !== undefined) {
    if (profile.hasChildrenFromPrevious === undefined) return true; // unknown — show by default
    if (conditions.hasChildren !== profile.hasChildrenFromPrevious) return false;
  }
  return true;
}

const getQuestionWithText = (
  questionStructure: Question,
  dict: WorldComponentDynamicProps['dict'],
  gender?: string
): Question => {
  const g = (text: Parameters<typeof resolveGenderedText>[0]) =>
    resolveGenderedText(text, gender);

  const qContent =
    dict.questions[questionStructure.worldId as WorldId]?.[
      questionStructure.id
    ];

  if (!qContent) {
    console.error(
      `Missing dictionary entry for question: ${questionStructure.id}`
    );
    return {
      ...questionStructure,
      question: `Error: Missing text for ${questionStructure.id}`,
    };
  }

  const optionsWithText = questionStructure.options?.map((opt) => {
    const optionContent = qContent.options?.[opt.value];
    if (!optionContent) {
      return { ...opt, text: opt.value };
    }
    // Simple gendered text (string or { male, female })
    if (typeof optionContent === 'string' || ('male' in optionContent && 'female' in optionContent && !('text' in optionContent))) {
      return { ...opt, text: g(optionContent) };
    }
    // Object with text/description (which may themselves be gendered)
    if (typeof optionContent === 'object' && 'text' in optionContent) {
      const oc = optionContent as { text: GenderedText; description?: GenderedText };
      return {
        ...opt,
        text: g(oc.text),
        description: oc.description ? g(oc.description) : undefined,
      };
    }
    return { ...opt, text: opt.value };
  });

  const categoriesWithText = questionStructure.categories?.map((cat) => {
    const categoryContent = qContent.categories?.[cat.value];
    if (!categoryContent) {
      return { ...cat, label: cat.value };
    }
    // Simple gendered text
    if (typeof categoryContent === 'string' || ('male' in categoryContent && 'female' in categoryContent && !('label' in categoryContent))) {
      return { ...cat, label: g(categoryContent) };
    }
    // Object with label/description
    if (typeof categoryContent === 'object' && 'label' in categoryContent) {
      const cc = categoryContent as { label: GenderedText; description?: GenderedText };
      return {
        ...cat,
        label: g(cc.label),
        description: cc.description ? g(cc.description) : undefined,
      };
    }
    return { ...cat, label: cat.value };
  });

  const resolvedLabels = qContent.labels
    ? {
        min: g(qContent.labels.min),
        max: g(qContent.labels.max),
        ...(qContent.labels.middle ? { middle: g(qContent.labels.middle) } : {}),
      }
    : questionStructure.labels;

  return {
    ...questionStructure,
    question: g(qContent.question),
    placeholder: qContent.placeholder ? g(qContent.placeholder) : undefined,
    metadata: {
      ...questionStructure.metadata,
      helpText: qContent.helpText ? g(qContent.helpText) : undefined,
    },
    options: optionsWithText,
    categories: categoriesWithText,
    labels: resolvedLabels,
  };
};

interface WorldComponentDynamicProps {
  worldId: WorldId;
  onAnswer: (worldId: WorldId, questionId: string, value: AnswerValue) => void;
  onVisibilityChange: (
    worldId: WorldId,
    questionId: string,
    isVisible: boolean
  ) => void;
  onBookmarkToggle?: (worldId: WorldId, questionId: string) => void;
  onComplete: () => void;
  onBack: () => void;
  answers: QuestionnaireAnswer[];
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
  onSave?: (isAutoSave?: boolean) => void;
  isSaving?: boolean;
  lastSaved?: Date | null;
  isDirectNavigation?: boolean;
  dict: {
    world: WorldComponentDict;
    questionCard: QuestionCardDict;
    answerInput: AnswerInputDict;
    interactiveScale: InteractiveScaleDict;
    questionsList: QuestionsListDict;
    questions: QuestionsDictionary;
    worldLabels: Record<WorldId, string>;
  };
  locale: 'he' | 'en';
  onMobileMenuOpen?: () => void;
  userProfile?: UserProfile;
  hasSoulFingerprint?: boolean;
}

export default function WorldComponent({
  worldId,
  onAnswer,
  onVisibilityChange,
  onBookmarkToggle,
  onComplete,
  onBack,
  answers,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  onSave,
  isSaving,
  lastSaved,
  isDirectNavigation = false,
  dict,
  locale,
  onMobileMenuOpen,
  userProfile = {},
  hasSoulFingerprint = false,
}: WorldComponentDynamicProps) {
  const worldDict = dict.world;
  const validationDict = worldDict.errors.validation;

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [isListVisible, setIsListVisible] = useState(true);
  const isRTL = locale === 'he';
  const [animateError, setAnimateError] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showWorldSummary, setShowWorldSummary] = useState(false);
  // Show intro modal only when entering a world at question 0 (not via direct navigation)
  const [showIntroModal, setShowIntroModal] = useState(
    !isDirectNavigation && currentQuestionIndex === 0
  );
  // Reset intro when worldId changes
  const prevWorldIdRef = React.useRef(worldId);
  const touchStartRef = React.useRef<{ x: number; y: number; time: number } | null>(null);
  useEffect(() => {
    if (prevWorldIdRef.current !== worldId) {
      prevWorldIdRef.current = worldId;
      setShowIntroModal(!isDirectNavigation && currentQuestionIndex === 0);
    }
  }, [worldId, isDirectNavigation, currentQuestionIndex]);

  const {
    questions: allQuestionsStructure,
    themeColor,
    icon,
    gradient,
  } = worldConfig[worldId];

  const allQuestions = useMemo(
    () =>
      allQuestionsStructure
        .filter((qStruct) =>
          shouldShowQuestion(qStruct, userProfile) &&
          !(hasSoulFingerprint && OVERLAPPING_QUESTION_IDS.has(qStruct.id))
        )
        .map((qStruct) => getQuestionWithText(qStruct, dict, userProfile.gender)),
    [allQuestionsStructure, dict, userProfile, hasSoulFingerprint]
  );

  const title = dict.worldLabels[worldId];

  const answeredQuestions = allQuestions.filter((q) =>
    answers.find((a) => a.questionId === q.id && a.value !== undefined)
  ).length;
  const requiredAnswered = allQuestions.filter(
    (q) =>
      q.isRequired &&
      answers.find((a) => a.questionId === q.id && a.value !== undefined)
  ).length;
  const totalRequired = allQuestions.filter((q) => q.isRequired).length;

  const remainingTimeMinutes = useMemo(() => {
    let totalMinutes = 0;
    for (let i = currentQuestionIndex; i < allQuestions.length; i++) {
      totalMinutes += allQuestions[i].metadata?.estimatedTime || 1;
    }
    return Math.max(1, Math.round(totalMinutes));
  }, [currentQuestionIndex, allQuestions]);

  useEffect(() => {
    if (currentQuestionIndex < 0) {
      setCurrentQuestionIndex(0);
    } else if (currentQuestionIndex >= allQuestions.length) {
      setCurrentQuestionIndex(allQuestions.length - 1);
    }
  }, [currentQuestionIndex, allQuestions.length, setCurrentQuestionIndex]);

  const handleAnswer = useCallback(
    (value: AnswerValue) => {
      const currentQuestion = allQuestions[currentQuestionIndex];
      onAnswer(worldId, currentQuestion.id, value);

      const newErrors = { ...validationErrors };
      delete newErrors[currentQuestion.id];
      setValidationErrors(newErrors);
    },
    [
      currentQuestionIndex,
      allQuestions,
      worldId,
      onAnswer,
      validationErrors,
      setValidationErrors,
    ]
  );

  const handleNext = useCallback(async () => {
    const currentQuestion = allQuestions[currentQuestionIndex];
    const currentAnswer = answers.find(
      (a) => a.questionId === currentQuestion.id
    );

    if (
      currentQuestion.isRequired &&
      (!currentAnswer?.value ||
        (Array.isArray(currentAnswer.value) &&
          currentAnswer.value.length === 0))
    ) {
      setValidationErrors({
        [currentQuestion.id]: validationDict.required,
      });
      setAnimateError(true);
      setTimeout(() => setAnimateError(false), 500);
      return;
    }

    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      if (onSave) {
        onSave(true); // true אומר: תשמור, אבל אל תציג הודעה קופצת למשתמש
      }
      const progress = Math.round(
        ((currentQuestionIndex + 2) / allQuestions.length) * 100
      );
      if ([25, 50, 75].includes(progress)) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }
    } else {
      if (requiredAnswered < totalRequired) {
        setValidationErrors({
          general: validationDict.generalRequired
            .replace('{{current}}', requiredAnswered.toString())
            .replace('{{total}}', totalRequired.toString()),
        });
        setAnimateError(true);
        setTimeout(() => setAnimateError(false), 500);
        return;
      }

      // Show summary for review before completing
      if (!showWorldSummary) {
        setShowWorldSummary(true);
        return;
      }
      setIsCompleting(true);
      setShowCelebration(true);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      onComplete();
      setIsCompleting(false);
    }
  }, [
    currentQuestionIndex,
    allQuestions,
    answers,
    setCurrentQuestionIndex,
    onComplete,
    validationDict,
    requiredAnswered,
    totalRequired,
    showWorldSummary,
  ]);

  const handlePrevious = useCallback(() => {
    setShowWorldSummary(false);
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      onBack();
    }
  }, [currentQuestionIndex, setCurrentQuestionIndex, onBack]);

  // Mobile swipe navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('input, textarea, [role="slider"], [data-no-swipe]')) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    // Must be primarily horizontal, fast, and far enough
    if (Math.abs(deltaX) < 60 || Math.abs(deltaX) < Math.abs(deltaY) * 1.5 || deltaTime > 400) return;

    // RTL: swipe right = next (content flows right-to-left), LTR: swipe left = next
    const isNextSwipe = isRTL ? deltaX > 0 : deltaX < 0;
    haptic();
    if (isNextSwipe) handleNext();
    else handlePrevious();
  }, [isRTL, handleNext, handlePrevious]);

  const overallProgress = (answeredQuestions / allQuestions.length) * 100;
  const currentQuestion = allQuestions[currentQuestionIndex];
  const currentAnswer = answers.find(
    (a) => a.questionId === currentQuestion?.id
  );

  // Enter key advances to next question (only for single-answer types with a value)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      // Don't trigger if user is typing in a text field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (!currentQuestion) return;
      const skipTypes = ['openText', 'multiChoice', 'multiSelect', 'multiSelectWithOther', 'budgetAllocation'];
      if (skipTypes.includes(currentQuestion.type)) return;

      // Only advance if there's an answer
      const hasAnswer = currentAnswer?.value != null && currentAnswer.value !== '';
      if (!hasAnswer) return;

      e.preventDefault();
      handleNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentQuestion, currentAnswer, handleNext]);

  const totalEstimatedMinutes = useMemo(
    () => allQuestions.reduce((sum, q) => sum + (q.metadata?.estimatedTime || 1), 0),
    [allQuestions]
  );

  // Bookmarked questions in this world
  const bookmarkedQuestions = useMemo(() => {
    return answers
      .filter((a) => a.isBookmarked && allQuestions.some((q) => q.id === a.questionId))
      .map((a) => {
        const qIndex = allQuestions.findIndex((q) => q.id === a.questionId);
        return { questionId: a.questionId, index: qIndex };
      })
      .filter((b) => b.index >= 0);
  }, [answers, allQuestions]);

  const renderBookmarkReminder = () => {
    // Show only on last 2 questions and if there are bookmarks
    if (bookmarkedQuestions.length === 0 || currentQuestionIndex < allQuestions.length - 2) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between gap-3"
      >
        <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
          <Bookmark className="w-4 h-4 text-orange-500" fill="currentColor" />
          <span className="text-sm text-orange-800 font-medium">
            {isRTL
              ? `יש לך ${bookmarkedQuestions.length} שאלות מסומנות`
              : `You have ${bookmarkedQuestions.length} bookmarked questions`}
          </span>
        </div>
        <div className="flex gap-1.5">
          {bookmarkedQuestions.map((b) => (
            <button
              key={b.questionId}
              className="w-7 h-7 rounded-lg bg-orange-200 text-orange-800 text-xs font-bold hover:bg-orange-300 transition-colors"
              onClick={() => setCurrentQuestionIndex(b.index)}
            >
              {b.index + 1}
            </button>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderWorldSummary = () => {
    if (!showWorldSummary) return null;

    const getAnswerPreview = (q: Question, answer: QuestionnaireAnswer | undefined): string => {
      if (!answer?.value) return isRTL ? 'לא נענתה' : 'Not answered';
      const val = answer.value;
      if (typeof val === 'string') {
        // For singleChoice/scenario, try to find option text
        const opt = q.options?.find((o) => o.value === val);
        if (opt?.text) return opt.text.length > 40 ? opt.text.slice(0, 40) + '...' : opt.text;
        return val.length > 50 ? val.slice(0, 50) + '...' : val;
      }
      if (typeof val === 'number') return String(val);
      if (Array.isArray(val)) {
        const texts = val.map((v) => {
          const s = String(v);
          const opt = q.options?.find((o) => o.value === s);
          return opt?.text || s.replace('custom:', '');
        });
        return texts.join(', ').slice(0, 60) + (texts.join(', ').length > 60 ? '...' : '');
      }
      if (typeof val === 'object') {
        const entries = Object.entries(val as Record<string, number>).filter(([, v]) => v > 0);
        return entries.map(([k, v]) => `${k}: ${v}`).slice(0, 3).join(', ');
      }
      return '✓';
    };

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowWorldSummary(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={cn('bg-gradient-to-r p-5 text-white shrink-0', gradient)}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <ListChecks className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    {isRTL ? 'סיכום תשובות' : 'Answer Summary'}
                  </h2>
                  <p className="text-sm text-white/80">
                    {isRTL
                      ? `${answeredQuestions}/${allQuestions.length} שאלות נענו`
                      : `${answeredQuestions}/${allQuestions.length} questions answered`}
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable answer list */}
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {allQuestions.map((q, idx) => {
                const answer = answers.find((a) => a.questionId === q.id);
                const hasAnswer = answer?.value != null && answer.value !== '' &&
                  !(Array.isArray(answer.value) && answer.value.length === 0);
                const questionWithText = getQuestionWithText(q, dict, userProfile?.gender);
                const preview = getAnswerPreview(questionWithText, answer);

                return (
                  <button
                    key={q.id}
                    className={cn(
                      'w-full text-start p-3 rounded-xl border transition-all hover:shadow-sm',
                      isRTL && 'text-right',
                      hasAnswer
                        ? 'border-gray-200 hover:border-gray-300 bg-white'
                        : 'border-orange-200 bg-orange-50/50'
                    )}
                    onClick={() => {
                      setCurrentQuestionIndex(idx);
                      setShowWorldSummary(false);
                    }}
                  >
                    <div className={cn('flex items-start gap-2.5', isRTL && 'flex-row-reverse')}>
                      <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold',
                        hasAnswer ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      )}>
                        {hasAnswer ? '✓' : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {questionWithText.question || `${isRTL ? 'שאלה' : 'Question'} ${idx + 1}`}
                        </p>
                        <p className={cn(
                          'text-xs mt-0.5 truncate',
                          hasAnswer ? 'text-gray-500' : 'text-orange-600'
                        )}>
                          {preview}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer actions */}
            <div className="p-4 border-t border-gray-100 flex gap-3 shrink-0">
              <Button
                variant="outline"
                onClick={() => setShowWorldSummary(false)}
                className="flex-1 rounded-xl py-5"
              >
                {isRTL ? 'חזרה לעריכה' : 'Back to editing'}
              </Button>
              <Button
                onClick={handleNext}
                disabled={isCompleting}
                className={cn(
                  'flex-1 rounded-xl py-5 text-white font-bold',
                  'bg-gradient-to-r hover:opacity-90',
                  gradient
                )}
              >
                {isCompleting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {isRTL ? 'סיום עולם' : 'Complete world'}
                  </span>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const renderWorldIntroModal = () => {
    if (!showIntroModal) return null;
    const introText = worldConfig[worldId].intro[locale];
    const NextIcon = isRTL ? ArrowLeft : ArrowRight;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowIntroModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient */}
            <div className={cn('bg-gradient-to-r p-6 text-white', gradient)}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-white/20 rounded-xl">
                  {worldConfig[worldId].icon}
                </div>
                <h2 className="text-xl font-bold">{title}</h2>
              </div>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <span>⏱</span>
                <span>
                  {isRTL
                    ? `~${totalEstimatedMinutes} דקות | ${allQuestions.length} שאלות`
                    : `~${totalEstimatedMinutes} min | ${allQuestions.length} questions`}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-gray-700 leading-relaxed text-sm">
                {introText}
              </p>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <Button
                onClick={() => setShowIntroModal(false)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 rounded-2xl py-6 font-bold text-white',
                  'bg-gradient-to-r hover:opacity-90 transition-opacity',
                  gradient
                )}
              >
                <span>{isRTL ? 'בואו נתחיל' : 'Let\'s start'}</span>
                <NextIcon className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowIntroModal(false)}
                className="rounded-2xl px-4 border-2 text-gray-500 hover:bg-gray-50"
              >
                {isRTL ? 'דלג' : 'Skip'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const renderQuestionCard = () => {
    if (!currentQuestion) {
      return (
        <Card className="rounded-3xl shadow-xl border-2 border-gray-200 p-8">
          <div className="text-center text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-4" />
            <p>{worldDict.errors.noQuestionFound}</p>
          </div>
        </Card>
      );
    }

    // Faster animation after the first question for snappier feel
    const animDuration = currentQuestionIndex === 0 ? 0.35 : 0.2;

    return (
      <motion.div
        key={currentQuestion.id}
        initial={{ opacity: 0, x: isRTL ? -30 : 30 }}
        animate={{
          opacity: 1,
          x: 0,
          scale: animateError ? [1, 1.02, 1] : 1,
        }}
        exit={{ opacity: 0, x: isRTL ? 30 : -30 }}
        transition={{ duration: animDuration }}
      >
        <QuestionCard
          question={currentQuestion}
          depth={currentQuestion.depth}
          isRequired={currentQuestion.isRequired}
          validationError={validationErrors[currentQuestion.id]}
          locale={locale}
          themeColor={themeColor}
          isVisible={currentAnswer?.isVisible ?? true}
          onVisibilityChange={(isVisible) =>
            onVisibilityChange(worldId, currentQuestion.id, isVisible)
          }
          dict={dict.questionCard}
          currentQuestionNumber={currentQuestionIndex + 1}
          totalQuestions={allQuestions.length}
          estimatedTimeMinutes={remainingTimeMinutes}
          isSaving={isSaving}
          lastSaved={lastSaved}
          onSave={() => onSave && onSave(false)}
          isBookmarked={currentAnswer?.isBookmarked ?? false}
          onBookmark={() => onBookmarkToggle && onBookmarkToggle(worldId, currentQuestion.id)}
        >
          <AnswerInput
            question={currentQuestion}
            value={currentAnswer?.value}
            onChange={handleAnswer}
            locale={locale}
            themeColor={themeColor}
            dict={{
              answerInput: dict.answerInput,
              interactiveScale: dict.interactiveScale,
            }}
          />
          {validationErrors[currentQuestion.id] && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-2xl"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-sm font-medium text-red-800">
                  {validationErrors[currentQuestion.id]}
                </p>
              </div>
            </motion.div>
          )}
        </QuestionCard>
      </motion.div>
    );
  };

  const haptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const renderNavigationButtons = () => {
    const PrevIcon = isRTL ? ArrowRight : ArrowLeft;
    const NextIcon = isRTL ? ArrowLeft : ArrowRight;

    if (isDesktop) {
      return (
        <motion.div
          className="flex items-center justify-between gap-4 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            variant="outline"
            onClick={handlePrevious}
            className="flex items-center gap-3 rounded-2xl px-6 py-6 text-base font-semibold border-2 hover:bg-gray-50 transition-all duration-300"
          >
            <PrevIcon className="h-5 w-5" />
            <span>
              {currentQuestionIndex === 0
                ? worldDict.buttons.backToMap
                : worldDict.buttons.previous}
            </span>
          </Button>

          {currentQuestionIndex < allQuestions.length - 1 ? (
            <Button
              variant="default"
              onClick={handleNext}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-8 py-6 text-base font-bold shadow-lg',
                'bg-gradient-to-r text-white hover:opacity-90 transition-all duration-300',
                gradient
              )}
            >
              <span>{worldDict.buttons.next}</span>
              <NextIcon className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={isCompleting}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white flex items-center gap-3 rounded-2xl px-8 py-6 text-base font-bold shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isCompleting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{worldDict.buttons.completing}</span>
                </>
              ) : (
                <>
                  <span>{worldDict.buttons.finish}</span>
                  <CheckCircle className="h-5 w-5" />
                </>
              )}
            </Button>
          )}
        </motion.div>
      );
    }

    // Mobile buttons
    return (
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => { haptic(); handlePrevious(); }}
            className="flex items-center gap-2 rounded-full px-5 h-14 bg-white/95 backdrop-blur-sm border-2 shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
          >
            <PrevIcon className="h-5 w-5" />
            <span className="font-semibold text-sm">
              {currentQuestionIndex === 0
                ? worldDict.buttons.backToMap
                : worldDict.buttons.prevShort}
            </span>
          </Button>

          <div className="flex items-center gap-2 px-4 h-14 bg-white/95 backdrop-blur-sm rounded-full border-2 border-gray-200 shadow-lg">
            <span className="text-xs font-bold text-gray-600">
              {currentQuestionIndex + 1}/{allQuestions.length}
            </span>
          </div>

          {currentQuestionIndex < allQuestions.length - 1 ? (
            <Button
              onClick={() => { haptic(); handleNext(); }}
              className={cn(
                'flex items-center gap-2 rounded-full px-5 h-14 font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200',
                'bg-gradient-to-r text-white',
                gradient
              )}
            >
              <span className="text-sm">{worldDict.buttons.nextShort}</span>
              <NextIcon className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              onClick={() => { haptic(); handleNext(); }}
              disabled={isCompleting}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white flex items-center gap-2 rounded-full px-5 h-14 font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 disabled:opacity-70 disabled:scale-100"
            >
              {isCompleting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">
                    {worldDict.buttons.completing}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-sm">
                    {worldDict.buttons.finishShort}
                  </span>
                  <CheckCircle className="h-5 w-5" />
                </>
              )}
            </Button>
          )}
        </div>
      </motion.div>
    );
  };

  const renderCelebration = () => {
    if (!showCelebration) return null;

    const progressPercent = Math.round(
      (answeredQuestions / allQuestions.length) * 100
    );
    let message = '';
    if (progressPercent === 25) message = worldDict.celebration.quarter;
    else if (progressPercent === 50) message = worldDict.celebration.half;
    else if (progressPercent === 75)
      message = worldDict.celebration.threeQuarters;
    else if (progressPercent >= 100) message = worldDict.celebration.complete;

    if (!message) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          className={cn(
            'fixed left-1/2 transform -translate-x-1/2 z-50',
            isDesktop ? 'bottom-8' : 'bottom-24'
          )}
        >
          <div
            className={cn(
              'bg-gradient-to-r text-white px-8 py-4 rounded-full shadow-2xl border-4 border-white',
              gradient
            )}
          >
            <p className="text-xl font-bold text-center">{message}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const MobileWorldHeader = () => {
    const formatLastSaved = (date: Date | null) => {
      if (!date) return null;
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) {
        return worldDict.header.lastSaved.now;
      } else if (diffMins === 1) {
        return worldDict.header.lastSaved.minuteAgo;
      } else if (diffMins < 60) {
        return worldDict.header.lastSaved.minutesAgo.replace(
          '{{count}}',
          diffMins.toString()
        );
      } else {
        const diffHours = Math.floor(diffMins / 60);
        return worldDict.header.lastSaved.hoursAgo.replace(
          '{{count}}',
          diffHours.toString()
        );
      }
    };

    const lastSavedText = formatLastSaved(lastSaved || null);

    return (
      <div className="bg-white/80 backdrop-blur-sm p-3 rounded-2xl shadow-lg border-2 border-white mb-6">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onMobileMenuOpen}
            className="p-2.5 bg-white border-2 border-gray-300 rounded-xl flex-shrink-0 transition-all duration-200 hover:scale-105 hover:bg-gray-50 hover:border-gray-400 shadow-sm"
          >
            <Compass className="h-5 w-5 text-gray-700" />
          </Button>
  <Button
      variant="outline"
      size="sm"
      onClick={() => onSave && onSave(false)} // false = שמירה ידנית עם הודעה
      disabled={isSaving}
      className="p-2.5 bg-white border-2 border-teal-200 text-teal-600 rounded-xl flex-shrink-0 hover:bg-teal-50 shadow-sm"
    >
      {isSaving ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Save className="h-5 w-5" />
      )}
    </Button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className={cn(
                'p-2 rounded-xl bg-gradient-to-br text-white flex-shrink-0',
                gradient
              )}
            >
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-gray-800 truncate">
                  {title}
                </h2>
                {(isSaving || lastSavedText) && (
                  <div className="flex items-center gap-1">
                    {isSaving ? (
                      <>
                        <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />
                        <span className="text-xs text-blue-600 font-medium whitespace-nowrap">
                          {worldDict.buttons.saving}
                        </span>
                      </>
                    ) : lastSavedText ? (
                      <>
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600 font-medium whitespace-nowrap">
                          {lastSavedText}
                        </span>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {worldDict.header.questionLabel
                  .replace('{{current}}', (currentQuestionIndex + 1).toString())
                  .replace('{{total}}', allQuestions.length.toString())}
              </span>
            </div>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 font-medium rounded-xl flex-shrink-0 px-2 sm:px-3 transition-all duration-200 hover:scale-105"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {worldDict.buttons.questionList}
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side={isRTL ? 'left' : 'right'}
              className="w-[300px] sm:w-[400px] flex flex-col p-0"
            >
              <SheetHeader className="p-4 border-b">
                <SheetTitle>
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'p-2 rounded-lg bg-gradient-to-br text-white',
                        gradient
                      )}
                    >
                      <ListChecks className="h-5 w-5" />
                    </div>
                    <span className="text-lg">
                      {worldDict.listSheet.title.replace(
                        '{{worldTitle}}',
                        title
                      )}
                    </span>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-hidden">
                <QuestionsList
                  allQuestions={allQuestions}
                  currentQuestionIndex={currentQuestionIndex}
                  setCurrentQuestionIndex={setCurrentQuestionIndex}
                  answers={answers}
                  locale={locale}
                  themeColor={themeColor}
                  className="h-full"
                  dict={dict.questionsList}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-gray-600">
              {worldDict.header.overallProgress}
            </span>
            <span className={cn('font-bold', `text-${themeColor}-600`)}>
              {Math.round(overallProgress)}%
            </span>
          </div>
          <Progress
            value={overallProgress}
            className="h-2"
            indicatorClassName={cn('bg-gradient-to-r', gradient)}
          />
        </div>
      </div>
    );
  };

  if (isDesktop) {
    return (
      <div className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
        <div
          className={cn(
            'transition-all duration-500 ease-in-out',
            isListVisible ? 'grid grid-cols-12 gap-8' : 'flex justify-center'
          )}
        >
          <div
            className={cn(
              'space-y-6',
              isListVisible
                ? 'col-span-12 lg:col-span-7 xl:col-span-8'
                : 'w-full max-w-5xl mx-auto'
            )}
          >
            {renderQuestionCard()}
            {renderBookmarkReminder()}
            {renderNavigationButtons()}
          </div>

          <AnimatePresence>
            {isListVisible && (
              <motion.div
                className="col-span-12 lg:col-span-5 xl:col-span-4"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              >
                <div className="sticky top-8">
                  <Card className="rounded-3xl shadow-2xl border-2 border-white overflow-hidden h-[calc(100vh-4rem)]">
                    <div className={cn('h-2 bg-gradient-to-r', gradient)} />
                    <CardHeader
                      className={cn(
                        'pb-4 pt-6 border-b-2 bg-gradient-to-br',
                        `from-${themeColor}-50/50 to-${themeColor}-50/30`
                      )}
                    >
                      <CardTitle className="text-xl font-bold flex items-center gap-3 text-gray-800">
                        <div
                          className={cn(
                            'p-2 rounded-xl bg-gradient-to-br text-white',
                            gradient
                          )}
                        >
                          <ListChecks className="h-5 w-5" />
                        </div>
                        <span>
                          {worldDict.listSheet.title.replace(
                            '{{worldTitle}}',
                            title
                          )}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 overflow-hidden h-[calc(100%-100px)]">
                      <QuestionsList
                        allQuestions={allQuestions}
                        currentQuestionIndex={currentQuestionIndex}
                        setCurrentQuestionIndex={setCurrentQuestionIndex}
                        answers={answers}
                        locale={locale}
                        themeColor={themeColor}
                        className="h-full"
                        dict={dict.questionsList}
                      />
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {renderCelebration()}
        {renderWorldIntroModal()}
        {renderWorldSummary()}
      </div>
    );
  } else {
    // Mobile view
    return (
      <div
        className="max-w-2xl mx-auto p-2 sm:p-4 space-y-6 min-h-screen"
        style={{ paddingBottom: 'max(7rem, calc(env(safe-area-inset-bottom) + 7rem))' }}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <MobileWorldHeader />
        <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          {renderQuestionCard()}
        </div>
        {renderBookmarkReminder()}
        {renderNavigationButtons()}
        {renderCelebration()}
        {renderWorldIntroModal()}
        {renderWorldSummary()}
      </div>
    );
  }
}
