// src/lib/pdf/insightPdfGenerator.ts
// =====================================================
// מחולל PDF - גרסה 4.0
// תיקון: טיפול נכון בטקסט עברי
// =====================================================

import { toast } from 'sonner';
import {
  prepareHebrewText,
  formatHebrewDate,
  formatDateNumbers,
  getRandomQuote,
  NESHAMA_COLORS,
  SECTION_INFO,
  getSectionInfo,
  generateUniqueId,
  type SectionType,
} from './hebrewPdfUtils';

// =====================================================
// טיפוסים
// =====================================================

interface InsightSection {
  summary: string;
  details: string[];
}

interface KeyStrength {
  title: string;
  description: string;
}

interface InsightData {
  whoYouAre: InsightSection;
  idealPartner: InsightSection;
  firstMeetingTips: InsightSection;
  uniquePotential: InsightSection;
  nextSteps: InsightSection;
  keyStrengths?: KeyStrength[];
  growthAreas?: string[];
  oneLiner?: string;
  threeThingsToRemember?: string[];
  userName?: string;
  generatedAt?: string;
  profileCompletionPercent?: number;
}

// =====================================================
// קונפיגורציה
// =====================================================

const CONFIG = {
  PAGE: {
    WIDTH: 210,
    HEIGHT: 297,
    MARGIN: 18,
  },
  FONTS: {
    TITLE: 26,
    SUBTITLE: 15,
    SECTION_TITLE: 12,
    BODY: 10,
    SMALL: 9,
    TINY: 7,
    FOOTER: 8,
  },
  SPACING: {
    SECTION: 14,
    PARAGRAPH: 7,
    LINE: 5.2,
    BULLET: 3.5,
  },
};

// =====================================================
// פונקציה ראשית
// =====================================================

export const generateInsightPdf = async (
  data: InsightData,
  locale: 'he' | 'en'
) => {
  try {
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.jsPDF;

    const toastId = toast.loading(
      locale === 'he'
        ? '✨ יוצר את הדוח האישי שלך...'
        : '✨ Creating your personal report...',
      { duration: Infinity }
    );

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const isHebrew = locale === 'he';
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = CONFIG.PAGE.MARGIN;
    const maxWidth = pageWidth - margin * 2;

    // מטא-דאטה
    doc.setProperties({
      title: isHebrew ? 'התמונה המלאה שלך - NeshamaTech' : 'Your Full Picture - NeshamaTech',
      author: 'NeshamaTech',
      subject: isHebrew ? 'דוח תובנות אישי' : 'Personal Insight Report',
      keywords: 'NeshamaTech, dating, matchmaking, insight',
      creator: 'NeshamaTech Platform',
    });

    // טעינת פונט
    await loadFont(doc);

    // === עמוד 1: כותרת ===
    drawCoverPage(doc, isHebrew, data, pageWidth, pageHeight, margin);

    // === עמוד 2: ציטוט + תוכן ===
    doc.addPage();
    let yPos = margin;

    // ציטוט מעורר השראה
    yPos = drawQuoteBox(doc, isHebrew, yPos, maxWidth, margin, pageWidth);
    yPos += 10;

    // One-liner אישי
    if (data.oneLiner) {
      yPos = drawOneLiner(doc, data.oneLiner, isHebrew, yPos, maxWidth, margin, pageWidth);
      yPos += 10;
    }

    // מי את/ה באמת
    if (data.whoYouAre) {
      yPos = drawSection(doc, 'whoYouAre', data.whoYouAre, yPos, isHebrew, maxWidth, margin, pageWidth, pageHeight);
    }

    // סקציות נוספות
    const sections: Array<{ key: SectionType; content: InsightSection | undefined }> = [
      { key: 'idealPartner', content: data.idealPartner },
      { key: 'firstMeetingTips', content: data.firstMeetingTips },
      { key: 'uniquePotential', content: data.uniquePotential },
      { key: 'nextSteps', content: data.nextSteps },
    ];

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (!section.content) {
        continue;
      }

      if (yPos > pageHeight - 80) {
        doc.addPage();
        yPos = margin + 5;
      }

      yPos = drawSection(doc, section.key, section.content, yPos, isHebrew, maxWidth, margin, pageWidth, pageHeight);
      yPos += CONFIG.SPACING.SECTION;
    }

    // נקודות חוזק
    if (data.keyStrengths && data.keyStrengths.length > 0) {
      if (yPos > pageHeight - 100) {
        doc.addPage();
        yPos = margin + 5;
      }
      yPos = drawStrengthsSection(doc, data.keyStrengths, isHebrew, yPos, maxWidth, margin, pageWidth);
    }

    // 3 דברים לזכור
    if (data.threeThingsToRemember && data.threeThingsToRemember.length > 0) {
      if (yPos > pageHeight - 70) {
        doc.addPage();
        yPos = margin + 5;
      }
      yPos = drawThreeThingsBox(doc, data.threeThingsToRemember, isHebrew, yPos, maxWidth, margin, pageWidth);
    }

    // עמוד סיכום
    doc.addPage();
    drawSummaryPage(doc, isHebrew, data, pageWidth, pageHeight);

    // Footer בכל העמודים
    addFooterToAllPages(doc, isHebrew, pageWidth, pageHeight, margin);

    // Header בכל העמודים (חוץ מהראשון והאחרון)
    addHeaderToPages(doc, isHebrew, data.userName, pageWidth, margin);

    // שמירה
    const uniqueId = generateUniqueId().slice(-6);
    const filename = isHebrew
      ? 'התמונה-המלאה-שלי-' + uniqueId + '.pdf'
      : 'my-full-picture-' + uniqueId + '.pdf';

    doc.save(filename);

    toast.dismiss(toastId);
    toast.success(
      isHebrew
        ? '🎉 הדוח הורד בהצלחה! בהצלחה במסע'
        : '🎉 Report downloaded! Good luck on your journey',
      { duration: 4000 }
    );
  } catch (error) {
    console.error('PDF generation error:', error);
    toast.error(
      locale === 'he'
        ? '😕 שגיאה ביצירת הדוח. נסה שוב'
        : '😕 Error creating report. Please try again'
    );
  }
};

// =====================================================
// טעינת פונט
// =====================================================

async function loadFont(doc: any): Promise<void> {
  try {
    const fontResponse = await fetch('/fonts/Rubik-Regular.ttf');
    if (!fontResponse.ok) {
      throw new Error('Font not found');
    }

    const fontBlob = await fontResponse.blob();
    const fontBase64 = await blobToBase64(fontBlob);

    doc.addFileToVFS('Rubik-Regular.ttf', fontBase64);
    doc.addFont('Rubik-Regular.ttf', 'Rubik', 'normal');
    doc.setFont('Rubik');
  } catch (error) {
    console.warn('Font loading failed, using default:', error);
    doc.setFont('helvetica');
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.onloadend = function () {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert blob'));
      }
    };
    reader.onerror = function () {
      reject(new Error('FileReader error'));
    };
    reader.readAsDataURL(blob);
  });
}

// =====================================================
// עמוד כותרת
// =====================================================

function drawCoverPage(
  doc: any,
  isHebrew: boolean,
  data: InsightData,
  pageWidth: number,
  pageHeight: number,
  margin: number
): void {
  const centerX = pageWidth / 2;

  // רקע גרדיאנט
  drawGradientBackground(doc, pageWidth, pageHeight);

  // עיגולים דקורטיביים
  drawDecorativeCircles(doc, pageWidth, pageHeight);

  let yPos = 55;

  // קו דקורטיבי עליון
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.8);
  doc.line(centerX - 50, yPos, centerX + 50, yPos);
  yPos += 20;

  // כותרת ראשית
  doc.setFontSize(CONFIG.FONTS.TITLE + 6);
  doc.setTextColor(30, 41, 59);
  const mainTitle = isHebrew ? 'התמונה המלאה שלך' : 'Your Full Picture';
  doc.text(mainTitle, centerX, yPos, { align: 'center' });
  yPos += 12;

  // תת-כותרת
  doc.setFontSize(CONFIG.FONTS.SUBTITLE);
  doc.setTextColor(100, 116, 139);
  const subtitle = isHebrew
    ? 'תובנות עמוקות על האישיות, הערכים והזוגיות שלך'
    : 'Deep insights into your personality, values & relationships';
  doc.text(subtitle, centerX, yPos, { align: 'center' });
  yPos += 25;

  // קו דקורטיבי
  doc.setDrawColor(236, 72, 153);
  doc.setLineWidth(0.5);
  doc.line(centerX - 35, yPos, centerX + 35, yPos);
  yPos += 30;

  // אייקון יהלום
  drawDiamondIcon(doc, centerX, yPos, 30);
  yPos += 55;

  // שם המשתמש
  if (data.userName) {
    doc.setFontSize(CONFIG.FONTS.SUBTITLE + 4);
    doc.setTextColor(99, 102, 241);
    const nameLabel = isHebrew
      ? 'הוכן עבור: ' + data.userName
      : 'Prepared for: ' + data.userName;
    doc.text(nameLabel, centerX, yPos, { align: 'center' });
    yPos += 15;
  }

  // תאריך
  doc.setFontSize(CONFIG.FONTS.SMALL);
  doc.setTextColor(148, 163, 184);
  const today = new Date();

  if (isHebrew) {
    const hebrewDate = formatHebrewDate(today);
    const numericDate = formatDateNumbers(today);
    const dateText = hebrewDate + ' (' + numericDate + ')';
    doc.text(dateText, centerX, yPos, { align: 'center' });
  } else {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    const dateText = today.toLocaleDateString('en-US', options);
    doc.text(dateText, centerX, yPos, { align: 'center' });
  }
  yPos += 25;

  // אחוז השלמת פרופיל
  if (data.profileCompletionPercent !== undefined) {
    drawCompletionBadge(doc, centerX, yPos, data.profileCompletionPercent, isHebrew);
    yPos += 25;
  }

  // Footer של עמוד הכותרת
  doc.setFontSize(CONFIG.FONTS.FOOTER + 1);
  doc.setTextColor(148, 163, 184);

  doc.text('NeshamaTech', centerX, pageHeight - 25, { align: 'center' });

  const footerTagline = isHebrew ? 'כי נשמה פוגשת טכנולוגיה' : 'Where Soul Meets Technology';
  doc.text(footerTagline, centerX, pageHeight - 18, { align: 'center' });
}

// =====================================================
// אלמנטים דקורטיביים
// =====================================================

function drawGradientBackground(doc: any, width: number, height: number): void {
  const steps = 60;
  for (let i = 0; i < steps; i++) {
    const ratio = i / steps;
    const r = Math.round(255 - (255 - 248) * ratio * 0.3);
    const g = Math.round(255 - (255 - 250) * ratio * 0.3);
    const b = Math.round(255 - (255 - 252) * ratio * 0.2);
    doc.setFillColor(r, g, b);
    const stepHeight = height / steps;
    doc.rect(0, stepHeight * i, width, stepHeight + 1, 'F');
  }
}

function drawDecorativeCircles(doc: any, width: number, height: number): void {
  // עיגול גדול - פינה ימנית עליונה
  doc.setFillColor(245, 245, 252);
  doc.circle(width + 20, -20, 100, 'F');

  // עיגול בינוני - פינה שמאלית תחתונה
  doc.setFillColor(252, 245, 249);
  doc.circle(-30, height + 30, 120, 'F');

  // עיגול קטן - מרכז ימין
  doc.setFillColor(254, 250, 245);
  doc.circle(width - 20, height / 2, 50, 'F');
}

function drawDiamondIcon(doc: any, x: number, y: number, size: number): void {
  // צל
  doc.setFillColor(220, 220, 230);
  doc.triangle(
    x + 2,
    y - size + 2,
    x - size + 2,
    y + 2,
    x + size + 2,
    y + 2,
    'F'
  );

  // משולש עליון
  doc.setFillColor(99, 102, 241);
  doc.triangle(x, y - size, x - size, y, x + size, y, 'F');

  // משולש תחתון
  doc.setFillColor(139, 92, 246);
  doc.triangle(x - size, y, x + size, y, x, y + size * 1.3, 'F');

  // נצנוץ
  doc.setFillColor(255, 255, 255);
  doc.circle(x - size / 3, y - size / 2.5, 4, 'F');
  doc.circle(x + size / 5, y - size / 4, 2, 'F');
}

function drawCompletionBadge(
  doc: any,
  x: number,
  y: number,
  percent: number,
  isHebrew: boolean
): void {
  const badgeWidth = 80;
  const badgeHeight = 24;

  // רקע
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(x - badgeWidth / 2, y - badgeHeight / 2, badgeWidth, badgeHeight, 4, 4, 'F');

  // מסגרת
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(0.5);
  doc.roundedRect(x - badgeWidth / 2, y - badgeHeight / 2, badgeWidth, badgeHeight, 4, 4, 'S');

  // טקסט
  doc.setFontSize(CONFIG.FONTS.SMALL);
  doc.setTextColor(34, 197, 94);
  const badgeText = isHebrew ? percent + '% הושלם' : percent + '% Complete';
  doc.text(badgeText, x, y + 3, { align: 'center' });
}

// =====================================================
// תיבת ציטוט
// =====================================================

function drawQuoteBox(
  doc: any,
  isHebrew: boolean,
  startY: number,
  maxWidth: number,
  margin: number,
  pageWidth: number
): number {
  const quote = getRandomQuote(isHebrew);

  const boxHeight = 35;
  const boxY = startY;

  // רקע
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, boxY, maxWidth, boxHeight, 4, 4, 'F');

  // פס צד צבעוני
  doc.setFillColor(99, 102, 241);
  if (isHebrew) {
    doc.rect(pageWidth - margin - 3, boxY, 3, boxHeight, 'F');
  } else {
    doc.rect(margin, boxY, 3, boxHeight, 'F');
  }

  // גרשיים פתיחה
  doc.setFontSize(24);
  doc.setTextColor(200, 202, 248);
  if (isHebrew) {
    doc.text('״', pageWidth - margin - 12, boxY + 14);
  } else {
    doc.text('"', margin + 8, boxY + 14);
  }

  // טקסט הציטוט
  doc.setFontSize(CONFIG.FONTS.BODY);
  doc.setTextColor(51, 65, 85);

  if (isHebrew) {
    doc.text(quote.text, pageWidth - margin - 10, boxY + 15, {
      align: 'right',
      maxWidth: maxWidth - 20,
    });
  } else {
    doc.text(quote.text, margin + 10, boxY + 15, { maxWidth: maxWidth - 20 });
  }

  // מקור הציטוט
  doc.setFontSize(CONFIG.FONTS.SMALL);
  doc.setTextColor(148, 163, 184);
  const authorText = '— ' + quote.author;

  if (isHebrew) {
    doc.text(authorText, margin + 10, boxY + boxHeight - 8);
  } else {
    doc.text(authorText, pageWidth - margin - 10, boxY + boxHeight - 8, { align: 'right' });
  }

  return boxY + boxHeight;
}

// =====================================================
// One-Liner אישי
// =====================================================

function drawOneLiner(
  doc: any,
  text: string,
  isHebrew: boolean,
  startY: number,
  maxWidth: number,
  margin: number,
  pageWidth: number
): number {
  const centerX = pageWidth / 2;

  // מסגרת
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(margin + 10, startY, maxWidth - 20, 22, 4, 4, 'F');

  // אייקון
  doc.setFontSize(14);
  if (isHebrew) {
    doc.text('💎', pageWidth - margin - 18, startY + 14);
  } else {
    doc.text('💎', margin + 18, startY + 14);
  }

  // טקסט
  doc.setFontSize(CONFIG.FONTS.BODY + 1);
  doc.setTextColor(120, 53, 15);
  doc.text(text, centerX, startY + 14, { align: 'center' });

  return startY + 26;
}

// =====================================================
// ציור סקציה
// =====================================================

function drawSection(
  doc: any,
  sectionKey: SectionType,
  content: InsightSection,
  startY: number,
  isHebrew: boolean,
  maxWidth: number,
  margin: number,
  pageWidth: number,
  pageHeight: number
): number {
  const info = getSectionInfo(sectionKey);
  let yPos = startY;

  // בדיקת עמוד חדש
  if (yPos > pageHeight - 70) {
    doc.addPage();
    yPos = margin + 10;
  }

  // === כותרת סקציה ===
  const headerHeight = 11;
  doc.setFillColor(info.color.r, info.color.g, info.color.b);
  doc.roundedRect(margin, yPos - 2, maxWidth, headerHeight, 3, 3, 'F');

  doc.setFontSize(CONFIG.FONTS.SECTION_TITLE);
  doc.setTextColor(255, 255, 255);

  // הכותרת עם אימוג'י
  const title = isHebrew ? info.titleHe : info.titleEn;
  const displayTitle = info.emoji + ' ' + title;

  if (isHebrew) {
    doc.text(displayTitle, pageWidth - margin - 5, yPos + 6, { align: 'right' });
  } else {
    doc.text(displayTitle, margin + 5, yPos + 6);
  }

  yPos += headerHeight + CONFIG.SPACING.PARAGRAPH;

  // === תקציר ===
  doc.setFontSize(CONFIG.FONTS.BODY);
  doc.setTextColor(30, 41, 59);

  const summaryLines = doc.splitTextToSize(content.summary, maxWidth - 8);
  for (let i = 0; i < summaryLines.length; i++) {
    const line = summaryLines[i];
    if (yPos > pageHeight - 25) {
      doc.addPage();
      yPos = margin + 10;
    }

    if (isHebrew) {
      doc.text(line, pageWidth - margin - 4, yPos, { align: 'right' });
    } else {
      doc.text(line, margin + 4, yPos);
    }
    yPos += CONFIG.SPACING.LINE;
  }

  yPos += CONFIG.SPACING.PARAGRAPH - 2;

  // === פרטים ===
  if (content.details && content.details.length > 0) {
    for (let i = 0; i < content.details.length; i++) {
      const detail = content.details[i];

      if (yPos > pageHeight - 25) {
        doc.addPage();
        yPos = margin + 10;
      }

      // נקודה צבעונית
      const bulletX = isHebrew ? pageWidth - margin - 4 : margin + 4;
      doc.setFillColor(info.color.r, info.color.g, info.color.b);
      doc.circle(bulletX, yPos - 1.2, 1.3, 'F');

      // טקסט
      doc.setFontSize(CONFIG.FONTS.BODY);
      doc.setTextColor(51, 65, 85);
      const detailLines = doc.splitTextToSize(detail, maxWidth - 14);

      for (let j = 0; j < detailLines.length; j++) {
        const detailLine = detailLines[j];
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = margin + 10;
        }

        if (isHebrew) {
          doc.text(detailLine, pageWidth - margin - 9, yPos, { align: 'right' });
        } else {
          doc.text(detailLine, margin + 9, yPos);
        }
        yPos += CONFIG.SPACING.LINE;
      }

      yPos += CONFIG.SPACING.BULLET;
    }
  }

  return yPos;
}

// =====================================================
// סקציית נקודות חוזק
// =====================================================

function drawStrengthsSection(
  doc: any,
  strengths: KeyStrength[],
  isHebrew: boolean,
  startY: number,
  maxWidth: number,
  margin: number,
  pageWidth: number
): number {
  const info = getSectionInfo('keyStrengths');
  let yPos = startY;

  // כותרת
  const headerHeight = 11;
  doc.setFillColor(info.color.r, info.color.g, info.color.b);
  doc.roundedRect(margin, yPos - 2, maxWidth, headerHeight, 3, 3, 'F');

  doc.setFontSize(CONFIG.FONTS.SECTION_TITLE);
  doc.setTextColor(255, 255, 255);
  const title = info.emoji + ' ' + (isHebrew ? info.titleHe : info.titleEn);

  if (isHebrew) {
    doc.text(title, pageWidth - margin - 5, yPos + 6, { align: 'right' });
  } else {
    doc.text(title, margin + 5, yPos + 6);
  }

  yPos += headerHeight + CONFIG.SPACING.PARAGRAPH;

  // חוזקות בצורת "כרטיסים"
  for (let i = 0; i < strengths.length; i++) {
    const strength = strengths[i];

    // רקע כרטיס
    doc.setFillColor(254, 252, 232);
    doc.roundedRect(margin + 2, yPos - 2, maxWidth - 4, 18, 2, 2, 'F');

    // כותרת החוזקה
    doc.setFontSize(CONFIG.FONTS.BODY);
    doc.setTextColor(120, 53, 15);
    const strengthTitle = '⭐ ' + strength.title;

    if (isHebrew) {
      doc.text(strengthTitle, pageWidth - margin - 8, yPos + 5, { align: 'right' });
    } else {
      doc.text(strengthTitle, margin + 8, yPos + 5);
    }

    // תיאור
    doc.setFontSize(CONFIG.FONTS.SMALL);
    doc.setTextColor(71, 85, 105);

    if (isHebrew) {
      doc.text(strength.description, pageWidth - margin - 8, yPos + 12, {
        align: 'right',
        maxWidth: maxWidth - 20,
      });
    } else {
      doc.text(strength.description, margin + 8, yPos + 12, { maxWidth: maxWidth - 20 });
    }

    yPos += 22;
  }

  return yPos;
}

// =====================================================
// תיבת "3 דברים לזכור"
// =====================================================

function drawThreeThingsBox(
  doc: any,
  things: string[],
  isHebrew: boolean,
  startY: number,
  maxWidth: number,
  margin: number,
  pageWidth: number
): number {
  const boxHeight = 50;

  // רקע
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(margin, startY, maxWidth, boxHeight, 5, 5, 'F');

  // מסגרת
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, startY, maxWidth, boxHeight, 5, 5, 'S');

  // כותרת
  doc.setFontSize(CONFIG.FONTS.BODY + 1);
  doc.setTextColor(30, 64, 175);
  const boxTitle = isHebrew ? '🎯 3 דברים לזכור' : '🎯 3 Things to Remember';
  doc.text(boxTitle, pageWidth / 2, startY + 10, { align: 'center' });

  // הפריטים
  doc.setFontSize(CONFIG.FONTS.BODY);
  doc.setTextColor(51, 65, 85);

  let itemY = startY + 20;
  const itemsToShow = things.slice(0, 3);

  for (let i = 0; i < itemsToShow.length; i++) {
    const thing = itemsToShow[i];
    const number = (i + 1) + '.';

    if (isHebrew) {
      doc.text(number + ' ' + thing, pageWidth - margin - 10, itemY, { align: 'right' });
    } else {
      doc.text(number + ' ' + thing, margin + 10, itemY);
    }
    itemY += 9;
  }

  return startY + boxHeight + 5;
}

// =====================================================
// עמוד סיכום
// =====================================================

function drawSummaryPage(
  doc: any,
  isHebrew: boolean,
  data: InsightData,
  pageWidth: number,
  pageHeight: number
): void {
  const centerX = pageWidth / 2;

  // רקע עדין
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  let yPos = 50;

  // כותרת
  doc.setFontSize(CONFIG.FONTS.TITLE);
  doc.setTextColor(30, 41, 59);
  const summaryTitle = isHebrew ? 'לסיכום...' : 'In Summary...';
  doc.text(summaryTitle, centerX, yPos, { align: 'center' });
  yPos += 20;

  // קו דקורטיבי
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.5);
  doc.line(centerX - 30, yPos, centerX + 30, yPos);
  yPos += 25;

  // מסר מעצים
  doc.setFontSize(CONFIG.FONTS.BODY + 2);
  doc.setTextColor(71, 85, 105);

  const userName = data.userName || (isHebrew ? 'יקר/ה' : 'Dear one');

  let closingMessages: string[];
  if (isHebrew) {
    closingMessages = [
      userName + ', עברת מסע משמעותי של גילוי עצמי.',
      'הדוח הזה הוא רק נקודת התחלה - המשך להקשיב לעצמך,',
      'להאמין בערך הייחודי שאתה מביא/ה לעולם,',
      'ולזכור שהזוגיות הנכונה תגיע בזמן הנכון.',
      '',
      'בהצלחה במסע! 💜',
    ];
  } else {
    closingMessages = [
      userName + ', you have been on a meaningful journey of self-discovery.',
      'This report is just the beginning - keep listening to yourself,',
      'believing in the unique value you bring to the world,',
      'and remember that the right partnership will come at the right time.',
      '',
      'Good luck on your journey! 💜',
    ];
  }

  for (let i = 0; i < closingMessages.length; i++) {
    const line = closingMessages[i];
    doc.text(line, centerX, yPos, { align: 'center' });
    yPos += 8;
  }

  yPos += 20;

  // יהלום קטן
  drawDiamondIcon(doc, centerX, yPos, 15);
  yPos += 40;

  // פרטי יצירה
  doc.setFontSize(CONFIG.FONTS.TINY);
  doc.setTextColor(148, 163, 184);

  const createdText = isHebrew
    ? 'נוצר ב-' + formatDateNumbers(new Date())
    : 'Created on ' + new Date().toLocaleDateString('en-US');
  doc.text(createdText, centerX, yPos, { align: 'center' });

  yPos += 6;
  doc.text('NeshamaTech © 2025', centerX, yPos, { align: 'center' });
}

// =====================================================
// Header
// =====================================================

function addHeaderToPages(
  doc: any,
  isHebrew: boolean,
  userName: string | undefined,
  pageWidth: number,
  margin: number
): void {
  const pageCount = doc.internal.getNumberOfPages();

  // מתחילים מעמוד 2, לא כולל עמוד הסיכום (האחרון)
  for (let i = 2; i < pageCount; i++) {
    doc.setPage(i);

    // קו הפרדה עדין
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, 12, pageWidth - margin, 12);

    // שם + לוגו
    doc.setFontSize(CONFIG.FONTS.TINY);
    doc.setTextColor(148, 163, 184);

    doc.text('NeshamaTech', margin, 8);
    if (userName) {
      if (isHebrew) {
        doc.text(userName, pageWidth - margin, 8, { align: 'right' });
      } else {
        doc.text(userName, pageWidth - margin, 8, { align: 'right' });
      }
    }
  }
}

// =====================================================
// Footer
// =====================================================

function addFooterToAllPages(
  doc: any,
  isHebrew: boolean,
  pageWidth: number,
  pageHeight: number,
  margin: number
): void {
  const pageCount = doc.internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // קו הפרדה
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

    doc.setFontSize(CONFIG.FONTS.FOOTER);
    doc.setTextColor(148, 163, 184);

    // טקסט מרכזי (לא בעמוד הראשון שכבר יש לו footer)
    if (i > 1) {
      const centerText = isHebrew ? 'מערכת שידוכים מתקדמת' : 'Advanced Matchmaking System';
      // טקסט מעורב - משתמשים ב-prepareHebrewText
      const footerText = prepareHebrewText('NeshamaTech - ' + centerText);
      doc.text(footerText, pageWidth / 2, pageHeight - 8, { align: 'center' });
    }

    // מספר עמוד
    const pageNumText = isHebrew
      ? 'עמוד ' + i + ' מתוך ' + pageCount
      : 'Page ' + i + ' of ' + pageCount;

    if (isHebrew) {
      doc.text(pageNumText, margin, pageHeight - 8);
    } else {
      doc.text(pageNumText, pageWidth - margin, pageHeight - 8, { align: 'right' });
    }
  }
}

export default generateInsightPdf;