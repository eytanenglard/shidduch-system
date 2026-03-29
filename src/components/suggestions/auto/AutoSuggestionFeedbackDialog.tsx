// src/components/suggestions/auto/AutoSuggestionFeedbackDialog.tsx
// =============================================================================
// Feedback dialog for auto-suggestions - collects liked/missing traits
// 2-step flow for decline (liked → missing), 1-step for approve/interested
// =============================================================================

'use client';

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Sparkles, ArrowRight, ArrowLeft, Check, X, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { LIKED_TRAITS, MISSING_TRAITS } from '@/lib/services/autoSuggestionFeedbackService';

// =============================================================================
// TYPES
// =============================================================================

type Decision = 'APPROVED' | 'DECLINED' | 'INTERESTED';

interface AutoSuggestionFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestionId: string;
  decision: Decision;
  locale: 'he' | 'en';
  dict: {
    titleApprove: string;
    titleDeclineStep1: string;
    titleDeclineStep2: string;
    titleInterested: string;
    subtitleApprove: string;
    subtitleDeclineStep1: string;
    subtitleDeclineStep2: string;
    likedTraits: Record<string, string>;
    missingTraits: Record<string, string>;
    freeTextPlaceholder: string;
    missingFreeTextPlaceholder: string;
    selectAtLeastOne: string;
    next: string;
    back: string;
    submitApprove: string;
    submitDecline: string;
    submitInterested: string;
    thankYou: string;
    thankYouDesc: string;
    declineFeedbackNote?: string;
  };
  onSubmit: (feedbackData: FeedbackData) => Promise<void>;
}

export interface FeedbackData {
  decision: Decision;
  likedTraits: string[];
  likedFreeText?: string;
  missingTraits?: string[];
  missingFreeText?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

const AutoSuggestionFeedbackDialog: React.FC<AutoSuggestionFeedbackDialogProps> = ({
  open,
  onOpenChange,
  suggestionId,
  decision,
  locale,
  dict,
  onSubmit,
}) => {
  const isRtl = locale === 'he';
  const isDecline = decision === 'DECLINED';

  // State
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedLiked, setSelectedLiked] = useState<string[]>([]);
  const [likedFreeText, setLikedFreeText] = useState('');
  const [selectedMissing, setSelectedMissing] = useState<string[]>([]);
  const [missingFreeText, setMissingFreeText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showError, setShowError] = useState(false);

  // Reset state when dialog opens
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setStep(1);
        setSelectedLiked([]);
        setLikedFreeText('');
        setSelectedMissing([]);
        setMissingFreeText('');
        setShowError(false);
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  // Toggle trait selection
  const toggleLiked = (trait: string) => {
    setSelectedLiked((prev) =>
      prev.includes(trait) ? prev.filter((t) => t !== trait) : [...prev, trait]
    );
    setShowError(false);
  };

  const toggleMissing = (trait: string) => {
    setSelectedMissing((prev) =>
      prev.includes(trait) ? prev.filter((t) => t !== trait) : [...prev, trait]
    );
    setShowError(false);
  };

  // Handle next step (decline only)
  const handleNext = () => {
    setStep(2);
    setShowError(false);
  };

  // Handle submit
  const handleSubmit = async () => {
    // Validate: on decline step 2, must select at least one missing trait
    if (isDecline && step === 2 && selectedMissing.length === 0) {
      setShowError(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        decision,
        likedTraits: selectedLiked,
        likedFreeText: likedFreeText.trim() || undefined,
        missingTraits: isDecline ? selectedMissing : undefined,
        missingFreeText: isDecline ? missingFreeText.trim() || undefined : undefined,
      });

      toast.success(dict.thankYou, { description: dict.thankYouDesc });
      handleOpenChange(false);
    } catch {
      toast.error(isRtl ? 'שגיאה בשמירת הפידבק' : 'Error saving feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine title and subtitle
  const getTitle = () => {
    if (isDecline) return step === 1 ? dict.titleDeclineStep1 : dict.titleDeclineStep2;
    if (decision === 'INTERESTED') return dict.titleInterested;
    return dict.titleApprove;
  };

  const getSubtitle = () => {
    if (isDecline) return step === 1 ? dict.subtitleDeclineStep1 : dict.subtitleDeclineStep2;
    return dict.subtitleApprove;
  };

  // Submit button text
  const getSubmitText = () => {
    if (decision === 'APPROVED') return dict.submitApprove;
    if (decision === 'INTERESTED') return dict.submitInterested;
    return dict.submitDecline;
  };

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-md mx-auto"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-lg font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            {getSubtitle()}
          </DialogDescription>
          {/* Step indicator for decline */}
          {isDecline && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <div
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  step === 1 ? 'bg-violet-500 w-4' : 'bg-gray-300'
                )}
              />
              <div
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  step === 2 ? 'bg-violet-500 w-4' : 'bg-gray-300'
                )}
              />
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Step 1: Liked traits (always shown on step 1) */}
          {step === 1 && (
            <>
              <div className="flex flex-wrap gap-2 justify-center">
                {LIKED_TRAITS.map((trait) => (
                  <button
                    key={trait}
                    onClick={() => toggleLiked(trait)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border',
                      selectedLiked.includes(trait)
                        ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white border-transparent shadow-sm scale-[1.02]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:bg-violet-50'
                    )}
                  >
                    {dict.likedTraits[trait] || trait}
                  </button>
                ))}
              </div>
              <Textarea
                placeholder={dict.freeTextPlaceholder}
                value={likedFreeText}
                onChange={(e) => setLikedFreeText(e.target.value)}
                className="resize-none text-sm"
                rows={2}
                dir={isRtl ? 'rtl' : 'ltr'}
              />
            </>
          )}

          {/* Step 2: Missing traits (decline only) */}
          {step === 2 && isDecline && (
            <>
              {/* Importance note */}
              {dict.declineFeedbackNote && (
                <div className="flex items-start gap-2.5 px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    {dict.declineFeedbackNote}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-2 justify-center">
                {MISSING_TRAITS.map((trait) => (
                  <button
                    key={trait}
                    onClick={() => toggleMissing(trait)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border',
                      selectedMissing.includes(trait)
                        ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-transparent shadow-sm scale-[1.02]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300 hover:bg-rose-50'
                    )}
                  >
                    {dict.missingTraits[trait] || trait}
                  </button>
                ))}
              </div>
              {showError && (
                <p className="text-xs text-rose-500 text-center font-medium">
                  {dict.selectAtLeastOne}
                </p>
              )}
              <Textarea
                placeholder={dict.missingFreeTextPlaceholder}
                value={missingFreeText}
                onChange={(e) => setMissingFreeText(e.target.value)}
                className="resize-none text-sm"
                rows={2}
                dir={isRtl ? 'rtl' : 'ltr'}
              />
            </>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          {/* Back button on step 2 */}
          {isDecline && step === 2 && (
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1"
            >
              {isRtl ? <ArrowRight className="w-4 h-4 ml-1" /> : <ArrowLeft className="w-4 h-4 mr-1" />}
              {dict.back}
            </Button>
          )}

          {/* Next button on step 1 for decline */}
          {isDecline && step === 1 && (
            <Button
              onClick={handleNext}
              className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
            >
              {dict.next}
              {isRtl ? <ArrowLeft className="w-4 h-4 mr-1" /> : <ArrowRight className="w-4 h-4 ml-1" />}
            </Button>
          )}

          {/* Submit button */}
          {(!isDecline || step === 2) && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={cn(
                'flex-1 text-white',
                isDecline
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700'
                  : 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700'
              )}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isDecline ? (
                <X className={cn('w-4 h-4', isRtl ? 'ml-1' : 'mr-1')} />
              ) : (
                <Check className={cn('w-4 h-4', isRtl ? 'ml-1' : 'mr-1')} />
              )}
              {getSubmitText()}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AutoSuggestionFeedbackDialog;
