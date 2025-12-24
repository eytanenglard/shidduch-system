// src/lib/pdf/insightPdfGenerator.ts
import { toast } from 'sonner';
import type { TextOptionsLight } from 'jspdf';

export const generateInsightPdf = async (data: any, locale: 'he' | 'en') => {
  try {
    // Dynamic import to avoid SSR issues
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

    // טעינת הפונט - וודא שהקובץ קיים בתיקיית public/fonts
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
    const title = isHebrew ? 'התמונה המלאה שלך' : 'Your Full Picture';
    writeText(title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += LINE_SPACING_H1;

    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += SECTION_SPACING;

    const addSection = (
      title: string,
      content: { summary: string; details: string[] }
    ) => {
      if (!content) return; // הגנה למקרה שחסר מידע
      
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
      const footerOptions: TextOptionsLight = { align: 'center' };
      doc.text(footerText, pageWidth / 2, pageHeight - 10, footerOptions);
    }

    const filename = isHebrew ? 'התמונה-המלאה-שלי.pdf' : 'my-full-picture.pdf';
    doc.save(filename);

    toast.success(
      isHebrew ? 'הקובץ הורד בהצלחה!' : 'File downloaded successfully!'
    );
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.error(locale === 'he' ? 'שגיאה ביצירת PDF' : 'Error generating PDF');
  }
};