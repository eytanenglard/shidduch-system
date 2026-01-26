// src/app/api/matchmaker/suggestions/[id]/message/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { notificationService } from '@/components/matchmaker/suggestions/services/notification/NotificationService';
import { initNotificationService } from '@/components/matchmaker/suggestions/services/notification/initNotifications';
// שינוי 1: הסרנו את EmailDictionary הבודד כי אנחנו לא משתמשים בו כטיפוס ישיר יותר
import { getDictionary } from '@/lib/dictionaries';

initNotificationService();

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const params = await props.params;
    const suggestionId = params.id;

    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: 'Unauthorized - Invalid session' }, { status: 401 });
    }

    const allowedRoles: UserRole[] = [UserRole.MATCHMAKER, UserRole.ADMIN];
    if (!allowedRoles.includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'Unauthorized - Matchmaker or Admin access required' }, { status: 403 });
    }

    // ========================= תיקון: טעינת שני המילונים =========================
    // במקום לטעון מילון אחד לפי ה-URL, אנו טוענים את שניהם
    // זה מאפשר לשירות ההתראות לבחור את המילון הנכון לפי שפת המקבל
    const [dictHe, dictEn] = await Promise.all([
      getDictionary('he'),
      getDictionary('en')
    ]);

    const dictionaries = {
      he: dictHe.email,
      en: dictEn.email
    };

    if (!dictionaries.he || !dictionaries.en) {
        throw new Error(`Email dictionaries could not be loaded.`);
    }
    // =========================================================================

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

    // חילוץ העדפות שפה מהמשתמשים (אם קיים שדה language ב-User, אחרת ברירת מחדל)
    const languagePrefs = {
      firstParty: (suggestion.firstParty as any).language || 'he',
      secondParty: (suggestion.secondParty as any).language || 'he',
      matchmaker: (suggestion.matchmaker as any).language || 'he',
    };

    // ========================= תיקון: קריאה לשירות עם הפרמטרים החדשים =========================
    await notificationService.handleSuggestionStatusChange(
      suggestion, 
      dictionaries, // מעבירים את האובייקט עם he ו-en
      {
        channels: channels,
        notifyParties: [partyType],
        customMessage: customMessage
      },
      languagePrefs // מעבירים את העדפות השפה
    );

    return NextResponse.json({ success: true, message: 'Message sent successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Error sending message for suggestion:', error);
    const message = (error instanceof Error) ? error.message : 'Failed to send message';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}