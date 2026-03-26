// src/components/profile/sections/neshma-insight/insightPdfExport.ts

import type { NeshamaInsightReport } from '@/types/neshamaInsight';

// =====================================================
// PDF Generation
// =====================================================

/**
 * Generate a PDF from the rendered report element using html2canvas + jsPDF.
 * This is a pure utility function — not a React component.
 */
export async function generateInsightPdf(
  elementRef: React.RefObject<HTMLDivElement | null>,
  locale: 'he' | 'en'
): Promise<void> {
  const element = elementRef.current;
  if (!element) {
    throw new Error('Report element not found');
  }

  const isHe = locale === 'he';

  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

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
  const pdfMargin = 15;
  const contentWidth = pdfWidth - pdfMargin * 2;
  const ratio = contentWidth / imgWidth;
  const scaledHeight = imgHeight * ratio;
  const pageHeight = 297 - pdfMargin * 2;

  // Overlap in mm to prevent text from being cut at page boundaries
  const overlapMm = 8;
  const overlapPx = overlapMm / ratio;

  const pdf = new jsPDF('p', 'mm', 'a4');

  // If content fits in one page
  if (scaledHeight <= pageHeight) {
    pdf.addImage(imgData, 'PNG', pdfMargin, pdfMargin, contentWidth, scaledHeight);
  } else {
    // Multi-page: slice the canvas into pages with overlap
    let yOffset = 0;
    let pageIndex = 0;
    const sliceMaxHeight = pageHeight / ratio;

    while (yOffset < imgHeight) {
      if (pageIndex > 0) pdf.addPage();

      const sliceHeight = Math.min(sliceMaxHeight, imgHeight - yOffset);
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

      // Advance by less than sliceHeight to create overlap with next page
      yOffset += sliceHeight - overlapPx;
      pageIndex++;
    }
  }

  const fileName = isHe ? 'התמונה-המלאה-שלי.pdf' : 'my-full-picture.pdf';
  pdf.save(fileName);
}

// =====================================================
// Copy Text Builder
// =====================================================

/**
 * Build plain-text representation of the report for clipboard copying.
 */
export function buildCopyText(report: NeshamaInsightReport, locale: 'he' | 'en'): string {
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
