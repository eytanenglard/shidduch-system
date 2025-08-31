// src/app/components/matchmaker/suggestions/services/suggestions/StatusTransitionService.ts

import { MatchSuggestionStatus, User, MatchSuggestion, Profile } from "@prisma/client";
import prisma from "@/lib/prisma";
import { notificationService } from "../notification/NotificationService";
// ========================= שלב 1: ייבוא טיפוס המילון =========================
import type { EmailDictionary } from "@/types/dictionary";
// =========================================================================

type UserWithProfile = User & {
  profile: Profile | null;
};

export type SuggestionWithParties = MatchSuggestion & {
  firstParty: UserWithProfile;
  secondParty: UserWithProfile;
  matchmaker: User;
};

type TransitionOptions = {
  sendNotifications?: boolean;
  customMessage?: string;
  notifyParties?: ('first' | 'second' | 'matchmaker')[];
};

export class StatusTransitionService {
  private static instance: StatusTransitionService;
  private constructor() {}

  public static getInstance(): StatusTransitionService {
    if (!StatusTransitionService.instance) {
      StatusTransitionService.instance = new StatusTransitionService();
    }
    return StatusTransitionService.instance;
  }

  // ========================= שלב 2: עדכון חתימת הפונקציה =========================
  // הפונקציה מקבלת כעת את המילון (dictionary) כפרמטר שלישי, שהוא חובה.
  async transitionStatus(
    suggestion: SuggestionWithParties,
    newStatus: MatchSuggestionStatus,
    dictionary: EmailDictionary, // <-- הוספת המילון כפרמטר
    notes?: string,
    options: TransitionOptions = {}
  ): Promise<SuggestionWithParties> {
    const previousStatus = suggestion.status;
    const mergedOptions = {
      sendNotifications: true,
      notifyParties: ['first', 'second', 'matchmaker'],
      ...options
    };

    // Validate the transition
    this.validateStatusTransition(previousStatus, newStatus);

    // Perform the status transition in a transaction (הקוד כאן נשאר זהה)
    const updatedSuggestion = await prisma.$transaction(async (tx) => {
      const updated = await tx.matchSuggestion.update({
        where: { id: suggestion.id },
        data: {
          status: newStatus,
          previousStatus,
          lastStatusChange: new Date(),
          lastActivity: new Date(),
          ...(newStatus === MatchSuggestionStatus.FIRST_PARTY_APPROVED && { firstPartyResponded: new Date() }),
          ...(newStatus === MatchSuggestionStatus.PENDING_SECOND_PARTY && { secondPartySent: new Date() }),
          ...(newStatus === MatchSuggestionStatus.SECOND_PARTY_APPROVED && { secondPartyResponded: new Date() }),
          ...(newStatus === MatchSuggestionStatus.CONTACT_DETAILS_SHARED && { closedAt: new Date() }),
          ...(newStatus === MatchSuggestionStatus.MEETING_SCHEDULED && { firstMeetingScheduled: new Date() }),
        },
        include: {
          firstParty: { include: { profile: true } },
          secondParty: { include: { profile: true } },
          matchmaker: true,
        },
      });

      await tx.suggestionStatusHistory.create({
        data: {
          suggestionId: suggestion.id,
          status: newStatus,
          notes: notes || `Status changed from ${previousStatus} to ${newStatus}`,
        },
      });

      return updated;
    });

    // Only send notifications if option is enabled
    if (mergedOptions.sendNotifications) {
      try {
        // ========================= שלב 3: קריאה נכונה לשירות ההתראות =========================
        // כעת אנו מעבירים את המילון כארגומנט השני, ואת ההגדרות כשלישי.
        await notificationService.handleSuggestionStatusChange(
          updatedSuggestion, 
          dictionary, // <-- ארגומנט 2: המילון
          {           // <-- ארגומנט 3: אובייקט ההגדרות
            channels: ['email', 'whatsapp'],
            notifyParties: mergedOptions.notifyParties as ('first' | 'second' | 'matchmaker')[],
            customMessage: mergedOptions.customMessage
          }
        );
        // ======================================================================================
        
        console.log(`Notifications sent for suggestion ${updatedSuggestion.id} status change to ${newStatus}`);
      } catch (error) {
        // Log error but don't fail the transition
        console.error('Error sending status transition notifications:', error);
      }
    }

    return updatedSuggestion;
  }

  // הפונקציות הבאות נשארות ללא שינוי
  private validateStatusTransition(
    currentStatus: MatchSuggestionStatus, 
    newStatus: MatchSuggestionStatus
  ): void {
    const validTransitions: Record<MatchSuggestionStatus, MatchSuggestionStatus[]> = {
      DRAFT: [MatchSuggestionStatus.PENDING_FIRST_PARTY],
      PENDING_FIRST_PARTY: [
        MatchSuggestionStatus.FIRST_PARTY_APPROVED,
        MatchSuggestionStatus.FIRST_PARTY_DECLINED,
        MatchSuggestionStatus.CANCELLED
      ],
      FIRST_PARTY_APPROVED: [
        MatchSuggestionStatus.PENDING_SECOND_PARTY,
        MatchSuggestionStatus.CANCELLED
      ],
      FIRST_PARTY_DECLINED: [
        MatchSuggestionStatus.CLOSED
      ],
      PENDING_SECOND_PARTY: [
        MatchSuggestionStatus.SECOND_PARTY_APPROVED,
        MatchSuggestionStatus.SECOND_PARTY_DECLINED,
        MatchSuggestionStatus.CANCELLED
      ],
      SECOND_PARTY_APPROVED: [
        MatchSuggestionStatus.CONTACT_DETAILS_SHARED,
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
      MEETING_SCHEDULED: [
        MatchSuggestionStatus.DATING,
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

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${currentStatus} to ${newStatus}. ` +
        `Valid transitions are: ${validTransitions[currentStatus]?.join(', ') || 'none'}`
      );
    }
  }
  
  getStatusLabel(status: MatchSuggestionStatus): string {
    const statusLabels: Record<MatchSuggestionStatus, string> = {
      DRAFT: "טיוטה",
      PENDING_FIRST_PARTY: "ממתין לתשובת הצד הראשון",
      FIRST_PARTY_APPROVED: "הצד הראשון אישר",
      FIRST_PARTY_DECLINED: "הצד הראשון דחה",
      PENDING_SECOND_PARTY: "ממתין לתשובת הצד השני",
      SECOND_PARTY_APPROVED: "הצד השני אישר",
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
  
  getAvailableActions(
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
      DRAFT: {
        matchmaker: [
          { id: "send-to-first", label: "שליחה לצד הראשון", nextStatus: MatchSuggestionStatus.PENDING_FIRST_PARTY }
        ]
      },
      PENDING_FIRST_PARTY: {
        firstParty: [
          { id: "approve", label: "אישור ההצעה", nextStatus: MatchSuggestionStatus.FIRST_PARTY_APPROVED },
          { id: "decline", label: "דחיית ההצעה", nextStatus: MatchSuggestionStatus.FIRST_PARTY_DECLINED }
        ],
        matchmaker: [
          { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }
        ]
      },
      FIRST_PARTY_APPROVED: {
        matchmaker: [
          { id: "send-to-second", label: "שליחה לצד השני", nextStatus: MatchSuggestionStatus.PENDING_SECOND_PARTY },
          { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }
        ]
      },
      FIRST_PARTY_DECLINED: {
        matchmaker: [
          { id: "close", label: "סגירת הצעה", nextStatus: MatchSuggestionStatus.CLOSED }
        ]
      },
      PENDING_SECOND_PARTY: {
        secondParty: [
          { id: "approve", label: "אישור ההצעה", nextStatus: MatchSuggestionStatus.SECOND_PARTY_APPROVED },
          { id: "decline", label: "דחיית ההצעה", nextStatus: MatchSuggestionStatus.SECOND_PARTY_DECLINED }
        ],
        matchmaker: [
          { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }
        ]
      },
      SECOND_PARTY_APPROVED: {
        matchmaker: [
          { id: "share-contacts", label: "שיתוף פרטי קשר", nextStatus: MatchSuggestionStatus.CONTACT_DETAILS_SHARED },
          { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }
        ]
      },
      SECOND_PARTY_DECLINED: {
        matchmaker: [
          { id: "close", label: "סגירת הצעה", nextStatus: MatchSuggestionStatus.CLOSED }
        ]
      },
      AWAITING_MATCHMAKER_APPROVAL: {
        matchmaker: [
          { id: "approve-share", label: "אישור שיתוף פרטים", nextStatus: MatchSuggestionStatus.CONTACT_DETAILS_SHARED },
          { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }
        ]
      },
      CONTACT_DETAILS_SHARED: {
        firstParty: [
          { id: "provide-feedback", label: "דיווח משוב לאחר פגישה", nextStatus: MatchSuggestionStatus.AWAITING_FIRST_DATE_FEEDBACK }
        ],
        secondParty: [
          { id: "provide-feedback", label: "דיווח משוב לאחר פגישה", nextStatus: MatchSuggestionStatus.AWAITING_FIRST_DATE_FEEDBACK }
        ],
        matchmaker: [
          { id: "request-feedback", label: "בקש משוב", nextStatus: MatchSuggestionStatus.AWAITING_FIRST_DATE_FEEDBACK },
          { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }
        ]
      },
      AWAITING_FIRST_DATE_FEEDBACK: {
         matchmaker: [
            { id: "mark-thinking", label: "סמן כ'בחשיבה'", nextStatus: MatchSuggestionStatus.THINKING_AFTER_DATE },
            { id: "mark-ended-first", label: "סמן כ'הסתיים לאחר פגישה'", nextStatus: MatchSuggestionStatus.ENDED_AFTER_FIRST_DATE },
            { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }
         ]
      },
      THINKING_AFTER_DATE: {
         matchmaker: [
            { id: "proceed-second", label: "המשך לפגישה שניה", nextStatus: MatchSuggestionStatus.PROCEEDING_TO_SECOND_DATE },
            { id: "mark-ended-first", label: "סמן כ'הסתיים לאחר פגישה'", nextStatus: MatchSuggestionStatus.ENDED_AFTER_FIRST_DATE },
            { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }
         ]
      },
      PROCEEDING_TO_SECOND_DATE: {
         matchmaker: [
            { id: "mark-dating", label: "סמן כ'בתהליך היכרות'", nextStatus: MatchSuggestionStatus.DATING },
            { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }
         ]
      },
      ENDED_AFTER_FIRST_DATE: {
        matchmaker: [
          { id: "close", label: "סגירת הצעה", nextStatus: MatchSuggestionStatus.CLOSED }
        ]
      },
      MEETING_PENDING: {
         matchmaker: [
            { id: "schedule-meeting", label: "קביעת פגישה", nextStatus: MatchSuggestionStatus.MEETING_SCHEDULED },
            { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }
         ]
      },
      MEETING_SCHEDULED: {
         matchmaker: [
            { id: "mark-dating", label: "סמן כ'בתהליך היכרות'", nextStatus: MatchSuggestionStatus.DATING },
            { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }
         ]
      },
      MATCH_APPROVED: {
         matchmaker: [
            { id: "mark-dating", label: "סמן כ'בתהליך היכרות'", nextStatus: MatchSuggestionStatus.DATING },
            { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }
         ]
      },
      MATCH_DECLINED: {
        matchmaker: [
          { id: "close", label: "סגירת הצעה", nextStatus: MatchSuggestionStatus.CLOSED }
        ]
      },
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
    
    if (isFirstParty && actions[suggestion.status]?.firstParty) {
      return actions[suggestion.status].firstParty || [];
    }
    
    if (isSecondParty && actions[suggestion.status]?.secondParty) {
      return actions[suggestion.status].secondParty || [];
    }
    
    if (isMatchmaker && actions[suggestion.status]?.matchmaker) {
      return actions[suggestion.status].matchmaker || [];
    }
    
    return [];
  }
}

// Export singleton instance
export const statusTransitionService = StatusTransitionService.getInstance();