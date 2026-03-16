// =============================================================================
// 📁 src/lib/services/priorityService.ts
// =============================================================================
// 🎯 Priority Service V1.0 - NeshamaTech
// 
// מחשב ציון עדיפות לכל משתמש כדי לעזור לשדכן לדעת על מי לעבוד
// 
// קטגוריות:
// - 80+ = 🔴 CRITICAL (לטפל עכשיו!)
// - 60-79 = 🟠 HIGH (לטפל היום)
// - 40-59 = 🟡 MEDIUM (לטפל השבוע)
// - <40 = 🟢 LOW
// =============================================================================

import prisma from "@/lib/prisma";
import { AvailabilityStatus, UserStatus, Gender } from "@prisma/client";

// =============================================================================
// TYPES
// =============================================================================

export type PriorityCategory = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface PriorityBreakdown {
  newUserBonus: number;           // בונוס למשתמש חדש
  waitingTimeBonus: number;       // בונוס לזמן המתנה
  activityBonus: number;          // בונוס/קנס לפעילות
  pendingMatchesBonus: number;    // בונוס אם אין התאמות ממתינות
  profileCompletenessBonus: number; // בונוס למילוי פרופיל
  difficultyPenalty: number;      // קנס לקושי בשידוך
  engagementBonus: number;        // בונוס למעורבות
  readinessBonus: number;         // בונוס למוכנות
}

export interface UserPriorityResult {
  userId: string;
  profileId: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  
  // ציונים
  priorityScore: number;
  category: PriorityCategory;
  breakdown: PriorityBreakdown;
  
  // מידע נוסף
  daysSinceRegistration: number;
  daysSinceLastSuggestion: number | null;
  daysSinceLastActivity: number | null;
  pendingMatchesCount: number;
  profileCompletenessScore: number;
  
  // דגלים
  isNewUser: boolean;
  isNeglected: boolean;
  isInactive: boolean;
  hasNoPendingMatches: boolean;
}

export interface PrioritySummary {
  critical: UserPriorityResult[];
  high: UserPriorityResult[];
  medium: UserPriorityResult[];
  low: UserPriorityResult[];
  
  stats: {
    totalUsers: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    averagePriorityScore: number;
  };
}

// =============================================================================
// CONSTANTS
// =============================================================================

const PRIORITY_WEIGHTS = {
  // בונוס למשתמש חדש
  NEW_USER_48H: 40,        // עד 48 שעות
  NEW_USER_WEEK: 25,       // עד שבוע
  NEW_USER_2WEEKS: 15,     // עד שבועיים
  
  // בונוס לזמן המתנה להצעה
  WAITING_PER_DAY: 2,      // נקודות ליום המתנה
  WAITING_MAX: 30,         // מקסימום בונוס המתנה
  
  // בונוס/קנס לפעילות
  ACTIVE_TODAY: 10,        // פעיל היום
  ACTIVE_3DAYS: 5,         // פעיל ב-3 ימים
  INACTIVE_14DAYS: -15,    // לא פעיל 14+ ימים
  INACTIVE_30DAYS: -25,    // לא פעיל 30+ ימים
  
  // בונוס להתאמות ממתינות
  NO_PENDING_MATCHES: 15,  // אין לו התאמות ממתינות
  
  // בונוס למילוי פרופיל
  PROFILE_COMPLETE: 10,    // פרופיל מלא (80%+)
  PROFILE_PARTIAL: 5,      // פרופיל חלקי (50-80%)
  PROFILE_INCOMPLETE: -10, // פרופיל חסר (<50%)
  
  // קנס לקושי
  DIFFICULTY_HIGH: -10,    // קושי גבוה (8-10)
  DIFFICULTY_MEDIUM: 0,    // קושי בינוני (5-7)
  DIFFICULTY_LOW: 5,       // קושי נמוך (1-4)
  
  // בונוס למעורבות
  HIGH_ENGAGEMENT: 10,     // מגיב מהר, אחוז קבלה גבוה
  LOW_ENGAGEMENT: -5,      // לא מגיב, דוחה הרבה
  
  // בונוס למוכנות
  VERY_READY: 10,
  READY: 5,
  SOMEWHAT_READY: 0,
  UNCERTAIN: -5,
  NOT_READY: -15,
};

const CATEGORY_THRESHOLDS = {
  CRITICAL: 80,
  HIGH: 60,
  MEDIUM: 40,
};

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * מחשב Priority Score למשתמש בודד
 */
export async function calculateUserPriority(userId: string): Promise<UserPriorityResult | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      maleMatches: { where: { status: 'PENDING' } },
      femaleMatches: { where: { status: 'PENDING' } },
    },
  });

  if (!user || !user.profile) {
    return null;
  }

  const profile = user.profile;
  const now = new Date();

  // חישוב ימים
  const daysSinceRegistration = Math.floor(
    (now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const daysSinceLastSuggestion = profile.lastSuggestedAt
    ? Math.floor((now.getTime() - profile.lastSuggestedAt.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  const daysSinceLastActivity = profile.lastActiveAt
    ? Math.floor((now.getTime() - profile.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // ספירת התאמות ממתינות
  const pendingMatchesCount = profile.gender === 'MALE' 
    ? user.maleMatches.length 
    : user.femaleMatches.length;

  // חישוב מילוי פרופיל (אם לא קיים, נחשב)
  const profileCompletenessScore = profile.profileCompletenessScore ?? calculateProfileCompleteness(profile);

  // === חישוב הברייקדאון ===
  const breakdown: PriorityBreakdown = {
    newUserBonus: 0,
    waitingTimeBonus: 0,
    activityBonus: 0,
    pendingMatchesBonus: 0,
    profileCompletenessBonus: 0,
    difficultyPenalty: 0,
    engagementBonus: 0,
    readinessBonus: 0,
  };

  // 1. בונוס משתמש חדש
  if (daysSinceRegistration <= 2) {
    breakdown.newUserBonus = PRIORITY_WEIGHTS.NEW_USER_48H;
  } else if (daysSinceRegistration <= 7) {
    breakdown.newUserBonus = PRIORITY_WEIGHTS.NEW_USER_WEEK;
  } else if (daysSinceRegistration <= 14) {
    breakdown.newUserBonus = PRIORITY_WEIGHTS.NEW_USER_2WEEKS;
  }

  // 2. בונוס זמן המתנה להצעה
  if (daysSinceLastSuggestion !== null) {
    breakdown.waitingTimeBonus = Math.min(
      daysSinceLastSuggestion * PRIORITY_WEIGHTS.WAITING_PER_DAY,
      PRIORITY_WEIGHTS.WAITING_MAX
    );
  } else {
    // מעולם לא קיבל הצעה - בונוס מקסימלי
    breakdown.waitingTimeBonus = PRIORITY_WEIGHTS.WAITING_MAX;
  }

  // 3. בונוס/קנס פעילות
  if (daysSinceLastActivity !== null) {
    if (daysSinceLastActivity <= 1) {
      breakdown.activityBonus = PRIORITY_WEIGHTS.ACTIVE_TODAY;
    } else if (daysSinceLastActivity <= 3) {
      breakdown.activityBonus = PRIORITY_WEIGHTS.ACTIVE_3DAYS;
    } else if (daysSinceLastActivity >= 30) {
      breakdown.activityBonus = PRIORITY_WEIGHTS.INACTIVE_30DAYS;
    } else if (daysSinceLastActivity >= 14) {
      breakdown.activityBonus = PRIORITY_WEIGHTS.INACTIVE_14DAYS;
    }
  }

  // 4. בונוס להתאמות ממתינות
  if (pendingMatchesCount === 0) {
    breakdown.pendingMatchesBonus = PRIORITY_WEIGHTS.NO_PENDING_MATCHES;
  }

  // 5. בונוס/קנס מילוי פרופיל
  if (profileCompletenessScore >= 80) {
    breakdown.profileCompletenessBonus = PRIORITY_WEIGHTS.PROFILE_COMPLETE;
  } else if (profileCompletenessScore >= 50) {
    breakdown.profileCompletenessBonus = PRIORITY_WEIGHTS.PROFILE_PARTIAL;
  } else {
    breakdown.profileCompletenessBonus = PRIORITY_WEIGHTS.PROFILE_INCOMPLETE;
  }

  // 6. קנס לקושי
  const difficulty = profile.difficultyScore ?? 5;
  if (difficulty >= 8) {
    breakdown.difficultyPenalty = PRIORITY_WEIGHTS.DIFFICULTY_HIGH;
  } else if (difficulty <= 4) {
    breakdown.difficultyPenalty = PRIORITY_WEIGHTS.DIFFICULTY_LOW;
  }

  // 7. בונוס למעורבות
  const acceptanceRate = profile.acceptanceRate ?? 0.5;
  if (acceptanceRate >= 0.6 && (profile.averageResponseTimeHours ?? 48) <= 24) {
    breakdown.engagementBonus = PRIORITY_WEIGHTS.HIGH_ENGAGEMENT;
  } else if (acceptanceRate <= 0.2) {
    breakdown.engagementBonus = PRIORITY_WEIGHTS.LOW_ENGAGEMENT;
  }

  // 8. בונוס למוכנות
  switch (profile.readinessLevel) {
    case 'VERY_READY':
      breakdown.readinessBonus = PRIORITY_WEIGHTS.VERY_READY;
      break;
    case 'READY':
      breakdown.readinessBonus = PRIORITY_WEIGHTS.READY;
      break;
    case 'SOMEWHAT_READY':
      breakdown.readinessBonus = PRIORITY_WEIGHTS.SOMEWHAT_READY;
      break;
    case 'UNCERTAIN':
      breakdown.readinessBonus = PRIORITY_WEIGHTS.UNCERTAIN;
      break;
    case 'NOT_READY':
      breakdown.readinessBonus = PRIORITY_WEIGHTS.NOT_READY;
      break;
  }

  // === חישוב ציון סופי ===
  const baseScore = 50; // ציון בסיס
  const totalBonus = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
  const priorityScore = Math.max(0, Math.min(100, baseScore + totalBonus));

  // קטגוריה
  let category: PriorityCategory;
  if (priorityScore >= CATEGORY_THRESHOLDS.CRITICAL) {
    category = 'CRITICAL';
  } else if (priorityScore >= CATEGORY_THRESHOLDS.HIGH) {
    category = 'HIGH';
  } else if (priorityScore >= CATEGORY_THRESHOLDS.MEDIUM) {
    category = 'MEDIUM';
  } else {
    category = 'LOW';
  }

  // דגלים
  const isNewUser = daysSinceRegistration <= 7;
  const isNeglected = daysSinceLastSuggestion !== null && daysSinceLastSuggestion >= 10;
  const isInactive = daysSinceLastActivity !== null && daysSinceLastActivity >= 14;
  const hasNoPendingMatches = pendingMatchesCount === 0;

  return {
    userId: user.id,
    profileId: profile.id,
    firstName: user.firstName,
    lastName: user.lastName,
    gender: profile.gender,
    
    priorityScore: Math.round(priorityScore),
    category,
    breakdown,
    
    daysSinceRegistration,
    daysSinceLastSuggestion,
    daysSinceLastActivity,
    pendingMatchesCount,
    profileCompletenessScore,
    
    isNewUser,
    isNeglected,
    isInactive,
    hasNoPendingMatches,
  };
}

/**
 * מחשב Priority לכל המשתמשים הפעילים
 */
export async function calculateAllUsersPriority(): Promise<PrioritySummary> {
  console.log(`[Priority] 🎯 Calculating priority for all active users...`);
  const startTime = Date.now();

  // שליפת כל המשתמשים הפעילים
  const activeUsers = await prisma.user.findMany({
    where: {
      status: UserStatus.ACTIVE,
      profile: {
        availabilityStatus: {
          in: [AvailabilityStatus.AVAILABLE, AvailabilityStatus.PAUSED],
        },
      },
    },
    select: { id: true },
  });

  console.log(`[Priority] Found ${activeUsers.length} active users`);

  const results: UserPriorityResult[] = [];

  // חישוב Priority לכל משתמש
  for (const user of activeUsers) {
    const result = await calculateUserPriority(user.id);
    if (result) {
      results.push(result);
    }
  }

  // מיון לפי ציון (גבוה לנמוך)
  results.sort((a, b) => b.priorityScore - a.priorityScore);

  // חלוקה לקטגוריות
  const summary: PrioritySummary = {
    critical: results.filter(r => r.category === 'CRITICAL'),
    high: results.filter(r => r.category === 'HIGH'),
    medium: results.filter(r => r.category === 'MEDIUM'),
    low: results.filter(r => r.category === 'LOW'),
    
    stats: {
      totalUsers: results.length,
      criticalCount: results.filter(r => r.category === 'CRITICAL').length,
      highCount: results.filter(r => r.category === 'HIGH').length,
      mediumCount: results.filter(r => r.category === 'MEDIUM').length,
      lowCount: results.filter(r => r.category === 'LOW').length,
      averagePriorityScore: results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + r.priorityScore, 0) / results.length)
        : 0,
    },
  };

  const duration = Date.now() - startTime;
  console.log(`[Priority] ✅ Completed in ${duration}ms`);
  console.log(`[Priority] Stats: ${summary.stats.criticalCount} critical, ${summary.stats.highCount} high, ${summary.stats.mediumCount} medium, ${summary.stats.lowCount} low`);

  return summary;
}

/**
 * מעדכן את ה-Priority Score בדאטהבייס
 */
export async function updateUserPriorityInDB(userId: string): Promise<void> {
  const result = await calculateUserPriority(userId);
  
  if (!result) {
    console.warn(`[Priority] Could not calculate priority for user ${userId}`);
    return;
  }

  await prisma.profile.update({
    where: { userId },
    data: {
      priorityScore: result.priorityScore,
      priorityCategory: result.category,
      priorityUpdatedAt: new Date(),
      profileCompletenessScore: result.profileCompletenessScore,
    },
  });
}

/**
 * מעדכן Priority לכל המשתמשים (לשימוש ב-Cron)
 */
export async function updateAllUsersPriorityInDB(): Promise<{ updated: number; failed: number }> {
  console.log(`[Priority] 🔄 Updating priority for all users in DB...`);
  
  const activeUsers = await prisma.user.findMany({
    where: {
      status: UserStatus.ACTIVE,
      profile: { isNot: null },
    },
    select: { id: true },
  });

  let updated = 0;
  let failed = 0;

  for (const user of activeUsers) {
    try {
      await updateUserPriorityInDB(user.id);
      updated++;
    } catch (err) {
      console.error(`[Priority] Failed to update user ${user.id}:`, err);
      failed++;
    }
  }

  console.log(`[Priority] ✅ Updated ${updated} users, ${failed} failed`);
  return { updated, failed };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * מחשב אחוז מילוי פרופיל
 */
function calculateProfileCompleteness(profile: any): number {
  const requiredFields = [
    'birthDate',
    'gender',
    'religiousLevel',
    'city',
    'occupation',
    'education',
    'about',
  ];

  const optionalFields = [
    'height',
    'maritalStatus',
    'origin',
    'serviceType',
    'profileCharacterTraits',
    'profileHobbies',
    'preferredAgeMin',
    'preferredAgeMax',
    'preferredReligiousLevels',
    'preferredReligiousJourneys',
    'matchingNotes',
  ];

  let filledRequired = 0;
  let filledOptional = 0;

  for (const field of requiredFields) {
    const value = profile[field];
    if (value !== null && value !== undefined && value !== '' && 
        (!Array.isArray(value) || value.length > 0)) {
      filledRequired++;
    }
  }

  for (const field of optionalFields) {
    const value = profile[field];
    if (value !== null && value !== undefined && value !== '' && 
        (!Array.isArray(value) || value.length > 0)) {
      filledOptional++;
    }
  }

  // משקל: 70% לשדות חובה, 30% לאופציונליים
  const requiredScore = (filledRequired / requiredFields.length) * 70;
  const optionalScore = (filledOptional / optionalFields.length) * 30;

  return Math.round(requiredScore + optionalScore);
}

/**
 * מחזיר את המשתמשים הדחופים ביותר
 */
export async function getTopPriorityUsers(limit: number = 10): Promise<UserPriorityResult[]> {
  const summary = await calculateAllUsersPriority();
  
  const allSorted = [
    ...summary.critical,
    ...summary.high,
    ...summary.medium,
    ...summary.low,
  ];

  return allSorted.slice(0, limit);
}

/**
 * מחזיר משתמשים חדשים שעדיין לא קיבלו הצעה
 */
export async function getNewUsersWithoutSuggestion(): Promise<UserPriorityResult[]> {
  const summary = await calculateAllUsersPriority();
  
  const allUsers = [
    ...summary.critical,
    ...summary.high,
    ...summary.medium,
    ...summary.low,
  ];

  return allUsers.filter(u => u.isNewUser && u.daysSinceLastSuggestion === null);
}

/**
 * מחזיר משתמשים מוזנחים
 */
export async function getNeglectedUsers(): Promise<UserPriorityResult[]> {
  const summary = await calculateAllUsersPriority();
  
  const allUsers = [
    ...summary.critical,
    ...summary.high,
    ...summary.medium,
    ...summary.low,
  ];

  return allUsers.filter(u => u.isNeglected);
}

// =============================================================================
// EXPORTS
// =============================================================================

const priorityService = {
  calculateUserPriority,
  calculateAllUsersPriority,
  updateUserPriorityInDB,
  updateAllUsersPriorityInDB,
  getTopPriorityUsers,
  getNewUsersWithoutSuggestion,
  getNeglectedUsers,
  calculateProfileCompleteness,
  PRIORITY_WEIGHTS,
  CATEGORY_THRESHOLDS,
};

export default priorityService;
