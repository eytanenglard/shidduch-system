import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from '@/lib/rate-limiter';

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
  decisionDeadline: z.string().refine((val) => !isNaN(Date.parse(val)), { // Validate as date string
    message: "Invalid date format for decisionDeadline",
  }).transform((val) => new Date(val)), // Transform to Date object
});

export async function POST(req: NextRequest) {
  // Apply rate limiting: 30 new suggestions per matchmaker per hour (safety net)
  const rateLimitResponse = await applyRateLimit(req, { requests: 30, window: '1 h' });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.role) { // Check for user.id and user.role
      return NextResponse.json({ error: "Unauthorized - Invalid session" }, { status: 401 });
    }

    // ---- START OF CHANGE for POST ----
    // 2. Role verification (only matchmakers or admins can create suggestions)
    const allowedCreatorRoles: UserRole[] = [UserRole.MATCHMAKER, UserRole.ADMIN];
    if (!allowedCreatorRoles.includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions to create suggestion" }, { status: 403 });
    }
    // ---- END OF CHANGE for POST ----

    // 3. Parse and validate request body
    const body = await req.json();
    const validationResult = createSuggestionSchema.safeParse(body);

    if (!validationResult.success) {
        return NextResponse.json(
            { error: "Validation error", details: validationResult.error.errors },
            { status: 400 }
        );
    }
    const validatedData = validationResult.data;


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
                MatchSuggestionStatus.FIRST_PARTY_DECLINED, // Added
                MatchSuggestionStatus.SECOND_PARTY_DECLINED, // Added
                MatchSuggestionStatus.ENDED_AFTER_FIRST_DATE, // Added
              ],
            },
          },
        ],
      },
    });

    if (existingSuggestion) {
      return NextResponse.json(
        { error: `Active or pending suggestion (ID: ${existingSuggestion.id}, Status: ${existingSuggestion.status}) already exists between these parties` },
        { status: 409 } // Conflict
      );
    }

    // 7. Create the suggestion using a transaction
    const suggestion = await prisma.$transaction(async (tx) => {
      // Create the suggestion
      const newSuggestion = await tx.matchSuggestion.create({
        data: {
          matchmakerId: session.user.id, // The user creating is the matchmaker
          firstPartyId: validatedData.firstPartyId,
          secondPartyId: validatedData.secondPartyId,
          status: MatchSuggestionStatus.PENDING_FIRST_PARTY,
          priority: validatedData.priority,
          matchingReason: validatedData.matchingReason,
          firstPartyNotes: validatedData.firstPartyNotes,
          secondPartyNotes: validatedData.secondPartyNotes,
          internalNotes: validatedData.internalNotes,
          decisionDeadline: validatedData.decisionDeadline,
          responseDeadline: validatedData.decisionDeadline,
          firstPartySent: new Date(),
          lastStatusChange: new Date(),
          lastActivity: new Date(), // Initialize lastActivity
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
    // await emailService.sendSuggestionNotification(suggestion); // Consider passing the full suggestion object

    return NextResponse.json({
      message: "Suggestion created successfully",
      suggestion, // Return the created suggestion object
    }, { status: 201 }); // HTTP 201 Created
  } catch (error) {
    console.error("Error creating suggestion:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    // Handle Prisma unique constraint errors specifically if needed
    // if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {}
    
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
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: "Unauthorized - Invalid session" }, { status: 401 });
    }

    // ---- START OF CHANGE for PATCH (General permission) ----
    const allowedUpdaterRoles: UserRole[] = [UserRole.MATCHMAKER, UserRole.ADMIN, UserRole.CANDIDATE]; // CANDIDATE can update if they are a party
    if (!allowedUpdaterRoles.includes(session.user.role as UserRole)) {
        return NextResponse.json({ error: "Forbidden - Insufficient permissions to update suggestion status" }, { status: 403 });
    }
    // ---- END OF CHANGE for PATCH ----

    const body = await req.json();
    const { suggestionId, status, notes } = body; // Assuming status and notes are part of body

    // Validate incoming data (basic example)
    if (!suggestionId || !status) {
        return NextResponse.json({ error: "Missing suggestionId or status" }, { status: 400 });
    }
    if (!Object.values(MatchSuggestionStatus).includes(status as MatchSuggestionStatus)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }


    // 2. Fetch current suggestion
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      include: {
        firstParty: { include: { profile: true } },
        secondParty: { include: { profile: true } },
        matchmaker: true, // Include matchmaker for permission checks
      },
    });

    if (!suggestion) {
      return NextResponse.json(
        { error: "Suggestion not found" },
        { status: 404 }
      );
    }

    // ---- Specific permission check for PATCH ----
    // An ADMIN can update any suggestion.
    // A MATCHMAKER can update suggestions they created.
    // A CANDIDATE can update suggestions they are a party to (firstPartyId or secondPartyId).
    const isUserAdmin = session.user.role === UserRole.ADMIN;
    const isUserMatchmakerOwner = session.user.role === UserRole.MATCHMAKER && suggestion.matchmakerId === session.user.id;
    const isUserParty = session.user.role === UserRole.CANDIDATE && (suggestion.firstPartyId === session.user.id || suggestion.secondPartyId === session.user.id);

    if (!isUserAdmin && !isUserMatchmakerOwner && !isUserParty) {
        return NextResponse.json({ error: "Forbidden - You do not have permission to update this specific suggestion's status." }, { status: 403 });
    }
    // ---- End specific permission check ----


    // 3. Validate status transition (using your existing helper)
    const isValidTransition = validateStatusTransition(suggestion.status, status as MatchSuggestionStatus);
    if (!isValidTransition) {
      return NextResponse.json(
        { error: `Invalid status transition from ${suggestion.status} to ${status}` },
        { status: 400 }
      );
    }

    // 4. Update suggestion and create history entry
    const updatedSuggestion = await prisma.$transaction(async (tx) => {
      const updated = await tx.matchSuggestion.update({
        where: { id: suggestionId },
        data: {
          status: status as MatchSuggestionStatus,
          previousStatus: suggestion.status,
          lastStatusChange: new Date(),
          lastActivity: new Date(), // Update lastActivity
          ...(status === MatchSuggestionStatus.PENDING_SECOND_PARTY && {
            secondPartySent: new Date(),
          }),
          ...(status === MatchSuggestionStatus.CONTACT_DETAILS_SHARED && {
            // closedAt: new Date(), // Typically, CONTACT_DETAILS_SHARED doesn't mean closed
          }),
          ...(status === MatchSuggestionStatus.CLOSED && { // Explicitly set closedAt for CLOSED status
            closedAt: new Date(),
          }),
        },
      });

      await tx.suggestionStatusHistory.create({
        data: {
          suggestionId,
          status: status as MatchSuggestionStatus,
          notes: notes || `Status changed to ${status} by user ${session.user.id}`, // Add more context to notes
        },
      });

      return updated;
    });

    // 5. Handle automatic transitions and notifications
    // This logic might be better suited in a service layer or triggered by events
    // For example, if status is FIRST_PARTY_APPROVED, you might automatically transition to PENDING_SECOND_PARTY
    // and send notifications.
    // if (status === MatchSuggestionStatus.FIRST_PARTY_APPROVED) {
    //   // TODO: Transition to PENDING_SECOND_PARTY and notify
    // } else if (status === MatchSuggestionStatus.SECOND_PARTY_APPROVED) {
    //   // TODO: Transition to CONTACT_DETAILS_SHARED and notify
    // }

    return NextResponse.json({
      message: "Suggestion status updated successfully",
      suggestion: updatedSuggestion,
    });
  } catch (error) {
    console.error("Error updating suggestion status:", error);
    if (error instanceof z.ZodError) { // Handle Zod validation errors if you add more validation
        return NextResponse.json(
            { error: "Validation error for status update", details: error.errors },
            { status: 400 }
        );
    }
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
    DRAFT: [MatchSuggestionStatus.PENDING_FIRST_PARTY, MatchSuggestionStatus.CANCELLED],
    PENDING_FIRST_PARTY: [
        MatchSuggestionStatus.FIRST_PARTY_APPROVED,
        MatchSuggestionStatus.FIRST_PARTY_DECLINED,
        MatchSuggestionStatus.CANCELLED,
        MatchSuggestionStatus.EXPIRED,
    ],
    FIRST_PARTY_APPROVED: [
        MatchSuggestionStatus.PENDING_SECOND_PARTY,
        MatchSuggestionStatus.CANCELLED
    ],
    FIRST_PARTY_DECLINED: [MatchSuggestionStatus.CLOSED],
    PENDING_SECOND_PARTY: [
        MatchSuggestionStatus.SECOND_PARTY_APPROVED,
        MatchSuggestionStatus.SECOND_PARTY_DECLINED,
        MatchSuggestionStatus.CANCELLED,
        MatchSuggestionStatus.EXPIRED,
    ],
    SECOND_PARTY_APPROVED: [
        MatchSuggestionStatus.AWAITING_MATCHMAKER_APPROVAL, // Often matchmaker confirms before sharing
        MatchSuggestionStatus.CONTACT_DETAILS_SHARED, // Or directly share
        MatchSuggestionStatus.CANCELLED
    ],
    SECOND_PARTY_DECLINED: [MatchSuggestionStatus.CLOSED],
    AWAITING_MATCHMAKER_APPROVAL: [ // Matchmaker action after both parties approve
        MatchSuggestionStatus.CONTACT_DETAILS_SHARED,
        MatchSuggestionStatus.MATCH_DECLINED, // Matchmaker can decide not to proceed
        MatchSuggestionStatus.CANCELLED
    ],
    CONTACT_DETAILS_SHARED: [
        MatchSuggestionStatus.MEETING_PENDING, // Or AWAITING_FIRST_DATE_FEEDBACK
        MatchSuggestionStatus.DATING, // If they skip formal feedback and start dating
        MatchSuggestionStatus.CLOSED, // If one party decides not to proceed after contact
        MatchSuggestionStatus.CANCELLED
    ],
    AWAITING_FIRST_DATE_FEEDBACK: [
        MatchSuggestionStatus.THINKING_AFTER_DATE,
        MatchSuggestionStatus.ENDED_AFTER_FIRST_DATE,
        MatchSuggestionStatus.PROCEEDING_TO_SECOND_DATE, // If feedback leads to this
        MatchSuggestionStatus.CANCELLED
    ],
    THINKING_AFTER_DATE: [
        MatchSuggestionStatus.PROCEEDING_TO_SECOND_DATE,
        MatchSuggestionStatus.ENDED_AFTER_FIRST_DATE,
        MatchSuggestionStatus.CANCELLED
    ],
    PROCEEDING_TO_SECOND_DATE: [ // This might be too granular, DATNG might cover it
        MatchSuggestionStatus.AWAITING_FIRST_DATE_FEEDBACK, // For feedback after 2nd date etc.
        MatchSuggestionStatus.DATING,
        MatchSuggestionStatus.ENDED_AFTER_FIRST_DATE, // If it ends after 2nd date
        MatchSuggestionStatus.CANCELLED
    ],
    ENDED_AFTER_FIRST_DATE: [MatchSuggestionStatus.CLOSED],
    MEETING_PENDING: [ // This status might be redundant if AWAITING_FIRST_DATE_FEEDBACK is used
        MatchSuggestionStatus.MEETING_SCHEDULED,
        MatchSuggestionStatus.AWAITING_FIRST_DATE_FEEDBACK,
        MatchSuggestionStatus.CANCELLED
    ],
    MEETING_SCHEDULED: [ // Similar to MEETING_PENDING
        MatchSuggestionStatus.AWAITING_FIRST_DATE_FEEDBACK,
        MatchSuggestionStatus.DATING,
        MatchSuggestionStatus.CANCELLED
    ],
    MATCH_APPROVED: [ // This is often equivalent to CONTACT_DETAILS_SHARED or DATNG
        MatchSuggestionStatus.DATING,
        MatchSuggestionStatus.ENGAGED, // Could jump here
        MatchSuggestionStatus.CANCELLED
    ],
    MATCH_DECLINED: [MatchSuggestionStatus.CLOSED],
    DATING: [
        MatchSuggestionStatus.ENGAGED,
        MatchSuggestionStatus.CLOSED, // If dating ends
        MatchSuggestionStatus.CANCELLED
    ],
    ENGAGED: [
        MatchSuggestionStatus.MARRIED,
        MatchSuggestionStatus.CLOSED, // If engagement breaks
        MatchSuggestionStatus.CANCELLED
    ],
    MARRIED: [MatchSuggestionStatus.CLOSED], // Or just stay MARRIE
    EXPIRED: [MatchSuggestionStatus.CLOSED],
    CLOSED: [], // No transitions from CLOSED typically, except maybe reopening
    CANCELLED: [MatchSuggestionStatus.CLOSED] // Or just stay CANCELLED
};

  return validTransitions[currentStatus]?.includes(newStatus) ?? false;
}