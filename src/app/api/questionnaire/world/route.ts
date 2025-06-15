// File: src/app/api/questionnaire/world/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { updateUserAiProfile } from '@/lib/services/profileAiService';

// Define the WorldId type and validation schema
const WorldId = z.enum(["VALUES", "RELATIONSHIP", "PERSONALITY", "PARTNER", "RELIGION"]);
type WorldId = z.infer<typeof WorldId>;

// Schema for a single answer within a world submission
const answerSchema = z.object({
  questionId: z.string().min(1),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.array(z.number()),
    z.record(z.string(), z.number()),
    z.null(),
    z.undefined()
  ]).optional(),
  answeredAt: z.string().datetime().transform((str) => new Date(str)), // Convert to Date object
  isVisible: z.boolean().default(true),
});

// Main schema for submitting answers for a whole world
const worldAnswersSchema = z.object({
  worldId: WorldId,
  answers: z.array(answerSchema),
});

type AnswerPayload = z.infer<typeof answerSchema>;

export async function PUT(req: Request) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // 2. Parse and validate request body
    const body = await req.json();
    const validationResult = worldAnswersSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("Validation error in /questionnaire/world:", validationResult.error);
      return NextResponse.json({ success: false, error: "Invalid request data", details: validationResult.error.flatten() }, { status: 400 });
    }
    const { worldId, answers: newAnswers } = validationResult.data;
    
    // Map worldId to the corresponding DB field name
    const dbAnswersKey = `${worldId.toLowerCase()}Answers` as keyof Prisma.QuestionnaireResponseCreateInput;
    const dbCompletedKey = `${worldId.toLowerCase()}Completed` as keyof Prisma.QuestionnaireResponseCreateInput;

    // 3. Upsert the questionnaire response
    const updatedQuestionnaire = await prisma.$transaction(async (tx) => {
      // Find the existing response for the user
      const existingResponse = await tx.questionnaireResponse.findFirst({
        where: { userId },
      });

      // Prepare the JSON data for the answers
      const newAnswersJson = newAnswers.map(ans => ({
        ...ans,
        answeredAt: ans.answeredAt.toISOString(), // Ensure date is stored as string
      })) as unknown as Prisma.JsonArray; // Cast to Prisma.JsonArray

      // Create or update the questionnaire
      const questionnaire = await tx.questionnaireResponse.upsert({
        where: { id: existingResponse?.id || 'new-response-placeholder' }, // a dummy id for create case
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
          [dbAnswersKey]: newAnswersJson, // Replace all answers for this world
          [dbCompletedKey]: true,
          worldsCompleted: {
            push: worldId, // Add to the array of completed worlds
          },
        },
      });
      return questionnaire;
    });

    // 4. Trigger the AI profile update in the background
    updateUserAiProfile(userId).catch(err => {
        console.error(`[AI Profile Trigger - World Update] Failed to update AI profile for user ${userId} after updating world ${worldId}:`, err);
    });

    // 5. Return success response
    return NextResponse.json({
      success: true,
      message: `Successfully saved answers for world: ${worldId}`,
      data: updatedQuestionnaire,
    });

  } catch (error: unknown) {
    console.error("Error in PUT /api/questionnaire/world:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Validation error", details: error.issues }, { status: 400 });
    }
    
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}