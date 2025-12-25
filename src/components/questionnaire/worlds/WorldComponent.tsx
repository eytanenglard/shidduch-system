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
  WorldId,
} from '../types/types';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { motion, AnimatePresence } from 'framer-motion';
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
  }
> = {
  PERSONALITY: {
    questions: personalityQuestions,
    themeColor: 'sky',
    icon: <Sparkles className="w-5 h-5" />,
    gradient: 'from-cyan-400 via-sky-500 to-blue-500',
  },
  VALUES: {
    questions: valuesQuestions,
    themeColor: 'rose',
    icon: <Heart className="w-5 h-5" />,
    gradient: 'from-rose-400 via-pink-500 to-red-500',
  },
  RELATIONSHIP: {
    questions: relationshipQuestions,
    themeColor: 'purple',
    icon: <Target className="w-5 h-5" />,
    gradient: 'from-purple-400 via-violet-500 to-indigo-500',
  },
  PARTNER: {
    questions: partnerQuestions,
    themeColor: 'teal',
    icon: <Star className="w-5 h-5" />,
    gradient: 'from-teal-400 via-emerald-500 to-green-500',
  },
  RELIGION: {
    questions: religionQuestions,
    themeColor: 'amber',
    icon: <Award className="w-5 h-5" />,
    gradient: 'from-amber-400 via-orange-500 to-yellow-500',
  },
};

const getQuestionWithText = (
  questionStructure: Question,
  dict: WorldComponentDynamicProps['dict']
): Question => {
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
    if (typeof optionContent === 'string') {
      return { ...opt, text: optionContent };
    }
    if (typeof optionContent === 'object' && optionContent !== null) {
      return {
        ...opt,
        text: optionContent.text,
        description: optionContent.description,
      };
    }
    return { ...opt, text: opt.value };
  });

  const categoriesWithText = questionStructure.categories?.map((cat) => {
    const categoryContent = qContent.categories?.[cat.value];
    if (typeof categoryContent === 'string') {
      return { ...cat, label: categoryContent };
    }
    if (typeof categoryContent === 'object' && categoryContent !== null) {
      return {
        ...cat,
        label: categoryContent.label,
        description: categoryContent.description,
      };
    }
    return { ...cat, label: cat.value };
  });

  return {
    ...questionStructure,
    question: qContent.question,
    placeholder: qContent.placeholder,
    metadata: {
      ...questionStructure.metadata,
      helpText: qContent.helpText,
    },
    options: optionsWithText,
    categories: categoriesWithText,
    labels: qContent.labels || questionStructure.labels,
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
}

export default function WorldComponent({
  worldId,
  onAnswer,
  onVisibilityChange,
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

  const {
    questions: allQuestionsStructure,
    themeColor,
    icon,
    gradient,
  } = worldConfig[worldId];

  const allQuestions = useMemo(
    () =>
      allQuestionsStructure.map((qStruct) =>
        getQuestionWithText(qStruct, dict)
      ),
    [allQuestionsStructure, dict]
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
  ]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      onBack();
    }
  }, [currentQuestionIndex, setCurrentQuestionIndex, onBack]);

  const overallProgress = (answeredQuestions / allQuestions.length) * 100;
  const currentQuestion = allQuestions[currentQuestionIndex];
  const currentAnswer = answers.find(
    (a) => a.questionId === currentQuestion?.id
  );

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

    return (
      <motion.div
        key={currentQuestion.id}
        initial={{ opacity: 0, x: isRTL ? -50 : 50 }}
        animate={{
          opacity: 1,
          x: 0,
          scale: animateError ? [1, 1.02, 1] : 1,
        }}
        exit={{ opacity: 0, x: isRTL ? 50 : -50 }}
        transition={{ duration: 0.3 }}
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
        className="fixed bottom-4 left-0 right-0 z-40 px-4"
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={handlePrevious}
            className="flex items-center gap-2 rounded-full px-5 py-6 bg-white/95 backdrop-blur-sm border-2 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            <PrevIcon className="h-5 w-5" />
            <span className="font-semibold text-sm">
              {currentQuestionIndex === 0
                ? worldDict.buttons.backToMap
                : worldDict.buttons.prevShort}
            </span>
          </Button>

          <div className="flex items-center gap-2 px-4 py-3 bg-white/95 backdrop-blur-sm rounded-full border-2 border-gray-200 shadow-lg">
            <span className="text-xs font-bold text-gray-600">
              {currentQuestionIndex + 1}/{allQuestions.length}
            </span>
          </div>

          {currentQuestionIndex < allQuestions.length - 1 ? (
            <Button
              onClick={handleNext}
              className={cn(
                'flex items-center gap-2 rounded-full px-5 py-6 font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300',
                'bg-gradient-to-r text-white',
                gradient
              )}
            >
              <span className="text-sm">{worldDict.buttons.nextShort}</span>
              <NextIcon className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={isCompleting}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white flex items-center gap-2 rounded-full px-5 py-6 font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-70 disabled:scale-100"
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
      </div>
    );
  } else {
    // Mobile view
    return (
      <div
        className="max-w-2xl mx-auto p-2 sm:p-4 space-y-6 pb-32 min-h-screen"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <MobileWorldHeader />
        {renderQuestionCard()}
        {renderNavigationButtons()}
        {renderCelebration()}
      </div>
    );
  }
}
