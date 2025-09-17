// src/app/components/profile/sections/QuestionnaireResponsesSection.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// Textarea is no longer needed for editing here, but might be used elsewhere.
// Keeping it for now, but it can be removed if not used in other contexts.
import { Textarea } from '@/components/ui/textarea';
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
  ArrowLeft,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import BudgetDisplay from './BudgetDisplay';

import type {
  QuestionnaireResponse,
  FormattedAnswer,
  UpdateValue,
} from '@/types/next-auth';
import type { ProfilePageDictionary } from '@/types/dictionary';
import { WORLDS_CONFIG } from '../constants';

const QUESTIONNAIRE_URL = '/questionnaire';

interface QuestionnaireResponsesSectionProps {
  questionnaire: QuestionnaireResponse | null;
  onUpdate?: (
    world: string,
    questionId: string,
    value: UpdateValue
  ) => Promise<void>;
  isEditable?: boolean;
  dict: ProfilePageDictionary;
  locale: string;
}

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
  isFirstInList?: boolean;
  dict: ProfilePageDictionary;
  locale: string;
}

interface WorldSectionProps {
  worldKey: keyof typeof WORLDS_CONFIG;
  worldConfig: (typeof WORLDS_CONFIG)[keyof typeof WORLDS_CONFIG];
  answers: FormattedAnswer[];
  isEditingGlobally: boolean;
  onUpdate: (
    world: string,
    questionId: string,
    value: UpdateValue
  ) => Promise<void>;
  isCompleted: boolean;
  className?: string;
  dict: ProfilePageDictionary;
  locale: string;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  answer,
  isEditingGlobally,
  worldKey,
  onUpdate,
  dict,
  locale,
}) => {
  // --- START: שינויים ---
  // הסרת מצבים הקשורים לעריכת טקסט מקומית
  // const [isEditingText, setIsEditingText] = useState(false);
  // const [editValue, setEditValue] = useState(answer.displayText);
  // const [isSavingText, setIsSavingText] = useState(false);
  const [isSavingVisibility, setIsSavingVisibility] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentIsVisible, setCurrentIsVisible] = useState(
    answer.isVisible ?? true
  );
  // --- END: שינויים ---

  const direction = locale === 'he' ? 'rtl' : 'ltr';
  const t = dict.questionnaireSection.questionCard;

  useEffect(() => {
    setCurrentIsVisible(answer.isVisible ?? true);
  }, [answer.isVisible]);

  // --- START: שינויים ---
  // עדכון המשתנה isSaving כדי שיכלול רק את המצבים הרלוונטיים
  const isSaving = isSavingVisibility || isDeleting;
  // --- END: שינויים ---

  // --- START: שינויים ---
  // הסרת פונקציות הקשורות לעריכת טקסט מקומית
  /*
  const handleStartEdit = () => {
    if (isSaving) return;
    setIsEditingText(true);
    setEditValue(answer.displayText);
  };

  const handleSaveText = async () => {
    if (!editValue?.trim()) {
      toast.error(t.toasts.emptyAnswer);
      return;
    }
    if (editValue.trim() === answer.displayText) {
      setIsEditingText(false);
      return;
    }

    setIsSavingText(true);
    try {
      await onUpdate(worldKey, answer.questionId, {
        type: 'answer',
        value: editValue.trim(),
      });
      toast.success(t.toasts.updateSuccess);
      setIsEditingText(false);
    } catch (error) {
      console.error('Error updating answer:', error);
      toast.error(t.toasts.updateError);
    } finally {
      setIsSavingText(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingText(false);
    setEditValue(answer.displayText);
  };
  */
  // --- END: שינויים ---

  const handleVisibilityChange = async (newIsVisibleState: boolean) => {
    setCurrentIsVisible(newIsVisibleState);
    setIsSavingVisibility(true);
    try {
      await onUpdate(worldKey, answer.questionId, {
        type: 'visibility',
        isVisible: newIsVisibleState,
      });
      toast.success(t.toasts.visibilitySuccess);
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error(t.toasts.visibilityError);
      setCurrentIsVisible(answer.isVisible ?? true);
    } finally {
      setIsSavingVisibility(false);
    }
  };

  const handleDelete = async () => {
    if (isSaving) return;

    const isConfirmed = window.confirm(t.deleteConfirm.message);
    if (!isConfirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      await onUpdate(worldKey, answer.questionId, {
        type: 'delete',
      });
      toast.success(t.toasts.deleteSuccess);
    } catch (error) {
      console.error('Error deleting answer:', error);
      toast.error(t.toasts.deleteError);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderAnswerContent = () => {
    // --- START: התיקון המרכזי ---
    if (
      answer.questionType === 'budgetAllocation' &&
      typeof answer.rawValue === 'object' &&
      answer.rawValue !== null &&
      !Array.isArray(answer.rawValue)
    ) {
      // השרת כבר הכין לנו את הטקסט המתורגם ב-displayText.
      // נשתמש בו ונוסיף את העיצוב הגרפי.
      const budgetData = answer.rawValue as Record<string, number>;

      // פיצול ה-displayText כדי לקבל את התוויות המתורגמות
      const displayItems = answer.displayText.split(' | ').map((item) => {
        const parts = item.split(': ');
        return { label: parts[0].trim(), value: parseInt(parts[1], 10) };
      });

      return (
        <div className="w-full space-y-3">
          {displayItems.map(({ label, value }) => (
            <div key={label}>
              <div className="flex justify-between items-center text-sm mb-1">
                <span className="text-gray-800 font-medium">{label}</span>
                <span className="text-gray-600 font-semibold">
                  {value}
                  {question.includes('%') ? '%' : ''}
                </span>
              </div>
              <Progress value={value} />
            </div>
          ))}
        </div>
      );
    }
    // --- END: התיקון המרכזי ---

    // הלוגיקה הקיימת לשאר סוגי השאלות נשארת זהה
    return (
      <p className="text-sm text-gray-800 break-words overflow-wrap-anywhere whitespace-pre-wrap">
        {answer.displayText}
      </p>
    );
  };
  const getVisibilityTooltip = () => {
    if (isEditingGlobally) {
      return currentIsVisible
        ? t.visibilityTooltip.editing.visible
        : t.visibilityTooltip.editing.hidden;
    }
    return currentIsVisible
      ? t.visibilityTooltip.viewing.visible
      : t.visibilityTooltip.viewing.hidden;
  };

  // --- START: שינויים ---
  // הגדרת ה-URL לעריכה שיהיה זהה לכל סוגי השאלות
  const editUrl = `/${locale}/questionnaire?world=${worldKey}&question=${answer.questionId}`;
  // בחירת טקסט גנרי עבור ה-Tooltip. אפשר להוסיף מפתח חדש ל-dictionary אם רוצים.
  const editTooltipText =
    answer.questionType === 'budgetAllocation'
      ? t.editTooltip.budget
      : t.editTooltip.text;
  // --- END: שינויים ---

  return (
    <div
      className="rounded-lg border bg-card p-4 shadow-sm transition-shadow duration-300 hover:shadow-md"
      dir={direction}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
            <h4 className="font-medium text-sm sm:text-base flex-1 text-start">
              {question}
            </h4>
            <div className="flex items-center gap-2 self-end sm:self-center">
              {isDeleting && (
                <Loader2 className="h-4 w-4 animate-spin text-red-500" />
              )}
              {isSavingVisibility && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={currentIsVisible}
                      disabled={!isEditingGlobally || isSaving}
                      onClick={() => handleVisibilityChange(!currentIsVisible)}
                      className={cn(
                        'inline-flex items-center justify-center h-8 px-3 rounded-full gap-2 transition-all duration-200 ease-in-out',
                        'disabled:opacity-100 disabled:cursor-default',
                        currentIsVisible
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-200 text-gray-600',
                        isEditingGlobally &&
                          !isSaving &&
                          'hover:shadow-md active:scale-95',
                        isEditingGlobally &&
                          !isSaving &&
                          currentIsVisible &&
                          'hover:bg-emerald-200',
                        isEditingGlobally &&
                          !isSaving &&
                          !currentIsVisible &&
                          'hover:bg-gray-300'
                      )}
                    >
                      {currentIsVisible ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                      <span className="text-xs font-medium whitespace-nowrap">
                        {currentIsVisible
                          ? t.visibilityButton.visible
                          : t.visibilityButton.hidden}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" dir={direction}>
                    <p>{getVisibilityTooltip()}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          {/* --- START: שינויים --- */}
          {/* הסרת ה-Conditional Rendering של עריכה מקומית */}
          <div className="relative group overflow-hidden mt-1">
            <div className="p-3 bg-gray-50/50 rounded-md border border-gray-200/60 min-h-[40px]">
              {renderAnswerContent()}
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-gray-400 block mt-2 text-start">
                      {new Date(answer.answeredAt).toLocaleDateString(
                        locale === 'he' ? 'he-IL' : 'en-US',
                        { year: 'numeric', month: '2-digit', day: '2-digit' }
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" dir={direction}>
                    <p>{t.dateTooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {isEditingGlobally && !isSaving && (
              // --- START: התיקון כאן ---
              <div className="absolute top-0 end-0 opacity-100 transition-opacity duration-200 flex items-center">
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:bg-red-50"
                        onClick={handleDelete}
                        disabled={isSaving}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">{t.editTooltip.delete}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" dir={direction}>
                      <p>{t.editTooltip.delete}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-cyan-600 hover:bg-cyan-50"
                      >
                        <a href={editUrl}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">{editTooltipText}</span>
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" dir={direction}>
                      <p>{editTooltipText}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
          {/* --- END: שינויים --- */}
        </div>
      </div>
    </div>
  );
};

// ... (שאר הרכיבים WorldSection ו-QuestionnaireResponsesSection נשארים ללא שינוי)

const WorldSection: React.FC<WorldSectionProps> = ({
  worldKey,
  worldConfig,
  answers,
  isEditingGlobally,
  onUpdate,
  isCompleted,
  className,
  dict,
  locale,
}) => {
  const { icon: Icon, color, bgColor, borderColor } = worldConfig;
  const t = dict.questionnaireSection.worldSection;
  const direction = locale === 'he' ? 'rtl' : 'ltr';

  const title = dict.questionnaireSection.worlds[worldKey]?.title || worldKey;
  const answerCountText = `${answers.length} ${
    answers.length === 1 ? t.answerSingular : t.answerPlural
  }`;

  return (
    <Card
      className={cn(
        'overflow-hidden shadow-sm border',
        bgColor,
        borderColor,
        className
      )}
      dir={direction}
    >
      <CardHeader
        className="p-4 border-b"
        style={{
          borderColor: `rgba(var(--${color.split('-')[1]}-200-rgb), 0.5)`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'p-2 rounded-full',
                color.replace('text-', 'bg-') + '/10'
              )}
            >
              <Icon className={cn('h-5 w-5', color)} />
            </div>
            <div>
              <CardTitle className="text-md sm:text-lg text-gray-800">
                {title}
              </CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-0.5">
                {answerCountText}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={isCompleted ? 'success' : 'secondary'}
            className={cn(
              'gap-1 text-xs px-2 py-0.5 rounded-full',
              isCompleted
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-blue-100 text-blue-800'
            )}
          >
            {isCompleted ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            {isCompleted ? t.status.completed : t.status.inProgress}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-4">
        <div className="space-y-4">
          {answers.map((answer, index) => (
            <QuestionCard
              key={answer.questionId}
              question={answer.question}
              answer={answer}
              isFirstInList={index === 0}
              isEditingGlobally={isEditingGlobally}
              worldKey={worldKey}
              onUpdate={onUpdate}
              dict={dict}
              locale={locale}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const QuestionnaireResponsesSection: React.FC<
  QuestionnaireResponsesSectionProps
> = ({ questionnaire, onUpdate, isEditable = false, dict, locale }) => {
  const [isEditingGlobally, setIsEditingGlobally] = useState(false);

  const direction = locale === 'he' ? 'rtl' : 'ltr';
  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const t = dict.questionnaireSection;

  const worldsWithAnswers = useMemo(() => {
    if (!questionnaire?.formattedAnswers) {
      console.log(
        '---[ CLIENT LOG | QuestionnaireResponsesSection useMemo ]--- אין "formattedAnswers". מחזיר מערך ריק.'
      );
      return [];
    }

    console.log(
      '---[ CLIENT LOG | QuestionnaireResponsesSection useMemo ]--- נמצא "formattedAnswers". מעבד את העולמות.'
    );

    return Object.entries(WORLDS_CONFIG)
      .map(([key, config]) => ({
        key: key as keyof typeof WORLDS_CONFIG,
        config,
        answers:
          questionnaire.formattedAnswers?.[
            key.toUpperCase() as keyof typeof questionnaire.formattedAnswers // ✨ התיקון: המרת המפתח לאותיות גדולות
          ] ?? [],
        isCompleted:
          (questionnaire[
            `${key.toLowerCase()}Completed` as keyof QuestionnaireResponse
          ] as boolean) ?? false,
      }))
      .filter((world) => world.answers.length > 0);
  }, [questionnaire]);

  if (!questionnaire) {
    const emptyStateT = t.emptyState;
    return (
      <Card
        className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed"
        dir={direction}
      >
        <Book className="h-10 w-10 mx-auto mb-3 opacity-50 text-gray-400" />
        <p className="font-medium">{emptyStateT.title}</p>
        <p className="text-sm mt-1">{emptyStateT.subtitle}</p>
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
              {emptyStateT.button} <ArrowIcon className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Card>
    );
  }

  const hasAnyAnswers = worldsWithAnswers.length > 0;
  const headerT = t.header;

  return (


    <div className="space-y-6" dir={direction}>
      <Card className="shadow-sm border">
        <CardHeader className="p-6 space-y-4">
          {/* שורה ראשונה - כותרת ומידע */}
          <div className="flex items-center gap-3">
            {questionnaire.completed ? (
              <CheckCircle className="h-6 w-6 text-emerald-500 flex-shrink-0" />
            ) : (
              <Clock className="h-6 w-6 text-blue-500 flex-shrink-0" />
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {questionnaire.completed
                  ? headerT.title.completed
                  : headerT.title.inProgress}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {hasAnyAnswers
                  ? `${headerT.lastUpdated}: ${new Date(
                      questionnaire.lastSaved
                    ).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US')}`
                  : headerT.notStarted}
              </p>
            </div>
          </div>

          {/* שורה שנייה - כפתורים */}
          <div className="flex items-center justify-center gap-3 pt-2 border-t border-gray-100">
            <Button asChild variant="outline" size="sm" className="h-9 px-4">
              <Link
                href={QUESTIONNAIRE_URL}
                className="flex items-center gap-2"
              >
                {headerT.goToButton}
                <ArrowIcon className="h-4 w-4" />
              </Link>
            </Button>

            {isEditable && hasAnyAnswers && onUpdate && (
              <Button
                variant={isEditingGlobally ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsEditingGlobally(!isEditingGlobally)}
                className="h-9 px-4 gap-2"
              >
                {isEditingGlobally ? (
                  <>
                    <Save className="h-4 w-4" />
                    {headerT.editButton.finish}
                  </>
                ) : (
                  <>
                    <Pencil className="h-4 w-4" />
                    {headerT.editButton.start}
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>
      {/* שאר הקוד נשאר זהה... */}
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
              dict={dict}
              locale={locale}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500 bg-gray-50/50 rounded-lg border border-gray-200">
          <Book className="h-8 w-8 mx-auto mb-2 opacity-50 text-gray-400" />
          <p className="font-medium text-lg">{t.noAnswersState.title}</p>
          <p className="text-sm mt-1 text-gray-600">
            {t.noAnswersState.subtitle}
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
                {t.noAnswersState.button} <ArrowIcon className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionnaireResponsesSection;
