import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// Type guards
function isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

// Constants
const WORLD_IDS = ["VALUES", "RELATIONSHIP", "PERSONALITY", "PARTNER", "RELIGION"] as const;

// Zod Schemas
const WorldId = z.enum(WORLD_IDS);
type WorldId = z.infer<typeof WorldId>;

const QuestionAnswer = z.object({
  questionId: z.string().min(1),
  worldId: WorldId,
  value: z.union([
    z.string(),
    z.number(),
    z.array(z.string()),
    z.array(z.number()),
    z.record(z.string(), z.number())
  ]),
  answeredAt: z.string().datetime()
});

type QuestionAnswerType = z.infer<typeof QuestionAnswer>;

const QuestionnaireAnswer = z.object({
  questionId: z.string(),
  worldId: WorldId,
  value: z.union([
    z.string(),
    z.number(),
    z.array(z.string()),
    z.array(z.number()),
    z.record(z.string(), z.number()),
  ]),
  answeredAt: z.string().datetime()
});

const QuestionnaireSubmission = z.object({
  userId: z.string(),
  answers: z.array(QuestionnaireAnswer),
  worldsCompleted: z.array(WorldId),
  completed: z.boolean(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional()
});

type QuestionnaireSubmission = z.infer<typeof QuestionnaireSubmission>;

/**
 * Groups answers by world ID and formats them for database storage
 */
function groupAnswersByWorld(answers: QuestionnaireSubmission["answers"]) {
  return answers.reduce<Record<string, QuestionAnswerType[]>>((acc, answer) => {
    const worldKey = `${answer.worldId.toLowerCase()}Answers`;
    const formattedAnswer: QuestionAnswerType = {
      questionId: answer.questionId,
      worldId: answer.worldId,
      value: answer.value,
      answeredAt: answer.answeredAt
    };

    if (!acc[worldKey]) {
      acc[worldKey] = [];
    }
    acc[worldKey].push(formattedAnswer);
    
    return acc;
  }, {});
}

/**
 * Validates that all required fields exist and have correct data types
 */
function validateSubmissionData(data: unknown): z.infer<typeof QuestionnaireSubmission> {
  const validatedData = QuestionnaireSubmission.safeParse(data);
  
  if (!validatedData.success) {
    throw new Error(`Validation Error: ${validatedData.error.message}`);
  }

  return validatedData.data;
}

/**
 * Handles API GET request to retrieve latest questionnaire response
 */
export async function GET() {
  try {
    // 1. Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "נדרשת התחברות" },
        { status: 401 }
      );
    }

    // 2. Fetch latest questionnaire response
    const questionnaire = await prisma.questionnaireResponse.findFirst({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 3. Transform the data for the client if needed
    const transformedData = questionnaire ? {
      ...questionnaire,
      // Convert JSON fields back to arrays if they exist
      valuesAnswers: questionnaire.valuesAnswers || [],
      personalityAnswers: questionnaire.personalityAnswers || [],
      relationshipAnswers: questionnaire.relationshipAnswers || [],
      partnerAnswers: questionnaire.partnerAnswers || [],
      religionAnswers: questionnaire.religionAnswers || [],
    } : null;

    // 4. Return response
    return NextResponse.json({
      success: true,
      data: transformedData
    });

  } catch (error: unknown) {
    console.error("Error fetching questionnaire:", {
      message: isError(error) ? error.message : "Unknown error occurred",
      stack: process.env.NODE_ENV === 'development' ? error : undefined
    });

    return NextResponse.json({
      error: "אירעה שגיאה בטעינת השאלון",
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}

type Answer = {
  questionId: string;
  worldId: WorldId;
  value: string | number | string[] | number[] | Record<string, number>;
  answeredAt: string;
};

type MergedAnswers = {
  valuesAnswers: Answer[];
  personalityAnswers: Answer[];
  relationshipAnswers: Answer[];
  partnerAnswers: Answer[];
  religionAnswers: Answer[];
};

/**
 * Handles API PUT request to save questionnaire responses
 */
export async function PUT(req: Request) {
  try {
    // 1. Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
    }

    // 2. Parse request body
    const rawBody = await req.json();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Request body:', JSON.stringify(rawBody, null, 2));
    }

    // 3. Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "משתמש לא נמצא" },
        { status: 404 }
      );
    }

    // 4. Clean and validate data
    const submissionData = {
      ...rawBody,
      userId: session.user.id,
      answers: rawBody.answers?.filter((answer: Answer) => 
        answer && 
        answer.questionId && 
        answer.worldId && 
        answer.value !== undefined && 
        answer.value !== null && 
        answer.value !== ''
      ) ?? []
    };

    let validatedData: QuestionnaireSubmission;
    try {
      validatedData = validateSubmissionData(submissionData);
    } catch (error) {
      return NextResponse.json({
        error: "שגיאת ולידציה",
        details: isError(error) ? error.message : 'Unknown validation error'
      }, { status: 400 });
    }

    // 5. Group answers by world
    const answersGroupedByWorld = groupAnswersByWorld(validatedData.answers);

    // 6. Save data using upsert
    const result = await prisma.$transaction(async (prisma) => {
      // Try to find existing response
      const existingResponse = await prisma.questionnaireResponse.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' }
      });

      // Merge existing and new answers
      const mergedAnswers: MergedAnswers = {
        valuesAnswers: [...(existingResponse?.valuesAnswers as Answer[] || []), ...(answersGroupedByWorld.valuesAnswers || [])],
        personalityAnswers: [...(existingResponse?.personalityAnswers as Answer[] || []), ...(answersGroupedByWorld.personalityAnswers || [])],
        relationshipAnswers: [...(existingResponse?.relationshipAnswers as Answer[] || []), ...(answersGroupedByWorld.relationshipAnswers || [])],
        partnerAnswers: [...(existingResponse?.partnerAnswers as Answer[] || []), ...(answersGroupedByWorld.partnerAnswers || [])],
        religionAnswers: [...(existingResponse?.religionAnswers as Answer[] || []), ...(answersGroupedByWorld.religionAnswers || [])]
      };

      // Remove duplicate answers (keep latest version of each answer)
      for (const worldKey in mergedAnswers) {
        const answers = mergedAnswers[worldKey as keyof MergedAnswers];
        if (Array.isArray(answers)) {
          const uniqueAnswers = answers.reduce((acc: Answer[], curr: Answer) => {
            const existingIndex = acc.findIndex(a => a.questionId === curr.questionId);
            if (existingIndex >= 0) {
              // Replace existing answer if new one is more recent
              if (new Date(curr.answeredAt) > new Date(acc[existingIndex].answeredAt)) {
                acc[existingIndex] = curr;
              }
            } else {
              acc.push(curr);
            }
            return acc;
          }, []);
          mergedAnswers[worldKey as keyof MergedAnswers] = uniqueAnswers;
        }
      }

      // Update or create response
      const savedQuestionnaire = await prisma.questionnaireResponse.upsert({
        where: {
          id: existingResponse?.id || 'new-response',
        },
        create: {
          userId: session.user.id,
          ...mergedAnswers,
          worldsCompleted: validatedData.worldsCompleted,
          completed: validatedData.completed,
          startedAt: new Date(validatedData.startedAt),
          completedAt: validatedData.completedAt ? new Date(validatedData.completedAt) : null,
          valuesCompleted: validatedData.worldsCompleted.includes("VALUES"),
          personalityCompleted: validatedData.worldsCompleted.includes("PERSONALITY"),
          relationshipCompleted: validatedData.worldsCompleted.includes("RELATIONSHIP"),
          partnerCompleted: validatedData.worldsCompleted.includes("PARTNER"),
          religionCompleted: validatedData.worldsCompleted.includes("RELIGION"),
          lastSaved: new Date()
        },
        update: {
          ...mergedAnswers,
          worldsCompleted: validatedData.worldsCompleted,
          completed: validatedData.completed,
          completedAt: validatedData.completedAt ? new Date(validatedData.completedAt) : null,
          valuesCompleted: validatedData.worldsCompleted.includes("VALUES"),
          personalityCompleted: validatedData.worldsCompleted.includes("PERSONALITY"),
          relationshipCompleted: validatedData.worldsCompleted.includes("RELATIONSHIP"),
          partnerCompleted: validatedData.worldsCompleted.includes("PARTNER"),
          religionCompleted: validatedData.worldsCompleted.includes("RELIGION"),
          lastSaved: new Date()
        }
      });

      // Update user status if questionnaire is completed
      if (validatedData.completed) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: { status: "ACTIVE" }
        });
      }

      return savedQuestionnaire;
    });

    // 7. Return success response
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: unknown) {
    // Safe error logging with type checking
    const errorMessage = isError(error) ? error.message : "Unknown error occurred";
    const errorStack = isError(error) ? error.stack : undefined;

    console.error("Error details:", {
      message: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
    });

    // Handle Prisma specific errors
    if (isPrismaError(error)) {
      switch (error.code) {
        case 'P2003':
          return NextResponse.json({
            error: "שגיאה בשמירת השאלון - משתמש לא קיים",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
          }, { status: 400 });
        case 'P2002':
          return NextResponse.json({
            error: "שגיאה בשמירת השאלון - רשומה כבר קיימת",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
          }, { status: 409 });
        default:
          return NextResponse.json({
            error: "שגיאה בשמירת השאלון",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
          }, { status: 500 });
      }
    }

    // Handle general errors
    return NextResponse.json({
      error: "אירעה שגיאה בשמירת השאלון",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}