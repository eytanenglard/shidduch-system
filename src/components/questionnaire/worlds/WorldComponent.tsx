// src/components/questionnaire/worlds/WorldComponent.tsx
import React, { useState, useEffect } from 'react';
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
  PanelLeftClose,
  PanelRightClose,
  ListChecks,
  CircleDot,
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
  }
> = {
  PERSONALITY: { questions: personalityQuestions, themeColor: 'sky' },
  VALUES: { questions: valuesQuestions, themeColor: 'rose' },
  RELATIONSHIP: { questions: relationshipQuestions, themeColor: 'purple' },
  PARTNER: { questions: partnerQuestions, themeColor: 'teal' },
  RELIGION: { questions: religionQuestions, themeColor: 'amber' },
};

// --- CORRECTED HELPER FUNCTION ---
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
  onAnswer: (questionId: string, value: AnswerValue) => void;
  onVisibilityChange: (questionId: string, isVisible: boolean) => void;
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
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [isListVisible, setIsListVisible] = useState(true);
  const language = locale;
  const isRTL = language === 'he';
  useEffect(() => {
    console.log(
      `%c[WorldComponent - ${worldId}] Language is now: ${language}`,
      'color: #9c27b0; font-weight: bold;'
    );
  }, [language, worldId]);

  const { questions: allQuestionsStructure, themeColor } = worldConfig[worldId];
  const allQuestions = allQuestionsStructure.map((qStruct) =>
    getQuestionWithText(qStruct, dict)
  );

  const title = dict.worldLabels[worldId];

  const findAnswer = (questionId: string): QuestionnaireAnswer | undefined => {
    return answers.find(
      (a) => a.questionId.toLowerCase() === questionId.toLowerCase()
    );
  };

  const validateAnswer = (
    question: Question,
    value: AnswerValue
  ): string | null => {
    const isValueEmpty =
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'object' &&
        !Array.isArray(value) &&
        Object.keys(value || {}).length === 0);
    if (question.isRequired && isValueEmpty) return 'נדרשת תשובה לשאלה זו';
    if (!question.isRequired && isValueEmpty) return null;
    switch (question.type) {
      case 'openText': {
        const textValue = value as string;
        const trimmedLength = textValue?.trim().length || 0;
        if (
          question.minLength &&
          trimmedLength < question.minLength &&
          question.isRequired
        )
          return `התשובה חייבת להכיל לפחות ${question.minLength} תווים`;
        if (question.maxLength && trimmedLength > question.maxLength)
          return `התשובה לא יכולה להכיל יותר מ-${question.maxLength} תווים`;
        break;
      }
      case 'multiSelect':
      case 'multiChoice':
      case 'multiSelectWithOther': {
        const selectedValues = value as string[] | undefined;
        const count = selectedValues?.length ?? 0;
        if (question.minSelections && count < question.minSelections)
          return `יש לבחור לפחות ${question.minSelections} אפשרויות`;
        if (question.maxSelections && count > question.maxSelections)
          return `ניתן לבחור עד ${question.maxSelections} אפשרויות`;
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
            return `יש להקצות בדיוק ${question.totalPoints} נקודות.`;
        } else if (question.isRequired && !isValueEmpty)
          return 'נדרשת הקצאת תקציב.';
        break;
      }
    }
    return null;
  };

  const handleNext = () => {
    const currentQuestion = allQuestions[currentQuestionIndex];
    const value = findAnswer(currentQuestion.id)?.value;
    const error = validateAnswer(currentQuestion, value);
    if (error && currentQuestion.isRequired) {
      setValidationErrors({ ...validationErrors, [currentQuestion.id]: error });
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
              ) || 'נדרשת תשובה לשאלה זו',
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
    onAnswer(questionId, undefined);
  };

  if (allQuestions.length === 0) {
    return (
      <div className="p-4 bg-red-50 rounded-lg border border-red-300 text-red-800 text-center">
        <h3 className="font-bold text-lg mb-2">
          {dict.world.errors.loadingFailedTitle}
        </h3>
        <p>{dict.world.errors.loadingFailedDescription}</p>
        <Button className="mt-4" variant="outline" onClick={onBack}>
          {dict.world.buttons.backToMap}
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
    return <div>{dict.world.errors.invalidQuestion}</div>;
  }

  const progress = ((currentQuestionIndex + 1) / allQuestions.length) * 100;
  const currentAnswerObject = findAnswer(currentQuestion.id);
  const currentValue = currentAnswerObject?.value;

  const renderHeader = () => (
    <div className="bg-white p-3 rounded-lg shadow-sm border space-y-2 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-slate-800">{title}</h2>
          <div className="text-sm text-slate-500">
            {dict.world.header.questionLabel
              .replace('{{current}}', (currentQuestionIndex + 1).toString())
              .replace('{{total}}', allQuestions.length.toString())}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDesktop && (
            <Button
              variant={isListVisible ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setIsListVisible(!isListVisible)}
              className="gap-2"
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
              {isListVisible
                ? dict.world.buttons.hideList
                : dict.world.buttons.showList}
            </Button>
          )}
          {!isDesktop && (
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'gap-2 font-medium transition-all',
                    `border-${themeColor}-200 text-${themeColor}-700 bg-white hover:bg-${themeColor}-50`
                  )}
                >
                  <List className="h-4 w-4" />
                  <span>{dict.world.buttons.questionList}</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side={isRTL ? 'left' : 'right'}
                className="w-[300px] sm:w-[400px] flex flex-col"
              >
                <SheetHeader>
                  <SheetTitle>
                    <div className="flex items-center gap-2">
                      <ListChecks className="h-5 w-5 text-blue-600" />
                      <span>
                        {dict.world.listSheet.title.replace(
                          '{{worldTitle}}',
                          title
                        )}
                      </span>
                    </div>
                  </SheetTitle>
                  <SheetDescription>
                    {dict.world.listSheet.description}
                    <div className="mt-3 pt-3 border-t space-y-1">
                      <div className="flex items-center text-xs text-slate-600">
                        <CheckCircle
                          className={cn(
                            'h-3 w-3 me-1.5',
                            `text-${themeColor}-600`
                          )}
                        />
                        <span>{dict.world.listSheet.legend.completed}</span>
                      </div>
                      <div className="flex items-center text-xs text-slate-600">
                        <AlertCircle className="h-3 w-3 text-red-500 me-1.5" />
                        <span>{dict.world.listSheet.legend.required}</span>
                      </div>
                      <div className="flex items-center text-xs text-slate-600">
                        <CircleDot className="h-3 w-3 text-slate-400 me-1.5" />
                        <span>{dict.world.listSheet.legend.notAnswered}</span>
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
      <Progress
        value={progress}
        className="h-2"
        indicatorClassName={`bg-${themeColor}-500`}
      />
    </div>
  );

  const renderQuestionCard = () => (
    <motion.div
      className="transition-opacity duration-300"
      key={currentQuestionIndex}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
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
          onVisibilityChange(currentQuestion.id, isVisible)
        }
        onSave={onSave}
        isSaving={isSaving}
        dict={dict.questionCard}
      >
        <AnswerInput
          question={currentQuestion}
          value={currentValue}
          onChange={(value) => {
            setValidationErrors((prev) => ({
              ...prev,
              [currentQuestion.id]: '',
            }));
            onAnswer(currentQuestion.id, value);
          }}
          onClear={() => handleClearAnswer(currentQuestion.id)}
          validationError={validationErrors[currentQuestion.id]}
          dict={{
            answerInput: dict.answerInput,
            interactiveScale: dict.interactiveScale,
          }}
          locale={locale}
        />
      </QuestionCard>
    </motion.div>
  );

  const renderNavigationButtons = () => {
    const PrevIcon = isRTL ? ArrowRight : ArrowLeft;
    const NextIcon = isRTL ? ArrowLeft : ArrowRight;

    return (
      <div className="flex justify-between pt-4 mt-6 border-t border-slate-200">
        <Button
          variant="outline"
          onClick={handlePrevious}
          className="flex items-center gap-2"
        >
          <PrevIcon className="h-4 w-4" />
          <span>
            {currentQuestionIndex === 0
              ? dict.world.buttons.backToMap
              : dict.world.buttons.previous}
          </span>
        </Button>
        {currentQuestionIndex < allQuestions.length - 1 ? (
          <Button
            variant="default"
            onClick={handleNext}
            className={cn(
              'flex items-center gap-2',
              `bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white`
            )}
          >
            <span>{dict.world.buttons.next}</span>
            <NextIcon className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
          >
            <span>{dict.world.buttons.finish}</span>
            <CheckCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  if (isDesktop) {
    return (
      <div className="w-full relative" dir={isRTL ? 'rtl' : 'ltr'}>
        {renderHeader()}
        <div
          className={cn(
            'transition-all duration-300 ease-in-out',
            isListVisible ? 'grid grid-cols-12 gap-8' : 'flex justify-center'
          )}
        >
          <div
            className={cn(
              'space-y-6',
              isListVisible
                ? 'col-span-12 lg:col-span-7 xl:col-span-8'
                : 'w-full max-w-4xl'
            )}
          >
            {renderQuestionCard()}
            {renderNavigationButtons()}
          </div>
          <AnimatePresence>
            {isListVisible && (
              <motion.div
                className="col-span-12 lg:col-span-5 xl:col-span-4"
                initial={{
                  opacity: 0,
                  width: 0,
                  [isRTL ? 'marginRight' : 'marginLeft']: '-2rem',
                }}
                animate={{
                  opacity: 1,
                  width: 'auto',
                  [isRTL ? 'marginRight' : 'marginLeft']: '0',
                }}
                exit={{
                  opacity: 0,
                  width: 0,
                  [isRTL ? 'marginRight' : 'marginLeft']: '-2rem',
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                layout
              >
                <Card className="sticky top-6 shadow-lg border-slate-200 h-[calc(100vh-10rem)] overflow-hidden flex flex-col">
                  <CardHeader className="pb-3 pt-4 border-b bg-slate-50/50 flex-shrink-0">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-800">
                      <ListChecks className="h-5 w-5 text-blue-600" />
                      <span>
                        {dict.world.listSheet.title.replace(
                          '{{worldTitle}}',
                          title
                        )}
                      </span>
                    </CardTitle>
                    <div className="pt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <div className="flex items-center">
                        <CheckCircle
                          className={cn(
                            'h-3 w-3 me-1.5',
                            `text-${themeColor}-600`
                          )}
                        />
                        <span>{dict.world.listSheet.legend.completed}</span>
                      </div>
                      <div className="flex items-center">
                        <AlertCircle className="h-3 w-3 text-red-500 me-1.5" />
                        <span>{dict.world.listSheet.legend.required}</span>
                      </div>
                      <div className="flex items-center">
                        <CircleDot className="h-3 w-3 text-slate-400 me-1.5" />
                        <span>{dict.world.listSheet.legend.notAnswered}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-2 flex-grow overflow-hidden">
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  } else {
    // Widok mobilny
    return (
      <div
        className="max-w-2xl mx-auto p-2 sm:p-4 space-y-6 pb-24"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {renderHeader()}
        {renderQuestionCard()}
        {renderNavigationButtons()}
      </div>
    );
  }
}
