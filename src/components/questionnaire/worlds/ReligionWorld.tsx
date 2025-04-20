import React, { useState, useEffect } from "react";
import WorldIntro from "../common/WorldIntro";
import QuestionCard from "../common/QuestionCard";
import AnswerInput from "../common/AnswerInput";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  List, // הוספנו
  CheckCircle, // הוספנו
  AlertCircle, // הוספנו
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  WorldComponentProps,
  AnswerValue,
  Question,
} from "../types/types";
import { practicalQuestions } from "../questions/religion/practicalReligionQuestions";
import { faithQuestions } from "../questions/religion/faithQuestions";
// הוספנו את הייבואים של Sheet ו-ScrollArea
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

// Combine all questions for the religion world
const allQuestions = [...practicalQuestions, ...faithQuestions];

export default function ReligionWorld({
  onAnswer,
  onComplete,
  onBack,
  answers,
  language = "he",
}: WorldComponentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [animateDirection, setAnimateDirection] = useState<
    "left" | "right" | null
  >(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateDirection(null);
    }, 500);

    return () => clearTimeout(timer);
  }, [currentQuestionIndex]);

  const findAnswer = (questionId: string) => {
    const foundAnswer = answers.find((a) => a.questionId === questionId);
    return foundAnswer ? foundAnswer.value : undefined;
  };

  const validateAnswer = (
    question: Question,
    value: AnswerValue
  ): string | null => {
    if (question.isRequired && !value) {
      return "נדרשת תשובה לשאלה זו";
    }

    switch (question.type) {
      case "openText": {
        const textValue = value as string;
        if (!textValue && !question.isRequired) return null;

        const trimmedLength = textValue?.trim().length || 0;
        if (
          question.minLength &&
          trimmedLength < question.minLength &&
          question.isRequired
        ) {
          return `התשובה חייבת להכיל לפחות ${question.minLength} תווים`;
        }
        if (question.maxLength && trimmedLength > question.maxLength) {
          return `התשובה לא יכולה להכיל יותר מ-${question.maxLength} תווים`;
        }
        break;
      }

      case "multiSelect":
      case "multiChoice": {
        const selectedValues = value as string[];
        if (!selectedValues?.length && !question.isRequired) return null;

        if (
          question.minSelections &&
          selectedValues.length < question.minSelections
        ) {
          return `יש לבחור לפחות ${question.minSelections} אפשרויות`;
        }
        if (
          question.maxSelections &&
          selectedValues.length > question.maxSelections
        ) {
          return `ניתן לבחור עד ${question.maxSelections} אפשרויות`;
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
    }

    if (currentQuestionIndex < allQuestions.length - 1) {
      setAnimateDirection("left");
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setAnimateDirection("right");
      setCurrentQuestionIndex((prev) => prev - 1);
    } else {
      onBack();
    }
  };

  const handleClearAnswer = () => {
    let emptyValue: AnswerValue;
    switch (allQuestions[currentQuestionIndex].type) {
      case "multiChoice":
      case "multiSelect":
        emptyValue = [];
        break;
      case "budgetAllocation":
        emptyValue = {};
        break;
      case "scale":
        emptyValue = 0;
        break;
      default:
        emptyValue = "";
    }

    onAnswer(allQuestions[currentQuestionIndex].id, emptyValue);
    setValidationErrors({
      ...validationErrors,
      [allQuestions[currentQuestionIndex].id]: "",
    });
  };

  if (!isIntroComplete) {
    return (
      <WorldIntro
        worldId="RELIGION"
        title="עולם הדת והמסורת"
        description="בואו נברר יחד את תפיסת עולמך הדתית והקשר שלך למסורת"
        estimatedTime={35}
        totalQuestions={allQuestions.length}
        requiredQuestions={allQuestions.filter((q) => q.isRequired).length}
        depths={["BASIC", "ADVANCED", "EXPERT"]}
        onStart={() => setIsIntroComplete(true)}
      />
    );
  }

  // Handle case where allQuestions might be empty due to import issues
  if (allQuestions.length === 0) {
    return (
      <div className="p-4 bg-red-50 rounded-lg border border-red-300 text-red-800">
        <h3 className="font-bold">שגיאה בטעינת השאלות</h3>
        <p>לא ניתן לטעון את השאלות לעולם זה. אנא נסה לרענן את הדף.</p>
        <Button className="mt-4" variant="outline" onClick={onBack}>
          חזרה למפה
        </Button>
      </div>
    );
  }

  const currentQuestion = allQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / allQuestions.length) * 100;
  const currentValue = findAnswer(currentQuestion.id);

  // מידע על התקדמות המשתמש בשאלון
  const answeredQuestionsCount = allQuestions.filter((q) =>
    answers.some(
      (a) =>
        a.questionId === q.id &&
        a.value !== undefined &&
        a.value !== "" &&
        (!Array.isArray(a.value) || a.value.length > 0)
    )
  ).length;

  const completionPercentage = Math.round(
    (answeredQuestionsCount / allQuestions.length) * 100
  );

  // תצוגת כל השאלות ומצב התשובות
  const QuestionsList = ({ closeSheet }: { closeSheet?: () => void }) => (
    <ScrollArea className="h-[60vh]">
      <div className="space-y-2 p-2">
        {allQuestions.map((q, index) => {
          const answer = findAnswer(q.id);
          const isAnswered =
            answer !== undefined &&
            answer !== null &&
            answer !== "" &&
            (Array.isArray(answer) ? answer.length > 0 : true) &&
            (typeof answer === "object" && !Array.isArray(answer)
              ? Object.keys(answer || {}).length > 0
              : true);
          const isCurrent = index === currentQuestionIndex;

          return (
            <Button
              key={q.id}
              variant={isCurrent ? "default" : "outline"}
              size="sm"
              className={cn(
                "w-full justify-start text-start",
                isCurrent ? "bg-blue-600 text-white" : "",
                isAnswered && !isCurrent ? "border-green-500" : "",
                q.isRequired && !isAnswered ? "border-red-300" : ""
              )}
              onClick={() => {
                setCurrentQuestionIndex(index);
                closeSheet?.();
              }}
            >
              <div className="flex items-center">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs mr-2">
                  {index + 1}
                </span>
                <div className="flex-1 truncate max-w-[200px]">
                  {q.question.length > 30
                    ? q.question.substring(0, 30) + "..."
                    : q.question}
                </div>
                <div className="ml-2">
                  {isAnswered ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : q.isRequired ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : null}
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </ScrollArea>
  );

  return (
    <div className="max-w-2xl mx-auto p-2 sm:p-4 space-y-6">
      {/* סרגל עליון חדש */}
      <div className="bg-white p-3 rounded-lg shadow-sm border space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">עולם הדת והמסורת</h2>
            <div className="text-sm text-gray-500">
              שאלה {currentQuestionIndex + 1} מתוך {allQuestions.length}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              <span>{completionPercentage}% הושלם</span>
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">רשימת שאלות</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>כל השאלות בעולם הדת והמסורת</SheetTitle>
                  <SheetDescription>
                    לחץ על שאלה כדי לעבור אליה ישירות.
                    <div className="mt-2 flex gap-2 text-xs">
                      <div className="flex items-center">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                        <span>הושלם</span>
                      </div>
                      <div className="flex items-center">
                        <AlertCircle className="h-3 w-3 text-red-500 mr-1" />
                        <span>שאלת חובה</span>
                      </div>
                    </div>
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  <QuestionsList closeSheet={() => {}} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <Progress value={progress} className="h-2" />
      </div>

      <div
        className={cn(
          "transition-all duration-300 transform",
          animateDirection === "left" && "translate-x-4 opacity-0",
          animateDirection === "right" && "-translate-x-4 opacity-0"
        )}
      >
        <QuestionCard
          question={currentQuestion}
          depth={currentQuestion.depth}
          isRequired={currentQuestion.isRequired}
          validationError={validationErrors[currentQuestion.id]}
          language={language}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isLastQuestion={currentQuestionIndex === allQuestions.length - 1}
          isFirstQuestion={currentQuestionIndex === 0}
        >
          <AnswerInput
            question={currentQuestion}
            value={currentValue}
            onChange={(value) => {
              setValidationErrors({
                ...validationErrors,
                [currentQuestion.id]: "",
              });
              onAnswer(currentQuestion.id, value);
            }}
            onClear={() => !currentQuestion.isRequired && handleClearAnswer()}
            language={language}
            showValidation={true}
          />
        </QuestionCard>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className={currentQuestionIndex === 0 ? "opacity-50" : ""}
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          {currentQuestionIndex === 0 ? "חזור למפה" : "שאלה קודמת"}
        </Button>

        {currentQuestionIndex < allQuestions.length - 1 ? (
          <Button
            variant="default"
            onClick={handleNext}
            className="bg-blue-600 hover:bg-blue-700"
          >
            שאלה הבאה
            <ArrowLeft className="w-4 h-4 mr-2" />
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className="bg-green-600 hover:bg-green-700"
          >
            סיים עולם זה
            <CheckCircle className="w-4 h-4 mr-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
