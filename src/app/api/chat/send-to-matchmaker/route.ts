// src/app/api/chat/send-to-matchmaker/route.ts
// Sends a message from user to their suggestion's matchmaker

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const body = await req.json();
    const { suggestionId, message, context } = body;

    if (!suggestionId || !message) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }

    // Find the suggestion and its matchmaker
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      select: {
        id: true,
        matchmakerId: true,
        firstPartyId: true,
        secondPartyId: true,
      },
    });

    if (!suggestion) {
      return NextResponse.json({ success: false, message: 'Suggestion not found' }, { status: 404 });
    }

    // Verify user is part of this suggestion
    if (suggestion.firstPartyId !== session.user.id && suggestion.secondPartyId !== session.user.id) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    // Create a suggestion message to the matchmaker
    await prisma.suggestionMessage.create({
      data: {
        suggestionId: suggestion.id,
        senderId: session.user.id,
        senderType: 'USER',
        content: context ? `[${context}] ${message}` : message,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[send-to-matchmaker] Error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
