'use client';

import React, { useMemo } from 'react';
import { Check, X, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SF_SECTIONS } from '@/components/soul-fingerprint/questions';
import { isQuestionVisible, getSectorGroup } from '@/components/soul-fingerprint/types';
import type { SFQuestion, SFAnswers, SectorValue, LifeStageValue } from '@/components/soul-fingerprint/types';

import heSfDict from '@/dictionaries/soul-fingerprint/he.json';
import enSfDict from '@/dictionaries/soul-fingerprint/en.json';
import {
  buildOptionTranslationMap,
  createTagTranslator,
  COMPUTED_TAG_TRANSLATIONS_HE,
  COMPUTED_TAG_TRANSLATIONS_EN,
} from '@/components/soul-fingerprint/tagTranslation';

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

// Map partner preference question IDs to their self-description counterparts
const PREFERENCE_PAIRS: Array<{ partnerId: string; selfId: string; label: string }> = [
  // Personality
  { partnerId: 'p_energy_type', selfId: 's3_energy_type', label: 'אנרגיה' },
  { partnerId: 'p_patience_level', selfId: 's3_patience_level', label: 'סבלנות' },
  { partnerId: 'p_humor', selfId: 's3_humor', label: 'הומור' },
  { partnerId: 'p_conflict', selfId: 's3_conflict', label: 'ניהול קונפליקט' },
  { partnerId: 'p_social_role', selfId: 's3_social_role', label: 'תפקוד חברתי' },
  { partnerId: 'p_attachment_style', selfId: 's3_attachment_style', label: 'סגנון התקשרות' },
  { partnerId: 'p_ambition', selfId: 's4_ambition', label: 'שאפתנות' },
  { partnerId: 'p_financial_style', selfId: 's4_financial_style', label: 'ניהול כספים' },
  { partnerId: 'p_fitness', selfId: 's5_fitness', label: 'כושר' },
  { partnerId: 'p_dress_style', selfId: 's5_dress_style', label: 'סגנון לבוש' },
];

const PREFERENCE_PAIRS_EN: Record<string, string> = {
  'אנרגיה': 'Energy',
  'סבלנות': 'Patience',
  'הומור': 'Humor',
  'ניהול קונפליקט': 'Conflict style',
  'תפקוד חברתי': 'Social role',
  'סגנון התקשרות': 'Attachment style',
  'שאפתנות': 'Ambition',
  'ניהול כספים': 'Financial style',
  'כושר': 'Fitness',
  'סגנון לבוש': 'Dress style',
};

type AlignmentStatus = 'match' | 'partial' | 'mismatch';

interface AlignmentRow {
  label: string;
  statusAtoB: AlignmentStatus; // A's preference vs B's self
  statusBtoA: AlignmentStatus; // B's preference vs A's self
  prefLabelA: string; // What A wants
  selfLabelB: string; // What B is
  prefLabelB: string; // What B wants
  selfLabelA: string; // What A is
}

function compareAnswers(
  prefQuestion: SFQuestion,
  selfQuestion: SFQuestion,
  prefAnswer: unknown,
  selfAnswer: unknown,
): AlignmentStatus {
  if (prefAnswer == null || selfAnswer == null) return 'partial';

  // Slider comparison
  if (prefQuestion.type === 'slider' && selfQuestion.type === 'slider') {
    const pVal = Number(prefAnswer);
    const sVal = Number(selfAnswer);
    const range = (prefQuestion.sliderMax ?? 100) - (prefQuestion.sliderMin ?? 0) || 1;
    const diff = Math.abs(pVal - sVal) / range;
    if (diff < 0.2) return 'match';
    if (diff < 0.4) return 'partial';
    return 'mismatch';
  }

  // SingleChoice: exact match
  if (prefQuestion.type === 'singleChoice' && selfQuestion.type === 'singleChoice') {
    return prefAnswer === selfAnswer ? 'match' : 'mismatch';
  }

  // MultiSelect preference vs SingleChoice self: is self included?
  if (prefQuestion.type === 'multiSelect' && typeof selfAnswer === 'string') {
    const prefArr = Array.isArray(prefAnswer) ? prefAnswer : [];
    if (prefArr.length === 0) return 'partial';
    return prefArr.includes(selfAnswer) ? 'match' : 'mismatch';
  }

  // MultiSelect preference vs MultiSelect self: overlap?
  if (prefQuestion.type === 'multiSelect' && Array.isArray(selfAnswer)) {
    const prefArr = Array.isArray(prefAnswer) ? prefAnswer : [];
    if (prefArr.length === 0 || selfAnswer.length === 0) return 'partial';
    const overlap = selfAnswer.some((v: string) => prefArr.includes(v));
    return overlap ? 'match' : 'mismatch';
  }

  return 'partial';
}

function getAnswerDisplayLabel(
  question: SFQuestion,
  answer: unknown,
  t: (key: string) => string,
  translateTag?: (tag: string) => string,
): string {
  if (answer == null || answer === '') return '—';

  const fallback = (v: string) => translateTag ? translateTag(v) : v;

  if (question.type === 'slider') return String(answer);

  if (question.type === 'singleChoice' && typeof answer === 'string') {
    const opt = question.options?.find((o) => o.value === answer);
    return opt ? t(opt.labelKey) : fallback(answer);
  }

  if (question.type === 'multiSelect' && Array.isArray(answer)) {
    return answer
      .slice(0, 3)
      .map((v) => {
        const opt = question.options?.find((o) => o.value === v);
        return opt ? t(opt.labelKey) : fallback(v);
      })
      .join(', ') + (answer.length > 3 ? '…' : '');
  }

  return String(answer);
}

interface SfPreferenceAlignmentProps {
  sfAnswersA: Record<string, unknown>;
  sfAnswersB: Record<string, unknown>;
  genderA: string | null;
  genderB: string | null;
  nameA: string;
  nameB: string;
  locale: string;
}

const SfPreferenceAlignment: React.FC<SfPreferenceAlignmentProps> = ({
  sfAnswersA,
  sfAnswersB,
  genderA,
  genderB,
  nameA,
  nameB,
  locale,
}) => {
  const answersA = sfAnswersA as SFAnswers;
  const answersB = sfAnswersB as SFAnswers;

  const t = useMemo(() => {
    const dict = (locale === 'he' ? heSfDict : enSfDict) as Record<string, unknown>;
    return (key: string) => getNestedValue(dict, key, null);
  }, [locale]);

  const translateTag = useMemo(() => {
    const dict = (locale === 'he' ? heSfDict : enSfDict) as Record<string, unknown>;
    const optionMap = buildOptionTranslationMap(dict, null);
    const computedMap = locale === 'he' ? COMPUTED_TAG_TRANSLATIONS_HE : COMPUTED_TAG_TRANSLATIONS_EN;
    return createTagTranslator(optionMap, computedMap);
  }, [locale]);

  const rows = useMemo(() => {
    const result: AlignmentRow[] = [];
    const sectorA = (answersA['anchor_sector'] as SectorValue) || null;
    const sectorGroupA = getSectorGroup(sectorA);
    const lifeStageA = (answersA['anchor_life_stage'] as LifeStageValue) || null;
    const sectorB = (answersB['anchor_sector'] as SectorValue) || null;
    const sectorGroupB = getSectorGroup(sectorB);
    const lifeStageB = (answersB['anchor_life_stage'] as LifeStageValue) || null;

    // Build question lookup by ID
    const questionMap = new Map<string, SFQuestion>();
    for (const section of SF_SECTIONS) {
      for (const q of section.questions) {
        questionMap.set(q.id, q);
      }
    }

    for (const pair of PREFERENCE_PAIRS) {
      const prefQ = questionMap.get(pair.partnerId);
      const selfQ = questionMap.get(pair.selfId);
      if (!prefQ || !selfQ) continue;

      // Check visibility for both parties
      const prefVisibleA = isQuestionVisible(prefQ, answersA, sectorGroupA, sectorA, lifeStageA, genderA as 'MALE' | 'FEMALE');
      const selfVisibleB = isQuestionVisible(selfQ, answersB, sectorGroupB, sectorB, lifeStageB, genderB as 'MALE' | 'FEMALE');
      const prefVisibleB = isQuestionVisible(prefQ, answersB, sectorGroupB, sectorB, lifeStageB, genderB as 'MALE' | 'FEMALE');
      const selfVisibleA = isQuestionVisible(selfQ, answersA, sectorGroupA, sectorA, lifeStageA, genderA as 'MALE' | 'FEMALE');

      // Need at least one direction to have data
      const hasAtoB = prefVisibleA && selfVisibleB && answersA[pair.partnerId] != null && answersB[pair.selfId] != null;
      const hasBtoA = prefVisibleB && selfVisibleA && answersB[pair.partnerId] != null && answersA[pair.selfId] != null;
      if (!hasAtoB && !hasBtoA) continue;

      const statusAtoB = hasAtoB
        ? compareAnswers(prefQ, selfQ, answersA[pair.partnerId], answersB[pair.selfId])
        : 'partial';
      const statusBtoA = hasBtoA
        ? compareAnswers(prefQ, selfQ, answersB[pair.partnerId], answersA[pair.selfId])
        : 'partial';

      result.push({
        label: locale === 'he' ? pair.label : (PREFERENCE_PAIRS_EN[pair.label] || pair.label),
        statusAtoB,
        statusBtoA,
        prefLabelA: hasAtoB ? getAnswerDisplayLabel(prefQ, answersA[pair.partnerId], t, translateTag) : '—',
        selfLabelB: hasAtoB ? getAnswerDisplayLabel(selfQ, answersB[pair.selfId], t, translateTag) : '—',
        prefLabelB: hasBtoA ? getAnswerDisplayLabel(prefQ, answersB[pair.partnerId], t, translateTag) : '—',
        selfLabelA: hasBtoA ? getAnswerDisplayLabel(selfQ, answersA[pair.selfId], t, translateTag) : '—',
      });
    }

    return result;
  }, [answersA, answersB, genderA, genderB, locale, t]);

  if (rows.length === 0) return null;

  const matchCount = rows.filter((r) => r.statusAtoB === 'match' || r.statusBtoA === 'match').length;
  const mismatchCount = rows.filter((r) => r.statusAtoB === 'mismatch' || r.statusBtoA === 'mismatch').length;

  const StatusIcon = ({ status }: { status: AlignmentStatus }) => {
    if (status === 'match') return <Check className="w-3.5 h-3.5 text-emerald-500" />;
    if (status === 'mismatch') return <X className="w-3.5 h-3.5 text-red-400" />;
    return <Minus className="w-3.5 h-3.5 text-gray-300" />;
  };

  return (
    <div className="rounded-xl border border-teal-100 overflow-hidden">
      <div className="px-4 py-2.5 bg-gradient-to-r from-teal-50 to-emerald-50 flex items-center gap-2">
        <span className="text-base">🎯</span>
        <h4 className="font-semibold text-sm text-teal-700 flex-1">
          {locale === 'he' ? 'התאמת העדפות' : 'Preference Alignment'}
        </h4>
        <div className="flex items-center gap-2 text-[10px]">
          {matchCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">
              {matchCount} {locale === 'he' ? 'תואמים' : 'aligned'}
            </span>
          )}
          {mismatchCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 font-medium">
              {mismatchCount} {locale === 'he' ? 'שונים' : 'different'}
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 mb-3 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
          <span />
          <span className="text-center w-16">{nameA}</span>
          <span className="text-center w-16">{nameB}</span>
        </div>

        <div className="space-y-2">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className={cn(
                'grid grid-cols-[1fr_auto_auto] gap-2 items-center py-1.5 px-2 rounded-lg',
                (row.statusAtoB === 'match' && row.statusBtoA === 'match') && 'bg-emerald-50/50',
                (row.statusAtoB === 'mismatch' || row.statusBtoA === 'mismatch') && 'bg-red-50/30',
              )}
            >
              <span className="text-xs font-medium text-gray-700">{row.label}</span>
              <div className="flex items-center justify-center w-16">
                <StatusIcon status={row.statusAtoB} />
              </div>
              <div className="flex items-center justify-center w-16">
                <StatusIcon status={row.statusBtoA} />
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-center gap-4 text-[10px] text-gray-400">
          <div className="flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-500" />
            <span>{locale === 'he' ? 'תואם' : 'Aligned'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Minus className="w-3 h-3 text-gray-300" />
            <span>{locale === 'he' ? 'חסר מידע' : 'No data'}</span>
          </div>
          <div className="flex items-center gap-1">
            <X className="w-3 h-3 text-red-400" />
            <span>{locale === 'he' ? 'לא תואם' : 'Mismatch'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SfPreferenceAlignment;
