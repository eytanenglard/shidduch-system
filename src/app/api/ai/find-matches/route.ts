// src/app/api/ai/find-matches/route.ts

import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from '@/lib/rate-limiter';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole, Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
    const rateLimitResponse = await applyRateLimit(req, { requests: 15, window: '1 h' });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // 1. Authentication and Authorization
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. Body Validation
    const body = await req.json();
    const { targetUserId, candidatePoolIds } = body;

    if (!targetUserId || !Array.isArray(candidatePoolIds) || candidatePoolIds.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid request body. 'targetUserId' (string) and 'candidatePoolIds' (array) are required." }, { status: 400 });
    }

    // 3. Fetch the profile for the target user to get their profileId
    const targetProfile = await prisma.profile.findUnique({
        where: { userId: targetUserId },
        select: { id: true }
    });

    if (!targetProfile) {
        return NextResponse.json({ success: false, error: "Target user profile not found." }, { status: 404 });
    }
    
    // --- START OF FIX 1: Cast the vector to text ---
    // We explicitly cast the vector to ::text, which Prisma understands as a string.
    const vectorResult: { vector_text: string }[] = await prisma.$queryRaw`
      SELECT vector::text as vector_text FROM "profile_vectors" WHERE "profileId" = ${targetProfile.id} LIMIT 1;
    `;

    if (!vectorResult || vectorResult.length === 0 || !vectorResult[0]?.vector_text) {
        return NextResponse.json({ success: false, error: "Vector for target user not found. AI profile may still be processing." }, { status: 404 });
    }

    // Now, we parse the string back into a number array.
    // The string looks like '[0.1,0.2,...]', so we remove brackets and split.
    const targetVector: number[] = JSON.parse(vectorResult[0].vector_text);
    // --- END OF FIX 1 ---

    // 4. Perform Vector Similarity Search
    // We still use the original format for the similarity search operation itself.
    const targetVectorString = `[${targetVector.join(',')}]`;

    // --- START OF FIX 2: No change needed here, the previous query was the issue ---
    // The error was in retrieving the target vector, not in the search itself.
    // This query is fine because the `vector` column is only used for calculation
    // and is not returned in the final SELECT statement.
    const results: { profileId: string; similarity: number }[] = await prisma.$queryRaw`
      SELECT
        pv."profileId",
        1 - (pv.vector <=> ${targetVectorString}::vector) as similarity
      FROM
        "profile_vectors" AS pv
      INNER JOIN 
        "Profile" AS p ON pv."profileId" = p.id
      WHERE
        p."userId" IN (${Prisma.join(candidatePoolIds)}) AND p."userId" != ${targetUserId}
      ORDER BY
        similarity DESC
      LIMIT 20;
    `;
    // --- END OF FIX 2 ---
    
    // 5. Map results from profileId back to userId for the frontend
    const profileIdToUserIdMap = new Map<string, string>();
    const allProfileIds = results.map(r => r.profileId);

    if (allProfileIds.length > 0) {
        const profiles = await prisma.profile.findMany({
            where: { id: { in: allProfileIds } },
            select: { id: true, userId: true }
        });
        profiles.forEach(p => profileIdToUserIdMap.set(p.id, p.userId));
    }

    const finalMatches = results.map(r => ({
        userId: profileIdToUserIdMap.get(r.profileId) || '',
        score: Math.round(r.similarity * 100)
    })).filter(m => m.userId);

    // 6. Return the sorted list of matches
    return NextResponse.json({ success: true, matches: finalMatches });

  } catch (error) {
    console.error('Error in /api/ai/find-matches:', error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ success: false, error: "Internal server error.", details: errorMessage }, { status: 500 });
  }
}