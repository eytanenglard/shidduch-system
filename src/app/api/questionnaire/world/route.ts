// File: src/app/api/questionnaire/world/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const WorldId = z.enum([
  'VALUES',
  'RELATIONSHIP',
  'PERSONALITY',
  'PARTNER',
  'RELIGION',
]);
type WorldId = z.infer<typeof WorldId>;

const answerSchema = z.object({
  questionId: z.string().min(1),
  value: z
    .union([
      z.string(),
      z.number(),
      z.boolean(),
      z.array(z.string()),
      z.array(z.number()),
      z.record(z.string(), z.number()),
      z.null(),
      z.undefined(),
    ])
    .optional(),
  answeredAt: z
    .string()
    .datetime()
    .transform((str) => new Date(str)),
  isVisible: z.boolean().optional().default(true), // הוספת השדה
});

const worldAnswersSchema = z.object({
  worldId: WorldId,
  answers: z.array(answerSchema),
});


export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const userId = session.user.id;

    const body = await req.json();
    const validationResult = worldAnswersSchema.safeParse(body);
    if (!validationResult.success) {
      console.error(
        'Validation error in /questionnaire/world:',
        validationResult.error
      );
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }
    const { worldId, answers: newAnswers } = validationResult.data;

    const dbAnswersKey =
      `${worldId.toLowerCase()}Answers` as keyof Prisma.QuestionnaireResponseCreateInput;
    const dbCompletedKey =
      `${worldId.toLowerCase()}Completed` as keyof Prisma.QuestionnaireResponseCreateInput;

    const updatedQuestionnaire = await prisma.$transaction(async (tx) => {
      const existingResponse = await tx.questionnaireResponse.findFirst({
        where: { userId },
      });
   await tx.profile.update({
        where: { userId },
         data: { 
            needsAiProfileUpdate: true,
            // ✅ הוסף שורה זו:
            contentUpdatedAt: new Date() 
        }
      });
      await tx.user.update({
  where: { id: userId },
  data: { updatedAt: new Date() }
});

      const newAnswersJson = newAnswers.map((ans) => ({
        ...ans,
        answeredAt: ans.answeredAt.toISOString(),
      })) as unknown as Prisma.JsonArray;

      const questionnaire = await tx.questionnaireResponse.upsert({
        where: { id: existingResponse?.id || 'new-response-placeholder' },
        create: {
          userId,
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

    return NextResponse.json({
      success: true,
      message: `Successfully saved answers for world: ${worldId}`,
      data: updatedQuestionnaire,
    });
  } catch (error: unknown) {
    console.error('Error in PUT /api/questionnaire/world:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
