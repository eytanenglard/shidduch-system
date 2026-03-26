// src/lib/constants/questionnaireConfig.ts
// Central configuration for questionnaire-related constants

export type WorldId = 'PERSONALITY' | 'VALUES' | 'RELATIONSHIP' | 'PARTNER' | 'RELIGION';

/** Number of questions per questionnaire world */
export const QUESTION_COUNTS: Record<WorldId, number> = {
  PERSONALITY: 25,
  VALUES: 23,
  RELATIONSHIP: 22,
  PARTNER: 19,
  RELIGION: 20,
} as const;

/** Total number of questions across all worlds */
export const TOTAL_QUESTION_COUNT = Object.values(QUESTION_COUNTS).reduce((sum, count) => sum + count, 0);

/** Minimum profile completion percentage required to generate Neshama Insight */
export const COMPLETION_THRESHOLD = 90;

/** Cooldown period between Neshama Insight generations (in hours) */
export const INSIGHT_COOLDOWN_HOURS = 168; // 7 days
