import React, { useState } from "react";
import WorldIntro from "../common/WorldIntro";
import QuestionCard from "../common/QuestionCard";
import AnswerInput from "../common/AnswerInput";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { WorldComponentProps, AnswerValue } from "../types/types";
import { valuesQuestionsPartOne } from "../questions/values/valuesQuestionsPartOne";
import { valuesQuestionsPartTwo } from "../questions/values/valuesQuestionsPartTwo";
import { cn } from "@/lib/utils";

// Combine all questions for the values world
const allQuestions = [...valuesQuestionsPartOne, ...valuesQuestionsPartTwo];

export default function ValuesWorld({
  onAnswer,
  onComplete,
  onBack,
  answers,
  isCompleted = false,
  language = "he",
}: WorldComponentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const findAnswer = (questionId: string) => {
    return answers.find((a) => a.questionId === questionId)?.value;
  };

  const validateAnswer = (question: any, value: any): string | null => {
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
      return;
    }

    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  if (!isIntroComplete) {
    return (
      <WorldIntro
        worldId="VALUES"
        title="עולם הערכים והאמונות"
        description="בואו נברר יחד מהם הערכים והעקרונות המנחים בחייך"
        estimatedTime={40}
        totalQuestions={allQuestions.length}
        requiredQuestions={allQuestions.filter((q) => q.isRequired).length}
        depths={["BASIC", "ADVANCED", "EXPERT"]}
        onStart={() => setIsIntroComplete(true)}
      />
    );
  }

  const currentQuestion = allQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / allQuestions.length) * 100;
  const currentValue = findAnswer(currentQuestion.id);

  const handleClearAnswer = () => {
    let emptyValue: AnswerValue;
    switch (currentQuestion.type) {
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

    onAnswer(currentQuestion.id, emptyValue);
    setValidationErrors({
      ...validationErrors,
      [currentQuestion.id]: "",
    });
  };

  console.log({
    isCompleted,
    currentQuestionIndex,
    totalQuestions: allQuestions.length,
    isLastQuestion: currentQuestionIndex === allQuestions.length - 1,
  });

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="space-y-4">
        {/* Question Navigation Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 flex items-center gap-2 overflow-x-auto py-2">
            {allQuestions.map((_, index) => {
              const answer = findAnswer(allQuestions[index].id);
              const isAnswered =
                answer !== undefined &&
                answer !== null &&
                answer !== "" &&
                (Array.isArray(answer) ? answer.length > 0 : true) &&
                (typeof answer === "object" && !Array.isArray(answer)
                  ? Object.keys(answer).length > 0
                  : true);
              const isCurrent = index === currentQuestionIndex;
              const isRequired = allQuestions[index].isRequired;

              return (
                <div key={allQuestions[index].id} className="relative">
                  <button
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors relative",
                      "hover:bg-blue-100 focus:outline-none",
                      isCurrent && "ring-2 ring-blue-500",
                      isAnswered
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600",
                      isRequired &&
                        !isAnswered &&
                        !isCurrent &&
                        "ring-2 ring-red-500"
                    )}
                    title={`שאלה ${index + 1}${isRequired ? " (חובה)" : ""}`}
                  >
                    {index + 1}
                    {isRequired && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <QuestionCard
        question={currentQuestion}
        depth={currentQuestion.depth}
        isRequired={currentQuestion.isRequired}
        validationError={validationErrors[currentQuestion.id]}
        language={language}
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

      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => {
            if (currentQuestionIndex > 0) {
              setCurrentQuestionIndex((prev) => prev - 1);
            } else {
              onBack();
            }
          }}
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          {currentQuestionIndex === 0 ? "חזור למפה" : "שאלה קודמת"}
        </Button>

        {currentQuestionIndex < allQuestions.length - 1 ? (
          <Button onClick={handleNext}>
            שאלה הבאה
            <ArrowLeft className="w-4 h-4 mr-2" />
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={allQuestions.some(
              (q) => q.isRequired && !findAnswer(q.id)
            )}
          >
            סיים עולם זה
            <ArrowLeft className="w-4 h-4 mr-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
