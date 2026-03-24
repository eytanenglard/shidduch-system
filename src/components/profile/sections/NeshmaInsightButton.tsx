// src/components/profile/sections/NeshmaInsightButton.tsx

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Lock,
  Copy,
  Eye,
  RefreshCw,
  Compass,
  Star,
  TrendingUp,
  Heart,
  ShieldAlert,
  Flag,
  Feather,
  MessageCircle,
  Coffee,
  Rocket,
  Sunrise,
  CheckCircle2,
  HelpCircle,
  Download,
  type LucideIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { NeshamaInsightReport } from '@/types/neshamaInsight';

// =====================================================
// Types
// =====================================================

interface NeshmaInsightButtonProps {
  userId: string;
  locale: 'he' | 'en';
  completionPercentage: number;
  lastGeneratedAt?: string | Date | null;
  generatedCount?: number;
  userRole?: string;
  dict: {
    buttonText: string;
    buttonSubtitle: string;
    dialogTitle: string;
    generating: string;
    downloadPdf?: string;
    close: string;
    lockedTitle?: string;
    lockedDescription?: string;
    alreadyGeneratedToday?: string;
    minimizedButtonText?: string;
  };
}

interface SectionConfig {
  key: string;
  Icon: LucideIcon;
  titleHe: string;
  titleEn: string;
  accentGradient: string;
  iconBg: string;
  iconColor: string;
  titleColor: string;
}

// =====================================================
// Section Configuration
// =====================================================

const REPORT_SECTIONS: SectionConfig[] = [
  {
    key: 'soulMap',
    Icon: Compass,
    titleHe: 'מפת הנשמה — מי את/ה באמת',
    titleEn: 'Soul Map — Who You Really Are',
    accentGradient: 'from-violet-400 to-purple-500',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    titleColor: 'text-violet-800',
  },
  {
    key: 'strengths',
    Icon: Star,
    titleHe: 'מה את/ה מביא/ה לקשר',
    titleEn: 'What You Bring to a Relationship',
    accentGradient: 'from-emerald-400 to-green-500',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    titleColor: 'text-emerald-800',
  },
  {
    key: 'growthChallenges',
    Icon: TrendingUp,
    titleHe: 'אתגרי צמיחה',
    titleEn: 'Growth Challenges',
    accentGradient: 'from-sky-400 to-blue-500',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
    titleColor: 'text-sky-800',
  },
  {
    key: 'classicFit',
    Icon: Heart,
    titleHe: 'ההתאמה הקלאסית',
    titleEn: 'The Classic Fit',
    accentGradient: 'from-rose-400 to-pink-500',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    titleColor: 'text-rose-800',
  },
  {
    key: 'trap',
    Icon: ShieldAlert,
    titleHe: 'המוקש — מה לא יעבוד',
    titleEn: 'The Trap — What Won\'t Work',
    accentGradient: 'from-amber-400 to-orange-500',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-800',
  },
  {
    key: 'dealbreakers',
    Icon: Flag,
    titleHe: 'על מה לא להתפשר',
    titleEn: 'Non-Negotiables',
    accentGradient: 'from-red-400 to-rose-500',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    titleColor: 'text-red-800',
  },
  {
    key: 'whereToRelax',
    Icon: Feather,
    titleHe: 'איפה אפשר לשחרר',
    titleEn: 'Where to Let Go',
    accentGradient: 'from-lime-400 to-green-500',
    iconBg: 'bg-lime-100',
    iconColor: 'text-lime-600',
    titleColor: 'text-lime-800',
  },
];

const LOADING_STEPS = [
  { he: 'מנתח את הפרופיל שלך', en: 'Analyzing your profile' },
  { he: 'ממפה ערכים ותכונות אישיות', en: 'Mapping values and traits' },
  { he: 'מגבש תובנות לזוגיות ודייטים', en: 'Building relationship insights' },
  { he: 'בונה את הדוח האישי שלך', en: 'Creating your personal report' },
];

const COMPLETION_THRESHOLD = 90;

// =====================================================
// Main Component
// =====================================================

export const NeshmaInsightButton: React.FC<NeshmaInsightButtonProps> = ({
  userId,
  locale,
  completionPercentage,
  lastGeneratedAt,
  generatedCount = 0,
  userRole,
  dict,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [report, setReport] = useState<NeshamaInsightReport | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Track local state so UI updates immediately after generation
  const [localGeneratedCount, setLocalGeneratedCount] = useState(generatedCount);
  const [localLastGeneratedAt, setLocalLastGeneratedAt] = useState<string | Date | null | undefined>(lastGeneratedAt);

  // Sync props when they change (e.g. page refresh)
  useEffect(() => {
    setLocalGeneratedCount(generatedCount);
  }, [generatedCount]);
  useEffect(() => {
    setLocalLastGeneratedAt(lastGeneratedAt);
  }, [lastGeneratedAt]);

  const isHe = locale === 'he';
  const isPrivileged = userRole === 'MATCHMAKER' || userRole === 'ADMIN';
  const isProfileComplete = completionPercentage >= COMPLETION_THRESHOLD || isPrivileged;
  const hasGeneratedBefore = localGeneratedCount > 0;

  const canGenerateToday = useCallback(() => {
    if (isPrivileged) return true;
    if (!localLastGeneratedAt) return true;
    const diffMs = Date.now() - new Date(localLastGeneratedAt).getTime();
    return diffMs / (1000 * 60 * 60) >= 24;
  }, [isPrivileged, localLastGeneratedAt]);

  const canGenerate = isProfileComplete && canGenerateToday();

  // Fetch saved report from DB
  const handleViewSaved = async () => {
    setIsOpen(true);
    setIsLoadingSaved(true);
    try {
      const res = await fetch(`/api/profile/neshama-insight?userId=${userId}`);
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report as NeshamaInsightReport);
      }
    } catch (err) {
      console.error('Error loading saved report:', err);
      toast.error(isHe ? 'שגיאה בטעינת הדוח' : 'Error loading report');
      setIsOpen(false);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  // Generate new report
  const handleGenerate = async () => {
    if (!canGenerate) {
      if (!isProfileComplete) {
        toast.error(
          isHe
            ? `יש להשלים את הפרופיל ל-${COMPLETION_THRESHOLD}% לפחות`
            : `Complete your profile to at least ${COMPLETION_THRESHOLD}%`
        );
      } else {
        toast.error(
          dict.alreadyGeneratedToday ||
          (isHe
            ? 'ניתן ליצור את התמונה המלאה פעם אחת ב-24 שעות'
            : 'You can generate your Full Picture once every 24 hours')
        );
      }
      return;
    }

    setIsOpen(true);
    setIsGenerating(true);
    setReport(null);

    try {
      const res = await fetch('/api/profile/neshama-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, locale }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to generate');
      }

      const data = await res.json();
      setReport(data.report as NeshamaInsightReport);

      // Update local state so the UI switches to "view saved" mode
      setLocalGeneratedCount((prev) => prev + 1);
      setLocalLastGeneratedAt(new Date().toISOString());

      toast.success(isHe ? 'התמונה המלאה נוצרה בהצלחה!' : 'Full Picture generated!');
    } catch (error: any) {
      console.error('Error generating insight:', error);
      toast.error(error.message || (isHe ? 'שגיאה ביצירת הדוח' : 'Error generating report'));
      setIsOpen(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!report) return;
    const text = buildCopyText(report, locale);
    navigator.clipboard.writeText(text);
    toast.success(isHe ? 'הדוח הועתק ללוח' : 'Report copied to clipboard');
  };

  // PDF download using html2canvas + jspdf
  const handleDownloadPdf = async () => {
    if (!report || !reportRef.current) return;
    setIsDownloadingPdf(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = reportRef.current;

      // Temporarily expand the scrollable area to capture full content
      const originalOverflow = element.style.overflow;
      const originalMaxHeight = element.style.maxHeight;
      const originalHeight = element.style.height;
      element.style.overflow = 'visible';
      element.style.maxHeight = 'none';
      element.style.height = 'auto';

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      // Restore scrollable area
      element.style.overflow = originalOverflow;
      element.style.maxHeight = originalMaxHeight;
      element.style.height = originalHeight;

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // A4 dimensions in mm
      const pdfWidth = 210;
      const pdfMargin = 10;
      const contentWidth = pdfWidth - pdfMargin * 2;
      const ratio = contentWidth / imgWidth;
      const scaledHeight = imgHeight * ratio;
      const pageHeight = 297 - pdfMargin * 2;

      const pdf = new jsPDF('p', 'mm', 'a4');

      // If content fits in one page
      if (scaledHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', pdfMargin, pdfMargin, contentWidth, scaledHeight);
      } else {
        // Multi-page: slice the canvas into pages
        let yOffset = 0;
        let pageIndex = 0;

        while (yOffset < imgHeight) {
          if (pageIndex > 0) pdf.addPage();

          const sliceHeight = Math.min(pageHeight / ratio, imgHeight - yOffset);
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = imgWidth;
          sliceCanvas.height = sliceHeight;
          const sliceCtx = sliceCanvas.getContext('2d');
          if (sliceCtx) {
            sliceCtx.drawImage(
              canvas,
              0, yOffset,
              imgWidth, sliceHeight,
              0, 0,
              imgWidth, sliceHeight
            );
            const sliceData = sliceCanvas.toDataURL('image/png');
            pdf.addImage(sliceData, 'PNG', pdfMargin, pdfMargin, contentWidth, sliceHeight * ratio);
          }

          yOffset += sliceHeight;
          pageIndex++;
        }
      }

      const fileName = isHe ? 'התמונה-המלאה-שלי.pdf' : 'my-full-picture.pdf';
      pdf.save(fileName);
      toast.success(isHe ? 'הקובץ הורד בהצלחה' : 'PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(isHe ? 'שגיאה בהורדת הקובץ' : 'Error downloading PDF');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // --- Locked State ---
  if (!isProfileComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="my-6"
      >
        <div className="relative group opacity-60">
          <div className="relative bg-gradient-to-br from-slate-50/50 via-teal-50/50 to-orange-50/50 rounded-2xl p-4 shadow-md border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="bg-gradient-to-br from-slate-400 via-teal-400 to-orange-400 p-3 rounded-xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -end-1 bg-white rounded-full p-1 shadow-md">
                  <Lock className="w-3 h-3 text-gray-600" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-700">
                  {dict.lockedTitle || (isHe ? 'התמונה המלאה - נעולה' : 'Full Picture - Locked')}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  {dict.lockedDescription
                    ? dict.lockedDescription.replace('{{percentage}}', completionPercentage.toString())
                    : isHe
                      ? `השלם את הפרופיל ל-${COMPLETION_THRESHOLD}% כדי לפתוח (כרגע: ${completionPercentage}%)`
                      : `Complete to ${COMPLETION_THRESHOLD}% to unlock (Currently: ${completionPercentage}%)`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // --- Has Report State (View + Regenerate) ---
  if (hasGeneratedBefore) {
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
                  {dict.minimizedButtonText || (isHe ? 'התמונה המלאה' : 'Full Picture')}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isHe ? 'הדוח האישי שלך מוכן' : 'Your personal report is ready'}
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

        <InsightDialog
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
          onDownloadPdf={handleDownloadPdf}
          isDownloadingPdf={isDownloadingPdf}
          reportRef={reportRef}
        />
      </motion.div>
    );
  }

  // --- Ready to Generate (First Time) ---
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
              {isHe ? 'צור עכשיו' : 'Generate'}
            </div>
          </div>
        </div>
      </motion.div>

      <InsightDialog
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
        onDownloadPdf={handleDownloadPdf}
        isDownloadingPdf={isDownloadingPdf}
        reportRef={reportRef}
      />
    </motion.div>
  );
};

// =====================================================
// Dialog Component
// =====================================================

interface InsightDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isGenerating: boolean;
  isLoadingSaved: boolean;
  report: NeshamaInsightReport | null;
  locale: 'he' | 'en';
  dict: any;
  copyToClipboard: () => void;
  canGenerate: boolean;
  onRegenerate: () => void;
  onDownloadPdf: () => void;
  isDownloadingPdf: boolean;
  reportRef: React.RefObject<HTMLDivElement | null>;
}

const InsightDialog: React.FC<InsightDialogProps> = ({
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
  onDownloadPdf,
  isDownloadingPdf,
  reportRef,
}) => {
  const isHe = locale === 'he';
  const direction = isHe ? 'rtl' : 'ltr';
  const isLoading = isGenerating || isLoadingSaved;

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
                onClick={onDownloadPdf}
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

        {/* Closing */}
        {report.closingWords && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.75 }}
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
// Helper: Build copy text
// =====================================================

function buildCopyText(report: NeshamaInsightReport, locale: 'he' | 'en'): string {
  const isHe = locale === 'he';
  const divider = '\n\n' + '─'.repeat(30) + '\n\n';

  const sections = [
    report.tldr,
    report.opening,
    report.soulMap,
    report.strengths,
    report.growthChallenges,
    report.classicFit,
    report.trap,
    report.dealbreakers,
    report.whereToRelax,
    report.datingDynamics,
    report.goldenQuestions?.length
      ? `${isHe ? 'שאלות זהב:' : 'Golden Questions:'}\n${report.goldenQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
      : '',
    report.recommendedDate,
    report.actionSteps?.length
      ? `${isHe ? 'צעדים ליישום:' : 'Action Steps:'}\n${report.actionSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
      : '',
    report.closingWords,
  ];

  return sections.filter(Boolean).join(divider);
}
