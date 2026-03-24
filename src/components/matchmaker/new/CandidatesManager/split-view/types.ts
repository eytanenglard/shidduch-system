// Shared types for split-view sub-components

export type BackgroundCompatibility =
  | 'excellent'
  | 'good'
  | 'possible'
  | 'problematic'
  | 'not_recommended';

export interface ScoreBreakdown {
  religious: number;
  careerFamily: number;
  lifestyle: number;
  ambition: number;
  communication: number;
  values: number;
}

export interface AiMatch {
  userId: string;
  firstName?: string;
  lastName?: string;
  score?: number;
  firstPassScore?: number;
  finalScore?: number;
  scoreBreakdown?: ScoreBreakdown;
  reasoning?: string;
  shortReasoning?: string;
  detailedReasoning?: string;
  rank?: number;
  backgroundMultiplier?: number;
  backgroundCompatibility?: BackgroundCompatibility;
  similarity?: number;
}

export interface AiMatchMeta {
  fromCache: boolean;
  savedAt?: string;
  isStale?: boolean;
  algorithmVersion: string;
  totalCandidatesScanned?: number;
  durationMs?: number;
}

export function toBackgroundCompatibility(
  value: string | undefined
): BackgroundCompatibility | undefined {
  const validValues: BackgroundCompatibility[] = [
    'excellent',
    'good',
    'possible',
    'problematic',
    'not_recommended',
  ];
  if (value && validValues.includes(value as BackgroundCompatibility)) {
    return value as BackgroundCompatibility;
  }
  return undefined;
}
