// src/components/suggestions/feedback/DateFeedbackDialog.tsx
// Post-date feedback collection dialog

'use client';

import React, { useState } from 'react';
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { ExtendedMatchSuggestion } from '../../../types/suggestions';

// =============================================================================
// Types
// =============================================================================
export interface DateFeedbackData {
  suggestionId: string;
  overallRating: number; // 1-5
  connectionFelt: boolean;
  likedAspects: string[];
  improvementAreas: string[];
  wantSecondDate: 'yes' | 'maybe' | 'no';
  freeText: string;
}

interface DateFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestion: ExtendedMatchSuggestion | null;
  userId?: string;
  locale: 'he' | 'en';
  onSubmit: (feedback: DateFeedbackData) => Promise<void>;
}

// =============================================================================
// Constants
// =============================================================================
const TEXTS = {
  he: {
    title: 'איך היה הדייט?',
    subtitle: 'הפידבק שלך עוזר לנו לשפר את ההצעות הבאות',
    step1Title: 'דירוג כללי',
    step1Subtitle: 'איך הרגשת בדייט?',
    step2Title: 'חיבור',
    step2Subtitle: 'הרגשת חיבור?',
    step3Title: 'מה אהבת?',
    step3Subtitle: 'בחר/י מה בלט לטובה',
    step4Title: 'דייט שני?',
    step4Subtitle: 'האם תרצה/י להמשיך?',
    connectionYes: 'כן, הרגשתי חיבור',
    connectionNo: 'לא ממש',
    ratingLabels: ['גרוע', 'לא טוב', 'בסדר', 'טוב', 'מעולה'],
    likedOptions: {
      conversation: 'שיחה זורמת',
      humor: 'חוש הומור',
      values: 'ערכים משותפים',
      appearance: 'מראה חיצוני',
      ambition: 'שאפתנות',
      warmth: 'חום אישי',
      intelligence: 'אינטליגנציה',
      chemistry: 'כימיה',
    },
    improvementOptions: {
      conversation: 'השיחה לא זרמה',
      values_gap: 'פער בערכים',
      no_chemistry: 'חסר כימיה',
      different_expectations: 'ציפיות שונות',
      appearance: 'המראה לא תאם',
      too_quiet: 'שקט/ה מדי',
      too_intense: 'אינטנסיבי/ת מדי',
    },
    secondDateYes: 'כן, בהחלט!',
    secondDateMaybe: 'אולי, צריך/ה לחשוב',
    secondDateNo: 'לא, לא מרגיש נכון',
    freeTextPlaceholder: 'רוצה להוסיף משהו? (אופציונלי)',
    next: 'הבא',
    back: 'חזרה',
    submit: 'שליחת פידבק',
    thankYou: 'תודה על הפידבק!',
    thankYouDesc: 'המידע הזה יעזור לנו לשפר את ההצעות הבאות שלך',
  },
  en: {
    title: 'How was the date?',
    subtitle: 'Your feedback helps us improve future suggestions',
    step1Title: 'Overall Rating',
    step1Subtitle: 'How did you feel about the date?',
    step2Title: 'Connection',
    step2Subtitle: 'Did you feel a connection?',
    step3Title: 'What did you like?',
    step3Subtitle: 'Select what stood out positively',
    step4Title: 'Second date?',
    step4Subtitle: 'Would you like to continue?',
    connectionYes: 'Yes, I felt a connection',
    connectionNo: 'Not really',
    ratingLabels: ['Bad', 'Not great', 'OK', 'Good', 'Excellent'],
    likedOptions: {
      conversation: 'Great conversation',
      humor: 'Sense of humor',
      values: 'Shared values',
      appearance: 'Appearance',
      ambition: 'Ambition',
      warmth: 'Personal warmth',
      intelligence: 'Intelligence',
      chemistry: 'Chemistry',
    },
    improvementOptions: {
      conversation: "Conversation didn't flow",
      values_gap: 'Values gap',
      no_chemistry: 'No chemistry',
      different_expectations: 'Different expectations',
      appearance: "Appearance didn't match",
      too_quiet: 'Too quiet',
      too_intense: 'Too intense',
    },
    secondDateYes: 'Yes, definitely!',
    secondDateMaybe: 'Maybe, need to think',
    secondDateNo: "No, it doesn't feel right",
    freeTextPlaceholder: 'Want to add something? (optional)',
    next: 'Next',
    back: 'Back',
    submit: 'Submit Feedback',
    thankYou: 'Thanks for your feedback!',
    thankYouDesc: "This information will help us improve your future suggestions",
  },
};

// =============================================================================
// Component
// =============================================================================
const DateFeedbackDialog: React.FC<DateFeedbackDialogProps> = ({
  open,
  onOpenChange,
  suggestion,
  userId: _userId,
  locale,
  onSubmit,
}) => {
  const t = TEXTS[locale];
  const isRtl = locale === 'he';

  const [step, setStep] = useState(1);
  const [rating, setRating] = useState(0);
  const [connectionFelt, setConnectionFelt] = useState<boolean | null>(null);
  const [likedAspects, setLikedAspects] = useState<string[]>([]);
  const [improvementAreas, setImprovementAreas] = useState<string[]>([]);
  const [wantSecondDate, setWantSecondDate] = useState<'yes' | 'maybe' | 'no' | null>(null);
  const [freeText, setFreeText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const totalSteps = 4;

  const toggleLiked = (key: string) => {
    setLikedAspects((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleImprovement = (key: string) => {
    setImprovementAreas((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return rating > 0;
      case 2:
        return connectionFelt !== null;
      case 3:
        return true; // Optional
      case 4:
        return wantSecondDate !== null;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!suggestion || !wantSecondDate) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        suggestionId: suggestion.id,
        overallRating: rating,
        connectionFelt: connectionFelt ?? false,
        likedAspects,
        improvementAreas,
        wantSecondDate,
        freeText,
      });
      setIsComplete(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset state
    setStep(1);
    setRating(0);
    setConnectionFelt(null);
    setLikedAspects([]);
    setImprovementAreas([]);
    setWantSecondDate(null);
    setFreeText('');
    setIsComplete(false);
    onOpenChange(false);
  };

  if (!suggestion) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md border-0 rounded-2xl shadow-2xl"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {isComplete ? (
          /* Thank you screen */
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-teal-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t.thankYou}</h3>
            <p className="text-gray-600 mb-6">{t.thankYouDesc}</p>
            <Button
              onClick={handleClose}
              className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl"
            >
              <CheckCircle className={cn('w-4 h-4', isRtl ? 'ml-2' : 'mr-2')} />
              {locale === 'he' ? 'סגור' : 'Close'}
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-center">
                {t.title}
              </DialogTitle>
              <DialogDescription className="text-center text-gray-500">
                {t.subtitle}
              </DialogDescription>
              {/* Progress bar */}
              <div className="flex gap-1.5 mt-3">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1.5 flex-1 rounded-full transition-colors',
                      i < step ? 'bg-teal-500' : 'bg-gray-200'
                    )}
                  />
                ))}
              </div>
            </DialogHeader>

            <div className="py-4 min-h-[250px]">
              {/* Step 1: Rating */}
              {step === 1 && (
                <div className="space-y-4">
                  <h4 className="text-center font-semibold text-gray-700">
                    {t.step1Subtitle}
                  </h4>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        onClick={() => setRating(val)}
                        className={cn(
                          'flex flex-col items-center gap-1 p-3 rounded-xl transition-all',
                          rating === val
                            ? 'bg-amber-100 border-2 border-amber-400 scale-110'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-amber-50'
                        )}
                      >
                        <Star
                          className={cn(
                            'w-8 h-8 transition-colors',
                            val <= rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-300'
                          )}
                        />
                        <span className="text-[10px] text-gray-500 font-medium">
                          {t.ratingLabels[val - 1]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Connection */}
              {step === 2 && (
                <div className="space-y-4">
                  <h4 className="text-center font-semibold text-gray-700">
                    {t.step2Subtitle}
                  </h4>
                  <div className="flex flex-col gap-3 max-w-xs mx-auto">
                    <button
                      onClick={() => setConnectionFelt(true)}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-start',
                        connectionFelt === true
                          ? 'bg-teal-50 border-teal-400'
                          : 'bg-white border-gray-200 hover:border-teal-200'
                      )}
                    >
                      <ThumbsUp
                        className={cn(
                          'w-6 h-6',
                          connectionFelt === true
                            ? 'text-teal-500'
                            : 'text-gray-400'
                        )}
                      />
                      <span className="font-medium">{t.connectionYes}</span>
                    </button>
                    <button
                      onClick={() => setConnectionFelt(false)}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-start',
                        connectionFelt === false
                          ? 'bg-rose-50 border-rose-400'
                          : 'bg-white border-gray-200 hover:border-rose-200'
                      )}
                    >
                      <ThumbsDown
                        className={cn(
                          'w-6 h-6',
                          connectionFelt === false
                            ? 'text-rose-500'
                            : 'text-gray-400'
                        )}
                      />
                      <span className="font-medium">{t.connectionNo}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Liked aspects + Improvement */}
              {step === 3 && (
                <div className="space-y-4">
                  <h4 className="text-center font-semibold text-gray-700">
                    {t.step3Subtitle}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(t.likedOptions).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => toggleLiked(key)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-medium border transition-all',
                          likedAspects.includes(key)
                            ? 'bg-teal-100 border-teal-300 text-teal-800'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {!connectionFelt && (
                    <>
                      <h4 className="text-center font-semibold text-gray-700 mt-4">
                        {locale === 'he' ? 'מה היה פחות?' : 'What was less ideal?'}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(t.improvementOptions).map(
                          ([key, label]) => (
                            <button
                              key={key}
                              onClick={() => toggleImprovement(key)}
                              className={cn(
                                'px-3 py-2 rounded-lg text-sm font-medium border transition-all',
                                improvementAreas.includes(key)
                                  ? 'bg-rose-100 border-rose-300 text-rose-800'
                                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                              )}
                            >
                              {label}
                            </button>
                          )
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 4: Second date + free text */}
              {step === 4 && (
                <div className="space-y-4">
                  <h4 className="text-center font-semibold text-gray-700">
                    {t.step4Subtitle}
                  </h4>
                  <div className="flex flex-col gap-2 max-w-xs mx-auto">
                    {[
                      { value: 'yes' as const, label: t.secondDateYes, color: 'teal' },
                      { value: 'maybe' as const, label: t.secondDateMaybe, color: 'amber' },
                      { value: 'no' as const, label: t.secondDateNo, color: 'rose' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setWantSecondDate(option.value)}
                        className={cn(
                          'px-4 py-3 rounded-xl border-2 text-start font-medium transition-all',
                          wantSecondDate === option.value
                            ? option.color === 'teal'
                              ? 'bg-teal-50 border-teal-400 text-teal-800'
                              : option.color === 'amber'
                                ? 'bg-amber-50 border-amber-400 text-amber-800'
                                : 'bg-rose-50 border-rose-400 text-rose-800'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <Textarea
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value)}
                    placeholder={t.freeTextPlaceholder}
                    className="mt-3 rounded-xl border-gray-200 resize-none"
                    rows={3}
                  />
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between gap-3">
              {step > 1 ? (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="rounded-xl"
                >
                  {isRtl ? (
                    <ChevronRight className="w-4 h-4 ml-1" />
                  ) : (
                    <ChevronLeft className="w-4 h-4 mr-1" />
                  )}
                  {t.back}
                </Button>
              ) : (
                <div />
              )}

              {step < totalSteps ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl"
                >
                  {t.next}
                  {isRtl ? (
                    <ChevronLeft className="w-4 h-4 mr-1" />
                  ) : (
                    <ChevronRight className="w-4 h-4 ml-1" />
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                  className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl"
                >
                  <Send className={cn('w-4 h-4', isRtl ? 'ml-2' : 'mr-2')} />
                  {t.submit}
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DateFeedbackDialog;
