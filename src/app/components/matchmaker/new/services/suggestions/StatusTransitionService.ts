import { MatchSuggestionStatus, User, MatchSuggestion, Profile } from "@prisma/client";
import prisma from "@/lib/prisma";
import { EmailService } from "../email/EmailService";

type UserWithProfile = User & {
  profile: Profile | null;
};

export type SuggestionWithParties = MatchSuggestion & {
  firstParty: UserWithProfile;
  secondParty: UserWithProfile;
  matchmaker: User;
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
    notes?: string
  ): Promise<SuggestionWithParties> {
    const previousStatus = suggestion.status;

    // Perform the status transition in a transaction
    const updatedSuggestion = await prisma.$transaction(async (tx) => {
      // Update the suggestion status
      const updated = await tx.matchSuggestion.update({
        where: { id: suggestion.id },
        data: {
          status: newStatus,
          lastStatusChange: new Date(),
          lastActivity: new Date(),
          
          // Update timing fields based on status
          ...(newStatus === MatchSuggestionStatus.FIRST_PARTY_APPROVED && {
            firstPartyResponded: new Date(),
          }),
          ...(newStatus === MatchSuggestionStatus.PENDING_SECOND_PARTY && {
            secondPartySent: new Date(),
          }),
          ...(newStatus === MatchSuggestionStatus.SECOND_PARTY_APPROVED && {
            secondPartyResponded: new Date(),
          }),
          ...(newStatus === MatchSuggestionStatus.CONTACT_DETAILS_SHARED && {
            closedAt: new Date(),
          }),
          ...(newStatus === MatchSuggestionStatus.MEETING_SCHEDULED && {
            firstMeetingScheduled: new Date(),
          }),
        },
        include: {
          firstParty: {
            include: { profile: true }
          },
          secondParty: {
            include: { profile: true }
          },
          matchmaker: true,
        },
      });

      // Create status history record
      await tx.suggestionStatusHistory.create({
        data: {
          suggestionId: suggestion.id,
          status: newStatus,
          notes: notes || `Status changed from ${previousStatus} to ${newStatus}`,
        },
      });

      return updated;
    });

    // Send email notifications using EmailService
    try {
      await EmailService.getInstance().handleSuggestionStatusChange(
        updatedSuggestion,
        previousStatus
      );
    } catch (error) {
      // Log error but don't fail the transition
      console.error('Error sending status transition emails:', error);
    }

    return updatedSuggestion;
  }
}

// Export singleton instance
export const statusTransitionService = StatusTransitionService.getInstance();