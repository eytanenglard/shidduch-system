// src/app/api/questionnaire/update/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { answers } = await req.json();

    // קודם נמצא את השאלון של המשתמש
    const existingQuestionnaire = await prisma.questionnaireResponse.findFirst({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!existingQuestionnaire) {
      return NextResponse.json(
        { success: false, error: "Questionnaire not found" },
        { status: 404 }
      );
    }

    // עכשיו נעדכן אותו עם ה-ID הנכון
    const updatedQuestionnaire = await prisma.questionnaireResponse.update({
      where: {
        id: existingQuestionnaire.id  // משתמשים ב-ID הייחודי
      },
      data: {
        answers: answers,
      }
    });

    return NextResponse.json({
      success: true,
      questionnaireResponse: updatedQuestionnaire,
    });

  } catch (error) {
    console.error("Failed to update questionnaire:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update questionnaire" },
      { status: 500 }
    );
  }
}