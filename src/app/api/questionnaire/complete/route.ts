import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const WorldId = z.enum(["VALUES", "RELATIONSHIP", "PERSONALITY", "PARTNER", "RELIGION"]);

const completionSchema = z.object({
  worldsCompleted: z.array(WorldId),
  completed: z.boolean(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime()
});

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "נדרשת התחברות" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = completionSchema.parse(body);

    // Verify all required worlds are completed
    const requiredWorlds = ["VALUES", "RELATIONSHIP", "PERSONALITY", "PARTNER", "RELIGION"] as const;
    const allWorldsCompleted = requiredWorlds.every(
      world => validatedData.worldsCompleted.includes(world)
    );

    if (!allWorldsCompleted) {
      return NextResponse.json({
        error: "לא כל העולמות הושלמו"
      }, { status: 400 });
    }

    const questionnaire = await prisma.questionnaireResponse.findFirst({
      where: { userId: session.user.id }
    });

    if (!questionnaire) {
      return NextResponse.json({
        error: "לא נמצא שאלון להשלמה"
      }, { status: 404 });
    }

    // Update questionnaire and user status in a transaction
    const result = await prisma.$transaction([
      prisma.questionnaireResponse.update({
        where: { id: questionnaire.id },
        data: {
          completed: true,
          completedAt: new Date(validatedData.completedAt),
          worldsCompleted: validatedData.worldsCompleted,
          lastSaved: new Date()
        }
      }),
     prisma.user.update({
  where: { id: session.user.id },
  data: { 
    status: "ACTIVE",
    updatedAt: new Date() // 🆕 הוסף
  }
})

    ]);

    return NextResponse.json({
      success: true,
      data: result[0]
    });

  } catch (error: unknown) {
    console.error("Error completing questionnaire:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "שגיאת ולידציה",
        details: error.issues
      }, { status: 400 });
    }

    return NextResponse.json({
      error: "אירעה שגיאה בהשלמת השאלון"
    }, { status: 500 });
  }
}