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

  // ═══ SECTION A.2: NEW SELF METRICS ═══
  socioEconomicLevel?: number;
  jobSeniorityLevel?: number;
  educationLevelScore?: number;

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
  
  // ═══ SECTION B.2: NEW PREFERENCE METRICS ═══
  prefSocioEconomicMin?: number;
  prefSocioEconomicMax?: number;
  prefSocioEconomicWeight?: number;

  prefJobSeniorityMin?: number;
  prefJobSeniorityMax?: number;
  prefJobSeniorityWeight?: number;

  prefEducationLevelMin?: number;
  prefEducationLevelMax?: number;
  prefEducationLevelWeight?: number;

  // ═══ SECTION C: DEAL BREAKERS ═══
  
  dealBreakersHard?: HardDealBreaker[];
  dealBreakersSoft?: SoftDealBreaker[];
  
  // ═══ SECTION D: INFERRED TRAITS ═══
  
  inferredPersonalityType?: PersonalityType;
  inferredAttachmentStyle?: AttachmentStyle;
  inferredLoveLanguages?: LoveLanguage[];
  inferredRelationshipGoals?: RelationshipGoals;
  
  // ═══ SECTION E: INFERRED HARD DATA ═══
  inferredAge?: number;
  inferredCity?: string;
  inferredReligiousLevel?: string;
  inferredPreferredAgeMin?: number;
  inferredPreferredAgeMax?: number;
  inferredPreferredReligiousLevels?: string[];
  inferredParentStatus?: string;
  inferredEducationLevel?: string;

  // ═══ SECTION F: AI ANALYSIS ═══
  metricsExplanations?: Record<string, MetricExplanation>;
  aiPersonalitySummary?: string;
  aiSeekingSummary?: string;
  aiBackgroundSummary?: string;
  aiMatchmakerGuidelines?: string;
  aiInferredDealBreakers?: string[];
  aiInferredMustHaves?: string[];
  difficultyFlags?: string[];
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
    smokingStatus?: string;
    preferredSmokingStatus?: string;
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
  // 🆕 מדדים חדשים שמחולצים אבל לא היו בשקלול
  socioEconomicLevel: 8,
  educationLevelScore: 6,
  jobSeniorityLevel: 5,
  personalityType: 6,
  attachmentStyle: 5,
  loveLanguages: 3,
  ageCompatibility: 7,
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
// RELIGIOUS COMPATIBILITY MATRIX (15×15) — מקור אמת יחיד
// ═══════════════════════════════════════════════════════════════

export const RELIGIOUS_COMPATIBILITY_MATRIX: Record<string, Record<string, number>> = {
  charedi_hasidic: {
    charedi_hasidic: 100, charedi_litvak: 50, charedi_sephardic: 40, chabad: 60, breslov: 65,
    charedi_modern: 30, dati_leumi_torani: 20, dati_leumi_standard: 10, dati_leumi_liberal: 5,
    masorti_strong: 5, masorti_light: 5, secular_traditional_connection: 5, secular: 5,
    spiritual_not_religious: 5, other: 30,
  },
  charedi_litvak: {
    charedi_hasidic: 50, charedi_litvak: 100, charedi_sephardic: 55, chabad: 40, breslov: 35,
    charedi_modern: 70, dati_leumi_torani: 40, dati_leumi_standard: 20, dati_leumi_liberal: 10,
    masorti_strong: 10, masorti_light: 5, secular_traditional_connection: 5, secular: 5,
    spiritual_not_religious: 5, other: 30,
  },
  charedi_sephardic: {
    charedi_hasidic: 40, charedi_litvak: 55, charedi_sephardic: 100, chabad: 50, breslov: 50,
    charedi_modern: 60, dati_leumi_torani: 45, dati_leumi_standard: 30, dati_leumi_liberal: 15,
    masorti_strong: 25, masorti_light: 15, secular_traditional_connection: 10, secular: 5,
    spiritual_not_religious: 5, other: 30,
  },
  chabad: {
    charedi_hasidic: 60, charedi_litvak: 40, charedi_sephardic: 50, chabad: 100, breslov: 50,
    charedi_modern: 55, dati_leumi_torani: 50, dati_leumi_standard: 40, dati_leumi_liberal: 25,
    masorti_strong: 30, masorti_light: 20, secular_traditional_connection: 15, secular: 10,
    spiritual_not_religious: 15, other: 35,
  },
  breslov: {
    charedi_hasidic: 65, charedi_litvak: 35, charedi_sephardic: 50, chabad: 50, breslov: 100,
    charedi_modern: 40, dati_leumi_torani: 35, dati_leumi_standard: 25, dati_leumi_liberal: 15,
    masorti_strong: 15, masorti_light: 10, secular_traditional_connection: 10, secular: 5,
    spiritual_not_religious: 15, other: 30,
  },
  charedi_modern: {
    charedi_hasidic: 30, charedi_litvak: 70, charedi_sephardic: 60, chabad: 55, breslov: 40,
    charedi_modern: 100, dati_leumi_torani: 80, dati_leumi_standard: 55, dati_leumi_liberal: 30,
    masorti_strong: 20, masorti_light: 10, secular_traditional_connection: 10, secular: 5,
    spiritual_not_religious: 5, other: 30,
  },
  dati_leumi_torani: {
    charedi_hasidic: 20, charedi_litvak: 40, charedi_sephardic: 45, chabad: 50, breslov: 35,
    charedi_modern: 80, dati_leumi_torani: 100, dati_leumi_standard: 75, dati_leumi_liberal: 40,
    masorti_strong: 25, masorti_light: 15, secular_traditional_connection: 10, secular: 5,
    spiritual_not_religious: 10, other: 30,
  },
  dati_leumi_standard: {
    charedi_hasidic: 10, charedi_litvak: 20, charedi_sephardic: 30, chabad: 40, breslov: 25,
    charedi_modern: 55, dati_leumi_torani: 75, dati_leumi_standard: 100, dati_leumi_liberal: 70,
    masorti_strong: 50, masorti_light: 30, secular_traditional_connection: 20, secular: 10,
    spiritual_not_religious: 15, other: 35,
  },
  dati_leumi_liberal: {
    charedi_hasidic: 5, charedi_litvak: 10, charedi_sephardic: 15, chabad: 25, breslov: 15,
    charedi_modern: 30, dati_leumi_torani: 40, dati_leumi_standard: 70, dati_leumi_liberal: 100,
    masorti_strong: 70, masorti_light: 50, secular_traditional_connection: 40, secular: 20,
    spiritual_not_religious: 30, other: 35,
  },
  masorti_strong: {
    charedi_hasidic: 5, charedi_litvak: 10, charedi_sephardic: 25, chabad: 30, breslov: 15,
    charedi_modern: 20, dati_leumi_torani: 25, dati_leumi_standard: 50, dati_leumi_liberal: 70,
    masorti_strong: 100, masorti_light: 80, secular_traditional_connection: 65, secular: 30,
    spiritual_not_religious: 40, other: 40,
  },
  masorti_light: {
    charedi_hasidic: 5, charedi_litvak: 5, charedi_sephardic: 15, chabad: 20, breslov: 10,
    charedi_modern: 10, dati_leumi_torani: 15, dati_leumi_standard: 30, dati_leumi_liberal: 50,
    masorti_strong: 80, masorti_light: 100, secular_traditional_connection: 80, secular: 50,
    spiritual_not_religious: 50, other: 40,
  },
  secular_traditional_connection: {
    charedi_hasidic: 5, charedi_litvak: 5, charedi_sephardic: 10, chabad: 15, breslov: 10,
    charedi_modern: 10, dati_leumi_torani: 10, dati_leumi_standard: 20, dati_leumi_liberal: 40,
    masorti_strong: 65, masorti_light: 80, secular_traditional_connection: 100, secular: 75,
    spiritual_not_religious: 60, other: 45,
  },
  secular: {
    charedi_hasidic: 5, charedi_litvak: 5, charedi_sephardic: 5, chabad: 10, breslov: 5,
    charedi_modern: 5, dati_leumi_torani: 5, dati_leumi_standard: 10, dati_leumi_liberal: 20,
    masorti_strong: 30, masorti_light: 50, secular_traditional_connection: 75, secular: 100,
    spiritual_not_religious: 70, other: 45,
  },
  spiritual_not_religious: {
    charedi_hasidic: 5, charedi_litvak: 5, charedi_sephardic: 5, chabad: 15, breslov: 15,
    charedi_modern: 5, dati_leumi_torani: 10, dati_leumi_standard: 15, dati_leumi_liberal: 30,
    masorti_strong: 40, masorti_light: 50, secular_traditional_connection: 60, secular: 70,
    spiritual_not_religious: 100, other: 50,
  },
  other: {
    charedi_hasidic: 30, charedi_litvak: 30, charedi_sephardic: 30, chabad: 35, breslov: 30,
    charedi_modern: 30, dati_leumi_torani: 30, dati_leumi_standard: 35, dati_leumi_liberal: 35,
    masorti_strong: 40, masorti_light: 40, secular_traditional_connection: 45, secular: 45,
    spiritual_not_religious: 50, other: 70,
  },
};

/**
 * מחזיר ציון תאימות דתית (0-100) מהמטריצה
 */
export function getReligiousCompatibilityScore(level1: string | null, level2: string | null): number {
  if (!level1 || !level2) return 50; // ברירת מחדל שמרנית

  const row = RELIGIOUS_COMPATIBILITY_MATRIX[level1];
  if (row && row[level2] !== undefined) {
    return row[level2];
  }

  // Fallback: מרחק לינארי
  const ORDER = [
    'charedi_hasidic', 'charedi_litvak', 'charedi_sephardic', 'chabad', 'breslov',
    'charedi_modern', 'dati_leumi_torani', 'dati_leumi_standard', 'dati_leumi_liberal',
    'masorti_strong', 'masorti_light', 'secular_traditional_connection', 'secular',
    'spiritual_not_religious', 'other',
  ];

  const idx1 = ORDER.indexOf(level1);
  const idx2 = ORDER.indexOf(level2);
  if (idx1 === -1 || idx2 === -1) return 50;

  const distance = Math.abs(idx1 - idx2);
  if (distance === 0) return 100;
  if (distance === 1) return 80;
  if (distance === 2) return 60;
  if (distance === 3) return 40;
  return 20;
}

// ═══════════════════════════════════════════════════════════════
// PERSONALITY TYPE COMPATIBILITY MATRIX (7×7)
// ═══════════════════════════════════════════════════════════════

export const PERSONALITY_COMPATIBILITY_MATRIX: Record<string, Record<string, number>> = {
  LEADER: {
    LEADER: 55, SUPPORTER: 95, ANALYTICAL: 65, CREATIVE: 60,
    CAREGIVER: 75, ADVENTURER: 70, HARMONIZER: 85,
  },
  SUPPORTER: {
    LEADER: 95, SUPPORTER: 70, ANALYTICAL: 65, CREATIVE: 75,
    CAREGIVER: 80, ADVENTURER: 60, HARMONIZER: 85,
  },
  ANALYTICAL: {
    LEADER: 65, SUPPORTER: 65, ANALYTICAL: 70, CREATIVE: 85,
    CAREGIVER: 60, ADVENTURER: 55, HARMONIZER: 70,
  },
  CREATIVE: {
    LEADER: 60, SUPPORTER: 75, ANALYTICAL: 85, CREATIVE: 65,
    CAREGIVER: 70, ADVENTURER: 90, HARMONIZER: 80,
  },
  CAREGIVER: {
    LEADER: 75, SUPPORTER: 80, ANALYTICAL: 60, CREATIVE: 70,
    CAREGIVER: 65, ADVENTURER: 55, HARMONIZER: 90,
  },
  ADVENTURER: {
    LEADER: 70, SUPPORTER: 60, ANALYTICAL: 55, CREATIVE: 90,
    CAREGIVER: 55, ADVENTURER: 75, HARMONIZER: 65,
  },
  HARMONIZER: {
    LEADER: 85, SUPPORTER: 85, ANALYTICAL: 70, CREATIVE: 80,
    CAREGIVER: 90, ADVENTURER: 65, HARMONIZER: 80,
  },
};

// ═══════════════════════════════════════════════════════════════
// ATTACHMENT STYLE COMPATIBILITY MATRIX (4×4)
// ═══════════════════════════════════════════════════════════════

export const ATTACHMENT_COMPATIBILITY_MATRIX: Record<string, Record<string, number>> = {
  SECURE: {
    SECURE: 100, ANXIOUS: 70, AVOIDANT: 65, DISORGANIZED: 45,
  },
  ANXIOUS: {
    SECURE: 70, ANXIOUS: 40, AVOIDANT: 25, DISORGANIZED: 20,
  },
  AVOIDANT: {
    SECURE: 65, ANXIOUS: 25, AVOIDANT: 45, DISORGANIZED: 20,
  },
  DISORGANIZED: {
    SECURE: 45, ANXIOUS: 20, AVOIDANT: 20, DISORGANIZED: 15,
  },
};

// ═══════════════════════════════════════════════════════════════
// LOVE LANGUAGE OVERLAP SCORING
// ═══════════════════════════════════════════════════════════════

/**
 * מחשב חפיפה בין שפות אהבה — Jaccard-like
 * 0 = אין חפיפה, 100 = חפיפה מלאה
 */
export function calculateLoveLanguageOverlap(
  languagesA: string[] | null | undefined,
  languagesB: string[] | null | undefined
): number {
  if (!languagesA?.length || !languagesB?.length) return 50; // neutral if missing

  const setA = new Set(languagesA);
  const setB = new Set(languagesB);

  let intersection = 0;
  for (const lang of setA) {
    if (setB.has(lang)) intersection++;
  }

  const union = new Set([...setA, ...setB]).size;
  if (union === 0) return 50;

  // Jaccard: 0-1 → scale to 30-100 (no overlap = 30, full = 100)
  const jaccard = intersection / union;
  return Math.round(30 + jaccard * 70);
}

// ═══════════════════════════════════════════════════════════════
// SCORING UTILITY FUNCTIONS (extracted from hybridMatchingService)
// ═══════════════════════════════════════════════════════════════

export function calculateSocioEconomicScore(
  userLevel: number | null,
  candidateLevel: number | null,
  userPrefMin: number | null,
  userPrefMax: number | null,
  candidatePrefMin: number | null,
  candidatePrefMax: number | null
): number {
  if (userLevel === null || candidateLevel === null) return 70;

  let userHappy = true;
  let candidateHappy = true;

  if (userPrefMin !== null && candidateLevel < userPrefMin) userHappy = false;
  if (userPrefMax !== null && candidateLevel > userPrefMax) userHappy = false;
  if (candidatePrefMin !== null && userLevel < candidatePrefMin) candidateHappy = false;
  if (candidatePrefMax !== null && userLevel > candidatePrefMax) candidateHappy = false;

  if (!userHappy || !candidateHappy) return 30;

  const diff = Math.abs(userLevel - candidateLevel);
  if (diff === 0) return 100;
  if (diff === 1) return 90;
  if (diff === 2) return 75;
  if (diff === 3) return 55;
  return 35;
}

export function calculateEducationScore(
  userLevel: number | null,
  candidateLevel: number | null,
  userPrefMin: number | null,
  candidatePrefMin: number | null
): number {
  if (userLevel === null || candidateLevel === null) return 70;
  if (userPrefMin !== null && candidateLevel < userPrefMin) return 30;
  if (candidatePrefMin !== null && userLevel < candidatePrefMin) return 30;

  const diff = Math.abs(userLevel - candidateLevel);
  if (diff === 0) return 100;
  if (diff === 1) return 85;
  if (diff === 2) return 70;
  return 55;
}

export function calculateJobSeniorityScore(
  userLevel: number | null,
  candidateLevel: number | null,
  userPrefMin: number | null,
  candidatePrefMin: number | null
): number {
  if (userLevel === null || candidateLevel === null) return 70;
  if (userPrefMin !== null && candidateLevel < userPrefMin) return 40;
  if (candidatePrefMin !== null && userLevel < candidatePrefMin) return 40;

  const diff = Math.abs(userLevel - candidateLevel);
  if (diff <= 1) return 100;
  if (diff === 2) return 80;
  if (diff === 3) return 60;
  return 45;
}

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
 