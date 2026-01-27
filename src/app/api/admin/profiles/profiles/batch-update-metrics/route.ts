// ============================================================
// NeshamaTech - Batch Update All Profiles Metrics & Vectors
// src/app/api/admin/profiles/batch-update-metrics/route.ts
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { updateProfileVectorsAndMetrics } from '@/lib/services/dualVectorService';

// ═══════════════════════════════════════════════════════════════
// POST - עדכון מדדים ווקטורים לכל הפרופילים
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    // בדיקת הרשאות (רק אדמין)
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 401 }
      );
    }

    // פרמטרים אופציונליים
    const body = await request.json().catch(() => ({}));
    const {
      limit = 50,           // כמה פרופילים לעדכן
      onlyMissing = true,   // רק כאלה שחסר להם מדדים
      gender = null,        // סינון לפי מגדר
      forceUpdate = false,  // לעדכן גם את מי שכבר יש לו
    } = body;

    console.log(`[BatchUpdate] Starting batch update. Limit: ${limit}, OnlyMissing: ${onlyMissing}`);

    // שליפת פרופילים לעדכון
    let query = `
      SELECT p.id, p.gender, p."userId",
             pm.id IS NOT NULL as "hasMetrics",
             pv."selfVector" IS NOT NULL as "hasSelfVector",
             pv."seekingVector" IS NOT NULL as "hasSeekingVector"
      FROM profiles p
      LEFT JOIN profile_metrics pm ON pm."profileId" = p.id
      LEFT JOIN profile_vectors pv ON pv."profileId" = p.id
      WHERE p.status = 'AVAILABLE'
    `;

    if (onlyMissing && !forceUpdate) {
      query += ` AND (pm.id IS NULL OR pv."selfVector" IS NULL OR pv."seekingVector" IS NULL)`;
    }

    if (gender) {
      query += ` AND p.gender = '${gender}'`;
    }

    query += ` ORDER BY p."createdAt" DESC LIMIT ${limit}`;

    const profilesToUpdate = await prisma.$queryRawUnsafe<any[]>(query);

    console.log(`[BatchUpdate] Found ${profilesToUpdate.length} profiles to update`);

    // עדכון כל פרופיל
    const results: {
      profileId: string;
      success: boolean;
      metricsUpdated: boolean;
      vectorsUpdated: boolean;
      errors: string[];
      durationMs: number;
    }[] = [];

    for (const profile of profilesToUpdate) {
      const startTime = Date.now();
      
      try {
        console.log(`[BatchUpdate] Processing profile: ${profile.id}`);
        
        const result = await updateProfileVectorsAndMetrics(profile.id);
        
        results.push({
          profileId: profile.id,
          success: result.metricsUpdated && result.vectorsUpdated,
          metricsUpdated: result.metricsUpdated,
          vectorsUpdated: result.vectorsUpdated,
          errors: result.errors,
          durationMs: Date.now() - startTime,
        });

        // המתנה קצרה בין קריאות (rate limiting)
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        results.push({
          profileId: profile.id,
          success: false,
          metricsUpdated: false,
          vectorsUpdated: false,
          errors: [String(error)],
          durationMs: Date.now() - startTime,
        });
      }
    }

    // סיכום
    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      metricsUpdated: results.filter(r => r.metricsUpdated).length,
      vectorsUpdated: results.filter(r => r.vectorsUpdated).length,
      avgDurationMs: Math.round(results.reduce((sum, r) => sum + r.durationMs, 0) / results.length),
    };

    console.log(`[BatchUpdate] Completed. Summary:`, summary);

    return NextResponse.json({
      success: true,
      summary,
      results,
    });

  } catch (error) {
    console.error('[BatchUpdate] Failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// GET - סטטוס של המדדים והוקטורים במערכת
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'MATCHMAKER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // סטטיסטיקות כלליות
    const stats = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(DISTINCT p.id) as "totalProfiles",
        COUNT(DISTINCT CASE WHEN p.status = 'AVAILABLE' THEN p.id END) as "availableProfiles",
        COUNT(DISTINCT pm."profileId") as "profilesWithMetrics",
        COUNT(DISTINCT CASE WHEN pv."selfVector" IS NOT NULL THEN pv."profileId" END) as "profilesWithSelfVector",
        COUNT(DISTINCT CASE WHEN pv."seekingVector" IS NOT NULL THEN pv."profileId" END) as "profilesWithSeekingVector",
        COUNT(DISTINCT CASE WHEN pv."selfVector" IS NOT NULL AND pv."seekingVector" IS NOT NULL THEN pv."profileId" END) as "profilesWithBothVectors"
      FROM profiles p
      LEFT JOIN profile_metrics pm ON pm."profileId" = p.id
      LEFT JOIN profile_vectors pv ON pv."profileId" = p.id
    `;

    // פירוט לפי מגדר
    const byGender = await prisma.$queryRaw<any[]>`
      SELECT 
        p.gender,
        COUNT(p.id) as total,
        COUNT(pm."profileId") as "withMetrics",
        COUNT(CASE WHEN pv."selfVector" IS NOT NULL AND pv."seekingVector" IS NOT NULL THEN 1 END) as "withBothVectors"
      FROM profiles p
      LEFT JOIN profile_metrics pm ON pm."profileId" = p.id
      LEFT JOIN profile_vectors pv ON pv."profileId" = p.id
      WHERE p.status = 'AVAILABLE'
      GROUP BY p.gender
    `;

    // ממוצע confidence
    const avgConfidence = await prisma.$queryRaw<any[]>`
      SELECT 
        AVG("confidenceScore") as "avgConfidence",
        AVG("dataCompleteness") as "avgDataCompleteness"
      FROM profile_metrics
    `;

    // פרופילים שצריכים עדכון
    const needsUpdate = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count
      FROM profiles p
      LEFT JOIN profile_metrics pm ON pm."profileId" = p.id
      LEFT JOIN profile_vectors pv ON pv."profileId" = p.id
      WHERE p.status = 'AVAILABLE'
        AND (pm.id IS NULL OR pv."selfVector" IS NULL OR pv."seekingVector" IS NULL)
    `;

    return NextResponse.json({
      overall: stats[0],
      byGender,
      avgMetrics: avgConfidence[0],
      needsUpdate: Number(needsUpdate[0]?.count || 0),
    });

  } catch (error) {
    console.error('[BatchUpdate] Stats failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}