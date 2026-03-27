'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { SF_SECTIONS } from '@/components/soul-fingerprint/questions';
import { isQuestionVisible, getSectorGroup } from '@/components/soul-fingerprint/types';
import type { SFQuestion, SFAnswers, SectorValue, LifeStageValue } from '@/components/soul-fingerprint/types';

import heSfDict from '@/dictionaries/soul-fingerprint/he.json';
import enSfDict from '@/dictionaries/soul-fingerprint/en.json';

// --- Translation helper ---
function getNestedValue(obj: Record<string, unknown>, path: string, gender?: string | null): string {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  if (typeof current === 'string') return current;
  if (typeof current === 'object' && current !== null) {
    const g = gender === 'MALE' ? 'male' : 'female';
    const gVal = (current as Record<string, unknown>)[g];
    if (typeof gVal === 'string') return gVal;
    const fallback = (current as Record<string, unknown>)['male'] ?? (current as Record<string, unknown>)['female'];
    if (typeof fallback === 'string') return fallback;
  }
  return path;
}

function getAnswerLabel(question: SFQuestion, answer: string | string[] | number | null, t: (key: string) => string): string {
  if (answer === null || answer === undefined || answer === '') return '';

  if (question.type === 'slider') return String(answer);
  if (question.type === 'openText') return String(answer);

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

// --- Slider bar component ---
function SliderBar({
  value,
  min,
  max,
  leftLabel,
  rightLabel,
  color,
}: {
  value: number;
  min: number;
  max: number;
  leftLabel: string;
  rightLabel: string;
  color: string;
}) {
  const range = max - min || 1;
  const pct = Math.round(((value - min) / range) * 100);
  const barColor = color || 'bg-teal-400';
  return (
    <div className="space-y-1">
      <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('absolute inset-y-0 start-0 rounded-full transition-all', barColor)}
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full border-2 border-current shadow-sm"
          style={{
            insetInlineStart: `calc(${pct}% - 7px)`,
            borderColor: 'currentColor',
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

// --- Section color themes ---
const SECTION_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  anchor: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-400' },
  identity: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-400' },
  background: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-400' },
  personality: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-400' },
  career: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400' },
  lifestyle: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-400' },
  family: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-400' },
  relationship: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-400' },
};

// --- Section title translations ---
const SECTION_TITLES_HE: Record<string, string> = {
  identity: 'זהות ורקע',
  background: 'משפחה ושורשים',
  personality: 'אישיות ואנרגיה',
  career: 'קריירה וכלכלה',
  lifestyle: 'אורח חיים',
  family: 'חזון משפחה ובית',
  relationship: 'זוגיות וקשר',
};

const SECTION_TITLES_EN: Record<string, string> = {
  identity: 'Identity & Background',
  background: 'Family & Roots',
  personality: 'Personality & Energy',
  career: 'Career & Finance',
  lifestyle: 'Lifestyle',
  family: 'Family & Home Vision',
  relationship: 'Relationship & Connection',
};

// --- Props ---
interface SoulFingerprintSectionProps {
  sfAnswers: Record<string, unknown>;
  sectionIds: string[];
  gender: string | null;
  locale: string;
  direction: 'ltr' | 'rtl';
  selfOnly?: boolean;
  partnerOnly?: boolean;
}

interface RenderedAnswer {
  questionText: string;
  answerText: string;
  sectionId: string;
  isSlider?: boolean;
  sliderValue?: number;
  sliderMin?: number;
  sliderMax?: number;
  sliderLeftLabel?: string;
  sliderRightLabel?: string;
}

const SoulFingerprintSection: React.FC<SoulFingerprintSectionProps> = ({
  sfAnswers,
  sectionIds,
  gender,
  locale,
  direction,
  selfOnly = false,
  partnerOnly = false,
}) => {
  const answers = sfAnswers as SFAnswers;
  const sector = (answers['anchor_sector'] as SectorValue) || null;
  const sectorGroup = getSectorGroup(sector);
  const lifeStage = (answers['anchor_life_stage'] as LifeStageValue) || null;

  const t = useMemo(() => {
    const dict = (locale === 'he' ? heSfDict : enSfDict) as Record<string, unknown>;
    return (key: string) => getNestedValue(dict, key, gender);
  }, [locale, gender]);

  const sectionTitles = locale === 'he' ? SECTION_TITLES_HE : SECTION_TITLES_EN;

  const sectionData = useMemo(() => {
    const result: { sectionId: string; title: string; icon: string; selfAnswers: RenderedAnswer[]; partnerAnswers: RenderedAnswer[] }[] = [];

    for (const section of SF_SECTIONS) {
      if (!sectionIds.includes(section.id)) continue;

      const selfQuestions = selfOnly || !partnerOnly
        ? section.questions.filter(
            (q) => q.forSelf && isQuestionVisible(q, answers, sectorGroup, sector, lifeStage, gender as 'MALE' | 'FEMALE')
          )
        : [];
      const partnerQuestions = partnerOnly || !selfOnly
        ? section.questions.filter(
            (q) => q.forPartner && isQuestionVisible(q, answers, sectorGroup, sector, lifeStage, gender as 'MALE' | 'FEMALE')
          )
        : [];

      const mapQuestion = (q: SFQuestion): RenderedAnswer => ({
        questionText: t(q.textKey),
        answerText: getAnswerLabel(q, answers[q.id], t),
        sectionId: section.id,
        isSlider: q.type === 'slider',
        sliderValue: q.type === 'slider' ? Number(answers[q.id]) : undefined,
        sliderMin: q.sliderMin,
        sliderMax: q.sliderMax,
        sliderLeftLabel: q.sliderLeftKey ? t(q.sliderLeftKey) : undefined,
        sliderRightLabel: q.sliderRightKey ? t(q.sliderRightKey) : undefined,
      });

      const hasAnswer = (q: SFQuestion) => {
        const ans = answers[q.id];
        return ans !== null && ans !== undefined && ans !== '' && !(Array.isArray(ans) && ans.length === 0);
      };

      const answeredSelf = selfQuestions.filter(hasAnswer).map(mapQuestion);
      const answeredPartner = partnerQuestions.filter(hasAnswer).map(mapQuestion);

      if (answeredSelf.length > 0 || answeredPartner.length > 0) {
        result.push({
          sectionId: section.id,
          title: sectionTitles[section.id] || section.id,
          icon: section.icon,
          selfAnswers: answeredSelf,
          partnerAnswers: answeredPartner,
        });
      }
    }

    return result;
  }, [answers, sectionIds, sectorGroup, sector, lifeStage, gender, t, sectionTitles, selfOnly, partnerOnly]);

  // Anchor data labels
  const anchorLabels = useMemo(() => {
    const sectorAnswer = answers['anchor_sector'];
    const lifeStageAnswer = answers['anchor_life_stage'];
    if (!sectorAnswer && !lifeStageAnswer) return null;

    const sectorLabel = sectorAnswer ? t(`options.anchor_sector.${sectorAnswer}`) : null;
    const lifeStageLabel = lifeStageAnswer ? t(`options.anchor_life_stage.${lifeStageAnswer}`) : null;
    return { sector: sectorLabel, lifeStage: lifeStageLabel };
  }, [answers, t]);

  if (sectionData.length === 0 && !anchorLabels) return null;

  const renderAnswer = (item: RenderedAnswer, idx: number, dotColor: string) => {
    if (item.isSlider && item.sliderValue !== undefined) {
      return (
        <div key={idx}>
          <p className="text-xs text-gray-500 mb-1.5">{item.questionText}</p>
          <SliderBar
            value={item.sliderValue}
            min={item.sliderMin ?? 0}
            max={item.sliderMax ?? 100}
            leftLabel={item.sliderLeftLabel || ''}
            rightLabel={item.sliderRightLabel || ''}
            color={dotColor}
          />
        </div>
      );
    }
    return (
      <div key={idx}>
        <p className="text-xs text-gray-500 mb-0.5">{item.questionText}</p>
        <p className="text-sm font-medium text-gray-800 break-words">{item.answerText}</p>
      </div>
    );
  };

  const badgeText = locale === 'he' ? 'מטביעת הנשמה 🔮' : 'From Soul Fingerprint 🔮';

  return (
    <div className="space-y-4" dir={direction}>
      {/* Questionnaire source badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-50 to-teal-50 border border-purple-200/50 text-xs font-medium text-purple-600">
          {badgeText}
        </span>
      </div>

      {/* Anchor data: sector + life stage */}
      {anchorLabels && (
        <div className="flex flex-wrap gap-2">
          {anchorLabels.sector && (
            <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', SECTION_COLORS.anchor.bg, SECTION_COLORS.anchor.text)}>
              {anchorLabels.sector}
            </span>
          )}
          {anchorLabels.lifeStage && (
            <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', SECTION_COLORS.anchor.bg, SECTION_COLORS.anchor.text)}>
              {anchorLabels.lifeStage}
            </span>
          )}
        </div>
      )}

      {sectionData.map((section) => {
        const colors = SECTION_COLORS[section.sectionId] || SECTION_COLORS.personality;
        const allAnswers = selfOnly
          ? section.selfAnswers
          : partnerOnly
          ? section.partnerAnswers
          : section.selfAnswers;
        const partnerAnswers = !selfOnly && !partnerOnly ? section.partnerAnswers : [];

        return (
          <div
            key={section.sectionId}
            className={cn('rounded-xl border overflow-hidden', colors.border)}
          >
            <div className={cn('px-4 py-2.5 flex items-center gap-2', colors.bg)}>
              <span className="text-base">{section.icon}</span>
              <h4 className={cn('font-semibold text-sm', colors.text)}>
                {section.title}
              </h4>
            </div>
            <div className="p-4">
              {allAnswers.length > 0 && (
                <div className="space-y-3">
                  {allAnswers.map((item, idx) => renderAnswer(item, idx, colors.dot))}
                </div>
              )}
              {partnerAnswers.length > 0 && (
                <div className={cn(allAnswers.length > 0 && 'mt-4 pt-3 border-t border-gray-100')}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    {locale === 'he'
                      ? (gender === 'MALE' ? 'מה אני מחפש' : 'מה אני מחפשת')
                      : 'Looking for'}
                  </p>
                  <div className="space-y-3">
                    {partnerAnswers.map((item, idx) => renderAnswer(item, idx, colors.dot))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SoulFingerprintSection;
