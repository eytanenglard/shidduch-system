// Full path: src/app/api/suggestions/[id]/status/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { MatchSuggestionStatus, MatchSuggestion, UserRole } from "@prisma/client";
import { statusTransitionService } from "@/app/components/matchmaker/suggestions/services/suggestions/StatusTransitionService";

// Validation schema for status update
const statusUpdateSchema = z.object({
  status: z.enum([
    "DRAFT",
    "PENDING_FIRST_PARTY",
    "FIRST_PARTY_APPROVED",
    "FIRST_PARTY_DECLINED",
    "PENDING_SECOND_PARTY",
    "SECOND_PARTY_APPROVED",
    "SECOND_PARTY_DECLINED",
    "AWAITING_MATCHMAKER_APPROVAL",
    "CONTACT_DETAILS_SHARED",
    "AWAITING_FIRST_DATE_FEEDBACK",
    "THINKING_AFTER_DATE",
    "PROCEEDING_TO_SECOND_DATE",
    "ENDED_AFTER_FIRST_DATE",
    "MEETING_PENDING",
    "MEETING_SCHEDULED",
    "MATCH_APPROVED",
    "MATCH_DECLINED",
    "DATING",
    "ENGAGED",
    "MARRIED",
    "EXPIRED",
    "CLOSED",
    "CANCELLED"
  ] as const),
  notes: z.string().optional(),
  feedback: z.string().optional(),
  meetingDate: z.string().optional(),
  customMessage: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Extract parameters
    const params = await context.params;
    const suggestionId = params.id;

    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json();
    
    try {
      const validatedData = statusUpdateSchema.parse(body);
      
      // Fetch current suggestion with related parties
      const suggestion = await prisma.matchSuggestion.findUnique({
        where: { id: suggestionId },
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

      if (!suggestion) {
        return NextResponse.json(
          { error: "Suggestion not found" },
          { status: 404 }
        );
      }

      // --- START OF CHANGE ---
      // Check if a candidate is trying to approve a suggestion while another one is already active.
      const isCandidateApproval =
        session.user.role === UserRole.CANDIDATE &&
        (validatedData.status === MatchSuggestionStatus.FIRST_PARTY_APPROVED ||
         validatedData.status === MatchSuggestionStatus.SECOND_PARTY_APPROVED);

      if (isCandidateApproval) {
        const activeProcessStatuses: MatchSuggestionStatus[] = [
          "FIRST_PARTY_APPROVED",
          "SECOND_PARTY_APPROVED",
          "AWAITING_MATCHMAKER_APPROVAL",
          "CONTACT_DETAILS_SHARED",
          "AWAITING_FIRST_DATE_FEEDBACK",
          "THINKING_AFTER_DATE",
          "PROCEEDING_TO_SECOND_DATE",
          "MEETING_PENDING",
          "MEETING_SCHEDULED",
          "MATCH_APPROVED",
          "DATING",
          "ENGAGED",
        ];

        const existingActiveSuggestion = await prisma.matchSuggestion.findFirst({
          where: {
            id: { not: suggestionId }, // Exclude the current suggestion being updated
            OR: [
              { firstPartyId: session.user.id },
              { secondPartyId: session.user.id },
            ],
            status: { in: activeProcessStatuses },
          },
        });

        if (existingActiveSuggestion) {
          return NextResponse.json(
            { error: "לא ניתן לאשר הצעה חדשה כאשר ישנה הצעה אחרת בתהליך פעיל." },
            { status: 409 } // 409 Conflict
          );
        }
      }
      // --- END OF CHANGE ---

      // Validate user permissions
      if (
        suggestion.firstPartyId !== session.user.id &&
        suggestion.secondPartyId !== session.user.id &&
        suggestion.matchmakerId !== session.user.id
      ) {
        return NextResponse.json(
          { error: "Unauthorized to update this suggestion" },
          { status: 403 }
        );
      }

      // Define transition options based on the type of update
      const transitionOptions = {
        sendNotifications: true,
        customMessage: validatedData.customMessage,
        notifyParties: ['first', 'second', 'matchmaker'] as ('first' | 'second' | 'matchmaker')[]
      };

      // Handle special cases for different status updates
      if (validatedData.status === "CONTACT_DETAILS_SHARED" && 
          validatedData.feedback && 
          validatedData.notes) {
        await createMeetingIfNecessary(suggestionId, validatedData);
      }

      // Process automatic secondary actions for certain status changes
      const secondaryAction = determineSecondaryAction(suggestion.status, validatedData.status);

      // Update suggestion status
      let updatedSuggestion = await statusTransitionService.transitionStatus(
        suggestion,
        validatedData.status as MatchSuggestionStatus,
        validatedData.notes,
        transitionOptions
      );

      // Process any secondary action if needed
      if (secondaryAction) {
        try {
          updatedSuggestion = await statusTransitionService.transitionStatus(
            updatedSuggestion,
            secondaryAction,
            `Automatic transition after ${validatedData.status}`,
            { 
              ...transitionOptions,
              customMessage: `התבצע מעבר אוטומטי לסטטוס ${statusTransitionService.getStatusLabel(secondaryAction)}`
            }
          );
        } catch (secondaryActionError) {
          console.warn("Warning: Secondary status transition failed:", secondaryActionError);
          // Continue with the response even if secondary action fails
        }
      }

      // Update party profiles if needed (e.g., changing availability status)
      await updateProfilesIfNeeded(validatedData.status as MatchSuggestionStatus, suggestion);

      return NextResponse.json({
        success: true,
        suggestion: updatedSuggestion,
      });

    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json({
          error: "Validation error",
          details: validationError.errors
        }, { status: 400 });
      }
      throw validationError;
    }

  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Helper function to determine if a secondary action should be taken
function determineSecondaryAction(
  currentStatus: MatchSuggestionStatus,
  newStatus: MatchSuggestionStatus
): MatchSuggestionStatus | null {
  // Automatic transitions

const automaticTransitions: Partial<Record<MatchSuggestionStatus, MatchSuggestionStatus>> = {    FIRST_PARTY_APPROVED: MatchSuggestionStatus.PENDING_SECOND_PARTY,
    SECOND_PARTY_APPROVED: MatchSuggestionStatus.CONTACT_DETAILS_SHARED,
    FIRST_PARTY_DECLINED: MatchSuggestionStatus.CLOSED,
    SECOND_PARTY_DECLINED: MatchSuggestionStatus.CLOSED,
  };

  return automaticTransitions[newStatus] || null;
}

// Helper function to create a meeting record if needed
async function createMeetingIfNecessary(
  suggestionId: string,
  data: z.infer<typeof statusUpdateSchema>
) {
  if (data.meetingDate) {
    // Create a meeting record
    await prisma.meeting.create({
      data: {
        suggestionId,
        scheduledDate: new Date(data.meetingDate),
        status: "SCHEDULED",
        notes: data.notes || "Automatically created when contact details were shared",
      }
    });
  }
}

// Helper function to update profiles if needed
async function updateProfilesIfNeeded(
  newStatus: MatchSuggestionStatus,
  suggestion: MatchSuggestion,
) {
  // Special handling for ENGAGED and MARRIED statuses
  if (newStatus === "ENGAGED" || newStatus === "MARRIED") {
    const availabilityStatus = newStatus === "ENGAGED" ? "ENGAGED" : "MARRIED";
    
    // Update both profiles with the new status
    await Promise.all([
      prisma.profile.update({
        where: { userId: suggestion.firstPartyId },
        data: {
          availabilityStatus,
          availabilityNote: `Status changed to ${newStatus} on ${new Date().toISOString().split('T')[0]}`,
          availabilityUpdatedAt: new Date()
        }
      }),
      prisma.profile.update({
        where: { userId: suggestion.secondPartyId },
        data: {
          availabilityStatus,
          availabilityNote: `Status changed to ${newStatus} on ${new Date().toISOString().split('T')[0]}`,
          availabilityUpdatedAt: new Date()
        }
      })
    ]);
  }
  
  // For DATING status, mark both profiles as unavailable
  if (newStatus === "DATING") {
    await Promise.all([
      prisma.profile.update({
        where: { userId: suggestion.firstPartyId },
        data: {
          availabilityStatus: "DATING",
          availabilityNote: "Currently in a dating process",
          availabilityUpdatedAt: new Date()
        }
      }),
      prisma.profile.update({
        where: { userId: suggestion.secondPartyId },
        data: {
          availabilityStatus: "DATING",
          availabilityNote: "Currently in a dating process",
          availabilityUpdatedAt: new Date()
        }
      })
    ]);
  }
}