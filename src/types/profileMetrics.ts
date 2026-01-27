// ============================================================
// NeshamaTech - Profile Metrics Types
// src/lib/types/profileMetrics.ts
// ============================================================

// ═══════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════

export enum CalculatedBy {
  AI_AUTO = 'AI_AUTO',
  MATCHMAKER_EDIT = 'MATCHMAKER_EDIT',
  USER_QUESTIONNAIRE = 'USER_QUESTIONNAIRE',
}

export enum HumorStyle {
  CYNICAL = 'CYNICAL',
  LIGHT = 'LIGHT',
  WORDPLAY = 'WORDPLAY',
  SELF_DEPRECATING = 'SELF_DEPRECATING',
  PHYSICAL = 'PHYSICAL',
  DRY = 'DRY',
}

export enum EthnicBackground {
  ASHKENAZI = 'ASHKENAZI',
  SEPHARDI = 'SEPHARDI',
  MIXED = 'MIXED',
  ETHIOPIAN = 'ETHIOPIAN',
  YEMENITE = 'YEMENITE',
  OTHER = 'OTHER',
}

export enum BackgroundCategory {
  SABRA = 'SABRA',
  SABRA_INTERNATIONAL = 'SABRA_INTERNATIONAL',
  OLEH_VETERAN = 'OLEH_VETERAN',
  OLEH_MID = 'OLEH_MID',
  OLEH_NEW = 'OLEH_NEW',
}

export enum CommunicationStyle {
  DIRECT = 'DIRECT',
  EMPATHETIC = 'EMPATHETIC',
  ANALYTICAL = 'ANALYTICAL',
  HUMOROUS = 'HUMOROUS',
  EMOTIONAL = 'EMOTIONAL',
}

export enum ConflictStyle {
  CONFRONTING = 'CONFRONTING',
  AVOIDING = 'AVOIDING',
  COMPROMISING = 'COMPROMISING',
  NEEDS_TIME = 'NEEDS_TIME',
  COLLABORATIVE = 'COLLABORATIVE',
}

export enum SupportStyle {
  LISTENING = 'LISTENING',
  SOLVING = 'SOLVING',
  DISTRACTING = 'DISTRACTING',
  SPACE = 'SPACE',
  PHYSICAL = 'PHYSICAL',
}

export enum PetsAttitude {
  LOVE = 'LOVE',
  NEUTRAL = 'NEUTRAL',
  DISLIKE = 'DISLIKE',
  ALLERGIC = 'ALLERGIC',
}

export enum PersonalityType {
  LEADER = 'LEADER',
  SUPPORTER = 'SUPPORTER',
  ANALYTICAL = 'ANALYTICAL',
  CREATIVE = 'CREATIVE',
  CAREGIVER = 'CAREGIVER',
  ADVENTURER = 'ADVENTURER',
  HARMONIZER = 'HARMONIZER',
}

export enum AttachmentStyle {
  SECURE = 'SECURE',
  ANXIOUS = 'ANXIOUS',
  AVOIDANT = 'AVOIDANT',
  DISORGANIZED = 'DISORGANIZED',
}

// ═══════════════════════════════════════════════════════════════
// DEAL BREAKERS TYPES
// ═══════════════════════════════════════════════════════════════

export type DealBreakerOperator = 
  | 'EQUALS' 
  | 'NOT_EQUALS' 
  | 'GREATER_THAN' 
  | 'LESS_THAN' 
  | 'IN' 
  | 'NOT_IN' 
  | 'MUST_INCLUDE' 
  | 'MUST_EXCLUDE';

export interface HardDealBreaker {
  type: string;  // 'RELIGIOUS_LEVEL', 'HAS_CHILDREN', 'LANGUAGE', 'HEAD_COVERING', etc.
  operator: DealBreakerOperator;
  value?: string | number | boolean;
  values?: (string | number)[];
  description?: string;  // הסבר לשדכן
}

export interface SoftDealBreaker {
  type: string;  // 'HEIGHT_MIN', 'ETHNIC_PREFERENCE', 'AGE_OUTSIDE_RANGE', etc.
  value?: number | string;
  preferred?: string[];
  penalty: number;  // כמה נקודות להוריד
  description?: string;
}

// ═══════════════════════════════════════════════════════════════
// LOVE LANGUAGES
// ═══════════════════════════════════════════════════════════════

export enum LoveLanguage {
  QUALITY_TIME = 'QUALITY_TIME',
  WORDS_OF_AFFIRMATION = 'WORDS_OF_AFFIRMATION',
  PHYSICAL_TOUCH = 'PHYSICAL_TOUCH',
  ACTS_OF_SERVICE = 'ACTS_OF_SERVICE',
  GIFTS = 'GIFTS',
}

// ═══════════════════════════════════════════════════════════════
// RELATIONSHIP GOALS
// ═══════════════════════════════════════════════════════════════

export interface RelationshipGoals {
  timeline?: '6_months' | '1_year' | '1-2_years' | '2-3_years' | 'no_rush';
  childrenImportance?: 'critical' | 'important' | 'neutral' | 'prefer_not';
  marriageImportance?: 'essential' | 'preferred' | 'open' | 'not_important';
  livingArrangement?: 'israel_only' | 'flexible' | 'abroad_preferred';
}

// ═══════════════════════════════════════════════════════════════
// METRIC EXPLANATION
// ═══════════════════════════════════════════════════════════════

export interface MetricExplanation {
  value: number;
  confidence: number;  // 0-100
  source: 'questionnaire' | 'inferred' | 'matchmaker' | 'default';
  reasoning?: string;
  sourceQuestions?: string[];  // IDs של שאלות שהשפיעו
}

// ═══════════════════════════════════════════════════════════════
// MAIN PROFILE METRICS INTERFACE
// ═══════════════════════════════════════════════════════════════

export interface ProfileMetrics {
  id: string;
  profileId: string;
  createdAt: Date;
  updatedAt: Date;
  
  // מטא-דאטה
  calculatedBy: CalculatedBy;
  confidenceScore: number;  // 0-100
  dataCompleteness: number;  // 0-100
  lastAiAnalysisAt?: Date;
  
  // ═══ SECTION A: SELF METRICS ═══
  
  // אישיות ואופי
  socialEnergy?: number;
  emotionalExpression?: number;
  stabilityVsSpontaneity?: number;
  independenceLevel?: number;
  optimismLevel?: number;
  humorStyle?: HumorStyle;
  
  // כיוון וקריירה
  careerOrientation?: number;
  intellectualOrientation?: number;
  financialApproach?: number;
  ambitionLevel?: number;
  
  // דת ומסורת
  religiousStrictness?: number;
  spiritualDepth?: number;
  cultureConsumption?: number;
  
  // רקע וזהות
  urbanScore?: number;
  englishFluency?: number;
  americanCompatibility?: number;
  ethnicBackground?: EthnicBackground;
  backgroundCategory?: BackgroundCategory;
  
  // זוגיות ומשפחה
  togetherVsAutonomy?: number;
  familyInvolvement?: number;
  parenthoodPriority?: number;
  growthVsAcceptance?: number;
  
  // סגנון חיים
  nightOwlScore?: number;
  adventureScore?: number;
  petsAttitude?: PetsAttitude;
  
  // תקשורת והתמודדות
  communicationStyle?: CommunicationStyle;
  conflictStyle?: ConflictStyle;
  supportStyle?: SupportStyle;
  
  // דגלים מיוחדים
  appearancePickiness?: number;
  difficultyFlags?: string[];
  
  // ═══ SECTION B: PREFERENCE METRICS ═══
  
  prefSocialEnergyMin?: number;
  prefSocialEnergyMax?: number;
  prefSocialEnergyWeight?: number;
  
  prefEmotionalExpressionMin?: number;
  prefEmotionalExpressionMax?: number;
  prefEmotionalExpressionWeight?: number;
  
  prefStabilityMin?: number;
  prefStabilityMax?: number;
  prefStabilityWeight?: number;
  
  prefReligiousStrictnessMin?: number;
  prefReligiousStrictnessMax?: number;
  prefReligiousStrictnessWeight?: number;
  
  prefSpiritualDepthMin?: number;
  prefSpiritualDepthMax?: number;
  prefSpiritualDepthWeight?: number;
  
  prefCareerOrientationMin?: number;
  prefCareerOrientationMax?: number;
  prefCareerOrientationWeight?: number;
  
  prefAmbitionMin?: number;
  prefAmbitionMax?: number;
  prefAmbitionWeight?: number;
  
  prefFinancialMin?: number;
  prefFinancialMax?: number;
  prefFinancialWeight?: number;
  
  prefUrbanScoreMin?: number;
  prefUrbanScoreMax?: number;
  prefUrbanScoreWeight?: number;
  
  prefAdventureScoreMin?: number;
  prefAdventureScoreMax?: number;
  prefAdventureScoreWeight?: number;
  
  prefNightOwlMin?: number;
  prefNightOwlMax?: number;
  prefNightOwlWeight?: number;
  
  prefTogetherVsAutonomyMin?: number;
  prefTogetherVsAutonomyMax?: number;
  prefTogetherVsAutonomyWeight?: number;
  
  prefFamilyInvolvementMin?: number;
  prefFamilyInvolvementMax?: number;
  prefFamilyInvolvementWeight?: number;
  
  prefGrowthVsAcceptanceMin?: number;
  prefGrowthVsAcceptanceMax?: number;
  prefGrowthVsAcceptanceWeight?: number;
  
  // ═══ SECTION C: DEAL BREAKERS ═══
  
  dealBreakersHard?: HardDealBreaker[];
  dealBreakersSoft?: SoftDealBreaker[];
  
  // ═══ SECTION D: INFERRED TRAITS ═══
  
  inferredPersonalityType?: PersonalityType;
  inferredAttachmentStyle?: AttachmentStyle;
  inferredLoveLanguages?: LoveLanguage[];
  inferredRelationshipGoals?: RelationshipGoals;
  
  // ═══ SECTION E: AI CACHE ═══
  
  metricsExplanations?: Record<string, MetricExplanation>;
  aiPersonalitySummary?: string;
  aiSeekingSummary?: string;
}

// ═══════════════════════════════════════════════════════════════
// INPUT/OUTPUT TYPES FOR AI EXTRACTION
// ═══════════════════════════════════════════════════════════════

export interface MetricsExtractionInput {
  profile: {
    id: string;
    gender: string;
    age: number;
    city?: string;
    religiousLevel?: string;
    religiousJourney?: string;
    occupation?: string;
    education?: string;
    about?: string;
    origin?: string;
    nativeLanguage?: string;
    additionalLanguages?: string[];
    aliyaYear?: number;
    aliyaCountry?: string;
    shomerNegiah?: boolean;
    headCovering?: string;
    kippahType?: string;
  };
  
  questionnaireAnswers?: {
    personality?: Record<string, any>;
    values?: Record<string, any>;
    relationship?: Record<string, any>;
    partner?: Record<string, any>;
    religion?: Record<string, any>;
  };
  
  aiProfileSummary?: {
    personalitySummary?: string;
    lookingForSummary?: string;
  };
  
  matchmakerNotes?: string;
}

export interface MetricsExtractionOutput {
  metrics: Partial<ProfileMetrics>;
  explanations: Record<string, MetricExplanation>;
  overallConfidence: number;
  warnings: string[];
}

// ═══════════════════════════════════════════════════════════════
// COMPATIBILITY SCORE TYPES
// ═══════════════════════════════════════════════════════════════

export interface MetricCompatibilityResult {
  metric: string;
  valueA: number;
  preferenceMinB: number;
  preferenceMaxB: number;
  weightB: number;
  compatibilityScore: number;  // 0-100
  penalty: number;
}

export interface CompatibilityBreakdown {
  metricsScore: number;
  vectorScore?: number;
  dealBreakersPassed: boolean;
  softPenalties: number;
  
  metricDetails: MetricCompatibilityResult[];
  failedDealBreakers: string[];
  appliedSoftPenalties: { type: string; penalty: number }[];
}

export interface PairCompatibilityResult {
  profileAId: string;
  profileBId: string;
  
  // ציון מ-A ל-B (כמה B מתאים ל-A)
  scoreAtoB: number;
  breakdownAtoB: CompatibilityBreakdown;
  
  // ציון מ-B ל-A (כמה A מתאים ל-B)
  scoreBtoA: number;
  breakdownBtoA: CompatibilityBreakdown;
  
  // ציון סימטרי
  symmetricScore: number;
  
  // המלצה
  recommendation: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'BLOCKED';
  flags: string[];
}

// ═══════════════════════════════════════════════════════════════
// DIFFICULTY FLAGS
// ═══════════════════════════════════════════════════════════════

export const DIFFICULTY_FLAGS = {
  PICKY_ON_LOOKS: 'מקפיד/ה מאוד על מראה',
  NARROW_RELIGIOUS_RANGE: 'טווח דתי צר מאוד',
  UNREALISTIC_EXPECTATIONS: 'ציפיות לא ריאליסטיות',
  VERY_SPECIFIC_PREFERENCES: 'העדפות מאוד ספציפיות',
  LIMITED_POOL: 'מאגר מצומצם (גיל/מיקום)',
  PREVIOUS_REJECTIONS: 'היסטוריה של דחיות רבות',
  UNCLEAR_GOALS: 'מטרות לא ברורות',
  COMMUNICATION_CHALLENGES: 'אתגרים בתקשורת',
} as const;

export type DifficultyFlag = keyof typeof DIFFICULTY_FLAGS;

// ═══════════════════════════════════════════════════════════════
// METRIC WEIGHTS (DEFAULT)
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_METRIC_WEIGHTS: Record<string, number> = {
  religiousStrictness: 15,
  careerOrientation: 10,
  socialEnergy: 10,
  familyInvolvement: 8,
  togetherVsAutonomy: 8,
  financialApproach: 7,
  urbanScore: 6,
  adventureScore: 5,
  stabilityVsSpontaneity: 5,
  englishFluency: 5,
  emotionalExpression: 5,
  nightOwlScore: 4,
  intellectualOrientation: 4,
  growthVsAcceptance: 4,
  parenthoodPriority: 4,
  spiritualDepth: 3,
  ambitionLevel: 3,
  independenceLevel: 2,
  optimismLevel: 2,
};

// ═══════════════════════════════════════════════════════════════
// BACKGROUND COMPATIBILITY MATRIX
// ═══════════════════════════════════════════════════════════════

export const BACKGROUND_COMPATIBILITY_MATRIX: Record<BackgroundCategory, Record<BackgroundCategory, number>> = {
  [BackgroundCategory.SABRA]: {
    [BackgroundCategory.SABRA]: 1.0,
    [BackgroundCategory.SABRA_INTERNATIONAL]: 1.1,
    [BackgroundCategory.OLEH_VETERAN]: 0.9,
    [BackgroundCategory.OLEH_MID]: 0.7,
    [BackgroundCategory.OLEH_NEW]: 0.4,
  },
  [BackgroundCategory.SABRA_INTERNATIONAL]: {
    [BackgroundCategory.SABRA]: 1.1,
    [BackgroundCategory.SABRA_INTERNATIONAL]: 1.2,
    [BackgroundCategory.OLEH_VETERAN]: 1.0,
    [BackgroundCategory.OLEH_MID]: 0.9,
    [BackgroundCategory.OLEH_NEW]: 0.7,
  },
  [BackgroundCategory.OLEH_VETERAN]: {
    [BackgroundCategory.SABRA]: 0.9,
    [BackgroundCategory.SABRA_INTERNATIONAL]: 1.0,
    [BackgroundCategory.OLEH_VETERAN]: 1.1,
    [BackgroundCategory.OLEH_MID]: 1.0,
    [BackgroundCategory.OLEH_NEW]: 0.8,
  },
  [BackgroundCategory.OLEH_MID]: {
    [BackgroundCategory.SABRA]: 0.7,
    [BackgroundCategory.SABRA_INTERNATIONAL]: 0.9,
    [BackgroundCategory.OLEH_VETERAN]: 1.0,
    [BackgroundCategory.OLEH_MID]: 1.1,
    [BackgroundCategory.OLEH_NEW]: 1.0,
  },
  [BackgroundCategory.OLEH_NEW]: {
    [BackgroundCategory.SABRA]: 0.4,
    [BackgroundCategory.SABRA_INTERNATIONAL]: 0.7,
    [BackgroundCategory.OLEH_VETERAN]: 0.8,
    [BackgroundCategory.OLEH_MID]: 1.0,
    [BackgroundCategory.OLEH_NEW]: 1.2,
  },
};

// ═══════════════════════════════════════════════════════════════
// ETHNIC COMPATIBILITY (SOFT)
// ═══════════════════════════════════════════════════════════════

export const ETHNIC_COMPATIBILITY_PENALTY: Record<string, number> = {
  // פער גדול = penalty גבוה יותר (אבל לא פוסל)
  'ASHKENAZI_ETHIOPIAN': 15,
  'ASHKENAZI_YEMENITE': 10,
  'SEPHARDI_ETHIOPIAN': 10,
  'SEPHARDI_ASHKENAZI': 5,
  'MIXED_ANY': 0,  // מעורב מתאים לכולם
};

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * בודק האם ערך בתוך טווח מבוקש
 */
export function isInPreferenceRange(
  value: number | undefined,
  min: number | undefined,
  max: number | undefined
): boolean {
  if (value === undefined) return true;  // אין מידע = לא פוסל
  const effectiveMin = min ?? 0;
  const effectiveMax = max ?? 100;
  return value >= effectiveMin && value <= effectiveMax;
}

/**
 * מחשב ציון התאמה של ערך לטווח
 * 0 = לא מתאים בכלל, 100 = מתאים מושלם
 */
export function calculateRangeCompatibility(
  value: number | undefined,
  min: number | undefined,
  max: number | undefined,
  weight: number = 5
): number {
  if (value === undefined) return 50;  // ניטרלי אם אין מידע
  
  const effectiveMin = min ?? 0;
  const effectiveMax = max ?? 100;
  
  // אם בתוך הטווח - 100
  if (value >= effectiveMin && value <= effectiveMax) {
    return 100;
  }
  
  // אם מחוץ לטווח - חישוב penalty
  const distance = value < effectiveMin 
    ? effectiveMin - value 
    : value - effectiveMax;
  
  // כל 10 נקודות מרחק = -20 ציון
  const penalty = Math.min(distance * 2, 100);
  
  return Math.max(0, 100 - penalty);
}

/**
 * ממפה רמה דתית לציון מספרי
 */
export function religiousLevelToScore(level: string | undefined): number | undefined {
  const mapping: Record<string, number> = {
    'charedi_hasidic': 100,
    'charedi_litvish': 95,
    'charedi_sephardi': 90,
    'chardal': 85,
    'dati_leumi_torani': 75,
    'dati_leumi': 65,
    'dati_leumi_liberal': 55,
    'dati_lite': 45,
    'masorti_dati': 35,
    'masorti': 25,
    'masorti_hiloni': 15,
    'hiloni_traditional': 10,
    'hiloni': 5,
    'secular': 0,
  };
  
  return level ? mapping[level] : undefined;
}

/**
 * מחשב את קטגוריית הרקע לפי שנת עלייה
 */
export function calculateBackgroundCategory(
  aliyaYear: number | undefined,
  nativeLanguage: string | undefined,
  aliyaCountry: string | undefined
): BackgroundCategory {
  // אם לא עלה - צבר
  if (!aliyaYear) {
    // בדיקה אם יש רקע בינלאומי (הורים עולים, שפה זרה)
    if (nativeLanguage && !['hebrew', 'עברית'].includes(nativeLanguage.toLowerCase())) {
      return BackgroundCategory.SABRA_INTERNATIONAL;
    }
    return BackgroundCategory.SABRA;
  }
  
  const currentYear = new Date().getFullYear();
  const yearsInIsrael = currentYear - aliyaYear;
  
  if (yearsInIsrael >= 10) return BackgroundCategory.OLEH_VETERAN;
  if (yearsInIsrael >= 3) return BackgroundCategory.OLEH_MID;
  return BackgroundCategory.OLEH_NEW;
}

/**
 * מחשב ציון אנגלית לפי שדות קיימים
 */
export function calculateEnglishFluency(
  nativeLanguage: string | undefined,
  additionalLanguages: string[] | undefined,
  aliyaCountry: string | undefined
): number {
  // אם אנגלית שפת אם
  if (nativeLanguage?.toLowerCase() === 'english') {
    return 100;
  }
  
  // אם עלה ממדינה דוברת אנגלית
  const englishCountries = ['usa', 'united states', 'uk', 'united kingdom', 'canada', 'australia', 'south africa'];
  if (aliyaCountry && englishCountries.some(c => aliyaCountry.toLowerCase().includes(c))) {
    return 95;
  }
  
  // אם אנגלית בשפות נוספות
  if (additionalLanguages?.some(l => l.toLowerCase() === 'english')) {
    return 70;
  }
  
  // ברירת מחדל - אנגלית בסיסית
  return 30;
}

/**
 * מחשב ציון עירוניות לפי עיר
 */
export function calculateUrbanScore(city: string | undefined): number {
  if (!city) return 50;
  
  const cityLower = city.toLowerCase();
  
  // ערים גדולות מאוד
  if (['תל אביב', 'tel aviv', 'תל-אביב'].some(c => cityLower.includes(c))) return 100;
  if (['ירושלים', 'jerusalem'].some(c => cityLower.includes(c))) return 85;
  if (['חיפה', 'haifa'].some(c => cityLower.includes(c))) return 80;
  
  // ערים גדולות
  if (['רמת גן', 'ramat gan', 'גבעתיים', 'givatayim', 'הרצליה', 'herzliya', 'רעננה', 'raanana', 'כפר סבא', 'kfar saba', 'פתח תקווה', 'petach tikva', 'ראשון לציון', 'rishon', 'באר שבע', 'beer sheva', 'נתניה', 'netanya'].some(c => cityLower.includes(c))) return 70;
  
  // ערים בינוניות
  if (['מודיעין', 'modiin', 'רחובות', 'rehovot', 'אשדוד', 'ashdod', 'אשקלון', 'ashkelon'].some(c => cityLower.includes(c))) return 60;
  
  // ישובים/יישובים קטנים
  if (['yishuv', 'ישוב', 'מושב', 'moshav', 'קיבוץ', 'kibbutz'].some(c => cityLower.includes(c))) return 20;
  
  // ברירת מחדל
  return 50;
}