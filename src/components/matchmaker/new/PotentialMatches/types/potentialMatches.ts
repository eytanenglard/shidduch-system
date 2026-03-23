// =============================================================================
// src/types/potentialMatches.ts
// טיפוסים מלאים למערכת ההתאמות הפוטנציאליות והסריקה הלילית
// =============================================================================

// =============================================================================
// ENUMS (מקבילים ל-Prisma)
// =============================================================================

export type AvailabilityStatus =
  | 'AVAILABLE' 
  | 'NOT_LOOKING' 
  | 'PAUSED' 
  | 'DATING' 
  | 'ENGAGED';

// =============================================================================
// SCORE BREAKDOWN - פירוט ציון AI
// =============================================================================

export interface ScoreBreakdown {
  religious?: number;          // התאמה דתית (מקס 25)
  ageCompatibility?: number;   // התאמת גיל (מקס 10)
  careerFamily?: number;       // איזון קריירה-משפחה (מקס 15)
  lifestyle?: number;          // סגנון חיים (מקס 10)
  socioEconomic?: number;      // התאמה סוציו-אקונומית (מקס 10) 🆕
  education?: number;          // התאמת השכלה (מקס 10) 🆕
  background?: number;         // רקע תרבותי/שפה (מקס 10) 🆕
  values?: number;             // ערכים ותקשורת (מקס 10)
  
  // 🔄 תאימות לאחור - שדות ישנים (deprecated)
  ambition?: number;           // @deprecated - use careerFamily
  communication?: number;      // @deprecated - use values
}


// =============================================================================
// CANDIDATE INFO - מידע בסיסי על מועמד
// =============================================================================

export interface CandidateBasicInfo {
  id: string;
  profileId: string; 
  firstName: string;
  lastName: string;
  age: number;
  city: string | null;
  religiousLevel: string | null;
  occupation: string | null;
  mainImage: string | null;
  isVerified: boolean;
  isProfileComplete: boolean;
  availabilityStatus: AvailabilityStatus;
  lastActive?: Date | null;
  registeredAt?: Date;
  phone?: string | null;
   height?: number | null;
  maritalStatus?: string | null;
  nativeLanguage?: string | null;
  additionalLanguages?: string[] | null;
}

// =============================================================================
// ACTIVE SUGGESTION INFO - מידע על הצעה פעילה
// =============================================================================

export interface ActiveSuggestionInfo {
  suggestionId: string;
  status: string;
  withCandidateName: string;
  withCandidateId: string;
  createdAt: Date;
  isBlocking: boolean;
}

export interface ExistingSuggestionForPair {
  suggestionId: string;
  status: string;
  createdAt: Date;
}

// =============================================================================
// POTENTIAL MATCH - התאמה פוטנציאלית מלאה
// =============================================================================

export interface PotentialMatch {
  id: string;
  
  // הזוג
  male: CandidateBasicInfo;
  female: CandidateBasicInfo;
  
  // ציונים כלליים
  aiScore: number;
  firstPassScore: number | null;
  scoreBreakdown: ScoreBreakdown | null;
  
  // נימוקים כלליים
  shortReasoning: string | null;
  detailedReasoning: string | null;
  
  // רקע
  backgroundCompatibility: 'excellent' | 'good' | 'possible' | 'problematic' | 'not_recommended' | null;
  backgroundMultiplier: number | null;
  ageScore: number | null;
  
  // סטטוס
  status: PotentialMatchStatus;
  
  // תאריכים
  scannedAt: Date;
  reviewedAt: Date | null;
  
  // אזהרות על הצעות פעילות
  maleActiveSuggestion: ActiveSuggestionInfo | null;
  femaleActiveSuggestion: ActiveSuggestionInfo | null;
  hasActiveWarning: boolean;
  
  // קישור להצעה שנוצרה (אם יש)
  suggestionId: string | null;

  // הצעה קיימת ברמת הזוג (בכל סטטוס)
  existingSuggestionForPair: ExistingSuggestionForPair | null;

  // ═══════════════════════════════════════════════════════════════
  // 🆕 ציונים ונימוקים לפי שיטת סריקה
  // ═══════════════════════════════════════════════════════════════

  // Hybrid Method (4-tier) - הכי מקיף
  hybridScore: number | null;
  hybridReasoning: string | null;
  hybridScannedAt: Date | null;
  hybridScoreBreakdown: ScoreBreakdown | null;
  
  // Algorithmic Method (AI Deep)
  algorithmicScore: number | null;
  algorithmicReasoning: string | null;
  algorithmicScannedAt: Date | null;
  algorithmicScoreBreakdown: ScoreBreakdown | null;
  
  // Vector Method (Fast similarity)
  vectorScore: number | null;
  vectorReasoning: string | null;
  vectorScannedAt: Date | null;
  
  // Metrics V2 Method
  metricsV2Score: number | null;
  metricsV2Reasoning: string | null;
  metricsV2ScannedAt: Date | null;
  metricsV2ScoreBreakdown: ScoreBreakdown | null;
  
  // השיטה האחרונה שרצה
  lastScanMethod: 'hybrid' | 'algorithmic' | 'vector' | 'metrics_v2' | string | null;
}


// =============================================================================
// PAGINATION
// =============================================================================

export interface Pagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// =============================================================================
// STATS - סטטיסטיקות
// =============================================================================

export interface PotentialMatchesStats {
  total: number;
  pending: number;
  reviewed: number;
  sent: number;
  dismissed: number;
  expired: number;
  withWarnings: number;
  avgScore: number;
  highScore: number;   // 85+
  mediumScore: number; // 70-85
}

// =============================================================================
// LAST SCAN INFO - מידע על הסריקה האחרונה
// =============================================================================

export interface LastScanInfo {
  id: string;
  startedAt: Date;
  completedAt: Date | null;
  status: 'running' | 'completed' | 'failed' | 'partial';
  totalCandidates: number;
  candidatesScanned: number;
  matchesFound: number;
  newMatches: number;
  updatedMatches?: number;
  durationMs: number | null;
  method?: string;
}

// =============================================================================
// API RESPONSES
// =============================================================================

export interface PotentialMatchesResponse {
  success: boolean;
  matches: PotentialMatch[];
  pagination: Pagination;
  stats: PotentialMatchesStats;
  lastScanInfo: LastScanInfo | null;
  error?: string;
}

export interface PotentialMatchActionResponse {
  success: boolean;
  message: string;
  match?: {
    id: string;
    status: PotentialMatchStatus;
  };
  suggestionId?: string;
  error?: string;
}

export interface BulkActionResponse {
  success: boolean;
  processed: number;
  message: string;
  error?: string;
}

// =============================================================================
// BATCH SCAN TYPES
// =============================================================================

export interface BatchScanRequest {
  method?: 'algorithmic' | 'vector' | 'hybrid';
  minScoreThreshold?: number;
  maxCandidates?: number;
  forceRefresh?: boolean;
}

export interface BatchScanResponse {
  success: boolean;
  status: 'started' | 'already_running' | 'completed' | 'partial' | 'failed';
  scanId: string;
  message: string;
  stats?: {
    totalCandidates: number;
    maleCandidates: number;
    femaleCandidates: number;
    candidatesScanned: number;
    matchesFound: number;
    newMatches: number;
    updatedMatches: number;
    expiredMatches: number;
    durationMs: number;
    durationMinutes: number;
    errors: number;
  };
  topResults?: Array<{
    candidate: string;
    matches: number;
    new: number;
  }>;
  error?: string;
}

export interface BatchScanProgress {
  scanId: string;
  status: 'running' | 'completed' | 'failed' | 'partial';
  progress: number;
  currentCandidate: string | null;
  candidatesScanned: number;
  totalCandidates: number;
  matchesFound: number;
  elapsedMs: number;
  estimatedRemainingMs: number | null;
  error: string | null;
}

// =============================================================================
// FILTER & SORT OPTIONS
// =============================================================================

export type PotentialMatchSortBy =
  | 'score_desc'
  | 'score_asc'
  | 'date_desc'
  | 'date_asc'
  | 'male_waiting_time'
  | 'female_waiting_time'
  | 'asymmetry_desc';

export type PotentialMatchFilterStatus = 
  | 'all' 
  | 'pending' 
  | 'reviewed' 
  | 'sent' 
  | 'dismissed'
  | 'shortlisted'
  | 'expired'
  | 'with_warnings'
  | 'no_warnings';

export interface PotentialMatchFilters {
  status: PotentialMatchFilterStatus;
  minScore: number;
  maxScore: number;
  religiousLevel: string | null;
  city: string | null;
  hasWarning: boolean | null;
  scannedAfter: Date | null;
  sortBy: PotentialMatchSortBy;
  searchTerm?: string;
  candidateId?: string;
    scanMethod?: 'hybrid' | 'algorithmic' | 'vector' | 'metrics_v2' | null;

}

export interface ScanMethodData {
  score: number | null;
  reasoning: string | null;
  scannedAt: Date | null;
  scoreBreakdown?: ScoreBreakdown | null;
}

// =============================================================================
// ACTION TYPES
// =============================================================================

export type PotentialMatchAction = 
  | 'review'
  | 'dismiss'
  | 'restore'
  | 'create_suggestion'
   | 'save';;

export interface PotentialMatchActionRequest {
  matchId: string;
  action: PotentialMatchAction;
  reason?: string;
  suggestionData?: {
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    firstPartyNotes?: string;
    secondPartyNotes?: string;
    matchingReason?: string;
  };
}

export interface BulkActionRequest {
  matchIds: string[];
  action: 'dismiss' | 'review' | 'restore';
  reason?: string;
}

// =============================================================================
// RE-EXPORT FROM CENTRALIZED CONSTANTS
// =============================================================================

export {
  RELIGIOUS_LEVEL_LABELS,
  getReligiousLevelLabel,
  BACKGROUND_COMPATIBILITY_LABELS,
  getBackgroundBadge,
  STATUS_LABELS,
  getStatusBadge,
  getScoreColor,
  getScoreBgGradient,
  getScoreLabel,
  getScoreTier,
  SCAN_METHOD_INFO,
  getScanMethodInfo,
  normalizeScanMethod,
  SCORE_BREAKDOWN_CATEGORIES,
  AVAILABILITY_LABELS,
} from '@/lib/constants/matching';

export type { ScanMethodKey, ScoreBreakdownKey } from '@/lib/constants/matching';
export type PotentialMatchStatus =
  | 'PENDING'
  | 'REVIEWED'
  | 'SENT'
  | 'DISMISSED'
  | 'EXPIRED'
  | 'SHORTLISTED';
  
export function getAllMethodScores(match: PotentialMatch): ScanMethodData[] {
  return [
    {
      score: match.hybridScore,
      reasoning: match.hybridReasoning,
      scannedAt: match.hybridScannedAt,
      scoreBreakdown: match.hybridScoreBreakdown,
    },
    {
      score: match.algorithmicScore,
      reasoning: match.algorithmicReasoning,
      scannedAt: match.algorithmicScannedAt,
      scoreBreakdown: match.algorithmicScoreBreakdown,
    },
    {
      score: match.vectorScore,
      reasoning: match.vectorReasoning,
      scannedAt: match.vectorScannedAt,
      scoreBreakdown: null,
    },
    {
      score: match.metricsV2Score,
      reasoning: match.metricsV2Reasoning,
      scannedAt: match.metricsV2ScannedAt,
      scoreBreakdown: match.metricsV2ScoreBreakdown,
    },
  ].filter(m => m.score !== null);
}