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

  const renderHeader = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative mb-8"
    >
      <div className="absolute -top-4 -left-4 w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full blur-3xl opacity-30" />
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-full blur-2xl opacity-30" />
      <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-white overflow-hidden">
        <div className={cn('h-2 bg-gradient-to-r', gradient)} />
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ rotate: 12, scale: 1.1 }}
                className={cn(
                  'p-3 rounded-2xl bg-gradient-to-br text-white shadow-lg',
                  gradient
                )}
              >
                {icon}
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  {title}
                  {overallProgress === 100 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                    >
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    </motion.div>
                  )}
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm font-medium text-gray-600">
                    {worldDict.header.questionLabel
                      .replace(
                        '{{current}}',
                        (currentQuestionIndex + 1).toString()
                      )
                      .replace('{{total}}', allQuestions.length.toString())}
                  </span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    {worldDict.header.estimatedTimeLeft.replace(
                      '{{minutes}}',
                      estimatedMinutesLeft.toString()
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isDesktop && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onSave}
                    disabled={isSaving}
                    className={cn(
                      'gap-2 transition-all duration-300 rounded-xl',
                      isSaving
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 text-green-700'
                        : 'bg-white hover:bg-green-50 border-green-200 text-green-700'
                    )}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span className="font-medium">
                      {isSaving
                        ? worldDict.buttons.saving
                        : worldDict.buttons.save}
                    </span>
                  </Button>

                  <Button
                    variant={isListVisible ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setIsListVisible(!isListVisible)}
                    className="gap-2 rounded-xl transition-all duration-300"
                  >
                    {isListVisible ? (
                      isRTL ? (
                        <PanelRightClose className="h-4 w-4" />
                      ) : (
                        <PanelLeftClose className="h-4 w-4" />
                      )
                    ) : (
                      <List className="h-4 w-4" />
                    )}
                    <span className="font-medium">
                      {isListVisible
                        ? worldDict.buttons.hideList
                        : worldDict.buttons.showList}
                    </span>
                  </Button>
                </>
              )}
              {!isDesktop && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 font-medium transition-all rounded-xl border-2 bg-white"
                    >
                      <List className="h-4 w-4" />
                      <span>{worldDict.buttons.questionList}</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side={isRTL ? 'left' : 'right'}
                    className="w-[300px] sm:w-[400px] flex flex-col"
                  >
                    <SheetHeader>
                      <SheetTitle>
                        <div className="flex items-center gap-3">
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
                        </div>
                      </SheetTitle>
                      <SheetDescription>
                        {worldDict.listSheet.description}
                        <div className="mt-4 p-3 bg-gray-50 rounded-xl space-y-2">
                          <div className="flex items-center text-xs text-gray-600">
                            <CheckCircle className="h-3.5 w-3.5 me-2 text-green-500" />
                            <span>
                              {worldDict.listSheet.legend.completed}
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <AlertCircle className="h-3.5 w-3.5 text-red-500 me-2" />
                            <span>
                              {worldDict.listSheet.legend.required}
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <CircleDot className="h-3.5 w-3.5 text-gray-400 me-2" />
                            <span>
                              {worldDict.listSheet.legend.notAnswered}
                            </span>
                          </div>
                        </div>
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-4 flex-1 overflow-hidden">
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
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border-2 border-blue-100 shadow-md"
            >
              <div className="flex items-center gap-2 mb-2">
                <Rocket className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-blue-600 uppercase">
                  {worldDict.header.statusCard.progress}
                </span>
              </div>
              <div className="text-3xl font-bold text-blue-700">
                {Math.round(overallProgress)}%
              </div>
              <div className="text-xs text-blue-600 mt-1">
                {answeredQuestions}/{allQuestions.length}{' '}
                {worldDict.header.statusCard.questions}
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-4 border-2 border-rose-100 shadow-md"
            >
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-semibold text-rose-600 uppercase">
                  {worldDict.header.statusCard.required}
                </span>
              </div>
              <div className="text-3xl font-bold text-rose-700">
                {requiredAnswered}/{totalRequired}
              </div>
              <div className="text-xs text-rose-600 mt-1">
                {totalRequired - requiredAnswered > 0
                  ? worldDict.header.statusCard.left.replace(
                      '{{count}}',
                      (totalRequired - requiredAnswered).toString()
                    )
                  : worldDict.header.statusCard.complete}
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-4 border-2 border-amber-100 shadow-md"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-semibold text-amber-600 uppercase">
                  {worldDict.header.statusCard.status}
                </span>
              </div>
              <div className="text-lg font-bold text-amber-700">
                {overallProgress < 25
                  ? worldDict.header.statusCard.states.started
                  : overallProgress < 50
                  ? worldDict.header.statusCard.states.going
                  : overallProgress < 75
                  ? worldDict.header.statusCard.states.great
                  : overallProgress < 100
                  ? worldDict.header.statusCard.states.almost
                  : worldDict.header.statusCard.states.perfect}
              </div>
              <div className="text-xs text-amber-600 mt-1">
                {worldDict.header.statusCard.keepItUp}
              </div>
            </motion.div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">
                {worldDict.header.overallProgress}
              </span>
              <span className="font-bold text-gray-800">
                {Math.round(overallProgress)}%
              </span>
            </div>
            <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={cn('h-full bg-gradient-to-r', gradient, 'shadow-lg')}
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute top-0 left-0 h-full bg-white/30 blur-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

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

  if (isDesktop) {
    return (
      <div className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
     {/*    {renderHeader()} */}
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
                        themeColor === 'sky' &&
                          'from-sky-50/50 to-blue-50/30',
                        themeColor === 'rose' &&
                          'from-rose-50/50 to-pink-50/30',
                        themeColor === 'purple' &&
                          'from-purple-50/50 to-indigo-50/30',
                        themeColor === 'teal' &&
                          'from-teal-50/50 to-emerald-50/30',
                        themeColor === 'amber' &&
                          'from-amber-50/50 to-orange-50/30'
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
                      <div className="pt-3 grid grid-cols-3 gap-2 text-xs">
                        <div
                          className="flex items-center justify-center p-2 rounded-lg"
                        >
                          <CheckCircle className="h-3.5 w-3.5 me-1.5 text-green-500" />
                          <span className="font-medium text-green-700">
                            {worldDict.listSheet.legend.completed}
                          </span>
                        </div>
                        <div className="flex items-center justify-center p-2 bg-red-50 rounded-lg">
                          <AlertCircle className="h-3.5 w-3.5 text-red-500 me-1.5" />
                          <span className="text-red-700 font-medium">
                            {worldDict.listSheet.legend.required}
                          </span>
                        </div>
                        <div className="flex items-center justify-center p-2 bg-gray-50 rounded-lg">
                          <CircleDot className="h-3.5 w-3.5 text-gray-400 me-1.5" />
                          <span className="text-gray-600 font-medium">
                            {worldDict.listSheet.legend.notAnswered}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 overflow-hidden h-[calc(100%-180px)]">
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
        className="max-w-2xl mx-auto p-4 space-y-6 pb-24 min-h-screen"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20 -z-10" />
     {/*    {renderHeader()} */}
        {renderQuestionCard()}
        {renderNavigationButtons()}
        {renderCelebration()}
      </div>
    );
  }
}