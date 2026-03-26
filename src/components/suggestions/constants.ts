// src/components/suggestions/constants.ts
// Shared constants for the suggestions system

export const SYSTEM_MATCHMAKER_ID = 'system-matchmaker-neshamatech';

export const ACTIVE_PROCESS_STATUSES = [
  'FIRST_PARTY_APPROVED',
  'PENDING_SECOND_PARTY',
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
] as const;

export type ActiveProcessStatus = (typeof ACTIVE_PROCESS_STATUSES)[number];
