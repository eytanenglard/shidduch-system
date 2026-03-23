// =============================================================================
// src/lib/constants/matching.ts
// קבועים מרכזיים למערכת ההתאמות — מקום אחד, בלי כפילויות
// =============================================================================

// =============================================================================
// SCORE BREAKDOWN CATEGORIES
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

export type ScoreBreakdownKey = typeof SCORE_BREAKDOWN_CATEGORIES[number]['key'];

// =============================================================================
// RELIGIOUS LEVEL LABELS
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
// BACKGROUND COMPATIBILITY
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
// STATUS LABELS
// =============================================================================

export type PotentialMatchStatus =
  | 'PENDING'
  | 'REVIEWED'
  | 'SENT'
  | 'DISMISSED'
  | 'EXPIRED'
  | 'SHORTLISTED';

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

export function getScoreTier(score: number): 'excellent' | 'good' | 'fair' {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  return 'fair';
}

// =============================================================================
// SCAN METHOD INFO — unified key is always camelCase (metricsV2)
// DB stores 'metrics_v2', UI uses 'metricsV2'. Use normalizeScanMethod().
// =============================================================================

export type ScanMethodKey = 'hybrid' | 'algorithmic' | 'vector' | 'metricsV2';

/** Normalize DB value (metrics_v2) → UI key (metricsV2) */
export function normalizeScanMethod(method: string | null): ScanMethodKey | null {
  if (!method) return null;
  if (method === 'metrics_v2') return 'metricsV2';
  if (['hybrid', 'algorithmic', 'vector', 'metricsV2'].includes(method)) return method as ScanMethodKey;
  return null;
}

/** Convert UI key back to DB value */
export function toDbScanMethod(method: ScanMethodKey): string {
  if (method === 'metricsV2') return 'metrics_v2';
  return method;
}

export const SCAN_METHOD_INFO: Record<ScanMethodKey, {
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
    description: 'סריקה היברידית (4 שלבים) — הכי מקיף',
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
  metricsV2: {
    label: 'מטריקות V2',
    icon: '🎯',
    description: 'ניתוח לפי מדדים מספריים מדויקים',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
  },
};

export function getScanMethodInfo(method: string | null) {
  const normalized = normalizeScanMethod(method);
  if (!normalized) return null;
  return SCAN_METHOD_INFO[normalized] || null;
}

// =============================================================================
// AVAILABILITY STATUS
// =============================================================================

export const AVAILABILITY_LABELS: Record<string, { label: string; color: string }> = {
  'AVAILABLE': { label: 'זמין/ה', color: 'bg-green-100 text-green-700' },
  'NOT_LOOKING': { label: 'לא מחפש/ת', color: 'bg-gray-100 text-gray-600' },
  'PAUSED': { label: 'בהפסקה', color: 'bg-amber-100 text-amber-700' },
  'DATING': { label: 'בתהליך', color: 'bg-blue-100 text-blue-700' },
  'ENGAGED': { label: 'מאורס/ת', color: 'bg-pink-100 text-pink-700' },
};
