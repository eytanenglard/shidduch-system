// src/app/api/suggestions/[id]/date-feedback/route.ts
// API route for post-date feedback submission

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const feedbackSchema = z.object({
  overallRating: z.number().min(1).max(5),
  connectionFelt: z.boolean(),
  likedAspects: z.array(z.string()),
  improvementAreas: z.array(z.string()),
  wantSecondDate: z.enum(['yes', 'maybe', 'no']),
  freeText: z.string().max(1000).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: suggestionId } = await params;
    const body = await req.json();
    const parsed = feedbackSchema.parse(body);

    // Verify user is part of this suggestion
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      select: {
        id: true,
        firstPartyId: true,
        secondPartyId: true,
        status: true,
      },
    });

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    const isParty =
      suggestion.firstPartyId === session.user.id ||
      suggestion.secondPartyId === session.user.id;

    if (!isParty) {
      return NextResponse.json(
        { error: 'Not authorized for this suggestion' },
        { status: 403 }
      );
    }

    // Check suggestion is in DATING or related status
    const validStatuses = [
      'CONTACT_DETAILS_SHARED',
      'AWAITING_FIRST_DATE_FEEDBACK',
      'THINKING_AFTER_DATE',
      'PROCEEDING_TO_SECOND_DATE',
      'DATING',
    ];

    if (!validStatuses.includes(suggestion.status)) {
      return NextResponse.json(
        { error: 'Feedback not applicable for current status' },
        { status: 400 }
      );
    }

    // Store feedback in the suggestion's metadata
    // Using statusHistory to record the feedback as a milestone
    await prisma.suggestionStatusHistory.create({
      data: {
        suggestionId,
        status: suggestion.status,
        reason: 'DATE_FEEDBACK',
        notes: JSON.stringify({
          userId: session.user.id,
          overallRating: parsed.overallRating,
          connectionFelt: parsed.connectionFelt,
          likedAspects: parsed.likedAspects,
          improvementAreas: parsed.improvementAreas,
          wantSecondDate: parsed.wantSecondDate,
          freeText: parsed.freeText,
          submittedAt: new Date().toISOString(),
        }),
      },
    });

    // If user doesn't want second date, update status
    if (parsed.wantSecondDate === 'no') {
      await prisma.matchSuggestion.update({
        where: { id: suggestionId },
        data: {
          status: 'ENDED_AFTER_FIRST_DATE',
        },
      });
    } else if (parsed.wantSecondDate === 'yes') {
      // If status allows, move forward
      if (suggestion.status === 'AWAITING_FIRST_DATE_FEEDBACK') {
        await prisma.matchSuggestion.update({
          where: { id: suggestionId },
          data: {
            status: 'PROCEEDING_TO_SECOND_DATE',
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid feedback data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Date feedback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
