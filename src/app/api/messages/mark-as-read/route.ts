// src/app/api/messages/mark-as-read/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from 'zod';

const markAsReadSchema = z.object({
  id: z.string().min(1, 'ID is required').max(200),
  type: z.enum([
    'NEW_SUGGESTION',
    'STATUS_UPDATE',
    'ACTION_REQUIRED',
    'MATCHMAKER_MESSAGE',
    'INQUIRY_RESPONSE',
    'AVAILABILITY_INQUIRY',
  ], { errorMap: () => ({ message: 'Invalid notification type' }) }),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const validation = markAsReadSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.errors }, { status: 400 });
    }

    const { id, type } = validation.data;
    const userId = session.user.id;

    // Clean ID — strip prefixes from new format (suggestion-xxx, inquiry-xxx, availability-xxx)
    // Also handle old format where ID contained status suffix (xxx-STATUS)
    let cleanId = id
      .replace(/^suggestion-/, '')
      .replace(/^inquiry-/, '')
      .replace(/^availability-/, '');

    // Handle old format: "cuid-SOME_STATUS" — extract just the cuid part
    // CUIDs are 25 chars, so if there's a dash after position 20+, it's likely a status suffix
    if (cleanId.includes('-') && cleanId.length > 30) {
      cleanId = cleanId.split('-')[0];
    }

    if (type === 'NEW_SUGGESTION' || type === 'STATUS_UPDATE' || type === 'ACTION_REQUIRED') {
      const suggestion = await prisma.matchSuggestion.findUnique({
        where: { id: cleanId },
        select: { firstPartyId: true, secondPartyId: true }
      });

      if (suggestion) {
        if (suggestion.firstPartyId === userId) {
          await prisma.matchSuggestion.update({
            where: { id: cleanId },
            data: { firstPartyLastViewedAt: new Date() }
          });
        } else if (suggestion.secondPartyId === userId) {
          await prisma.matchSuggestion.update({
            where: { id: cleanId },
            data: { secondPartyLastViewedAt: new Date() }
          });
        }
      }
    } else if (type === 'MATCHMAKER_MESSAGE' || type === 'INQUIRY_RESPONSE') {
      await prisma.suggestionInquiry.update({
        where: { id: cleanId },
        data: { recipientReadAt: new Date() }
      });
    } else if (type === 'AVAILABILITY_INQUIRY') {
      // For availability inquiries, mark the user's response field
      const inquiry = await prisma.availabilityInquiry.findUnique({
        where: { id: cleanId },
        select: { firstPartyId: true, secondPartyId: true }
      });

      if (inquiry) {
        // We just mark it as "seen" — actual response is handled by the availability endpoint
        // No specific field to update for "seen", so we use updatedAt as a signal
        await prisma.availabilityInquiry.update({
          where: { id: cleanId },
          data: { updatedAt: new Date() }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking as read:", error);
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
  }
}
