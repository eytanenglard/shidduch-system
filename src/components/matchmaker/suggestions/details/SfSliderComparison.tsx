'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { SF_SECTIONS } from '@/components/soul-fingerprint/questions';
import { isQuestionVisible, getSectorGroup } from '@/components/soul-fingerprint/types';
import type { SFAnswers, SectorValue, LifeStageValue } from '@/components/soul-fingerprint/types';

import heSfDict from '@/dictionaries/soul-fingerprint/he.json';
import enSfDict from '@/dictionaries/soul-fingerprint/en.json';

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

// Self-perception sliders that make sense to compare
const COMPARISON_IDS = [
  's3_energy_type',
  's3_plan_change_reaction',
  's3_patience_level',
  's7_silent_treatment',
  's7_physical_intimacy',
  's7_flexibility_scale',
];

interface ComparisonRow {
  label: string;
  leftLabel: string;
  rightLabel: string;
  valueA: number;
  valueB: number;
  min: number;
  max: number;
}

interface SfSliderComparisonProps {
  sfAnswersA: Record<string, unknown>;
  sfAnswersB: Record<string, unknown>;
  genderA: string | null;
  genderB: string | null;
  nameA: string;
  nameB: string;
  locale: string;
}

const SfSliderComparison: React.FC<SfSliderComparisonProps> = ({
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

  const tA = useMemo(() => {
    const dict = (locale === 'he' ? heSfDict : enSfDict) as Record<string, unknown>;
    return (key: string) => getNestedValue(dict, key, genderA);
  }, [locale, genderA]);

  const rows = useMemo(() => {
    const result: ComparisonRow[] = [];
    const sectorA = (answersA['anchor_sector'] as SectorValue) || null;
    const sectorGroupA = getSectorGroup(sectorA);
    const lifeStageA = (answersA['anchor_life_stage'] as LifeStageValue) || null;

    const sectorB = (answersB['anchor_sector'] as SectorValue) || null;
    const sectorGroupB = getSectorGroup(sectorB);
    const lifeStageB = (answersB['anchor_life_stage'] as LifeStageValue) || null;

    for (const section of SF_SECTIONS) {
      for (const q of section.questions) {
        if (!COMPARISON_IDS.includes(q.id)) continue;
        if (q.type !== 'slider' || !q.forSelf) continue;

        const visibleA = isQuestionVisible(q, answersA, sectorGroupA, sectorA, lifeStageA, genderA as 'MALE' | 'FEMALE');
        const visibleB = isQuestionVisible(q, answersB, sectorGroupB, sectorB, lifeStageB, genderB as 'MALE' | 'FEMALE');
        if (!visibleA || !visibleB) continue;

        const valA = answersA[q.id];
        const valB = answersB[q.id];
        if (valA == null || valB == null) continue;

        result.push({
          label: tA(q.textKey),
          leftLabel: q.sliderLeftKey ? tA(q.sliderLeftKey) : '',
          rightLabel: q.sliderRightKey ? tA(q.sliderRightKey) : '',
          valueA: Number(valA),
          valueB: Number(valB),
          min: q.sliderMin ?? 0,
          max: q.sliderMax ?? 100,
        });
      }
    }
    return result;
  }, [answersA, answersB, genderA, genderB, tA]);

  if (rows.length === 0) return null;

  return (
    <div className="rounded-xl border border-purple-100 overflow-hidden">
      <div className="px-4 py-2.5 bg-gradient-to-r from-purple-50 to-pink-50 flex items-center gap-2">
        <span className="text-base">⚖️</span>
        <h4 className="font-semibold text-sm text-purple-700">
          {locale === 'he' ? 'השוואת אישיות' : 'Personality Comparison'}
        </h4>
      </div>

      <div className="p-4 space-y-5">
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
            <span>{nameA}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-400" />
            <span>{nameB}</span>
          </div>
        </div>

        {rows.map((row, idx) => {
          const range = row.max - row.min || 1;
          const pctA = Math.round(((row.valueA - row.min) / range) * 100);
          const pctB = Math.round(((row.valueB - row.min) / range) * 100);
          const distance = Math.abs(pctA - pctB);
          const isClose = distance < 20;

          return (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600 font-medium">{row.label}</p>
                <span className={cn(
                  'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                  isClose ? 'bg-green-50 text-green-600' : distance > 40 ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'
                )}>
                  {isClose
                    ? (locale === 'he' ? 'דומה' : 'Similar')
                    : distance > 40
                      ? (locale === 'he' ? 'שונה' : 'Different')
                      : (locale === 'he' ? 'מעט שונה' : 'Slightly different')}
                </span>
              </div>
              <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                {/* A marker */}
                <div
                  className="absolute top-0 w-3 h-3 rounded-full bg-teal-400 border-2 border-white shadow-sm z-10"
                  style={{ insetInlineStart: `calc(${pctA}% - 6px)` }}
                />
                {/* B marker */}
                <div
                  className="absolute top-0 w-3 h-3 rounded-full bg-pink-400 border-2 border-white shadow-sm z-10"
                  style={{ insetInlineStart: `calc(${pctB}% - 6px)` }}
                />
                {/* Connection line */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-teal-200 to-pink-200 rounded-full"
                  style={{
                    insetInlineStart: `${Math.min(pctA, pctB)}%`,
                    width: `${distance}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>{row.leftLabel}</span>
                <span>{row.rightLabel}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SfSliderComparison;
