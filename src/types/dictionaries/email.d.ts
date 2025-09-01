// src/types/dictionaries/email.d.ts

import { MatchSuggestionStatus } from '@prisma/client';

// ======================================================================== //
// ✨ טיפוסים עבור מודול ההתראות (Notifications) ✨
// מוגדרים כאן כדי להיות חלק ממודול ההודעות המאוחד
// ======================================================================== //

/**
 * מגדיר את המבנה של הודעת סטטוס בודדת (למשל, הצעה אושרה).
 */
type SuggestionStatusNotificationDict = {
  subject: string;
  body: string;      // טקסט פשוט עבור SMS/WhatsApp
  htmlBody: string;  // HTML מעוצב עבור מיילים
};

/**
 * מגדיר את המבנה של כל מילון ההתראות.
 */
type NotificationDictionary = {
  customMessage: {
    subject: string;
    // ============================ התיקון כאן ============================
    reminderText: string; // הוספת שדה זה כדי להתאים לקבצי ה-JSON
    // =====================================================================
  };
  suggestionStatusChange: Partial<Record<MatchSuggestionStatus, SuggestionStatusNotificationDict>>;
};

// ======================================================================== //
// ✨ טיפוסים עבור תבניות המיילים (Email Templates) ✨
// ======================================================================== //

/**
 * טיפוס בסיסי המגדיר את המאפיינים המשותפים לכל תבניות המייל.
 */
type EmailTemplateContent = {
  subject: string;
  title: string;
  // מאפשר הוספת שדות נוספים וגמישים לכל תבנית
  [key: string]: string;
};

// ======================================================================== //
// ✨ הטיפוס הראשי והמאוחד: EmailDictionary ✨
// מרכז את כל הטקסטים למיילים ולהתראות תחת אובייקט אחד.
// ======================================================================== //

export type EmailDictionary = {
  /**
   * טקסטים משותפים לכל המיילים.
   */
  shared: {
    greeting: string;
    closing: string;
    team: string;
    supportPrompt: string;
    rightsReserved: string;
  };

  /**
   * תבניות מייל ספציפיות.
   * כל תבנית יורשת את המאפיינים הבסיסיים ומוסיפה את שלה.
   */
  welcome: EmailTemplateContent & { matchmakerAssigned: string; getStarted: string; dashboardButton: string; };
  accountSetup: EmailTemplateContent & { intro: string; actionPrompt: string; actionButton: string; notice: string; nextStep: string; };
  emailOtpVerification: EmailTemplateContent & { intro: string; codeInstruction: string; expiryNotice: string; securityNote: string; };
  invitation: EmailTemplateContent & { intro: string; actionPrompt: string; actionButton: string; expiryNotice: string; };
suggestion: EmailTemplateContent & { 
  intro: string; 
  previewTitle: string; 
  actionPrompt: string; 
  actionButton: string; 
  closing: string; 
  details: {
    age: string;
    city: string;
    occupation: string;
    additionalInfo: string;
  };
};  shareContactDetails: EmailTemplateContent & { intro: string; detailsOf: string; tipTitle: string; tipContent: string; goodLuck: string; };
  availabilityCheck: EmailTemplateContent & { intro: string; actionPrompt: string; actionButton: string; noticeTitle: string; noticeContent: string; };
  passwordResetOtp: EmailTemplateContent & { intro: string; codeInstruction: string; expiryNotice: string; securityNote: string; };
  passwordChangedConfirmation: EmailTemplateContent & { intro: string; securityNote: string; actionButton: string; };
  
  /**
   * מילון ההתראות, מקונן כאן כחלק מהמודול המאוחד.
   */
  notifications: NotificationDictionary;
};