// =============================================================================
// 📁 src/lib/services/rejectionFeedbackService.ts
// =============================================================================
// 🎯 Rejection Feedback Service V1.0 - NeshamaTech
// 
// תיעוד וניתוח דחיות של הצעות
// מאפשר למידה ושיפור של האלגוריתם
// =============================================================================

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// =============================================================================
// TYPES
// =============================================================================

export type RejectionCategory = 
  // סיבות אובייקטיביות
  | 'AGE_GAP'
  | 'RELIGIOUS_GAP'
  | 'BACKGROUND_GAP'
  | 'EDUCATION_GAP'
  | 'GEOGRAPHIC_GAP'
  | 'KNOWS_PERSONALLY'
  // סיבות סובייקטיביות
  | 'NOT_ATTRACTED'
  | 'NOT_INTERESTING'
  | 'NO_CONNECTION'
  | 'GUT_FEELING'
  | 'SOMETHING_OFF'
  // סיבות תזמון
  | 'NOT_AVAILABLE_NOW'
  | 'IN_PROCESS_WITH_OTHER'
  | 'NEEDS_TIME'
  | 'EXTERNAL_PRESSURE'
  // Red Flags
  | 'INCONSISTENT_STORY'
  | 'PROBLEMATIC_BEHAVIOR'
  | 'UNREALISTIC_EXPECTATIONS'
  | 'CONCERNING_HISTORY'
  // אחר
  | 'OTHER';

export interface RejectionFeedbackInput {
  rejectedUserId: string;       // מי נדחה
  rejectingUserId: string;      // מי דחה (אם ידוע)
  suggestionId?: string;        // MatchSuggestion אם רלוונטי
  potentialMatchId?: string;    // PotentialMatch אם רלוונטי
  category: RejectionCategory;  // קטגוריה ראשית
  subcategory?: string;         // תת-קטגוריה
  freeText?: string;            // הסבר חופשי
  recordedBy: string;           // ID של השדכן
  wasExpected?: boolean;        // האם הדחייה הייתה צפויה
}

export interface RejectionStats {
  totalRejections: number;
  byCategory: Record<RejectionCategory, number>;
  topReasons: Array<{
    category: RejectionCategory;
    count: number;
    percentage: number;
  }>;
  expectedVsUnexpected: {
    expected: number;
    unexpected: number;
    unknown: number;
  };
}

export interface UserRejectionProfile {
  userId: string;
  totalRejections: number;
  rejectionsByMe: number;      // כמה פעמים דחה אחרים
  rejectionsOfMe: number;      // כמה פעמים נדחה
  topReasonsForMe: RejectionCategory[];
  topReasonsByMe: RejectionCategory[];
  patterns: string[];          // דפוסים מזוהים
}

export interface RejectionInsight {
  type: 'pattern' | 'warning' | 'recommendation';
  message: string;
  affectedUsers: string[];
  severity: 'low' | 'medium' | 'high';
}

// =============================================================================
// CATEGORY METADATA
// =============================================================================

export const REJECTION_CATEGORY_INFO: Record<RejectionCategory, {
  label: string;
  labelHe: string;
  group: 'objective' | 'subjective' | 'timing' | 'red_flag' | 'other';
  description: string;
}> = {
  // אובייקטיביות
  AGE_GAP: {
    label: 'Age Gap',
    labelHe: 'פער גיל גדול מדי',
    group: 'objective',
    description: 'הפער בגיל גדול מדי עבור אחד הצדדים',
  },
  RELIGIOUS_GAP: {
    label: 'Religious Gap',
    labelHe: 'פער רמה דתית',
    group: 'objective',
    description: 'הבדל משמעותי ברמת הדתיות',
  },
  BACKGROUND_GAP: {
    label: 'Background Gap',
    labelHe: 'פער רקע/עדה',
    group: 'objective',
    description: 'הבדל ברקע תרבותי או עדתי',
  },
  EDUCATION_GAP: {
    label: 'Education Gap',
    labelHe: 'פער השכלה/קריירה',
    group: 'objective',
    description: 'הבדל ברמת ההשכלה או הקריירה',
  },
  GEOGRAPHIC_GAP: {
    label: 'Geographic Gap',
    labelHe: 'פער גיאוגרפי',
    group: 'objective',
    description: 'מרחק גיאוגרפי בעייתי',
  },
  KNOWS_PERSONALLY: {
    label: 'Knows Personally',
    labelHe: 'מכיר/ה אישית',
    group: 'objective',
    description: 'מכירים אחד את השני ממעגל קרוב',
  },
  
  // סובייקטיביות
  NOT_ATTRACTED: {
    label: 'Not Attracted',
    labelHe: 'לא מושך/ת',
    group: 'subjective',
    description: 'חוסר משיכה פיזית',
  },
  NOT_INTERESTING: {
    label: 'Not Interesting',
    labelHe: 'לא מעניין/ת',
    group: 'subjective',
    description: 'הפרופיל או האדם לא מעניינים',
  },
  NO_CONNECTION: {
    label: 'No Connection',
    labelHe: 'לא הרגשתי חיבור',
    group: 'subjective',
    description: 'לא הייתה תחושת חיבור',
  },
  GUT_FEELING: {
    label: 'Gut Feeling',
    labelHe: 'תחושת בטן שלילית',
    group: 'subjective',
    description: 'תחושה לא טובה בלי סיבה מוגדרת',
  },
  SOMETHING_OFF: {
    label: 'Something Off',
    labelHe: 'משהו לא הסתדר לי',
    group: 'subjective',
    description: 'הרגשה כללית שמשהו לא בסדר',
  },
  
  // תזמון
  NOT_AVAILABLE_NOW: {
    label: 'Not Available Now',
    labelHe: 'לא זמין/ה כרגע',
    group: 'timing',
    description: 'הצד לא פנוי כרגע לשידוכים',
  },
  IN_PROCESS_WITH_OTHER: {
    label: 'In Process',
    labelHe: 'בתהליך עם מישהו אחר',
    group: 'timing',
    description: 'כבר בתהליך היכרות עם מישהו אחר',
  },
  NEEDS_TIME: {
    label: 'Needs Time',
    labelHe: 'צריך/ה זמן לחשוב',
    group: 'timing',
    description: 'מבקש זמן לחשוב או להתארגן',
  },
  EXTERNAL_PRESSURE: {
    label: 'External Pressure',
    labelHe: 'לחץ חיצוני',
    group: 'timing',
    description: 'לחץ ממשפחה, עבודה, או גורם חיצוני',
  },
  
  // Red Flags
  INCONSISTENT_STORY: {
    label: 'Inconsistent Story',
    labelHe: 'חוסר עקביות בסיפור',
    group: 'red_flag',
    description: 'סתירות או חוסר עקביות במה שנאמר',
  },
  PROBLEMATIC_BEHAVIOR: {
    label: 'Problematic Behavior',
    labelHe: 'התנהגות בעייתית',
    group: 'red_flag',
    description: 'התנהגות שמעוררת חשש',
  },
  UNREALISTIC_EXPECTATIONS: {
    label: 'Unrealistic Expectations',
    labelHe: 'ציפיות לא ריאליסטיות',
    group: 'red_flag',
    description: 'ציפיות שלא תואמות את המציאות',
  },
  CONCERNING_HISTORY: {
    label: 'Concerning History',
    labelHe: 'היסטוריה מדאיגה',
    group: 'red_flag',
    description: 'מידע על העבר שמעורר דאגה',
  },
  
  // אחר
  OTHER: {
    label: 'Other',
    labelHe: 'סיבה אחרת',
    group: 'other',
    description: 'סיבה שלא מופיעה ברשימה',
  },
};

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * שמירת פידבק דחייה
 */
export async function saveRejectionFeedback(
  input: RejectionFeedbackInput
): Promise<string> {
  console.log(`[RejectionFeedback] 📝 Saving rejection: ${input.rejectingUserId} → ${input.rejectedUserId}`);
  
  const feedback = await prisma.rejectionFeedback.create({
    data: {
      rejectedUserId: input.rejectedUserId,
      rejectingUserId: input.rejectingUserId,
      suggestionId: input.suggestionId,
      potentialMatchId: input.potentialMatchId,
      category: input.category,
      subcategory: input.subcategory,
      freeText: input.freeText,
      recordedBy: input.recordedBy,
      wasExpected: input.wasExpected,
    },
  });
  
  // עדכון סטטיסטיקות המשתמש
  await updateUserRejectionStats(input.rejectedUserId);
  await updateUserRejectionStats(input.rejectingUserId);
  
  return feedback.id;
}

/**
 * עדכון סטטיסטיקות דחיות למשתמש
 */
async function updateUserRejectionStats(userId: string): Promise<void> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
  });
  
  if (!profile) return;
  
  // ספירת דחיות
  const [rejectionsOfMe, rejectionsByMe] = await Promise.all([
    prisma.rejectionFeedback.count({
      where: { rejectedUserId: userId },
    }),
    prisma.rejectionFeedback.count({
      where: { rejectingUserId: userId },
    }),
  ]);
  
  // חישוב Acceptance Rate (אם יש נתונים)
  const totalSuggestions = profile.suggestionsReceived || 0;
  const totalDeclined = profile.suggestionsDeclined || 0;
  
  const acceptanceRate = totalSuggestions > 0
    ? (totalSuggestions - totalDeclined) / totalSuggestions
    : null;
  
  await prisma.profile.update({
    where: { userId },
    data: {
      suggestionsDeclined: rejectionsByMe,
      acceptanceRate,
    },
  });
}

/**
 * מחזיר סטטיסטיקות דחיות כלליות
 */
export async function getRejectionStats(
  dateFrom?: Date,
  dateTo?: Date
): Promise<RejectionStats> {
  const whereClause: Prisma.RejectionFeedbackWhereInput = {};
  
  if (dateFrom || dateTo) {
    whereClause.createdAt = {};
    if (dateFrom) whereClause.createdAt.gte = dateFrom;
    if (dateTo) whereClause.createdAt.lte = dateTo;
  }
  
  // סה"כ דחיות
  const totalRejections = await prisma.rejectionFeedback.count({
    where: whereClause,
  });
  
  // לפי קטגוריה
  const byCategory = await prisma.rejectionFeedback.groupBy({
    by: ['category'],
    where: whereClause,
    _count: true,
  });
  
  const categoryMap: Record<RejectionCategory, number> = {} as any;
  for (const cat of Object.keys(REJECTION_CATEGORY_INFO) as RejectionCategory[]) {
    categoryMap[cat] = 0;
  }
  
  for (const item of byCategory) {
    categoryMap[item.category as RejectionCategory] = item._count;
  }
  
  // Top reasons
  const topReasons = byCategory
    .sort((a, b) => b._count - a._count)
    .slice(0, 10)
    .map(item => ({
      category: item.category as RejectionCategory,
      count: item._count,
      percentage: totalRejections > 0 ? Math.round((item._count / totalRejections) * 100) : 0,
    }));
  
  // Expected vs Unexpected
  const expectedStats = await prisma.rejectionFeedback.groupBy({
    by: ['wasExpected'],
    where: whereClause,
    _count: true,
  });
  
  const expectedVsUnexpected = {
    expected: 0,
    unexpected: 0,
    unknown: 0,
  };
  
  for (const item of expectedStats) {
    if (item.wasExpected === true) {
      expectedVsUnexpected.expected = item._count;
    } else if (item.wasExpected === false) {
      expectedVsUnexpected.unexpected = item._count;
    } else {
      expectedVsUnexpected.unknown = item._count;
    }
  }
  
  return {
    totalRejections,
    byCategory: categoryMap,
    topReasons,
    expectedVsUnexpected,
  };
}

/**
 * מחזיר פרופיל דחיות למשתמש ספציפי
 */
export async function getUserRejectionProfile(
  userId: string
): Promise<UserRejectionProfile> {
  const [rejectionsOfMe, rejectionsByMe] = await Promise.all([
    prisma.rejectionFeedback.findMany({
      where: { rejectedUserId: userId },
    }),
    prisma.rejectionFeedback.findMany({
      where: { rejectingUserId: userId },
    }),
  ]);
  
  // Top reasons for me being rejected
  const reasonsForMe: Record<string, number> = {};
  for (const r of rejectionsOfMe) {
    reasonsForMe[r.category] = (reasonsForMe[r.category] || 0) + 1;
  }
  
  const topReasonsForMe = Object.entries(reasonsForMe)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat as RejectionCategory);
  
  // Top reasons by me for rejecting others
  const reasonsByMe: Record<string, number> = {};
  for (const r of rejectionsByMe) {
    reasonsByMe[r.category] = (reasonsByMe[r.category] || 0) + 1;
  }
  
  const topReasonsByMe = Object.entries(reasonsByMe)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat as RejectionCategory);
  
  // זיהוי דפוסים
  const patterns: string[] = [];
  
  // דפוס: נדחה הרבה על אותה סיבה
  if (topReasonsForMe.length > 0) {
    const topReason = topReasonsForMe[0];
    const topCount = reasonsForMe[topReason];
    if (topCount >= 3 && rejectionsOfMe.length > 0) {
      const percentage = Math.round((topCount / rejectionsOfMe.length) * 100);
      if (percentage >= 50) {
        const reasonInfo = REJECTION_CATEGORY_INFO[topReason];
        patterns.push(`נדחה ${percentage}% מהפעמים בגלל: ${reasonInfo.labelHe}`);
      }
    }
  }
  
  // דפוס: דוחה הרבה
  if (rejectionsByMe.length >= 5) {
    const total = rejectionsByMe.length;
    patterns.push(`דחה ${total} הצעות - שיעור דחיות גבוה`);
  }
  
  // דפוס: דוחה על אותה סיבה
  if (topReasonsByMe.length > 0) {
    const topReason = topReasonsByMe[0];
    const topCount = reasonsByMe[topReason];
    if (topCount >= 3 && rejectionsByMe.length > 0) {
      const percentage = Math.round((topCount / rejectionsByMe.length) * 100);
      if (percentage >= 60) {
        const reasonInfo = REJECTION_CATEGORY_INFO[topReason];
        patterns.push(`דוחה ${percentage}% מהפעמים בגלל: ${reasonInfo.labelHe}`);
      }
    }
  }
  
  return {
    userId,
    totalRejections: rejectionsOfMe.length + rejectionsByMe.length,
    rejectionsByMe: rejectionsByMe.length,
    rejectionsOfMe: rejectionsOfMe.length,
    topReasonsForMe,
    topReasonsByMe,
    patterns,
  };
}

/**
 * מחזיר תובנות מניתוח הדחיות
 */
export async function getRejectionInsights(): Promise<RejectionInsight[]> {
  const insights: RejectionInsight[] = [];
  
  // תובנה: סיבות דחייה נפוצות
  const stats = await getRejectionStats();
  
  if (stats.topReasons.length > 0) {
    const topReason = stats.topReasons[0];
    if (topReason.percentage >= 30) {
      const reasonInfo = REJECTION_CATEGORY_INFO[topReason.category];
      insights.push({
        type: 'pattern',
        message: `${topReason.percentage}% מהדחיות הן בגלל "${reasonInfo.labelHe}" - כדאי לשים לב לזה באלגוריתם`,
        affectedUsers: [],
        severity: 'medium',
      });
    }
  }
  
  // תובנה: דחיות לא צפויות
  if (stats.expectedVsUnexpected.unexpected > stats.expectedVsUnexpected.expected * 2) {
    insights.push({
      type: 'warning',
      message: `רוב הדחיות לא היו צפויות - האלגוריתם לא מזהה משהו חשוב`,
      affectedUsers: [],
      severity: 'high',
    });
  }
  
  // תובנה: משתמשים עם הרבה דחיות
  const highRejectionUsers = await prisma.profile.findMany({
    where: {
      OR: [
        { suggestionsDeclined: { gte: 5 } },
      ],
    },
    take: 10,
    select: { userId: true },
  });
  
  if (highRejectionUsers.length > 0) {
    insights.push({
      type: 'recommendation',
      message: `${highRejectionUsers.length} משתמשים עם שיעור דחיות גבוה - כדאי לשוחח איתם`,
      affectedUsers: highRejectionUsers.map(u => u.userId),
      severity: 'medium',
    });
  }
  
  return insights;
}

/**
 * מחזיר היסטוריית דחיות לזוג ספציפי
 */
export async function getPairRejectionHistory(
  userId1: string,
  userId2: string
): Promise<{
  hasHistory: boolean;
  rejections: Array<{
    date: Date;
    rejectedId: string;
    rejectingId: string;
    category: RejectionCategory;
    freeText: string | null;
  }>;
}> {
  const rejections = await prisma.rejectionFeedback.findMany({
    where: {
      OR: [
        { rejectedUserId: userId1, rejectingUserId: userId2 },
        { rejectedUserId: userId2, rejectingUserId: userId1 },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });
  
  return {
    hasHistory: rejections.length > 0,
    rejections: rejections.map(r => ({
      date: r.createdAt,
      rejectedId: r.rejectedUserId,
      rejectingId: r.rejectingUserId,
      category: r.category as RejectionCategory,
      freeText: r.freeText,
    })),
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

const rejectionFeedbackService = {
  saveRejectionFeedback,
  getRejectionStats,
  getUserRejectionProfile,
  getRejectionInsights,
  getPairRejectionHistory,
  REJECTION_CATEGORY_INFO,
};

export default rejectionFeedbackService;
