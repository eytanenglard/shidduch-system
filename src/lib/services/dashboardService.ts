// =============================================================================
// 📁 src/lib/services/dashboardService.ts
// =============================================================================
// 🎯 Dashboard Service V1.0 - NeshamaTech
// 
// אגרגציית כל הנתונים הנדרשים לדשבורד השדכן
// =============================================================================

import prisma from "@/lib/prisma";
import { AvailabilityStatus, UserStatus, Gender, PotentialMatchStatus } from "@prisma/client";
import priorityService, { 
  type UserPriorityResult, 
  type PriorityCategory 
} from "./priorityService";
import alertsService, { 
  type AlertsSummary, 
  type AlertResult 
} from "./alertsService";

// =============================================================================
// TYPES
// =============================================================================

export interface DashboardStats {
  // משתמשים
  totalActiveUsers: number;
  maleCount: number;
  femaleCount: number;
  newUsersThisWeek: number;
  newUsersToday: number;
  
  // התאמות
  totalPotentialMatches: number;
  pendingMatches: number;
  sentSuggestions: number;
  activeMatches: number;
  
  // ביצועים
  matchesThisWeek: number;
  suggestionsThisWeek: number;
  acceptanceRate: number;
  
  // בעיות
  usersWithNoMatches: number;
  usersWaitingLong: number;
  incompleteProfiles: number;
}

export interface PriorityUserCard {
  userId: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  age: number | null;
  city: string | null;
  mainImage: string | null;
  
  // Priority
  priorityScore: number;
  category: PriorityCategory;
  
  // Flags
  isNewUser: boolean;
  isNeglected: boolean;
  hasNoPendingMatches: boolean;
  
  // Stats
  daysSinceRegistration: number;
  daysSinceLastSuggestion: number | null;
  pendingMatchesCount: number;
  profileCompleteness: number;
  
  // Tags for UI
  tags: string[];
}

export interface RecentActivity {
  id: string;
  type: 'new_user' | 'new_match' | 'suggestion_sent' | 'suggestion_accepted' | 'suggestion_declined';
  title: string;
  description: string;
  timestamp: Date;
  userId?: string;
  relatedId?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  
  // Priority Users
  criticalUsers: PriorityUserCard[];
  highPriorityUsers: PriorityUserCard[];
  
  // Alerts
  alerts: AlertsSummary;
  
  // Recent Activity
  recentActivity: RecentActivity[];
  
  // Quick Actions
  quickActions: {
    newUsersToReview: number;
    matchesToReview: number;
    suggestionsToFollow: number;
  };
  
  // Last scan info
  lastScan: {
    timestamp: Date | null;
    matchesFound: number;
    duration: number | null;
  } | null;
  
  // Metadata
  generatedAt: Date;
  cacheDuration: number; // seconds
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * מחזיר את כל הנתונים לדשבורד
 */
export async function getDashboardData(): Promise<DashboardData> {
  console.log(`[Dashboard] 📊 Generating dashboard data...`);
  const startTime = Date.now();

  // Parallel fetching for better performance
  const [
    stats,
    prioritySummary,
    alertsSummary,
    recentActivity,
    lastScan,
  ] = await Promise.all([
    getStats(),
    priorityService.calculateAllUsersPriority(),
    alertsService.getAlertsSummary(),
    getRecentActivity(),
    getLastScanInfo(),
  ]);

  // Transform priority users to cards
  const criticalUsers = prioritySummary.critical
    .slice(0, 10)
    .map(transformToPriorityCard);
  
  const highPriorityUsers = prioritySummary.high
    .slice(0, 10)
    .map(transformToPriorityCard);

  const duration = Date.now() - startTime;
  console.log(`[Dashboard] ✅ Generated in ${duration}ms`);

  return {
    stats,
    criticalUsers,
    highPriorityUsers,
    alerts: alertsSummary,
    recentActivity,
    quickActions: {
      newUsersToReview: stats.newUsersToday,
      matchesToReview: stats.pendingMatches,
      suggestionsToFollow: await countSuggestionsToFollow(),
    },
    lastScan,
    generatedAt: new Date(),
    cacheDuration: 60, // Cache for 1 minute
  };
}

// =============================================================================
// STATS FUNCTIONS
// =============================================================================

async function getStats(): Promise<DashboardStats> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Active users count
  const activeUsersCount = await prisma.user.count({
    where: {
      status: UserStatus.ACTIVE,
      profile: {
        availabilityStatus: {
          in: [AvailabilityStatus.AVAILABLE, AvailabilityStatus.PAUSED],
        },
      },
    },
  });

  // Gender breakdown
  const genderBreakdown = await prisma.profile.groupBy({
    by: ['gender'],
    where: {
      availabilityStatus: {
        in: [AvailabilityStatus.AVAILABLE, AvailabilityStatus.PAUSED],
      },
      user: { status: UserStatus.ACTIVE },
    },
    _count: true,
  });

  const maleCount = genderBreakdown.find(g => g.gender === 'MALE')?._count || 0;
  const femaleCount = genderBreakdown.find(g => g.gender === 'FEMALE')?._count || 0;

  // New users
  const newUsersThisWeek = await prisma.user.count({
    where: {
      status: UserStatus.ACTIVE,
      createdAt: { gte: weekAgo },
    },
  });

  const newUsersToday = await prisma.user.count({
    where: {
      status: UserStatus.ACTIVE,
      createdAt: { gte: dayAgo },
    },
  });

  // Potential matches
  const totalPotentialMatches = await prisma.potentialMatch.count({
    where: {
      status: { not: 'DISMISSED' },
    },
  });

  const pendingMatches = await prisma.potentialMatch.count({
    where: { status: 'PENDING' },
  });

  // Suggestions
  const sentSuggestions = await prisma.matchSuggestion.count({
    where: {
      status: { 
        in: ['PENDING_FIRST_PARTY', 'PENDING_SECOND_PARTY', 'CONTACT_DETAILS_SHARED'] 
      },
    },
  });

  const activeMatches = await prisma.matchSuggestion.count({
    where: {
      status: { in: ['DATING', 'PROCEEDING_TO_SECOND_DATE'] },
    },
  });

  // This week performance
  const matchesThisWeek = await prisma.potentialMatch.count({
    where: {
      scannedAt: { gte: weekAgo },
      aiScore: { gte: 70 },
    },
  });

  const suggestionsThisWeek = await prisma.matchSuggestion.count({
    where: {
      createdAt: { gte: weekAgo },
    },
  });

  // Acceptance rate
  const totalSent = await prisma.matchSuggestion.count({
    where: {
      status: { not: 'DRAFT' },
      createdAt: { gte: weekAgo },
    },
  });

  const totalAccepted = await prisma.matchSuggestion.count({
    where: {
      status: { 
        in: ['FIRST_PARTY_APPROVED', 'SECOND_PARTY_APPROVED', 'CONTACT_DETAILS_SHARED', 'DATING'] 
      },
      createdAt: { gte: weekAgo },
    },
  });

  const acceptanceRate = totalSent > 0 ? (totalAccepted / totalSent) * 100 : 0;

  // Problems
  const usersWithNoMatches = await prisma.user.count({
    where: {
      status: UserStatus.ACTIVE,
      profile: {
        availabilityStatus: AvailabilityStatus.AVAILABLE,
        pendingMatchesCount: 0,
      },
    },
  });

  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
  const usersWaitingLong = await prisma.profile.count({
    where: {
      availabilityStatus: AvailabilityStatus.AVAILABLE,
      user: { status: UserStatus.ACTIVE },
      OR: [
        { lastSuggestedAt: { lte: tenDaysAgo } },
        { lastSuggestedAt: null },
      ],
    },
  });

  const incompleteProfiles = await prisma.profile.count({
    where: {
      availabilityStatus: AvailabilityStatus.AVAILABLE,
      user: { status: UserStatus.ACTIVE },
      profileCompletenessScore: { lt: 50 },
    },
  });

  return {
    totalActiveUsers: activeUsersCount,
    maleCount,
    femaleCount,
    newUsersThisWeek,
    newUsersToday,
    totalPotentialMatches,
    pendingMatches,
    sentSuggestions,
    activeMatches,
    matchesThisWeek,
    suggestionsThisWeek,
    acceptanceRate: Math.round(acceptanceRate),
    usersWithNoMatches,
    usersWaitingLong,
    incompleteProfiles,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function transformToPriorityCard(user: UserPriorityResult): PriorityUserCard {
  const tags: string[] = [];
  
  if (user.isNewUser) tags.push('🆕 חדש');
  if (user.isNeglected) tags.push('⏰ ממתין');
  if (user.hasNoPendingMatches) tags.push('📭 ללא התאמות');
  if (user.profileCompletenessScore < 50) tags.push('📝 פרופיל חלקי');
  if (user.isInactive) tags.push('😴 לא פעיל');

  return {
    userId: user.userId,
    firstName: user.firstName,
    lastName: user.lastName,
    gender: user.gender,
    age: null, // Will be fetched separately if needed
    city: null, // Will be fetched separately if needed
    mainImage: null, // Will be fetched separately if needed
    priorityScore: user.priorityScore,
    category: user.category,
    isNewUser: user.isNewUser,
    isNeglected: user.isNeglected,
    hasNoPendingMatches: user.hasNoPendingMatches,
    daysSinceRegistration: user.daysSinceRegistration,
    daysSinceLastSuggestion: user.daysSinceLastSuggestion,
    pendingMatchesCount: user.pendingMatchesCount,
    profileCompleteness: user.profileCompletenessScore,
    tags,
  };
}

async function getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
  const activities: RecentActivity[] = [];

  // New users (last 24h)
  const newUsers = await prisma.user.findMany({
    where: {
      status: UserStatus.ACTIVE,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { profile: true },
  });

  for (const user of newUsers) {
    activities.push({
      id: `new_user_${user.id}`,
      type: 'new_user',
      title: 'משתמש/ת חדש/ה',
      description: `${user.firstName} ${user.lastName} נרשם/ה למערכת`,
      timestamp: user.createdAt,
      userId: user.id,
    });
  }

  // Recent suggestions
  const recentSuggestions = await prisma.matchSuggestion.findMany({
    where: {
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      firstParty: true,
      secondParty: true,
    },
  });

  for (const suggestion of recentSuggestions) {
    activities.push({
      id: `suggestion_${suggestion.id}`,
      type: 'suggestion_sent',
      title: 'הצעה נשלחה',
      description: `${suggestion.firstParty.firstName} ↔ ${suggestion.secondParty.firstName}`,
      timestamp: suggestion.createdAt,
      relatedId: suggestion.id,
    });
  }

  // Recent acceptances
  const recentAcceptances = await prisma.matchSuggestion.findMany({
    where: {
      status: { in: ['FIRST_PARTY_APPROVED', 'SECOND_PARTY_APPROVED', 'CONTACT_DETAILS_SHARED'] },
      lastStatusChange: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    orderBy: { lastStatusChange: 'desc' },
    take: 5,
    include: {
      firstParty: true,
      secondParty: true,
    },
  });

  for (const suggestion of recentAcceptances) {
    activities.push({
      id: `accepted_${suggestion.id}`,
      type: 'suggestion_accepted',
      title: 'הצעה אושרה! 🎉',
      description: `${suggestion.firstParty.firstName} ↔ ${suggestion.secondParty.firstName}`,
      timestamp: suggestion.lastStatusChange || suggestion.updatedAt,
      relatedId: suggestion.id,
    });
  }

  // Sort by timestamp and limit
  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  return activities.slice(0, limit);
}

// ✅ אחרי - מתוקן
async function getLastScanInfo(): Promise<DashboardData['lastScan']> {
  const lastScan = await prisma.scanSession.findFirst({
    where: { status: 'COMPLETED' },  // ← תוקן לאותיות גדולות
    orderBy: { completedAt: 'desc' },
  });

  if (!lastScan) return null;

  return {
    timestamp: lastScan.completedAt,
    matchesFound: lastScan.matchesFound,
    duration: lastScan.durationMs,
  };
}

async function countSuggestionsToFollow(): Promise<number> {
  return prisma.matchSuggestion.count({
    where: {
      status: {
        in: ['PENDING_FIRST_PARTY', 'PENDING_SECOND_PARTY', 'AWAITING_FIRST_DATE_FEEDBACK'],
      },
      lastActivity: {
        lte: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours
      },
    },
  });
}

// =============================================================================
// ADDITIONAL DASHBOARD QUERIES
// =============================================================================

/**
 * מחזיר משתמשים לפי קטגוריית Priority
 */
export async function getUsersByPriorityCategory(
  category: PriorityCategory,
  limit: number = 20
): Promise<PriorityUserCard[]> {
  const summary = await priorityService.calculateAllUsersPriority();
  
  let users: UserPriorityResult[];
  switch (category) {
    case 'CRITICAL':
      users = summary.critical;
      break;
    case 'HIGH':
      users = summary.high;
      break;
    case 'MEDIUM':
      users = summary.medium;
      break;
    case 'LOW':
      users = summary.low;
      break;
  }

  // Fetch additional data (images, etc.)
  const userIds = users.slice(0, limit).map(u => u.userId);
  
  const fullUsers = await prisma.user.findMany({
    where: { id: { in: userIds } },
    include: {
      profile: true,
      images: {
        where: { isMain: true },
        take: 1,
      },
    },
  });

  return users.slice(0, limit).map(u => {
    const fullUser = fullUsers.find(fu => fu.id === u.userId);
    const card = transformToPriorityCard(u);
    
    if (fullUser) {
      card.age = fullUser.profile?.birthDate 
        ? Math.floor((Date.now() - fullUser.profile.birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365))
        : null;
      card.city = fullUser.profile?.city || null;
      card.mainImage = fullUser.images[0]?.url || null;
    }
    
    return card;
  });
}

/**
 * מחזיר סטטיסטיקות מהירות
 */
export async function getQuickStats(): Promise<{
  activeUsers: number;
  pendingMatches: number;
  criticalAlerts: number;
}> {
  const [activeUsers, pendingMatches, criticalAlerts] = await Promise.all([
    prisma.user.count({
      where: {
        status: UserStatus.ACTIVE,
        profile: {
          availabilityStatus: AvailabilityStatus.AVAILABLE,
        },
      },
    }),
    prisma.potentialMatch.count({
      where: { status: 'PENDING' },
    }),
    prisma.userAlert.count({
      where: {
        severity: 'CRITICAL',
        isDismissed: false,
      },
    }),
  ]);

  return { activeUsers, pendingMatches, criticalAlerts };
}

/**
 * מחזיר גרף של התאמות לאורך זמן
 */
export async function getMatchesOverTime(days: number = 30): Promise<{
  date: string;
  matches: number;
  suggestions: number;
}[]> {
  const results: { date: string; matches: number; suggestions: number }[] = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const [matchesCount, suggestionsCount] = await Promise.all([
      prisma.potentialMatch.count({
        where: {
          scannedAt: { gte: date, lt: nextDate },
          aiScore: { gte: 70 },
        },
      }),
      prisma.matchSuggestion.count({
        where: {
          createdAt: { gte: date, lt: nextDate },
        },
      }),
    ]);
    
    results.push({
      date: date.toISOString().split('T')[0],
      matches: matchesCount,
      suggestions: suggestionsCount,
    });
  }
  
  return results;
}

// =============================================================================
// EXPORTS
// =============================================================================

const dashboardService = {
  getDashboardData,
  getStats,
  getUsersByPriorityCategory,
  getQuickStats,
  getMatchesOverTime,
  getRecentActivity,
  getLastScanInfo,
};

export default dashboardService;
