// ===========================================
// src/app/api/ai/batch-scan-all/route.ts
// ===========================================
// 🎯 סריקה לילית - תמיכה במספר שיטות סריקה
// שיטות: hybrid, algorithmic, vector, metrics_v2
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole, AvailabilityStatus, Gender } from "@prisma/client";
import prisma from "@/lib/prisma";

// Import scan services
import { hybridScan } from "@/lib/services/hybridMatchingService";
// import { algorithmicScan } from "@/lib/services/matchingAlgorithmService"; // אם קיים
// import { vectorScan } from "@/lib/services/vectorMatchingService"; // אם קיים
// import { metricsV2Scan } from "@/lib/services/metricsV2Service"; // אם קיים

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

type ScanMethod = 'hybrid' | 'algorithmic' | 'vector' | 'metrics_v2';

interface ActiveScan {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  method: ScanMethod;
  currentUserIndex: number;
  totalUsers: number;
  currentUserName?: string;
  matchesFoundSoFar: number;
  newMatchesFoundSoFar: number;
  usersScanned: number;
  progressPercent: number;
  message?: string;
  error?: string;
  startedAt: Date;
}

// In-memory store
const activeScans = new Map<string, ActiveScan>();

// ═══════════════════════════════════════════════════════════════
// POST - התחלת/ביטול סריקה
// ═══════════════════════════════════════════════════════════════

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { 
      action = 'full_scan',
      method = 'hybrid', // 🆕 ברירת מחדל: hybrid
      forceRefresh = false,
      incremental = false,
      userId,
      userIds,
      scanId: cancelScanId,
    } = body;

    // ═══════════════════════════════════════════════════════════
    // Handle Cancel
    // ═══════════════════════════════════════════════════════════
    if (action === 'cancel' && cancelScanId) {
      const scan = activeScans.get(cancelScanId);
      if (scan) {
        scan.status = 'cancelled';
        scan.message = 'בוטל על ידי המשתמש';
      }
      return NextResponse.json({ success: true, message: 'Scan cancelled' });
    }

    // ═══════════════════════════════════════════════════════════
    // Check for existing scan
    // ═══════════════════════════════════════════════════════════
    const existingActiveScan = Array.from(activeScans.values()).find(
      s => s.status === 'running' || s.status === 'pending'
    );

    if (existingActiveScan) {
      return NextResponse.json({
        success: true,
        status: 'already_running',
        scanId: existingActiveScan.id,
        method: existingActiveScan.method,
      });
    }

    // ═══════════════════════════════════════════════════════════
    // Create new scan
    // ═══════════════════════════════════════════════════════════
    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newScan: ActiveScan = {
      id: scanId,
      status: 'pending',
      method: method as ScanMethod,
      currentUserIndex: 0,
      totalUsers: 0,
      matchesFoundSoFar: 0,
      newMatchesFoundSoFar: 0,
      usersScanned: 0,
      progressPercent: 0,
      startedAt: new Date(),
    };
    activeScans.set(scanId, newScan);

    const methodLabels: Record<ScanMethod, string> = {
      hybrid: 'היברידי 🔥',
      algorithmic: 'AI מתקדם 🧠',
      vector: 'דמיון מהיר ⚡',
      metrics_v2: 'מדדים V2 🎯',
    };

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[BatchScan] 🚀 Starting ${methodLabels[method as ScanMethod]} scan: ${scanId}`);
    console.log(`[BatchScan] Method: ${method}, Action: ${action}, ForceRefresh: ${forceRefresh}`);
    console.log(`${'='.repeat(60)}\n`);

    // Start scan in background
    runBatchScan(scanId, {
      action,
      method: method as ScanMethod,
      forceRefresh,
      incremental,
      userId,
      userIds,
      matchmakerId: session.user.id,
    }).catch(err => {
      console.error(`[BatchScan] Background scan error:`, err);
    });

    return NextResponse.json({
      success: true,
      scanId,
      method,
      status: 'pending',
    });

  } catch (error) {
    console.error('[BatchScan] POST Error:', error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════
// GET - בדיקת סטטוס
// ═══════════════════════════════════════════════════════════════

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scanId = searchParams.get('scanId');

    if (!scanId) {
      return NextResponse.json({
        name: "NeshamaTech Multi-Method Batch Scan API",
        version: "2.0",
        methods: ['hybrid', 'algorithmic', 'vector', 'metrics_v2'],
      });
    }

    const scan = activeScans.get(scanId);
    if (!scan) {
      return NextResponse.json({ success: false, error: "Scan not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      scan: {
        id: scan.id,
        status: scan.status,
        method: scan.method, // 🆕
        phase: scan.status === 'running' ? 'scanning' : scan.status,
        currentUserIndex: scan.currentUserIndex,
        totalUsers: scan.totalUsers,
        currentUserName: scan.currentUserName,
        progressPercent: scan.progressPercent,
        matchesFoundSoFar: scan.matchesFoundSoFar,
        newMatchesFoundSoFar: scan.newMatchesFoundSoFar,
        usersScanned: scan.usersScanned,
        message: scan.message,
        error: scan.error,
        stats: {
          matchesFoundSoFar: scan.matchesFoundSoFar,
        },
      },
    });

  } catch (error) {
    console.error('[BatchScan] GET Error:', error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════
// 🔥 Background Processing - Run Scan by Method
// ═══════════════════════════════════════════════════════════════

async function runBatchScan(
  scanId: string,
  options: {
    action: string;
    method: ScanMethod;
    forceRefresh: boolean;
    incremental: boolean;
    userId?: string;
    userIds?: string[];
    matchmakerId: string;
  }
): Promise<void> {
  const scan = activeScans.get(scanId);
  if (!scan) return;

  const startTime = Date.now();
  scan.status = 'running';
  scan.message = 'טוען משתמשים...';

  try {
    // ═══════════════════════════════════════════════════════════
    // Step 1: Get users to scan
    // ═══════════════════════════════════════════════════════════
    const usersToScan = await getUsersToScan(options);
    
    scan.totalUsers = usersToScan.length;
    scan.message = `נמצאו ${usersToScan.length} משתמשים לסריקה`;
    
    console.log(`[BatchScan] Found ${usersToScan.length} users to scan with method: ${options.method}`);

    if (usersToScan.length === 0) {
      scan.status = 'completed';
      scan.progressPercent = 100;
      scan.message = 'אין משתמשים לסריקה';
      return;
    }

    // ═══════════════════════════════════════════════════════════
    // Step 2: Scan each user with selected method
    // ═══════════════════════════════════════════════════════════
    let totalMatches = 0;
    let newMatches = 0;

    for (let i = 0; i < usersToScan.length; i++) {
if (scan.status as string === 'cancelled') {        console.log(`[BatchScan] Scan cancelled at user ${i + 1}`);
        break;
      }

      const user = usersToScan[i];
      
      scan.currentUserIndex = i + 1;
      scan.currentUserName = `${user.firstName} ${user.lastName}`;
      scan.progressPercent = Math.round((i / usersToScan.length) * 100);
      scan.message = `סורק ${user.firstName} ${user.lastName}...`;

      console.log(`[BatchScan] [${i + 1}/${usersToScan.length}] Scanning ${user.firstName} (${options.method})`);

      try {
        // 🔥 Call appropriate scan method
        const result = await scanUserByMethod(user.id, options.method, options.forceRefresh);

        // Save results with method tag
        const saved = await saveToPotentialMatches(
          user.id,
          user.gender,
          result.matches,
          options.method
        );

        totalMatches += result.matches.length;
        newMatches += saved.new;
        scan.matchesFoundSoFar = totalMatches;
        scan.newMatchesFoundSoFar = newMatches;
        scan.usersScanned = i + 1;

        console.log(`[BatchScan] ✓ ${user.firstName}: ${result.matches.length} matches (${saved.new} new)`);

      } catch (userError) {
        console.error(`[BatchScan] Error scanning ${user.firstName}:`, userError);
      }

      await sleep(400);
    }

    // ═══════════════════════════════════════════════════════════
    // Step 3: Complete
    // ═══════════════════════════════════════════════════════════
    const duration = Date.now() - startTime;
    
    scan.status = 'completed';
    scan.progressPercent = 100;
    scan.message = `הסריקה הושלמה! נמצאו ${totalMatches} התאמות (${newMatches} חדשות)`;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[BatchScan] ✅ ${options.method} scan completed in ${(duration / 1000 / 60).toFixed(1)} minutes`);
    console.log(`[BatchScan] Users: ${scan.usersScanned}/${usersToScan.length}`);
    console.log(`[BatchScan] Matches: ${totalMatches} (${newMatches} new)`);
    console.log(`${'='.repeat(60)}\n`);

    setTimeout(() => activeScans.delete(scanId), 60 * 60 * 1000);

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    scan.status = 'failed';
    scan.error = errorMsg;
    scan.message = `שגיאה: ${errorMsg}`;
    console.error(`[BatchScan] ❌ Failed:`, error);
  }
}

// ═══════════════════════════════════════════════════════════════
// 🔀 Scan User By Method
// ═══════════════════════════════════════════════════════════════

async function scanUserByMethod(
  userId: string,
  method: ScanMethod,
  forceRefresh: boolean,
   scanId: string
): Promise<{ matches: any[] }> {


    const checkCancelled = () => {
    const scan = activeScans.get(scanId);
    return scan?.status === 'cancelled';
  };
  switch (method) {
    case 'hybrid':
      return await hybridScan(userId, {
        maxTier1Candidates: 300,
        maxTier2Candidates: 50,
        maxTier3Candidates: 20,
        topForDeepAnalysis: 15,
        useVectors: true,
        useBackgroundAnalysis: true,
        useAIFirstPass: true,
        useAIDeepAnalysis: true,
        minScoreToSave: 65,
        autoSave: false,
        forceRefresh,
        checkCancelled,
      });

    case 'algorithmic':
      // TODO: החלף בשירות האמיתי
      // return await algorithmicScan(userId, { forceRefresh });
      return await hybridScan(userId, {
        maxTier1Candidates: 200,
        maxTier2Candidates: 30,
        topForDeepAnalysis: 20,
        useVectors: false,
        useBackgroundAnalysis: true,
        useAIFirstPass: true,
        useAIDeepAnalysis: true,
        minScoreToSave: 65,
        autoSave: false,
        forceRefresh,
      });

    case 'vector':
      // TODO: החלף בשירות האמיתי
      // return await vectorScan(userId, { forceRefresh });
      return await hybridScan(userId, {
        maxTier1Candidates: 500,
        maxTier2Candidates: 100,
        topForDeepAnalysis: 0, // ללא AI
        useVectors: true,
        useBackgroundAnalysis: false,
        useAIFirstPass: false,
        useAIDeepAnalysis: false,
        minScoreToSave: 60,
        autoSave: false,
        forceRefresh,
      });

    case 'metrics_v2':
      // TODO: החלף בשירות האמיתי
      // return await metricsV2Scan(userId, { forceRefresh });
      return await hybridScan(userId, {
        maxTier1Candidates: 300,
        maxTier2Candidates: 80,
        topForDeepAnalysis: 10,
        useVectors: true,
        useBackgroundAnalysis: true,
        useAIFirstPass: true,
        useAIDeepAnalysis: false,
        minScoreToSave: 65,
        autoSave: false,
        forceRefresh,
      });

    default:
      return await hybridScan(userId, { autoSave: false, forceRefresh });
  }
}

// ═══════════════════════════════════════════════════════════════
// Helper: Get users to scan
// ═══════════════════════════════════════════════════════════════

async function getUsersToScan(options: {
  action: string;
  method: ScanMethod;
  userId?: string;
  userIds?: string[];
  forceRefresh: boolean;
  incremental: boolean;
}): Promise<Array<{ id: string; firstName: string; lastName: string; gender: Gender }>> {
  
  if (options.action === 'scan_single' && options.userId) {
    const user = await prisma.user.findUnique({
      where: { id: options.userId },
      select: { id: true, firstName: true, lastName: true, profile: { select: { gender: true } } },
    });
    return user ? [{ ...user, gender: user.profile?.gender || Gender.MALE }] : [];
  }

  if (options.userIds?.length) {
    const users = await prisma.user.findMany({
      where: { id: { in: options.userIds } },
      select: { id: true, firstName: true, lastName: true, profile: { select: { gender: true } } },
    });
    return users.map(u => ({ ...u, gender: u.profile?.gender || Gender.MALE }));
  }

const where: any = {
  profile: {
    isNot: null,  // כל מי שיש לו פרופיל
  },
};

  if (options.action === 'scan_new_users') {
    where.createdAt = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
  }

  let users = await prisma.user.findMany({
    where,
    select: { id: true, firstName: true, lastName: true, profile: { select: { gender: true } } },
    orderBy: { createdAt: 'desc' },
  });

  // Skip recently scanned by this method (unless forceRefresh)
if (!options.forceRefresh) {
  const thresholdDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // יום אחד
  
  const recentlyScanned = await prisma.matchingJob.findMany({
    where: {
      method: options.method, // 🆕 רק באותה שיטה!
      status: 'completed',
      completedAt: { gte: thresholdDate },
    },
    select: { targetUserId: true },
    distinct: ['targetUserId'],
  });

  const recentSet = new Set(recentlyScanned.map(r => r.targetUserId));
  users = users.filter(u => !recentSet.has(u.id));
}

  return users.map(u => ({ ...u, gender: u.profile?.gender || Gender.MALE }));
}

// ═══════════════════════════════════════════════════════════════
// Helper: Save to PotentialMatch with method tag
// ═══════════════════════════════════════════════════════════════

async function saveToPotentialMatches(
  targetUserId: string,
  targetGender: Gender,
  matches: any[],
  scanMethod: ScanMethod
): Promise<{ new: number; updated: number }> {
  
  const isMale = targetGender === Gender.MALE;
  let newCount = 0;
  let updatedCount = 0;

  for (const match of matches) {
    const score = match.finalScore || match.score || 0;
    if (score < 60) continue;

    const maleUserId = isMale ? targetUserId : match.userId;
    const femaleUserId = isMale ? match.userId : targetUserId;

    const methodFields = getMethodFields(scanMethod, match, score);

    try {
      const existing = await prisma.potentialMatch.findUnique({
        where: { maleUserId_femaleUserId: { maleUserId, femaleUserId } },
      });

      if (existing) {
        await prisma.potentialMatch.update({
          where: { id: existing.id },
          data: {
            ...(score > existing.aiScore ? {
              aiScore: score,
              shortReasoning: match.shortReasoning || match.reasoning || null,
              lastScanMethod: scanMethod,
            } : {}),
            ...methodFields,
            scannedAt: new Date(),
          },
        });
        updatedCount++;
      } else {
        await prisma.potentialMatch.create({
          data: {
            maleUserId,
            femaleUserId,
            aiScore: score,
            shortReasoning: match.shortReasoning || match.reasoning || null,
            status: 'PENDING',
            scannedAt: new Date(),
            lastScanMethod: scanMethod,
            ...methodFields,
          },
        });
        newCount++;
      }
    } catch (err) {
      // Skip errors
    }
  }

  return { new: newCount, updated: updatedCount };
}

function getMethodFields(method: ScanMethod, match: any, score: number): Record<string, any> {
  const now = new Date();
  const reasoning = match.shortReasoning || match.reasoning || '';

  switch (method) {
    case 'hybrid':
      return {
        hybridScore: score,
        hybridReasoning: reasoning,
        hybridScannedAt: now,
        hybridScoreBreakdown: match.scoreBreakdown || null,
      };
    case 'algorithmic':
      return {
        algorithmicScore: score,
        algorithmicReasoning: reasoning,
        algorithmicScannedAt: now,
      };
    case 'vector':
      return {
        vectorScore: score,
        vectorReasoning: reasoning,
        vectorScannedAt: now,
      };
    case 'metrics_v2':
      return {
        metricsV2Score: score,
        metricsV2Reasoning: reasoning,
        metricsV2ScannedAt: now,
      };
    default:
      return {};
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}