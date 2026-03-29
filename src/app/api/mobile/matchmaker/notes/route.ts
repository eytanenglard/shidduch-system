// =============================================================================
// src/app/api/mobile/matchmaker/notes/route.ts
// =============================================================================
// CRUD for matchmaker internal notes — CRM (Mobile JWT)
// =============================================================================

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from '@/lib/mobile-auth';

export const dynamic = 'force-dynamic';

// ─── Schemas ──────────────────────────────────────────────────────────────────

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

// ─── OPTIONS ──────────────────────────────────────────────────────────────────

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

// ─── GET — Fetch notes for a user or suggestion ──────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    if (auth.role !== UserRole.MATCHMAKER && auth.role !== UserRole.ADMIN) {
      return corsError(req, 'Insufficient permissions', 403);
    }

    const params = req.nextUrl.searchParams;
    const userId = params.get('userId');
    const suggestionId = params.get('suggestionId');

    if (!userId && !suggestionId) {
      return corsError(req, 'userId or suggestionId is required', 400, 'VALIDATION_ERROR');
    }

    const where: Record<string, unknown> = {
      matchmakerId: auth.userId,
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

    return corsJson(req, { success: true, notes });
  } catch (error) {
    console.error('[Mobile Notes API] GET Error:', error);
    return corsError(req, 'Failed to fetch notes', 500);
  }
}

// ─── POST — Create a new note ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    if (auth.role !== UserRole.MATCHMAKER && auth.role !== UserRole.ADMIN) {
      return corsError(req, 'Insufficient permissions', 403);
    }

    const body = await req.json();
    const parsed = createNoteSchema.safeParse(body);
    if (!parsed.success) {
      return corsError(req, 'Invalid data', 400, 'VALIDATION_ERROR');
    }

    const { content, userId, suggestionId } = parsed.data;

    // Verify the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!targetUser) {
      return corsError(req, 'User not found', 404);
    }

    // If suggestionId provided, verify it exists
    if (suggestionId) {
      const suggestion = await prisma.matchSuggestion.findUnique({
        where: { id: suggestionId },
        select: { id: true },
      });
      if (!suggestion) {
        return corsError(req, 'Suggestion not found', 404);
      }
    }

    const note = await prisma.matchmakerNote.create({
      data: {
        content,
        matchmakerId: auth.userId,
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

    return corsJson(req, { success: true, note });
  } catch (error) {
    console.error('[Mobile Notes API] POST Error:', error);
    return corsError(req, 'Failed to create note', 500);
  }
}

// ─── PATCH — Update a note (content or pin status) ───────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    if (auth.role !== UserRole.MATCHMAKER && auth.role !== UserRole.ADMIN) {
      return corsError(req, 'Insufficient permissions', 403);
    }

    const body = await req.json();
    const parsed = updateNoteSchema.safeParse(body);
    if (!parsed.success) {
      return corsError(req, 'Invalid data', 400, 'VALIDATION_ERROR');
    }

    const { id, ...updates } = parsed.data;

    // Verify ownership
    const existing = await prisma.matchmakerNote.findUnique({
      where: { id },
    });
    if (!existing) {
      return corsError(req, 'Note not found', 404);
    }
    if (existing.matchmakerId !== auth.userId && auth.role !== UserRole.ADMIN) {
      return corsError(req, 'Cannot edit notes of other matchmakers', 403);
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

    return corsJson(req, { success: true, note });
  } catch (error) {
    console.error('[Mobile Notes API] PATCH Error:', error);
    return corsError(req, 'Failed to update note', 500);
  }
}

// ─── DELETE — Delete a note ──────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    if (auth.role !== UserRole.MATCHMAKER && auth.role !== UserRole.ADMIN) {
      return corsError(req, 'Insufficient permissions', 403);
    }

    const params = req.nextUrl.searchParams;
    const id = params.get('id');
    if (!id) {
      return corsError(req, 'Note ID required', 400, 'VALIDATION_ERROR');
    }

    const existing = await prisma.matchmakerNote.findUnique({
      where: { id },
    });
    if (!existing) {
      return corsError(req, 'Note not found', 404);
    }
    if (existing.matchmakerId !== auth.userId && auth.role !== UserRole.ADMIN) {
      return corsError(req, 'Cannot delete notes of other matchmakers', 403);
    }

    await prisma.matchmakerNote.delete({ where: { id } });

    return corsJson(req, { success: true });
  } catch (error) {
    console.error('[Mobile Notes API] DELETE Error:', error);
    return corsError(req, 'Failed to delete note', 500);
  }
}
