import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MatchSuggestionStatus, UserRole, Priority } from "@prisma/client";
import { z } from "zod";

// Validation schema for creating a new suggestion
const createSuggestionSchema = z.object({
  firstPartyId: z.string({
    required_error: "First party ID is required",
  }),
  secondPartyId: z.string({
    required_error: "Second party ID is required",
  }),
  priority: z.enum([Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.URGENT])
    .default(Priority.MEDIUM),
  matchingReason: z.string().optional(),
  firstPartyNotes: z.string().optional(),
  secondPartyNotes: z.string().optional(),
  internalNotes: z.string().optional(),
  decisionDeadline: z.date(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Role verification (only matchmakers can create suggestions)
    if (session.user.role !== UserRole.MATCHMAKER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Parse and validate request body
    const body = await req.json();
    const validatedData = createSuggestionSchema.parse(body);

    // 4. Check if parties exist and are available
    const [firstParty, secondParty] = await Promise.all([
      prisma.user.findUnique({
        where: { id: validatedData.firstPartyId },
        include: { profile: true },
      }),
      prisma.user.findUnique({
        where: { id: validatedData.secondPartyId },
        include: { profile: true },
      }),
    ]);

    if (!firstParty || !secondParty) {
      return NextResponse.json(
        { error: "One or both parties not found" },
        { status: 404 }
      );
    }

    // 5. Check availability status
    if (
      firstParty.profile?.availabilityStatus !== "AVAILABLE" ||
      secondParty.profile?.availabilityStatus !== "AVAILABLE"
    ) {
      return NextResponse.json(
        { error: "One or both parties are not available for matching" },
        { status: 400 }
      );
    }

    // 6. Check for existing active suggestions between the parties
    const existingSuggestion = await prisma.matchSuggestion.findFirst({
      where: {
        AND: [
          {
            OR: [
              {
                firstPartyId: validatedData.firstPartyId,
                secondPartyId: validatedData.secondPartyId,
              },
              {
                firstPartyId: validatedData.secondPartyId,
                secondPartyId: validatedData.firstPartyId,
              },
            ],
          },
          {
            status: {
              notIn: [
                MatchSuggestionStatus.CLOSED,
                MatchSuggestionStatus.CANCELLED,
                MatchSuggestionStatus.EXPIRED,
                MatchSuggestionStatus.MATCH_DECLINED,
              ],
            },
          },
        ],
      },
    });

    if (existingSuggestion) {
      return NextResponse.json(
        { error: "Active suggestion already exists between these parties" },
        { status: 400 }
      );
    }

    // 7. Create the suggestion using a transaction
    const suggestion = await prisma.$transaction(async (tx) => {
      // Create the suggestion
      const newSuggestion = await tx.matchSuggestion.create({
        data: {
          matchmakerId: session.user.id,
          firstPartyId: validatedData.firstPartyId,
          secondPartyId: validatedData.secondPartyId,
          status: MatchSuggestionStatus.PENDING_FIRST_PARTY, // Start with pending first party
          priority: validatedData.priority,
          matchingReason: validatedData.matchingReason,
          firstPartyNotes: validatedData.firstPartyNotes,
          secondPartyNotes: validatedData.secondPartyNotes,
          internalNotes: validatedData.internalNotes,
          decisionDeadline: validatedData.decisionDeadline,
          responseDeadline: validatedData.decisionDeadline, // Initial response deadline
          firstPartySent: new Date(), // Mark as sent to first party immediately
          lastStatusChange: new Date(),
        },
      });

      // Create initial status history entry
      await tx.suggestionStatusHistory.create({
        data: {
          suggestionId: newSuggestion.id,
          status: MatchSuggestionStatus.PENDING_FIRST_PARTY,
          notes: "Initial suggestion created and sent to first party",
        },
      });

      return newSuggestion;
    });

    // 8. Trigger email notifications (should be moved to a separate service)
    // TODO: Implement email service integration
    // await emailService.sendSuggestionNotification(suggestion);

    return NextResponse.json({
      message: "Suggestion created successfully",
      suggestion,
    });
  } catch (error) {
    console.error("Error creating suggestion:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Status update handler
export async function PATCH(req: NextRequest) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { suggestionId, status, notes } = body;

    // 2. Fetch current suggestion
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      include: {
        firstParty: { include: { profile: true } },
        secondParty: { include: { profile: true } },
      },
    });

    if (!suggestion) {
      return NextResponse.json(
        { error: "Suggestion not found" },
        { status: 404 }
      );
    }

    // 3. Validate status transition
    const isValidTransition = validateStatusTransition(suggestion.status, status);
    if (!isValidTransition) {
      return NextResponse.json(
        { error: "Invalid status transition" },
        { status: 400 }
      );
    }

    // 4. Update suggestion and create history entry
    const updatedSuggestion = await prisma.$transaction(async (tx) => {
      // Update suggestion status
      const updated = await tx.matchSuggestion.update({
        where: { id: suggestionId },
        data: {
          status,
          previousStatus: suggestion.status,
          lastStatusChange: new Date(),
          ...(status === MatchSuggestionStatus.PENDING_SECOND_PARTY && {
            secondPartySent: new Date(),
          }),
          ...(status === MatchSuggestionStatus.CONTACT_DETAILS_SHARED && {
            closedAt: new Date(),
          }),
        },
      });

      // Create status history entry
      await tx.suggestionStatusHistory.create({
        data: {
          suggestionId,
          status,
          notes,
        },
      });

      return updated;
    });

    // 5. Handle automatic transitions and notifications
    if (status === MatchSuggestionStatus.FIRST_PARTY_APPROVED) {
      // Automatically transition to pending second party
      // TODO: Implement second party notification
    } else if (status === MatchSuggestionStatus.SECOND_PARTY_APPROVED) {
      // Automatically share contact details
      // TODO: Implement contact sharing notification
    }

    return NextResponse.json({
      message: "Suggestion status updated successfully",
      suggestion: updatedSuggestion,
    });
  } catch (error) {
    console.error("Error updating suggestion status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to validate status transitions
function validateStatusTransition(
  currentStatus: MatchSuggestionStatus,
  newStatus: MatchSuggestionStatus
): boolean {
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
    FIRST_PARTY_DECLINED: [MatchSuggestionStatus.CLOSED],
    PENDING_SECOND_PARTY: [
        MatchSuggestionStatus.SECOND_PARTY_APPROVED,
        MatchSuggestionStatus.SECOND_PARTY_DECLINED,
        MatchSuggestionStatus.CANCELLED
    ],
    SECOND_PARTY_APPROVED: [
        MatchSuggestionStatus.CONTACT_DETAILS_SHARED,
        MatchSuggestionStatus.CANCELLED
    ],
    SECOND_PARTY_DECLINED: [MatchSuggestionStatus.CLOSED],
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
    ENDED_AFTER_FIRST_DATE: [MatchSuggestionStatus.CLOSED],
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
    MATCH_DECLINED: [MatchSuggestionStatus.CLOSED],
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

  return validTransitions[currentStatus]?.includes(newStatus) ?? false;
}
