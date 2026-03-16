// src/components/questionnaire/pages/QuickProfileStep.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserProfile } from '../MatchmakingQuestionnaire';

interface QuickProfileStepProps {
  locale: 'he' | 'en';
  missingFields: ('religiousLevel' | 'maritalStatus' | 'birthDate')[];
  onComplete: (profile: Partial<UserProfile>) => void;
}

const RELIGIOUS_LEVELS_HE = [
  { value: 'charedi', label: 'חרדי/ת' },
  { value: 'charedi_lite', label: 'חרדי/ת מודרני/ת' },
  { value: 'dati', label: 'דתי/ה לאומי/ת' },
  { value: 'dati_lite', label: 'דתי/ה לייט' },
  { value: 'masorti', label: 'מסורתי/ת' },
  { value: 'hiloni', label: 'חילוני/ת' },
];

const RELIGIOUS_LEVELS_EN = [
  { value: 'charedi', label: 'Charedi' },
  { value: 'charedi_lite', label: 'Modern Charedi' },
  { value: 'dati', label: 'Dati Leumi (Religious Zionist)' },
  { value: 'dati_lite', label: 'Dati Lite' },
  { value: 'masorti', label: 'Masorti (Traditional)' },
  { value: 'hiloni', label: 'Hiloni (Secular)' },
];

const MARITAL_STATUS_HE = [
  { value: 'SINGLE', label: 'פרק א\'' },
  { value: 'DIVORCED', label: 'גרוש/ה' },
  { value: 'WIDOWED', label: 'אלמן/ה' },
];

const MARITAL_STATUS_EN = [
  { value: 'SINGLE', label: 'Never married' },
  { value: 'DIVORCED', label: 'Divorced' },
  { value: 'WIDOWED', label: 'Widowed' },
];

const currentYear = new Date().getFullYear();
const BIRTH_YEARS = Array.from({ length: 60 }, (_, i) => currentYear - 18 - i);

export default function QuickProfileStep({
  locale,
  missingFields,
  onComplete,
}: QuickProfileStepProps) {
  const isRTL = locale === 'he';
  const [step, setStep] = useState(0);
  const [collected, setCollected] = useState<Partial<UserProfile>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const PrevIcon = isRTL ? ArrowRight : ArrowLeft;
  const NextIcon = isRTL ? ArrowLeft : ArrowRight;

  const field = missingFields[step];

  const select = (key: keyof UserProfile, value: string) => {
    setCollected((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = async () => {
    if (step < missingFields.length - 1) {
      setStep((s) => s + 1);
    } else {
      // Last step — save and proceed
      setIsSubmitting(true);
      try {
        const payload: Record<string, unknown> = {};
        if (collected.religiousLevel) payload.religiousLevel = collected.religiousLevel;
        if (collected.maritalStatus) payload.maritalStatus = collected.maritalStatus;
        if (collected.birthDate) payload.birthDate = new Date(`${collected.birthDate}-01-01`).toISOString();

        if (Object.keys(payload).length > 0) {
          await fetch('/api/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }
      } catch (e) {
        console.error('[QuickProfileStep] save failed:', e);
      } finally {
        setIsSubmitting(false);
        onComplete(collected);
      }
    }
  };

  const canAdvance = () => {
    if (field === 'religiousLevel') return !!collected.religiousLevel;
    if (field === 'maritalStatus') return !!collected.maritalStatus;
    if (field === 'birthDate') return !!collected.birthDate;
    return false;
  };

  const renderField = () => {
    if (field === 'religiousLevel') {
      const options = isRTL ? RELIGIOUS_LEVELS_HE : RELIGIOUS_LEVELS_EN;
      return (
        <div className="grid grid-cols-2 gap-3">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => select('religiousLevel', opt.value)}
              className={cn(
                'rounded-2xl border-2 p-4 text-sm font-semibold text-right transition-all duration-200',
                collected.religiousLevel === opt.value
                  ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-md scale-[1.02]'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-teal-300 hover:bg-teal-50/50'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      );
    }

    if (field === 'maritalStatus') {
      const options = isRTL ? MARITAL_STATUS_HE : MARITAL_STATUS_EN;
      return (
        <div className="flex flex-col gap-3">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => select('maritalStatus', opt.value)}
              className={cn(
                'rounded-2xl border-2 p-4 text-base font-semibold text-right transition-all duration-200',
                collected.maritalStatus === opt.value
                  ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-md'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-teal-300 hover:bg-teal-50/50'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      );
    }

    if (field === 'birthDate') {
      return (
        <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
          {BIRTH_YEARS.map((year) => (
            <button
              key={year}
              onClick={() => select('birthDate', String(year))}
              className={cn(
                'rounded-xl border-2 py-3 text-sm font-bold transition-all duration-200',
                collected.birthDate === String(year)
                  ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-md'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-teal-300'
              )}
            >
              {year}
            </button>
          ))}
        </div>
      );
    }
  };

  const fieldTitle = () => {
    if (field === 'religiousLevel') return isRTL ? 'מה המגזר שלך?' : 'What is your religious background?';
    if (field === 'maritalStatus') return isRTL ? 'מה המצב המשפחתי שלך?' : 'What is your marital status?';
    if (field === 'birthDate') return isRTL ? 'באיזו שנה נולדת/נולדה?' : 'What year were you born?';
    return '';
  };

  const fieldSubtitle = () => {
    if (field === 'religiousLevel') return isRTL ? 'זה עוזר לנו להתאים את השאלות לעולם שלך' : 'This helps us tailor questions to your world';
    if (field === 'maritalStatus') return isRTL ? 'חלק מהשאלות רלוונטיות במיוחד לפרק ב\'' : 'Some questions are especially relevant for a second marriage';
    if (field === 'birthDate') return isRTL ? 'עוזר לנו לסנן שאלות לפי שלב בחיים' : 'Helps us filter questions by life stage';
    return '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-teal-50/30 to-orange-50/20 flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-orange-400 text-white mb-4 shadow-lg">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isRTL ? 'רגע לפני שמתחילים' : 'Before we begin'}
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {isRTL
              ? `שאלה ${step + 1} מתוך ${missingFields.length} — כדי להתאים את השאלון עבורך`
              : `Question ${step + 1} of ${missingFields.length} — to personalize your experience`}
          </p>
        </motion.div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 mb-6">
          {missingFields.map((_, i) => (
            <div
              key={i}
              className={cn(
                'rounded-full transition-all duration-300',
                i === step
                  ? 'w-6 h-2.5 bg-teal-500'
                  : i < step
                  ? 'w-2.5 h-2.5 bg-teal-400'
                  : 'w-2.5 h-2.5 bg-gray-200'
              )}
            />
          ))}
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={field}
            initial={{ opacity: 0, x: isRTL ? -40 : 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 40 : -40 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-3xl shadow-xl border-2 border-white p-6"
          >
            <h2 className="text-lg font-bold text-gray-800 mb-1">{fieldTitle()}</h2>
            <p className="text-sm text-gray-500 mb-5">{fieldSubtitle()}</p>
            {renderField()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 mt-5">
          <Button
            variant="outline"
            onClick={() => step > 0 ? setStep((s) => s - 1) : undefined}
            disabled={step === 0}
            className="flex items-center gap-2 rounded-2xl px-5 h-12 border-2"
          >
            <PrevIcon className="h-4 w-4" />
            <span className="text-sm font-semibold">{isRTL ? 'הקודם' : 'Back'}</span>
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canAdvance() || isSubmitting}
            className={cn(
              'flex items-center gap-2 rounded-2xl px-6 h-12 font-bold text-white',
              'bg-gradient-to-r from-teal-500 to-emerald-500 hover:opacity-90 transition-opacity',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span className="text-sm">
                  {step < missingFields.length - 1
                    ? (isRTL ? 'הבא' : 'Next')
                    : (isRTL ? 'יאללה, נתחיל!' : 'Let\'s go!')}
                </span>
                <NextIcon className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {/* Skip link */}
        <div className="text-center mt-4">
          <button
            onClick={() => onComplete({})}
            className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
          >
            {isRTL ? 'דלג על שאלות אלו' : 'Skip these questions'}
          </button>
        </div>
      </div>
    </div>
  );
}
