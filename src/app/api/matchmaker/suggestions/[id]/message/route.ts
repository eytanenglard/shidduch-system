// src/app/api/matchmaker/suggestions/[id]/message/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { notificationService } from '@/components/matchmaker/suggestions/services/notification/NotificationService';
import { initNotificationService } from '@/components/matchmaker/suggestions/services/notification/initNotifications';
import { EmailDictionary } from '@/types/dictionary';
import { getDictionary } from '@/lib/dictionaries';

initNotificationService();

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const suggestionId = context.params.id;

    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: 'Unauthorized - Invalid session' }, { status: 401 });
    }

    const allowedRoles: UserRole[] = [UserRole.MATCHMAKER, UserRole.ADMIN];
    if (!allowedRoles.includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'Unauthorized - Matchmaker or Admin access required' }, { status: 403 });
    }

    const url = new URL(req.url);
    const locale: 'he' | 'en' = (url.searchParams.get('locale') === 'en') ? 'en' : 'he';
    
    console.log(`[API /message] Received request with locale: '${locale}'`);

    const dictionary = await getDictionary(locale);
    const emailDict: EmailDictionary = dictionary.email;

    if (!emailDict) {
        throw new Error(`Email dictionary for locale '${locale}' could not be loaded.`);
    }

    const body = await req.json();
    const { partyType, customMessage, channels } = body;

    if (!partyType || !customMessage || !channels) {
      return NextResponse.json({ error: 'Invalid input: Missing required fields.' }, { status: 400 });
    }

    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      include: {
        firstParty: { include: { profile: true } },
        secondParty: { include: { profile: true } },
        matchmaker: true,
      },
    });

    if (!suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    await notificationService.handleSuggestionStatusChange(
      suggestion, 
      emailDict,
      {
        channels: channels,
        notifyParties: [partyType],
        customMessage: customMessage
      }
    );

    return NextResponse.json({ success: true, message: 'Message sent successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Error sending message for suggestion:', error);
    const message = (error instanceof Error) ? error.message : 'Failed to send message';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}