// src/types/dictionaries/email.d.ts

import { MatchSuggestionStatus } from '@prisma/client';

// ======================================================================== //
// ✨ טיפוסים עבור מודול ההתראות (Notifications) - ללא שינוי ✨
// ======================================================================== //

type SuggestionStatusNotificationDict = {
  subject: string;
  body: string;
  htmlBody: string;
};

type NotificationDictionary = {
  customMessage: {
    subject: string;
    reminderText: string;
  };
  suggestionStatusChange: Partial<Record<MatchSuggestionStatus, SuggestionStatusNotificationDict>>;
};

// ======================================================================== //
// ✨ טיפוסים עבור תבניות המיילים (Email Templates) - ללא שינוי ✨
// ======================================================================== //

type EmailTemplateContent = {
  subject: string;
  title: string;
  [key: string]: string | Record<string, string>; 
};

type ProfileFeedbackEmailDict = EmailTemplateContent & {
  greeting: string;
  matchmakerIntro: string;
  systemIntro: string;
  progressHeader: string;
  aiSummaryHeader: string;
  aiSummary: {
    personalityTitle: string;
    lookingForTitle: string;
  };
  missingItemsHeader: string;
  missingProfileItemsTitle: string;
  missingQuestionnaireItemsTitle: string;
  cta: {
    title: string;
    button: string;
  };
};


// ======================================================================== //
// ✨ טיפוסים עבור מערכת ה-Engagement - *** כאן נמצאים העדכונים *** ✨
// ======================================================================== //

/**
 * תבנית בסיסית למייל מעורבות (Engagement).
 */
type EngagementTemplate = {
  subject: string;
  hook: string;
  mainMessage: string;
  specificAction?: string;
  encouragement: string;
};

/**
 * תבנית ייעודית למייל הפתיחה (יום 1), הכוללת מסר מיוחד למשתמשים מהירים.
 */
type OnboardingDay1Template = EngagementTemplate & {
  fastUserMainMessage?: string;
};

/**
 * תבנית ייעודית למייל הטיזר של ה-AI, הכוללת טקסטים לתובנה ספציפית או גנרית.
 */
type AiTeaserTemplate = EngagementTemplate & {
  aiInsight: string;      // "לדוגמה, המערכת מזהה בך..."
  genericInsight: string; // "המערכת שלנו כבר לומדת אותך..."
};

/**
 * תבנית ייעודית למייל הערך המוסף, הכוללת טיפים מה-AI.
 */
type ValueAddTemplate = EngagementTemplate & {
  aiTip: string;      // "למשל, ה-AI מציע..."
  genericTip: string; // "למשל, נסה לשלב..."
};

/**
 * תבנית למיילים הנותנים ערך כללי (מערך של נושאים).
 */
type ValueEmailTemplate = Array<{
  subject: string;
  hook: string;
  mainMessage: string;
  encouragement: string;
}>;

/**
 * תבנית למייל הפידבק היומי בערב.
 */
type EveningFeedbackTemplate = EngagementTemplate & {
  systemSummary: string;
};

/**
 * מרכז את כל תבניות המייל של מערכת ה-Engagement.
 * זהו האובייקט המעודכן והמורחב.
 */
type EngagementEmailDict = {
  // --- מיילים חדשים בקמפיין ---
  onboardingDay1: OnboardingDay1Template;
  onboardingPhotos: EngagementTemplate;
  onboardingAiTeaser: AiTeaserTemplate;
  onboardingQuestionnaireWhy: EngagementTemplate;
  onboardingValueAdd: ValueAddTemplate;

  // --- מיילים ותיקים שנשארים ---
  photoNudge: EngagementTemplate;
  questionnaireNudge: EngagementTemplate;
  almostDone: EngagementTemplate;
  reEngagement: EngagementTemplate;
  aiSummary: EngagementTemplate;
  eveningFeedback: EveningFeedbackTemplate;
  value: ValueEmailTemplate;

  // --- מיילים שהוצאו משימוש (הוחלפו בלוגיקה החדשה) ---
  // onboardingDay3: EngagementTemplate; // הוחלף ב-onboardingAiTeaser ו-onboardingQuestionnaireWhy
  // onboardingDay7_Insight: EngagementTemplate; // הוחלף ב-onboardingValueAdd
};


// ======================================================================== //
// ✨ הטיפוס הראשי והמאוחד: EmailDictionary ✨
// ======================================================================== //

export type EmailDictionary = {
  engagement: EngagementEmailDict;

  shared: {
    greeting: string;
    closing: string;
    team: string;
    supportPrompt: string;
    rightsReserved: string;
  };

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
    details: { age: string; city: string; occupation: string; additionalInfo: string; };
  };
  shareContactDetails: EmailTemplateContent & { intro: string; detailsOf: string; tipTitle: string; tipContent: string; goodLuck: string; };
  availabilityCheck: EmailTemplateContent & { intro: string; actionPrompt: string; actionButton: string; noticeTitle: string; noticeContent: string; };
  passwordResetOtp: EmailTemplateContent & { intro: string; codeInstruction: string; expiryNotice: string; securityNote: string; };
  passwordChangedConfirmation: EmailTemplateContent & { intro: string; securityNote: string; actionButton: string; };
  profileFeedback: ProfileFeedbackEmailDict;
profileSummaryUpdate: { 
    subject: string; 
    title: string; 
    introMatchmaker: string; 
    introSystem: string; 
    highlight: string; 
    encouragement: string; 
    actionButton: string; 
};
  notifications: NotificationDictionary;
};