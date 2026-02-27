// src/components/matchmaker/suggestions/services/suggestions/StatusTransitionService.ts

import { MatchSuggestionStatus, User, MatchSuggestion, Profile } from "@prisma/client";
import prisma from "@/lib/prisma";
import { notificationService } from "../notification/NotificationService";
import { notifyNewSuggestion, notifyStatusChange, sendPushToUser } from "@/lib/pushNotifications"; // ✅ NEW
import type { EmailDictionary } from "@/types/dictionary";

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

type LanguagePrefs = {
  firstParty: 'he' | 'en';
  secondParty: 'he' | 'en';
  matchmaker: 'he' | 'en';
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

  async transitionStatus(
    suggestion: SuggestionWithParties,
    newStatus: MatchSuggestionStatus,
    dictionaries: { he: EmailDictionary; en: EmailDictionary },
    notes?: string,
    options: TransitionOptions = {},
    languagePrefs: LanguagePrefs = { firstParty: 'he', secondParty: 'he', matchmaker: 'he' }
  ): Promise<SuggestionWithParties> {
    const previousStatus = suggestion.status;
    const mergedOptions = {
      sendNotifications: true,
      notifyParties: ['first', 'second', 'matchmaker'],
      ...options
    };

    this.validateStatusTransition(previousStatus, newStatus);

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

    // Email + WhatsApp notifications (existing)
    if (mergedOptions.sendNotifications) {
      try {
        await notificationService.handleSuggestionStatusChange(
          updatedSuggestion, 
          dictionaries,
          {           
            channels: ['email', 'whatsapp'],
            notifyParties: mergedOptions.notifyParties as ('first' | 'second' | 'matchmaker')[],
            customMessage: mergedOptions.customMessage
          },
          languagePrefs
        );
        
        console.log(`Notifications sent for suggestion ${updatedSuggestion.id} status change to ${newStatus}`);
      } catch (error) {
        console.error('Error sending status transition notifications:', error);
      }

      // =====================================================
      // ✅ NEW: Push Notifications לפלאפון
      // =====================================================
      try {
        await this.sendPushForStatusChange(updatedSuggestion, newStatus);
      } catch (pushError) {
        // Don't fail the transition if push fails
        console.error('[push] Error in status change push (non-fatal):', pushError);
      }
    }

    return updatedSuggestion;
  }

  // =====================================================
  // ✅ NEW: Push notification logic for status changes
  // =====================================================
  private async sendPushForStatusChange(
    suggestion: SuggestionWithParties,
    newStatus: MatchSuggestionStatus
  ): Promise<void> {
    const matchmakerName = `${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`;

    switch (newStatus) {
      // ── הצעה נשלחה לצד שני ──
      case MatchSuggestionStatus.PENDING_SECOND_PARTY:
        await notifyNewSuggestion({
          userId: suggestion.secondPartyId,
          matchmakerName,
          suggestionId: suggestion.id,
        });
        break;

      // ── צד ראשון אישר → עדכון לשדכן ──
      case MatchSuggestionStatus.FIRST_PARTY_APPROVED:
        await notifyStatusChange({
          userId: suggestion.matchmakerId,
          suggestionId: suggestion.id,
          statusMessage: `${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName} אישר/ה את ההצעה! ✅`,
        });
        break;

      // ── צד ראשון דחה → עדכון לשדכן ──
      case MatchSuggestionStatus.FIRST_PARTY_DECLINED:
        await notifyStatusChange({
          userId: suggestion.matchmakerId,
          suggestionId: suggestion.id,
          statusMessage: `${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName} דחה/תה את ההצעה`,
        });
        break;

      // ── צד שני אישר → עדכון לשדכן ──
      case MatchSuggestionStatus.SECOND_PARTY_APPROVED:
        await notifyStatusChange({
          userId: suggestion.matchmakerId,
          suggestionId: suggestion.id,
          statusMessage: `${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName} אישר/ה את ההצעה! ✅ שני הצדדים אישרו!`,
        });
        break;

      // ── צד שני דחה → עדכון לשדכן ──
      case MatchSuggestionStatus.SECOND_PARTY_DECLINED:
        await notifyStatusChange({
          userId: suggestion.matchmakerId,
          suggestionId: suggestion.id,
          statusMessage: `${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName} דחה/תה את ההצעה`,
        });
        break;

      // ── פרטי קשר שותפו → עדכון לשני הצדדים ──
      case MatchSuggestionStatus.CONTACT_DETAILS_SHARED:
        await Promise.all([
          sendPushToUser(suggestion.firstPartyId, {
            title: '🎉 פרטי קשר שותפו!',
            body: 'שני הצדדים אישרו! לחץ/י לראות את פרטי הקשר',
            data: { type: 'STATUS_CHANGE', suggestionId: suggestion.id },
            sound: 'default',
          }),
          sendPushToUser(suggestion.secondPartyId, {
            title: '🎉 פרטי קשר שותפו!',
            body: 'שני הצדדים אישרו! לחץ/י לראות את פרטי הקשר',
            data: { type: 'STATUS_CHANGE', suggestionId: suggestion.id },
            sound: 'default',
          }),
        ]);
        break;

      // ── אירוסין / נישואין → כולם ──
      case MatchSuggestionStatus.ENGAGED:
      case MatchSuggestionStatus.MARRIED: {
        const emoji = newStatus === 'ENGAGED' ? '💍' : '💒';
        const label = newStatus === 'ENGAGED' ? 'מזל טוב! אירוסין!' : 'מזל טוב! נישואין!';
        await Promise.all([
          sendPushToUser(suggestion.firstPartyId, {
            title: `${emoji} ${label}`,
            body: 'מזל טוב! שמחים לבשר על ההתקדמות!',
            data: { type: 'STATUS_CHANGE', suggestionId: suggestion.id },
            sound: 'default',
          }),
          sendPushToUser(suggestion.secondPartyId, {
            title: `${emoji} ${label}`,
            body: 'מזל טוב! שמחים לבשר על ההתקדמות!',
            data: { type: 'STATUS_CHANGE', suggestionId: suggestion.id },
            sound: 'default',
          }),
        ]);
        break;
      }

      default:
        console.log(`[push] No push notification defined for status: ${newStatus}`);
        break;
    }
  }

  // ============================================================
  // validateStatusTransition - UNCHANGED
  // ============================================================
  private validateStatusTransition(
    currentStatus: MatchSuggestionStatus, 
    newStatus: MatchSuggestionStatus
  ): void {
    const validTransitions: Record<MatchSuggestionStatus, MatchSuggestionStatus[]> = {
      DRAFT: [MatchSuggestionStatus.PENDING_FIRST_PARTY],
      PENDING_FIRST_PARTY: [
        MatchSuggestionStatus.FIRST_PARTY_APPROVED,
        MatchSuggestionStatus.FIRST_PARTY_DECLINED,
        MatchSuggestionStatus.FIRST_PARTY_INTERESTED, // ← NEW
        MatchSuggestionStatus.CANCELLED
      ],
      FIRST_PARTY_INTERESTED: [                        // ← NEW ENTRY
        MatchSuggestionStatus.FIRST_PARTY_APPROVED,    // activate from waitlist
        MatchSuggestionStatus.FIRST_PARTY_DECLINED,    // remove from waitlist
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
  
  // ============================================================
  // getStatusLabel - UNCHANGED
  // ============================================================
  getStatusLabel(status: MatchSuggestionStatus): string {
    const statusLabels: Record<MatchSuggestionStatus, string> = {
      DRAFT: "טיוטה",
      PENDING_FIRST_PARTY: "ממתין לתשובת הצד הראשון",
      FIRST_PARTY_APPROVED: "הצד הראשון אישר",
            FIRST_PARTY_DECLINED: "הצד הראשון דחה",
      FIRST_PARTY_INTERESTED: "הצד הראשון שמר לגיבוי",  // ← NEW

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
  
  // ============================================================
  // getAvailableActions - UNCHANGED (keeping full code for completeness)
  // ============================================================
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
      DRAFT: { matchmaker: [{ id: "send-to-first", label: "שליחה לצד הראשון", nextStatus: MatchSuggestionStatus.PENDING_FIRST_PARTY }] },
      PENDING_FIRST_PARTY: {
        firstParty: [
          { id: "approve", label: "אישור ההצעה", nextStatus: MatchSuggestionStatus.FIRST_PARTY_APPROVED },
          { id: "decline", label: "דחיית ההצעה", nextStatus: MatchSuggestionStatus.FIRST_PARTY_DECLINED }
        ],
        matchmaker: [{ id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }]
      },
      FIRST_PARTY_APPROVED: {
        matchmaker: [
          { id: "send-to-second", label: "שליחה לצד השני", nextStatus: MatchSuggestionStatus.PENDING_SECOND_PARTY },
          { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }
        ]
      },
  FIRST_PARTY_DECLINED: { matchmaker: [{ id: "close", label: "סגירת הצעה", nextStatus: MatchSuggestionStatus.CLOSED }] },
      FIRST_PARTY_INTERESTED: {                        // ← NEW ENTRY
        firstParty: [
          { id: "approve", label: "אישור ההצעה", nextStatus: MatchSuggestionStatus.FIRST_PARTY_APPROVED },
          { id: "decline", label: "הסרה מרשימת ההמתנה", nextStatus: MatchSuggestionStatus.FIRST_PARTY_DECLINED }
        ],
        matchmaker: [
          { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }
        ]
      },
            PENDING_SECOND_PARTY: {
        secondParty: [
          { id: "approve", label: "אישור ההצעה", nextStatus: MatchSuggestionStatus.SECOND_PARTY_APPROVED },
          { id: "decline", label: "דחיית ההצעה", nextStatus: MatchSuggestionStatus.SECOND_PARTY_DECLINED }
        ],
        matchmaker: [{ id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }]
      },
      SECOND_PARTY_APPROVED: {
        matchmaker: [
          { id: "share-contacts", label: "שיתוף פרטי קשר", nextStatus: MatchSuggestionStatus.CONTACT_DETAILS_SHARED },
          { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }
        ]
      },
      SECOND_PARTY_DECLINED: { matchmaker: [{ id: "close", label: "סגירת הצעה", nextStatus: MatchSuggestionStatus.CLOSED }] },
      AWAITING_MATCHMAKER_APPROVAL: {
        matchmaker: [
          { id: "approve-share", label: "אישור שיתוף פרטים", nextStatus: MatchSuggestionStatus.CONTACT_DETAILS_SHARED },
          { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }
        ]
      },
      CONTACT_DETAILS_SHARED: {
        firstParty: [{ id: "provide-feedback", label: "דיווח משוב לאחר פגישה", nextStatus: MatchSuggestionStatus.AWAITING_FIRST_DATE_FEEDBACK }],
        secondParty: [{ id: "provide-feedback", label: "דיווח משוב לאחר פגישה", nextStatus: MatchSuggestionStatus.AWAITING_FIRST_DATE_FEEDBACK }],
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
      ENDED_AFTER_FIRST_DATE: { matchmaker: [{ id: "close", label: "סגירת הצעה", nextStatus: MatchSuggestionStatus.CLOSED }] },
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
}

export const statusTransitionService = StatusTransitionService.getInstance();