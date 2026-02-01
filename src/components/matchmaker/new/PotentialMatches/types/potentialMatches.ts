// =============================================================================
// src/types/potentialMatches.ts
// טיפוסים מלאים למערכת ההתאמות הפוטנציאליות והסריקה הלילית
// =============================================================================

// =============================================================================
// ENUMS (מקבילים ל-Prisma)
// =============================================================================

export type PotentialMatchStatus = 
  | 'PENDING'      // טרם נבדק
  | 'REVIEWED'     // נבדק אך לא הוחלט
  | 'SENT'         // נשלחה הצעה
  | 'DISMISSED'    // נדחה ע"י השדכן
  | 'EXPIRED'
    | 'SHORTLISTED';     // פג תוקף
  

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
  | 'female_waiting_time';

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
// RELIGIOUS LEVELS (לתצוגה)
// =============================================================================

export const RELIGIOUS_LEVEL_LABELS: Record<string, string> = {
  'charedi_hasidic': 'חרדי חסידי',
  'charedi_litvak': 'חרדי ליטאי',
  'charedi_sephardic': 'חרדי ספרדי',
  'chabad': 'חב"ד',
  'breslov': 'ברסלב',
  'charedi_modern': 'חרדי מודרני',
  'dati_leumi_torani': 'דתי לאומי תורני',
  'dati_leumi_standard': 'דתי לאומי',
  'dati_leumi_liberal': 'דתי לאומי ליברלי',
  'masorti_strong': 'מסורתי חזק',
  'masorti_light': 'מסורתי',
  'secular_traditional_connection': 'חילוני עם קשר למסורת',
  'secular': 'חילוני',
  'spiritual_not_religious': 'רוחני לא דתי',
  'other': 'אחר',
};

export function getReligiousLevelLabel(level: string | null): string {
  if (!level) return 'לא צוין';
  return RELIGIOUS_LEVEL_LABELS[level] || level;
}

// =============================================================================
// BACKGROUND COMPATIBILITY (לתצוגה)
// =============================================================================

export const BACKGROUND_COMPATIBILITY_LABELS: Record<string, { label: string; color: string }> = {
  'excellent': { label: 'רקע מצוין', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  'good': { label: 'רקע טוב', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  'possible': { label: 'רקע אפשרי', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  'problematic': { label: 'פער רקע', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  'not_recommended': { label: 'רקע בעייתי', color: 'bg-red-100 text-red-700 border-red-200' },
};

export function getBackgroundBadge(compatibility: string | null): { label: string; color: string } | null {
  if (!compatibility) return null;
  return BACKGROUND_COMPATIBILITY_LABELS[compatibility] || null;
}

// =============================================================================
// STATUS (לתצוגה)
// =============================================================================

export const STATUS_LABELS: Record<PotentialMatchStatus, { label: string; color: string }> = {
  'PENDING': { label: 'ממתין', color: 'bg-yellow-100 text-yellow-700' },
  'REVIEWED': { label: 'נבדק', color: 'bg-blue-100 text-blue-700' },
  'SENT': { label: 'נשלחה הצעה', color: 'bg-green-100 text-green-700' },
  'DISMISSED': { label: 'נדחה', color: 'bg-gray-100 text-gray-700' },
  'EXPIRED': { label: 'פג תוקף', color: 'bg-red-100 text-red-700' },
   'SHORTLISTED': { label: 'שמור בצד', color: 'bg-purple-100 text-purple-700' },
};

export function getStatusBadge(status: PotentialMatchStatus): { label: string; color: string } {
  return STATUS_LABELS[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
}

// =============================================================================
// SCORE UTILITIES
// =============================================================================

export function getScoreColor(score: number): string {
  if (score >= 85) return 'text-emerald-600';
  if (score >= 75) return 'text-blue-600';
  if (score >= 70) return 'text-amber-600';
  return 'text-gray-600';
}

export function getScoreBgGradient(score: number): string {
  if (score >= 85) return 'from-emerald-500 to-green-500';
  if (score >= 75) return 'from-blue-500 to-cyan-500';
  if (score >= 70) return 'from-amber-500 to-yellow-500';
  return 'from-gray-500 to-slate-500';
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'מצוין';
  if (score >= 85) return 'גבוה מאוד';
  if (score >= 80) return 'גבוה';
  if (score >= 75) return 'טוב מאוד';
  if (score >= 70) return 'טוב';
  return 'בינוני';
}

// =============================================================================
// SCAN METHOD UTILITIES
// =============================================================================

export const SCAN_METHOD_INFO: Record<string, { 
  label: string; 
  icon: string; 
  description: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}> = {
  hybrid: {
    label: 'היברידי',
    icon: '🔥',
    description: 'סריקה היברידית (4 שלבים) - הכי מקיף',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
  },
  algorithmic: {
    label: 'AI מתקדם',
    icon: '🧠',
    description: 'ניתוח AI מעמיק עם הבנת הקשר',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
  },
  vector: {
    label: 'סריקה מהירה',
    icon: '⚡',
    description: 'סריקה וקטורית מהירה לפי דמיון טקסטואלי',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
  metrics_v2: {
    label: 'מטריקות V2',
    icon: '🎯',
    description: 'ניתוח לפי מדדים מספריים מדויקים',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
  },
};

export function getScanMethodInfo(method: string | null) {
  if (!method) return null;
  return SCAN_METHOD_INFO[method] || null;
}

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

// =============================================================================
// SCORE BREAKDOWN CATEGORIES - קטגוריות הניקוד (לתצוגה)
// =============================================================================

export const SCORE_BREAKDOWN_CATEGORIES = [
  { key: 'religious', label: 'התאמה דתית', max: 25, color: 'bg-purple-500' },
  { key: 'ageCompatibility', label: 'התאמת גיל', max: 10, color: 'bg-blue-500' },
  { key: 'careerFamily', label: 'קריירה-משפחה', max: 15, color: 'bg-cyan-500' },
  { key: 'lifestyle', label: 'סגנון חיים', max: 10, color: 'bg-green-500' },
  { key: 'socioEconomic', label: 'סוציו-אקונומי', max: 10, color: 'bg-orange-500' },
  { key: 'education', label: 'השכלה', max: 10, color: 'bg-pink-500' },
  { key: 'background', label: 'רקע תרבותי', max: 10, color: 'bg-amber-500' },
  { key: 'values', label: 'ערכים ותקשורת', max: 10, color: 'bg-indigo-500' },
] as const;