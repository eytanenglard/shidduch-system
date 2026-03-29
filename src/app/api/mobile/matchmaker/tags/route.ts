// =============================================================================
// src/app/api/mobile/matchmaker/tags/route.ts
// =============================================================================
// CRUD for matchmaker custom tags + assign/unassign to candidates (Mobile JWT)
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

const createTagSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

const updateTagSchema = z.object({
  tagId: z.string().min(1),
  name: z.string().min(1).max(50).trim().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

const assignTagSchema = z.object({
  tagId: z.string().min(1),
  userId: z.string().min(1),
});

// ─── OPTIONS ──────────────────────────────────────────────────────────────────

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

// ─── GET: Fetch all tags for current matchmaker ───────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    if (auth.role !== UserRole.MATCHMAKER && auth.role !== UserRole.ADMIN) {
      return corsError(req, 'Insufficient permissions', 403);
    }

    const tags = await prisma.matchmakerCustomTag.findMany({
      where: { matchmakerId: auth.userId },
      include: {
        _count: { select: { candidates: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return corsJson(req, {
      success: true,
      tags: tags.map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
        candidateCount: t._count.candidates,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[Mobile Tags API] GET Error:', error);
    return corsError(req, 'Failed to fetch tags', 500);
  }
}

// ─── POST: Create tag or assign tag to candidate ──────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    if (auth.role !== UserRole.MATCHMAKER && auth.role !== UserRole.ADMIN) {
      return corsError(req, 'Insufficient permissions', 403);
    }

    const body = await req.json();
    const action = body.action || 'create';

    if (action === 'assign') {
      const parsed = assignTagSchema.safeParse(body);
      if (!parsed.success) {
        return corsError(req, 'Invalid input', 400, 'VALIDATION_ERROR');
      }

      // Verify the tag belongs to this matchmaker
      const tag = await prisma.matchmakerCustomTag.findFirst({
        where: { id: parsed.data.tagId, matchmakerId: auth.userId },
      });
      if (!tag) {
        return corsError(req, 'Tag not found', 404);
      }

      // Toggle: if already assigned, unassign
      const existing = await prisma.candidateTag.findUnique({
        where: {
          tagId_userId: {
            tagId: parsed.data.tagId,
            userId: parsed.data.userId,
          },
        },
      });

      if (existing) {
        await prisma.candidateTag.delete({ where: { id: existing.id } });
        return corsJson(req, { success: true, assigned: false });
      }

      await prisma.candidateTag.create({
        data: {
          tagId: parsed.data.tagId,
          userId: parsed.data.userId,
        },
      });
      return corsJson(req, { success: true, assigned: true });
    }

    // Default: create tag
    const parsed = createTagSchema.safeParse(body);
    if (!parsed.success) {
      return corsError(req, 'Invalid input', 400, 'VALIDATION_ERROR');
    }

    // Check for duplicate name
    const existing = await prisma.matchmakerCustomTag.findUnique({
      where: {
        matchmakerId_name: {
          matchmakerId: auth.userId,
          name: parsed.data.name,
        },
      },
    });
    if (existing) {
      return corsError(req, 'Tag with this name already exists', 409, 'CONFLICT');
    }

    const tag = await prisma.matchmakerCustomTag.create({
      data: {
        matchmakerId: auth.userId,
        name: parsed.data.name,
        color: parsed.data.color ?? '#6366f1',
      },
    });

    return corsJson(req, {
      success: true,
      tag: {
        id: tag.id,
        name: tag.name,
        color: tag.color,
        candidateCount: 0,
        createdAt: tag.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Mobile Tags API] POST Error:', error);
    return corsError(req, 'Failed to create/assign tag', 500);
  }
}

// ─── PATCH: Update tag name or color ──────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    if (auth.role !== UserRole.MATCHMAKER && auth.role !== UserRole.ADMIN) {
      return corsError(req, 'Insufficient permissions', 403);
    }

    const body = await req.json();
    const parsed = updateTagSchema.safeParse(body);
    if (!parsed.success) {
      return corsError(req, 'Invalid input', 400, 'VALIDATION_ERROR');
    }

    const tag = await prisma.matchmakerCustomTag.findFirst({
      where: { id: parsed.data.tagId, matchmakerId: auth.userId },
    });
    if (!tag) {
      return corsError(req, 'Tag not found', 404);
    }

    const updated = await prisma.matchmakerCustomTag.update({
      where: { id: parsed.data.tagId },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.color !== undefined && { color: parsed.data.color }),
      },
    });

    return corsJson(req, {
      success: true,
      tag: { id: updated.id, name: updated.name, color: updated.color },
    });
  } catch (error) {
    console.error('[Mobile Tags API] PATCH Error:', error);
    return corsError(req, 'Failed to update tag', 500);
  }
}

// ─── DELETE: Delete a tag entirely ────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    if (auth.role !== UserRole.MATCHMAKER && auth.role !== UserRole.ADMIN) {
      return corsError(req, 'Insufficient permissions', 403);
    }

    const { tagId } = await req.json();
    if (!tagId) {
      return corsError(req, 'tagId is required', 400, 'VALIDATION_ERROR');
    }

    const tag = await prisma.matchmakerCustomTag.findFirst({
      where: { id: tagId, matchmakerId: auth.userId },
    });
    if (!tag) {
      return corsError(req, 'Tag not found', 404);
    }

    await prisma.matchmakerCustomTag.delete({ where: { id: tagId } });

    return corsJson(req, { success: true });
  } catch (error) {
    console.error('[Mobile Tags API] DELETE Error:', error);
    return corsError(req, 'Failed to delete tag', 500);
  }
}
