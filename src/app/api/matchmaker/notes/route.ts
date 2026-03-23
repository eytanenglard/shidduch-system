// =============================================================================
// src/app/api/matchmaker/notes/route.ts
// =============================================================================
// CRUD for matchmaker internal notes (CRM)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createNoteSchema = z.object({
  content: z.string().min(1).max(5000),
  userId: z.string(),
  suggestionId: z.string().optional(),
});

const updateNoteSchema = z.object({
  id: z.string(),
  content: z.string().min(1).max(5000).optional(),
  isPinned: z.boolean().optional(),
});

// =============================================================================
// GET — Fetch notes for a user or suggestion
// =============================================================================
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (
      session.user.role !== UserRole.MATCHMAKER &&
      session.user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const suggestionId = searchParams.get('suggestionId');

    if (!userId && !suggestionId) {
      return NextResponse.json(
        { error: 'userId or suggestionId is required' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = {
      matchmakerId: session.user.id,
    };
    if (userId) where.userId = userId;
    if (suggestionId) where.suggestionId = suggestionId;

    const notes = await prisma.matchmakerNote.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        content: true,
        isPinned: true,
        suggestionId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, notes });
  } catch (error) {
    console.error('[matchmaker/notes] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST — Create a new note
// =============================================================================
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (
      session.user.role !== UserRole.MATCHMAKER &&
      session.user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { content, userId, suggestionId } = parsed.data;

    // Verify the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If suggestionId provided, verify it exists
    if (suggestionId) {
      const suggestion = await prisma.matchSuggestion.findUnique({
        where: { id: suggestionId },
        select: { id: true },
      });
      if (!suggestion) {
        return NextResponse.json(
          { error: 'Suggestion not found' },
          { status: 404 }
        );
      }
    }

    const note = await prisma.matchmakerNote.create({
      data: {
        content,
        matchmakerId: session.user.id,
        userId,
        suggestionId: suggestionId || null,
      },
      select: {
        id: true,
        content: true,
        isPinned: true,
        suggestionId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, note });
  } catch (error) {
    console.error('[matchmaker/notes] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PATCH — Update a note (content or pin status)
// =============================================================================
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (
      session.user.role !== UserRole.MATCHMAKER &&
      session.user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...updates } = parsed.data;

    // Verify ownership
    const existing = await prisma.matchmakerNote.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    if (
      existing.matchmakerId !== session.user.id &&
      session.user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        { error: 'Cannot edit notes of other matchmakers' },
        { status: 403 }
      );
    }

    const note = await prisma.matchmakerNote.update({
      where: { id },
      data: updates,
      select: {
        id: true,
        content: true,
        isPinned: true,
        suggestionId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, note });
  } catch (error) {
    console.error('[matchmaker/notes] PATCH Error:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE — Delete a note
// =============================================================================
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (
      session.user.role !== UserRole.MATCHMAKER &&
      session.user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: 'Note ID required' },
        { status: 400 }
      );
    }

    const existing = await prisma.matchmakerNote.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    if (
      existing.matchmakerId !== session.user.id &&
      session.user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        { error: 'Cannot delete notes of other matchmakers' },
        { status: 403 }
      );
    }

    await prisma.matchmakerNote.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[matchmaker/notes] DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}
