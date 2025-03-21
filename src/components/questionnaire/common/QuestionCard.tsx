import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Bookmark,
  AlertCircle,
  HelpCircle,
  SkipForward,
  ChevronRight,
  ChevronLeft,
  Info,
  Star,
  X,
  CornerRightDown,
  MessageCircle,
  Lightbulb,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import type {
  Question,
  Answer,
  AnswerValue,
  QuestionDepth,
} from "../types/types";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "../hooks/useMediaQuery";

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
  onNext?: () => void;
  onPrevious?: () => void;
  isLastQuestion?: boolean;
  isFirstQuestion?: boolean;
}

// קונפיגורציה של צבעים ותוויות עבור רמות שאלה שונות
const depthColors = {
  BASIC: "border-blue-200 bg-blue-50/80",
  ADVANCED: "border-purple-200 bg-purple-50/80",
  EXPERT: "border-green-200 bg-green-50/80",
};

const depthGradients = {
  BASIC: "from-blue-50 to-white",
  ADVANCED: "from-purple-50 to-white",
  EXPERT: "from-green-50 to-white",
};

const depthBadgeColors = {
  BASIC: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  ADVANCED: "bg-purple-100 text-purple-700 hover:bg-purple-200",
  EXPERT: "bg-green-100 text-green-700 hover:bg-green-200",
};

const depthLabels = {
  BASIC: "בסיסי",
  ADVANCED: "מתקדם",
  EXPERT: "מעמיק",
};

const depthDescriptions = {
  BASIC: "שאלות חובה המהוות את הבסיס להיכרות",
  ADVANCED: "שאלות מומלצות להיכרות מעמיקה יותר",
  EXPERT: "שאלות העשרה לחיבור מעמיק במיוחד",
};

export default function QuestionCard({
  question,
  depth,
  isRequired = false,
  onSkip,
  onBookmark,
  onHelp,
  className = "",
  validationError,
  isDisabled = false,
  children,
  onNext,
  onPrevious,
  isLastQuestion = false,
  isFirstQuestion = false,
  language = "he",
}: QuestionCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const isMobile = useMediaQuery("(max-width: 640px)");

  // אפקטים ויזואליים באמצעות framer-motion
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
  };

  const contentVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { delay: 0.1, duration: 0.3 } },
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    onBookmark?.();
  };

  const handleHelp = () => {
    setShowHelp(!showHelp);
    onHelp?.();
  };

  // הרנדור משתנה בהתאם למכשיר
  const renderFooter = () => {
    if (isMobile) {
      // פוטר פשוט יותר למובייל
      return (
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevious}
            disabled={isFirstQuestion || !onPrevious}
            className="flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4 ml-1" />
            הקודם
          </Button>

          <Button
            size="sm"
            onClick={onNext}
            disabled={!onNext}
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700"
          >
            {isLastQuestion ? "סיים" : "הבא"}
            <ChevronLeft className="w-4 h-4 mr-1" />
          </Button>
        </div>
      );
    }

    // פוטר מלא למסך רגיל
    return (
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {onPrevious && !isFirstQuestion && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrevious}
              className="text-gray-600 hover:text-gray-900"
            >
              <ChevronRight className="w-4 h-4 ml-1" />
              הקודם
            </Button>
          )}

          {onSkip && (
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
              <SkipForward className="w-4 h-4 ml-1" />
              דלג
            </Button>
          )}
        </div>

        <div className="flex items-center">
          {question.metadata?.estimatedTime && (
            <div className="text-xs text-gray-500 mr-2 flex items-center">
              <Info className="h-3 w-3 mr-1 text-blue-400" />
              זמן מוערך: {question.metadata.estimatedTime} דקות
            </div>
          )}

          {onNext && (
            <Button
              size="sm"
              onClick={onNext}
              className="ml-2 bg-blue-600 hover:bg-blue-700"
            >
              {isLastQuestion ? "סיים" : "הבא"}
              <ChevronLeft className="w-4 h-4 mr-1" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={cardVariants}
    >
      <Card
        className={cn(
          "transition-all duration-200 border shadow-sm",
          depthColors[depth],
          isDisabled ? "opacity-75 cursor-not-allowed" : "hover:shadow-md",
          "overflow-hidden",
          className
        )}
      >
        {/* רקע גרדיאנט עדין */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-b opacity-50",
            depthGradients[depth]
          )}
        />

        {/* Header Section */}
        <CardHeader className="relative flex flex-col space-y-2 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs px-2 py-1 rounded-full font-normal",
                        depthBadgeColors[depth]
                      )}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      {depthLabels[depth]}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="text-sm">{depthDescriptions[depth]}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {isRequired && (
                <Badge variant="destructive" className="text-xs animate-pulse">
                  חובה *
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBookmark}
                      className={cn(
                        "h-8 w-8 p-0 rounded-full transition-colors",
                        isBookmarked
                          ? "text-amber-500 bg-amber-50"
                          : "text-gray-400 hover:bg-gray-100"
                      )}
                      aria-label={isBookmarked ? "הסר סימניה" : "הוסף סימניה"}
                    >
                      <Bookmark className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isBookmarked ? "הסר סימניה" : "הוסף סימניה"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleHelp}
                      className={cn(
                        "h-8 w-8 p-0 rounded-full transition-colors",
                        showHelp
                          ? "text-blue-500 bg-blue-50"
                          : "text-gray-400 hover:bg-gray-100"
                      )}
                      aria-label={showHelp ? "הסתר עזרה" : "הצג עזרה"}
                    >
                      <HelpCircle className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showHelp ? "הסתר עזרה" : "הצג עזרה"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Question Text */}
          <motion.div variants={contentVariants} className="relative">
            <div className="text-lg font-medium mt-2">{question.question}</div>

            {/* רמז קריאה למשתמשים לשאלות טקסט פתוח */}
            {question.type === "openText" && !isMobile && (
              <div className="absolute -right-4 -bottom-4 text-gray-400">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0 rounded-full text-blue-500 opacity-70 hover:opacity-100",
                    "flex items-center justify-center"
                  )}
                  onClick={() => setShowHint(!showHint)}
                >
                  <Lightbulb className="h-4 w-4" />
                </Button>
              </div>
            )}
          </motion.div>
        </CardHeader>

        {/* Content Section */}
        <CardContent className="relative pt-2 space-y-4">
          {/* Tips for writing */}
          <AnimatePresence>
            {showHint && question.type === "openText" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-blue-50 p-3 rounded-md border border-blue-100 mb-3"
              >
                <div className="flex items-start">
                  <MessageCircle className="h-4 w-4 text-blue-500 mt-0.5 ml-2 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">טיפים לכתיבה:</p>
                    <ul className="list-disc mr-4 space-y-1 text-xs">
                      <li>התמקד/י בדוגמאות ספציפיות</li>
                      <li>שתף/י תחושות ומחשבות אישיות</li>
                      <li>הדגש/י את הנקודות החשובות עבורך ביותר</li>
                    </ul>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-6 w-6 ml-1 text-blue-500"
                    onClick={() => setShowHint(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Description if exists */}
          {question.description && (
            <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
              <p className="text-sm text-gray-600 flex items-start">
                <Info className="inline-block h-4 w-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
                <span>{question.description}</span>
              </p>
            </div>
          )}

          {/* Help Text when shown */}
          <AnimatePresence>
            {showHelp && question.metadata?.helpText && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Alert className="bg-blue-50 border-blue-200">
                  <CornerRightDown className="h-4 w-4 text-blue-500 mr-2" />
                  <AlertDescription className="text-sm text-blue-700">
                    {question.metadata.helpText}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Validation Error */}
          <AnimatePresence>
            {validationError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertDescription className="text-sm">
                    {validationError}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Required Indicator */}
          {isRequired && (
            <div className="text-xs text-red-500 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              שאלת חובה
            </div>
          )}

          {/* Answer Component */}
          <div className="mt-4">
            <motion.div variants={contentVariants} className="relative">
              {children}
            </motion.div>
          </div>
        </CardContent>

        {/* Footer Section */}
        <CardFooter className="flex justify-between items-center pt-4 border-t border-gray-100 bg-gray-50/50">
          {renderFooter()}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
