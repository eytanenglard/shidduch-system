// src/app/api/matchmaker/candidates/similar/route.ts
// Returns candidates with similar profiles (same gender) using pgvector cosine similarity

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export const dynamic = 'force-dynamic';

const MAX_RESULTS = 20;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      (session.user.role !== UserRole.MATCHMAKER &&
        session.user.role !== UserRole.ADMIN)
    ) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
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

    return NextResponse.json({
      success: true,
      similarIds: results.map((r) => r.user_id),
      similarities: results.reduce(
        (acc, r) => {
          acc[r.user_id] = Math.round(Number(r.similarity) * 100);
          return acc;
        },
        {} as Record<string, number>
      ),
    });
  } catch (error) {
    console.error('Error finding similar candidates:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
