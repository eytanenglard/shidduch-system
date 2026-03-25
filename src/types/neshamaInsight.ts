// src/types/neshamaInsight.ts
// Type definitions for the structured Neshama Insight (Full Picture) report

export interface ProfileTips {
  personalitySummary: string;
  lookingForSummary: string;
  completenessReport: Array<{
    area: string;
    status: 'COMPLETE' | 'PARTIAL' | 'MISSING';
    feedback: string;
  }>;
  actionableTips: Array<{
    area: string;
    tip: string;
  }>;
}

export interface NeshamaInsightReport {
  tldr: string;
  opening: string;
  soulMap: string;
  strengths: string;
  growthChallenges: string;
  classicFit: string;
  trap: string;
  dealbreakers: string;
  whereToRelax: string;
  datingDynamics: string;
  goldenQuestions: string[];
  recommendedDate: string;
  actionSteps: string[];
  closingWords: string;
  // Profile improvement tips (added in unified report)
  profileTips?: ProfileTips;
}

// Section metadata for UI rendering
export interface InsightSectionConfig {
  key: keyof NeshamaInsightReport;
  icon: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  iconBgClass: string;
}

// Validate that a parsed object matches the report structure
export function isValidInsightReport(data: unknown): data is NeshamaInsightReport {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;

  const requiredStrings = [
    'tldr', 'opening', 'soulMap', 'strengths', 'growthChallenges',
    'classicFit', 'trap', 'dealbreakers', 'whereToRelax',
    'datingDynamics', 'recommendedDate', 'closingWords',
  ];

  for (const key of requiredStrings) {
    if (typeof obj[key] !== 'string') return false;
  }

  if (!Array.isArray(obj.goldenQuestions)) return false;
  if (!Array.isArray(obj.actionSteps)) return false;

  return true;
}
