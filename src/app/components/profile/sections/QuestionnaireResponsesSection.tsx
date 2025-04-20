import React, { useState } from "react";
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
  Heart,
  Users,
  User,
  Scroll,
  Book,
  CheckCircle,
  Clock,
  Pencil,
  X,
  Eye,
  EyeOff,
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
} from "@/types/next-auth"; // ייבוא UpdateValue מ-next-auth.ts

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

const WORLDS = {
  values: {
    key: "values",
    title: "ערכים ואמונות",
    icon: Heart,
    color: "text-pink-500",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
  },
  personality: {
    key: "personality",
    title: "אישיות",
    icon: User,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  relationship: {
    key: "relationship",
    title: "זוגיות ומשפחה",
    icon: Users,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  religion: {
    key: "religion",
    title: "דת ומסורת",
    icon: Scroll,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
  },
  partner: {
    key: "partner",
    title: "העדפות בן/בת זוג",
    icon: Heart,
    color: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
} as const;

const QuestionCard = ({
  question,
  answer,
  isEditing,
  onEdit,
  onVisibilityChange,
}: {
  question: string;
  answer: FormattedAnswer;
  isEditing: boolean;
  onEdit: (value: string) => void;
  onVisibilityChange: (isVisible: boolean) => void;
}) => {
  const [editValue, setEditValue] = useState(answer.displayText);
  const [isEditing2, setIsEditing2] = useState(false);

  const handleStartEdit = () => {
    setIsEditing2(true);
    setEditValue(answer.displayText);
  };

  const handleSave = () => {
    onEdit(editValue);
    setIsEditing2(false);
  };

  const handleCancel = () => {
    setEditValue(answer.displayText);
    setIsEditing2(false);
  };

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-base">{question}</h4>
            <div className="flex items-center gap-2" dir="ltr">
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm shrink-0 flex-row-reverse",
                  answer.isVisible
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {answer.isVisible ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
                <span
                  className="text-xs font-medium whitespace-nowrap"
                  dir="rtl"
                >
                  {answer.isVisible ? "מוצג למועמדים" : "מוסתר"}
                </span>
                {isEditing && (
                  <Switch
                    checked={answer.isVisible ?? true}
                    onCheckedChange={onVisibilityChange}
                    className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/30"
                  />
                )}
              </div>
            </div>
          </div>

          {isEditing2 ? (
            <div className="space-y-2">
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="min-h-[100px]"
                placeholder="הקלד/י את תשובתך כאן..."
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 ml-1" />
                  ביטול
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <CheckCircle className="h-4 w-4 ml-1" />
                  שמירה
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative group overflow-hidden">
              <div className="p-3 bg-muted/30 rounded-md">
                <p className="text-sm break-words overflow-wrap-anywhere whitespace-pre-wrap">
                  {answer.displayText}
                </p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-muted-foreground block mt-2">
                        {answer.answeredAt}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent dir="rtl">
                      <p>תאריך עדכון אחרון</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleStartEdit}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const WorldSection = ({
  title,
  icon: Icon,
  answers,
  isEditing,
  onEdit,
  onVisibilityChange,
  isCompleted,
  className,
}: {
  title: string;
  icon: React.ElementType;
  answers: FormattedAnswer[];
  isEditing: boolean;
  onEdit: (questionId: string, value: string) => void;
  onVisibilityChange: (questionId: string, isVisible: boolean) => void;
  isCompleted: boolean;
  className?: string;
}) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "p-2 rounded-full",
                answers.length > 0 ? "bg-primary/10" : "bg-muted"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  answers.length > 0 ? "text-primary" : "text-muted-foreground"
                )}
              />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{answers.length} תשובות</CardDescription>
            </div>
          </div>
          {isCompleted && (
            <Badge variant="success" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              הושלם
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {answers.length > 0 ? (
          <div className="space-y-4">
            {answers.map((answer) => (
              <QuestionCard
                key={answer.questionId}
                question={answer.question}
                answer={answer}
                isEditing={isEditing}
                onEdit={(value) => onEdit(answer.questionId, value)}
                onVisibilityChange={(isVisible) =>
                  onVisibilityChange(answer.questionId, isVisible)
                }
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Book className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>אין תשובות בחלק זה</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const QuestionnaireResponsesSection: React.FC<
  QuestionnaireResponsesSectionProps
> = ({ questionnaire, onUpdate, isEditable = false }) => {
  const [isEditing, setIsEditing] = useState(false);

  if (!questionnaire) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        לא נמצא שאלון
      </div>
    );
  }

  const handleEdit = async (
    worldKey: string,
    questionId: string,
    value: string
  ) => {
    try {
      if (!value?.trim()) {
        toast.error("לא ניתן לשמור ערך ריק");
        return;
      }

      if (onUpdate) {
        console.log("Updating answer:", { worldKey, questionId, value });
        await onUpdate(worldKey, questionId, {
          type: "answer",
          value: value.trim(),
        });
        toast.success("התשובה עודכנה בהצלחה");
      }
    } catch (error) {
      console.error("Error updating answer:", error);
      toast.error("שגיאה בעדכון התשובה");
    }
  };

  const handleVisibilityChange = async (
    worldKey: string,
    questionId: string,
    isVisible: boolean
  ) => {
    try {
      if (onUpdate) {
        await onUpdate(worldKey, questionId, {
          type: "visibility",
          isVisible,
        });
        toast.success("הגדרות הנראות עודכנו בהצלחה");
      }
    } catch (error) {
      console.error("Error updating visibility:", error);
      toast.error("שגיאה בעדכון הגדרות הנראות");
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="flex items-center justify-between bg-card p-4 rounded-lg border">
        <div className="flex items-center gap-2">
          {questionnaire.completed ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <Clock className="h-5 w-5 text-blue-500" />
          )}
          <div>
            <p className="font-medium">
              {questionnaire.completed ? "שאלון הושלם" : "שאלון בתהליך"}
            </p>
            <p className="text-sm text-muted-foreground">
              עודכן לאחרונה:{" "}
              {new Date(questionnaire.lastSaved).toLocaleDateString("he-IL")}
            </p>
          </div>
        </div>

        {isEditable && (
          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            className="gap-2"
          >
            {isEditing ? (
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

      {/* Worlds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(WORLDS).map(([key, world]) => (
          <WorldSection
            key={key}
            title={world.title}
            icon={world.icon}
            answers={
              questionnaire.formattedAnswers?.[
                key as keyof typeof questionnaire.formattedAnswers
              ] ?? []
            }
            isEditing={isEditing}
            onEdit={(questionId, value) => handleEdit(key, questionId, value)}
            onVisibilityChange={(questionId, isVisible) =>
              handleVisibilityChange(key, questionId, isVisible)
            }
            isCompleted={
              questionnaire[
                `${key}Completed` as keyof QuestionnaireResponse
              ] as boolean
            }
            className={cn(world.bgColor, world.borderColor)}
          />
        ))}
      </div>
    </div>
  );
};

export default QuestionnaireResponsesSection;
