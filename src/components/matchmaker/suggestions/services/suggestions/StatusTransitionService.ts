// src/components/matchmaker/suggestions/services/suggestions/StatusTransitionService.ts
// ════════════════════════════════════════════════════════════════
// 🔧 FIX:
//   1. validTransitions מסונכרן עם STATUS_TRANSITIONS ב-SuggestionCard
//   2. לוג מפורט כשמייל נכשל/מצליח
//   3. עדכון category בכל שינוי סטטוס
//   4. תיקון validateStatusTransition — כולל logging
// ════════════════════════════════════════════════════════════════

import { MatchSuggestionStatus, User, MatchSuggestion, Profile } from "@prisma/client";
import prisma from "@/lib/prisma";
import { initNotificationService } from "../notification/initNotifications";
import { notifyNewSuggestion, notifyStatusChange, sendPushToUser } from "@/lib/pushNotifications";
import { emailService } from "@/lib/email/emailService";
import type { EmailDictionary } from "@/types/dictionary";

const notificationService = initNotificationService();

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
  skipValidation?: boolean; // Allow matchmaker/admin to skip status transition validation
};

type LanguagePrefs = {
  firstParty: 'he' | 'en';
  secondParty: 'he' | 'en';
  matchmaker: 'he' | 'en';
};

// ════════════════════════════════════════════════════════════════
// Helper: חישוב קטגוריה
// ════════════════════════════════════════════════════════════════
const getSuggestionCategory = (status: MatchSuggestionStatus) => {
  switch (status) {
case 'DRAFT':
    case 'AWAITING_MATCHMAKER_APPROVAL':
    case 'PENDING_FIRST_PARTY':
    case 'PENDING_SECOND_PARTY':
    case 'FIRST_PARTY_INTERESTED':
    case 'SECOND_PARTY_NOT_AVAILABLE':
    case 'RE_OFFERED_TO_FIRST_PARTY':
      return 'PENDING';
    case 'FIRST_PARTY_DECLINED':
    case 'SECOND_PARTY_DECLINED':
    case 'MATCH_DECLINED':
    case 'ENDED_AFTER_FIRST_DATE':
    case 'ENGAGED':
    case 'MARRIED':
    case 'EXPIRED':
    case 'CLOSED':
    case 'CANCELLED':
      return 'HISTORY';
    default:
      return 'ACTIVE';
  }
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

// ═══ Validate ═══
    if (!mergedOptions.skipValidation) {
      this.validateStatusTransition(previousStatus, newStatus);
    } else {
      console.log(`⚡ [StatusTransition] Skipping validation for ${previousStatus} → ${newStatus} (matchmaker/admin override)`);
    }
    // ═══ DB Update ═══
    const updatedSuggestion = await prisma.$transaction(async (tx) => {
      const updated = await tx.matchSuggestion.update({
        where: { id: suggestion.id },
        data: {
          status: newStatus,
          previousStatus,
          lastStatusChange: new Date(),
          lastActivity: new Date(),
          category: getSuggestionCategory(newStatus),
          ...(newStatus === MatchSuggestionStatus.FIRST_PARTY_APPROVED && { firstPartyResponded: new Date() }),
          ...(newStatus === MatchSuggestionStatus.PENDING_SECOND_PARTY && { secondPartySent: new Date() }),
          ...(newStatus === MatchSuggestionStatus.SECOND_PARTY_APPROVED && { secondPartyResponded: new Date() }),
          ...(newStatus === MatchSuggestionStatus.CONTACT_DETAILS_SHARED && { closedAt: new Date() }),
          ...(newStatus === MatchSuggestionStatus.MEETING_SCHEDULED && { firstMeetingScheduled: new Date() }),
          ...(newStatus === MatchSuggestionStatus.SECOND_PARTY_NOT_AVAILABLE && { secondPartyResponded: new Date() }),
          ...(newStatus === MatchSuggestionStatus.RE_OFFERED_TO_FIRST_PARTY && { firstPartySent: new Date() }),
          ...(newStatus === MatchSuggestionStatus.CLOSED && { closedAt: new Date() }),
          ...(newStatus === MatchSuggestionStatus.CANCELLED && { closedAt: new Date() }),
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

    // ═══ Notifications ═══
    if (mergedOptions.sendNotifications) {
      // 1. Email + WhatsApp via NotificationService
      try {
        console.log(`\n═══════════════════════════════════════════════`);
        console.log(`📨 [StatusTransition] Sending notifications for ${previousStatus} → ${newStatus}`);
        console.log(`   Suggestion: ${updatedSuggestion.id}`);
        console.log(`   First party: ${updatedSuggestion.firstParty.firstName} (${languagePrefs.firstParty})`);
        console.log(`   Second party: ${updatedSuggestion.secondParty.firstName} (${languagePrefs.secondParty})`);
        console.log(`   notifyParties: ${mergedOptions.notifyParties?.join(', ')}`);
        console.log(`═══════════════════════════════════════════════\n`);

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
        
        console.log(`✅ [StatusTransition] Notifications sent successfully for ${newStatus}`);
      } catch (error) {
        console.error(`❌ [StatusTransition] Error sending notifications for ${newStatus}:`, error);
      }

      // 2. Push notifications
      try {
        await this.sendPushForStatusChange(updatedSuggestion, newStatus);
      } catch (pushError) {
        console.error('[push] Error in status change push (non-fatal):', pushError);
      }

      // 3. CONTACT_DETAILS_SHARED — מייל נפרד עם פרטי קשר בפועל
      if (newStatus === MatchSuggestionStatus.CONTACT_DETAILS_SHARED) {
        try {
          const { firstParty, secondParty, matchmaker } = updatedSuggestion;
          const matchmakerFullName = `${matchmaker.firstName} ${matchmaker.lastName}`;

          console.log('═══════════════════════════════════════════════');
          console.log('📨 Sending CONTACT DETAILS emails via Resend');
          console.log(`   First party: ${firstParty.firstName} → receives ${secondParty.firstName}'s details`);
          console.log(`   Second party: ${secondParty.firstName} → receives ${firstParty.firstName}'s details`);
          console.log('═══════════════════════════════════════════════');

          await emailService.sendContactDetailsEmail({
            locale: languagePrefs.firstParty,
            email: firstParty.email,
            recipientName: firstParty.firstName,
            otherPartyName: `${secondParty.firstName} ${secondParty.lastName}`,
            otherPartyContact: {
              phone: secondParty.phone || undefined,
              email: secondParty.email,
            },
            matchmakerName: matchmakerFullName,
          });

          await emailService.sendContactDetailsEmail({
            locale: languagePrefs.secondParty,
            email: secondParty.email,
            recipientName: secondParty.firstName,
            otherPartyName: `${firstParty.firstName} ${firstParty.lastName}`,
            otherPartyContact: {
              phone: firstParty.phone || undefined,
              email: firstParty.email,
            },
            matchmakerName: matchmakerFullName,
          });

          console.log(`✅ Contact details emails sent for suggestion ${updatedSuggestion.id}`);
        } catch (contactEmailError) {
          console.error('❌ Error sending contact details emails (non-fatal):', contactEmailError);
        }
      }
    }

    return updatedSuggestion;
  }

  // ═══════════════════════════════════════════════════════════════
  // Push notification logic
  // ═══════════════════════════════════════════════════════════════
  private async sendPushForStatusChange(
    suggestion: SuggestionWithParties,
    newStatus: MatchSuggestionStatus
  ): Promise<void> {
    const matchmakerName = `${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`;

    switch (newStatus) {
      case MatchSuggestionStatus.PENDING_SECOND_PARTY:
        await notifyNewSuggestion({ userId: suggestion.secondPartyId, matchmakerName, suggestionId: suggestion.id });
        // Notify first party that suggestion was sent to second party
        await sendPushToUser(suggestion.firstPartyId, {
          title: '📤 ההצעה נשלחה!',
          body: 'ההצעה שאישרת נשלחה לצד השני. נעדכן אותך כשתהיה תגובה.',
          data: { type: 'STATUS_CHANGE', suggestionId: suggestion.id },
          sound: 'default',
        });
        break;
      case MatchSuggestionStatus.FIRST_PARTY_APPROVED:
        await notifyStatusChange({ userId: suggestion.matchmakerId, suggestionId: suggestion.id, statusMessage: `${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName} אישר/ה את ההצעה! ✅` });
        break;
      case MatchSuggestionStatus.FIRST_PARTY_DECLINED:
        await notifyStatusChange({ userId: suggestion.matchmakerId, suggestionId: suggestion.id, statusMessage: `${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName} דחה/תה את ההצעה` });
        break;
      case MatchSuggestionStatus.FIRST_PARTY_INTERESTED:
        await notifyStatusChange({ userId: suggestion.matchmakerId, suggestionId: suggestion.id, statusMessage: `${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName} שמר/ה את ההצעה לגיבוי ⭐` });
        break;
      case MatchSuggestionStatus.SECOND_PARTY_APPROVED:
        await notifyStatusChange({ userId: suggestion.matchmakerId, suggestionId: suggestion.id, statusMessage: `${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName} אישר/ה את ההצעה! ✅ שני הצדדים אישרו!` });
        // Notify first party that second party approved
        await sendPushToUser(suggestion.firstPartyId, {
          title: '🎉 הצד השני אישר/ה!',
          body: 'שני הצדדים אישרו! השדכן/ית ישתף/תשתף בקרוב את פרטי הקשר.',
          data: { type: 'STATUS_CHANGE', suggestionId: suggestion.id },
          sound: 'default',
        });
        break;
      case MatchSuggestionStatus.SECOND_PARTY_DECLINED:
        await notifyStatusChange({ userId: suggestion.matchmakerId, suggestionId: suggestion.id, statusMessage: `${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName} דחה/תה את ההצעה` });
        // Notify first party that second party declined (without revealing identity)
        await sendPushToUser(suggestion.firstPartyId, {
          title: 'עדכון לגבי ההצעה',
          body: 'הצד השני החליט שלא להמשיך בהצעה זו. אנחנו ממשיכים לחפש עבורך!',
          data: { type: 'STATUS_CHANGE', suggestionId: suggestion.id },
          sound: 'default',
        });
        break;
      case MatchSuggestionStatus.SECOND_PARTY_NOT_AVAILABLE:
        await notifyStatusChange({ userId: suggestion.matchmakerId, suggestionId: suggestion.id, statusMessage: `${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName} לא זמין/ה כרגע` });
        break;
      case MatchSuggestionStatus.RE_OFFERED_TO_FIRST_PARTY:
        await notifyNewSuggestion({ userId: suggestion.firstPartyId, matchmakerName, suggestionId: suggestion.id });
        break;
      case MatchSuggestionStatus.CONTACT_DETAILS_SHARED:
        await Promise.all([
          sendPushToUser(suggestion.firstPartyId, { title: '🎉 פרטי קשר שותפו!', body: 'שני הצדדים אישרו! לחץ/י לראות את פרטי הקשר', data: { type: 'STATUS_CHANGE', suggestionId: suggestion.id }, sound: 'default' }),
          sendPushToUser(suggestion.secondPartyId, { title: '🎉 פרטי קשר שותפו!', body: 'שני הצדדים אישרו! לחץ/י לראות את פרטי הקשר', data: { type: 'STATUS_CHANGE', suggestionId: suggestion.id }, sound: 'default' }),
        ]);
        break;
      case MatchSuggestionStatus.MEETING_SCHEDULED:
        await Promise.all([
          notifyStatusChange({ userId: suggestion.matchmakerId, suggestionId: suggestion.id, statusMessage: `📅 נקבע דייט ראשון בין ${suggestion.firstParty.firstName} ל${suggestion.secondParty.firstName}!` }),
          sendPushToUser(suggestion.firstPartyId, { title: '📅 נקבע דייט!', body: 'בהצלחה בפגישה!', data: { type: 'STATUS_CHANGE', suggestionId: suggestion.id }, sound: 'default' }),
          sendPushToUser(suggestion.secondPartyId, { title: '📅 נקבע דייט!', body: 'בהצלחה בפגישה!', data: { type: 'STATUS_CHANGE', suggestionId: suggestion.id }, sound: 'default' }),
        ]);
        break;
      case MatchSuggestionStatus.AWAITING_FIRST_DATE_FEEDBACK:
        await Promise.all([
          notifyStatusChange({ userId: suggestion.matchmakerId, suggestionId: suggestion.id, statusMessage: `☕ ${suggestion.firstParty.firstName} ו${suggestion.secondParty.firstName} דיווחו על דייט — ממתין למשוב` }),
          sendPushToUser(suggestion.firstPartyId, { title: '☕ איך היה הדייט?', body: 'שתפו אותנו — זה עוזר לנו לעזור לכם', data: { type: 'STATUS_CHANGE', suggestionId: suggestion.id }, sound: 'default' }),
          sendPushToUser(suggestion.secondPartyId, { title: '☕ איך היה הדייט?', body: 'שתפו אותנו — זה עוזר לנו לעזור לכם', data: { type: 'STATUS_CHANGE', suggestionId: suggestion.id }, sound: 'default' }),
        ]);
        break;
      case MatchSuggestionStatus.THINKING_AFTER_DATE:
        await notifyStatusChange({ userId: suggestion.matchmakerId, suggestionId: suggestion.id, statusMessage: `💭 אחד הצדדים בחשיבה לאחר הפגישה` });
        break;
      case MatchSuggestionStatus.PROCEEDING_TO_SECOND_DATE:
        await Promise.all([
          notifyStatusChange({ userId: suggestion.matchmakerId, suggestionId: suggestion.id, statusMessage: `🎉 ${suggestion.firstParty.firstName} ו${suggestion.secondParty.firstName} ממשיכים לדייט שני!` }),
          sendPushToUser(suggestion.firstPartyId, { title: '🎉 ממשיכים לדייט שני!', body: 'כל הכבוד! בהצלחה בפגישה הבאה', data: { type: 'STATUS_CHANGE', suggestionId: suggestion.id }, sound: 'default' }),
          sendPushToUser(suggestion.secondPartyId, { title: '🎉 ממשיכים לדייט שני!', body: 'כל הכבוד! בהצלחה בפגישה הבאה', data: { type: 'STATUS_CHANGE', suggestionId: suggestion.id }, sound: 'default' }),
        ]);
        break;
      case MatchSuggestionStatus.ENDED_AFTER_FIRST_DATE:
        await Promise.all([
          notifyStatusChange({ userId: suggestion.matchmakerId, suggestionId: suggestion.id, statusMessage: `${suggestion.firstParty.firstName} ו${suggestion.secondParty.firstName} — הסתיים לאחר פגישה ראשונה` }),
          sendPushToUser(suggestion.firstPartyId, { title: 'עדכון לגבי ההצעה', body: 'תודה על העדכון. ממשיכים לחפש עבורך!', data: { type: 'STATUS_CHANGE', suggestionId: suggestion.id }, sound: 'default' }),
          sendPushToUser(suggestion.secondPartyId, { title: 'עדכון לגבי ההצעה', body: 'תודה על העדכון. ממשיכים לחפש עבורך!', data: { type: 'STATUS_CHANGE', suggestionId: suggestion.id }, sound: 'default' }),
        ]);
        break;
      case MatchSuggestionStatus.ENGAGED:
      case MatchSuggestionStatus.MARRIED: {
        const emoji = newStatus === 'ENGAGED' ? '💍' : '💒';
        const label = newStatus === 'ENGAGED' ? 'מזל טוב! אירוסין!' : 'מזל טוב! נישואין!';
        await Promise.all([
          sendPushToUser(suggestion.firstPartyId, { title: `${emoji} ${label}`, body: 'מזל טוב! שמחים לבשר על ההתקדמות!', data: { type: 'STATUS_CHANGE', suggestionId: suggestion.id }, sound: 'default' }),
          sendPushToUser(suggestion.secondPartyId, { title: `${emoji} ${label}`, body: 'מזל טוב! שמחים לבשר על ההתקדמות!', data: { type: 'STATUS_CHANGE', suggestionId: suggestion.id }, sound: 'default' }),
        ]);
        break;
      }
      default:
        console.log(`[push] No push notification defined for status: ${newStatus}`);
        break;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // validateStatusTransition
  // ⚠️ מסונכרן עם STATUS_TRANSITIONS ב-SuggestionCard.tsx!
  // ═══════════════════════════════════════════════════════════════
  private validateStatusTransition(
    currentStatus: MatchSuggestionStatus,
    newStatus: MatchSuggestionStatus
  ): void {
    const validTransitions: Record<MatchSuggestionStatus, MatchSuggestionStatus[]> = {
      DRAFT: [MatchSuggestionStatus.PENDING_FIRST_PARTY],
      PENDING_FIRST_PARTY: [
        MatchSuggestionStatus.FIRST_PARTY_APPROVED,
        MatchSuggestionStatus.FIRST_PARTY_DECLINED,
        MatchSuggestionStatus.FIRST_PARTY_INTERESTED,
        MatchSuggestionStatus.CANCELLED,
      ],
      FIRST_PARTY_INTERESTED: [
        MatchSuggestionStatus.FIRST_PARTY_APPROVED,
        MatchSuggestionStatus.FIRST_PARTY_DECLINED,
        MatchSuggestionStatus.CANCELLED,
      ],
      FIRST_PARTY_APPROVED: [
        MatchSuggestionStatus.PENDING_SECOND_PARTY,
        MatchSuggestionStatus.PENDING_FIRST_PARTY,  // grace period withdrawal
        MatchSuggestionStatus.FIRST_PARTY_DECLINED,  // withdrawal before second party
        MatchSuggestionStatus.CANCELLED,
      ],
      FIRST_PARTY_DECLINED: [
        MatchSuggestionStatus.CLOSED,
        MatchSuggestionStatus.PENDING_FIRST_PARTY,  // undo decline (30s grace period)
      ],
      PENDING_SECOND_PARTY: [
        MatchSuggestionStatus.SECOND_PARTY_APPROVED,
        MatchSuggestionStatus.SECOND_PARTY_DECLINED,
        MatchSuggestionStatus.SECOND_PARTY_NOT_AVAILABLE,
        MatchSuggestionStatus.CANCELLED,
      ],
      SECOND_PARTY_NOT_AVAILABLE: [
        MatchSuggestionStatus.PENDING_SECOND_PARTY,
        MatchSuggestionStatus.CANCELLED,
        MatchSuggestionStatus.CLOSED,
      ],
      SECOND_PARTY_APPROVED: [
        MatchSuggestionStatus.CONTACT_DETAILS_SHARED,
        MatchSuggestionStatus.RE_OFFERED_TO_FIRST_PARTY,
        MatchSuggestionStatus.CANCELLED,
      ],
      RE_OFFERED_TO_FIRST_PARTY: [
        MatchSuggestionStatus.FIRST_PARTY_APPROVED,
        MatchSuggestionStatus.AWAITING_MATCHMAKER_APPROVAL,
        MatchSuggestionStatus.FIRST_PARTY_DECLINED,
        MatchSuggestionStatus.CANCELLED,
      ],
      SECOND_PARTY_DECLINED: [
        MatchSuggestionStatus.CLOSED,
      ],
      AWAITING_MATCHMAKER_APPROVAL: [
        MatchSuggestionStatus.CONTACT_DETAILS_SHARED,
        MatchSuggestionStatus.CANCELLED,
      ],
      CONTACT_DETAILS_SHARED: [
        MatchSuggestionStatus.MEETING_SCHEDULED,
        MatchSuggestionStatus.AWAITING_FIRST_DATE_FEEDBACK,
        MatchSuggestionStatus.CANCELLED,
      ],
      AWAITING_FIRST_DATE_FEEDBACK: [
        MatchSuggestionStatus.THINKING_AFTER_DATE,
        MatchSuggestionStatus.ENDED_AFTER_FIRST_DATE,
        MatchSuggestionStatus.CANCELLED,
      ],
      THINKING_AFTER_DATE: [
        MatchSuggestionStatus.PROCEEDING_TO_SECOND_DATE,
        MatchSuggestionStatus.ENDED_AFTER_FIRST_DATE,
        MatchSuggestionStatus.CANCELLED,
      ],
      PROCEEDING_TO_SECOND_DATE: [
        MatchSuggestionStatus.DATING,
        MatchSuggestionStatus.CANCELLED,
      ],
      ENDED_AFTER_FIRST_DATE: [
        MatchSuggestionStatus.CLOSED,
      ],
      MEETING_PENDING: [
        MatchSuggestionStatus.MEETING_SCHEDULED,
        MatchSuggestionStatus.CANCELLED,
      ],
      MEETING_SCHEDULED: [
        MatchSuggestionStatus.AWAITING_FIRST_DATE_FEEDBACK,
        MatchSuggestionStatus.DATING,
        MatchSuggestionStatus.CANCELLED,
      ],
      MATCH_APPROVED: [
        MatchSuggestionStatus.DATING,
        MatchSuggestionStatus.CANCELLED,
      ],
      MATCH_DECLINED: [
        MatchSuggestionStatus.CLOSED,
      ],
      DATING: [
        MatchSuggestionStatus.ENGAGED,
        MatchSuggestionStatus.CLOSED,
        MatchSuggestionStatus.CANCELLED,
      ],
      ENGAGED: [
        MatchSuggestionStatus.MARRIED,
        MatchSuggestionStatus.CANCELLED,
      ],
      MARRIED: [],
      EXPIRED: [],
      CLOSED: [],
      CANCELLED: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      console.error(
        `❌ [StatusTransition] Invalid transition: ${currentStatus} → ${newStatus}. ` +
        `Allowed: ${validTransitions[currentStatus]?.join(', ') || 'none'}`
      );
      throw new Error(
        `Invalid status transition from ${currentStatus} to ${newStatus}. ` +
        `Valid transitions are: ${validTransitions[currentStatus]?.join(', ') || 'none'}`
      );
    }

    console.log(`✓ [StatusTransition] Valid transition: ${currentStatus} → ${newStatus}`);
  }

  getStatusLabel(status: MatchSuggestionStatus): string {
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
      EXPIRED: "פג תוקף",
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
      DRAFT: { matchmaker: [{ id: "send-to-first", label: "שליחה לצד הראשון", nextStatus: MatchSuggestionStatus.PENDING_FIRST_PARTY }] },
      PENDING_FIRST_PARTY: {
        firstParty: [
          { id: "approve", label: "אישור ההצעה", nextStatus: MatchSuggestionStatus.FIRST_PARTY_APPROVED },
          { id: "decline", label: "דחיית ההצעה", nextStatus: MatchSuggestionStatus.FIRST_PARTY_DECLINED },
        ],
        matchmaker: [{ id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }],
      },
      FIRST_PARTY_APPROVED: {
        matchmaker: [
          { id: "send-to-second", label: "שליחה לצד השני", nextStatus: MatchSuggestionStatus.PENDING_SECOND_PARTY },
          { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED },
        ],
      },
      FIRST_PARTY_DECLINED: { matchmaker: [{ id: "close", label: "סגירת הצעה", nextStatus: MatchSuggestionStatus.CLOSED }] },
      FIRST_PARTY_INTERESTED: {
        firstParty: [
          { id: "approve", label: "אישור ההצעה", nextStatus: MatchSuggestionStatus.FIRST_PARTY_APPROVED },
          { id: "decline", label: "הסרה מרשימת ההמתנה", nextStatus: MatchSuggestionStatus.FIRST_PARTY_DECLINED },
        ],
        matchmaker: [{ id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }],
      },
      PENDING_SECOND_PARTY: {
        secondParty: [
          { id: "approve", label: "אישור ההצעה", nextStatus: MatchSuggestionStatus.SECOND_PARTY_APPROVED },
          { id: "decline", label: "דחיית ההצעה", nextStatus: MatchSuggestionStatus.SECOND_PARTY_DECLINED },
        ],
        matchmaker: [{ id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }],
      },
      SECOND_PARTY_NOT_AVAILABLE: {
        secondParty: [{ id: "now-available", label: "חזרתי להיות זמין/ה", nextStatus: MatchSuggestionStatus.PENDING_SECOND_PARTY }],
        matchmaker: [
          { id: "mark-available", label: "צד שני חזר להיות זמין", nextStatus: MatchSuggestionStatus.PENDING_SECOND_PARTY },
          { id: "close", label: "סגירת הצעה", nextStatus: MatchSuggestionStatus.CLOSED },
          { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED },
        ],
      },
      SECOND_PARTY_APPROVED: {
        matchmaker: [
          { id: "share-contacts", label: "שיתוף פרטי קשר", nextStatus: MatchSuggestionStatus.CONTACT_DETAILS_SHARED },
          { id: "re-offer-first", label: "שליחה מחדש לצד ראשון", nextStatus: MatchSuggestionStatus.RE_OFFERED_TO_FIRST_PARTY },
          { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED },
        ],
      },
      RE_OFFERED_TO_FIRST_PARTY: {
        firstParty: [
          { id: "approve", label: "אישור ההצעה", nextStatus: MatchSuggestionStatus.AWAITING_MATCHMAKER_APPROVAL },
          { id: "decline", label: "דחיית ההצעה", nextStatus: MatchSuggestionStatus.FIRST_PARTY_DECLINED },
        ],
        matchmaker: [{ id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED }],
      },
      SECOND_PARTY_DECLINED: { matchmaker: [{ id: "close", label: "סגירת הצעה", nextStatus: MatchSuggestionStatus.CLOSED }] },
      AWAITING_MATCHMAKER_APPROVAL: {
        matchmaker: [
          { id: "approve-share", label: "אישור שיתוף פרטים", nextStatus: MatchSuggestionStatus.CONTACT_DETAILS_SHARED },
          { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED },
        ],
      },
      CONTACT_DETAILS_SHARED: {
        matchmaker: [
          { id: "request-feedback", label: "בקש משוב", nextStatus: MatchSuggestionStatus.AWAITING_FIRST_DATE_FEEDBACK },
          { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED },
        ],
      },
      AWAITING_FIRST_DATE_FEEDBACK: {
        matchmaker: [
          { id: "mark-thinking", label: "סמן כ'בחשיבה'", nextStatus: MatchSuggestionStatus.THINKING_AFTER_DATE },
          { id: "mark-ended-first", label: "סמן כ'הסתיים לאחר פגישה'", nextStatus: MatchSuggestionStatus.ENDED_AFTER_FIRST_DATE },
          { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED },
        ],
      },
      THINKING_AFTER_DATE: {
        matchmaker: [
          { id: "proceed-second", label: "המשך לפגישה שניה", nextStatus: MatchSuggestionStatus.PROCEEDING_TO_SECOND_DATE },
          { id: "mark-ended-first", label: "סמן כ'הסתיים לאחר פגישה'", nextStatus: MatchSuggestionStatus.ENDED_AFTER_FIRST_DATE },
          { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED },
        ],
      },
      PROCEEDING_TO_SECOND_DATE: {
        matchmaker: [
          { id: "mark-dating", label: "סמן כ'בתהליך היכרות'", nextStatus: MatchSuggestionStatus.DATING },
          { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED },
        ],
      },
      ENDED_AFTER_FIRST_DATE: { matchmaker: [{ id: "close", label: "סגירת הצעה", nextStatus: MatchSuggestionStatus.CLOSED }] },
      MEETING_PENDING: {
        matchmaker: [
          { id: "schedule-meeting", label: "קביעת פגישה", nextStatus: MatchSuggestionStatus.MEETING_SCHEDULED },
          { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED },
        ],
      },
      MEETING_SCHEDULED: {
        matchmaker: [
          { id: "mark-dating", label: "סמן כ'בתהליך היכרות'", nextStatus: MatchSuggestionStatus.DATING },
          { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED },
        ],
      },
      MATCH_APPROVED: {
        matchmaker: [
          { id: "mark-dating", label: "סמן כ'בתהליך היכרות'", nextStatus: MatchSuggestionStatus.DATING },
          { id: "cancel", label: "ביטול ההצעה", nextStatus: MatchSuggestionStatus.CANCELLED },
        ],
      },
      MATCH_DECLINED: { matchmaker: [{ id: "close", label: "סגירת הצעה", nextStatus: MatchSuggestionStatus.CLOSED }] },
      DATING: {
        matchmaker: [
          { id: "mark-engaged", label: "עדכון אירוסין", nextStatus: MatchSuggestionStatus.ENGAGED },
          { id: "close", label: "סגירת תהליך", nextStatus: MatchSuggestionStatus.CLOSED },
          { id: "cancel", label: "ביטול השידוך", nextStatus: MatchSuggestionStatus.CANCELLED },
        ],
      },
      ENGAGED: {
        matchmaker: [
          { id: "mark-married", label: "עדכון נישואין", nextStatus: MatchSuggestionStatus.MARRIED },
          { id: "cancel", label: "ביטול אירוסין", nextStatus: MatchSuggestionStatus.CANCELLED },
        ],
      },
      MARRIED: {},
      EXPIRED: {},
      CLOSED: {},
      CANCELLED: {},
    };

    if (isFirstParty && actions[suggestion.status]?.firstParty) return actions[suggestion.status].firstParty || [];
    if (isSecondParty && actions[suggestion.status]?.secondParty) return actions[suggestion.status].secondParty || [];
    if (isMatchmaker && actions[suggestion.status]?.matchmaker) return actions[suggestion.status].matchmaker || [];
    return [];
  }
}

export const statusTransitionService = StatusTransitionService.getInstance();