// src/app/[locale]/(authenticated)/profile/components/dashboard/NeshmaInsightButton.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sparkles, Loader2, Download, Lock, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
// ✨ תיקון: מייבאים את הטיפוס הנכון - TextOptionsLight
import type { TextOptionsLight } from 'jspdf';

interface NeshmaInsightButtonProps {
  userId: string;
  locale: 'he' | 'en';
  completionPercentage: number;
  lastGeneratedAt?: string | null;
  generatedCount?: number;
  dict: {
    buttonText: string;
    buttonSubtitle: string;
    dialogTitle: string;
    generating: string;
    downloadPdf: string;
    close: string;
    lockedTitle?: string;
    lockedDescription?: string;
    alreadyGeneratedToday?: string;
    minimizedButtonText?: string;
  };
}

export const NeshmaInsightButton: React.FC<NeshmaInsightButtonProps> = ({
  userId,
  locale,
  completionPercentage,
  lastGeneratedAt,
  generatedCount = 0,
  dict,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [insightData, setInsightData] = useState<any>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const direction = locale === 'he' ? 'rtl' : 'ltr';

  const isProfileComplete = completionPercentage >= 100;

  const canGenerateToday = () => {
    if (!lastGeneratedAt) return true;
    const lastGenDate = new Date(lastGeneratedAt);
    const today = new Date();
    const diffTime = today.getTime() - lastGenDate.getTime();
    const diffHours = diffTime / (1000 * 60 * 60);
    return diffHours >= 24;
  };

  const hasGeneratedBefore = generatedCount > 0;
  const canGenerate = isProfileComplete && canGenerateToday();

  useEffect(() => {
    if (hasGeneratedBefore && isProfileComplete) {
      setIsMinimized(true);
    }
  }, [hasGeneratedBefore, isProfileComplete]);

  const handleGenerateInsight = async () => {
    if (!canGenerate) {
      if (!isProfileComplete) {
        toast.error(
          locale === 'he'
            ? 'יש להשלים את הפרופיל ל-100% כדי לקבל תובנת נשמה'
            : 'Complete your profile to 100% to get Neshama Insight'
        );
      } else if (!canGenerateToday()) {
        toast.error(
          locale === 'he'
            ? 'ניתן ליצור תובנת נשמה פעם אחת ב-24 שעות'
            : 'You can generate Neshama Insight once every 24 hours'
        );
      }
      return;
    }

    setIsOpen(true);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/profile/neshama-insight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, locale }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate insight');
      }

      const data = await response.json();
      setInsightData(data.insight);
      toast.success(
        locale === 'he'
          ? 'התובנה נוצרה בהצלחה!'
          : 'Insight generated successfully!'
      );

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error('Error generating insight:', error);
      toast.error(
        error.message ||
          (locale === 'he'
            ? 'אירעה שגיאה ביצירת התובנה'
            : 'Error generating insight')
      );
      setIsOpen(false);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isProfileComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="my-6"
      >
        <div className="relative group opacity-60">
          <div className="relative bg-gradient-to-br from-purple-50/50 via-pink-50/50 to-cyan-50/50 rounded-2xl p-4 shadow-md border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="bg-gradient-to-br from-purple-400 via-pink-400 to-cyan-400 p-3 rounded-xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -end-1 bg-white rounded-full p-1 shadow-md">
                  <Lock className="w-3 h-3 text-gray-600" />
                </div>
              </div>

              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-700">
                  {dict.lockedTitle ||
                    (locale === 'he'
                      ? 'תובנת נשמה - נעולה'
                      : 'Neshama Insight - Locked')}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  {dict.lockedDescription ||
                    (locale === 'he'
                      ? `השלם את הפרופיל ל-100% כדי לפתוח (כרגע: ${completionPercentage}%)`
                      : `Complete your profile to 100% to unlock (Currently: ${completionPercentage}%)`)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (isMinimized && hasGeneratedBefore) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="my-6"
      >
        <div className="relative bg-white/70 rounded-2xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 p-2 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-800">
                  {dict.minimizedButtonText ||
                    (locale === 'he' ? 'תובנת נשמה' : 'Neshama Insight')}
                </h4>
                <p className="text-xs text-gray-500">
                  {canGenerateToday()
                    ? locale === 'he'
                      ? 'לחץ ליצירת תובנה מעודכנת'
                      : 'Click to generate updated insight'
                    : dict.alreadyGeneratedToday ||
                      (locale === 'he'
                        ? 'נוצרה היום - זמינה מחר'
                        : 'Generated today - Available tomorrow')}
                </p>
              </div>
            </div>
            <Button
              onClick={handleGenerateInsight}
              disabled={!canGenerate}
              size="sm"
              className={cn(
                'gap-1.5 rounded-full text-xs',
                canGenerate
                  ? 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {locale === 'he' ? 'צור מחדש' : 'Regenerate'}
            </Button>
          </div>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent
            className="max-w-4xl max-h-[90vh] overflow-y-auto"
            dir={direction}
          >
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                {dict.dialogTitle}
              </DialogTitle>
            </DialogHeader>
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-16 h-16 text-purple-600 animate-spin" />
                <p className="text-gray-600 text-lg">{dict.generating}</p>
                <p className="text-gray-500 text-sm">
                  {locale === 'he'
                    ? 'אנחנו מנתחים את הפרופיל שלך ויוצרים תובנה מותאמת אישית...'
                    : 'Analyzing your profile and creating personalized insights...'}
                </p>
              </div>
            ) : insightData ? (
              <NeshmaInsightDisplay
                data={insightData}
                locale={locale}
                dict={dict}
              />
            ) : null}
          </DialogContent>
        </Dialog>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="my-8 relative"
      >
        <button
          onClick={() => setIsMinimized(true)}
          className="absolute top-4 end-4 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all"
          aria-label={locale === 'he' ? 'הקטן' : 'Minimize'}
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition duration-500 animate-pulse"></div>
          <div className="relative bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 rounded-3xl p-8 shadow-xl border border-white/50 backdrop-blur-sm">
            <div className="text-center space-y-4">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
                className="flex justify-center"
              >
                <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 p-4 rounded-2xl shadow-lg">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
              </motion.div>
              <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent">
                {dict.buttonText}
              </h3>
              <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                {dict.buttonSubtitle}
              </p>
              <Button
                onClick={handleGenerateInsight}
                disabled={!canGenerate}
                size="lg"
                className={cn(
                  'mt-4 font-semibold px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-lg',
                  canGenerate
                    ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:from-purple-700 hover:via-pink-700 hover:to-cyan-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                )}
              >
                <Sparkles className="w-5 h-5 me-2" />
                {locale === 'he' ? 'קבלו את התובנה שלכם' : 'Get Your Insight'}
              </Button>
              {!canGenerateToday() && (
                <p className="text-xs text-orange-600 mt-2">
                  {dict.alreadyGeneratedToday ||
                    (locale === 'he'
                      ? 'כבר יצרת תובנה היום. נסה שוב מחר!'
                      : 'You already generated an insight today. Try again tomorrow!')}
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          dir={direction}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              {dict.dialogTitle}
            </DialogTitle>
          </DialogHeader>
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-16 h-16 text-purple-600 animate-spin" />
              <p className="text-gray-600 text-lg">{dict.generating}</p>
              <p className="text-gray-500 text-sm">
                {locale === 'he'
                  ? 'אנחנו מנתחים את הפרופיל שלך ויוצרים תובנה מותאמת אישית...'
                  : 'Analyzing your profile and creating personalized insights...'}
              </p>
            </div>
          ) : insightData ? (
            <NeshmaInsightDisplay
              data={insightData}
              locale={locale}
              dict={dict}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

const NeshmaInsightDisplay: React.FC<{
  data: any;
  locale: 'he' | 'en';
  dict: any;
}> = ({ data, locale, dict }) => {
  return (
    <div className="space-y-8 py-4">
      <InsightSection
        title={locale === 'he' ? '🌟 מי את/ה באמת' : '🌟 Who You Really Are'}
        content={data.whoYouAre}
        bgColor="from-purple-50 to-pink-50"
      />
      <InsightSection
        title={
          locale === 'he'
            ? '💫 השותף/ה שיתאים/תתאים לך'
            : '💫 Your Ideal Partner'
        }
        content={data.idealPartner}
        bgColor="from-pink-50 to-cyan-50"
      />
      <InsightSection
        title={
          locale === 'he'
            ? '🎯 איך להתכונן למפגש הראשון'
            : '🎯 Preparing for the First Meeting'
        }
        content={data.firstMeetingTips}
        bgColor="from-cyan-50 to-blue-50"
      />
      <InsightSection
        title={
          locale === 'he'
            ? '✨ הפוטנציאל הייחודי שלך'
            : '✨ Your Unique Potential'
        }
        content={data.uniquePotential}
        bgColor="from-blue-50 to-indigo-50"
      />
      <InsightSection
        title={locale === 'he' ? '🚀 הצעדים הבאים שלך' : '🚀 Your Next Steps'}
        content={data.nextSteps}
        bgColor="from-indigo-50 to-purple-50"
      />
      <div className="flex justify-center pt-4">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => handleDownloadPDF(data, locale)}
        >
          <Download className="w-4 h-4" />
          {dict.downloadPdf}
        </Button>
      </div>
    </div>
  );
};

const InsightSection: React.FC<{
  title: string;
  content: { summary: string; details: string[] };
  bgColor: string;
}> = ({ title, content, bgColor }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'p-6 rounded-2xl bg-gradient-to-br shadow-md border border-white/50',
        bgColor
      )}
    >
      <h3 className="text-xl font-bold mb-4 text-gray-800">{title}</h3>
      <p className="text-gray-700 leading-relaxed mb-4 text-base">
        {content.summary}
      </p>
      {content.details && content.details.length > 0 && (
        <ul className="space-y-2">
          {content.details.map((detail, index) => (
            <li key={index} className="flex items-start gap-2 text-gray-600">
              <span className="text-purple-600 mt-1">•</span>
              <span className="text-sm leading-relaxed">{detail}</span>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
};

const handleDownloadPDF = async (data: any, locale: 'he' | 'en') => {
  try {
    const { jsPDF } = await import('jspdf');
    toast.info(
      locale === 'he' ? 'מכין את קובץ ה-PDF...' : 'Preparing PDF file...'
    );

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    const isHebrew = locale === 'he';

    const fontResponse = await fetch('/fonts/Rubik-Regular.ttf');
    if (!fontResponse.ok) {
      throw new Error(
        "Font file not found. Make sure 'Rubik-Regular.ttf' is in the 'public/fonts' directory."
      );
    }
    const fontBlob = await fontResponse.blob();
    const reader = new FileReader();

    const fontPromise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject('Failed to read font file');
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(fontBlob);
    });

    const fontBase64 = await fontPromise;
    doc.addFileToVFS('Rubik-Regular.ttf', fontBase64);
    doc.addFont('Rubik-Regular.ttf', 'Rubik', 'normal');
    doc.setFont('Rubik');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let yPosition = margin;

    const H1_SIZE = 20,
      H2_SIZE = 14,
      BODY_SIZE = 10;
    const LINE_SPACING_H1 = 15,
      LINE_SPACING_H2 = 7,
      LINE_SPACING_BODY = 5;
    const SECTION_SPACING = 10,
      LIST_INDENT = 5;

    const addPageIfNeeded = () => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }
    };

    const writeText = (
      text: string | string[],
      x: number,
      y: number,
      options: TextOptionsLight = {}
    ) => {
      let finalOptions: TextOptionsLight = { ...options };
      let finalX = x;
      if (isHebrew) {
        finalOptions = { ...finalOptions, align: 'right' };
        finalX = pageWidth - margin;
      }
      doc.text(text, finalX, y, finalOptions);
    };

    doc.setFontSize(H1_SIZE);
    doc.setFont('Rubik', 'normal');
    const title = isHebrew ? 'תובנת נשמה' : 'Neshama Insight';
    // ✨ תיקון: קוראים לפונקציה הרגילה במקום ישירות ל-doc.text
    writeText(title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += LINE_SPACING_H1;

    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += SECTION_SPACING;

    const addSection = (
      title: string,
      content: { summary: string; details: string[] }
    ) => {
      addPageIfNeeded();
      doc.setFontSize(H2_SIZE);
      writeText(title, margin, yPosition);
      yPosition += LINE_SPACING_H2;

      doc.setFontSize(BODY_SIZE);
      const summaryLines = doc.splitTextToSize(content.summary, maxWidth);
      addPageIfNeeded();
      writeText(summaryLines, margin, yPosition);
      yPosition += summaryLines.length * LINE_SPACING_BODY + 5;

      if (content.details && content.details.length > 0) {
        content.details.forEach((detail: string) => {
          addPageIfNeeded();
          const detailText = `•  ${detail}`;
          const detailLines = doc.splitTextToSize(
            detailText,
            maxWidth - LIST_INDENT
          );
          const detailX = isHebrew
            ? pageWidth - margin - LIST_INDENT
            : margin + LIST_INDENT;
          // ✨ תיקון: מסירים את המאפיין lang שלא נתמך
          const detailOptions: TextOptionsLight = isHebrew
            ? { align: 'right' }
            : {};
          doc.text(detailLines, detailX, yPosition, detailOptions);
          yPosition += detailLines.length * LINE_SPACING_BODY + 3;
        });
      }
      yPosition += SECTION_SPACING;
    };

    const sections = [
      {
        title: isHebrew ? '🌟 מי את/ה באמת' : '🌟 Who You Really Are',
        content: data.whoYouAre,
      },
      {
        title: isHebrew
          ? '💫 השותף/ה שיתאים/תתאים לך'
          : '💫 Your Ideal Partner',
        content: data.idealPartner,
      },
      {
        title: isHebrew
          ? '🎯 איך להתכונן למפגש הראשון'
          : '🎯 Preparing for the First Meeting',
        content: data.firstMeetingTips,
      },
      {
        title: isHebrew
          ? '✨ הפוטנציאל הייחודי שלך'
          : '✨ Your Unique Potential',
        content: data.uniquePotential,
      },
      {
        title: isHebrew ? '🚀 הצעדים הבאים שלך' : '🚀 Your Next Steps',
        content: data.nextSteps,
      },
    ];
    sections.forEach((section) => addSection(section.title, section.content));

    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const footerText = isHebrew
        ? 'נוצר על ידי NeshamaTech - מערכת שידוכים מתקדמת'
        : 'Created by NeshamaTech - Advanced Matchmaking System';
      doc.setFontSize(8);
      doc.setTextColor(150);
      // ✨ תיקון: משתמשים ב-TextOptionsLight
      const footerOptions: TextOptionsLight = { align: 'center' };
      doc.text(footerText, pageWidth / 2, pageHeight - 10, footerOptions);
    }

    const filename = isHebrew ? 'תובנת-נשמה.pdf' : 'neshama-insight.pdf';
    doc.save(filename);

    toast.success(
      isHebrew ? 'הקובץ הורד בהצלחה!' : 'File downloaded successfully!'
    );
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.error(locale === 'he' ? 'שגיאה ביצירת PDF' : 'Error generating PDF');
  }
};
