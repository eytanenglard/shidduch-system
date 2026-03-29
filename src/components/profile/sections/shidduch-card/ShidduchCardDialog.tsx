// src/components/profile/sections/shidduch-card/ShidduchCardDialog.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  IdCard,
  Loader2,
  Copy,
  RefreshCw,
  CheckCircle2,
  User,
  Heart,
  Star,
  Gem,
  Sparkles,
  Sun,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ShidduchCardFull } from '@/types/shidduchCard';

// =====================================================
// Types
// =====================================================

interface ShidduchCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isGenerating: boolean;
  isLoadingSaved: boolean;
  cardData: ShidduchCardFull | null;
  locale: 'he' | 'en';
  dict: {
    dialogTitle: string;
    generating: string;
    close: string;
  };
  copyToClipboard: () => void;
  canGenerate: boolean;
  onRegenerate: () => void;
}

// =====================================================
// Loading Steps
// =====================================================

const LOADING_STEPS = [
  { he: 'קורא את הפרופיל שלך', en: 'Reading your profile' },
  { he: 'מנתח את תשובות השאלון', en: 'Analyzing questionnaire answers' },
  { he: 'מגבש את כרטיס השידוכים', en: 'Creating your shidduch card' },
];

// =====================================================
// Main Dialog
// =====================================================

export const ShidduchCardDialog: React.FC<ShidduchCardDialogProps> = ({
  isOpen,
  onClose,
  isGenerating,
  isLoadingSaved,
  cardData,
  locale,
  dict,
  copyToClipboard,
  canGenerate,
  onRegenerate,
}) => {
  const isHe = locale === 'he';
  const direction = isHe ? 'rtl' : 'ltr';
  const isLoading = isGenerating || isLoadingSaved;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden"
        dir={direction}
      >
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-rose-50 via-white to-amber-50 flex-shrink-0">
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-rose-600 via-amber-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-2.5">
            <IdCard className="w-5 h-5 text-rose-600 flex-shrink-0" />
            {dict.dialogTitle}
          </DialogTitle>
        </DialogHeader>

        {/* Body */}
        {isLoading ? (
          <LoadingState isGenerating={isGenerating} locale={locale} />
        ) : cardData ? (
          <CardView data={cardData} locale={locale} />
        ) : (
          <div className="flex-1 flex items-center justify-center py-12">
            <p className="text-gray-500">{isHe ? 'אין כרטיס להצגה' : 'No card to display'}</p>
          </div>
        )}

        {/* Footer */}
        {!isLoading && cardData && (
          <DialogFooter className="px-6 py-3 border-t bg-gray-50/80 gap-2 sm:gap-0 flex-shrink-0">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <Button
                variant="outline"
                onClick={copyToClipboard}
                size="sm"
                className="gap-2 flex-1 sm:flex-none text-rose-700 border-rose-200 hover:bg-rose-50"
              >
                <Copy className="w-3.5 h-3.5" />
                {isHe ? 'העתק כרטיס' : 'Copy Card'}
              </Button>
              {canGenerate && (
                <Button
                  variant="outline"
                  onClick={onRegenerate}
                  size="sm"
                  className="gap-2 flex-1 sm:flex-none text-amber-700 border-amber-200 hover:bg-amber-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {isHe ? 'צור מחדש' : 'Regenerate'}
                </Button>
              )}
            </div>
            <Button onClick={onClose} size="sm" className="bg-rose-600 hover:bg-rose-700 text-white">
              {dict.close || (isHe ? 'סגור' : 'Close')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

// =====================================================
// Loading State
// =====================================================

const LoadingState: React.FC<{ isGenerating: boolean; locale: 'he' | 'en' }> = ({
  isGenerating,
  locale,
}) => {
  const isHe = locale === 'he';
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 3500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  useEffect(() => {
    if (isGenerating) setCurrentStep(0);
  }, [isGenerating]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16 px-8 space-y-8">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-400 to-amber-400 rounded-full blur-xl opacity-30 animate-pulse" />
        <div className="relative bg-gradient-to-br from-rose-500 to-amber-500 p-5 rounded-full">
          <IdCard className="w-8 h-8 text-white animate-pulse" />
        </div>
      </div>

      <div className="w-full max-w-xs space-y-3">
        {LOADING_STEPS.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: isHe ? 20 : -20 }}
            animate={{ opacity: i <= currentStep ? 1 : 0.3, x: 0 }}
            transition={{ duration: 0.4, delay: i * 0.15 }}
            className="flex items-center gap-3"
          >
            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
              {i < currentStep ? (
                <CheckCircle2 className="w-5 h-5 text-rose-500" />
              ) : i === currentStep ? (
                <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
              ) : (
                <div className="w-3 h-3 rounded-full bg-gray-200" />
              )}
            </div>
            <span
              className={cn(
                'text-sm transition-colors',
                i < currentStep ? 'text-rose-700 font-medium' :
                i === currentStep ? 'text-gray-800 font-medium' :
                'text-gray-400'
              )}
            >
              {isHe ? step.he : step.en}
            </span>
          </motion.div>
        ))}
      </div>

      <p className="text-xs text-gray-400">
        {isHe ? 'זה לוקח כ-15 שניות...' : 'This takes about 15 seconds...'}
      </p>
    </div>
  );
};

// =====================================================
// Card View — The actual shidduch card display
// =====================================================

const CardView: React.FC<{
  data: ShidduchCardFull;
  locale: 'he' | 'en';
}> = ({ data, locale }) => {
  const isHe = locale === 'he';
  const { card, meta } = data;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-5 space-y-4">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative p-[1.5px] rounded-xl bg-gradient-to-r from-rose-500 via-amber-500 to-orange-500">
            <div className="bg-white rounded-[10.5px] p-4 text-center">
              <h2 className="text-lg font-bold text-gray-800 leading-relaxed">
                {card.headline}
              </h2>
            </div>
          </div>
        </motion.div>

        {/* Meta Bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06 }}
        >
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-gray-600">
            {meta.firstName && (
              <span className="font-semibold text-gray-800">{meta.firstName}</span>
            )}
            {meta.age > 0 && <MetaChip>{meta.age}</MetaChip>}
            {meta.city && <MetaChip>{meta.city}</MetaChip>}
            {meta.religiousLevel && <MetaChip>{meta.religiousLevel}</MetaChip>}
            {meta.occupation && <MetaChip>{meta.occupation}</MetaChip>}
            {meta.height && <MetaChip>{meta.height} {isHe ? 'ס"מ' : 'cm'}</MetaChip>}
            {meta.education && <MetaChip>{meta.education}</MetaChip>}
          </div>
        </motion.div>

        {/* About Me */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.12 }}
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-rose-400 to-pink-500" />
            <div className="p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-1.5 rounded-lg bg-rose-100">
                  <User className="w-4 h-4 text-rose-600" />
                </div>
                <h3 className="text-[15px] font-bold text-rose-800">
                  {isHe ? 'מי אני' : 'About Me'}
                </h3>
              </div>
              <p className="text-gray-700 leading-[1.85] text-[15px]">{card.aboutMe}</p>
            </div>
          </div>
        </motion.div>

        {/* Looking For */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18 }}
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
            <div className="p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-1.5 rounded-lg bg-amber-100">
                  <Heart className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="text-[15px] font-bold text-amber-800">
                  {isHe ? 'מה אני מחפש/ת' : 'Looking For'}
                </h3>
              </div>
              <p className="text-gray-700 leading-[1.85] text-[15px]">{card.lookingFor}</p>
            </div>
          </div>
        </motion.div>

        {/* Tags Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.24 }}
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-violet-400 to-purple-500" />
            <div className="p-5 space-y-4">
              {/* Strength Tags */}
              {card.strengthTags.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-semibold text-amber-700">
                      {isHe ? 'חוזקות' : 'Strengths'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {card.strengthTags.map((tag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Core Value Tags */}
              {card.coreTags.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Gem className="w-4 h-4 text-violet-500" />
                    <span className="text-sm font-semibold text-violet-700">
                      {isHe ? 'ערכים מרכזיים' : 'Core Values'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {card.coreTags.map((tag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-violet-50 text-violet-700 border border-violet-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Lifestyle */}
        {card.lifestyleSummary && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3 }}
          >
            <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/50 rounded-xl p-4 border border-emerald-100/60">
              <div className="flex items-center gap-2 mb-2">
                <Sun className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-700">
                  {isHe ? 'סגנון חיים' : 'Lifestyle'}
                </span>
              </div>
              <p className="text-gray-700 text-[15px] leading-relaxed">{card.lifestyleSummary}</p>
            </div>
          </motion.div>
        )}

        {/* Closing Line */}
        {card.closingLine && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.36 }}
          >
            <div className="bg-gradient-to-br from-rose-50/80 to-amber-50/50 rounded-xl p-5 border border-rose-100/60 text-center">
              <Sparkles className="w-5 h-5 text-rose-400 mx-auto mb-3" />
              <p className="text-gray-800 leading-[1.85] text-[15px] font-medium italic">
                {card.closingLine}
              </p>
            </div>
          </motion.div>
        )}

        {/* Branding footer */}
        <div className="text-center pt-2 pb-1">
          <p className="text-xs text-gray-400">
            {isHe ? 'נוצר באמצעות NeshamaTech AI' : 'Generated with NeshamaTech AI'}
          </p>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// Meta Chip
// =====================================================

const MetaChip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
    {children}
  </span>
);
