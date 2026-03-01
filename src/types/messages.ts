// FILENAME: src/types/messages.ts

import type { 
  User, 
  Profile, 
  AvailabilityInquiry as PrismaAvailabilityInquiry,
  SuggestionInquiry as PrismaSuggestionInquiry 
} from '@prisma/client';
import type { ExtendedMatchSuggestion } from '@/types/suggestions';

// 1. סוגי הפריטים האפשריים בפיד הפעילות המאוחד
export type FeedItemType =
  | 'NEW_SUGGESTION'          // הצעה חדשה שהתקבלה
  | 'ACTION_REQUIRED'         // נדרשת פעולה מהמשתמש (אישור/דחייה, מענה לשאלה)
  | 'STATUS_UPDATE'           // עדכון סטטוס כללי (למשל: הצד השני אישר)
  | 'MATCHMAKER_MESSAGE'      // שאלה חדשה שהתקבלה מהמשתמש או מהשדכן
  | 'INQUIRY_RESPONSE'        // תשובה מהשדכן לשאלה ספציפית
  | 'AVAILABILITY_INQUIRY';   // בקשת זמינות כללית

// 2. מבנה מורחב עבור "שאלת זמינות"
// (AvailabilityInquiry)
export interface ExtendedAvailabilityInquiry extends PrismaAvailabilityInquiry {
  matchmaker: {
    firstName: string;
    lastName: string;
  };
  firstParty: {
    firstName: string;
    lastName: string;
    profile: Profile | null;
  };
  secondParty: {
      firstName: string;
      lastName: string;
      profile: Profile | null;
  }
}

// 3. מבנה מורחב עבור "צ'אט על הצעה" - זה התיקון המרכזי
// (SuggestionInquiry)
export interface ExtendedSuggestionInquiry extends PrismaSuggestionInquiry {
    fromUser: Partial<User>;
    toUser: Partial<User>;
    suggestion: ExtendedMatchSuggestion;
}

// 4. המבנה האחיד של כל פריט בפיד הפעילויות
// זהו הטיפוס המרכזי שישמש את מרכז ההודעות
export interface FeedItem {
  id: string; // ID ייחודי של הפריט (יכול להיות ID של הצעה, שאילתה וכו')
  type: FeedItemType;
  title: string;
  description: string;
  timestamp: Date | string; // תאריך יכול להגיע כ-string מה-API
  isRead: boolean;
  link: string; // קישור לעמוד הרלוונטי
  payload: {
    // ה-payload מכיל את האובייקט המקורי המלא, מה שנותן גמישות לתצוגה
    suggestion?: ExtendedMatchSuggestion;
    suggestionInquiry?: ExtendedSuggestionInquiry;
    availabilityInquiry?: ExtendedAvailabilityInquiry;
  };
}

// 5. כינוי (alias) לשימוש כללי ברחבי האפליקציה
export type UnifiedMessage = FeedItem;

// 6. טיפוס לספירת ההתראות שיוצגו ב"פעמון"
export interface NotificationCount {
  availabilityRequests: number; // סופר בקשות זמינות
  messages: number;             // סופר הודעות צ'אט חדשות
  total: number;
}