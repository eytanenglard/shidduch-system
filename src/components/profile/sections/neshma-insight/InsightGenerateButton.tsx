// src/components/profile/sections/neshma-insight/InsightGenerateButton.tsx

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Eye, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import type { NeshmaInsightHookReturn } from './useNeshmaInsight';
import { InsightReportDialog } from './InsightReportDialog';

// =====================================================
// Types
// =====================================================

interface InsightGenerateButtonProps {
  hook: NeshmaInsightHookReturn;
  locale: 'he' | 'en';
  dict: {
    buttonText: string;
    buttonSubtitle: string;
    dialogTitle: string;
    generating: string;
    downloadPdf?: string;
    close: string;
    minimizedButtonText?: string;
    nextReportTomorrow?: string;
    nextReportIn?: string;
    lockedTitle?: string;
    lockedDescription?: string;
    alreadyGeneratedToday?: string;
  };
}

// =====================================================
// Component: Has Report State (View + Regenerate)
// =====================================================

const HasReportButton: React.FC<InsightGenerateButtonProps> = ({ hook, locale, dict }) => {
  const {
    isOpen,
    isGenerating,
    isLoadingSaved,
    isDownloadingPdf,
    report,
    reportRef,
    isHe,
    canGenerate,
    daysUntilNextGeneration,
    setIsOpen,
    setIsDownloadingPdf,
    handleViewSaved,
    handleGenerate,
    copyToClipboard,
  } = hook;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="my-6"
    >
      <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-gradient-to-br from-teal-500 via-orange-500 to-amber-500 p-2.5 rounded-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-800">
                {dict.minimizedButtonText || (isHe ? 'התמונה המלאה + טיפים' : 'Full Picture + Tips')}
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                {!canGenerate && daysUntilNextGeneration > 0
                  ? (daysUntilNextGeneration === 1
                      ? (dict.nextReportTomorrow || (isHe ? 'הדוח הבא מחר' : 'Next report tomorrow'))
                      : (dict.nextReportIn || (isHe ? 'הדוח הבא בעוד {{days}} ימים' : 'Next report in {{days}} days')).replace('{{days}}', String(daysUntilNextGeneration))
                    )
                  : (isHe ? 'הדוח האישי שלך מוכן' : 'Your personal report is ready')
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleViewSaved}
              size="sm"
              variant="outline"
              className="gap-1.5 rounded-full text-xs border-teal-200 text-teal-700 hover:bg-teal-50"
            >
              <Eye className="w-3.5 h-3.5" />
              {isHe ? 'צפה' : 'View'}
            </Button>
            {canGenerate && (
              <Button
                onClick={handleGenerate}
                size="sm"
                className="gap-1.5 rounded-full text-xs bg-gradient-to-r from-teal-600 to-orange-600 hover:from-teal-700 hover:to-orange-700 text-white"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {isHe ? 'חדש' : 'New'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <InsightReportDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        isGenerating={isGenerating}
        isLoadingSaved={isLoadingSaved}
        report={report}
        locale={locale}
        dict={dict}
        copyToClipboard={copyToClipboard}
        canGenerate={canGenerate}
        onRegenerate={handleGenerate}
        reportRef={reportRef}
        isDownloadingPdf={isDownloadingPdf}
        setIsDownloadingPdf={setIsDownloadingPdf}
      />
    </motion.div>
  );
};

// =====================================================
// Component: Ready to Generate (First Time)
// =====================================================

const FirstTimeButton: React.FC<InsightGenerateButtonProps> = ({ hook, locale, dict }) => {
  const {
    isOpen,
    isGenerating,
    isLoadingSaved,
    isDownloadingPdf,
    report,
    reportRef,
    isHe,
    isPrivileged,
    canGenerate,
    setIsOpen,
    setIsDownloadingPdf,
    handleGenerate,
    copyToClipboard,
  } = hook;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="my-6"
    >
      <motion.div
        className="relative cursor-pointer"
        onClick={handleGenerate}
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 rounded-2xl blur-lg opacity-25 animate-pulse" />

        <div className="relative bg-gradient-to-br from-teal-50 via-orange-50 to-amber-50 rounded-2xl p-5 shadow-lg border border-teal-200/60">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-teal-500 via-orange-500 to-amber-500 p-3 rounded-xl shadow-md">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-gray-800">
                {dict.buttonText}
                {isPrivileged && (
                  <span className="text-xs text-teal-600 font-normal mr-2">(גישת שדכן)</span>
                )}
              </h4>
              <p className="text-sm text-gray-600 mt-1">{dict.buttonSubtitle}</p>
            </div>
            <div className="bg-gradient-to-r from-teal-600 to-orange-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md">
              {isHe ? 'צור דוח + טיפים' : 'Report + Tips'}
            </div>
          </div>
        </div>
      </motion.div>

      <InsightReportDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        isGenerating={isGenerating}
        isLoadingSaved={isLoadingSaved}
        report={report}
        locale={locale}
        dict={dict}
        copyToClipboard={copyToClipboard}
        canGenerate={canGenerate}
        onRegenerate={handleGenerate}
        reportRef={reportRef}
        isDownloadingPdf={isDownloadingPdf}
        setIsDownloadingPdf={setIsDownloadingPdf}
      />
    </motion.div>
  );
};

// =====================================================
// Exported Wrapper
// =====================================================

export const InsightGenerateButton: React.FC<InsightGenerateButtonProps> = (props) => {
  if (props.hook.hasGeneratedBefore) {
    return <HasReportButton {...props} />;
  }
  return <FirstTimeButton {...props} />;
};
