// StatusTransitionLogic.ts
// Pure logic - no server dependencies, safe for client-side use

import { MatchSuggestionStatus } from "@prisma/client";

// ═══════════════════════════════════════════════════════════
// Types (exported for use by both client and server)
// ═══════════════════════════════════════════════════════════

type UserWithProfile = {
  id: string;
  firstName: string;
  lastName: string;
  profile: Record<string, unknown> | null;
};

export type SuggestionWithParties = {
  id: string;
  status: MatchSuggestionStatus;
  firstPartyId: string;
  secondPartyId: string;
  matchmakerId: string;
  firstParty: UserWithProfile;
  secondParty: UserWithProfile;
  matchmaker: { id: string; firstName: string; lastName: string };
  [key: string]: unknown;
};

// ═══════════════════════════════════════════════════════════
// Valid Transitions Map
// ═══════════════════════════════════════════════════════════

const VALID_TRANSITIONS: Record<MatchSuggestionStatus, MatchSuggestionStatus[]> = {
  DRAFT: [MatchSuggestionStatus.PENDING_FIRST_PARTY],
  PENDING_FIRST_PARTY: [
    MatchSuggestionStatus.FIRST_PARTY_APPROVED,
    MatchSuggestionStatus.FIRST_PARTY_DECLINED,
    MatchSuggestionStatus.FIRST_PARTY_INTERESTED,
    MatchSuggestionStatus.CANCELLED
  ],
  FIRST_PARTY_INTERESTED: [
    MatchSuggestionStatus.FIRST_PARTY_APPROVED,
    MatchSuggestionStatus.FIRST_PARTY_DECLINED,
    MatchSuggestionStatus.CANCELLED
  ],
  FIRST_PARTY_APPROVED: [
    MatchSuggestionStatus.PENDING_SECOND_PARTY,
    MatchSuggestionStatus.PENDING_FIRST_PARTY,  // grace period withdrawal
    MatchSuggestionStatus.FIRST_PARTY_DECLINED,  // withdrawal before second party
    MatchSuggestionStatus.CANCELLED
  ],
  FIRST_PARTY_DECLINED: [
    MatchSuggestionStatus.CLOSED
  ],
  PENDING_SECOND_PARTY: [
    MatchSuggestionStatus.SECOND_PARTY_APPROVED,
    MatchSuggestionStatus.SECOND_PARTY_DECLINED,
    MatchSuggestionStatus.SECOND_PARTY_NOT_AVAILABLE,
    MatchSuggestionStatus.CANCELLED
  ],
  SECOND_PARTY_NOT_AVAILABLE: [
    MatchSuggestionStatus.PENDING_SECOND_PARTY,
    MatchSuggestionStatus.CANCELLED,
    MatchSuggestionStatus.CLOSED
  ],
  SECOND_PARTY_APPROVED: [
    MatchSuggestionStatus.CONTACT_DETAILS_SHARED,
    MatchSuggestionStatus.RE_OFFERED_TO_FIRST_PARTY,
    MatchSuggestionStatus.CANCELLED
  ],
  RE_OFFERED_TO_FIRST_PARTY: [
    MatchSuggestionStatus.FIRST_PARTY_APPROVED,
    MatchSuggestionStatus.AWAITING_MATCHMAKER_APPROVAL,
    MatchSuggestionStatus.FIRST_PARTY_DECLINED,
    MatchSuggestionStatus.CANCELLED
  ],
  SECOND_PARTY_DECLINED: [
    MatchSuggestionStatus.CLOSED
  ],
  AWAITING_MATCHMAKER_APPROVAL: [
    MatchSuggestionStatus.CONTACT_DETAILS_SHARED,
    MatchSuggestionStatus.CANCELLED
  ],
  CONTACT_DETAILS_SHARED: [
    MatchSuggestionStatus.MEETING_SCHEDULED,
    MatchSuggestionStatus.AWAITING_FIRST_DATE_FEEDBACK,
    MatchSuggestionStatus.CANCELLED
  ],
  AWAITING_FIRST_DATE_FEEDBACK: [
    MatchSuggestionStatus.THINKING_AFTER_DATE,
    MatchSuggestionStatus.ENDED_AFTER_FIRST_DATE,
    MatchSuggestionStatus.CANCELLED
  ],
  THINKING_AFTER_DATE: [
    MatchSuggestionStatus.PROCEEDING_TO_SECOND_DATE,
    MatchSuggestionStatus.ENDED_AFTER_FIRST_DATE,
    MatchSuggestionStatus.CANCELLED
  ],
  MEETING_SCHEDULED: [
    MatchSuggestionStatus.AWAITING_FIRST_DATE_FEEDBACK,
    MatchSuggestionStatus.DATING,
    MatchSuggestionStatus.CANCELLED
  ],
  PROCEEDING_TO_SECOND_DATE: [
    MatchSuggestionStatus.DATING,
    MatchSuggestionStatus.CANCELLED
  ],
  ENDED_AFTER_FIRST_DATE: [
    MatchSuggestionStatus.CLOSED
  ],
  MEETING_PENDING: [
    MatchSuggestionStatus.MEETING_SCHEDULED,
    MatchSuggestionStatus.CANCELLED
  ],
  MATCH_APPROVED: [
    MatchSuggestionStatus.DATING,
    MatchSuggestionStatus.CANCELLED
  ],
  MATCH_DECLINED: [
    MatchSuggestionStatus.CLOSED
  ],
  DATING: [
    MatchSuggestionStatus.ENGAGED,
    MatchSuggestionStatus.CLOSED,
    MatchSuggestionStatus.CANCELLED
  ],
  ENGAGED: [
    MatchSuggestionStatus.MARRIED,
    MatchSuggestionStatus.CANCELLED
  ],
  MARRIED: [],
  EXPIRED: [],
  CLOSED: [],
  CANCELLED: []
};

// ═══════════════════════════════════════════════════════════
// Pure Functions
// ═══════════════════════════════════════════════════════════

export function validateStatusTransition(
  currentStatus: MatchSuggestionStatus,
  newStatus: MatchSuggestionStatus
): void {
  if (!VALID_TRANSITIONS[currentStatus]?.includes(newStatus)) {
    throw new Error(
      `Invalid status transition from ${currentStatus} to ${newStatus}. ` +
      `Valid transitions are: ${VALID_TRANSITIONS[currentStatus]?.join(', ') || 'none'}`
    );
  }
}

export function getStatusLabel(status: MatchSuggestionStatus): string {
  const statusLabels: Record<MatchSuggestionStatus, string> = {
    DRAFT: "טיוטה",
    PENDING_FIRST_PARTY: "ממתין לתשובת הצד הראשון",
    FIRST_PARTY_APPROVED: "הצד הראשון אישר",
    FIRST_PARTY_DECLINED: "הצד הראשון דחה",
    FIRST_PARTY_INTERESTED: "הצד הראשון שמר לגיבוי",
    PENDING_SECOND_PARTY: "ממתין לתשובת הצד השני",
    SECOND_PARTY_APPROVED: "הצד השני אישר",
    SECOND_PARTY_NOT_AVAILABLE: "הצד השני לא זמין כרגע",
    RE_OFFERED_TO_FIRST_PARTY: "ממתין לאישור מחדש מצד ראשון",
    SECOND_PARTY_DECLINED: "הצד השני דחה",
    AWAITING_MATCHMAKER_APPROVAL: "ממתין לאישור השדכן",
    CONTACT_DETAILS_SHARED: "פרטי קשר שותפו",
    AWAITING_FIRST_DATE_FEEDBACK: "ממתין למשוב פגישה ראשונה",
    THINKING_AFTER_DATE: "בחשיבה לאחר הפגישה",
    PROCEEDING_TO_SECOND_DATE: "התקדמות לפגישה שנייה",
    ENDED_AFTER_FIRST_DATE: "הסתיים לאחר פגישה ראשונה",
    MEETING_PENDING: "פגישה בהמתנה",
    MEETING_SCHEDULED: "פגישה קבועה",
    MATCH_APPROVED: "השידוך אושר",
    MATCH_DECLINED: "השידוך נדחה",
    DATING: "בתהליך היכרות",
    ENGAGED: "אירוסין",
    MARRIED: "נישואין",
    CANCELLED: "בוטל",
    CLOSED: "נסגר",
    EXPIRED: "פג תוקף"
  };
  return statusLabels[status] || status;
}

export function getAvailableActions(
  suggestion: SuggestionWithParties,
  userId: string
): { id: string; label: string; nextStatus: MatchSuggestionStatus }[] {
  const isFirstParty = suggestion.firstPartyId === userId;
  const isSecondParty = suggestion.secondPartyId === userId;
  const isMatchmaker = suggestion.matchmakerId === userId;

  const actions: Record<MatchSuggestionStatus, {
    firstParty?: { id: string; label: string; nextStatus: MatchSuggestionStatus }[];
    secondParty?: { id: string; label: string; nextStatus: MatchSuggestionStatus }[];
    matchmaker?: { id: string; label: string; nextStatus: MatchSuggestionStatus }[];
  }> = {
    DRAFT: { matchmaker: [{ id: "send-to-first", label: "שליחה לצד הראשון", nextStatus: MatchSuggestionStatus.PENDING_FIRST_PARTY }] },
    PENDING_FIRST_PARTY: {
      firstParty: [
        { id: "approve", label: "אישור ההצעה", nextStatus: MatchSuggestionStatus.FIRST_PARTY_APPROVED },
        { id: "decline", label: "דחיית ההצעה", nextStatus: MatchSuggestionStatus.FIRST_PARTY_DECLINED }
      ],
      matchmaker: [{ id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }]
    },
    FIRST_PARTY_APPROVED: {
      firstParty: [
        { id: "withdraw", label: "ביטול אישור", nextStatus: MatchSuggestionStatus.FIRST_PARTY_DECLINED }
      ],
      matchmaker: [
        { id: "send-to-second", label: "שליחה לצד השני", nextStatus: MatchSuggestionStatus.PENDING_SECOND_PARTY },
        { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }
      ]
    },
    FIRST_PARTY_DECLINED: { matchmaker: [{ id: "close", label: "סגירת הצעה", nextStatus: MatchSuggestionStatus.CLOSED }] },
    FIRST_PARTY_INTERESTED: {
      firstParty: [
        { id: "approve", label: "אישור ההצעה", nextStatus: MatchSuggestionStatus.FIRST_PARTY_APPROVED },
        { id: "decline", label: "הסרה מרשימת ההמתנה", nextStatus: MatchSuggestionStatus.FIRST_PARTY_DECLINED }
      ],
      matchmaker: [{ id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }]
    },
    PENDING_SECOND_PARTY: {
      secondParty: [
        { id: "approve", label: "אישור ההצעה", nextStatus: MatchSuggestionStatus.SECOND_PARTY_APPROVED },
        { id: "decline", label: "דחיית ההצעה", nextStatus: MatchSuggestionStatus.SECOND_PARTY_DECLINED }
      ],
      matchmaker: [{ id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }]
    },
    SECOND_PARTY_NOT_AVAILABLE: {
      secondParty: [
        { id: "now-available", label: "חזרתי להיות זמין/ה", nextStatus: MatchSuggestionStatus.PENDING_SECOND_PARTY }
      ],
      matchmaker: [
        { id: "mark-available", label: "צד שני חזר להיות זמין", nextStatus: MatchSuggestionStatus.PENDING_SECOND_PARTY },
        { id: "close", label: "סגירת הצעה", nextStatus: MatchSuggestionStatus.CLOSED },
        { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }
      ]
    },
    SECOND_PARTY_APPROVED: {
      matchmaker: [
        { id: "share-contacts", label: "שיתוף פרטי קשר", nextStatus: MatchSuggestionStatus.CONTACT_DETAILS_SHARED },
        { id: "re-offer-first", label: "שליחה מחדש לצד ראשון", nextStatus: MatchSuggestionStatus.RE_OFFERED_TO_FIRST_PARTY },
        { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }
      ]
    },
    RE_OFFERED_TO_FIRST_PARTY: {
      firstParty: [
        { id: "approve", label: "אישור ההצעה", nextStatus: MatchSuggestionStatus.AWAITING_MATCHMAKER_APPROVAL },
        { id: "decline", label: "דחיית ההצעה", nextStatus: MatchSuggestionStatus.FIRST_PARTY_DECLINED }
      ],
      matchmaker: [{ id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }]
    },
    SECOND_PARTY_DECLINED: { matchmaker: [{ id: "close", label: "סגירת הצעה", nextStatus: MatchSuggestionStatus.CLOSED }] },
    AWAITING_MATCHMAKER_APPROVAL: {
      matchmaker: [
        { id: "approve-share", label: "אישור שיתוף פרטים", nextStatus: MatchSuggestionStatus.CONTACT_DETAILS_SHARED },
        { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }
      ]
    },
    CONTACT_DETAILS_SHARED: {
      firstParty: [
        { id: "date-scheduled", label: "נקבע דייט ראשון", nextStatus: MatchSuggestionStatus.MEETING_SCHEDULED },
        { id: "provide-feedback", label: "היה דייט ראשון", nextStatus: MatchSuggestionStatus.AWAITING_FIRST_DATE_FEEDBACK },
      ],
      secondParty: [
        { id: "date-scheduled", label: "נקבע דייט ראשון", nextStatus: MatchSuggestionStatus.MEETING_SCHEDULED },
        { id: "provide-feedback", label: "היה דייט ראשון", nextStatus: MatchSuggestionStatus.AWAITING_FIRST_DATE_FEEDBACK },
      ],
      matchmaker: [
        { id: "schedule-date", label: "נקבע דייט", nextStatus: MatchSuggestionStatus.MEETING_SCHEDULED },
        { id: "request-feedback", label: "בקש משוב", nextStatus: MatchSuggestionStatus.AWAITING_FIRST_DATE_FEEDBACK },
        { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }
      ]
    },
    MEETING_SCHEDULED: {
      firstParty: [
        { id: "date-happened", label: "הדייט היה", nextStatus: MatchSuggestionStatus.AWAITING_FIRST_DATE_FEEDBACK },
      ],
      secondParty: [
        { id: "date-happened", label: "הדייט היה", nextStatus: MatchSuggestionStatus.AWAITING_FIRST_DATE_FEEDBACK },
      ],
      matchmaker: [
        { id: "mark-dating", label: "סמן כ'בתהליך היכרות'", nextStatus: MatchSuggestionStatus.DATING },
        { id: "request-feedback", label: "בקש משוב", nextStatus: MatchSuggestionStatus.AWAITING_FIRST_DATE_FEEDBACK },
        { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }
      ]
    },
    AWAITING_FIRST_DATE_FEEDBACK: {
      firstParty: [
        { id: "thinking", label: "צריך/ה לחשוב", nextStatus: MatchSuggestionStatus.THINKING_AFTER_DATE },
        { id: "not-continuing", label: "לא ממשיך/ה", nextStatus: MatchSuggestionStatus.ENDED_AFTER_FIRST_DATE },
      ],
      secondParty: [
        { id: "thinking", label: "צריך/ה לחשוב", nextStatus: MatchSuggestionStatus.THINKING_AFTER_DATE },
        { id: "not-continuing", label: "לא ממשיך/ה", nextStatus: MatchSuggestionStatus.ENDED_AFTER_FIRST_DATE },
      ],
      matchmaker: [
        { id: "mark-thinking", label: "סמן כ'בחשיבה'", nextStatus: MatchSuggestionStatus.THINKING_AFTER_DATE },
        { id: "mark-ended-first", label: "סמן כ'הסתיים לאחר פגישה'", nextStatus: MatchSuggestionStatus.ENDED_AFTER_FIRST_DATE },
        { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }
      ]
    },
    THINKING_AFTER_DATE: {
      firstParty: [
        { id: "proceed-second", label: "ממשיכים לדייט שני!", nextStatus: MatchSuggestionStatus.PROCEEDING_TO_SECOND_DATE },
        { id: "not-continuing", label: "לא ממשיך/ה", nextStatus: MatchSuggestionStatus.ENDED_AFTER_FIRST_DATE },
      ],
      secondParty: [
        { id: "proceed-second", label: "ממשיכים לדייט שני!", nextStatus: MatchSuggestionStatus.PROCEEDING_TO_SECOND_DATE },
        { id: "not-continuing", label: "לא ממשיך/ה", nextStatus: MatchSuggestionStatus.ENDED_AFTER_FIRST_DATE },
      ],
      matchmaker: [
        { id: "proceed-second", label: "המשך לפגישה שניה", nextStatus: MatchSuggestionStatus.PROCEEDING_TO_SECOND_DATE },
        { id: "mark-ended-first", label: "סמן כ'הסתיים לאחר פגישה'", nextStatus: MatchSuggestionStatus.ENDED_AFTER_FIRST_DATE },
        { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }
      ]
    },
    PROCEEDING_TO_SECOND_DATE: {
      firstParty: [
        { id: "mark-dating", label: "אנחנו בתהליך!", nextStatus: MatchSuggestionStatus.DATING },
      ],
      secondParty: [
        { id: "mark-dating", label: "אנחנו בתהליך!", nextStatus: MatchSuggestionStatus.DATING },
      ],
      matchmaker: [
        { id: "mark-dating", label: "סמן כ'בתהליך היכרות'", nextStatus: MatchSuggestionStatus.DATING },
        { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }
      ]
    },
    ENDED_AFTER_FIRST_DATE: { matchmaker: [{ id: "close", label: "סגירת הצעה", nextStatus: MatchSuggestionStatus.CLOSED }] },
    MEETING_PENDING: {
      matchmaker: [
        { id: "schedule-meeting", label: "קביעת פגישה", nextStatus: MatchSuggestionStatus.MEETING_SCHEDULED },
        { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }
      ]
    },
    MATCH_APPROVED: {
      matchmaker: [
        { id: "mark-dating", label: "סמן כ'בתהליך היכרות'", nextStatus: MatchSuggestionStatus.DATING },
        { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }
      ]
    },
    MATCH_DECLINED: { matchmaker: [{ id: "close", label: "סגירת הצעה", nextStatus: MatchSuggestionStatus.CLOSED }] },
    DATING: {
      matchmaker: [
        { id: "mark-engaged", label: "עדכון אירוסין", nextStatus: MatchSuggestionStatus.ENGAGED },
        { id: "close", label: "סגירת תהליך", nextStatus: MatchSuggestionStatus.CLOSED },
        { id: "cancel", label: "ביטול השידוך", nextStatus: MatchSuggestionStatus.CANCELLED }
      ]
    },
    ENGAGED: {
      matchmaker: [
        { id: "mark-married", label: "עדכון נישואין", nextStatus: MatchSuggestionStatus.MARRIED },
        { id: "cancel", label: "ביטול אירוסין", nextStatus: MatchSuggestionStatus.CANCELLED }
      ]
    },
    MARRIED: {},
    EXPIRED: {},
    CLOSED: {},
    CANCELLED: {}
  };

  if (isFirstParty && actions[suggestion.status]?.firstParty) return actions[suggestion.status].firstParty || [];
  if (isSecondParty && actions[suggestion.status]?.secondParty) return actions[suggestion.status].secondParty || [];
  if (isMatchmaker && actions[suggestion.status]?.matchmaker) return actions[suggestion.status].matchmaker || [];
  return [];
}