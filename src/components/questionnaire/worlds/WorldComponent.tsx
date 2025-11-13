// src/components/questionnaire/worlds/WorldComponent.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  PanelLeftClose,
  PanelRightClose,
  ListChecks,
  CircleDot,
  Sparkles,
  Target,
  Rocket,
  Star,
  TrendingUp,
  Award,
  Zap,
  Heart,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type {
  AnswerValue,
  Question,
  WorldId,
  QuestionnaireAnswer,
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
  onSave?: () => void;
  isSaving?: boolean;
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
  isDirectNavigation = false,
  dict,
  locale,
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

  const {
    questions: allQuestionsStructure,
    themeColor,
    icon,
    gradient,
  } = worldConfig[worldId];

  const allQuestions = allQuestionsStructure.map((qStruct) =>
    getQuestionWithText(qStruct, dict)
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

  useEffect(() => {
    const progressPercent = Math.round(
      (answeredQuestions / allQuestions.length) * 100
    );
    if (
      progressPercent === 25 ||
      progressPercent === 50 ||
      progressPercent === 75 ||
      progressPercent === 100
    ) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  }, [answeredQuestions, allQuestions.length]);

  const findAnswer = (questionId: string): QuestionnaireAnswer | undefined => {
    return answers.find(
      (a) => a.questionId.toLowerCase() === questionId.toLowerCase()
    );
  };

  const validateAnswer = useCallback(
    (question: Question, value: AnswerValue): string | null => {
      const isValueEmpty =
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'object' &&
          !Array.isArray(value) &&
          Object.keys(value || {}).length === 0);

      if (question.isRequired && isValueEmpty) return validationDict.required;
      if (!question.isRequired && isValueEmpty) return null;

      switch (question.type) {
        case 'openText': {
          let textString = '';
          if (typeof value === 'object' && value !== null && 'text' in value) {
            textString = String((value as { text: any }).text || '');
          } else if (typeof value === 'string') {
            textString = value;
          }
          const trimmedLength = textString.trim().length;
          if (
            question.minLength &&
            trimmedLength < question.minLength &&
            question.isRequired
          )
            return validationDict.minLength.replace(
              '{{count}}',
              question.minLength.toString()
            );
          if (question.maxLength && trimmedLength > question.maxLength)
            return validationDict.maxLength.replace(
              '{{count}}',
              question.maxLength.toString()
            );
          break;
        }
        case 'multiSelect':
        case 'multiChoice':
        case 'multiSelectWithOther': {
          const selectedValues = value as string[] | undefined;
          const count = selectedValues?.length ?? 0;
          if (question.minSelections && count < question.minSelections)
            return validationDict.minSelections.replace(
              '{{count}}',
              question.minSelections.toString()
            );
          if (question.maxSelections && count > question.maxSelections)
            return validationDict.maxSelections.replace(
              '{{count}}',
              question.maxSelections.toString()
            );
          break;
        }
        case 'budgetAllocation': {
          const allocationValue = value as Record<string, number> | undefined;
          if (allocationValue) {
            const totalAllocated = Object.values(allocationValue).reduce(
              (sum, val) => sum + (val || 0),
              0
            );
            if (
              question.totalPoints &&
              totalAllocated !== question.totalPoints &&
              question.isRequired
            )
              return validationDict.budgetAllocation.replace(
                '{{count}}',
                question.totalPoints.toString()
              );
          } else if (question.isRequired && !isValueEmpty)
            return validationDict.budgetRequired;
          break;
        }
      }
      return null;
    },
    [validationDict]
  );

  const handleNext = () => {
    const currentQuestion = allQuestions[currentQuestionIndex];
    const value = findAnswer(currentQuestion.id)?.value;
    const error = validateAnswer(currentQuestion, value);
    if (error && currentQuestion.isRequired) {
      setValidationErrors({ ...validationErrors, [currentQuestion.id]: error });
      setAnimateError(true);
      setTimeout(() => setAnimateError(false), 500);
      return;
    }
    setValidationErrors((prev) => ({ ...prev, [currentQuestion.id]: '' }));
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      const firstUnansweredRequired = allQuestions.find(
        (q) =>
          q.isRequired && validateAnswer(q, findAnswer(q.id)?.value) !== null
      );
      if (firstUnansweredRequired) {
        const errorIndex = allQuestions.findIndex(
          (q) => q.id === firstUnansweredRequired.id
        );
        if (errorIndex !== -1) {
          setCurrentQuestionIndex(errorIndex);
          setValidationErrors({
            ...validationErrors,
            [firstUnansweredRequired.id]:
              validateAnswer(
                firstUnansweredRequired,
                findAnswer(firstUnansweredRequired.id)?.value
              ) || validationDict.required,
          });
        }
      } else {
        onComplete();
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0)
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    else onBack();
  };

  const handleClearAnswer = (questionId: string) => {
    onAnswer(worldId, questionId, undefined);
  };

  if (allQuestions.length === 0) {
    return (
      <div className="p-6 bg-gradient-to-br from-red-50 to-rose-50 rounded-3xl border-2 border-red-200 text-center shadow-xl">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-white rounded-full shadow-md">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
        </div>
        <h3 className="font-bold text-2xl mb-3 text-red-800">
          {worldDict.errors.loadingFailedTitle}
        </h3>
        <p className="text-red-600 mb-6">
          {worldDict.errors.loadingFailedDescription}
        </p>
        <Button
          className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-lg"
          onClick={onBack}
        >
          {worldDict.buttons.backToMap}
        </Button>
      </div>
    );
  }

  const currentQuestion = allQuestions[currentQuestionIndex];
  if (!currentQuestion) {
    console.error(
      `Error: Invalid question index ${currentQuestionIndex} for ${worldId} World.`
    );
    setCurrentQuestionIndex(0);
    return <div>{worldDict.errors.invalidQuestion}</div>;
  }

  const overallProgress = (answeredQuestions / allQuestions.length) * 100;
  const currentAnswerObject = findAnswer(currentQuestion.id);
  const currentValue = currentAnswerObject?.value;
  const questionsLeft = allQuestions.length - answeredQuestions;
  const estimatedMinutesLeft = Math.ceil(questionsLeft * 2);

  const renderQuestionCard = () => {
    const cardAnimationVariants = {
      visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
      hidden: { opacity: 0, x: 0 },
      exit: { opacity: 0, x: 0 },
      shake: {
        x: [-8, 8, -8, 8, 0],
        transition: { duration: 0.4 },
      },
    };

    return (
      <motion.div
        className="transition-opacity duration-300"
        key={currentQuestionIndex}
        variants={cardAnimationVariants}
        initial="hidden"
        animate={animateError ? 'shake' : 'visible'}
        exit="exit"
      >
        <QuestionCard
          question={currentQuestion}
          depth={currentQuestion.depth}
          isRequired={currentQuestion.isRequired}
          validationError={validationErrors[currentQuestion.id]}
          locale={locale}
          themeColor={themeColor}
          isVisible={currentAnswerObject?.isVisible ?? true}
          onVisibilityChange={(isVisible) =>
            onVisibilityChange(worldId, currentQuestion.id, isVisible)
          }
          onSave={onSave}
          isSaving={isSaving}
          dict={dict.questionCard}
          currentQuestionNumber={answeredQuestions + 1}
          totalQuestions={allQuestions.length}
          estimatedTimeMinutes={estimatedMinutesLeft}
        >
          <AnswerInput
            question={currentQuestion}
            value={currentValue}
            onChange={(value) => {
              setValidationErrors((prev) => ({
                ...prev,
                [currentQuestion.id]: '',
              }));
              onAnswer(worldId, currentQuestion.id, value);
            }}
            onClear={() => handleClearAnswer(currentQuestion.id)}
            validationError={validationErrors[currentQuestion.id]}
            themeColor={themeColor}
            dict={{
              answerInput: dict.answerInput,
              interactiveScale: dict.interactiveScale,
            }}
            locale={locale}
          />
        </QuestionCard>
      </motion.div>
    );
  };

  const renderNavigationButtons = () => {
    const PrevIcon = isRTL ? ArrowRight : ArrowLeft;
    const NextIcon = isRTL ? ArrowLeft : ArrowRight;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="flex justify-between pt-6 mt-8 border-t-2 border-gray-100"
      >
        <Button
          variant="outline"
          onClick={handlePrevious}
          className="flex items-center gap-2 rounded-2xl px-6 py-6 text-base font-medium hover:bg-gray-50 transition-all"
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
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white flex items-center gap-3 rounded-2xl px-8 py-6 text-base font-bold shadow-lg transition-all duration-300"
          >
            <span>{worldDict.buttons.finish}</span>
            <CheckCircle className="h-5 w-5" />
          </Button>
        )}
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
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
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

  // --- START: MOBILE HEADER WITH QUESTION LIST ---
  const MobileWorldHeader = () => (
    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg border-2 border-white mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'p-2 rounded-xl bg-gradient-to-br text-white',
              gradient
            )}
          >
            {icon}
          </div>
          <div>
            <h2 className="font-bold text-lg text-gray-800">{title}</h2>
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
              className="gap-2 font-medium rounded-xl"
            >
              <List className="h-4 w-4" />
              <span>{worldDict.buttons.questionList}</span>
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
                    {worldDict.listSheet.title.replace('{{worldTitle}}', title)}
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
      <div className="mt-4 space-y-1">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-gray-600">התקדמות בעולם</span>
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
  // --- END: MOBILE HEADER WITH QUESTION LIST ---

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
        className="max-w-2xl mx-auto p-2 sm:p-4 space-y-6 pb-24 min-h-screen"
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
