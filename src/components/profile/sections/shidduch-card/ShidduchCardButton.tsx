// src/components/profile/sections/shidduch-card/ShidduchCardButton.tsx

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { IdCard, Eye, RefreshCw, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useShidduchCard, type ShidduchCardHookParams } from './useShidduchCard';
import { ShidduchCardDialog } from './ShidduchCardDialog';

// =====================================================
// Types
// =====================================================

interface ShidduchCardButtonProps extends ShidduchCardHookParams {
  dict: {
    buttonText: string;
    buttonSubtitle: string;
    dialogTitle: string;
    generating: string;
    close: string;
    lockedTitle: string;
    lockedDescription: string;
    minimizedButtonText: string;
    nextCardIn: string;
    nextCardTomorrow: string;
  };
}

// =====================================================
// Main Orchestrator Component
// =====================================================

export const ShidduchCardButton: React.FC<ShidduchCardButtonProps> = ({
  dict,
  ...hookParams
}) => {
  const hook = useShidduchCard(hookParams);

  // Locked: hasn't completed Soul Fingerprint
  if (!hook.isEligible) {
    return <LockedState locale={hookParams.locale} dict={dict} />;
  }

  // Has generated before — show compact view
  if (hook.hasGeneratedBefore) {
    return <HasCardButton hook={hook} locale={hookParams.locale} dict={dict} />;
  }

  // First time — show prominent CTA
  return <FirstTimeButton hook={hook} locale={hookParams.locale} dict={dict} />;
};

// =====================================================
// Locked State
// =====================================================

const LockedState: React.FC<{
  locale: 'he' | 'en';
  dict: ShidduchCardButtonProps['dict'];
}> = ({ locale, dict }) => {
  const isHe = locale === 'he';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="my-4"
    >
      <div className="relative bg-gray-50/80 rounded-2xl p-4 shadow-sm border border-gray-200 opacity-75">
        <div className="flex items-center gap-3">
          <div className="bg-gray-300 p-2.5 rounded-xl">
            <Lock className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-600">
              {dict.lockedTitle || (isHe ? 'כרטיס שידוכים - נעול' : 'Shidduch Card - Locked')}
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              {dict.lockedDescription || (isHe ? 'יש למלא את מפת הלב כדי ליצור את הכרטיס' : 'Complete the Heart Map to generate your card')}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// =====================================================
// Has Card Button (View + Regenerate)
// =====================================================

const HasCardButton: React.FC<{
  hook: ReturnType<typeof useShidduchCard>;
  locale: 'he' | 'en';
  dict: ShidduchCardButtonProps['dict'];
}> = ({ hook, locale, dict }) => {
  const {
    isOpen,
    isGenerating,
    isLoadingSaved,
    cardData,
    isHe,
    canGenerate,
    daysUntilNextGeneration,
    setIsOpen,
    handleViewSaved,
    handleGenerate,
    copyToClipboard,
  } = hook;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="my-4"
    >
      <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-gradient-to-br from-rose-500 via-amber-500 to-orange-500 p-2.5 rounded-xl">
              <IdCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-800">
                {dict.minimizedButtonText || (isHe ? 'כרטיס השידוכים שלי' : 'My Shidduch Card')}
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                {!canGenerate && daysUntilNextGeneration > 0
                  ? (daysUntilNextGeneration === 1
                      ? (dict.nextCardTomorrow || (isHe ? 'כרטיס חדש מחר' : 'New card tomorrow'))
                      : (dict.nextCardIn || (isHe ? 'כרטיס חדש בעוד {{days}} ימים' : 'New card in {{days}} days')).replace('{{days}}', String(daysUntilNextGeneration))
                    )
                  : (isHe ? 'הכרטיס שלך מוכן' : 'Your card is ready')
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleViewSaved}
              size="sm"
              variant="outline"
              className="gap-1.5 rounded-full text-xs border-rose-200 text-rose-700 hover:bg-rose-50"
            >
              <Eye className="w-3.5 h-3.5" />
              {isHe ? 'צפה' : 'View'}
            </Button>
            {canGenerate && (
              <Button
                onClick={handleGenerate}
                size="sm"
                className="gap-1.5 rounded-full text-xs bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {isHe ? 'חדש' : 'New'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <ShidduchCardDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        isGenerating={isGenerating}
        isLoadingSaved={isLoadingSaved}
        cardData={cardData}
        locale={locale}
        dict={dict}
        copyToClipboard={copyToClipboard}
        canGenerate={canGenerate}
        onRegenerate={handleGenerate}
      />
    </motion.div>
  );
};

// =====================================================
// First Time Button (prominent CTA)
// =====================================================

const FirstTimeButton: React.FC<{
  hook: ReturnType<typeof useShidduchCard>;
  locale: 'he' | 'en';
  dict: ShidduchCardButtonProps['dict'];
}> = ({ hook, locale, dict }) => {
  const {
    isOpen,
    isGenerating,
    isLoadingSaved,
    cardData,
    isHe,
    isPrivileged,
    canGenerate,
    setIsOpen,
    handleGenerate,
    copyToClipboard,
  } = hook;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="my-4"
    >
      <motion.div
        className="relative cursor-pointer"
        onClick={handleGenerate}
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500 via-amber-500 to-orange-500 rounded-2xl blur-lg opacity-20 animate-pulse" />

        <div className="relative bg-gradient-to-br from-rose-50 via-amber-50 to-orange-50 rounded-2xl p-5 shadow-lg border border-rose-200/60">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-rose-500 via-amber-500 to-orange-500 p-3 rounded-xl shadow-md">
              <IdCard className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-gray-800">
                {dict.buttonText}
                {isPrivileged && (
                  <span className="text-xs text-rose-600 font-normal mr-2">(גישת שדכן)</span>
                )}
              </h4>
              <p className="text-sm text-gray-600 mt-1">{dict.buttonSubtitle}</p>
            </div>
            <div className="bg-gradient-to-r from-rose-600 to-amber-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md whitespace-nowrap">
              {isHe ? 'צור כרטיס' : 'Create Card'}
            </div>
          </div>
        </div>
      </motion.div>

      <ShidduchCardDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        isGenerating={isGenerating}
        isLoadingSaved={isLoadingSaved}
        cardData={cardData}
        locale={locale}
        dict={dict}
        copyToClipboard={copyToClipboard}
        canGenerate={canGenerate}
        onRegenerate={handleGenerate}
      />
    </motion.div>
  );
};
