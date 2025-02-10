import React, { useState } from "react";
import WorldIntro from "../common/WorldIntro";
import QuestionCard from "../common/QuestionCard";
import AnswerInput from "../common/AnswerInput";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { WorldComponentProps, AnswerValue } from "../types/types";
import type { Question } from "../types/types";
import { partnerBasicQuestions } from "../questions/partner/partnerBasicQuestions";
import { partnerDepthQuestions } from "../questions/partner/partnerDepthQuestions";
import { cn } from "@/lib/utils";

const allQuestions = [...partnerBasicQuestions, ...partnerDepthQuestions];

export default function PartnerWorld({
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

  const validateAnswer = (
    question: Question,
    value: AnswerValue
  ): string | null => {
    if (question.isRequired && !value) {
      return "נדרשת תשובה לשאלה זו";
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
    } else if (!isCompleted) {
      onComplete();
    }
  };

  if (!isIntroComplete) {
    return (
      <WorldIntro
        worldId="PARTNER"
        title="עולם הפרטנר"
        description="בואו נברר מה חשוב לך בבן/בת הזוג"
        estimatedTime={25}
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

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="space-y-4">
        {/* Question Navigation Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 flex items-center gap-2 overflow-x-auto py-2">
            {allQuestions.map((_, index) => {
              const isAnswered = !!findAnswer(allQuestions[index].id);
              const isCurrent = index === currentQuestionIndex;

              return (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors",
                    "hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                    isCurrent && "ring-2 ring-blue-500",
                    isAnswered
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-600"
                  )}
                >
                  {index + 1}
                </button>
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
          language={language}
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
          !isCompleted && (
            <Button
              onClick={handleNext}
              disabled={allQuestions.some(
                (q) => q.isRequired && !findAnswer(q.id)
              )}
            >
              סיים עולם זה
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          )
        )}
      </div>
    </div>
  );
}
