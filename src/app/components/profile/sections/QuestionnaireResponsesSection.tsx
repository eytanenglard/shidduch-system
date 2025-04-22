// src/app/components/profile/sections/QuestionnaireResponsesSection.tsx

import React, { useState, useMemo } from "react"; // Added useMemo
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
  Book, // Kept Book for empty state
  CheckCircle,
  Clock,
  Pencil,
  X,
  Eye,
  EyeOff,
  Loader2, // Added Loader2 for spinner
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
  UpdateValue, // Ensure this type is correctly defined and imported
} from "@/types/next-auth"; // Adjusted import path based on provided structure

// Import WORLDS from constants instead of defining locally
import { WORLDS } from "../constants"; // Adjusted import path

// Interface remains the same
interface QuestionnaireResponsesSectionProps {
  questionnaire: QuestionnaireResponse | null;
  onUpdate?: (
    world: string,
    questionId: string,
    value: UpdateValue
  ) => Promise<void>;
  isEditable?: boolean;
  viewMode?: "matchmaker" | "candidate"; // Keep viewMode if needed later for conditional logic
}

// --- QuestionCard Component ---
// Enhanced with loading state and improved accessibility

interface QuestionCardProps {
  question: string;
  answer: FormattedAnswer;
  isEditingGlobally: boolean; // Renamed from isEditing for clarity
  worldKey: string; // Added worldKey for update context
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

  const isSaving = isSavingText || isSavingVisibility; // Combined saving state

  const handleStartEdit = () => {
    if (isSaving) return; // Prevent editing while saving
    setIsEditingText(true);
    setEditValue(answer.displayText); // Reset edit value on start
  };

  const handleSaveText = async () => {
    if (!editValue?.trim()) {
      toast.error("לא ניתן לשמור תשובה ריקה.");
      return;
    }
    if (editValue.trim() === answer.displayText) {
      // No changes made
      setIsEditingText(false);
      return;
    }

    setIsSavingText(true);
    try {
      // console.log("Updating answer:", { worldKey, questionId: answer.questionId, value: editValue.trim() });
      await onUpdate(worldKey, answer.questionId, {
        type: "answer",
        value: editValue.trim(),
      });
      toast.success("התשובה עודכנה בהצלחה");
      setIsEditingText(false);
      // No need to update local state 'answer', parent should provide updated 'questionnaire' prop
    } catch (error) {
      console.error("Error updating answer:", error);
      toast.error("שגיאה בעדכון התשובה");
    } finally {
      setIsSavingText(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingText(false);
    setEditValue(answer.displayText); // Revert changes
  };

  const handleVisibilityChange = async (isVisible: boolean) => {
    setIsSavingVisibility(true);
    try {
      // console.log("Updating visibility:", { worldKey, questionId: answer.questionId, isVisible });
      await onUpdate(worldKey, answer.questionId, {
        type: "visibility",
        isVisible,
      });
      toast.success("הגדרות הנראות עודכנו");
    } catch (error) {
      console.error("Error updating visibility:", error);
      toast.error("שגיאה בעדכון הנראות");
    } finally {
      setIsSavingVisibility(false);
    }
  };

  const visibilityLabel = `הצג תשובה זו למועמדים: ${
    answer.isVisible ? "מופעל" : "כבוי"
  }`;

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm transition-shadow duration-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Question and Visibility Control */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
            <h4 className="font-medium text-sm sm:text-base flex-1 text-right">
              {question}
            </h4>
            {/* Visibility Section */}
            <div
              className="flex items-center gap-2 self-end sm:self-center"
              dir="ltr"
            >
              {isSavingVisibility && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {/* Tooltip for Visibility */}
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs shrink-0 flex-row-reverse",
                        "transition-colors duration-200",
                        answer.isVisible
                          ? "bg-emerald-100/70 text-emerald-800"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {answer.isVisible ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                      <span className="font-medium whitespace-nowrap" dir="rtl">
                        {answer.isVisible ? "גלוי למועמדים" : "מוסתר"}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" dir="rtl">
                    <p>
                      {answer.isVisible
                        ? "תשובה זו גלויה למועמדים פוטנציאליים"
                        : "תשובה זו מוסתרת וגלויה רק לך ולשדכנים"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Visibility Switch (only if globally editing) */}
              {isEditingGlobally && (
                <Switch
                  checked={answer.isVisible ?? true} // Default to visible if undefined
                  onCheckedChange={handleVisibilityChange}
                  disabled={isSaving} // Disable while saving anything
                  className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-gray-300 transform scale-90"
                  aria-label={visibilityLabel}
                />
              )}
            </div>
          </div>

          {/* Answer Display/Edit Area */}
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
                  disabled={isSavingText || !editValue?.trim()} // Also disable if empty
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
              {/* Answer Text */}
              <div className="p-3 bg-gray-50/50 rounded-md border border-gray-200/60 min-h-[40px]">
                <p className="text-sm text-gray-800 break-words overflow-wrap-anywhere whitespace-pre-wrap">
                  {answer.displayText}
                </p>
                {/* Last Updated Timestamp */}
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
              {/* Edit Button (appears on hover if globally editing) */}
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
              {/* Show loader if saving text and not in edit mode */}
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
// Mostly unchanged, passes props down correctly.

interface WorldSectionProps {
  worldKey: keyof typeof WORLDS; // Use key for context
  worldConfig: (typeof WORLDS)[keyof typeof WORLDS]; // Pass config object
  answers: FormattedAnswer[];
  isEditingGlobally: boolean; // Renamed for clarity
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

  // No need to check answers.length here, as this component will only be rendered if answers exist.

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
        {" "}
        {/* Dynamic border color */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-full",
                color.replace("text-", "bg-") + "/10" // Dynamic background based on color class
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
          {/* Completion Badge */}
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
        {/* Answers List */}
        <div className="space-y-4">
          {answers.map((answer) => (
            <QuestionCard
              key={answer.questionId}
              question={answer.question}
              answer={answer}
              isEditingGlobally={isEditingGlobally}
              worldKey={worldKey} // Pass worldKey
              onUpdate={onUpdate} // Pass update function
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// --- QuestionnaireResponsesSection Component ---
// Main component, handles overall structure and state.

const QuestionnaireResponsesSection: React.FC<
  QuestionnaireResponsesSectionProps
> = ({
  questionnaire,
  onUpdate,
  isEditable = false /*, viewMode = "candidate"*/,
}) => {
  const [isEditingGlobally, setIsEditingGlobally] = useState(false); // Renamed for clarity

  // Memoize filtered worlds to avoid recalculating on every render
  const worldsWithAnswers = useMemo(() => {
    if (!questionnaire?.formattedAnswers) return [];

    // Map WORLDS definitions, keeping only those with answers
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
      .filter((world) => world.answers.length > 0); // Filter out worlds with no answers
  }, [questionnaire]); // Recalculate only when questionnaire changes

  if (!questionnaire) {
    return (
      <Card className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
        <Book className="h-10 w-10 mx-auto mb-3 opacity-50 text-gray-400" />
        <p className="font-medium">לא מולא שאלון עבור פרופיל זה.</p>
        <p className="text-sm mt-1">אין תשובות להציג.</p>
      </Card>
    );
  }

  // Check if there are any answers at all across all worlds
  const hasAnyAnswers = worldsWithAnswers.length > 0;

  return (
    <div className="space-y-6">
      {/* Status Header */}
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

            {/* Edit Toggle Button */}
            {isEditable &&
              hasAnyAnswers &&
              onUpdate && ( // Show edit only if editable, has answers, and update fn exists
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingGlobally(!isEditingGlobally)}
                  className="gap-1.5 rounded-full px-4 py-2 text-xs sm:text-sm self-end sm:self-center"
                >
                  {isEditingGlobally ? (
                    <>
                      <X className="h-4 w-4" />
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
        </CardHeader>
      </Card>

      {/* Worlds Grid */}
      {hasAnyAnswers ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {worldsWithAnswers.map(({ key, config, answers, isCompleted }) => (
            <WorldSection
              key={key}
              worldKey={key}
              worldConfig={config}
              answers={answers}
              isEditingGlobally={isEditingGlobally}
              onUpdate={onUpdate!} // Assert non-null as we check onUpdate existence before rendering edit button
              isCompleted={isCompleted}
              // className prop is implicitly handled by cn in WorldSection now
            />
          ))}
        </div>
      ) : (
        // Display a message if questionnaire exists but has no answers yet
        <div className="text-center py-10 text-gray-500 bg-gray-50/50 rounded-lg border border-gray-200">
          <Book className="h-8 w-8 mx-auto mb-2 opacity-50 text-gray-400" />
          <p>השאלון טרם מולא.</p>
          <p className="text-sm mt-1">אין תשובות להציג כרגע.</p>
        </div>
      )}
    </div>
  );
};

export default QuestionnaireResponsesSection;
