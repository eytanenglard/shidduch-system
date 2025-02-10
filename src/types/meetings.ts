import { Meeting,  Prisma } from '@prisma/client';

// טיפוס בסיסי למשוב שתואם את המבנה ב-Prisma
export type MeetingFeedback = Prisma.JsonObject & {
  content: string;
  rating?: number;
  continueInterest: boolean;
  nextMeetingScheduled?: boolean;
  privateNotes?: string;
};

// הרחבת טיפוס הפגישה
export interface ExtendedMeeting extends Meeting {
  firstPartyFeedback: MeetingFeedback | null;
  secondPartyFeedback: MeetingFeedback | null;
}

