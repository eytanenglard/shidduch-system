// src/components/profile/sections/neshma-insight/NeshmaInsightButton.tsx

'use client';

import React from 'react';
import { useNeshmaInsight } from './useNeshmaInsight';
import { InsightLockedState } from './InsightLockedState';
import { InsightGenerateButton } from './InsightGenerateButton';

// =====================================================
// Types
// =====================================================

interface NeshmaInsightButtonProps {
  userId: string;
  locale: 'he' | 'en';
  completionPercentage: number;
  lastGeneratedAt?: string | Date | null;
  generatedCount?: number;
  userRole?: string;
  dict: {
    buttonText: string;
    buttonSubtitle: string;
    dialogTitle: string;
    generating: string;
    downloadPdf?: string;
    close: string;
    lockedTitle?: string;
    lockedDescription?: string;
    alreadyGeneratedToday?: string;
    minimizedButtonText?: string;
    nextReportTomorrow?: string;
    nextReportIn?: string;
  };
}

// =====================================================
// Orchestrator Component
// =====================================================

export const NeshmaInsightButton: React.FC<NeshmaInsightButtonProps> = ({
  userId,
  locale,
  completionPercentage,
  lastGeneratedAt,
  generatedCount = 0,
  userRole,
  dict,
}) => {
  const hook = useNeshmaInsight({
    userId,
    locale,
    completionPercentage,
    lastGeneratedAt,
    generatedCount,
    userRole,
    dict,
  });

  // --- Locked State ---
  if (!hook.isProfileComplete) {
    return (
      <InsightLockedState
        locale={locale}
        completionPercentage={completionPercentage}
        dict={dict}
      />
    );
  }

  // --- Generate / View Report ---
  return (
    <InsightGenerateButton
      hook={hook}
      locale={locale}
      dict={dict}
    />
  );
};
