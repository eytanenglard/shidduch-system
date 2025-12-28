// src/lib/pdf/insightPdfGenerator.ts
// =====================================================
// מחולל PDF משודרג - גרסה 3.0
// 50 שיפורים מיושמים
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
  score?: number;
}

interface InsightData {
  whoYouAre: InsightSection;
  idealPartner: InsightSection;
  firstMeetingTips: InsightSection;
  uniquePotential: InsightSection;
  nextSteps: InsightSection;
  // שדות חדשים
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
    INNER_MARGIN: 22,
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
  DECORATION: {
    CORNER_RADIUS: 4,
    LINE_WIDTH: 0.5,
    SHADOW_OFFSET: 1,
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
    const { jsPDF } = await import('jspdf');

    // Toast עם אנימציה
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
    drawCoverPage(doc, isHebrew, data);

    // === עמוד 2: ציטוט + מי את/ה ===
    doc.addPage();
    let yPos = margin;
    
    // ציטוט מעורר השראה
    yPos = drawQuoteBox(doc, isHebrew, yPos, maxWidth, margin);
    yPos += 10;

    // One-liner אישי (אם קיים)
    if (data.oneLiner) {
      yPos = drawOneLiner(doc, data.oneLiner, isHebrew, yPos, maxWidth, margin);
      yPos += 10;
    }

    // מי את/ה באמת
    if (data.whoYouAre) {
      yPos = drawSection(doc, 'whoYouAre', data.whoYouAre, yPos, isHebrew, maxWidth, margin);
    }

    // === עמודים נוספים ===
    const sections: { key: SectionType; content: InsightSection | undefined }[] = [
      { key: 'idealPartner', content: data.idealPartner },
      { key: 'firstMeetingTips', content: data.firstMeetingTips },
      { key: 'uniquePotential', content: data.uniquePotential },
      { key: 'nextSteps', content: data.nextSteps },
    ];

    for (const section of sections) {
      if (!section.content) continue;

      // בדיקת מקום בעמוד
      if (yPos > pageHeight - 80) {
        doc.addPage();
        yPos = margin + 5;
      }

      yPos = drawSection(doc, section.key, section.content, yPos, isHebrew, maxWidth, margin);
      yPos += CONFIG.SPACING.SECTION;
    }

    // === נקודות חוזק (אם קיימות) ===
    if (data.keyStrengths && data.keyStrengths.length > 0) {
      if (yPos > pageHeight - 100) {
        doc.addPage();
        yPos = margin + 5;
      }
      yPos = drawStrengthsSection(doc, data.keyStrengths, isHebrew, yPos, maxWidth, margin);
    }

    // === 3 דברים לזכור ===
    if (data.threeThingsToRemember && data.threeThingsToRemember.length > 0) {
      if (yPos > pageHeight - 70) {
        doc.addPage();
        yPos = margin + 5;
      }
      yPos = drawThreeThingsBox(doc, data.threeThingsToRemember, isHebrew, yPos, maxWidth, margin);
    }

    // === עמוד סיכום ===
    doc.addPage();
    drawSummaryPage(doc, isHebrew, data);

    // === Footer בכל העמודים ===
    addFooterToAllPages(doc, isHebrew);

    // === Header בכל העמודים (חוץ מהראשון) ===
    addHeaderToPages(doc, isHebrew, data.userName);

    // שמירה
    const uniqueId = generateUniqueId().slice(-6);
    const filename = isHebrew
      ? `התמונה-המלאה-שלי-${uniqueId}.pdf`
      : `my-full-picture-${uniqueId}.pdf`;

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
    if (!fontResponse.ok) throw new Error('Font not found');

    const fontBlob = await fontResponse.blob();
    const fontBase64 = await blobToBase64(fontBlob);

    doc.addFileToVFS('Rubik-Regular.ttf', fontBase64);
    doc.addFont('Rubik-Regular.ttf', 'Rubik', 'normal');
    doc.setFont('Rubik');
  } catch (error) {
    console.warn('Font loading failed:', error);
    doc.setFont('helvetica');
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject('Failed to convert blob');
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// =====================================================
// עמוד כותרת
// =====================================================

function drawCoverPage(doc: any, isHebrew: boolean, data: InsightData): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;

  // רקע גרדיאנט
  drawGradientBackground(doc, pageWidth, pageHeight);

  // עיגולים דקורטיביים
  drawDecorativeCircles(doc, pageWidth, pageHeight);

  // דפוס נקודות עדין
  drawDotPattern(doc, pageWidth, pageHeight);

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
  doc.text(
    isHebrew ? prepareHebrewText(mainTitle) : mainTitle,
    centerX,
    yPos,
    { align: 'center' }
  );
  yPos += 12;

  // תת-כותרת
  doc.setFontSize(CONFIG.FONTS.SUBTITLE);
  doc.setTextColor(100, 116, 139);
  const subtitle = isHebrew
    ? 'תובנות עמוקות על האישיות, הערכים והזוגיות שלך'
    : 'Deep insights into your personality, values & relationships';
  doc.text(
    isHebrew ? prepareHebrewText(subtitle) : subtitle,
    centerX,
    yPos,
    { align: 'center' }
  );
  yPos += 25;

  // קו דקורטיבי
  doc.setDrawColor(236, 72, 153);
  doc.setLineWidth(0.5);
  doc.line(centerX - 35, yPos, centerX + 35, yPos);
  yPos += 30;

  // אייקון יהלום גדול
  drawDiamondIcon(doc, centerX, yPos, 30);
  yPos += 55;

  // שם המשתמש
  if (data.userName) {
    doc.setFontSize(CONFIG.FONTS.SUBTITLE + 4);
    doc.setTextColor(99, 102, 241);
    const nameLabel = isHebrew ? `${data.userName} :הוכן עבור` : `Prepared for: ${data.userName}`;
    doc.text(
      isHebrew ? prepareHebrewText(nameLabel) : nameLabel,
      centerX,
      yPos,
      { align: 'center' }
    );
    yPos += 15;
  }

  // תאריך
  doc.setFontSize(CONFIG.FONTS.SMALL);
  doc.setTextColor(148, 163, 184);
  const today = new Date();
  
  if (isHebrew) {
    const hebrewDate = formatHebrewDate(today);
    const numericDate = formatDateNumbers(today);
    doc.text(
      prepareHebrewText(`${hebrewDate} (${numericDate})`),
      centerX,
      yPos,
      { align: 'center' }
    );
  } else {
    doc.text(today.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }), centerX, yPos, { align: 'center' });
  }
  yPos += 25;

  // אחוז השלמת פרופיל (אם קיים)
  if (data.profileCompletionPercent !== undefined) {
    drawCompletionBadge(doc, centerX, yPos, data.profileCompletionPercent, isHebrew);
    yPos += 25;
  }

  // Footer
  doc.setFontSize(CONFIG.FONTS.FOOTER + 1);
  doc.setTextColor(148, 163, 184);
  
  const footerText = isHebrew
    ? prepareHebrewText('כי נשמה פוגשת טכנולוגיה')
    : 'Where Soul Meets Technology';
  
  doc.text('NeshamaTech', centerX, pageHeight - 25, { align: 'center' });
  doc.text(footerText, centerX, pageHeight - 18, { align: 'center' });
}

// =====================================================
// אלמנטים דקורטיביים
// =====================================================

function drawGradientBackground(doc: any, width: number, height: number): void {
  const steps = 60;
  for (let i = 0; i < steps; i++) {
    const ratio = i / steps;
    const r = 255 - (255 - 248) * ratio * 0.3;
    const g = 255 - (255 - 250) * ratio * 0.3;
    const b = 255 - (255 - 252) * ratio * 0.2;
    doc.setFillColor(r, g, b);
    doc.rect(0, (height / steps) * i, width, height / steps + 1, 'F');
  }
}

function drawDecorativeCircles(doc: any, width: number, height: number): void {
  // עיגול גדול - פינה ימנית עליונה (צבע בהיר מאוד במקום שקיפות)
  doc.setFillColor(245, 245, 252);
  doc.circle(width + 20, -20, 100, 'F');
  
  // עיגול בינוני - פינה שמאלית תחתונה
  doc.setFillColor(252, 245, 249);
  doc.circle(-30, height + 30, 120, 'F');
  
  // עיגול קטן - מרכז ימין
  doc.setFillColor(254, 250, 245);
  doc.circle(width - 20, height / 2, 50, 'F');
}

function drawDotPattern(doc: any, width: number, height: number): void {
  // צבע בהיר מאוד במקום שקיפות
  doc.setFillColor(248, 248, 252);
  
  const spacing = 20;
  const dotSize = 0.5;
  
  for (let x = spacing; x < width - spacing; x += spacing) {
    for (let y = spacing; y < height - spacing; y += spacing) {
      doc.circle(x, y, dotSize, 'F');
    }
  }
}

function drawDiamondIcon(doc: any, x: number, y: number, size: number): void {
  // צל בהיר במקום שקיפות
  doc.setFillColor(220, 220, 230);
  doc.triangle(
    x + 2, y - size + 2,
    x - size + 2, y + 2,
    x + size + 2, y + 2,
    'F'
  );

  // משולש עליון - גרדיאנט
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
  const width = 80;
  const height = 24;
  
  // רקע
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(x - width / 2, y - height / 2, width, height, 4, 4, 'F');
  
  // מסגרת
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(0.5);
  doc.roundedRect(x - width / 2, y - height / 2, width, height, 4, 4, 'S');
  
  // טקסט
  doc.setFontSize(CONFIG.FONTS.SMALL);
  doc.setTextColor(34, 197, 94);
  const text = isHebrew
    ? prepareHebrewText(`${percent}% הושלם`)
    : `${percent}% Complete`;
  doc.text(text, x, y + 3, { align: 'center' });
}

// =====================================================
// תיבת ציטוט
// =====================================================

function drawQuoteBox(
  doc: any,
  isHebrew: boolean,
  startY: number,
  maxWidth: number,
  margin: number
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const quote = getRandomQuote(isHebrew);
  
  const boxHeight = 35;
  const boxY = startY;
  
  // רקע עם גרדיאנט עדין
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, boxY, maxWidth, boxHeight, 4, 4, 'F');
  
  // פס צד צבעוני
  doc.setFillColor(99, 102, 241);
  if (isHebrew) {
    doc.rect(pageWidth - margin - 3, boxY, 3, boxHeight, 'F');
  } else {
    doc.rect(margin, boxY, 3, boxHeight, 'F');
  }
  
  // גרשיים פתיחה - צבע בהיר במקום שקיפות
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
  const quoteText = isHebrew ? prepareHebrewText(quote.text) : quote.text;
  
  if (isHebrew) {
    doc.text(quoteText, pageWidth - margin - 10, boxY + 15, { 
      align: 'right',
      maxWidth: maxWidth - 20,
    });
  } else {
    doc.text(quoteText, margin + 10, boxY + 15, { maxWidth: maxWidth - 20 });
  }
  
  // מקור הציטוט
  doc.setFontSize(CONFIG.FONTS.SMALL);
  doc.setTextColor(148, 163, 184);
  const authorText = isHebrew
    ? prepareHebrewText(`— ${quote.author}`)
    : `— ${quote.author}`;
  
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
  margin: number
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;
  
  // מסגרת מיוחדת
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(margin + 10, startY, maxWidth - 20, 22, 4, 4, 'F');
  
  // אייקון
  doc.setFontSize(14);
  doc.text('💎', isHebrew ? pageWidth - margin - 18 : margin + 18, startY + 14);
  
  // טקסט
  doc.setFontSize(CONFIG.FONTS.BODY + 1);
  doc.setTextColor(120, 53, 15);
  const preparedText = isHebrew ? prepareHebrewText(text) : text;
  
  doc.text(preparedText, centerX, startY + 14, { align: 'center' });
  
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
  margin: number
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const info = getSectionInfo(sectionKey);
  let yPos = startY;

  // בדיקת עמוד חדש
  if (yPos > pageHeight - 70) {
    doc.addPage();
    yPos = margin + 10;
  }

  // === כותרת סקציה עם עיצוב משופר ===
  
  // רקע צבעוני
  const headerHeight = 11;
  doc.setFillColor(info.color.r, info.color.g, info.color.b);
  doc.roundedRect(margin, yPos - 2, maxWidth, headerHeight, 3, 3, 'F');
  
  // אייקון ואימוג'י
  doc.setFontSize(CONFIG.FONTS.SECTION_TITLE);
  doc.setTextColor(255, 255, 255);
  const title = isHebrew ? info.titleHe : info.titleEn;
  const displayTitle = `${info.emoji} ${isHebrew ? prepareHebrewText(title) : title}`;
  
  if (isHebrew) {
    doc.text(displayTitle, pageWidth - margin - 5, yPos + 6, { align: 'right' });
  } else {
    doc.text(displayTitle, margin + 5, yPos + 6);
  }

  yPos += headerHeight + CONFIG.SPACING.PARAGRAPH;

  // === רקע עדין לתוכן ===
  const contentStartY = yPos;
  
  // === תקציר ===
  doc.setFontSize(CONFIG.FONTS.BODY);
  doc.setTextColor(30, 41, 59);

  const summaryLines = doc.splitTextToSize(content.summary, maxWidth - 8);
  for (const line of summaryLines) {
    if (yPos > pageHeight - 25) {
      doc.addPage();
      yPos = margin + 10;
    }

    const processedLine = isHebrew ? prepareHebrewText(line) : line;
    if (isHebrew) {
      doc.text(processedLine, pageWidth - margin - 4, yPos, { align: 'right' });
    } else {
      doc.text(processedLine, margin + 4, yPos);
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

      for (const detailLine of detailLines) {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = margin + 10;
        }

        const processedDetail = isHebrew ? prepareHebrewText(detailLine) : detailLine;
        if (isHebrew) {
          doc.text(processedDetail, pageWidth - margin - 9, yPos, { align: 'right' });
        } else {
          doc.text(processedDetail, margin + 9, yPos);
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
  margin: number
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const info = getSectionInfo('keyStrengths');
  let yPos = startY;

  // כותרת
  const headerHeight = 11;
  doc.setFillColor(info.color.r, info.color.g, info.color.b);
  doc.roundedRect(margin, yPos - 2, maxWidth, headerHeight, 3, 3, 'F');
  
  doc.setFontSize(CONFIG.FONTS.SECTION_TITLE);
  doc.setTextColor(255, 255, 255);
  const title = `${info.emoji} ${isHebrew ? prepareHebrewText(info.titleHe) : info.titleEn}`;
  
  if (isHebrew) {
    doc.text(title, pageWidth - margin - 5, yPos + 6, { align: 'right' });
  } else {
    doc.text(title, margin + 5, yPos + 6);
  }
  
  yPos += headerHeight + CONFIG.SPACING.PARAGRAPH;

  // חוזקות בצורת "כרטיסים"
  for (const strength of strengths) {
    // רקע כרטיס
    doc.setFillColor(254, 252, 232);
    doc.roundedRect(margin + 2, yPos - 2, maxWidth - 4, 18, 2, 2, 'F');
    
    // כותרת החוזקה
    doc.setFontSize(CONFIG.FONTS.BODY);
    doc.setTextColor(120, 53, 15);
    const strengthTitle = isHebrew ? prepareHebrewText(strength.title) : strength.title;
    
    if (isHebrew) {
      doc.text(`⭐ ${strengthTitle}`, pageWidth - margin - 8, yPos + 5, { align: 'right' });
    } else {
      doc.text(`⭐ ${strengthTitle}`, margin + 8, yPos + 5);
    }
    
    // תיאור
    doc.setFontSize(CONFIG.FONTS.SMALL);
    doc.setTextColor(71, 85, 105);
    const desc = isHebrew ? prepareHebrewText(strength.description) : strength.description;
    
    if (isHebrew) {
      doc.text(desc, pageWidth - margin - 8, yPos + 12, { align: 'right', maxWidth: maxWidth - 20 });
    } else {
      doc.text(desc, margin + 8, yPos + 12, { maxWidth: maxWidth - 20 });
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
  margin: number
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
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
  const title = isHebrew
    ? prepareHebrewText('🎯 3 דברים לזכור')
    : '🎯 3 Things to Remember';
  
  doc.text(title, pageWidth / 2, startY + 10, { align: 'center' });
  
  // הפריטים
  doc.setFontSize(CONFIG.FONTS.BODY);
  doc.setTextColor(51, 65, 85);
  
  let itemY = startY + 20;
  things.slice(0, 3).forEach((thing, index) => {
    const text = isHebrew ? prepareHebrewText(thing) : thing;
    const number = `${index + 1}.`;
    
    if (isHebrew) {
      doc.text(`${text} .${index + 1}`, pageWidth - margin - 10, itemY, { align: 'right' });
    } else {
      doc.text(`${number} ${text}`, margin + 10, itemY);
    }
    itemY += 9;
  });
  
  return startY + boxHeight + 5;
}

// =====================================================
// עמוד סיכום
// =====================================================

function drawSummaryPage(doc: any, isHebrew: boolean, data: InsightData): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = CONFIG.PAGE.MARGIN;
  const centerX = pageWidth / 2;

  // רקע עדין
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  let yPos = 50;

  // כותרת
  doc.setFontSize(CONFIG.FONTS.TITLE);
  doc.setTextColor(30, 41, 59);
  const title = isHebrew ? prepareHebrewText('לסיכום...') : 'In Summary...';
  doc.text(title, centerX, yPos, { align: 'center' });
  yPos += 20;

  // קו דקורטיבי
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.5);
  doc.line(centerX - 30, yPos, centerX + 30, yPos);
  yPos += 25;

  // מסר מעצים
  doc.setFontSize(CONFIG.FONTS.BODY + 2);
  doc.setTextColor(71, 85, 105);

  const closingMessages = isHebrew
    ? [
        `${data.userName || 'יקר/ה'}, עברת מסע משמעותי של גילוי עצמי.`,
        'הדוח הזה הוא רק נקודת התחלה - המשך להקשיב לעצמך,',
        'להאמין בערך הייחודי שאתה מביא/ה לעולם,',
        'ולזכור שהזוגיות הנכונה תגיע בזמן הנכון.',
        '',
        'בהצלחה במסע! 💜',
      ]
    : [
        `${data.userName || 'Dear one'}, you've been on a meaningful journey of self-discovery.`,
        'This report is just the beginning - keep listening to yourself,',
        'believing in the unique value you bring to the world,',
        'and remember that the right partnership will come at the right time.',
        '',
        'Good luck on your journey! 💜',
      ];

  closingMessages.forEach((line) => {
    const processedLine = isHebrew ? prepareHebrewText(line) : line;
    doc.text(processedLine, centerX, yPos, { align: 'center' });
    yPos += 8;
  });

  yPos += 20;

  // יהלום קטן
  drawDiamondIcon(doc, centerX, yPos, 15);
  yPos += 40;

  // פרטי יצירה
  doc.setFontSize(CONFIG.FONTS.TINY);
  doc.setTextColor(148, 163, 184);
  
  const createdText = isHebrew
    ? prepareHebrewText(`נוצר ב-${formatDateNumbers(new Date())}`)
    : `Created on ${new Date().toLocaleDateString('en-US')}`;
  doc.text(createdText, centerX, yPos, { align: 'center' });
  
  yPos += 6;
  doc.text('NeshamaTech © 2025', centerX, yPos, { align: 'center' });
}

// =====================================================
// Header
// =====================================================

function addHeaderToPages(doc: any, isHebrew: boolean, userName?: string): void {
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = CONFIG.PAGE.MARGIN;

  // מתחילים מעמוד 2 (לא עמוד הכותרת)
  for (let i = 2; i < pageCount; i++) {  // לא כולל עמוד הסיכום
    doc.setPage(i);

    // קו הפרדה עדין
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, 12, pageWidth - margin, 12);

    // שם + לוגו
    doc.setFontSize(CONFIG.FONTS.TINY);
    doc.setTextColor(148, 163, 184);
    
    if (isHebrew) {
      doc.text('NeshamaTech', margin, 8);
      if (userName) {
        doc.text(prepareHebrewText(userName), pageWidth - margin, 8, { align: 'right' });
      }
    } else {
      doc.text('NeshamaTech', margin, 8);
      if (userName) {
        doc.text(userName, pageWidth - margin, 8, { align: 'right' });
      }
    }
  }
}

// =====================================================
// Footer
// =====================================================

function addFooterToAllPages(doc: any, isHebrew: boolean): void {
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = CONFIG.PAGE.MARGIN;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // קו הפרדה
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

    doc.setFontSize(CONFIG.FONTS.FOOTER);
    doc.setTextColor(148, 163, 184);

    // לוגו מרכזי (עמוד ראשון בלבד יש כבר)
    if (i > 1) {
      const centerText = isHebrew
        ? prepareHebrewText('מערכת שידוכים מתקדמת')
        : 'Advanced Matchmaking System';
      doc.text(`NeshamaTech - ${centerText}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    }

    // מספר עמוד
    const pageText = isHebrew
      ? prepareHebrewText(`עמוד ${i} מתוך ${pageCount}`)
      : `Page ${i} of ${pageCount}`;

    if (isHebrew) {
      doc.text(pageText, margin, pageHeight - 8);
    } else {
      doc.text(pageText, pageWidth - margin, pageHeight - 8, { align: 'right' });
    }
  }
}

export default generateInsightPdf;