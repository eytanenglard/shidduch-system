// =============================================================================
// src/app/api/mobile/matchmaker/candidates/similar/route.ts
// =============================================================================
// Similar candidates via pgvector cosine similarity (Mobile JWT)
// =============================================================================

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from '@/lib/mobile-auth';

export const dynamic = 'force-dynamic';

const MAX_RESULTS = 20;

// ─── OPTIONS ──────────────────────────────────────────────────────────────────

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

// ─── GET — Find similar candidates by profile vector ─────────────────────────

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    if (auth.role !== UserRole.MATCHMAKER && auth.role !== UserRole.ADMIN) {
      return corsError(req, 'Insufficient permissions', 403);
    }

    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return corsError(req, 'userId is required', 400, 'VALIDATION_ERROR');
    }

    // Find same-gender similar candidates via raw pgvector query
    const results = await prisma.$queryRaw<
      Array<{ user_id: string; similarity: number }>
    >`
      SELECT p."userId" as user_id,
             1 - (pv."selfVector" <=> target_pv."selfVector") as similarity
      FROM profile_vectors pv
      JOIN "Profile" p ON p.id = pv."profileId"
      JOIN "User" u ON u.id = p."userId"
      CROSS JOIN (
        SELECT pv2."selfVector"
        FROM profile_vectors pv2
        JOIN "Profile" p2 ON p2.id = pv2."profileId"
        WHERE p2."userId" = ${userId}
          AND pv2."selfVector" IS NOT NULL
      ) target_pv
      WHERE p.gender = (
        SELECT p3.gender FROM "Profile" p3 WHERE p3."userId" = ${userId}
      )
        AND pv."selfVector" IS NOT NULL
        AND p."userId" != ${userId}
        AND u.status = 'ACTIVE'
      ORDER BY pv."selfVector" <=> target_pv."selfVector"
      LIMIT ${MAX_RESULTS}
    `;

    return corsJson(req, {
      success: true,
      similarIds: results.map((r) => r.user_id),
      similarities: results.reduce(
        (acc, r) => {
          acc[r.user_id] = Math.round(Number(r.similarity) * 100);
          return acc;
        },
        {} as Record<string, number>,
      ),
    });
  } catch (error) {
    console.error('[Mobile Similar Candidates API] Error:', error);
    return corsError(req, 'Failed to find similar candidates', 500);
  }
}
