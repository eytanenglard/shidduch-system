// src/app/[locale]/(authenticated)/profile/components/dashboard/NeshmaInsightButton.tsx

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sparkles, Loader2, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NeshmaInsightButtonProps {
  userId: string;
  locale: 'he' | 'en';
  dict: {
    buttonText: string;
    buttonSubtitle: string;
    dialogTitle: string;
    generating: string;
    downloadPdf: string;
    close: string;
  };
}

export const NeshmaInsightButton: React.FC<NeshmaInsightButtonProps> = ({
  userId,
  locale,
  dict,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [insightData, setInsightData] = useState<any>(null);
  const direction = locale === 'he' ? 'rtl' : 'ltr';

  const handleGenerateInsight = async () => {
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
        throw new Error('Failed to generate insight');
      }

      const data = await response.json();
      setInsightData(data.insight);
      toast.success(
        locale === 'he'
          ? 'התובנה נוצרה בהצלחה!'
          : 'Insight generated successfully!'
      );
    } catch (error) {
      console.error('Error generating insight:', error);
      toast.error(
        locale === 'he'
          ? 'אירעה שגיאה ביצירת התובנה'
          : 'Error generating insight'
      );
      setIsOpen(false);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="my-8"
      >
        <div className="relative group">
          {/* Magical glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition duration-500 animate-pulse"></div>

          <div className="relative bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 rounded-3xl p-8 shadow-xl border border-white/50 backdrop-blur-sm">
            <div className="text-center space-y-4">
              {/* Icon */}
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1],
                }}
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

              {/* Title */}
              <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent">
                {dict.buttonText}
              </h3>

              {/* Subtitle */}
              <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                {dict.buttonSubtitle}
              </p>

              {/* CTA Button */}
              <Button
                onClick={handleGenerateInsight}
                size="lg"
                className="mt-4 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:from-purple-700 hover:via-pink-700 hover:to-cyan-700 text-white font-semibold px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-lg"
              >
                <Sparkles className="w-5 h-5 me-2" />
                {locale === 'he' ? 'קבלו את התובנה שלכם' : 'Get Your Insight'}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Dialog */}
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

// Component to display the insight
const NeshmaInsightDisplay: React.FC<{
  data: any;
  locale: 'he' | 'en';
  dict: any;
}> = ({ data, locale, dict }) => {
  return (
    <div className="space-y-8 py-4">
      {/* Part 1: Who You Really Are */}
      <InsightSection
        title={locale === 'he' ? '🌟 מי את/ה באמת' : '🌟 Who You Really Are'}
        content={data.whoYouAre}
        bgColor="from-purple-50 to-pink-50"
      />

      {/* Part 2: Your Ideal Partner */}
      <InsightSection
        title={
          locale === 'he'
            ? '💫 השותף/ה שיתאים/תתאים לך'
            : '💫 Your Ideal Partner'
        }
        content={data.idealPartner}
        bgColor="from-pink-50 to-cyan-50"
      />

      {/* Part 3: Preparing for the First Meeting */}
      <InsightSection
        title={
          locale === 'he'
            ? '🎯 איך להתכונן למפגש הראשון'
            : '🎯 Preparing for the First Meeting'
        }
        content={data.firstMeetingTips}
        bgColor="from-cyan-50 to-blue-50"
      />

      {/* Part 4: Your Unique Potential */}
      <InsightSection
        title={
          locale === 'he'
            ? '✨ הפוטנציאל הייחודי שלך'
            : '✨ Your Unique Potential'
        }
        content={data.uniquePotential}
        bgColor="from-blue-50 to-indigo-50"
      />

      {/* Part 5: Next Steps */}
      <InsightSection
        title={locale === 'he' ? '🚀 הצעדים הבאים שלך' : '🚀 Your Next Steps'}
        content={data.nextSteps}
        bgColor="from-indigo-50 to-purple-50"
      />

      {/* Download Button */}
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
  content: {
    summary: string;
    details: string[];
  };
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

// Helper function to download the insight as PDF
const handleDownloadPDF = async (data: any, locale: 'he' | 'en') => {
  try {
    // Dynamic import to reduce bundle size
    const { jsPDF } = await import('jspdf');

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const isHebrew = locale === 'he';
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let yPosition = margin;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    const title = isHebrew ? 'תובנת נשמה' : 'Neshama Insight';
    doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Add a line
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Helper function to add section
    const addSection = (
      title: string,
      content: { summary: string; details: string[] }
    ) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }

      // Section title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin, yPosition);
      yPosition += 7;

      // Summary
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const summaryLines = doc.splitTextToSize(content.summary, maxWidth);
      doc.text(summaryLines, margin, yPosition);
      yPosition += summaryLines.length * 5 + 5;

      // Details
      if (content.details && content.details.length > 0) {
        content.details.forEach((detail: string) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = margin;
          }

          const detailLines = doc.splitTextToSize(`• ${detail}`, maxWidth - 5);
          doc.text(detailLines, margin + 5, yPosition);
          yPosition += detailLines.length * 5 + 3;
        });
      }

      yPosition += 5;
    };

    // Add all sections
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

    sections.forEach((section) => {
      addSection(section.title, section.content);
    });

    // Footer on last page
    const footerText = isHebrew
      ? 'נוצר על ידי NeshamaTech - מערכת שידוכים מתקדמת'
      : 'Created by NeshamaTech - Advanced Matchmaking System';
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Save the PDF
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
