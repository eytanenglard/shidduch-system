'use client';

import React from 'react';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import SectionCard from '../shared/SectionCard';
import type { ThemeType } from '../../constants/theme';
import type { UserProfile } from '@/types/next-auth';
import type { ProfileCardDisplayDict } from '@/types/dictionary';

interface NeshamaTechSummaryProps {
  profile: UserProfile;
  dict: ProfileCardDisplayDict;
  THEME: ThemeType;
  direction: 'ltr' | 'rtl';
}

const NeshamaTechSummary: React.FC<NeshamaTechSummaryProps> = ({
  profile,
  dict,
  THEME,
  direction,
}) => {
  if (!profile.isNeshamaTechSummaryVisible || !profile.manualEntryText) {
    return null;
  }
  return (
    <SectionCard
      title={dict.content.neshamaTechSummary.title.replace(
        '{{name}}',
        profile.user?.firstName || ''
      )}
      icon={Bot}
      variant="elegant"
      gradient={THEME.colors.primary.gold}
    >
      <div className="text-center italic p-4 bg-amber-50/50 rounded-lg border border-amber-200/50">
        <p
          dir={direction}
          className="whitespace-pre-wrap text-gray-800 leading-relaxed"
        >
          {' '}
          {profile.manualEntryText}
        </p>
      </div>
    </SectionCard>
  );
};

export default NeshamaTechSummary;
