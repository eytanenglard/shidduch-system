// ============================================================
// NeshamaTech - Scan Single User API V2 (FIXED)
// src/app/api/admin/scan/[userId]/route.ts
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { scanSingleUserV2, saveScanResults, ScanOptions } from '@/lib/services/scanSingleUserV2';
import { Gender } from '@prisma/client';

// ═══════════════════════════════════════════════════════════════
// POST - הפעלת סריקה ליוזר בודד
// ═══════════════════════════════════════════════════════════════

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // בדיקת הרשאות
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'MATCHMAKER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = params;

    // פרמטרים מה-body
    const body = await request.json().catch(() => ({}));
    const options: ScanOptions = {
      useVectors: body.useVectors ?? true,
      useAIDeepAnalysis: body.useAIDeepAnalysis ?? true,
      maxCandidates: body.maxCandidates ?? 100,
      topForAI: body.topForAI ?? 30,
      forceUpdateMetrics: body.forceUpdateMetrics ?? false,
    };

    console.log(`[API] Starting scan for user: ${userId}`, options);

    // הפעלת הסריקה
    const result = await scanSingleUserV2(userId, options);

    // שמירה ל-DB (אם רוצים)
    const saveToDb = body.saveToDb ?? true;
    if (saveToDb && result.matches.length > 0) {
      await saveScanResults(result);
    }

    // סיכום תמציתי
    const summary = {
      totalMatches: result.matches.length,
      tier1: result.matches.filter(m => m.tier === 1).length,
      tier2: result.matches.filter(m => m.tier === 2).length,
      tier3: result.matches.filter(m => m.tier === 3).length,
      excellent: result.matches.filter(m => m.recommendation === 'EXCELLENT').length,
      good: result.matches.filter(m => m.recommendation === 'GOOD').length,
      avgScore: result.matches.length > 0
        ? Math.round(result.matches.reduce((sum, m) => sum + m.symmetricScore, 0) / result.matches.length)
        : 0,
    };

    return NextResponse.json({
      success: true,
      userId,
      profileId: result.profileId,
      durationMs: result.durationMs,
      stats: result.stats,
      summary,
      matches: result.matches,
      errors: result.errors,
      warnings: result.warnings,
    });

  } catch (error) {
    console.error('[API] Scan failed:', error);
    return NextResponse.json(
      { error: 'Scan failed', details: String(error) },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// GET - קבלת תוצאות סריקה קודמות
// ═══════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'MATCHMAKER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const minScore = parseInt(searchParams.get('minScore') || '0');

    // שליפת הפרופיל
    const profile = await prisma.profile.findFirst({
      where: { userId },
      select: { id: true, gender: true, lastScannedAt: true },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const isMale = profile.gender === Gender.MALE;
    
    // שליפת התאמות קיימות
    const matches = await prisma.potentialMatch.findMany({
      where: {
        OR: [
          { maleUserId: userId },
          { femaleUserId: userId },
        ],
        aiScore: { gte: minScore },
        // תיקון: שימוש בסטטוסים הנכונים מה-enum
        status: { notIn: ['DISMISSED', 'EXPIRED'] },
      },
      orderBy: { aiScore: 'desc' },
      take: limit,
    });

    // שליפת פרטי המשתמשים בנפרד
    const formattedMatches = await Promise.all(matches.map(async (match) => {
      const candidateUserId = isMale ? match.femaleUserId : match.maleUserId;
      
      const candidateUser = await prisma.user.findUnique({
        where: { id: candidateUserId },
        select: {
          firstName: true,
          lastName: true,
          profile: {
            select: { id: true, city: true, birthDate: true }
          }
        }
      });

      const candidateAge = candidateUser?.profile?.birthDate
        ? Math.floor((Date.now() - new Date(candidateUser.profile.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
        : null;
      
      return {
        matchId: match.id,
        candidateUserId,
        candidateProfileId: candidateUser?.profile?.id,
        candidateName: candidateUser ? `${candidateUser.firstName} ${candidateUser.lastName}` : 'Unknown',
        candidateCity: candidateUser?.profile?.city,
        candidateAge,
        aiScore: match.aiScore,
        firstPassScore: match.firstPassScore,
        status: match.status,
        shortReasoning: match.shortReasoning,
        scannedAt: match.scannedAt,
      };
    }));

    return NextResponse.json({
      userId,
      profileId: profile.id,
      lastScannedAt: profile.lastScannedAt,
      matchCount: formattedMatches.length,
      matches: formattedMatches,
    });

  } catch (error) {
    console.error('[API] Get matches failed:', error);
    return NextResponse.json(
      { error: 'Failed to get matches', details: String(error) },
      { status: 500 }
    );
  }
}