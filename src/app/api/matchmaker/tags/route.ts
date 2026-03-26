// src/app/api/matchmaker/tags/route.ts
// CRUD for matchmaker custom tags + assign/unassign to candidates

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

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

// ─── Auth Helper ──────────────────────────────────────────────────────────────

async function getMatchmakerSession() {
  const session = await getServerSession(authOptions);
  if (
    !session?.user ||
    (session.user.role !== UserRole.MATCHMAKER &&
      session.user.role !== UserRole.ADMIN)
  ) {
    return null;
  }
  return session;
}

// ─── GET: Fetch all tags for current matchmaker ───────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const session = await getMatchmakerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tags = await prisma.matchmakerCustomTag.findMany({
      where: { matchmakerId: session.user.id },
      include: {
        _count: { select: { candidates: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
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
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── POST: Create tag or assign tag to candidate ──────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await getMatchmakerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action || 'create';

    if (action === 'assign') {
      const parsed = assignTagSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      // Verify the tag belongs to this matchmaker
      const tag = await prisma.matchmakerCustomTag.findFirst({
        where: { id: parsed.data.tagId, matchmakerId: session.user.id },
      });
      if (!tag) {
        return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
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
        return NextResponse.json({ success: true, assigned: false });
      }

      await prisma.candidateTag.create({
        data: {
          tagId: parsed.data.tagId,
          userId: parsed.data.userId,
        },
      });
      return NextResponse.json({ success: true, assigned: true });
    }

    // Default: create tag
    const parsed = createTagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = await prisma.matchmakerCustomTag.findUnique({
      where: {
        matchmakerId_name: {
          matchmakerId: session.user.id,
          name: parsed.data.name,
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Tag with this name already exists' },
        { status: 409 }
      );
    }

    const tag = await prisma.matchmakerCustomTag.create({
      data: {
        matchmakerId: session.user.id,
        name: parsed.data.name,
        color: parsed.data.color ?? '#6366f1',
      },
    });

    return NextResponse.json({
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
    console.error('Error creating/assigning tag:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── PATCH: Update tag name or color ──────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const session = await getMatchmakerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateTagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const tag = await prisma.matchmakerCustomTag.findFirst({
      where: { id: parsed.data.tagId, matchmakerId: session.user.id },
    });
    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    const updated = await prisma.matchmakerCustomTag.update({
      where: { id: parsed.data.tagId },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.color !== undefined && { color: parsed.data.color }),
      },
    });

    return NextResponse.json({
      success: true,
      tag: { id: updated.id, name: updated.name, color: updated.color },
    });
  } catch (error) {
    console.error('Error updating tag:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── DELETE: Delete a tag entirely ────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const session = await getMatchmakerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tagId } = await request.json();
    if (!tagId) {
      return NextResponse.json(
        { error: 'tagId is required' },
        { status: 400 }
      );
    }

    const tag = await prisma.matchmakerCustomTag.findFirst({
      where: { id: tagId, matchmakerId: session.user.id },
    });
    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    await prisma.matchmakerCustomTag.delete({ where: { id: tagId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
