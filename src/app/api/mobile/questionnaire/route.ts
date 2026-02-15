// src/app/api/mobile/questionnaire/route.ts
// ==========================================
// NeshamaTech Mobile API - Questionnaire Responses
// GET: Get formatted questionnaire | PATCH: Update visibility/delete answer
// ==========================================

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Locale } from '../../../../../i18n-config';
import { formatAnswers, KEY_MAPPING } from '@/lib/questionnaireFormatter';
import type { FormattedAnswersType } from '@/lib/questionnaireFormatter';
import type { WorldId, UpdateValue } from '@/types/next-auth';
import { formatQuestionnaireForDisplay } from '@/lib/services/questionnaireService';
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from '@/lib/mobile-auth';

export const dynamic = 'force-dynamic';

type JsonAnswerData = {
  questionId: string;
  value: Prisma.JsonValue;
  answeredAt: string;
  isVisible: boolean;
};

// ---- OPTIONS ----
export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

// ---- GET: Formatted questionnaire responses ----
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) {
      return corsError(req, 'Unauthorized', 401);
    }

    const url = new URL(req.url);
    const locale = (url.searchParams.get('locale') as Locale) || 'he';

    const rawQuestionnaire = await prisma.questionnaireResponse.findFirst({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!rawQuestionnaire) {
      return corsJson(req, {
        success: true,
        questionnaireResponse: null,
      });
    }

    // Format for display using the shared service
    const formattedQuestionnaire = await formatQuestionnaireForDisplay(
      rawQuestionnaire,
      locale,
      true // own profile → can view all answers
    );

    return corsJson(req, {
      success: true,
      questionnaireResponse: formattedQuestionnaire,
    });
  } catch (error) {
    console.error('[Mobile Questionnaire GET] Error:', error);
    return corsError(req, 'Failed to fetch questionnaire', 500);
  }
}

// ---- PATCH: Update answer visibility or delete answer ----
export async function PATCH(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) {
      return corsError(req, 'Unauthorized', 401);
    }

    let body: { worldKey: string; questionId: string; value: UpdateValue };
    try {
      body = await req.json();
    } catch {
      return corsError(req, 'Invalid JSON body', 400);
    }

    const { worldKey: rawWorldKey, questionId, value } = body;

    // Normalize to UPPERCASE
    const worldKey = rawWorldKey?.toUpperCase() as WorldId;

    if (!worldKey || !questionId || !value || !value.type || !KEY_MAPPING[worldKey]) {
      return corsError(req, 'Invalid request body', 400);
    }

    const dbKey = KEY_MAPPING[worldKey];

    const questionnaire = await prisma.questionnaireResponse.findFirst({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!questionnaire) {
      return corsError(req, 'Questionnaire not found', 404);
    }

    const currentAnswersJson = questionnaire[dbKey];
    const currentAnswers = Array.isArray(currentAnswersJson)
      ? (currentAnswersJson as unknown as JsonAnswerData[])
      : [];

    let updatedAnswers: JsonAnswerData[];

    if (value.type === 'delete') {
      updatedAnswers = currentAnswers.filter((a) => a.questionId !== questionId);
    } else if (value.type === 'visibility') {
      const existingIdx = currentAnswers.findIndex((a) => a.questionId === questionId);
      if (existingIdx === -1) {
        return corsError(req, 'Answer not found', 404);
      }
      if (typeof value.isVisible !== 'boolean') {
        return corsError(req, 'Invalid visibility value', 400);
      }
      updatedAnswers = [...currentAnswers];
      updatedAnswers[existingIdx] = {
        ...currentAnswers[existingIdx],
        isVisible: value.isVisible,
        answeredAt: new Date().toISOString(),
      };
    } else if (value.type === 'answer') {
      if (value.value === undefined) {
        return corsError(req, 'Missing answer value', 400);
      }
      const existingIdx = currentAnswers.findIndex((a) => a.questionId === questionId);
      const updatedAnswer: JsonAnswerData = {
        questionId,
        value: value.value as Prisma.JsonValue,
        isVisible: existingIdx !== -1 ? currentAnswers[existingIdx].isVisible : true,
        answeredAt: new Date().toISOString(),
      };
      updatedAnswers = [...currentAnswers];
      if (existingIdx !== -1) {
        updatedAnswers[existingIdx] = updatedAnswer;
      } else {
        updatedAnswers.push(updatedAnswer);
      }
    } else {
      return corsError(req, 'Invalid update type', 400);
    }

    const updated = await prisma.questionnaireResponse.update({
      where: { id: questionnaire.id },
      data: {
        [dbKey]: updatedAnswers as Prisma.JsonValue,
        lastSaved: new Date(),
      },
    });

    await prisma.profile.update({
      where: { userId: auth.userId },
      data: { needsAiProfileUpdate: true, contentUpdatedAt: new Date() },
    });

    await prisma.user.update({
      where: { id: auth.userId },
      data: { updatedAt: new Date() },
    });

    // Build formatted response
    const formattedAnswers: Partial<FormattedAnswersType> = {};
    (Object.keys(KEY_MAPPING) as WorldId[]).forEach((key) => {
      const currentDbKey = KEY_MAPPING[key];
      formattedAnswers[key] = formatAnswers(updated[currentDbKey]);
    });

    return corsJson(req, {
      success: true,
      data: {
        ...updated,
        formattedAnswers,
      },
    });
  } catch (error) {
    console.error('[Mobile Questionnaire PATCH] Error:', error);
    return corsError(req, 'Failed to update questionnaire', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    // Check if questionnaire already exists
    const existing = await prisma.questionnaireResponse.findFirst({
      where: { userId: auth.userId },
    });

    if (existing) {
      return corsJson(req, { success: true, data: existing });
    }

    // Create new empty questionnaire
    const now = new Date();
    const questionnaire = await prisma.questionnaireResponse.create({
      data: {
        userId: auth.userId,
        personalityAnswers: [],
        valuesAnswers: [],
        relationshipAnswers: [],
        partnerAnswers: [],
        religionAnswers: [],
        completed: false,
        startedAt: now,
        lastSaved: now,
      },
    });

    return corsJson(req, { success: true, data: questionnaire });
  } catch (error) {
    console.error('[Mobile Questionnaire POST] Error:', error);
    return corsError(req, 'Failed to create questionnaire', 500);
  }
}
