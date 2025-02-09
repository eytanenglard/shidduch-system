import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { FormattedAnswer } from "@/types/next-auth";

interface AnswersByWorld {
  values: FormattedAnswer[];
  personality: FormattedAnswer[];
  relationship: FormattedAnswer[];
  partner: FormattedAnswer[];
  religion: FormattedAnswer[];
}

// Helper function to format a single answer
const formatAnswer = (question: string, value: any, answeredAt: Date, isVisible = true): FormattedAnswer => {
  return {
    questionId: question,
    question,
    value,
    displayText: typeof value === 'object' ? value.text || JSON.stringify(value) : String(value),
    answeredAt: answeredAt.toISOString(),
    isVisible
  };
};

// Helper function to format answers for a specific world
const formatWorldAnswers = (worldAnswers: Record<string, any> | null, answeredAt: Date): FormattedAnswer[] => {
  if (!worldAnswers) return [];
  
  return Object.entries(worldAnswers).map(([question, value]) => 
    formatAnswer(question, value, answeredAt)
  );
};

// Main function to format all answers
const formatQuestionnaireAnswers = (questionnaireResponse: any): AnswersByWorld => {
  const answeredAt = questionnaireResponse.updatedAt || questionnaireResponse.createdAt;
  
  return {
    values: formatWorldAnswers(questionnaireResponse.valuesAnswers, answeredAt),
    personality: formatWorldAnswers(questionnaireResponse.personalityAnswers, answeredAt),
    relationship: formatWorldAnswers(questionnaireResponse.relationshipAnswers, answeredAt),
    partner: formatWorldAnswers(questionnaireResponse.partnerAnswers, answeredAt),
    religion: formatWorldAnswers(questionnaireResponse.religionAnswers, answeredAt)
  };
};

export async function GET(
  request: NextRequest,
  context: { params: { userId: string } }
) {
  const { userId } = context.params;

  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // בדיקה שהמשתמש הוא שדכן (אופציונלי)
    if (session.user.role !== 'MATCHMAKER' && session.user.id !== userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const questionnaireResponse = await prisma.questionnaireResponse.findFirst({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!questionnaireResponse) {
      return NextResponse.json({
        success: true,
        questionnaireResponse: null
      });
    }

    // Format the questionnaire response
    const formattedAnswers = formatQuestionnaireAnswers(questionnaireResponse);

    // Return the response with formatted answers
    return NextResponse.json({
      success: true,
      questionnaireResponse: {
        ...questionnaireResponse,
        formattedAnswers
      }
    });

  } catch (error) {
    console.error("Failed to fetch questionnaire:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch questionnaire" },
      { status: 500 }
    );
  }
}