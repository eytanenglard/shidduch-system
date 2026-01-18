// =============================================================================
// 📁 src/app/api/ai/scan-user/route.ts
// =============================================================================
// 🎯 Scan User - סריקה ידנית ליוזר בודד
// 
// גרסה: 2.0 - סריקה דיפרנציאלית
// 
// שיפורים:
// 1. סריקה דיפרנציאלית - סורק רק מועמדות חדשות/מעודכנות
// 2. פילטר היסטוריה - לא מציע זוגות עם דייט כושל
// 3. שמירה ב-ScannedPair - לכל זוג שנסרק
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AvailabilityStatus } from "@prisma/client";
import {
  findMatchesForUser,
  calculateAge,
  getCompatibleReligiousLevels,
} from "@/lib/services/matchingAlgorithmService";
import {
  getFemalesToScan,
  filterBlockedFemales,
  saveScannedPairsBatch,
  getActiveUsersWhereClause,
  type ScannedPairResult,
} from "@/lib/services/matchingAlgorithmService";

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 דקות

// =============================================================================
// Constants
// =============================================================================

const MIN_SCORE_THRESHOLD = 70;

// =============================================================================
// POST - סריקה ידנית ליוזר
// =============================================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // אימות
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      userId,  // היוזר שרוצים לסרוק עבורו
      forceRefresh = false,  // אם true - מתעלם מסריקות קודמות
      method = 'algorithmic',
    } = body;

    if (!userId) {
      return NextResponse.json({ 
        error: "userId is required" 
      }, { status: 400 });
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[ScanUser] 🔍 Starting scan for user: ${userId}`);
    console.log(`[ScanUser] Force Refresh: ${forceRefresh}`);
    console.log(`${'='.repeat(60)}\n`);

    // שליפת פרטי היוזר
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profile: {
          select: {
            gender: true,
            birthDate: true,
            religiousLevel: true,
            updatedAt: true,
            availabilityStatus: true,
          }
        }
      }
    });

    if (!targetUser || !targetUser.profile) {
      return NextResponse.json({ 
        error: "User not found or has no profile" 
      }, { status: 404 });
    }

    // בדיקה שזה גבר (הסריקה מכיוון הגברים)
    if (targetUser.profile.gender !== 'MALE') {
      // אם זו בחורה - צריך לסרוק את כל הגברים מולה
      // זה יותר יקר אבל אפשרי
      console.log(`[ScanUser] Target is female - scanning all males against her`);
      
      const result = await scanFemaleUser(
        targetUser,
        session.user.id,
        forceRefresh
      );

      const duration = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        userId,
        matchesFound: result.matchesFound,
        newMatches: result.newMatches,
        pairsScanned: result.pairsScanned,
        skippedByHistory: result.skippedByHistory,
        skippedByNoChange: result.skippedByNoChange,
        duration: `${(duration / 1000).toFixed(1)}s`,
      });
    }

    // סריקה רגילה לגבר
    const result = await scanMaleUser(
      targetUser,
      session.user.id,
      forceRefresh
    );

    const duration = Date.now() - startTime;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[ScanUser] ✅ Scan completed for ${targetUser.firstName} ${targetUser.lastName}`);
    console.log(`[ScanUser] Duration: ${(duration / 1000).toFixed(1)}s`);
    console.log(`[ScanUser] Pairs scanned: ${result.pairsScanned}`);
    console.log(`[ScanUser] Matches found: ${result.matchesFound}`);
    console.log(`[ScanUser] New matches: ${result.newMatches}`);
    console.log(`${'='.repeat(60)}\n`);

    return NextResponse.json({
      success: true,
      userId,
      matchesFound: result.matchesFound,
      newMatches: result.newMatches,
      pairsScanned: result.pairsScanned,
      skippedByHistory: result.skippedByHistory,
      skippedByNoChange: result.skippedByNoChange,
      duration: `${(duration / 1000).toFixed(1)}s`,
    });

  } catch (error) {
    console.error('[ScanUser] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Scan failed'
    }, { status: 500 });
  }
}

// =============================================================================
// סריקת גבר - מול כל הבחורות הרלוונטיות
// =============================================================================

async function scanMaleUser(
  targetUser: {
    id: string;
    firstName: string;
    lastName: string;
    profile: {
      gender: string;
      birthDate: Date | null;
      religiousLevel: string | null;
      updatedAt: Date;
    } | null;
  },
  matchmakerId: string,
  forceRefresh: boolean
): Promise<{
  matchesFound: number;
  newMatches: number;
  pairsScanned: number;
  skippedByHistory: number;
  skippedByNoChange: number;
}> {
  if (!targetUser.profile?.birthDate) {
    throw new Error('Target user has no birth date');
  }

  const maleAge = calculateAge(targetUser.profile.birthDate);
  const maleReligiousLevel = targetUser.profile.religiousLevel;
  const maleProfileUpdatedAt = targetUser.profile.updatedAt;

  console.log(`[ScanUser] Male: ${targetUser.firstName} ${targetUser.lastName}`);
  console.log(`[ScanUser] Age: ${maleAge}, Religious: ${maleReligiousLevel}`);

  // שליפת כל הבחורות הפעילות
  const allFemales = await prisma.user.findMany({
    where: {
      ...getActiveUsersWhereClause(),
      profile: {
        gender: 'FEMALE',
        availabilityStatus: AvailabilityStatus.AVAILABLE,
        isProfileVisible: true,
        OR: [
          { about: { not: null } },
          { manualEntryText: { not: null } },
        ]
      }
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profile: {
        select: {
          birthDate: true,
          religiousLevel: true,
          updatedAt: true,
        }
      }
    }
  });

  console.log(`[ScanUser] Total females found: ${allFemales.length}`);

  // סינון ראשוני לפי גיל ורמה דתית
  const compatibleReligious = getCompatibleReligiousLevels(maleReligiousLevel);
  
  const relevantFemales = allFemales.filter(female => {
    if (!female.profile) return false;
    
    // סינון רמה דתית (סלחני)
    if (female.profile.religiousLevel && 
        !compatibleReligious.includes(female.profile.religiousLevel)) {
      return false;
    }

    // סינון גיל (סלחני)
    if (female.profile.birthDate) {
      const femaleAge = calculateAge(female.profile.birthDate);
      const minAge = maleAge - 7;
      const maxAge = maleAge + 4;
      if (femaleAge < minAge || femaleAge > maxAge) {
        return false;
      }
    }

    return true;
  }).map(f => ({
    id: f.id,
    profileUpdatedAt: f.profile!.updatedAt,
  }));

  console.log(`[ScanUser] Relevant females after basic filter: ${relevantFemales.length}`);

  // סריקה דיפרנציאלית
  let femalesToScan: string[];
  let skippedByHistory = 0;
  let skippedByNoChange = 0;

  if (forceRefresh) {
    // אם force refresh - סורק את כולן (אבל עדיין מסנן היסטוריה)
    const { allowedIds, blockedPairs } = await filterBlockedFemales(
      targetUser.id, 
      relevantFemales.map(f => f.id)
    );
    femalesToScan = allowedIds;
    skippedByHistory = blockedPairs.size;
    skippedByNoChange = 0;
  } else {
    // סריקה דיפרנציאלית מלאה
    const scanResult = await getFemalesToScan(
      targetUser.id,
      maleProfileUpdatedAt,
      relevantFemales
    );
    femalesToScan = scanResult.femalesToScan;
    skippedByHistory = scanResult.skippedByHistory;
    skippedByNoChange = scanResult.skippedByNoChange;
  }

  console.log(`[ScanUser] Females to scan: ${femalesToScan.length}`);
  console.log(`[ScanUser] Skipped by history: ${skippedByHistory}`);
  console.log(`[ScanUser] Skipped by no change: ${skippedByNoChange}`);

  if (femalesToScan.length === 0) {
    return {
      matchesFound: 0,
      newMatches: 0,
      pairsScanned: 0,
      skippedByHistory,
      skippedByNoChange,
    };
  }

  // הפעלת האלגוריתם
  const result = await findMatchesForUser(targetUser.id, matchmakerId, {
    forceRefresh: true,
    autoSave: false,
  });

  // עיבוד התוצאות
  let matchesFound = 0;
  let newMatches = 0;
  const scannedPairsToSave: ScannedPairResult[] = [];

  for (const match of result.matches) {
    const score = match.finalScore || 0;
    const passedThreshold = score >= MIN_SCORE_THRESHOLD;
    
    const femaleData = relevantFemales.find(f => f.id === match.userId);
    if (femaleData) {
      scannedPairsToSave.push({
        maleUserId: targetUser.id,
        femaleUserId: match.userId,
        aiScore: score,
        passedThreshold,
        rejectionReason: passedThreshold ? null : 'low_ai_score',
        maleProfileUpdatedAt,
        femaleProfileUpdatedAt: femaleData.profileUpdatedAt,
      });
    }

    if (passedThreshold) {
      matchesFound++;
      
      // שמירה ב-PotentialMatch
      const saved = await saveToPotentialMatch(targetUser.id, match.userId, match);
      if (saved === 'new') newMatches++;
    }
  }

  // שמירת ScannedPairs
  await saveScannedPairsBatch(scannedPairsToSave);

  return {
    matchesFound,
    newMatches,
    pairsScanned: femalesToScan.length,
    skippedByHistory,
    skippedByNoChange,
  };
}

// =============================================================================
// סריקת בחורה - כל הגברים מולה
// =============================================================================

async function scanFemaleUser(
  targetUser: {
    id: string;
    firstName: string;
    lastName: string;
    profile: {
      gender: string;
      birthDate: Date | null;
      religiousLevel: string | null;
      updatedAt: Date;
    } | null;
  },
  matchmakerId: string,
  forceRefresh: boolean
): Promise<{
  matchesFound: number;
  newMatches: number;
  pairsScanned: number;
  skippedByHistory: number;
  skippedByNoChange: number;
}> {
  if (!targetUser.profile?.birthDate) {
    throw new Error('Target user has no birth date');
  }

  const femaleAge = calculateAge(targetUser.profile.birthDate);
  const femaleReligiousLevel = targetUser.profile.religiousLevel;
  const femaleProfileUpdatedAt = targetUser.profile.updatedAt;

  console.log(`[ScanUser] Female: ${targetUser.firstName} ${targetUser.lastName}`);
  console.log(`[ScanUser] Age: ${femaleAge}, Religious: ${femaleReligiousLevel}`);

  // שליפת כל הגברים הפעילים
  const allMales = await prisma.user.findMany({
    where: {
      ...getActiveUsersWhereClause(),
      profile: {
        gender: 'MALE',
        availabilityStatus: AvailabilityStatus.AVAILABLE,
        isProfileVisible: true,
        OR: [
          { about: { not: null } },
          { manualEntryText: { not: null } },
        ]
      }
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profile: {
        select: {
          birthDate: true,
          religiousLevel: true,
          updatedAt: true,
        }
      }
    }
  });

  console.log(`[ScanUser] Total males found: ${allMales.length}`);

  // סינון ראשוני
  const compatibleReligious = getCompatibleReligiousLevels(femaleReligiousLevel);
  
  const relevantMales = allMales.filter(male => {
    if (!male.profile) return false;
    
    if (male.profile.religiousLevel && 
        !compatibleReligious.includes(male.profile.religiousLevel)) {
      return false;
    }

    if (male.profile.birthDate) {
      const maleAge = calculateAge(male.profile.birthDate);
      // לבחורה: גבר יכול להיות עד 7 שנים יותר גדול, או עד 4 שנים יותר צעיר
      const minAge = femaleAge - 4;
      const maxAge = femaleAge + 7;
      if (maleAge < minAge || maleAge > maxAge) {
        return false;
      }
    }

    return true;
  });

  console.log(`[ScanUser] Relevant males after basic filter: ${relevantMales.length}`);

  // סינון היסטוריה - צריך לסנן הפוך (הגברים מול הבחורה)
  const maleIds = relevantMales.map(m => m.id);
  
  // שליפת זוגות חסומים
  const blockedSuggestions = await prisma.matchSuggestion.findMany({
    where: {
      status: { in: ['ENDED_AFTER_FIRST_DATE', 'MATCH_DECLINED', 'FIRST_PARTY_DECLINED', 'SECOND_PARTY_DECLINED', 'CLOSED', 'CANCELLED', 'EXPIRED'] },
      OR: [
        { firstPartyId: targetUser.id, secondPartyId: { in: maleIds } },
        { firstPartyId: { in: maleIds }, secondPartyId: targetUser.id },
      ]
    },
    select: { firstPartyId: true, secondPartyId: true }
  });

  const dismissedMatches = await prisma.potentialMatch.findMany({
    where: {
      femaleUserId: targetUser.id,
      maleUserId: { in: maleIds },
      status: 'DISMISSED'
    },
    select: { maleUserId: true }
  });

  const blockedMaleIds = new Set<string>();
  for (const s of blockedSuggestions) {
    const maleId = s.firstPartyId === targetUser.id ? s.secondPartyId : s.firstPartyId;
    blockedMaleIds.add(maleId);
  }
  for (const m of dismissedMatches) {
    blockedMaleIds.add(m.maleUserId);
  }

  const skippedByHistory = blockedMaleIds.size;

  // סריקה דיפרנציאלית
  const existingPairs = forceRefresh ? [] : await prisma.scannedPair.findMany({
    where: {
      femaleUserId: targetUser.id,
      maleUserId: { in: maleIds.filter(id => !blockedMaleIds.has(id)) }
    },
    select: {
      maleUserId: true,
      maleProfileUpdatedAt: true,
      femaleProfileUpdatedAt: true,
    }
  });

  const existingPairsMap = new Map(existingPairs.map(p => [p.maleUserId, p]));
  
  const malesToScan: string[] = [];
  let skippedByNoChange = 0;

  for (const male of relevantMales) {
    if (blockedMaleIds.has(male.id)) continue;
    
    const existing = existingPairsMap.get(male.id);
    if (!existing) {
      malesToScan.push(male.id);
      continue;
    }

    // בדיקה אם עודכן
    const maleUpdated = existing.maleProfileUpdatedAt 
      ? male.profile!.updatedAt > existing.maleProfileUpdatedAt
      : true;
    const femaleUpdated = existing.femaleProfileUpdatedAt
      ? femaleProfileUpdatedAt > existing.femaleProfileUpdatedAt
      : true;

    if (maleUpdated || femaleUpdated) {
      malesToScan.push(male.id);
    } else {
      skippedByNoChange++;
    }
  }

  console.log(`[ScanUser] Males to scan: ${malesToScan.length}`);
  console.log(`[ScanUser] Skipped by history: ${skippedByHistory}`);
  console.log(`[ScanUser] Skipped by no change: ${skippedByNoChange}`);

  if (malesToScan.length === 0) {
    return {
      matchesFound: 0,
      newMatches: 0,
      pairsScanned: 0,
      skippedByHistory,
      skippedByNoChange,
    };
  }

  // הפעלת האלגוריתם
  const result = await findMatchesForUser(targetUser.id, matchmakerId, {
    forceRefresh: true,
    autoSave: false,
  });

  // עיבוד התוצאות
  let matchesFound = 0;
  let newMatches = 0;
  const scannedPairsToSave: ScannedPairResult[] = [];

  for (const match of result.matches) {
    const score = match.finalScore || 0;
    const passedThreshold = score >= MIN_SCORE_THRESHOLD;
    
    const maleData = relevantMales.find(m => m.id === match.userId);
    if (maleData) {
      scannedPairsToSave.push({
        maleUserId: match.userId,
        femaleUserId: targetUser.id,
        aiScore: score,
        passedThreshold,
        rejectionReason: passedThreshold ? null : 'low_ai_score',
        maleProfileUpdatedAt: maleData.profile!.updatedAt,
        femaleProfileUpdatedAt,
      });
    }

    if (passedThreshold) {
      matchesFound++;
      
      const saved = await saveToPotentialMatch(match.userId, targetUser.id, match);
      if (saved === 'new') newMatches++;
    }
  }

  await saveScannedPairsBatch(scannedPairsToSave);

  return {
    matchesFound,
    newMatches,
    pairsScanned: malesToScan.length,
    skippedByHistory,
    skippedByNoChange,
  };
}

// =============================================================================
// Helper: שמירה ב-PotentialMatch
// =============================================================================

async function saveToPotentialMatch(
  maleUserId: string,
  femaleUserId: string,
  match: any
): Promise<'new' | 'updated' | 'unchanged'> {
  const score = match.finalScore || match.score || 0;

  try {
    const existing = await prisma.potentialMatch.findUnique({
      where: {
        maleUserId_femaleUserId: { maleUserId, femaleUserId }
      }
    });

    if (existing) {
      if (Math.abs(existing.aiScore - score) > 2 || existing.status === 'EXPIRED') {
        await prisma.potentialMatch.update({
          where: { id: existing.id },
          data: {
            aiScore: score,
            firstPassScore: match.firstPassScore || null,
            scoreBreakdown: match.scoreBreakdown || null,
            shortReasoning: match.shortReasoning || match.reasoning || null,
            detailedReasoning: match.detailedReasoning || null,
            backgroundCompatibility: match.backgroundCompatibility || null,
            backgroundMultiplier: match.backgroundMultiplier || null,
            scannedAt: new Date(),
            status: existing.status === 'EXPIRED' ? 'PENDING' : existing.status,
          }
        });
        return 'updated';
      }
      return 'unchanged';
    }

    await prisma.potentialMatch.create({
      data: {
        maleUserId,
        femaleUserId,
        aiScore: score,
        firstPassScore: match.firstPassScore || null,
        scoreBreakdown: match.scoreBreakdown || null,
        shortReasoning: match.shortReasoning || match.reasoning || null,
        detailedReasoning: match.detailedReasoning || null,
        backgroundCompatibility: match.backgroundCompatibility || null,
        backgroundMultiplier: match.backgroundMultiplier || null,
        status: 'PENDING',
        scannedAt: new Date(),
      }
    });
    return 'new';

  } catch (error) {
    console.warn(`[ScanUser] Could not save PotentialMatch:`, error);
    return 'unchanged';
  }
}