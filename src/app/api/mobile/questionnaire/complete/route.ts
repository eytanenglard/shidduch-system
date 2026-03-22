// src/app/api/mobile/questionnaire/complete/route.ts
// ==================================================
// NeshamaTech Mobile API - Mark questionnaire as fully completed
// PUT: Mark all worlds as done, set user status to ACTIVE
// ==================================================

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from '@/lib/mobile-auth';

export const dynamic = 'force-dynamic';

const REQUIRED_WORLDS = ['VALUES', 'RELATIONSHIP', 'PERSONALITY', 'PARTNER', 'RELIGION'] as const;
type WorldId = (typeof REQUIRED_WORLDS)[number];

// ---- OPTIONS ----
export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

// ---- PUT: Complete questionnaire ----
export async function PUT(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) {
      return corsError(req, 'Unauthorized', 401);
    }

    let body: {
      worldsCompleted: string[];
      completed: boolean;
      startedAt: string;
      completedAt: string;
    };
    try {
      body = await req.json();
    } catch {
      return corsError(req, 'Invalid JSON body', 400);
    }

    const { worldsCompleted, completedAt } = body;

    if (!Array.isArray(worldsCompleted)) {
      return corsError(req, 'worldsCompleted must be an array', 400);
    }

    // Verify all required worlds are completed
    const allWorldsCompleted = REQUIRED_WORLDS.every((world) =>
      (worldsCompleted as string[]).includes(world)
    );

    if (!allWorldsCompleted) {
      const missing = REQUIRED_WORLDS.filter(
        (w) => !(worldsCompleted as string[]).includes(w)
      );
      return corsError(req, `Missing worlds: ${missing.join(', ')}`, 400);
    }

    const questionnaire = await prisma.questionnaireResponse.findFirst({
      where: { userId: auth.userId },
    });

    if (!questionnaire) {
      return corsError(req, 'Questionnaire not found', 404);
    }

    const result = await prisma.$transaction([
      prisma.questionnaireResponse.update({
        where: { id: questionnaire.id },
        data: {
          completed: true,
          completedAt: completedAt ? new Date(completedAt) : new Date(),
          worldsCompleted: worldsCompleted as WorldId[],
          valuesCompleted: (worldsCompleted as string[]).includes('VALUES'),
          personalityCompleted: (worldsCompleted as string[]).includes('PERSONALITY'),
          relationshipCompleted: (worldsCompleted as string[]).includes('RELATIONSHIP'),
          partnerCompleted: (worldsCompleted as string[]).includes('PARTNER'),
          religionCompleted: (worldsCompleted as string[]).includes('RELIGION'),
          lastSaved: new Date(),
        },
      }),
      prisma.user.update({
        where: { id: auth.userId },
        data: {
          status: 'ACTIVE',
          updatedAt: new Date(),
        },
      }),
    ]);

    return corsJson(req, {
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error('[Mobile Questionnaire Complete PUT] Error:', error);
    return corsError(req, 'Failed to complete questionnaire', 500);
  }
}
