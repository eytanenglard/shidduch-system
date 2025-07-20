// src/types/messages.ts
import { AvailabilityInquiry, Profile} from '@prisma/client';

import type { ExtendedMatchSuggestion } from "@/app/components/suggestions/types";

// סוגי האירועים/הודעות האפשריים בפיד
export type FeedItemType =
  | 'NEW_SUGGESTION'          // הצעה חדשה שהתקבלה
  | 'ACTION_REQUIRED'         // נדרשת פעולה מהמשתמש (אישור/דחייה)
  | 'STATUS_UPDATE'           // עדכון סטטוס (הצד השני אישר, פרטי קשר שותפו)
  | 'MATCHMAKER_MESSAGE'      // הודעה ישירה מהשדכן (למימוש עתידי)
  | 'INQUIRY_RESPONSE'        // תשובה מהשדכן לשאלה
  | 'AVAILABILITY_INQUIRY';   // <--- התיקון נמצא כאן

// המבנה האחיד של פריט בפיד
export interface FeedItem {
  id: string; // ישתמש ב-ID של ההצעה או הפנייה
  type: FeedItemType;
  title: string;
  description: string;
  timestamp: Date;
  isRead: boolean;
  link: string; // קישור לעמוד הרלוונטי (לרוב, עמוד ההצעות)
  payload: {
    suggestion?: ExtendedMatchSuggestion;
    // ניתן להוסיף כאן סוגי payload נוספים בעתיד
    // availabilityInquiry?: ExtendedInquiry;
  };
}
// ... (הטיפוסים הקיימים: FeedItemType, FeedItem)

// --- הוסף את הטיפוס הזה לקובץ ---
export interface NotificationCount {
  availabilityRequests: number; // Represents action_required count now
  messages: number; // For future unread messages
  total: number;
}


export interface ExtendedInquiry extends AvailabilityInquiry {
    matchmaker: {
      firstName: string;
      lastName: string;
    };
    firstParty: {
      firstName: string;
      lastName: string;
      email: string;
      profile: Profile | null;
    };
  }
