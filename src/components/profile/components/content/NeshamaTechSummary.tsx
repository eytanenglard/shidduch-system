'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/types/next-auth';
import type { ProfileCardDisplayDict } from '@/types/dictionary';

interface NeshamaTechSummaryProps {
  profile: UserProfile;
  dict: ProfileCardDisplayDict;
  direction: 'ltr' | 'rtl';
  // Legacy props (accepted but ignored)
  THEME?: unknown;
}

const NeshamaTechSummary: React.FC<NeshamaTechSummaryProps> = ({
  profile,
  direction,
}) => {
  if (!profile.isNeshamaTechSummaryVisible || !profile.manualEntryText) {
    return null;
  }
  return (
    <div
      className={cn(
        'bg-gray-50 rounded-lg p-4',
        direction === 'rtl'
          ? 'border-r-2 border-gray-200'
          : 'border-l-2 border-gray-200'
      )}
    >
      <p
        dir={direction}
        className="text-sm text-gray-600 italic leading-relaxed whitespace-pre-wrap"
      >
        {profile.manualEntryText}
      </p>
    </div>
  );
};

export default NeshamaTechSummary;
