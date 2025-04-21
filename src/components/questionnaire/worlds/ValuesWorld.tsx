// src/components/questionnaire/worlds/ValuesWorld.tsx
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
import { valuesQuestions } from "../questions/values/valuesQuestions";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const allQuestions = valuesQuestions;

export default function ValuesWorld({
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
  const [, setAnimateDirection] = useState<
    "left" | "right" | null
  >(null);

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

  // פונקציית ולידציה (ללא שינוי)
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
    if (!question.isRequired && isValueEmpty) {
      return null;
    }

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
        const selectedValues = value as string[];
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
      case "budgetAllocation": {
        const allocationValue = value as Record<string, number>;
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
        }
        break;
      }
    }
    return null;
  };

  const handleNext = () => {
    console.log("handleNext called"); // בדיקה
    const currentQuestion = allQuestions[currentQuestionIndex];
    const value = findAnswer(currentQuestion.id);
    const error = validateAnswer(currentQuestion, value);

    if (error && currentQuestion.isRequired) {
      setValidationErrors({ ...validationErrors, [currentQuestion.id]: error });
      console.log("Validation error, returning");
      return;
    }
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[currentQuestion.id];
      return newErrors;
    });

    if (currentQuestionIndex < allQuestions.length - 1) {
      console.log("Going to next question");
      setAnimateDirection("left");
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      console.log("Completing world");
      onComplete();
    }
  };

  const handlePrevious = () => {
    console.log("handlePrevious called"); // בדיקה
    if (currentQuestionIndex > 0) {
      console.log("Going to previous question");
      setAnimateDirection("right");
      setCurrentQuestionIndex((prev) => prev - 1);
    } else {
      console.log("Going back");
      onBack();
    }
  };

  const handleClearAnswer = () => {
    // ... (קוד ניקוי תשובה ללא שינוי) ...
    const currentQuestion = allQuestions[currentQuestionIndex];
    let emptyValue: AnswerValue;
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
        emptyValue = undefined;
        break;
      default:
        emptyValue = "";
    }
    onAnswer(currentQuestion.id, emptyValue);
    setValidationErrors({ ...validationErrors, [currentQuestion.id]: "" });
  };

  // --- Render Intro ---
  if (!isIntroComplete) {
    // ... (קוד הצגת מבוא) ...
    return (
      <WorldIntro
        worldId="VALUES"
        title="עולם הערכים והאמונות"
        description="בואו נברר יחד מהם הערכים והעקרונות המנחים בחייך"
        estimatedTime={35}
        totalQuestions={allQuestions.length}
        requiredQuestions={allQuestions.filter((q) => q.isRequired).length}
        depths={["BASIC", "ADVANCED"]}
        onStart={() => setIsIntroComplete(true)}
      />
    );
  }

  // --- Handle Loading Error ---
  if (allQuestions.length === 0) {
    // ... (קוד טיפול בשגיאה) ...
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
  if (!currentQuestion) {
    // ... (קוד טיפול בשגיאה) ...
    return <div>שגיאה בטעינת השאלה הנוכחית.</div>;
  }

  // --- Calculate Progress ---
  // ... (קוד חישוב התקדמות ללא שינוי) ...
  const progress = ((currentQuestionIndex + 1) / allQuestions.length) * 100;
  const currentValue = findAnswer(currentQuestion.id);
  const answeredQuestionsCount = allQuestions.filter((q) =>
    answers.some((a) => {
      const val = a.value;
      return (
        a.questionId === q.id &&
        val !== undefined &&
        val !== null &&
        (typeof val === "string" ? val.trim() !== "" : true) &&
        (Array.isArray(val) ? val.length > 0 : true) &&
        (typeof val === "object" && !Array.isArray(val)
          ? Object.keys(val).length > 0
          : true)
      );
    })
  ).length;
  const completionPercentage = Math.round(
    (answeredQuestionsCount / allQuestions.length) * 100
  );

  // --- Helper Components for Rendering ---

  const renderHeader = (showSheetButton: boolean) => (
    <div className="bg-white p-3 rounded-lg shadow-sm border space-y-2 mb-6">
      {/* ... (קוד כותרת ללא שינוי) ... */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">עולם הערכים והאמונות</h2>
          <div className="text-sm text-gray-500">
            שאלה {currentQuestionIndex + 1} מתוך {allQuestions.length}
          </div>
        </div>
        <div className="flex items-center gap-2">
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
                    currentQuestionIndex={currentQuestionIndex}
                    setCurrentQuestionIndex={setCurrentQuestionIndex}
                    answers={answers}
                    language={language}
                    // Pass a function to close the sheet if needed
                    // onClose={() => ... }
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

  // *** שינוי: הוצאת כפתורי הניווט מחוץ לאזור האנימציה של השאלה ***
  const renderQuestionCard = () => (
    <motion.div
      className={cn(
        "transition-opacity duration-300" // רק אנימציית opacity
      )}
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
          onClear={handleClearAnswer}
          language={language}
          showValidation={!!validationErrors[currentQuestion.id]}
        />
      </QuestionCard>
    </motion.div>
  );

  const renderNavigationButtons = () => (
    <div className="flex justify-between pt-4 mt-6 border-t">
      {" "}
      {/* ללא אנימציה עוטפת */}
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
          onClick={handleNext} // ישירות על הכפתור
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
        >
          <span>שאלה הבאה</span>
          <ArrowLeft className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          onClick={handleNext} // ישירות על הכפתור
          className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
        >
          <span>סיים עולם זה</span>
          <CheckCircle className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  const ListToggleButton = () => (
    // ... (קוד כפתור הטוגל ללא שינוי) ...
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsListVisible(!isListVisible)}
            className="fixed top-[80px] z-30 bg-white/80 backdrop-blur-sm shadow-md hover:bg-gray-100 rounded-full w-10 h-10" // שינוי לעיגול
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
            </span>{" "}
            {/* טקסט לנגישות */}
          </Button>
        </TooltipTrigger>
        <TooltipContent side={isRTL ? "right" : "left"}>
          {" "}
          {/* שינוי כיוון ה-Tooltip */}
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
        {renderHeader(false)}

        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            isListVisible ? "grid grid-cols-12 gap-8" : "flex justify-center"
          )}
        >
          {/* Main Question Area */}
          <div // *** שינוי: div רגיל, ללא motion וללא layout ***
            className={cn(
              "space-y-6", // רק style בסיסי
              isListVisible
                ? "col-span-12 lg:col-span-7 xl:col-span-8"
                : "w-full max-w-4xl" // הגבלת רוחב כשממורכז
            )}
            // *** אין אנימציית layout ***
          >
            {renderQuestionCard()} {/* מכיל את האנימציה של השאלה עצמה */}
            {renderNavigationButtons()} {/* כפתורים מחוץ לאנימציה */}
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
                layout // Keep layout for sidebar animation
              >
                <Card className="sticky top-6 shadow-lg border border-gray-200 h-[calc(100vh-5rem)] overflow-hidden flex flex-col">
                  <CardHeader className="pb-3 pt-4 border-b bg-gray-50/50 flex-shrink-0">
                    {/* ... כותרת רשימה ... */}
                    <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                      <ListChecks className="h-5 w-5 text-blue-600" />
                      <span>שאלות בעולם זה</span>
                    </CardTitle>
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
                      currentQuestionIndex={currentQuestionIndex}
                      setCurrentQuestionIndex={setCurrentQuestionIndex}
                      answers={answers}
                      language={language}
                      className="h-full"
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
        {renderHeader(true)}
        {renderQuestionCard()}
        {renderNavigationButtons()}
      </div>
    );
  }
}
