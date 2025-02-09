import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Bookmark, 
  AlertCircle, 
  HelpCircle, 
  SkipForward,
  Star
} from "lucide-react";
import type {
  Question,
  Answer,
  AnswerValue,
  QuestionDepth,
} from "../types/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  question: Question;
  answer?: Answer;
  depth: QuestionDepth;
  isRequired?: boolean;
  onAnswer?: (value: AnswerValue) => void;
  onSkip?: () => void;
  onBookmark?: () => void;
  onHelp?: () => void;
  className?: string;
  validationError?: string;
  isDisabled?: boolean;
  children?: React.ReactNode;
  language?: string;
}

const depthColors = {
  BASIC: "border-blue-200 bg-blue-50",
  ADVANCED: "border-purple-200 bg-purple-50",
  EXPERT: "border-green-200 bg-green-50",
};

const depthLabels = {
  BASIC: "בסיסי",
  ADVANCED: "מתקדם",
  EXPERT: "מעמיק",
};

export default function QuestionCard({
  question,
  answer,
  depth,
  isRequired = false,
  onAnswer,
  onSkip,
  onBookmark,
  onHelp,
  className = "",
  validationError,
  isDisabled = false,
  children,
  language = "he",
}: QuestionCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    onBookmark?.();
  };

  const handleHelp = () => {
    setShowHelp(!showHelp);
    onHelp?.();
  };

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        depthColors[depth],
        isDisabled ? "opacity-60" : "hover:shadow-md",
        className
      )}
    >
      {/* Header Section */}
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs px-2 py-1 rounded-full",
              depth === "BASIC"
                ? "bg-blue-100 text-blue-700"
                : depth === "ADVANCED"
                ? "bg-purple-100 text-purple-700"
                : "bg-green-100 text-green-700"
            )}
          >
            {depthLabels[depth]}
          </span>
          {isRequired && (
            <Badge variant="destructive" className="text-xs">
              חובה *
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            className={cn(
              "p-1",
              isBookmarked ? "text-yellow-500" : "text-gray-400"
            )}
          >
            <Bookmark className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleHelp}
            className="p-1 text-gray-400"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      {/* Content Section */}
      <CardContent className="pt-2">
        <div className="space-y-4">
          {/* Question Text */}
          <div className="text-lg font-medium">{question.question}</div>

          {/* Description if exists */}
          {question.description && (
            <p className="text-sm text-gray-600">{question.description}</p>
          )}

          {/* Help Text when shown */}
          {showHelp && question.metadata?.helpText && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-sm text-blue-700">
                {question.metadata.helpText}
              </AlertDescription>
            </Alert>
          )}

          {/* Validation Error */}
          {validationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {/* Required Indicator */}
          {isRequired && (
            <div className="text-sm text-red-500 mb-2">
              * שאלת חובה
            </div>
          )}
          
          {/* Answer Component */}
          <div className="mt-4">{children}</div>
        </div>
      </CardContent>

      {/* Footer Section */}
      <CardFooter className="flex justify-between pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSkip}
          disabled={isRequired || isDisabled}
          className={cn(
            "text-gray-500",
            (isRequired || isDisabled) && "opacity-50 cursor-not-allowed"
          )}
        >
          <SkipForward className="w-4 h-4 ml-2" />
          דלג
        </Button>

        {question.metadata?.estimatedTime && (
          <span className="text-sm text-gray-500">
            זמן מוערך: {question.metadata.estimatedTime} דקות
          </span>
        )}
      </CardFooter>
    </Card>
  );
   }