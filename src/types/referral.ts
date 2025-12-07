// src/types/referral.ts

// ================== Enums ==================

export type ReferrerTier = 'AMBASSADOR' | 'COMMUNITY';
export type ReferralStatus = 'CLICKED' | 'STARTED' | 'REGISTERED' | 'VERIFIED' | 'COMPLETED';

// ================== Prize Tier ==================

export interface PrizeTier {
  threshold: number;      // מספר מאומתים נדרש
  prize: string;          // תיאור הפרס
  prizeValue?: number;    // ערך בש"ח (אופציונלי)
  icon?: string;          // אייקון (אופציונלי)
}

// ================== Campaign Settings ==================

export interface CampaignSettings {
  requireVerification: boolean;     // האם לספור רק מאומתים
  requireProfileComplete: boolean;  // האם לדרוש פרופיל מלא
  maxReferralsPerIP: number;        // מגבלת הפניות מאותו IP
  allowSelfReferral: boolean;       // האם לאפשר הפניה עצמית
}

// ================== Campaign ==================

export interface ReferralCampaign {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  prizeTiers?: PrizeTier[] | null;
  grandPrize?: string | null;
  settings?: CampaignSettings | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignWithStats extends ReferralCampaign {
  totalReferrers: number;
  totalClicks: number;
  totalRegistrations: number;
  totalVerified: number;
  conversionRate: number; // אחוז המרה מלחיצה לאימות
}

// ================== Referrer ==================

export interface Referrer {
  id: string;
  campaignId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  code: string;
  tier: ReferrerTier;
  notes?: string | null;
  clickCount: number;
  registrationCount: number;
  verifiedCount: number;
  completedCount: number;
  prizesAwarded?: AwardedPrize[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReferrerWithCampaign extends Referrer {
  campaign: ReferralCampaign;
}

export interface ReferrerPublicStats {
  code: string;
  name: string;
  tier: ReferrerTier;
  clickCount: number;
  verifiedCount: number;
  rank?: number;
  nextPrizeThreshold?: number;
  nextPrize?: string;
  prizesEarned: AwardedPrize[];
}

export interface AwardedPrize {
  prize: string;
  prizeValue?: number;
  awardedAt: string; // ISO date string
  threshold: number;
}

// ================== Referral (Individual) ==================

export interface Referral {
  id: string;
  referrerId: string;
  userId?: string | null;
  status: ReferralStatus;
  ipAddress?: string | null;
  userAgent?: string | null;
  sessionId?: string | null;
  clickedAt: Date;
  startedAt?: Date | null;
  registeredAt?: Date | null;
  verifiedAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReferralWithUser extends Referral {
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    isPhoneVerified: boolean;
    isProfileComplete: boolean;
    createdAt: Date;
  } | null;
}

// ================== Leaderboard ==================

export interface LeaderboardEntry {
  rank: number;
  code: string;
  name: string;
  tier: ReferrerTier;
  verifiedCount: number;
  completedCount: number;
  isCurrentUser?: boolean;
}

// ================== API Request/Response Types ==================

// POST /api/referral/register - הרשמת מפנה חדש
export interface RegisterReferrerRequest {
  campaignSlug: string;
  name: string;
  email?: string;
  phone?: string;
  preferredCode?: string; // קוד מועדף (אם פנוי)
}

export interface RegisterReferrerResponse {
  success: boolean;
  referrer?: {
    code: string;
    shareUrl: string;
    dashboardUrl: string;
  };
  error?: string;
}

// GET /api/referral/track/[code] - מעקב לחיצה
export interface TrackClickResponse {
  success: boolean;
  redirectTo: string;
  referralId?: string;
}

// GET /api/referral/stats - סטטיסטיקות למפנה
export interface ReferrerStatsResponse {
  success: boolean;
  stats?: ReferrerPublicStats;
  referrals?: {
    total: number;
    byStatus: Record<ReferralStatus, number>;
    recent: Array<{
      status: ReferralStatus;
      createdAt: string;
    }>;
  };
  campaign?: {
    name: string;
    endsAt: string;
    daysRemaining: number;
  };
  error?: string;
}

// GET /api/referral/leaderboard
export interface LeaderboardResponse {
  success: boolean;
  leaderboard?: LeaderboardEntry[];
  totalParticipants?: number;
  lastUpdated?: string;
  error?: string;
}

// Admin: GET /api/referral/campaign
export interface AdminCampaignResponse {
  success: boolean;
  campaign?: CampaignWithStats;
  referrers?: Array<Referrer & { referralsCount: number }>;
  error?: string;
}

// ================== Form Types ==================

export interface ReferrerSignupFormData {
  name: string;
  email: string;
  phone?: string;
  preferredCode?: string;
  agreeToTerms: boolean;
}

// ================== Cookie/Session Types ==================

export interface ReferralCookie {
  code: string;
  referralId: string;
  clickedAt: string;
  expiresAt: string;
}

// ================== Dictionary Types (for i18n) ==================

export interface ReferralDict {
  landing: {
    hero: {
      badge: string;
      title: string;
      titleHighlight: string;
      subtitle: string;
      ctaButton: string;
    };
    howItWorks: {
      title: string;
      steps: Array<{
        title: string;
        description: string;
      }>;
    };
    prizes: {
      title: string;
      subtitle: string;
      tiers: Array<{
        threshold: string;
        prize: string;
      }>;
      grandPrize: {
        title: string;
        description: string;
      };
    };
    signupForm: {
      title: string;
      subtitle: string;
      nameLabel: string;
      namePlaceholder: string;
      emailLabel: string;
      emailPlaceholder: string;
      phoneLabel: string;
      phonePlaceholder: string;
      codeLabel: string;
      codePlaceholder: string;
      codeHint: string;
      termsLabel: string;
      submitButton: string;
      submittingButton: string;
    };
    faq: {
      title: string;
      items: Array<{
        question: string;
        answer: string;
      }>;
    };
  };
  dashboard: {
    title: string;
    subtitle: string;
    stats: {
      clicks: string;
      registered: string;
      verified: string;
      completed: string;
    };
    shareCard: {
      title: string;
      subtitle: string;
      copyButton: string;
      copiedButton: string;
      shareWhatsapp: string;
    };
    prizesCard: {
      title: string;
      earned: string;
      nextPrize: string;
      remaining: string;
    };
    leaderboard: {
      title: string;
      rank: string;
      name: string;
      verified: string;
      you: string;
    };
    campaignInfo: {
      endsIn: string;
      days: string;
      hours: string;
    };
  };
  messages: {
    codeTaken: string;
    invalidCode: string;
    registrationSuccess: string;
    registrationError: string;
    linkCopied: string;
  };
}