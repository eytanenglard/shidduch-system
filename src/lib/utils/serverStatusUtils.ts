// src/lib/utils/serverStatusUtils.ts

import type { MatchSuggestionStatus } from "@prisma/client";

export interface ServerStatusInfo {
  requiresUserAction: boolean;
  currentParty: "first" | "second" | "matchmaker" | "both" | "none";
  isUrgent: boolean;
  priority: "low" | "medium" | "high" | "critical";
  category: "draft" | "pending" | "approved" | "declined" | "progress" | "completed";
}

/**
 * מחזיר מידע על סטטוס ההצעה מצד השרת
 */
export function getServerStatusInfo(
  status: MatchSuggestionStatus,
  firstPartyId: string,
  secondPartyId: string,
  currentUserId?: string
): ServerStatusInfo {
  const isFirstParty = currentUserId === firstPartyId;
  const isSecondParty = currentUserId === secondPartyId;
  
  const statusMap: Record<MatchSuggestionStatus, ServerStatusInfo> = {
    DRAFT: {
      requiresUserAction: false,
      currentParty: "matchmaker",
      isUrgent: false,
      priority: "medium",
      category: "draft"
    },
    
    PENDING_FIRST_PARTY: {
      requiresUserAction: isFirstParty,
      currentParty: "first",
      isUrgent: true,
      priority: isFirstParty ? "critical" : "medium",
      category: "pending"
    },
    
    FIRST_PARTY_APPROVED: {
      requiresUserAction: false,
      currentParty: "matchmaker",
      isUrgent: false,
      priority: "medium",
      category: "approved"
    },
    
    FIRST_PARTY_DECLINED: {
      requiresUserAction: false,
      currentParty: "none",
      isUrgent: false,
      priority: "low",
      category: "declined"
    },
    
    PENDING_SECOND_PARTY: {
      requiresUserAction: isSecondParty,
      currentParty: "second",
      isUrgent: true,
      priority: isSecondParty ? "critical" : "medium",
      category: "pending"
    },
    
    SECOND_PARTY_APPROVED: {
      requiresUserAction: false,
      currentParty: "matchmaker",
      isUrgent: true,
      priority: "high",
      category: "approved"
    },
    
    SECOND_PARTY_DECLINED: {
      requiresUserAction: false,
      currentParty: "none",
      isUrgent: false,
      priority: "low",
      category: "declined"
    },
    
    AWAITING_MATCHMAKER_APPROVAL: {
      requiresUserAction: false,
      currentParty: "matchmaker",
      isUrgent: true,
      priority: "high",
      category: "pending"
    },
    
    CONTACT_DETAILS_SHARED: {
      requiresUserAction: true,
      currentParty: "both",
      isUrgent: true,
      priority: "high",
      category: "progress"
    },
    
    AWAITING_FIRST_DATE_FEEDBACK: {
      requiresUserAction: true,
      currentParty: "both",
      isUrgent: false,
      priority: "medium",
      category: "pending"
    },
    
    THINKING_AFTER_DATE: {
      requiresUserAction: false,
      currentParty: "both",
      isUrgent: false,
      priority: "medium",
      category: "pending"
    },
    
    PROCEEDING_TO_SECOND_DATE: {
      requiresUserAction: true,
      currentParty: "both",
      isUrgent: false,
      priority: "medium",
      category: "progress"
    },
    
    ENDED_AFTER_FIRST_DATE: {
      requiresUserAction: false,
      currentParty: "none",
      isUrgent: false,
      priority: "low",
      category: "completed"
    },
    
    MEETING_PENDING: {
      requiresUserAction: false,
      currentParty: "matchmaker",
      isUrgent: true,
      priority: "high",
      category: "pending"
    },
    
    MEETING_SCHEDULED: {
      requiresUserAction: true,
      currentParty: "both",
      isUrgent: true,
      priority: "high",
      category: "progress"
    },
    
    MATCH_APPROVED: {
      requiresUserAction: false,
      currentParty: "both",
      isUrgent: false,
      priority: "high",
      category: "approved"
    },
    
    MATCH_DECLINED: {
      requiresUserAction: false,
      currentParty: "none",
      isUrgent: false,
      priority: "low",
      category: "declined"
    },
    
    DATING: {
      requiresUserAction: false,
      currentParty: "both",
      isUrgent: false,
      priority: "medium",
      category: "progress"
    },
    
    ENGAGED: {
      requiresUserAction: false,
      currentParty: "both",
      isUrgent: false,
      priority: "low",
      category: "completed"
    },
    
    MARRIED: {
      requiresUserAction: false,
      currentParty: "both",
      isUrgent: false,
      priority: "low",
      category: "completed"
    },
    
    EXPIRED: {
      requiresUserAction: false,
      currentParty: "none",
      isUrgent: false,
      priority: "low",
      category: "completed"
    },
    
    CLOSED: {
      requiresUserAction: false,
      currentParty: "none",
      isUrgent: false,
      priority: "low",
      category: "completed"
    },
    
    CANCELLED: {
      requiresUserAction: false,
      currentParty: "none",
      isUrgent: false,
      priority: "low",
      category: "completed"
    }
  };

  return statusMap[status];
}

/**
 * מחזיר רשימת הצעות שדורשות תשומת לב של המשתמש
 */
export function getUrgentSuggestions<T extends { 
  status: MatchSuggestionStatus; 
  firstPartyId: string; 
  secondPartyId: string;
  decisionDeadline?: Date | null;
}>(
  suggestions: T[],
  userId: string
): T[] {
  return suggestions.filter(suggestion => {
    const statusInfo = getServerStatusInfo(
      suggestion.status,
      suggestion.firstPartyId,
      suggestion.secondPartyId,
      userId
    );
    
    // בדיקה אם המשתמש צריך לפעול
    if (!statusInfo.requiresUserAction) return false;
    
    // בדיקה אם יש דדליין קרוב
    if (suggestion.decisionDeadline) {
      const deadline = new Date(suggestion.decisionDeadline);
      const now = new Date();
      const daysUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      
      // אם יש פחות מ-3 ימים, זה דחוף
      if (daysUntilDeadline <= 3) return true;
    }
    
    return statusInfo.isUrgent;
  });
}

/**
 * מחזיר רשימת הצעות לפי קטגוריה
 */
export function getSuggestionsByCategory<T extends { 
  status: MatchSuggestionStatus; 
  firstPartyId: string; 
  secondPartyId: string;
}>(
  suggestions: T[],
  category: ServerStatusInfo['category'],
  userId?: string
): T[] {
  return suggestions.filter(suggestion => {
    const statusInfo = getServerStatusInfo(
      suggestion.status,
      suggestion.firstPartyId,
      suggestion.secondPartyId,
      userId
    );
    return statusInfo.category === category;
  });
}

/**
 * מחשב נתונים סטטיסטיים על הצעות המשתמש
 */
export function calculateUserStats<T extends { 
  status: MatchSuggestionStatus; 
  firstPartyId: string; 
  secondPartyId: string;
  decisionDeadline?: Date | null;
}>(
  suggestions: T[],
  userId: string
) {
  const urgent = getUrgentSuggestions(suggestions, userId);
  const pending = getSuggestionsByCategory(suggestions, 'pending', userId);
  const approved = getSuggestionsByCategory(suggestions, 'approved', userId);
  const progress = getSuggestionsByCategory(suggestions, 'progress', userId);
  const completed = getSuggestionsByCategory(suggestions, 'completed', userId);
  
  // ספירת הצעות שדורשות תשובה מהמשתמש ספציפית
  const requiresMyAction = suggestions.filter(suggestion => {
    const statusInfo = getServerStatusInfo(
      suggestion.status,
      suggestion.firstPartyId,
      suggestion.secondPartyId,
      userId
    );
    return statusInfo.requiresUserAction;
  });

  return {
    total: suggestions.length,
    urgent: urgent.length,
    pending: pending.length,
    approved: approved.length,
    progress: progress.length,
    completed: completed.length,
    requiresMyAction: requiresMyAction.length,
    categories: {
      urgent,
      pending,
      approved,
      progress,
      completed,
      requiresMyAction
    }
  };
}

/**
 * בודק אם משתמש נמצא בתהליך פעיל (מונע יצירת הצעות חדשות)
 */
export function isUserInActiveProcess<T extends { 
  status: MatchSuggestionStatus; 
  firstPartyId: string; 
  secondPartyId: string;
}>(
  suggestions: T[],
  userId: string
): boolean {
  const activeStatuses: MatchSuggestionStatus[] = [
    'FIRST_PARTY_APPROVED',
    'SECOND_PARTY_APPROVED',
    'AWAITING_MATCHMAKER_APPROVAL',
    'CONTACT_DETAILS_SHARED',
    'AWAITING_FIRST_DATE_FEEDBACK',
    'THINKING_AFTER_DATE',
    'PROCEEDING_TO_SECOND_DATE',
    'MEETING_PENDING',
    'MEETING_SCHEDULED',
    'MATCH_APPROVED',
    'DATING',
    'ENGAGED',
  ];

  return suggestions.some(suggestion => 
    (suggestion.firstPartyId === userId || suggestion.secondPartyId === userId) &&
    activeStatuses.includes(suggestion.status)
  );
}

/**
 * מחזיר הודעת סטטוס מותאמת למשתמש
 */
export function getPersonalizedStatusMessage(
  status: MatchSuggestionStatus,
  isFirstParty: boolean,
  targetPartyName?: string
): string {
  const messages: Record<MatchSuggestionStatus, { first: string; second: string }> = {
    PENDING_FIRST_PARTY: {
      first: "ההצעה מחכה להחלטתך - בדוק ותחליט",
      second: `ההצעה נשלחה לצד הראשון${targetPartyName ? ` (${targetPartyName})` : ''} - נעדכן אותך כשיגיע המשוב`
    },
    FIRST_PARTY_APPROVED: {
      first: "אישרת את ההצעה - עכשיו ההצעה תשלח לצד השני",
      second: `הצד הראשון${targetPartyName ? ` (${targetPartyName})` : ''} אישר את ההצעה! עכשיו התור שלך`
    },
    PENDING_SECOND_PARTY: {
      first: `ההצעה נשלחה לצד השני${targetPartyName ? ` (${targetPartyName})` : ''} - נעדכן אותך כשיגיע המשוב`,
      second: "ההצעה מחכה להחלטתך - בדוק ותחליט"
    },
    SECOND_PARTY_APPROVED: {
      first: `הצד השני${targetPartyName ? ` (${targetPartyName})` : ''} גם אישר! בקרוב תקבלו פרטי קשר`,
      second: "אישרת את ההצעה - בקרוב תקבלו פרטי קשר"
    },
    CONTACT_DETAILS_SHARED: {
      first: "פרטי הקשר שותפו - זמן ליצור קשר ולתאם פגישה!",
      second: "פרטי הקשר שותפו - זמן ליצור קשר ולתאם פגישה!"
    },
    DATING: {
      first: "אתם בתהליך היכרות - בהצלחה!",
      second: "אתם בתהליך היכרות - בהצלחה!"
    },
    ENGAGED: {
      first: "מזל טוב על האירוסין! 💍",
      second: "מזל טוב על האירוסין! 💍"
    },
    MARRIED: {
      first: "מזל טוב על החתונה! 🎉",
      second: "מזל טוב על החתונה! 🎉"
    },
    // Default cases for other statuses
    DRAFT: {
      first: "ההצעה בהכנה",
      second: "ההצעה בהכנה"
    },
    FIRST_PARTY_DECLINED: {
      first: "דחית את ההצעה",
      second: "הצד הראשון דחה את ההצעה"
    },
    SECOND_PARTY_DECLINED: {
      first: "הצד השני דחה את ההצעה",
      second: "דחית את ההצעה"
    },
    AWAITING_MATCHMAKER_APPROVAL: {
      first: "ממתין לאישור השדכן",
      second: "ממתין לאישור השדכן"
    },
    AWAITING_FIRST_DATE_FEEDBACK: {
      first: "ממתין למשוב פגישה",
      second: "ממתין למשוב פגישה"
    },
    THINKING_AFTER_DATE: {
      first: "בחשיבה לאחר הפגישה",
      second: "בחשיבה לאחר הפגישה"
    },
    PROCEEDING_TO_SECOND_DATE: {
      first: "ממשיכים לפגישה שנייה",
      second: "ממשיכים לפגישה שנייה"
    },
    ENDED_AFTER_FIRST_DATE: {
      first: "הסתיים לאחר פגישה ראשונה",
      second: "הסתיים לאחר פגישה ראשונה"
    },
    MEETING_PENDING: {
      first: "פגישה בהמתנה",
      second: "פגישה בהמתנה"
    },
    MEETING_SCHEDULED: {
      first: "פגישה קבועה",
      second: "פגישה קבועה"
    },
    MATCH_APPROVED: {
      first: "השידוך אושר",
      second: "השידוך אושר"
    },
    MATCH_DECLINED: {
      first: "השידוך נדחה",
      second: "השידוך נדחה"
    },
    EXPIRED: {
      first: "פג תוקף",
      second: "פג תוקף"
    },
    CLOSED: {
      first: "ההצעה נסגרה",
      second: "ההצעה נסגרה"
    },
    CANCELLED: {
      first: "ההצעה בוטלה",
      second: "ההצעה בוטלה"
    }
  };

  const defaultMessage = {
    first: "עקוב אחר התקדמות ההצעה בטיימליין",
    second: "עקוב אחר התקדמות ההצעה בטיימליין"
  };

  const statusMessages = messages[status] || defaultMessage;
  return isFirstParty ? statusMessages.first : statusMessages.second;
}