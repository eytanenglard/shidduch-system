// ============================================================
// NeshamaTech - Update Profile Metrics & Vectors API
// src/app/api/admin/profiles/[profileId]/update-metrics/route.ts
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { updateProfileVectorsAndMetrics } from '@/lib/services/dualVectorService';

// ═══════════════════════════════════════════════════════════════
// POST - עדכון מדדים ווקטורים לפרופיל בודד
// ═══════════════════════════════════════════════════════════════

export async function POST(
  request: NextRequest,
  { params }: { params: { profileId: string } }
) {
  try {
    // בדיקת הרשאות (רק אדמין/שדכן)
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'MATCHMAKER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { profileId } = params;

    // וידוא שהפרופיל קיים
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, userId: true, gender: true },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    console.log(`[API] Starting metrics/vectors update for profile: ${profileId}`);
    const startTime = Date.now();

    // הפעלת העדכון
    const result = await updateProfileVectorsAndMetrics(profileId);

    const duration = Date.now() - startTime;

    // לוג לדיבוג
    await prisma.$executeRaw`
      INSERT INTO metrics_calculation_log (
        id, "profileId", "calculatedAt", "calculationType", 
        "inputData", "outputMetrics", "durationMs", "errors"
      ) VALUES (
        ${`log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`},
        ${profileId},
        NOW(),
        'FULL',
        ${JSON.stringify({ triggeredBy: session.user.email })}::jsonb,
        ${JSON.stringify(result)}::jsonb,
        ${duration},
        ${result.errors.length > 0 ? JSON.stringify(result.errors) : null}::jsonb
      )
    `;

    return NextResponse.json({
      success: result.metricsUpdated && result.vectorsUpdated,
      profileId,
      metricsUpdated: result.metricsUpdated,
      vectorsUpdated: result.vectorsUpdated,
      errors: result.errors,
      durationMs: duration,
    });

  } catch (error) {
    console.error('[API] Update metrics failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// GET - קבלת מדדים קיימים של פרופיל
// ═══════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  { params }: { params: { profileId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'MATCHMAKER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { profileId } = params;

    // שליפת המדדים
    const metrics = await prisma.$queryRaw<any[]>`
      SELECT * FROM profile_metrics WHERE "profileId" = ${profileId}
    `;

    // שליפת מצב הוקטורים
    const vectors = await prisma.$queryRaw<any[]>`
      SELECT 
        "profileId",
        "selfVector" IS NOT NULL as "hasSelfVector",
        "seekingVector" IS NOT NULL as "hasSeekingVector",
        "selfVectorUpdatedAt",
        "seekingVectorUpdatedAt",
        "updatedAt"
      FROM profile_vectors 
      WHERE "profileId" = ${profileId}
    `;

    if (!metrics[0]) {
      return NextResponse.json({
        exists: false,
        metrics: null,
        vectors: vectors[0] || null,
      });
    }

    return NextResponse.json({
      exists: true,
      metrics: metrics[0],
      vectors: vectors[0] || null,
    });

  } catch (error) {
    console.error('[API] Get metrics failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}