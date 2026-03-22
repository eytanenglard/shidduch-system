// src/app/api/mobile/questionnaire/world/route.ts
// ==============================================
// NeshamaTech Mobile API - Save questionnaire answers per world
// PUT: Save world answers and mark world as completed
// ==============================================

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from '@/lib/mobile-auth';

export const dynamic = 'force-dynamic';

const WORLD_IDS = ['VALUES', 'RELATIONSHIP', 'PERSONALITY', 'PARTNER', 'RELIGION'] as const;
type WorldId = (typeof WORLD_IDS)[number];

type AnswerInput = {
  questionId: string;
  value: Prisma.JsonValue;
  answeredAt: string;
  isVisible?: boolean;
};

// ---- OPTIONS ----
export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

// ---- PUT: Save world answers ----
export async function PUT(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) {
      return corsError(req, 'Unauthorized', 401);
    }

    let body: { worldId: string; answers: AnswerInput[] };
    try {
      body = await req.json();
    } catch {
      return corsError(req, 'Invalid JSON body', 400);
    }

    const { worldId: rawWorldId, answers } = body;

    // Normalize to UPPERCASE
    const worldId = rawWorldId?.toUpperCase() as WorldId;

    if (!worldId || !WORLD_IDS.includes(worldId)) {
      return corsError(req, 'Invalid worldId', 400);
    }

    if (!Array.isArray(answers)) {
      return corsError(req, 'answers must be an array', 400);
    }

    const dbAnswersKey = `${worldId.toLowerCase()}Answers` as keyof Prisma.QuestionnaireResponseCreateInput;
    const dbCompletedKey = `${worldId.toLowerCase()}Completed` as keyof Prisma.QuestionnaireResponseCreateInput;

    const newAnswersJson = answers.map((ans) => ({
      questionId: ans.questionId,
      value: ans.value,
      answeredAt: ans.answeredAt,
      isVisible: ans.isVisible !== undefined ? ans.isVisible : true,
    })) as unknown as Prisma.JsonArray;

    const updatedQuestionnaire = await prisma.$transaction(async (tx) => {
      const existingResponse = await tx.questionnaireResponse.findFirst({
        where: { userId: auth.userId },
      });

      await tx.profile.update({
        where: { userId: auth.userId },
        data: {
          needsAiProfileUpdate: true,
          contentUpdatedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: auth.userId },
        data: { updatedAt: new Date() },
      });

      const questionnaire = await tx.questionnaireResponse.upsert({
        where: { id: existingResponse?.id || 'new-response-placeholder' },
        create: {
          userId: auth.userId,
          startedAt: new Date(),
          lastSaved: new Date(),
          [dbAnswersKey]: newAnswersJson,
          [dbCompletedKey]: true,
          worldsCompleted: [worldId],
        },
        update: {
          lastSaved: new Date(),
          [dbAnswersKey]: newAnswersJson,
          [dbCompletedKey]: true,
          worldsCompleted: {
            push: worldId,
          },
        },
      });

      return questionnaire;
    });

    return corsJson(req, {
      success: true,
      message: `Successfully saved answers for world: ${worldId}`,
      data: updatedQuestionnaire,
    });
  } catch (error) {
    console.error('[Mobile Questionnaire World PUT] Error:', error);
    return corsError(req, 'Failed to save world answers', 500);
  }
}
