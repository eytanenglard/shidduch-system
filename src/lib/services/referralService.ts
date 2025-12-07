// src/lib/services/referralService.ts

import prisma from '@/lib/prisma'; // 🔴 תיקון: default import
import { 
  ReferralStatus, 
  ReferrerTier,
  PrizeTier,
  AwardedPrize,
  LeaderboardEntry,
  ReferrerPublicStats,
  CampaignSettings
} from '@/types/referral';

// ================== Constants ==================

const REFERRAL_COOKIE_NAME = 'nst_ref';
const REFERRAL_COOKIE_DAYS = 30;
const DEFAULT_CAMPAIGN_SETTINGS: CampaignSettings = {
  requireVerification: true,
  requireProfileComplete: false,
  maxReferralsPerIP: 5,
  allowSelfReferral: false,
};

// ================== Helper Functions ==================

/**
 * יוצר קוד רפרל ייחודי
 */
export function generateReferralCode(name: string, existingCodes: string[]): string {
  // ניקוי השם - רק אותיות באנגלית ומספרים
  const cleanName = name
    .replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, '')
    .substring(0, 10)
    .toUpperCase();
  
  // המרה מעברית לאנגלית (פשוטה)
  const hebrewToEnglish: Record<string, string> = {
    'א': 'A', 'ב': 'B', 'ג': 'G', 'ד': 'D', 'ה': 'H',
    'ו': 'V', 'ז': 'Z', 'ח': 'CH', 'ט': 'T', 'י': 'Y',
    'כ': 'K', 'ל': 'L', 'מ': 'M', 'נ': 'N', 'ס': 'S',
    'ע': 'A', 'פ': 'P', 'צ': 'TZ', 'ק': 'K', 'ר': 'R',
    'ש': 'SH', 'ת': 'T', 'ך': 'K', 'ם': 'M', 'ן': 'N',
    'ף': 'P', 'ץ': 'TZ'
  };
  
  let code = '';
  for (const char of cleanName) {
    code += hebrewToEnglish[char] || char;
  }
  code = code.substring(0, 8).toUpperCase();
  
  // אם הקוד קיים, הוסף מספר
  let finalCode = code;
  let counter = 1;
  while (existingCodes.includes(finalCode)) {
    finalCode = `${code}${counter}`;
    counter++;
  }
  
  return finalCode;
}

/**
 * בודק האם הקוד תקין (רק אותיות ומספרים, 3-15 תווים)
 */
export function isValidCode(code: string): boolean {
  return /^[A-Za-z0-9]{3,15}$/.test(code);
}

/**
 * פירסור בטוח של prizeTiers מה-database
 * יכול להגיע כ-string, מערך, או null
 */
export function parsePrizeTiers(rawPrizeTiers: unknown): PrizeTier[] {
  try {
    if (!rawPrizeTiers) return [];
    if (typeof rawPrizeTiers === 'string') {
      return JSON.parse(rawPrizeTiers);
    }
    if (Array.isArray(rawPrizeTiers)) {
      return rawPrizeTiers as PrizeTier[];
    }
    return [];
  } catch (e) {
    console.error('[parsePrizeTiers] Error:', e);
    return [];
  }
}

/**
 * פירסור בטוח של campaign settings מה-database
 */
export function parseCampaignSettings(rawSettings: unknown): CampaignSettings {
  try {
    if (!rawSettings) return DEFAULT_CAMPAIGN_SETTINGS;
    if (typeof rawSettings === 'string') {
      return { ...DEFAULT_CAMPAIGN_SETTINGS, ...JSON.parse(rawSettings) };
    }
    if (typeof rawSettings === 'object' && !Array.isArray(rawSettings)) {
      return { ...DEFAULT_CAMPAIGN_SETTINGS, ...(rawSettings as object) };
    }
    return DEFAULT_CAMPAIGN_SETTINGS;
  } catch (e) {
    console.error('[parseCampaignSettings] Error:', e);
    return DEFAULT_CAMPAIGN_SETTINGS;
  }
}

/**
 * מחשב איזה פרסים הושגו לפי מספר המאומתים
 */
export function calculateEarnedPrizes(
  verifiedCount: number, 
  prizeTiers: PrizeTier[]
): AwardedPrize[] {
  const sorted = [...prizeTiers].sort((a, b) => a.threshold - b.threshold);
  const earned: AwardedPrize[] = [];
  
  for (const tier of sorted) {
    if (verifiedCount >= tier.threshold) {
      earned.push({
        prize: tier.prize,
        prizeValue: tier.prizeValue,
        threshold: tier.threshold,
        awardedAt: new Date().toISOString(),
      });
    }
  }
  
  return earned;
}

/**
 * מוצא את הפרס הבא שניתן להשיג
 */
export function getNextPrize(
  verifiedCount: number, 
  prizeTiers: PrizeTier[]
): { threshold: number; prize: string; remaining: number } | null {
  const sorted = [...prizeTiers].sort((a, b) => a.threshold - b.threshold);
  
  for (const tier of sorted) {
    if (verifiedCount < tier.threshold) {
      return {
        threshold: tier.threshold,
        prize: tier.prize,
        remaining: tier.threshold - verifiedCount,
      };
    }
  }
  
  return null; // השיג את כל הפרסים
}

// ================== Campaign Functions ==================

/**
 * מביא קמפיין פעיל לפי slug
 */
export async function getActiveCampaign(slug?: string) {
  const now = new Date();
  
  const where = slug 
    ? { slug, isActive: true }
    : { 
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      };
  
  return prisma.referralCampaign.findFirst({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * מביא קמפיין עם סטטיסטיקות מלאות (לאדמין)
 */
export async function getCampaignWithStats(campaignId: string) {
  const campaign = await prisma.referralCampaign.findUnique({
    where: { id: campaignId },
    include: {
      referrers: {
        include: {
          _count: {
            select: { referrals: true }
          }
        }
      }
    }
  });
  
  if (!campaign) return null;
  
  // חישוב סטטיסטיקות
  const stats = await prisma.referral.aggregate({
    where: { referrer: { campaignId } },
    _count: { id: true },
  });
  
  const statusCounts = await prisma.referral.groupBy({
    by: ['status'],
    where: { referrer: { campaignId } },
    _count: { id: true },
  });
  
  const statusMap = statusCounts.reduce((acc, curr) => {
    acc[curr.status] = curr._count.id;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    ...campaign,
    totalReferrers: campaign.referrers.length,
    totalClicks: statusMap['CLICKED'] || 0 + (statusMap['STARTED'] || 0) + 
                 (statusMap['REGISTERED'] || 0) + (statusMap['VERIFIED'] || 0) + 
                 (statusMap['COMPLETED'] || 0),
    totalRegistrations: (statusMap['REGISTERED'] || 0) + (statusMap['VERIFIED'] || 0) + 
                        (statusMap['COMPLETED'] || 0),
    totalVerified: (statusMap['VERIFIED'] || 0) + (statusMap['COMPLETED'] || 0),
    conversionRate: stats._count.id > 0 
      ? ((statusMap['VERIFIED'] || 0) / stats._count.id) * 100 
      : 0,
  };
}

// ================== Referrer Functions ==================

/**
 * יוצר מפנה חדש
 */
export async function createReferrer(data: {
  campaignId: string;
  name: string;
  email?: string;
  phone?: string;
  preferredCode?: string;
  tier?: ReferrerTier;
}) {
  // בדוק אם הקוד המועדף פנוי
  let code = data.preferredCode?.toUpperCase();
  
  if (code) {
    if (!isValidCode(code)) {
      throw new Error('INVALID_CODE_FORMAT');
    }
    
    const existing = await prisma.referrer.findUnique({ where: { code } });
    if (existing) {
      throw new Error('CODE_TAKEN');
    }
  } else {
    // צור קוד אוטומטי
    const existingCodes = await prisma.referrer.findMany({
      select: { code: true }
    });
    code = generateReferralCode(data.name, existingCodes.map(r => r.code));
  }
  
  return prisma.referrer.create({
    data: {
      campaignId: data.campaignId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      code,
      tier: data.tier || 'COMMUNITY',
    },
  });
}

/**
 * מביא מפנה לפי קוד
 */
export async function getReferrerByCode(code: string) {
  return prisma.referrer.findUnique({
    where: { code: code.toUpperCase() },
    include: { campaign: true },
  });
}

/**
 * מביא סטטיסטיקות למפנה (לדשבורד שלו)
 */
export async function getReferrerStats(code: string): Promise<ReferrerPublicStats | null> {
  const referrer = await prisma.referrer.findUnique({
    where: { code: code.toUpperCase() },
    include: { 
      campaign: true,
      referrals: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      }
    },
  });
  
  if (!referrer) return null;
  
  // פירסור prizeTiers בצורה בטוחה
  const prizeTiers = parsePrizeTiers(referrer.campaign.prizeTiers);
  
  const nextPrize = getNextPrize(referrer.verifiedCount, prizeTiers);
  const prizesEarned = calculateEarnedPrizes(referrer.verifiedCount, prizeTiers);
  
  // חישוב דירוג
  const rank = await prisma.referrer.count({
    where: {
      campaignId: referrer.campaignId,
      verifiedCount: { gt: referrer.verifiedCount },
    },
  }) + 1;
  
  return {
    code: referrer.code,
    name: referrer.name,
    tier: referrer.tier as ReferrerTier,
    clickCount: referrer.clickCount,
    verifiedCount: referrer.verifiedCount,
    rank,
    nextPrizeThreshold: nextPrize?.threshold,
    nextPrize: nextPrize?.prize,
    prizesEarned,
  };
}

// ================== Tracking Functions ==================

/**
 * רושם לחיצה על קישור רפרל
 */
export async function trackClick(data: {
  code: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}): Promise<{ success: boolean; referralId?: string; error?: string }> {
  const referrer = await getReferrerByCode(data.code);
  
  if (!referrer) {
    return { success: false, error: 'INVALID_CODE' };
  }
  
  // בדוק אם הקמפיין פעיל
  const now = new Date();
  if (!referrer.campaign.isActive || 
      referrer.campaign.startDate > now || 
      referrer.campaign.endDate < now) {
    return { success: false, error: 'CAMPAIGN_INACTIVE' };
  }
  
  // בדוק מגבלת IP (אם מוגדרת)
  const settings = parseCampaignSettings(referrer.campaign.settings);
  if (data.ipAddress && settings.maxReferralsPerIP > 0) {
    const ipCount = await prisma.referral.count({
      where: {
        referrerId: referrer.id,
        ipAddress: data.ipAddress,
      },
    });
    
    if (ipCount >= settings.maxReferralsPerIP) {
      // עדיין מאפשר לחיצה אבל לא יוצר רשומה חדשה
      return { success: true };
    }
  }
  
  // צור רשומת הפניה
  const referral = await prisma.referral.create({
    data: {
      referrerId: referrer.id,
      status: 'CLICKED',
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      sessionId: data.sessionId,
    },
  });
  
  // עדכן ספירה
  await prisma.referrer.update({
    where: { id: referrer.id },
    data: { clickCount: { increment: 1 } },
  });
  
  return { success: true, referralId: referral.id };
}

/**
 * מעדכן סטטוס הפניה כשמשתמש מתקדם בתהליך
 */
export async function updateReferralStatus(data: {
  referralId?: string;
  userId?: string;
  sessionId?: string;
  newStatus: ReferralStatus;
}): Promise<{ 
  success: boolean; 
  error?: string;
  referralId?: string;
  referrerId?: string;
  newVerifiedCount?: number;
}> {
  // מצא את ההפניה
  let referral;
  
  if (data.referralId) {
    referral = await prisma.referral.findUnique({
      where: { id: data.referralId },
      include: { referrer: true },
    });
  } else if (data.userId) {
    // 🔴 חדש: חיפוש לפי userId - מוצא את ההפניה המקושרת למשתמש
    referral = await prisma.referral.findFirst({
      where: { userId: data.userId },
      orderBy: { clickedAt: 'desc' },
      include: { referrer: true },
    });
  } else if (data.sessionId) {
    referral = await prisma.referral.findFirst({
      where: { sessionId: data.sessionId },
      orderBy: { clickedAt: 'desc' },
      include: { referrer: true },
    });
  }
  
  if (!referral) {
    // 🔴 חדש: מחזיר NO_REFERRAL כדי לציין שאין רפרל מקושר (לא שגיאה)
    return { success: false, error: 'NO_REFERRAL' };
  }
  
  // בדוק שהסטטוס החדש הגיוני (לא לחזור אחורה)
  const statusOrder: ReferralStatus[] = ['CLICKED', 'STARTED', 'REGISTERED', 'VERIFIED', 'COMPLETED'];
  const currentIndex = statusOrder.indexOf(referral.status as ReferralStatus);
  const newIndex = statusOrder.indexOf(data.newStatus);
  
  if (newIndex <= currentIndex) {
    // הסטטוס כבר קיים או מתקדם יותר - לא צריך לעדכן
    return { 
      success: true, 
      referralId: referral.id,
      referrerId: referral.referrerId,
    };
  }
  
  // מפה סטטוסים לשדות תאריך ולעדכוני ספירה
  const statusUpdates: Record<ReferralStatus, {
    dateField: string;
    countField: string;
  }> = {
    'CLICKED': { dateField: 'clickedAt', countField: 'clickCount' },
    'STARTED': { dateField: 'startedAt', countField: 'clickCount' }, // לא מעדכן ספירה
    'REGISTERED': { dateField: 'registeredAt', countField: 'registrationCount' },
    'VERIFIED': { dateField: 'verifiedAt', countField: 'verifiedCount' },
    'COMPLETED': { dateField: 'completedAt', countField: 'completedCount' },
  };
  
  const update = statusUpdates[data.newStatus];
  const now = new Date();
  
  // עדכן את ההפניה
  await prisma.referral.update({
    where: { id: referral.id },
    data: {
      status: data.newStatus,
      userId: data.userId || referral.userId,
      [update.dateField]: now,
    },
  });
  
  // עדכן ספירה במפנה (רק אם זה שלב חדש)
  let newCount: number | undefined;
  if (data.newStatus !== 'STARTED' && data.newStatus !== 'CLICKED') {
    const updatedReferrer = await prisma.referrer.update({
      where: { id: referral.referrerId },
      data: { [update.countField]: { increment: 1 } },
    });
    
    if (data.newStatus === 'VERIFIED') {
      newCount = updatedReferrer.verifiedCount;
    }
  }
  
  return { 
    success: true,
    referralId: referral.id,
    referrerId: referral.referrerId,
    newVerifiedCount: newCount,
  };
}

/**
 * מקשר משתמש להפניה (נקרא אחרי רישום מוצלח)
 */
export async function linkUserToReferral(data: {
  userId: string;
  referralId?: string;
  sessionId?: string;
}): Promise<{ success: boolean; referrerId?: string; error?: string }> { // 🔴 תיקון: הוספת error
  let referral;
  
  if (data.referralId) {
    referral = await prisma.referral.findUnique({
      where: { id: data.referralId },
    });
  } else if (data.sessionId) {
    referral = await prisma.referral.findFirst({
      where: { 
        sessionId: data.sessionId,
        userId: null, // עדיין לא מקושר
      },
      orderBy: { clickedAt: 'desc' },
    });
  }
  
  if (!referral) {
    return { success: false, error: 'REFERRAL_NOT_FOUND' }; // 🔴 תיקון: הוספת error
  }
  
  // בדוק אם כבר מקושר למשתמש אחר
  if (referral.userId && referral.userId !== data.userId) {
    return { success: false, error: 'REFERRAL_ALREADY_USED' }; // 🔴 תיקון: בדיקה חדשה
  }
  
  // קשר את המשתמש
  await prisma.referral.update({
    where: { id: referral.id },
    data: {
      userId: data.userId,
      status: 'REGISTERED',
      registeredAt: new Date(),
    },
  });
  
  // עדכן ספירת רישומים
  await prisma.referrer.update({
    where: { id: referral.referrerId },
    data: { registrationCount: { increment: 1 } },
  });
  
  return { success: true, referrerId: referral.referrerId };
}

// ================== Leaderboard Functions ==================

/**
 * מביא לידרבורד לקמפיין
 */
export async function getLeaderboard(
  campaignId: string, 
  limit: number = 10,
  currentUserCode?: string
): Promise<LeaderboardEntry[]> {
  const referrers = await prisma.referrer.findMany({
    where: { campaignId },
    orderBy: [
      { verifiedCount: 'desc' },
      { completedCount: 'desc' },
      { createdAt: 'asc' }, // במקרה של שוויון - מי שנרשם קודם
    ],
    take: limit,
    select: {
      code: true,
      name: true,
      tier: true,
      verifiedCount: true,
      completedCount: true,
    },
  });
  
  return referrers.map((r, index) => ({
    rank: index + 1,
    code: r.code,
    name: r.name,
    tier: r.tier as ReferrerTier,
    verifiedCount: r.verifiedCount,
    completedCount: r.completedCount,
    isCurrentUser: currentUserCode ? r.code === currentUserCode.toUpperCase() : false,
  }));
}

// ================== Cookie Helpers ==================

/**
 * יוצר את תוכן ה-cookie לרפרל
 */
export function createReferralCookieValue(code: string, referralId: string): string {
  const data = {
    code,
    referralId,
    clickedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + REFERRAL_COOKIE_DAYS * 24 * 60 * 60 * 1000).toISOString(),
  };
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

/**
 * פורס את תוכן ה-cookie
 */
export function parseReferralCookie(cookieValue: string): {
  code: string;
  referralId: string;
  clickedAt: string;
  expiresAt: string;
} | null {
  try {
    const decoded = Buffer.from(cookieValue, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export { REFERRAL_COOKIE_NAME, REFERRAL_COOKIE_DAYS };