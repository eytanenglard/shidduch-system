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

// Key slider question IDs that provide the most at-a-glance value
const INSIGHT_SLIDER_IDS = ['s3_energy_type', 's3_plan_change_reaction', 's3_patience_level'];

interface SfInsightsStripProps {
  sfAnswers: Record<string, unknown>;
  gender: string | null;
  locale: string;
  direction: 'ltr' | 'rtl';
}

interface SliderInsight {
  label: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
  min: number;
  max: number;
}

const SfInsightsStrip: React.FC<SfInsightsStripProps> = ({
  sfAnswers,
  gender,
  locale,
  direction,
}) => {
  const answers = sfAnswers as SFAnswers;
  const sector = (answers['anchor_sector'] as SectorValue) || null;
  const sectorGroup = getSectorGroup(sector);
  const lifeStage = (answers['anchor_life_stage'] as LifeStageValue) || null;

  const t = useMemo(() => {
    const dict = (locale === 'he' ? heSfDict : enSfDict) as Record<string, unknown>;
    return (key: string) => getNestedValue(dict, key, gender);
  }, [locale, gender]);

  const insights = useMemo(() => {
    const result: SliderInsight[] = [];

    for (const section of SF_SECTIONS) {
      for (const q of section.questions) {
        if (!INSIGHT_SLIDER_IDS.includes(q.id)) continue;
        if (q.type !== 'slider') continue;
        if (!isQuestionVisible(q, answers, sectorGroup, sector, lifeStage, gender as 'MALE' | 'FEMALE')) continue;

        const val = answers[q.id];
        if (val === null || val === undefined) continue;

        result.push({
          label: t(q.textKey),
          leftLabel: q.sliderLeftKey ? t(q.sliderLeftKey) : '',
          rightLabel: q.sliderRightKey ? t(q.sliderRightKey) : '',
          value: Number(val),
          min: q.sliderMin ?? 0,
          max: q.sliderMax ?? 100,
        });
      }
    }
    return result;
  }, [answers, sectorGroup, sector, lifeStage, gender, t]);

  // Anchor labels
  const sectorLabel = answers['anchor_sector'] ? t(`options.anchor_sector.${answers['anchor_sector']}`) : null;
  const lifeStageLabel = answers['anchor_life_stage'] ? t(`options.anchor_life_stage.${answers['anchor_life_stage']}`) : null;

  if (insights.length === 0 && !sectorLabel && !lifeStageLabel) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-4 py-2" dir={direction}>
      {sectorLabel && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-teal-50 text-teal-600 border border-teal-100">
          {sectorLabel}
        </span>
      )}
      {lifeStageLabel && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-teal-50 text-teal-600 border border-teal-100">
          {lifeStageLabel}
        </span>
      )}
      {insights.map((insight) => {
        const range = insight.max - insight.min || 1;
        const pct = Math.round(((insight.value - insight.min) / range) * 100);
        // Determine which label to show based on where the value falls
        const isLeft = pct < 35;
        const isRight = pct > 65;
        const displayLabel = isLeft ? insight.leftLabel : isRight ? insight.rightLabel : null;

        if (!displayLabel) return null;

        return (
          <span
            key={insight.label}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border',
              'bg-purple-50 text-purple-600 border-purple-100'
            )}
          >
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                pct < 35 ? 'bg-blue-400' : 'bg-orange-400'
              )}
            />
            {displayLabel}
          </span>
        );
      })}
    </div>
  );
};

export default SfInsightsStrip;
