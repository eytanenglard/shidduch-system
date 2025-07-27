// src/components/questionnaire/worlds/PersonalityWorld.tsx
import React, { useState, useEffect } from "react";
import WorldIntro from "../common/WorldIntro";
import QuestionCard from "../common/QuestionCard";
import AnswerInput from "../common/AnswerInput";
import QuestionsList from "../common/QuestionsList";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type {
  WorldComponentProps,
  AnswerValue,
  Question,
} from "../types/types";
import { personalityQuestions } from "../questions/personality/personalityQuestions";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const allQuestions = personalityQuestions;

export default function PersonalityWorld({
  onAnswer,
  onComplete,
  onBack,
  answers,
  language = "he",
  currentQuestionIndex,
  setCurrentQuestionIndex,
}: WorldComponentProps) {
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [, setAnimateDirection] = useState<"left" | "right" | null>(null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isRTL = language === "he";
  const [isListVisible, setIsListVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateDirection(null), 300);
    return () => clearTimeout(timer);
  }, [currentQuestionIndex]);

  const findAnswer = (questionId: string) => {
    return answers.find((a) => a.questionId === questionId)?.value;
  };

  const validateAnswer = (question: Question, value: AnswerValue): string | null => {
    const isValueEmpty =
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === "object" &&
        !Array.isArray(value) &&
        Object.keys(value || {}).length === 0);

    if (question.isRequired && isValueEmpty) {
      return "נדרשת תשובה לשאלה זו";
    }
    if (!question.isRequired && isValueEmpty) {
      return null;
    }

    switch (question.type) {
      case "openText": {
        const textValue = value as string;
        const trimmedLength = textValue?.trim().length || 0;
        if (question.minLength && trimmedLength < question.minLength && question.isRequired) {
          return `התשובה חייבת להכיל לפחות ${question.minLength} תווים`;
        }
        if (question.maxLength && trimmedLength > question.maxLength) {
          return `התשובה לא יכולה להכיל יותר מ-${question.maxLength} תווים`;
        }
        break;
      }
      case "multiSelect":
      case "multiChoice":
      case "multiSelectWithOther": {
        const selectedValues = value as string[] | undefined;
        const count = selectedValues?.length ?? 0;
        if (question.minSelections && count < question.minSelections) {
          return `יש לבחור לפחות ${question.minSelections} אפשרויות`;
        }
        if (question.maxSelections && count > question.maxSelections) {
          return `ניתן לבחור עד ${question.maxSelections} אפשרויות`;
        }
        break;
      }
      case "budgetAllocation": {
        const allocationValue = value as Record<string, number> | undefined;
        if (allocationValue) {
            const totalAllocated = Object.values(allocationValue).reduce((sum, val) => sum + (val || 0), 0);
            if (question.totalPoints && totalAllocated !== question.totalPoints && question.isRequired) {
                return `יש להקצות בדיוק ${question.totalPoints} נקודות.`;
            }
        } else if (question.isRequired && !isValueEmpty) {
             return "נדרשת הקצאת תקציב.";
         }
        break;
      }
    }
    return null;
  };

  const handleNext = () => {
    const currentQuestion = allQuestions[currentQuestionIndex];
    const value = findAnswer(currentQuestion.id);
    const error = validateAnswer(currentQuestion, value);

    if (error && currentQuestion.isRequired) {
      setValidationErrors({ ...validationErrors, [currentQuestion.id]: error });
      return;
    }
    setValidationErrors(prev => ({ ...prev, [currentQuestion.id]: '' }));

    if (currentQuestionIndex < allQuestions.length - 1) {
      setAnimateDirection("left");
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
        const firstUnansweredRequired = allQuestions.find(q =>
            q.isRequired && validateAnswer(q, findAnswer(q.id)) !== null
        );
        if (firstUnansweredRequired) {
            const errorIndex = allQuestions.findIndex(q => q.id === firstUnansweredRequired.id);
            if (errorIndex !== -1) {
                setCurrentQuestionIndex(errorIndex);
                setValidationErrors({
                    ...validationErrors,
                    [firstUnansweredRequired.id]: validateAnswer(firstUnansweredRequired, findAnswer(firstUnansweredRequired.id)) || "נדרשת תשובה לשאלה זו"
                });
            }
        } else {
            onComplete();
        }
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setAnimateDirection("right");
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      onBack();
    }
  };

  const handleClearAnswer = () => {
    const currentQuestion = allQuestions[currentQuestionIndex];
    let emptyValue: AnswerValue;
    switch (currentQuestion.type) {
      case "multiChoice": case "multiSelect": case "multiSelectWithOther": emptyValue = []; break;
      case "budgetAllocation": emptyValue = {}; break;
      case "scale": emptyValue = undefined; break;
      default: emptyValue = "";
    }
    onAnswer(currentQuestion.id, emptyValue);
    setValidationErrors(prev => ({ ...prev, [currentQuestion.id]: '' }));
  };

  if (!isIntroComplete) {
    return (
      <WorldIntro
        worldId="PERSONALITY"
        title="עולם האישיות: מי אני באמת?"
        description="המסע שלך מתחיל כאן! בעולם זה נצא יחד לגלות את התכונות, סגנון החיים, החוזקות והשאיפות המיוחדות שלך. ככל שנכיר אותך טוב יותר, כך נוכל לסייע במציאת התאמה שמבינה ומעריכה את מי שאת/ה."
        estimatedTime={allQuestions.reduce((sum, q) => sum + (q.metadata?.estimatedTime || 1), 0)}
        totalQuestions={allQuestions.length}
        requiredQuestions={allQuestions.filter((q) => q.isRequired).length}
        depths={["BASIC", "ADVANCED"]}
        onStart={() => setIsIntroComplete(true)}
      />
    );
  }

  if (allQuestions.length === 0) {
    return (
      <div className="p-4 bg-red-50 rounded-lg border border-red-300 text-red-800 text-center">
        <h3 className="font-bold text-lg mb-2">שגיאה בטעינת השאלות</h3>
        <p>לא ניתן היה לטעון את השאלות עבור עולם זה.</p>
        <Button className="mt-4" variant="outline" onClick={onBack}>חזרה למפה</Button>
      </div>
    );
  }

  const currentQuestion = allQuestions[currentQuestionIndex];
  if (!currentQuestion) {
     console.error(`Error: Invalid question index ${currentQuestionIndex} for PersonalityWorld.`);
     setCurrentQuestionIndex(0);
     return <div>שגיאה בטעינת השאלה...</div>;
  }

  const progress = ((currentQuestionIndex + 1) / allQuestions.length) * 100;
  const currentValue = findAnswer(currentQuestion.id);
  const answeredQuestionsCount = allQuestions.filter((q) => {
        const answerValue = findAnswer(q.id);
        return answerValue !== undefined && answerValue !== null &&
               (typeof answerValue !== 'string' || answerValue.trim() !== '') &&
               (!Array.isArray(answerValue) || answerValue.length > 0) &&
               (typeof answerValue !== 'object' || Array.isArray(answerValue) || Object.keys(answerValue).length > 0);
   }).length;
  const completionPercentage = Math.round(
    (answeredQuestionsCount / allQuestions.length) * 100
  );

  const renderHeader = () => (
    <div className="bg-white p-3 rounded-lg shadow-sm border space-y-2 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">עולם האישיות</h2>
          <div className="text-sm text-gray-500">
            שאלה {currentQuestionIndex + 1} מתוך {allQuestions.length}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDesktop && (
             <Button 
                variant={isListVisible ? "secondary" : "outline"}
                size="sm"
                onClick={() => setIsListVisible(!isListVisible)}
                className="gap-2"
             >
                {isListVisible ? (isRTL ? <PanelRightClose className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />) : <List className="h-4 w-4" />}
                {isListVisible ? "הסתר רשימה" : "הצג רשימה"}
             </Button>
          )}
          {!isDesktop && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">רשימת שאלות</span>
                </Button>
              </SheetTrigger>
              <SheetContent side={isRTL ? "left" : "right"} className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>
                    <div className="flex items-center gap-2">
                      <ListChecks className="h-5 w-5 text-blue-600" />
                      <span>כל השאלות בעולם האישיות</span>
                    </div>
                  </SheetTitle>
                   <SheetDescription>
                     לחץ על שאלה כדי לעבור אליה ישירות.
                     <div className="mt-3 pt-3 border-t space-y-1">
                       <div className="flex items-center text-xs text-gray-600"><CheckCircle className="h-3 w-3 text-green-500 me-1.5" /><span>הושלם</span></div>
                       <div className="flex items-center text-xs text-gray-600"><AlertCircle className="h-3 w-3 text-red-500 me-1.5" /><span>חובה (לא נענה)</span></div>
                       <div className="flex items-center text-xs text-gray-600"><CircleDot className="h-3 w-3 text-gray-400 me-1.5" /><span>לא נענה</span></div>
                     </div>
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-4">
                  <QuestionsList allQuestions={allQuestions} currentQuestionIndex={currentQuestionIndex} setCurrentQuestionIndex={setCurrentQuestionIndex} answers={answers} language={language} />
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );

  const renderQuestionCard = () => (
    <motion.div className={cn("transition-opacity duration-300")} key={currentQuestionIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <QuestionCard question={currentQuestion} depth={currentQuestion.depth} isRequired={currentQuestion.isRequired} validationError={validationErrors[currentQuestion.id]} language={language}>
        <AnswerInput question={currentQuestion} value={currentValue} onChange={(value) => { setValidationErrors(prev => ({ ...prev, [currentQuestion.id]: '' })); onAnswer(currentQuestion.id, value); }} onClear={handleClearAnswer} language={language} showValidation={!!validationErrors[currentQuestion.id]} />
      </QuestionCard>
    </motion.div>
  );

  const renderNavigationButtons = () => (
    <div className="flex justify-between pt-4 mt-6 border-t">
      <Button variant="outline" onClick={handlePrevious} className="flex items-center gap-2"><ArrowRight className="h-4 w-4" /><span>{currentQuestionIndex === 0 ? "חזור למפה" : "שאלה קודמת"}</span></Button>
      {currentQuestionIndex < allQuestions.length - 1 ? (
        <Button variant="default" onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"><span>שאלה הבאה</span><ArrowLeft className="h-4 w-4" /></Button>
      ) : (
        <Button onClick={handleNext} className="bg-green-600 hover:bg-green-700 flex items-center gap-2"><span>סיים עולם זה</span><CheckCircle className="h-4 w-4" /></Button>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <div className="w-full relative" dir={isRTL ? "rtl" : "ltr"}>
        {renderHeader()}
        <div className={cn("transition-all duration-300 ease-in-out", isListVisible ? "grid grid-cols-12 gap-8" : "flex justify-center")}>
          <div className={cn("space-y-6", isListVisible ? "col-span-12 lg:col-span-7 xl:col-span-8" : "w-full max-w-4xl")}>
            {renderQuestionCard()}
            {renderNavigationButtons()}
          </div>
          <AnimatePresence>
            {isListVisible && (
              <motion.div className="col-span-12 lg:col-span-5 xl:col-span-4" initial={{ opacity: 0, width: 0, marginInlineStart: isRTL ? "-2rem" : undefined, marginInlineEnd: isRTL ? undefined : "-2rem" }} animate={{ opacity: 1, width: "auto", marginInlineStart: 0, marginInlineEnd: 0 }} exit={{ opacity: 0, width: 0, marginInlineStart: isRTL ? "-2rem" : undefined, marginInlineEnd: isRTL ? undefined : "-2rem" }} transition={{ duration: 0.3, ease: "easeInOut" }} layout>
                <Card className="sticky top-6 shadow-lg border border-gray-200 h-[calc(100vh-5rem)] overflow-hidden flex flex-col">
                   <CardHeader className="pb-3 pt-4 border-b bg-gray-50/50 flex-shrink-0">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-800"><ListChecks className="h-5 w-5 text-blue-600" /><span>שאלות בעולם זה</span></CardTitle>
                    <div className="pt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                       <div className="flex items-center"><CheckCircle className="h-3 w-3 text-green-500 me-1.5" /><span>הושלם</span></div>
                       <div className="flex items-center"><AlertCircle className="h-3 w-3 text-red-500 me-1.5" /><span>חובה</span></div>
                       <div className="flex items-center"><CircleDot className="h-3 w-3 text-gray-400 me-1.5" /><span>לא נענה</span></div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-2 flex-grow overflow-hidden"><QuestionsList allQuestions={allQuestions} currentQuestionIndex={currentQuestionIndex} setCurrentQuestionIndex={setCurrentQuestionIndex} answers={answers} language={language} className="h-full" /></CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  } else {
    return (
      <Sheet>
        <div className="max-w-2xl mx-auto p-2 sm:p-4 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
          {renderHeader()}
          {renderQuestionCard()}
          {renderNavigationButtons()}
        </div>

        <SheetTrigger asChild>
            <Button
                variant="default"
                className="fixed bottom-6 left-6 z-40 h-14 w-14 rounded-full shadow-lg flex items-center justify-center bg-blue-600 hover:bg-blue-700"
                aria-label="הצג רשימת שאלות"
            >
                <List className="h-6 w-6 text-white" />
            </Button>
        </SheetTrigger>

        <SheetContent
            side={isRTL ? 'left' : 'right'}
            className="w-[300px] sm:w-[400px]"
        >
            <SheetHeader>
                <SheetTitle>
                    <div className="flex items-center gap-2">
                        <ListChecks className="h-5 w-5 text-blue-600" />
                        <span>כל השאלות בעולם האישיות</span>
                    </div>
                </SheetTitle>
                <SheetDescription>
                    לחץ על שאלה כדי לעבור אליה ישירות.
                    <div className="mt-3 pt-3 border-t space-y-1">
                        <div className="flex items-center text-xs text-gray-600"><CheckCircle className="h-3 w-3 text-green-500 me-1.5" /><span>הושלם</span></div>
                        <div className="flex items-center text-xs text-gray-600"><AlertCircle className="h-3 w-3 text-red-500 me-1.5" /><span>חובה (לא נענה)</span></div>
                        <div className="flex items-center text-xs text-gray-600"><CircleDot className="h-3 w-3 text-gray-400 me-1.5" /><span>לא נענה</span></div>
                    </div>
                </SheetDescription>
            </SheetHeader>
            <div className="mt-4">
                <QuestionsList
                    allQuestions={allQuestions}
                    currentQuestionIndex={currentQuestionIndex}
                    setCurrentQuestionIndex={setCurrentQuestionIndex}
                    answers={answers}
                    language={language}
                />
            </div>
        </SheetContent>
      </Sheet>
    );
  }
}