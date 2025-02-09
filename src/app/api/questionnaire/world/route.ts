import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Define the WorldId type and validation schema
const WorldId = z.enum(["VALUES", "RELATIONSHIP", "PERSONALITY", "PARTNER", "RELIGION"]);
type WorldId = z.infer<typeof WorldId>;

// Schema for world answers
const worldAnswersSchema = z.object({
  worldId: WorldId,
  answers: z.array(z.object({
    questionId: z.string(),
    value: z.union([
      z.string(),
      z.number(),
      z.array(z.string()),
      z.array(z.number()),
      z.record(z.string(), z.number()),
      z.null(),
      z.undefined()
    ]).optional(),
    answeredAt: z.string().datetime()
  }))
});

export async function PUT(req: Request) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "נדרשת התחברות" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = worldAnswersSchema.parse(body);

    // Get existing questionnaire or create new one
    let questionnaire = await prisma.questionnaireResponse.findFirst({
      where: { userId: session.user.id }
    });

    const updateData: any = {
      lastSaved: new Date()
    };

    // Set answers and completion status based on worldId
    switch (validatedData.worldId) {
      case "VALUES":
        updateData.valuesAnswers = validatedData.answers;
        updateData.valuesCompleted = true;
        break;
      case "PERSONALITY":
        updateData.personalityAnswers = validatedData.answers;
        updateData.personalityCompleted = true;
        break;
      case "RELATIONSHIP":
        updateData.relationshipAnswers = validatedData.answers;
        updateData.relationshipCompleted = true;
        break;
      case "PARTNER":
        updateData.partnerAnswers = validatedData.answers;
        updateData.partnerCompleted = true;
        break;
      case "RELIGION":
        updateData.religionAnswers = validatedData.answers;
        updateData.religionCompleted = true;
        break;
    }

    // Update or create questionnaire
    if (questionnaire) {
      questionnaire = await prisma.questionnaireResponse.update({
        where: { id: questionnaire.id },
        data: {
          ...updateData,
          worldsCompleted: Array.from(new Set([
            ...questionnaire.worldsCompleted,
            validatedData.worldId
          ]))
        }
      });
    } else {
      questionnaire = await prisma.questionnaireResponse.create({
        data: {
          userId: session.user.id,
          startedAt: new Date(),
          worldsCompleted: [validatedData.worldId],
          ...updateData
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: questionnaire
    });

  } catch (error: unknown) {
    console.error("Error saving world answers:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "שגיאת ולידציה",
        details: error.issues
      }, { status: 400 });
    }

    return NextResponse.json({
      error: "אירעה שגיאה בשמירת התשובות"
    }, { status: 500 });
  }
}