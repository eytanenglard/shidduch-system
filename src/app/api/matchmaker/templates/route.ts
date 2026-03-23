// =============================================================================
// src/app/api/matchmaker/templates/route.ts
// =============================================================================
// CRUD for quick reply templates (system-wide + per-matchmaker)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const templateSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(2000),
  category: z.string().max(50).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

const updateSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(100).optional(),
  content: z.string().min(1).max(2000).optional(),
  category: z.string().max(50).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// =============================================================================
// GET — Fetch all templates (system + matchmaker's own)
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

    const matchmakerId = session.user.id;

    const templates = await prisma.quickReplyTemplate.findMany({
      where: {
        OR: [
          { matchmakerId: null }, // System-wide
          { matchmakerId },      // Matchmaker's own
        ],
        isActive: true,
      },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { title: 'asc' }],
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        sortOrder: true,
        isActive: true,
        matchmakerId: true,
        createdAt: true,
      },
    });

    // Group by category
    const grouped: Record<string, typeof templates> = {};
    for (const t of templates) {
      const cat = t.category || 'general';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(t);
    }

    return NextResponse.json({
      success: true,
      templates,
      grouped,
    });
  } catch (error) {
    console.error('[matchmaker/templates] GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// =============================================================================
// POST — Create a new template
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
    const parsed = templateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, content, category, sortOrder } = parsed.data;

    const template = await prisma.quickReplyTemplate.create({
      data: {
        title,
        content,
        category: category || null,
        sortOrder: sortOrder ?? 0,
        matchmakerId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error('[matchmaker/templates] POST Error:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}

// =============================================================================
// PATCH — Update an existing template
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
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...updates } = parsed.data;

    // Verify ownership (can only edit own templates, not system ones)
    const existing = await prisma.quickReplyTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    if (existing.matchmakerId !== session.user.id && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Cannot edit system templates' }, { status: 403 });
    }

    const template = await prisma.quickReplyTemplate.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error('[matchmaker/templates] PATCH Error:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

// =============================================================================
// DELETE — Soft-delete (set isActive=false) or hard-delete own template
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
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    const existing = await prisma.quickReplyTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    if (existing.matchmakerId !== session.user.id && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Cannot delete system templates' }, { status: 403 });
    }

    await prisma.quickReplyTemplate.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[matchmaker/templates] DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
