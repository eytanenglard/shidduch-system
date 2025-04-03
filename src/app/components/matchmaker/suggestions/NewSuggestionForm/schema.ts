import { z } from "zod";
import { addDays, isBefore } from 'date-fns';

// Validation rules

const MIN_DECISION_DAYS = 1;
const MAX_DECISION_DAYS = 30;

// Helper function to validate dates
const isValidDeadlineDate = (date: Date | null | undefined, minDays: number, maxDays: number) => {
  if (!date) return false;
  
  const today = new Date();
  const minDate = addDays(today, minDays);
  const maxDate = addDays(today, maxDays);
  
  return !isBefore(date, minDate) && !isBefore(maxDate, date);
};

// Schema for new suggestion
export const newSuggestionSchema = z.object({
  firstPartyId: z.string({
    required_error: "יש לבחור מועמד/ת ראשון/ה",
  }),
  
  secondPartyId: z.string({
    required_error: "יש לבחור מועמד/ת שני/ה",
  }),
  
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const, {
    required_error: "יש לבחור רמת עדיפות",
  }),

  status: z.enum([
    'DRAFT',
    'PENDING_FIRST_PARTY',
    'FIRST_PARTY_APPROVED',
    'FIRST_PARTY_DECLINED',
    'PENDING_SECOND_PARTY',
    'SECOND_PARTY_APPROVED',
    'SECOND_PARTY_DECLINED',
    'AWAITING_MATCHMAKER_APPROVAL',
    'CONTACT_DETAILS_SHARED',
    'AWAITING_FIRST_DATE_FEEDBACK',
    'THINKING_AFTER_DATE',
    'PROCEEDING_TO_SECOND_DATE',
    'ENDED_AFTER_FIRST_DATE',
    'MEETING_PENDING',
    'MEETING_SCHEDULED',
    'MATCH_APPROVED',
    'MATCH_DECLINED',
    'DATING',
    'ENGAGED',
    'MARRIED',
    'EXPIRED',
    'CLOSED',
    'CANCELLED'
  ] as const, {
    required_error: "יש לבחור סטטוס",
  }).default('DRAFT'),

  matchingReason: z.string()
    .max(500, "סיבת ההתאמה לא יכולה להכיל יותר מ-500 תווים")
    .optional(),

  internalNotes: z.string()
    .max(1000, "ההערות הפנימיות לא יכולות להכיל יותר מ-1000 תווים")
    .optional(),

  firstPartyNotes: z.string()
    .max(500, "ההערות לצד א' לא יכולות להכיל יותר מ-500 תווים")
    .optional(),

  secondPartyNotes: z.string()
    .max(500, "ההערות לצד ב' לא יכולות להכיל יותר מ-500 תווים")
    .optional(),


  decisionDeadline: z.date({
    required_error: "יש לבחור תאריך יעד להחלטה ",
  })
}).refine(
  (data) => data.firstPartyId !== data.secondPartyId,
  {
    message: "לא ניתן ליצור הצעה עבור אותו מועמד",
    path: ["secondPartyId"]
  }

).refine(
  (data) => isValidDeadlineDate(data.decisionDeadline, MIN_DECISION_DAYS, MAX_DECISION_DAYS),
  {
    message: `תאריך היעד להחלטה סופית חייב להיות בין ${MIN_DECISION_DAYS} ל-${MAX_DECISION_DAYS} ימים מהיום`,
    path: ["decisionDeadline"]
  }
);

export type NewSuggestionFormData = z.infer<typeof newSuggestionSchema>;

// Status mapping for display
export const suggestionStatusMap = {
  DRAFT: "טיוטה",
  PENDING_FIRST_PARTY: "ממתין לתשובת צד א'",
  FIRST_PARTY_APPROVED: "צד א' אישר",
  FIRST_PARTY_DECLINED: "צד א' דחה",
  PENDING_SECOND_PARTY: "ממתין לתשובת צד ב'",
  SECOND_PARTY_APPROVED: "צד ב' אישר",
  SECOND_PARTY_DECLINED: "צד ב' דחה",
  AWAITING_MATCHMAKER_APPROVAL: "ממתין לאישור שדכן",
  CONTACT_DETAILS_SHARED: "פרטי קשר הועברו",
  AWAITING_FIRST_DATE_FEEDBACK: "ממתין למשוב פגישה ראשונה",
  THINKING_AFTER_DATE: "בשלב מחשבה אחרי פגישה",
  PROCEEDING_TO_SECOND_DATE: "ממשיכים לפגישה שנייה",
  ENDED_AFTER_FIRST_DATE: "הסתיים אחרי פגישה ראשונה",
  MEETING_PENDING: "ממתין לקביעת פגישה",
  MEETING_SCHEDULED: "פגישה נקבעה",
  MATCH_APPROVED: "ההצעה אושרה",
  MATCH_DECLINED: "ההצעה נדחתה",
  DATING: "בתהליך היכרות",
  ENGAGED: "מאורסים",
  MARRIED: "נישאו",
  EXPIRED: "פג תוקף",
  CLOSED: "ההצעה נסגרה",
  CANCELLED: "ההצעה בוטלה"
} as const;

// Priority mapping for display
export const priorityMap = {
  LOW: { label: "נמוכה", color: "text-gray-500" },
  MEDIUM: { label: "רגילה", color: "text-blue-500" },
  HIGH: { label: "גבוהה", color: "text-yellow-500" },
  URGENT: { label: "דחופה", color: "text-red-500" }
} as const;