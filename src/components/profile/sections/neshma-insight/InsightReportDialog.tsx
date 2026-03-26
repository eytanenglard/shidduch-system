// src/components/profile/sections/neshma-insight/InsightReportDialog.tsx

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
  Sparkles,
  Loader2,
  Copy,
  RefreshCw,
  Download,
  CheckCircle2,
  MessageCircle,
  HelpCircle,
  Coffee,
  Rocket,
  Sunrise,
  Lightbulb,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { NeshamaInsightReport, ProfileTips } from '@/types/neshamaInsight';
import { REPORT_SECTIONS, LOADING_STEPS } from './config';
import type { SectionConfig } from './config';
import { generateInsightPdf } from './insightPdfExport';

// =====================================================
// Types
// =====================================================

interface InsightReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isGenerating: boolean;
  isLoadingSaved: boolean;
  report: NeshamaInsightReport | null;
  locale: 'he' | 'en';
  dict: {
    dialogTitle: string;
    generating: string;
    downloadPdf?: string;
    close: string;
  };
  copyToClipboard: () => void;
  canGenerate: boolean;
  onRegenerate: () => void;
  reportRef: React.RefObject<HTMLDivElement | null>;
  isDownloadingPdf: boolean;
  setIsDownloadingPdf: (downloading: boolean) => void;
}

// =====================================================
// Main Dialog
// =====================================================

export const InsightReportDialog: React.FC<InsightReportDialogProps> = ({
  isOpen,
  onClose,
  isGenerating,
  isLoadingSaved,
  report,
  locale,
  dict,
  copyToClipboard,
  canGenerate,
  onRegenerate,
  reportRef,
  isDownloadingPdf,
  setIsDownloadingPdf,
}) => {
  const isHe = locale === 'he';
  const direction = isHe ? 'rtl' : 'ltr';
  const isLoading = isGenerating || isLoadingSaved;

  const handleDownloadPdf = async () => {
    if (!report || !reportRef.current) return;
    setIsDownloadingPdf(true);

    try {
      await generateInsightPdf(reportRef, locale);
      toast.success(isHe ? 'הקובץ הורד בהצלחה' : 'PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(isHe ? 'שגיאה בהורדת הקובץ' : 'Error downloading PDF');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden"
        dir={direction}
      >
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-teal-50 via-white to-orange-50 flex-shrink-0">
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-teal-600 via-orange-600 to-amber-600 bg-clip-text text-transparent flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-teal-600 flex-shrink-0" />
            {dict.dialogTitle}
          </DialogTitle>
        </DialogHeader>

        {/* Body */}
        {isLoading ? (
          <LoadingState
            isGenerating={isGenerating}
            locale={locale}
          />
        ) : report ? (
          <InsightReportView report={report} locale={locale} reportRef={reportRef} />
        ) : (
          <div className="flex-1 flex items-center justify-center py-12">
            <p className="text-gray-500">{isHe ? 'אין דוח להצגה' : 'No report to display'}</p>
          </div>
        )}

        {/* Footer */}
        {!isLoading && report && (
          <DialogFooter className="px-6 py-3 border-t bg-gray-50/80 gap-2 sm:gap-0 flex-shrink-0">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <Button
                variant="outline"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                size="sm"
                className="gap-2 flex-1 sm:flex-none text-teal-700 border-teal-200 hover:bg-teal-50"
              >
                {isDownloadingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                {dict.downloadPdf || (isHe ? 'הורד PDF' : 'Download PDF')}
              </Button>
              <Button variant="outline" onClick={copyToClipboard} size="sm" className="gap-2 flex-1 sm:flex-none">
                <Copy className="w-3.5 h-3.5" />
                {isHe ? 'העתק' : 'Copy'}
              </Button>
              {canGenerate && (
                <Button
                  variant="outline"
                  onClick={onRegenerate}
                  size="sm"
                  className="gap-2 flex-1 sm:flex-none text-orange-700 border-orange-200 hover:bg-orange-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {isHe ? 'צור מחדש' : 'Regenerate'}
                </Button>
              )}
            </div>
            <Button onClick={onClose} size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
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
    }, 4000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Reset step when loading starts
  useEffect(() => {
    if (isGenerating) setCurrentStep(0);
  }, [isGenerating]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16 px-8 space-y-8">
      {/* Spinning Icon */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-orange-400 rounded-full blur-xl opacity-30 animate-pulse" />
        <div className="relative bg-gradient-to-br from-teal-500 to-orange-500 p-5 rounded-full">
          <Sparkles className="w-8 h-8 text-white animate-pulse" />
        </div>
      </div>

      {/* Steps */}
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
                <CheckCircle2 className="w-5 h-5 text-teal-500" />
              ) : i === currentStep ? (
                <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
              ) : (
                <div className="w-3 h-3 rounded-full bg-gray-200" />
              )}
            </div>
            <span
              className={cn(
                'text-sm transition-colors',
                i < currentStep ? 'text-teal-700 font-medium' :
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
        {isHe ? 'זה לוקח כ-20 שניות...' : 'This takes about 20 seconds...'}
      </p>
    </div>
  );
};

// =====================================================
// Report View
// =====================================================

const InsightReportView: React.FC<{
  report: NeshamaInsightReport;
  locale: 'he' | 'en';
  reportRef?: React.RefObject<HTMLDivElement | null>;
}> = ({ report, locale, reportRef }) => {
  const isHe = locale === 'he';

  return (
    <div className="flex-1 overflow-y-auto" ref={reportRef}>
      <div className="p-5 space-y-4">
        {/* TL;DR */}
        {report.tldr && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative p-[1.5px] rounded-xl bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500">
              <div className="bg-white rounded-[10.5px] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <span className="text-sm font-bold text-teal-700">
                    {isHe ? 'בקצרה' : 'At a Glance'}
                  </span>
                </div>
                <p className="text-gray-800 leading-relaxed text-[15px] font-medium">
                  {report.tldr}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Opening */}
        {report.opening && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
          >
            <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/50 rounded-xl p-5 border border-amber-100/60">
              <p className="text-gray-800 leading-[1.85] text-[15px]">{report.opening}</p>
            </div>
          </motion.div>
        )}

        {/* Standard Sections */}
        {REPORT_SECTIONS.map((section, idx) => {
          const content = report[section.key as keyof NeshamaInsightReport];
          if (!content || (typeof content === 'string' && !content.trim())) return null;

          return (
            <motion.div
              key={section.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.12 + idx * 0.06 }}
            >
              <SectionCard
                section={section}
                content={content as string}
                locale={locale}
              />
            </motion.div>
          );
        })}

        {/* Dating Guide (combined section) */}
        {(report.datingDynamics || report.goldenQuestions?.length > 0 || report.recommendedDate) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.6 }}
          >
            <DatingCard report={report} locale={locale} />
          </motion.div>
        )}

        {/* Action Steps */}
        {report.actionSteps && report.actionSteps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.68 }}
          >
            <ActionStepsCard steps={report.actionSteps} locale={locale} />
          </motion.div>
        )}

        {/* Profile Tips */}
        {report.profileTips && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.76 }}
          >
            <ProfileTipsCard tips={report.profileTips} locale={locale} />
          </motion.div>
        )}

        {/* Closing */}
        {report.closingWords && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.84 }}
          >
            <div className="bg-gradient-to-br from-teal-50/80 to-emerald-50/50 rounded-xl p-5 border border-teal-100/60 text-center">
              <Sunrise className="w-5 h-5 text-amber-500 mx-auto mb-3" />
              <p className="text-gray-800 leading-[1.85] text-[15px] font-medium">
                {report.closingWords}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// =====================================================
// Section Card
// =====================================================

const SectionCard: React.FC<{
  section: SectionConfig;
  content: string;
  locale: 'he' | 'en';
}> = ({ section, content, locale }) => {
  const isHe = locale === 'he';
  const title = isHe ? section.titleHe : section.titleEn;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className={cn('h-1 bg-gradient-to-r', section.accentGradient)} />
      <div className="p-5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className={cn('p-1.5 rounded-lg', section.iconBg)}>
            <section.Icon className={cn('w-4 h-4', section.iconColor)} />
          </div>
          <h3 className={cn('text-[15px] font-bold', section.titleColor)}>
            {title}
          </h3>
        </div>
        <p className="text-gray-700 leading-[1.85] text-[15px]">{content}</p>
      </div>
    </div>
  );
};

// =====================================================
// Dating Guide Card
// =====================================================

const DatingCard: React.FC<{
  report: NeshamaInsightReport;
  locale: 'he' | 'en';
}> = ({ report, locale }) => {
  const isHe = locale === 'he';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-1.5 rounded-lg bg-blue-100">
            <MessageCircle className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-[15px] font-bold text-blue-800">
            {isHe ? 'המראה — הדייטים שלך' : 'The Mirror — Your Dating Dynamics'}
          </h3>
        </div>

        {/* Dynamics */}
        {report.datingDynamics && (
          <p className="text-gray-700 leading-[1.85] text-[15px]">{report.datingDynamics}</p>
        )}

        {/* Golden Questions */}
        {report.goldenQuestions && report.goldenQuestions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <span className="text-sm font-semibold text-purple-700">
                {isHe ? 'שאלות זהב לדייט' : 'Golden Questions for Dates'}
              </span>
            </div>
            <div className="space-y-2">
              {report.goldenQuestions.map((q, i) => (
                <div key={i} className="flex items-start gap-2.5 bg-purple-50/60 p-3 rounded-lg">
                  <span className="text-purple-400 font-bold text-sm mt-0.5 flex-shrink-0">
                    {i + 1}.
                  </span>
                  <p className="text-gray-700 text-sm leading-relaxed">{q}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Date */}
        {report.recommendedDate && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Coffee className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-amber-700">
                {isHe ? 'הדייט המושלם עבורך' : 'Your Perfect Date'}
              </span>
            </div>
            <p className="text-gray-700 leading-[1.85] text-[15px]">{report.recommendedDate}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// =====================================================
// Action Steps Card
// =====================================================

const ActionStepsCard: React.FC<{
  steps: string[];
  locale: 'he' | 'en';
}> = ({ steps, locale }) => {
  const isHe = locale === 'he';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-teal-400 to-emerald-500" />
      <div className="p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-1.5 rounded-lg bg-teal-100">
            <Rocket className="w-4 h-4 text-teal-600" />
          </div>
          <h3 className="text-[15px] font-bold text-teal-800">
            {isHe ? 'צעדים ליישום החודש' : 'Steps for This Month'}
          </h3>
        </div>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-0.5 w-6 h-6 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-bold text-white">{i + 1}</span>
              </div>
              <p className="text-gray-700 text-[15px] leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// =====================================================
// Profile Tips Card
// =====================================================

const ProfileTipsCard: React.FC<{
  tips: ProfileTips;
  locale: 'he' | 'en';
}> = ({ tips, locale }) => {
  const isHe = locale === 'he';

  const statusConfig = {
    COMPLETE: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', label: isHe ? 'מלא' : 'Complete' },
    PARTIAL: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', label: isHe ? 'חלקי' : 'Partial' },
    MISSING: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: isHe ? 'חסר' : 'Missing' },
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-indigo-400 to-violet-500" />
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-1.5 rounded-lg bg-indigo-100">
            <Lightbulb className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-[15px] font-bold text-indigo-800">
            {isHe ? 'המלצות לשיפור הפרופיל' : 'Profile Improvement Tips'}
          </h3>
        </div>

        {/* Personality & Looking For Summaries */}
        {(tips.personalitySummary || tips.lookingForSummary) && (
          <div className="space-y-3 mb-4">
            {tips.personalitySummary && (
              <div className="bg-indigo-50/60 rounded-lg p-3">
                <span className="text-xs font-semibold text-indigo-700 block mb-1">
                  {isHe ? 'סיכום אישיות' : 'Personality Summary'}
                </span>
                <p className="text-gray-700 text-sm leading-relaxed">{tips.personalitySummary}</p>
              </div>
            )}
            {tips.lookingForSummary && (
              <div className="bg-violet-50/60 rounded-lg p-3">
                <span className="text-xs font-semibold text-violet-700 block mb-1">
                  {isHe ? 'מה אני מחפש/ת' : 'What I\'m Looking For'}
                </span>
                <p className="text-gray-700 text-sm leading-relaxed">{tips.lookingForSummary}</p>
              </div>
            )}
          </div>
        )}

        {/* Completeness Report */}
        {tips.completenessReport && tips.completenessReport.length > 0 && (
          <div className="mb-4">
            <span className="text-xs font-semibold text-gray-600 block mb-2">
              {isHe ? 'שלמות הפרופיל' : 'Profile Completeness'}
            </span>
            <div className="space-y-2">
              {tips.completenessReport.map((item, i) => {
                const config = statusConfig[item.status] || statusConfig.MISSING;
                const StatusIcon = config.icon;
                return (
                  <div key={i} className={cn('flex items-start gap-2.5 p-2.5 rounded-lg', config.bg)}>
                    <StatusIcon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', config.color)} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-800">{item.area}</span>
                      <p className="text-xs text-gray-600 mt-0.5">{item.feedback}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actionable Tips */}
        {tips.actionableTips && tips.actionableTips.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-gray-600 block mb-2">
              {isHe ? 'טיפים לשיפור' : 'Tips for Improvement'}
            </span>
            <div className="space-y-2">
              {tips.actionableTips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5 bg-amber-50/60 p-3 rounded-lg">
                  <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-amber-700">{tip.area}</span>
                    <p className="text-sm text-gray-700 mt-0.5">{tip.tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
