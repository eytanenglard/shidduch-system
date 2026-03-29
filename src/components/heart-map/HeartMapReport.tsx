'use client';

import { useRef, useState, useCallback } from 'react';
import { Download, Heart, Loader2 } from 'lucide-react';
import { SF_SECTIONS } from '@/components/soul-fingerprint/questions';
import { isQuestionVisible, getSectorGroup } from '@/components/soul-fingerprint/types';
import type { SFAnswers, SFQuestion, SectorValue, LifeStageValue } from '@/components/soul-fingerprint/types';

interface Props {
  answers: SFAnswers;
  gender: 'MALE' | 'FEMALE';
  locale: string;
  t: (key: string) => string;
  tHm: (key: string) => string;
}

const SECTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  anchor: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  identity: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  background: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  personality: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  career: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  lifestyle: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  family: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  relationship: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
};

function getAnswerLabel(question: SFQuestion, answer: string | string[] | number | null, t: (key: string) => string): string {
  if (answer === null || answer === undefined || answer === '') return '';

  if (question.type === 'slider') {
    return String(answer);
  }

  if (question.type === 'openText') {
    return String(answer);
  }

  if (question.type === 'singleChoice' && typeof answer === 'string') {
    const option = question.options?.find((o) => o.value === answer);
    if (option) return t(option.labelKey);
    return answer;
  }

  if (question.type === 'multiSelect' && Array.isArray(answer)) {
    return answer
      .map((val) => {
        const option = question.options?.find((o) => o.value === val);
        if (option) return t(option.labelKey);
        return val;
      })
      .join(', ');
  }

  return String(answer);
}

export default function HeartMapReport({ answers, gender, locale, t, tHm }: Props) {
  const isRTL = locale === 'he';
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<'loading' | 'rendering' | 'saving' | null>(null);

  const sector = (answers['anchor_sector'] as SectorValue) || null;
  const sectorGroup = getSectorGroup(sector);
  const lifeStage = (answers['anchor_life_stage'] as LifeStageValue) || null;

  const handleDownloadPdf = useCallback(async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);
    setPdfProgress('loading');

    try {
      const [html2canvasModule, jsPDFModule] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const html2canvas = html2canvasModule.default;
      const { jsPDF } = jsPDFModule;

      setPdfProgress('rendering');
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth - 20; // 10mm margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      // First page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Additional pages if content is long
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      setPdfProgress('saving');
      const date = new Date().toISOString().split('T')[0];
      pdf.save(`heart-map-report-${date}.pdf`);
    } catch (err) {
      console.error('[HeartMapReport] PDF generation failed:', err);
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress(null);
    }
  }, []);

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Download button */}
      <div className="flex justify-end mb-4">
        <button
          id="heart-map-pdf-download"
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 text-white font-medium text-sm hover:bg-teal-600 transition-colors disabled:opacity-70 disabled:cursor-wait min-w-[160px] justify-center"
        >
          {isGeneratingPdf ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                {pdfProgress === 'loading' && (isRTL ? 'טוען...' : 'Loading...')}
                {pdfProgress === 'rendering' && (isRTL ? 'מעבד את הדוח...' : 'Rendering...')}
                {pdfProgress === 'saving' && (isRTL ? 'שומר PDF...' : 'Saving PDF...')}
              </span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              {tHm('report.downloadPdf')}
            </>
          )}
        </button>
      </div>

      {/* Report content */}
      <div ref={reportRef} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 p-6 sm:p-8 text-white text-center">
          <Heart className="w-10 h-10 mx-auto mb-3 opacity-90" />
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{tHm('report.title')}</h1>
          <p className="text-sm opacity-80">{tHm('report.subtitle')}</p>
        </div>

        {/* Sections */}
        <div className="p-4 sm:p-6 space-y-6">
          {SF_SECTIONS.map((section) => {
            const colors = SECTION_COLORS[section.id] || SECTION_COLORS.anchor;

            // Get visible questions for this section
            const selfQuestions = section.questions.filter(
              (q) => q.forSelf && isQuestionVisible(q, answers, sectorGroup, sector, lifeStage, gender)
            );
            const partnerQuestions = section.questions.filter(
              (q) => q.forPartner && isQuestionVisible(q, answers, sectorGroup, sector, lifeStage, gender)
            );

            // Filter to only answered questions
            const answeredSelf = selfQuestions.filter((q) => {
              const ans = answers[q.id];
              return ans !== null && ans !== undefined && ans !== '';
            });
            const answeredPartner = partnerQuestions.filter((q) => {
              const ans = answers[q.id];
              return ans !== null && ans !== undefined && ans !== '';
            });

            if (answeredSelf.length === 0 && answeredPartner.length === 0) return null;

            return (
              <div key={section.id} className={`rounded-xl border ${colors.border} overflow-hidden`}>
                {/* Section header */}
                <div className={`${colors.bg} px-4 py-3 flex items-center gap-2`}>
                  <span className="text-lg">{section.icon}</span>
                  <h2 className={`font-bold text-base ${colors.text}`}>
                    {tHm(`report.sections.${section.id}`)}
                  </h2>
                </div>

                <div className="p-4">
                  {/* Two columns: About Me | Looking For */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Self column */}
                    {answeredSelf.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                          {tHm('report.aboutMe')}
                        </h3>
                        <div className="space-y-2.5">
                          {answeredSelf.map((q) => (
                            <div key={q.id}>
                              <p className="text-xs text-gray-500 mb-0.5">{t(q.textKey)}</p>
                              <p className="text-sm font-medium text-gray-800">
                                {getAnswerLabel(q, answers[q.id], t)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Partner column */}
                    {answeredPartner.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                          {tHm('report.lookingFor')}
                        </h3>
                        <div className="space-y-2.5">
                          {answeredPartner.map((q) => (
                            <div key={q.id}>
                              <p className="text-xs text-gray-500 mb-0.5">{t(q.textKey)}</p>
                              <p className="text-sm font-medium text-gray-800">
                                {getAnswerLabel(q, answers[q.id], t)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 text-center border-t border-gray-100">
          <p className="text-xs text-gray-400">{tHm('report.generatedBy')}</p>
          <p className="text-xs text-teal-600 mt-1">{tHm('report.registerFooter')}</p>
        </div>
      </div>
    </div>
  );
}
