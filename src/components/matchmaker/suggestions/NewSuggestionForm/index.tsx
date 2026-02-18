// src/app/components/matchmaker/suggestions/NewSuggestionForm/index.tsx

'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Priority, MatchSuggestionStatus } from '@prisma/client';
import { addDays } from 'date-fns';
import {
  UserPlus,
  Sparkles,
  Loader2,
  BarChart2,
  Users,
  Heart,
  ArrowRight,
  ArrowLeft,
  X,
  Gift,
  Check,
  Crown,
} from 'lucide-react';

// Types
import type { Candidate } from '../../new/types/candidates';
import { newSuggestionSchema, type NewSuggestionFormData } from './schema';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';

// Components
import SuggestionDetails from './SuggestionDetails';
import MatchPreview from './MatchPreview';
import CandidateSelector from './CandidateSelector';
import { AiMatchAnalysisDialog } from '../../new/dialogs/AiMatchAnalysisDialog';
import { cn } from '@/lib/utils';

// ── טיפוס הנתונים שמוחזרים ל-BulkSuggestionsDialog ──────────────────────────
export interface BulkSuggestionItemData {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  decisionDeadline: Date;
  firstPartyLanguage: 'he' | 'en';
  secondPartyLanguage: 'he' | 'en';
  notes?: {
    matchingReason?: string;
    forFirstParty?: string;
    forSecondParty?: string;
    internal?: string;
  };
}

interface NewSuggestionFormProps {
  locale: string;
  dict: MatchmakerPageDictionary;
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
  selectedCandidate?: Candidate | null;
  onSubmit: (data: NewSuggestionFormData) => Promise<void>;
  /** Pre-fills first party and locks it (for bulk mode) */
  prefilledFirstParty?: Candidate | null;
  /** Pre-fills second party and locks it (for bulk mode) */
  prefilledSecondParty?: Candidate | null;
  /**
   * כשמוגדר true, כפתור ה"שמור" לא שולח ל-API אלא קורא ל-onDraftSave
   * ומאפשר ל-BulkSuggestionsDialog לשמור את הנתונים ב-state.
   */
  isBulkMode?: boolean;
  onDraftSave?: (data: BulkSuggestionItemData) => void;
}

const StepIndicator: React.FC<{
  currentStep: number;
  steps: Array<{ label: string; icon: React.ElementType }>;
}> = ({ currentStep, steps }) => (
  <div className="flex items-center justify-center">
    {steps.map((step, index) => {
      const isActive = index === currentStep;
      const isCompleted = index < currentStep;
      const StepIcon = step.icon;

      return (
        <React.Fragment key={index}>
          <div className="flex flex-col items-center text-center">
            <div
              className={cn(
                'flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 shadow-md',
                isActive &&
                  'bg-gradient-to-r from-purple-600 to-pink-600 text-white scale-110 shadow-lg',
                isCompleted &&
                  'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
                !isActive && !isCompleted && 'bg-gray-200 text-gray-500'
              )}
            >
              {isCompleted ? (
                <Check className="w-6 h-6" />
              ) : (
                <StepIcon className="w-6 h-6" />
              )}
            </div>
            <p
              className={cn(
                'mt-2 text-xs font-semibold w-24',
                isActive && 'text-purple-600',
                isCompleted && 'text-green-600',
                !isActive && !isCompleted && 'text-gray-500'
              )}
            >
              {step.label}
            </p>
          </div>

          {index < steps.length - 1 && (
            <div
              className={cn(
                'w-16 h-1 mx-2 rounded-full transition-colors duration-300',
                isCompleted ? 'bg-green-500' : 'bg-gray-200'
              )}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

const NewSuggestionForm: React.FC<NewSuggestionFormProps> = ({
  dict,
  isOpen,
  onClose,
  candidates,
  selectedCandidate,
  locale,
  onSubmit,
  prefilledFirstParty,
  prefilledSecondParty,
  isBulkMode = false,
  onDraftSave,
}) => {
  const formDict = dict.suggestionsDashboard.newSuggestionForm;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firstParty, setFirstParty] = useState<Candidate | null>(null);
  const [secondParty, setSecondParty] = useState<Candidate | null>(null);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // ── Pre-fill מ-props בעת bulk mode ──────────────────────────────────────────
  useEffect(() => {
    if (prefilledFirstParty) {
      setFirstParty(prefilledFirstParty);
    }
  }, [prefilledFirstParty]);

  useEffect(() => {
    if (prefilledSecondParty) {
      setSecondParty(prefilledSecondParty);
    }
  }, [prefilledSecondParty]);

  const steps = [
    { label: formDict.steps.select.label, icon: Users },
    { label: formDict.steps.analyze.label, icon: BarChart2 },
    { label: formDict.steps.details.label, icon: Heart },
  ];

  const form = useForm<NewSuggestionFormData>({
    resolver: zodResolver(newSuggestionSchema),
    defaultValues: {
      priority: Priority.MEDIUM,
      status: MatchSuggestionStatus.DRAFT,
      decisionDeadline: new Date(new Date().setDate(new Date().getDate() + 14)),
    },
  });

 useEffect(() => {
  if (isOpen) {
    const initialFirst = prefilledFirstParty ?? selectedCandidate ?? null;
    const initialSecond = prefilledSecondParty ?? null;
    form.reset({
      priority: Priority.MEDIUM,
      status: MatchSuggestionStatus.DRAFT,
      decisionDeadline: new Date(new Date().setDate(new Date().getDate() + 14)),
      firstPartyId: initialFirst?.id || '',
      secondPartyId: initialSecond?.id || '',
    });
    setFirstParty(initialFirst);
    setSecondParty(initialSecond);
    setCurrentStep(0);
  }
}, [isOpen, selectedCandidate, prefilledFirstParty, prefilledSecondParty, form]);


  const handleCandidateSelect =
    (type: 'first' | 'second') => (candidate: Candidate | null) => {
      const setter = type === 'first' ? setFirstParty : setSecondParty;
      const fieldName = type === 'first' ? 'firstPartyId' : 'secondPartyId';
      setter(candidate);
      form.setValue(fieldName, candidate?.id || '', {
        shouldValidate: true,
        shouldDirty: true,
      });
    };

  const handleNext = () => {
    if (currentStep === 0 && (!firstParty || !secondParty)) {
      toast.error(formDict.toasts.selectParties);
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!firstParty || !secondParty) {
      toast.error(formDict.toasts.selectParties);
      return;
    }

    // ── Bulk mode: שמור ב-state במקום לשלוח ל-API ────────────────────────────
    if (isBulkMode && onDraftSave) {
      onDraftSave({
        priority: data.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
        decisionDeadline: data.decisionDeadline,
        firstPartyLanguage: (data as any).firstPartyLanguage ?? 'he',
        secondPartyLanguage: (data as any).secondPartyLanguage ?? 'he',
        notes: {
          matchingReason: (data as any).matchingReason,
          forFirstParty: (data as any).firstPartyNotes,
          forSecondParty: (data as any).secondPartyNotes,
          internal: (data as any).internalNotes,
        },
      });
      return; // מפסיק לפני שליחה ל-API
    }

    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast.success(formDict.toasts.createSuccess, {
        duration: 5000,
      });
      onClose();
    } catch (error) {
      toast.error(
        `${formDict.toasts.createError}: ${error instanceof Error ? error.message : ''}`
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  const maleCandidates = candidates.filter((c) => c.profile.gender === 'MALE');
  const femaleCandidates = candidates.filter(
    (c) => c.profile.gender === 'FEMALE'
  );

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 0:
        return firstParty && secondParty;
      case 1:
        return firstParty && secondParty;
      case 2:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <CandidateSelector
              dict={formDict.candidateSelector}
              label={formDict.party1Label}
              value={firstParty}
              onChange={handleCandidateSelect('first')}
              candidates={maleCandidates}
              otherParty={secondParty}
              fieldName="firstPartyId"
              error={form.formState.errors.firstPartyId?.message}
              disabled={isBulkMode && !!prefilledFirstParty}
            />
            <CandidateSelector
              dict={formDict.candidateSelector}
              label={formDict.party2Label}
              value={secondParty}
              onChange={handleCandidateSelect('second')}
              candidates={femaleCandidates}
              otherParty={firstParty}
              fieldName="secondPartyId"
              error={form.formState.errors.secondPartyId?.message}
              disabled={isBulkMode && !!prefilledSecondParty}
            />
          </div>
        );

      case 1:
        if (!firstParty || !secondParty) {
          return (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <Users className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <p className="text-lg font-medium">
                  {formDict.emptyState.title}
                </p>
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-8">
            <MatchPreview
              dict={formDict.matchPreview}
              firstParty={firstParty}
              secondParty={secondParty}
            />
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAnalysisDialog(true)}
                className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 text-indigo-700 hover:bg-gradient-to-r hover:from-indigo-100 hover:to-purple-100 hover:border-indigo-300 rounded-2xl px-8 py-4 font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <BarChart2 className="w-6 h-6 ml-3" />
                {formDict.buttons.fullAnalysis}
                <Sparkles className="w-5 h-5 mr-2 text-purple-500" />
              </Button>
            </div>
          </div>
        );

      case 2:
        if (!firstParty || !secondParty) {
          return (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <Users className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <p className="text-lg font-medium">
                  {formDict.emptyState.title}
                </p>
              </div>
            </div>
          );
        }
        return (
          <SuggestionDetails
            dict={formDict.suggestionDetails}
            firstParty={firstParty}
            secondParty={secondParty}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="max-w-7xl w-full h-[95vh] flex flex-col p-0 border-0 shadow-2xl rounded-3xl bg-gray-50"
          dir="rtl"
        >
          <div className="relative border-b p-4 flex-shrink-0 bg-white">
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                  <UserPlus className="w-8 h-8" />
                </div>
                <div className="text-right">
                  <DialogTitle className="text-2xl font-bold text-gray-800">
                    {formDict.header.title}
                  </DialogTitle>
                  <DialogDescription className="text-md text-gray-500 mt-1">
                    {formDict.header.description
                      .replace('{{current}}', (currentStep + 1).toString())
                      .replace('{{total}}', steps.length.toString())
                      .replace('{{label}}', steps[currentStep].label)}
                  </DialogDescription>
                </div>
              </div>

              <div className="flex-1 flex justify-center">
                <StepIndicator currentStep={currentStep} steps={steps} />
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full h-10 w-10 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-gradient-to-br from-white via-purple-50/20 to-pink-50/20">
            <FormProvider {...form}>
              <form onSubmit={handleSubmit} className="h-full">
                <div className="animate-fade-in-up">{renderStepContent()}</div>
              </form>
            </FormProvider>
          </div>

          <div className="border-t bg-white p-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentStep > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    className="px-6 py-3 border-2 border-gray-300 hover:bg-gray-50 rounded-xl transition-all duration-300 font-bold"
                  >
                    <ArrowRight className="w-5 h-5 ml-2" />
                    {formDict.buttons.back}
                  </Button>
                )}
                {currentStep < steps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceedToNextStep()}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formDict.buttons.continue}
                    <ArrowLeft className="w-5 h-5 mr-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !firstParty || !secondParty}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                        {formDict.buttons.creating}
                      </>
                    ) : (
                      <>
                        <Gift className="w-5 h-5 ml-2" />
                        {isBulkMode ? 'שמור טיוטה' : formDict.buttons.create}
                        <Sparkles className="w-4 h-4 mr-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <Crown className="w-4 h-4 text-purple-500" />
                <span>{formDict.footer.info}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {firstParty && secondParty && (
        <AiMatchAnalysisDialog
          isOpen={showAnalysisDialog}
          onClose={() => setShowAnalysisDialog(false)}
          targetCandidate={firstParty}
          comparisonCandidates={[secondParty]}
          dict={dict.candidatesManager.aiAnalysis}
          locale={locale}
        />
      )}
    </>
  );
};

export default NewSuggestionForm;