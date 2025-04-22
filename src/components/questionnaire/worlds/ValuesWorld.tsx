// src/components/questionnaire/worlds/ValuesWorld.tsx
import React, { useState, useEffect } from "react"; // No longer need useState for index
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
  PanelLeftOpen,
  PanelRightOpen,
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
import { valuesQuestions } from "../questions/values/valuesQuestions"; // Make sure this path is correct
import { cn } from "@/lib/utils";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// --- Fetch questions for this world ---
const allQuestions = valuesQuestions;

export default function ValuesWorld({
  onAnswer,
  onComplete,
  onBack,
  answers,
  language = "he",
  // --- Receiving props from parent ---
  currentQuestionIndex,
  setCurrentQuestionIndex,
}: // -----------------------------------
WorldComponentProps) {
  // --- Local state for intro and validation, index state is removed ---
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [, setAnimateDirection] = useState<"left" | "right" | null>(null); // For animation direction
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isRTL = language === "he";
  const [isListVisible, setIsListVisible] = useState(true); // For desktop sidebar toggle

  // Effect for animation timing (uses the prop currentQuestionIndex now)
  useEffect(() => {
    const timer = setTimeout(() => setAnimateDirection(null), 300);
    return () => clearTimeout(timer);
  }, [currentQuestionIndex]); // Dependency is now the prop

  // --- Helper function to find answer value ---
  const findAnswer = (questionId: string) => {
    return answers.find((a) => a.questionId === questionId)?.value;
  };

  // --- Validation function (no changes needed here) ---
  const validateAnswer = (
    question: Question,
    value: AnswerValue
  ): string | null => {
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
    // No error if not required and empty
    if (!question.isRequired && isValueEmpty) {
      return null;
    }

    // Type-specific validations
    switch (question.type) {
      case "openText": {
        const textValue = value as string;
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
      case "multiChoice":
      case "multiSelectWithOther": {
        const selectedValues = value as string[] | undefined; // Allow undefined
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
        const allocationValue = value as Record<string, number> | undefined; // Allow undefined
        if (allocationValue) {
          const totalAllocated = Object.values(allocationValue).reduce(
            (sum, val) => sum + (val || 0),
            0
          );
          if (
            question.totalPoints &&
            totalAllocated !== question.totalPoints &&
            question.isRequired
          ) {
            if (totalAllocated < question.totalPoints) {
              return `יש להקצות בדיוק ${question.totalPoints} נקודות. חסרות ${
                question.totalPoints - totalAllocated
              } נקודות.`;
            } else {
              return `יש להקצות בדיוק ${
                question.totalPoints
              } נקודות. יש עודף של ${
                totalAllocated - question.totalPoints
              } נקודות.`;
            }
          }
        } else if (question.isRequired && !isValueEmpty) {
          // Handle case where budget is required but value is somehow invalid (though isValueEmpty should catch it)
          return "נדרשת הקצאת תקציב.";
        }
        break;
      }
      // Add other cases if needed (scale, ranking, etc.)
    }
    return null; // No error
  };

  // --- Navigation handlers using props ---
  const handleNext = () => {
    const currentQuestion = allQuestions[currentQuestionIndex];
    const value = findAnswer(currentQuestion.id);
    const error = validateAnswer(currentQuestion, value);

    if (error && currentQuestion.isRequired) {
      setValidationErrors({ ...validationErrors, [currentQuestion.id]: error });
      return; // Stop if required question has validation error
    }

    // Clear error for the current question if validation passes
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[currentQuestion.id];
      return newErrors;
    });

    if (currentQuestionIndex < allQuestions.length - 1) {
      setAnimateDirection("left");
      setCurrentQuestionIndex(currentQuestionIndex + 1); // Use prop function
    } else {
      // Last question, check all required questions in this world are answered
      const firstUnansweredRequired = allQuestions.find(
        (q) => q.isRequired && validateAnswer(q, findAnswer(q.id)) !== null // Check if validation fails (means unanswered/invalid)
      );

      if (firstUnansweredRequired) {
        // Find the index of the first unanswered required question
        const errorIndex = allQuestions.findIndex(
          (q) => q.id === firstUnansweredRequired.id
        );
        if (errorIndex !== -1) {
          setCurrentQuestionIndex(errorIndex); // Navigate to the first error
          setValidationErrors({
            ...validationErrors,
            [firstUnansweredRequired.id]:
              validateAnswer(
                firstUnansweredRequired,
                findAnswer(firstUnansweredRequired.id)
              ) || "נדרשת תשובה לשאלה זו",
          });
          // Optionally show a toast message here indicating required questions are missing
        }
      } else {
        onComplete(); // All good, complete the world
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setAnimateDirection("right");
      setCurrentQuestionIndex(currentQuestionIndex - 1); // Use prop function
    } else {
      onBack(); // Go back to the map or previous step
    }
  };

  // --- Clear answer handler ---
  const handleClearAnswer = () => {
    const currentQuestion = allQuestions[currentQuestionIndex];
    let emptyValue: AnswerValue;
    // Determine empty value based on question type
    switch (currentQuestion.type) {
      case "multiChoice":
      case "multiSelect":
      case "multiSelectWithOther":
        emptyValue = [];
        break;
      case "budgetAllocation":
        emptyValue = {};
        break;
      case "scale":
        emptyValue = undefined; // Or null, depending on preference
        break;
      default: // openText, singleChoice, etc.
        emptyValue = ""; // Or undefined/null
    }
    onAnswer(currentQuestion.id, emptyValue); // Call parent's onAnswer
    // Clear validation error for this question
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[currentQuestion.id];
      return newErrors;
    });
  };

  // --- Render Intro Screen ---
  if (!isIntroComplete) {
    return (
      <WorldIntro
        worldId="VALUES"
        title="עולם הערכים והאמונות"
        description="בואו נברר יחד מהם הערכים והעקרונות המנחים בחייך, מה חשוב לך במשפחה, בקהילה ובהשקפת העולם שלך."
        estimatedTime={35} // Update with actual estimate
        totalQuestions={allQuestions.length}
        requiredQuestions={allQuestions.filter((q) => q.isRequired).length}
        depths={["BASIC", "ADVANCED"]} // Adjust based on actual depths used
        onStart={() => setIsIntroComplete(true)}
      />
    );
  }

  // --- Handle Loading Error ---
  if (allQuestions.length === 0) {
    return (
      <div className="p-4 bg-red-50 rounded-lg border border-red-300 text-red-800 text-center">
        <h3 className="font-bold text-lg mb-2">שגיאה בטעינת השאלות</h3>
        <p>לא ניתן היה לטעון את השאלות עבור עולם זה.</p>
        <p>אנא נסה לרענן את הדף או לחזור מאוחר יותר.</p>
        <Button className="mt-4" variant="outline" onClick={onBack}>
          חזרה למפה
        </Button>
      </div>
    );
  }

  // --- Get Current Question (using prop index) ---
  const currentQuestion = allQuestions[currentQuestionIndex];
  if (!currentQuestion) {
    // This should ideally not happen if index is managed correctly, but good to handle
    console.error(
      `Error: Invalid question index ${currentQuestionIndex} for ValuesWorld.`
    );
    // Attempt to recover or show error
    setCurrentQuestionIndex(0); // Reset to first question
    return (
      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-300 text-yellow-800 text-center">
        <p>אירעה שגיאה בטעינת השאלה. מחזיר לשאלה הראשונה...</p>
        <Button
          className="mt-2"
          variant="outline"
          onClick={() => setCurrentQuestionIndex(0)}
        >
          אישור
        </Button>
      </div>
    );
  }

  // --- Calculate Progress ---
  const progress = ((currentQuestionIndex + 1) / allQuestions.length) * 100;
  const currentValue = findAnswer(currentQuestion.id);
  const answeredQuestionsCount = allQuestions.filter((q) => {
    const answerValue = findAnswer(q.id);
    return (
      answerValue !== undefined &&
      answerValue !== null &&
      (typeof answerValue !== "string" || answerValue.trim() !== "") &&
      (!Array.isArray(answerValue) || answerValue.length > 0) &&
      (typeof answerValue !== "object" ||
        Array.isArray(answerValue) ||
        Object.keys(answerValue).length > 0)
    );
  }).length;

  const completionPercentage = Math.round(
    (answeredQuestionsCount / allQuestions.length) * 100
  );

  // --- Helper Components for Rendering ---

  // Renders the header section with progress and list button
  const renderHeader = (showSheetButton: boolean) => (
    <div className="bg-white p-3 rounded-lg shadow-sm border space-y-2 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">עולם הערכים והאמונות</h2>
          <div className="text-sm text-gray-500">
            שאלה {currentQuestionIndex + 1} מתוך {allQuestions.length}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Completion Percentage */}
          <div
            className={cn(
              "hidden sm:flex items-center text-sm",
              completionPercentage === 100 ? "text-green-600" : "text-gray-600"
            )}
          >
            <CheckCircle
              className={cn(
                "h-4 w-4 me-1",
                completionPercentage === 100
                  ? "text-green-500"
                  : "text-gray-400"
              )}
            />
            <span>{completionPercentage}% הושלם</span>
          </div>
          {/* Mobile/Sheet Button */}
          {showSheetButton && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">רשימת שאלות</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side={isRTL ? "left" : "right"}
                className="w-[300px] sm:w-[400px]"
              >
                <SheetHeader>
                  <SheetTitle>
                    <div className="flex items-center gap-2">
                      <ListChecks className="h-5 w-5 text-blue-600" />
                      <span>כל השאלות בעולם הערכים</span>
                    </div>
                  </SheetTitle>
                  <SheetDescription>
                    לחץ על שאלה כדי לעבור אליה ישירות.
                    {/* Legend */}
                    <div className="mt-3 pt-3 border-t space-y-1">
                      <div className="flex items-center text-xs text-gray-600">
                        <CheckCircle className="h-3 w-3 text-green-500 me-1.5" />
                        <span>הושלם</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-600">
                        <AlertCircle className="h-3 w-3 text-red-500 me-1.5" />
                        <span>חובה (לא נענה)</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-600">
                        <CircleDot className="h-3 w-3 text-gray-400 me-1.5" />
                        <span>לא נענה</span>
                      </div>
                    </div>
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-4">
                  <QuestionsList
                    allQuestions={allQuestions}
                    currentQuestionIndex={currentQuestionIndex} // Use prop
                    setCurrentQuestionIndex={setCurrentQuestionIndex} // Use prop
                    answers={answers}
                    language={language}
                    // Example: Pass function to close sheet on selection
                    // onClose={() => document.querySelector('[data-radix-sheet-close]')?.click()}
                  />
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );

  // Renders the main question card with animation
  const renderQuestionCard = () => (
    <motion.div
      className={cn("transition-opacity duration-300")}
      key={currentQuestionIndex} // Key ensures re-render on index change
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
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
            // Clear validation on change
            setValidationErrors((prev) => ({
              ...prev,
              [currentQuestion.id]: "",
            }));
            onAnswer(currentQuestion.id, value); // Pass to parent
          }}
          onClear={handleClearAnswer} // Use clear handler
          language={language}
          showValidation={!!validationErrors[currentQuestion.id]}
        />
      </QuestionCard>
    </motion.div>
  );

  // Renders the navigation buttons (Prev/Next/Finish)
  const renderNavigationButtons = () => (
    <div className="flex justify-between pt-4 mt-6 border-t">
      <Button
        variant="outline"
        onClick={handlePrevious}
        className="flex items-center gap-2"
      >
        <ArrowRight className="h-4 w-4" />
        <span>{currentQuestionIndex === 0 ? "חזור למפה" : "שאלה קודמת"}</span>
      </Button>
      {currentQuestionIndex < allQuestions.length - 1 ? (
        <Button
          variant="default"
          onClick={handleNext}
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
        >
          <span>שאלה הבאה</span>
          <ArrowLeft className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          onClick={handleNext}
          className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
        >
          <span>סיים עולם זה</span>
          <CheckCircle className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  // Renders the button to toggle the questions list sidebar on desktop
  const ListToggleButton = () => (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsListVisible(!isListVisible)}
            className="fixed top-[80px] z-30 bg-white/80 backdrop-blur-sm shadow-md hover:bg-gray-100 rounded-full w-10 h-10"
            style={isRTL ? { left: "1.5rem" } : { right: "1.5rem" }}
          >
            {isListVisible ? (
              isRTL ? (
                <PanelRightClose className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )
            ) : isRTL ? (
              <PanelRightOpen className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
            )}
            <span className="sr-only">
              {isListVisible ? "הסתר רשימה" : "הצג רשימה"}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side={isRTL ? "right" : "left"}>
          <p>{isListVisible ? "הסתר רשימת שאלות" : "הצג רשימת שאלות"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  // --- Conditional Layout Rendering ---
  if (isDesktop) {
    // --- Desktop Layout ---
    return (
      <div className="w-full relative" dir={isRTL ? "rtl" : "ltr"}>
        <ListToggleButton />
        {renderHeader(false)} {/* Header without sheet button */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            isListVisible ? "grid grid-cols-12 gap-8" : "flex justify-center"
          )}
        >
          {/* Main Question Area */}
          <div
            className={cn(
              "space-y-6",
              isListVisible
                ? "col-span-12 lg:col-span-7 xl:col-span-8"
                : "w-full max-w-4xl"
            )}
          >
            {renderQuestionCard()}
            {renderNavigationButtons()}
          </div>

          {/* Questions List Sidebar */}
          <AnimatePresence>
            {isListVisible && (
              <motion.div
                className="col-span-12 lg:col-span-5 xl:col-span-4"
                initial={{
                  opacity: 0,
                  width: 0,
                  marginInlineStart: isRTL ? "-2rem" : undefined,
                  marginInlineEnd: isRTL ? undefined : "-2rem",
                }}
                animate={{
                  opacity: 1,
                  width: "auto",
                  marginInlineStart: 0,
                  marginInlineEnd: 0,
                }}
                exit={{
                  opacity: 0,
                  width: 0,
                  marginInlineStart: isRTL ? "-2rem" : undefined,
                  marginInlineEnd: isRTL ? undefined : "-2rem",
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                layout // Animate layout changes for the sidebar itself
              >
                <Card className="sticky top-6 shadow-lg border border-gray-200 h-[calc(100vh-5rem)] overflow-hidden flex flex-col">
                  <CardHeader className="pb-3 pt-4 border-b bg-gray-50/50 flex-shrink-0">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                      <ListChecks className="h-5 w-5 text-blue-600" />
                      <span>שאלות בעולם זה</span>
                    </CardTitle>
                    {/* Legend */}
                    <div className="pt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <div className="flex items-center">
                        <CheckCircle className="h-3 w-3 text-green-500 me-1.5" />
                        <span>הושלם</span>
                      </div>
                      <div className="flex items-center">
                        <AlertCircle className="h-3 w-3 text-red-500 me-1.5" />
                        <span>חובה</span>
                      </div>
                      <div className="flex items-center">
                        <CircleDot className="h-3 w-3 text-gray-400 me-1.5" />
                        <span>לא נענה</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-2 flex-grow overflow-hidden">
                    <QuestionsList
                      allQuestions={allQuestions}
                      currentQuestionIndex={currentQuestionIndex} // Use prop
                      setCurrentQuestionIndex={setCurrentQuestionIndex} // Use prop
                      answers={answers}
                      language={language}
                      className="h-full" // Ensure list takes full height
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
    // --- Mobile Layout ---
    return (
      <div
        className="max-w-2xl mx-auto p-2 sm:p-4 space-y-6"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {renderHeader(true)} {/* Header with sheet button */}
        {renderQuestionCard()}
        {renderNavigationButtons()}
      </div>
    );
  }
}
