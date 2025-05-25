// src/app/components/profile/sections/QuestionnaireResponsesSection.tsx

import React, { useState, useMemo, useEffect } from "react"; // Added useEffect
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Book,
  CheckCircle,
  Clock,
  Pencil,
  X,
  Save,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  QuestionnaireResponse,
  FormattedAnswer,
  UpdateValue,
} from "@/types/next-auth";

import { WORLDS } from "../constants";

// --- קבוע עבור כתובת השאלון ---
const QUESTIONNAIRE_URL = "/questionnaire"; // שימוש בנתיב יחסי אם האפליקציה רצה באותו דומיין
// אם אתה צריך את הכתובת המלאה (פחות מומלץ אם זה באותו אתר):
// const QUESTIONNAIRE_URL = "http://localhost:3000/questionnaire";

interface QuestionnaireResponsesSectionProps {
  questionnaire: QuestionnaireResponse | null;
  onUpdate?: (
    world: string,
    questionId: string,
    value: UpdateValue
  ) => Promise<void>;
  isEditable?: boolean;
  viewMode?: "matchmaker" | "candidate";
}

// --- QuestionCard Component ---
interface QuestionCardProps {
  question: string;
  answer: FormattedAnswer;
  isEditingGlobally: boolean;
  worldKey: string;
  onUpdate: (
    world: string,
    questionId: string,
    value: UpdateValue
  ) => Promise<void>;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  answer,
  isEditingGlobally,
  worldKey,
  onUpdate,
}) => {
  const [isEditingText, setIsEditingText] = useState(false);
  const [editValue, setEditValue] = useState(answer.displayText);
  const [isSavingText, setIsSavingText] = useState(false);
  const [isSavingVisibility, setIsSavingVisibility] = useState(false);

  // --- START OF MODIFIED SECTION ---
  // Local state for optimistic UI update of visibility
  const [currentIsVisible, setCurrentIsVisible] = useState(
    answer.isVisible ?? true
  );

  // Sync local state if the prop changes (e.g., due to parent update or initial load)
  useEffect(() => {
    setCurrentIsVisible(answer.isVisible ?? true);
  }, [answer.isVisible]);
  // --- END OF MODIFIED SECTION ---

  const isSaving = isSavingText || isSavingVisibility;

  const handleStartEdit = () => {
    if (isSaving) return;
    setIsEditingText(true);
    setEditValue(answer.displayText);
  };

  const handleSaveText = async () => {
    if (!editValue?.trim()) {
      toast.error("לא ניתן לשמור תשובה ריקה.");
      return;
    }
    if (editValue.trim() === answer.displayText) {
      setIsEditingText(false);
      return;
    }

    setIsSavingText(true);
    try {
      await onUpdate(worldKey, answer.questionId, {
        type: "answer",
        value: editValue.trim(),
      });
      toast.success("התשובה עודכנה בהצלחה");
      setIsEditingText(false);
      // No need to update editValue here, as parent will re-render with new answer prop
    } catch (error) {
      console.error("Error updating answer:", error);
      toast.error("שגיאה בעדכון התשובה");
    } finally {
      setIsSavingText(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingText(false);
    setEditValue(answer.displayText);
  };

  const handleVisibilityChange = async (newIsVisibleState: boolean) => {
    // --- START OF MODIFIED SECTION ---
    // Optimistically update the local UI state
    setCurrentIsVisible(newIsVisibleState);
    // --- END OF MODIFIED SECTION ---
    setIsSavingVisibility(true);
    try {
      await onUpdate(worldKey, answer.questionId, {
        type: "visibility",
        isVisible: newIsVisibleState,
      });
      toast.success("הגדרות הנראות עודכנו");
      // If successful, the parent should eventually re-render with the updated answer.isVisible,
      // and the useEffect will sync if needed, but currentIsVisible is already correct.
    } catch (error) {
      console.error("Error updating visibility:", error);
      toast.error("שגיאה בעדכון הנראות");
      // --- START OF MODIFIED SECTION ---
      // Revert optimistic update on error
      setCurrentIsVisible(answer.isVisible ?? true);
      // --- END OF MODIFIED SECTION ---
    } finally {
      setIsSavingVisibility(false);
    }
  };

  // --- START OF MODIFIED SECTION ---
  // Update visibilityLabel to use currentIsVisible
  const visibilityLabel = `הצג תשובה זו למועמדים: ${
    currentIsVisible ? "מופעל" : "כבוי"
  }`;
  // --- END OF MODIFIED SECTION ---

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm transition-shadow duration-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
            <h4 className="font-medium text-sm sm:text-base flex-1 text-right">
              {question}
            </h4>
            <div
              className="flex items-center gap-2 self-end sm:self-center"
              dir="ltr"
            >
              {isSavingVisibility && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs shrink-0 flex-row-reverse",
                        "transition-colors duration-200",
                        // --- START OF MODIFIED SECTION ---
                        currentIsVisible // Use currentIsVisible for styling
                          ? // --- END OF MODIFIED SECTION ---
                            "bg-emerald-100/70 text-emerald-800"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {/* --- START OF MODIFIED SECTION --- */}
                      {currentIsVisible ? ( // Use currentIsVisible for icon and text
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                      <span className="font-medium whitespace-nowrap" dir="rtl">
                        {currentIsVisible ? "גלוי למועמדים" : "מוסתר"}
                      </span>
                      {/* --- END OF MODIFIED SECTION --- */}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" dir="rtl">
                    <p>
                      {/* --- START OF MODIFIED SECTION --- */}
                      {currentIsVisible // Use currentIsVisible for tooltip content
                        ? // --- END OF MODIFIED SECTION ---
                          "תשובה זו גלויה למועמדים פוטנציאליים"
                        : "תשובה זו מוסתרת וגלויה רק לך ולשדכנים"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {isEditingGlobally && (
                <Switch
                  // --- START OF MODIFIED SECTION ---
                  checked={currentIsVisible} // Control Switch with local state
                  // --- END OF MODIFIED SECTION ---
                  onCheckedChange={handleVisibilityChange}
                  disabled={isSaving}
                  className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-gray-300 transform scale-90"
                  aria-label={visibilityLabel}
                />
              )}
            </div>
          </div>

          {isEditingText ? (
            <div className="space-y-2 mt-1">
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="min-h-[80px] text-sm focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="הקלד/י את תשובתך כאן..."
                disabled={isSavingText}
              />
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  disabled={isSavingText}
                  className="text-gray-600 hover:bg-gray-100"
                >
                  <X className="h-4 w-4 ml-1" />
                  ביטול
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveText}
                  disabled={isSavingText || !editValue?.trim()}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  {isSavingText ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 ml-1" />
                  )}
                  שמירה
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative group overflow-hidden mt-1">
              <div className="p-3 bg-gray-50/50 rounded-md border border-gray-200/60 min-h-[40px]">
                <p className="text-sm text-gray-800 break-words overflow-wrap-anywhere whitespace-pre-wrap">
                  {answer.displayText}
                </p>
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-gray-400 block mt-2 text-left">
                        {new Date(answer.answeredAt).toLocaleDateString(
                          "he-IL",
                          { year: "numeric", month: "2-digit", day: "2-digit" }
                        )}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" dir="rtl">
                      <p>תאריך עדכון אחרון</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {isEditingGlobally && !isSaving && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-7 w-7 text-cyan-600 hover:bg-cyan-50"
                  onClick={handleStartEdit}
                  title="עריכת תשובה"
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">עריכת תשובה</span>
                </Button>
              )}
              {isSavingText && !isEditingText && (
                <div className="absolute top-1 right-1">
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-500" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- WorldSection Component ---
// (ללא שינוי)
interface WorldSectionProps {
  worldKey: keyof typeof WORLDS;
  worldConfig: (typeof WORLDS)[keyof typeof WORLDS];
  answers: FormattedAnswer[];
  isEditingGlobally: boolean;
  onUpdate: (
    world: string,
    questionId: string,
    value: UpdateValue
  ) => Promise<void>;
  isCompleted: boolean;
  className?: string;
}

const WorldSection: React.FC<WorldSectionProps> = ({
  worldKey,
  worldConfig,
  answers,
  isEditingGlobally,
  onUpdate,
  isCompleted,
  className,
}) => {
  const { title, icon: Icon, color, bgColor, borderColor } = worldConfig;

  return (
    <Card
      className={cn(
        "overflow-hidden shadow-sm border",
        bgColor,
        borderColor,
        className
      )}
    >
      <CardHeader
        className="p-4 border-b"
        style={{
          borderColor: `rgba(var(--${color.split("-")[1]}-200-rgb), 0.5)`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-full",
                color.replace("text-", "bg-") + "/10"
              )}
            >
              <Icon className={cn("h-5 w-5", color)} />
            </div>
            <div>
              <CardTitle className="text-md sm:text-lg text-gray-800">
                {title}
              </CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-0.5">
                {answers.length} {answers.length === 1 ? "תשובה" : "תשובות"}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={isCompleted ? "success" : "secondary"}
            className={cn(
              "gap-1 text-xs px-2 py-0.5 rounded-full",
              isCompleted
                ? "bg-emerald-100 text-emerald-800"
                : "bg-blue-100 text-blue-800"
            )}
          >
            {isCompleted ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            {isCompleted ? "הושלם" : "בתהליך"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-4">
        <div className="space-y-4">
          {answers.map((answer) => (
            <QuestionCard
              key={answer.questionId}
              question={answer.question}
              answer={answer}
              isEditingGlobally={isEditingGlobally}
              worldKey={worldKey}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// --- QuestionnaireResponsesSection Component ---
const QuestionnaireResponsesSection: React.FC<
  QuestionnaireResponsesSectionProps
> = ({ questionnaire, onUpdate, isEditable = false }) => {
  const [isEditingGlobally, setIsEditingGlobally] = useState(false);

  const worldsWithAnswers = useMemo(() => {
    if (!questionnaire?.formattedAnswers) return [];
    return Object.entries(WORLDS)
      .map(([key, config]) => ({
        key: key as keyof typeof WORLDS,
        config,
        answers:
          questionnaire.formattedAnswers?.[
            key as keyof typeof questionnaire.formattedAnswers
          ] ?? [],
        isCompleted:
          (questionnaire[
            `${key}Completed` as keyof QuestionnaireResponse
          ] as boolean) ?? false,
      }))
      .filter((world) => world.answers.length > 0);
  }, [questionnaire]);

  if (!questionnaire) {
    return (
      <Card className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
        <Book className="h-10 w-10 mx-auto mb-3 opacity-50 text-gray-400" />
        <p className="font-medium">לא מולא שאלון עבור פרופיל זה.</p>
        <p className="text-sm mt-1">אין תשובות להציג.</p>
        <div className="mt-6">
          <Button
            asChild
            variant="default"
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Link
              href={QUESTIONNAIRE_URL}
              className="flex items-center gap-1.5"
            >
              מלא את השאלון
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Card>
    );
  }

  const hasAnyAnswers = worldsWithAnswers.length > 0;

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border">
        <CardHeader className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {questionnaire.completed ? (
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              ) : (
                <Clock className="h-5 w-5 text-blue-500 flex-shrink-0" />
              )}
              <div>
                <p className="font-semibold text-base text-gray-800">
                  {questionnaire.completed ? "שאלון הושלם" : "שאלון בתהליך"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {hasAnyAnswers
                    ? `עודכן לאחרונה: ${new Date(
                        questionnaire.lastSaved
                      ).toLocaleDateString("he-IL")}`
                    : "השאלון טרם החל"}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 self-end sm:self-center">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-full px-4 py-2 text-xs sm:text-sm"
              >
                <Link
                  href={QUESTIONNAIRE_URL}
                  className="flex items-center gap-1.5"
                >
                  עבור לשאלון
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {isEditable && hasAnyAnswers && onUpdate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingGlobally(!isEditingGlobally)}
                  className="gap-1.5 rounded-full px-4 py-2 text-xs sm:text-sm"
                >
                  {isEditingGlobally ? (
                    <>
                      <Save className="h-4 w-4" />
                      סיום עריכה
                    </>
                  ) : (
                    <>
                      <Pencil className="h-4 w-4" />
                      עריכת תשובות
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {hasAnyAnswers ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {worldsWithAnswers.map(({ key, config, answers, isCompleted }) => (
            <WorldSection
              key={key}
              worldKey={key}
              worldConfig={config}
              answers={answers}
              isEditingGlobally={isEditingGlobally}
              onUpdate={onUpdate!}
              isCompleted={isCompleted}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500 bg-gray-50/50 rounded-lg border border-gray-200">
          <Book className="h-8 w-8 mx-auto mb-2 opacity-50 text-gray-400" />
          <p className="font-medium text-lg">השאלון טרם מולא במלואו</p>
          <p className="text-sm mt-1 text-gray-600">
            עדיין אין תשובות להציג, אך ניתן להמשיך למלא את השאלון.
          </p>
          <div className="mt-6">
            <Button
              asChild
              variant="default"
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              <Link
                href={QUESTIONNAIRE_URL}
                className="flex items-center gap-1.5 px-6 py-2"
              >
                המשך מילוי השאלון
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionnaireResponsesSection;
