// =============================================================================
// 📁 src/lib/services/alertsService.ts
// =============================================================================
// 🎯 Alerts Service V1.0 - NeshamaTech
// 
// מזהה מצבים שדורשים תשומת לב ויוצר התראות לשדכן
// 
// סוגי התראות:
// - NEW_USER_NO_SUGGESTION: משתמש חדש 48+ שעות בלי הצעה 🔴
// - LONG_WAIT: מחכה 10+ ימים להצעה 🔴
// - PROFILE_INCOMPLETE: פרופיל פחות מ-50% מלא 🟡
// - INACTIVE_WITH_MATCHES: יש לו התאמות אבל לא פעיל 🔵
// - NO_POTENTIAL_MATCHES: אין לו התאמות במערכת 🟡
// - HIGH_REJECTION_RATE: שיעור דחיות גבוה 🟠
// =============================================================================

import prisma from "@/lib/prisma";
import { AvailabilityStatus, UserStatus, Prisma } from "@prisma/client";
import priorityService from "./priorityService";

// =============================================================================
// TYPES
// =============================================================================

// סוגי התראות (צריך להתאים ל-enum ב-schema)
export type AlertType = 
  | 'NEW_USER_NO_SUGGESTION'
  | 'LONG_WAIT'
  | 'HIGH_DIFFICULTY'
  | 'INACTIVE_WITH_MATCHES'
  | 'PROFILE_INCOMPLETE'
  | 'NO_POTENTIAL_MATCHES'
  | 'STALE_MATCHES'
  | 'HIGH_REJECTION_RATE'
  | 'NEW_HIGH_QUALITY_MATCH';

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface AlertData {
  userId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  data?: Record<string, any>;
  actionType?: string;
  actionUrl?: string;
  expiresAt?: Date;
}

export interface AlertResult {
  id: string;
  userId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  data: any;
  actionUrl: string | null;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: Date;
  
  // פרטי משתמש
  user?: {
    firstName: string;
    lastName: string;
    gender: string;
    mainImage: string | null;
    city: string | null;
  };
}

export interface AlertsSummary {
  total: number;
  unread: number;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  byType: Record<AlertType, number>;
  alerts: AlertResult[];
}

export interface GenerateAlertsResult {
  generated: number;
  byType: Record<string, number>;
  duration: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ALERT_THRESHOLDS = {
  NEW_USER_NO_SUGGESTION_HOURS: 48,      // שעות עד התראה על משתמש חדש
  LONG_WAIT_DAYS: 10,                     // ימים עד התראת המתנה ארוכה
  INACTIVE_DAYS: 14,                      // ימים עד התראת חוסר פעילות
  PROFILE_INCOMPLETE_THRESHOLD: 50,       // אחוז מינימלי למילוי פרופיל
  HIGH_REJECTION_RATE_THRESHOLD: 0.7,     // שיעור דחיות גבוה (70%)
  STALE_MATCHES_DAYS: 30,                 // ימים עד התראת התאמות ישנות
};

const SEVERITY_ORDER: AlertSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

// =============================================================================
// ALERT GENERATION FUNCTIONS
// =============================================================================

/**
 * מייצר את כל ההתראות הרלוונטיות
 */
export async function generateAllAlerts(): Promise<GenerateAlertsResult> {
  console.log(`\n[Alerts] 🔔 Starting alert generation...`);
  const startTime = Date.now();
  
  const byType: Record<string, number> = {};
  let totalGenerated = 0;

  // 1. משתמשים חדשים ללא הצעה
  const newUserAlerts = await generateNewUserNoSuggestionAlerts();
  byType['NEW_USER_NO_SUGGESTION'] = newUserAlerts;
  totalGenerated += newUserAlerts;

  // 2. המתנה ארוכה
  const longWaitAlerts = await generateLongWaitAlerts();
  byType['LONG_WAIT'] = longWaitAlerts;
  totalGenerated += longWaitAlerts;

  // 3. פרופיל לא מלא
  const incompleteProfileAlerts = await generateIncompleteProfileAlerts();
  byType['PROFILE_INCOMPLETE'] = incompleteProfileAlerts;
  totalGenerated += incompleteProfileAlerts;

  // 4. לא פעיל עם התאמות
  const inactiveAlerts = await generateInactiveWithMatchesAlerts();
  byType['INACTIVE_WITH_MATCHES'] = inactiveAlerts;
  totalGenerated += inactiveAlerts;

  // 5. אין התאמות
  const noMatchesAlerts = await generateNoMatchesAlerts();
  byType['NO_POTENTIAL_MATCHES'] = noMatchesAlerts;
  totalGenerated += noMatchesAlerts;

  // 6. שיעור דחיות גבוה
  const highRejectionAlerts = await generateHighRejectionRateAlerts();
  byType['HIGH_REJECTION_RATE'] = highRejectionAlerts;
  totalGenerated += highRejectionAlerts;

  const duration = Date.now() - startTime;
  console.log(`[Alerts] ✅ Generated ${totalGenerated} alerts in ${duration}ms`);

  return {
    generated: totalGenerated,
    byType,
    duration,
  };
}

/**
 * משתמשים חדשים (48+ שעות) ללא הצעה
 */
async function generateNewUserNoSuggestionAlerts(): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - ALERT_THRESHOLDS.NEW_USER_NO_SUGGESTION_HOURS);

  // מצא משתמשים חדשים שלא קיבלו הצעה
  const users = await prisma.user.findMany({
    where: {
      status: UserStatus.ACTIVE,
      createdAt: { lte: cutoffDate },
      profile: {
        availabilityStatus: AvailabilityStatus.AVAILABLE,
        lastSuggestedAt: null,
      },
    },
    include: {
      profile: true,
    },
  });

  let created = 0;

  for (const user of users) {
    // בדיקה אם כבר יש התראה פעילה מסוג זה
    const existingAlert = await prisma.userAlert.findFirst({
      where: {
        userId: user.id,
        type: 'NEW_USER_NO_SUGGESTION',
        isDismissed: false,
      },
    });

    if (!existingAlert) {
      const hoursSinceRegistration = Math.floor(
        (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60)
      );

      await createAlert({
        userId: user.id,
        type: 'NEW_USER_NO_SUGGESTION',
        severity: 'CRITICAL',
        title: `משתמש/ת חדש/ה ללא הצעה`,
        message: `${user.firstName} ${user.lastName} נרשם/ה לפני ${hoursSinceRegistration} שעות ועדיין לא קיבל/ה אף הצעה.`,
        data: {
          hoursSinceRegistration,
          registrationDate: user.createdAt,
        },
        actionType: 'view_profile',
        actionUrl: `/matchmaker/candidates/${user.id}`,
      });
      created++;
    }
  }

  console.log(`[Alerts] NEW_USER_NO_SUGGESTION: ${created} created`);
  return created;
}

/**
 * המתנה ארוכה להצעה (10+ ימים)
 */
async function generateLongWaitAlerts(): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - ALERT_THRESHOLDS.LONG_WAIT_DAYS);

  // מצא משתמשים שהמתינו יותר מדי
  const profiles = await prisma.profile.findMany({
    where: {
      availabilityStatus: AvailabilityStatus.AVAILABLE,
      user: { status: UserStatus.ACTIVE },
      OR: [
        { lastSuggestedAt: { lte: cutoffDate } },
        { lastSuggestedAt: null, user: { createdAt: { lte: cutoffDate } } },
      ],
    },
    include: {
      user: true,
    },
  });

  let created = 0;

  for (const profile of profiles) {
    const existingAlert = await prisma.userAlert.findFirst({
      where: {
        userId: profile.userId,
        type: 'LONG_WAIT',
        isDismissed: false,
      },
    });

    if (!existingAlert) {
      const lastDate = profile.lastSuggestedAt || profile.user.createdAt;
      const daysSince = Math.floor(
        (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      await createAlert({
        userId: profile.userId,
        type: 'LONG_WAIT',
        severity: daysSince >= 20 ? 'CRITICAL' : 'HIGH',
        title: `המתנה ארוכה להצעה`,
        message: `${profile.user.firstName} ${profile.user.lastName} מחכה ${daysSince} ימים להצעה.`,
        data: {
          daysSinceLastSuggestion: daysSince,
          lastSuggestionDate: profile.lastSuggestedAt,
        },
        actionType: 'find_matches',
        actionUrl: `/matchmaker/candidates/${profile.userId}/matches`,
      });
      created++;
    }
  }

  console.log(`[Alerts] LONG_WAIT: ${created} created`);
  return created;
}

/**
 * פרופיל לא מלא (<50%)
 */
async function generateIncompleteProfileAlerts(): Promise<number> {
  const profiles = await prisma.profile.findMany({
    where: {
      availabilityStatus: AvailabilityStatus.AVAILABLE,
      user: { status: UserStatus.ACTIVE },
      profileCompletenessScore: { lt: ALERT_THRESHOLDS.PROFILE_INCOMPLETE_THRESHOLD },
    },
    include: {
      user: true,
    },
  });

  let created = 0;

  for (const profile of profiles) {
    const existingAlert = await prisma.userAlert.findFirst({
      where: {
        userId: profile.userId,
        type: 'PROFILE_INCOMPLETE',
        isDismissed: false,
      },
    });

    if (!existingAlert) {
      const completeness = profile.profileCompletenessScore ?? 0;

      await createAlert({
        userId: profile.userId,
        type: 'PROFILE_INCOMPLETE',
        severity: completeness < 30 ? 'HIGH' : 'MEDIUM',
        title: `פרופיל חלקי`,
        message: `הפרופיל של ${profile.user.firstName} ${profile.user.lastName} מלא רק ב-${Math.round(completeness)}%.`,
        data: {
          completenessScore: completeness,
          missingFields: profile.missingFields || [],
        },
        actionType: 'contact_user',
        actionUrl: `/matchmaker/candidates/${profile.userId}`,
      });
      created++;
    }
  }

  console.log(`[Alerts] PROFILE_INCOMPLETE: ${created} created`);
  return created;
}

/**
 * לא פעיל אבל יש לו התאמות ממתינות
 */
async function generateInactiveWithMatchesAlerts(): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - ALERT_THRESHOLDS.INACTIVE_DAYS);

  // מצא משתמשים לא פעילים עם התאמות
  const profiles = await prisma.profile.findMany({
    where: {
      availabilityStatus: AvailabilityStatus.AVAILABLE,
      user: { status: UserStatus.ACTIVE },
      lastActiveAt: { lte: cutoffDate },
      pendingMatchesCount: { gt: 0 },
    },
    include: {
      user: true,
    },
  });

  let created = 0;

  for (const profile of profiles) {
    const existingAlert = await prisma.userAlert.findFirst({
      where: {
        userId: profile.userId,
        type: 'INACTIVE_WITH_MATCHES',
        isDismissed: false,
      },
    });

    if (!existingAlert) {
      const daysSinceActive = profile.lastActiveAt
        ? Math.floor((Date.now() - profile.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      await createAlert({
        userId: profile.userId,
        type: 'INACTIVE_WITH_MATCHES',
        severity: 'MEDIUM',
        title: `לא פעיל/ה עם התאמות ממתינות`,
        message: `${profile.user.firstName} ${profile.user.lastName} לא פעיל/ה ${daysSinceActive} ימים ויש לו/ה ${profile.pendingMatchesCount} התאמות ממתינות.`,
        data: {
          daysSinceActive,
          pendingMatchesCount: profile.pendingMatchesCount,
          lastActiveAt: profile.lastActiveAt,
        },
        actionType: 'contact_user',
        actionUrl: `/matchmaker/candidates/${profile.userId}`,
      });
      created++;
    }
  }

  console.log(`[Alerts] INACTIVE_WITH_MATCHES: ${created} created`);
  return created;
}

/**
 * אין התאמות פוטנציאליות
 */
async function generateNoMatchesAlerts(): Promise<number> {
  // מצא משתמשים פעילים ללא התאמות
  const usersWithoutMatches = await prisma.user.findMany({
    where: {
      status: UserStatus.ACTIVE,
      profile: {
        availabilityStatus: AvailabilityStatus.AVAILABLE,
      },
      AND: [
        { maleMatches: { none: { status: 'PENDING' } } },
        { femaleMatches: { none: { status: 'PENDING' } } },
      ],
    },
    include: {
      profile: true,
    },
  });

  let created = 0;

  for (const user of usersWithoutMatches) {
    if (!user.profile) continue;

    // בדיקה אם המשתמש קיים יותר משבוע (לא להתריע על חדשים)
    const daysSinceRegistration = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceRegistration < 7) continue;

    const existingAlert = await prisma.userAlert.findFirst({
      where: {
        userId: user.id,
        type: 'NO_POTENTIAL_MATCHES',
        isDismissed: false,
      },
    });

    if (!existingAlert) {
      await createAlert({
        userId: user.id,
        type: 'NO_POTENTIAL_MATCHES',
        severity: 'MEDIUM',
        title: `אין התאמות במערכת`,
        message: `לא נמצאו התאמות פוטנציאליות עבור ${user.firstName} ${user.lastName}. כדאי לבדוק את הקריטריונים.`,
        data: {
          daysSinceRegistration,
        },
        actionType: 'review_criteria',
        actionUrl: `/matchmaker/candidates/${user.id}`,
      });
      created++;
    }
  }

  console.log(`[Alerts] NO_POTENTIAL_MATCHES: ${created} created`);
  return created;
}

/**
 * שיעור דחיות גבוה
 */
async function generateHighRejectionRateAlerts(): Promise<number> {
  // מצא משתמשים עם שיעור דחיות גבוה
  const profiles = await prisma.profile.findMany({
    where: {
      availabilityStatus: AvailabilityStatus.AVAILABLE,
      user: { status: UserStatus.ACTIVE },
      suggestionsReceived: { gte: 3 }, // לפחות 3 הצעות
    },
    include: {
      user: true,
    },
  });

  let created = 0;

  for (const profile of profiles) {
    const rejectionRate = profile.suggestionsReceived > 0
      ? profile.suggestionsDeclined / profile.suggestionsReceived
      : 0;

    if (rejectionRate < ALERT_THRESHOLDS.HIGH_REJECTION_RATE_THRESHOLD) continue;

    const existingAlert = await prisma.userAlert.findFirst({
      where: {
        userId: profile.userId,
        type: 'HIGH_REJECTION_RATE',
        isDismissed: false,
      },
    });

    if (!existingAlert) {
      await createAlert({
        userId: profile.userId,
        type: 'HIGH_REJECTION_RATE',
        severity: 'HIGH',
        title: `שיעור דחיות גבוה`,
        message: `${profile.user.firstName} ${profile.user.lastName} דחה/תה ${Math.round(rejectionRate * 100)}% מההצעות (${profile.suggestionsDeclined}/${profile.suggestionsReceived}).`,
        data: {
          rejectionRate,
          suggestionsReceived: profile.suggestionsReceived,
          suggestionsDeclined: profile.suggestionsDeclined,
          suggestionsAccepted: profile.suggestionsAccepted,
        },
        actionType: 'review_rejections',
        actionUrl: `/matchmaker/candidates/${profile.userId}/history`,
      });
      created++;
    }
  }

  console.log(`[Alerts] HIGH_REJECTION_RATE: ${created} created`);
  return created;
}

// =============================================================================
// CRUD FUNCTIONS
// =============================================================================

/**
 * יוצר התראה חדשה
 */
export async function createAlert(data: AlertData): Promise<string> {
  const alert = await prisma.userAlert.create({
    data: {
      userId: data.userId,
      type: data.type,
      severity: data.severity,
      title: data.title,
      message: data.message,
      data: data.data as Prisma.InputJsonValue,
      actionType: data.actionType,
      actionUrl: data.actionUrl,
      expiresAt: data.expiresAt,
    },
  });

  return alert.id;
}

/**
 * מחזיר את כל ההתראות הפעילות
 */
export async function getActiveAlerts(options?: {
  severity?: AlertSeverity;
  type?: AlertType;
  limit?: number;
  includeRead?: boolean;
}): Promise<AlertResult[]> {
  const { severity, type, limit = 100, includeRead = false } = options || {};

  const where: Prisma.UserAlertWhereInput = {
    isDismissed: false,
    ...(includeRead ? {} : { isRead: false }),
    ...(severity ? { severity } : {}),
    ...(type ? { type } : {}),
    OR: [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } },
    ],
  };

  const alerts = await prisma.userAlert.findMany({
    where,
    orderBy: [
      { severity: 'asc' }, // CRITICAL first
      { createdAt: 'desc' },
    ],
    take: limit,
    include: {
      user: {
        include: {
          profile: {
            select: {
              gender: true,
              city: true,
            },
          },
          images: {
            where: { isMain: true },
            take: 1,
          },
        },
      },
    },
  });

  return alerts.map(alert => ({
    id: alert.id,
    userId: alert.userId,
    type: alert.type as AlertType,
    severity: alert.severity as AlertSeverity,
    title: alert.title,
    message: alert.message,
    data: alert.data,
    actionUrl: alert.actionUrl,
    isRead: alert.isRead,
    isDismissed: alert.isDismissed,
    createdAt: alert.createdAt,
    user: {
      firstName: alert.user.firstName,
      lastName: alert.user.lastName,
      gender: alert.user.profile?.gender || 'MALE',
      mainImage: alert.user.images[0]?.url || null,
      city: alert.user.profile?.city || null,
    },
  }));
}

/**
 * מחזיר סיכום התראות
 */
export async function getAlertsSummary(): Promise<AlertsSummary> {
  const alerts = await getActiveAlerts({ includeRead: true });

  const summary: AlertsSummary = {
    total: alerts.length,
    unread: alerts.filter(a => !a.isRead).length,
    bySeverity: {
      critical: alerts.filter(a => a.severity === 'CRITICAL').length,
      high: alerts.filter(a => a.severity === 'HIGH').length,
      medium: alerts.filter(a => a.severity === 'MEDIUM').length,
      low: alerts.filter(a => a.severity === 'LOW').length,
      info: alerts.filter(a => a.severity === 'INFO').length,
    },
    byType: {} as Record<AlertType, number>,
    alerts,
  };

  // ספירה לפי סוג
  for (const alert of alerts) {
    summary.byType[alert.type] = (summary.byType[alert.type] || 0) + 1;
  }

  return summary;
}

/**
 * מסמן התראה כנקראה
 */
export async function markAlertAsRead(alertId: string): Promise<void> {
  await prisma.userAlert.update({
    where: { id: alertId },
    data: { isRead: true },
  });
}

/**
 * מסמן התראות רבות כנקראו
 */
export async function markAlertsAsRead(alertIds: string[]): Promise<number> {
  const result = await prisma.userAlert.updateMany({
    where: { id: { in: alertIds } },
    data: { isRead: true },
  });

  return result.count;
}

/**
 * דוחה התראה
 */
export async function dismissAlert(
  alertId: string, 
  dismissedBy: string, 
  reason?: string
): Promise<void> {
  await prisma.userAlert.update({
    where: { id: alertId },
    data: {
      isDismissed: true,
      dismissedAt: new Date(),
      dismissedBy,
      dismissReason: reason,
    },
  });
}

/**
 * דוחה התראות רבות
 */
export async function dismissAlerts(
  alertIds: string[], 
  dismissedBy: string, 
  reason?: string
): Promise<number> {
  const result = await prisma.userAlert.updateMany({
    where: { id: { in: alertIds } },
    data: {
      isDismissed: true,
      dismissedAt: new Date(),
      dismissedBy,
      dismissReason: reason,
    },
  });

  return result.count;
}

/**
 * מוחק התראות ישנות
 */
export async function cleanupOldAlerts(daysOld: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.userAlert.deleteMany({
    where: {
      OR: [
        { isDismissed: true, dismissedAt: { lte: cutoffDate } },
        { expiresAt: { lte: new Date() } },
      ],
    },
  });

  console.log(`[Alerts] Cleaned up ${result.count} old alerts`);
  return result.count;
}

/**
 * מחזיר התראות למשתמש ספציפי
 */
export async function getAlertsForUser(userId: string): Promise<AlertResult[]> {
  return getActiveAlerts({ includeRead: true }).then(
    alerts => alerts.filter(a => a.userId === userId)
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

const alertsService = {
  // Generation
  generateAllAlerts,
  
  // CRUD
  createAlert,
  getActiveAlerts,
  getAlertsSummary,
  getAlertsForUser,
  
  // Actions
  markAlertAsRead,
  markAlertsAsRead,
  dismissAlert,
  dismissAlerts,
  cleanupOldAlerts,
  
  // Constants
  ALERT_THRESHOLDS,
  SEVERITY_ORDER,
};

export default alertsService;
