// src/components/matchmaker/suggestions/services/suggestions/StatusTransitionService.ts

import { MatchSuggestionStatus, User, MatchSuggestion, Profile } from "@prisma/client";
import prisma from "@/lib/prisma";
import { initNotificationService } from "../notification/initNotifications";
const notificationService = initNotificationService();
import { notifyNewSuggestion, notifyStatusChange, sendPushToUser } from "@/lib/pushNotifications";
import type { EmailDictionary } from "@/types/dictionary";

// Import pure logic from the shared module
import {
  validateStatusTransition,
  getStatusLabel,
  getAvailableActions,
  type SuggestionWithParties as BaseSuggestionWithParties,
} from "./StatusTransitionLogic";

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

    // Use imported pure function
    validateStatusTransition(previousStatus, newStatus);

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
          ...(newStatus === MatchSuggestionStatus.SECOND_PARTY_NOT_AVAILABLE && { secondPartyResponded: new Date() }),
          ...(newStatus === MatchSuggestionStatus.RE_OFFERED_TO_FIRST_PARTY && { firstPartySent: new Date() }),
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

      try {
        await this.sendPushForStatusChange(updatedSuggestion, newStatus);
      } catch (pushError) {
        console.error('[push] Error in status change push (non-fatal):', pushError);
      }
    }

    return updatedSuggestion;
  }

  private async sendPushForStatusChange(
    suggestion: SuggestionWithParties,
    newStatus: MatchSuggestionStatus
  ): Promise<void> {
    const matchmakerName = `${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`;

    switch (newStatus) {
      case MatchSuggestionStatus.PENDING_SECOND_PARTY:
        await notifyNewSuggestion({
          userId: suggestion.secondPartyId,
          matchmakerName,
          suggestionId: suggestion.id,
        });
        break;

      case MatchSuggestionStatus.FIRST_PARTY_APPROVED:
        await notifyStatusChange({
          userId: suggestion.matchmakerId,
          suggestionId: suggestion.id,
          statusMessage: `${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName} אישר/ה את ההצעה! ✅`,
        });
        break;

      case MatchSuggestionStatus.FIRST_PARTY_DECLINED:
        await notifyStatusChange({
          userId: suggestion.matchmakerId,
          suggestionId: suggestion.id,
          statusMessage: `${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName} דחה/תה את ההצעה`,
        });
        break;

      case MatchSuggestionStatus.FIRST_PARTY_INTERESTED:
        await notifyStatusChange({
          userId: suggestion.matchmakerId,
          suggestionId: suggestion.id,
          statusMessage: `${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName} שמר/ה את ההצעה לגיבוי ⭐`,
        });
        break;

      case MatchSuggestionStatus.SECOND_PARTY_APPROVED:
        await notifyStatusChange({
          userId: suggestion.matchmakerId,
          suggestionId: suggestion.id,
          statusMessage: `${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName} אישר/ה את ההצעה! ✅ שני הצדדים אישרו!`,
        });
        break;

      case MatchSuggestionStatus.SECOND_PARTY_DECLINED:
        await notifyStatusChange({
          userId: suggestion.matchmakerId,
          suggestionId: suggestion.id,
          statusMessage: `${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName} דחה/תה את ההצעה`,
        });
        break;

      case MatchSuggestionStatus.SECOND_PARTY_NOT_AVAILABLE:
        await notifyStatusChange({
          userId: suggestion.matchmakerId,
          suggestionId: suggestion.id,
          statusMessage: `${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName} לא זמין/ה כרגע`,
        });
        break;

      case MatchSuggestionStatus.RE_OFFERED_TO_FIRST_PARTY:
        await notifyNewSuggestion({
          userId: suggestion.firstPartyId,
          matchmakerName: matchmakerName,
          suggestionId: suggestion.id,
        });
        break;

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

  // Delegate to pure functions
  getStatusLabel(status: MatchSuggestionStatus): string {
    return getStatusLabel(status);
  }

  getAvailableActions(
    suggestion: SuggestionWithParties,
    userId: string
  ): { id: string; label: string; nextStatus: MatchSuggestionStatus }[] {
    return getAvailableActions(suggestion as unknown as BaseSuggestionWithParties, userId);
  }
}

export const statusTransitionService = StatusTransitionService.getInstance();