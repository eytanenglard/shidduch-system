// ===========================================
// src/app/api/ai/batch-scan-all/route.ts
// ===========================================
// 🎯 סריקה לילית V2.4 - עם Smart Preparation
// 
// 🆕 V2.4 Changes:
// - Smart findUsersNeedingUpdate() - uses contentUpdatedAt
// - Skip logic in updateSingleUserData() - no redundant AI calls
// - Detailed preparation stats for frontend
// - Dynamic delay based on actual work done
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole, Gender, ScanSessionStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Import scan services
import { hybridScan } from "@/lib/services/hybridMatchingService";

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// ═══════════════════════════════════════════════════════════════
// GEMINI SETUP
// ═══════════════════════════════════════════════════════════════

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
let metricsModel: any = null;
let deepAnalysisModel: any = null;

function initGemini() {
  if (!GEMINI_API_KEY) {
    console.warn('[BatchScan] No Gemini API key found');
    return false;
  }
  
  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    metricsModel = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });
    
    deepAnalysisModel = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    });
  }
  
  return true;
}

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

type ScanMethod = 'hybrid' | 'algorithmic' | 'vector' | 'metrics_v2';
type ScanPhase = 'preparing' | 'scanning' | 'completed' | 'failed' | 'cancelled';

interface ScanSessionState {
  id: string;
  status: ScanSessionStatus;
  phase: ScanPhase;
  method: ScanMethod;
  
  preparationStats: {
    totalNeedingUpdate: number;
    currentIndex: number;
    currentUserName: string;
    updated: number;
    skipped: number;
    failed: number;
    aiCallsMade: number;
    embeddingCallsMade: number;
  };
  
  currentUserIndex: number;
  totalUsers: number;
  currentUserName?: string;
  matchesFoundSoFar: number;
  newMatchesFoundSoFar: number;
  usersScanned: number;
  progressPercent: number;
  scannedUserIds: string[];
  
  message?: string;
  error?: string;
  startedAt: Date;
}

// 🆕 V2.4: Interface for users needing update
interface UserNeedingUpdate {
  userId: string;
  profileId: string;
  firstName: string;
  lastName: string;
  needsMetrics: boolean;
  needsVectors: boolean;
  needsAiSummary: boolean;
}

// 🆕 V2.4: Stats for single user update
interface UpdateStats {
  aiSummaryCreated: boolean;
  metricsCalculated: boolean;
  vectorsCreated: boolean;
  skippedSteps: string[];
  aiCallsMade: number;
  embeddingCallsMade: number;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const PREPARATION_DELAY_MS = 2000; // Reduced from 3000
const SKIP_DELAY_MS = 100; // Fast delay when skipping
const MAX_NARRATIVE_LENGTH = 8000;
const SCAN_TIMEOUT_MS = 60 * 60 * 1000;

// ═══════════════════════════════════════════════════════════════
// DB-BASED SCAN STATE MANAGEMENT (unchanged from V2.3)
// ═══════════════════════════════════════════════════════════════

async function getOrCreateScanSession(
  matchmakerId: string,
  method: ScanMethod,
  skipPreparation: boolean
): Promise<{ session: any; isNew: boolean; isResuming: boolean }> {
  
  const existingSession = await prisma.scanSession.findFirst({
    where: {
      matchmakerId,
      status: { in: ['PENDING', 'IN_PROGRESS'] },
      startedAt: { gte: new Date(Date.now() - SCAN_TIMEOUT_MS) },
    },
    orderBy: { startedAt: 'desc' },
  });
  
  if (existingSession) {
    console.log(`[BatchScan] Found existing session: ${existingSession.id}`);
    const progressData = existingSession.progressData as any || {};
    
    return {
      session: existingSession,
      isNew: false,
      isResuming: existingSession.status === 'IN_PROGRESS' && progressData.scannedUserIds?.length > 0,
    };
  }
  
  const newSession = await prisma.scanSession.create({
    data: {
      matchmakerId,
      scanType: method,
      status: 'PENDING',
      startedAt: new Date(),
      progressData: {
        phase: skipPreparation ? 'scanning' : 'preparing',
        method,
        preparationStats: {
          totalNeedingUpdate: 0,
          currentIndex: 0,
          currentUserName: '',
          updated: 0,
          skipped: 0,
          failed: 0,
          aiCallsMade: 0,
          embeddingCallsMade: 0,
        },
        currentUserIndex: 0,
        totalUsers: 0,
        matchesFoundSoFar: 0,
        newMatchesFoundSoFar: 0,
        usersScanned: 0,
        progressPercent: 0,
        scannedUserIds: [],
        message: 'מתחיל סריקה...',
      },
    },
  });
  
  console.log(`[BatchScan] Created new session: ${newSession.id}`);
  return { session: newSession, isNew: true, isResuming: false };
}

async function updateScanProgress(
  sessionId: string,
  updates: Partial<ScanSessionState>
): Promise<void> {
  try {
    const session = await prisma.scanSession.findUnique({
      where: { id: sessionId },
      select: { progressData: true },
    });
    
    const currentProgress = (session?.progressData as any) || {};
    const newProgress = { ...currentProgress, ...updates };
    
    // Merge preparationStats properly
    if (updates.preparationStats) {
      newProgress.preparationStats = {
        ...currentProgress.preparationStats,
        ...updates.preparationStats,
      };
    }
    
    let dbStatus: ScanSessionStatus = 'IN_PROGRESS';
    if (updates.phase === 'completed') dbStatus = 'COMPLETED';
    else if (updates.phase === 'failed') dbStatus = 'FAILED';
    else if (updates.phase === 'cancelled') dbStatus = 'CANCELLED';
    
    await prisma.scanSession.update({
      where: { id: sessionId },
      data: {
        status: dbStatus,
        progressData: newProgress,
        currentPhase: updates.phase,
        currentUserIndex: updates.currentUserIndex,
        totalUsersToProcess: updates.totalUsers,
        totalUsersScanned: updates.usersScanned,
        matchesFound: updates.matchesFoundSoFar,
        ...(dbStatus === 'COMPLETED' || dbStatus === 'FAILED' || dbStatus === 'CANCELLED' 
          ? { completedAt: new Date() } 
          : {}),
      },
    });
  } catch (error) {
    console.error(`[BatchScan] Failed to update progress:`, error);
  }
}

async function markUserAsScanned(sessionId: string, userId: string): Promise<void> {
  try {
    const session = await prisma.scanSession.findUnique({
      where: { id: sessionId },
      select: { progressData: true },
    });
    
    const progress = (session?.progressData as any) || {};
    const scannedUserIds = progress.scannedUserIds || [];
    
    if (!scannedUserIds.includes(userId)) {
      scannedUserIds.push(userId);
      await prisma.scanSession.update({
        where: { id: sessionId },
        data: { progressData: { ...progress, scannedUserIds } },
      });
    }
  } catch (error) {
    console.error(`[BatchScan] Failed to mark user as scanned:`, error);
  }
}

async function isScanCancelled(sessionId: string): Promise<boolean> {
  try {
    const session = await prisma.scanSession.findUnique({
      where: { id: sessionId },
      select: { status: true },
    });
    return session?.status === 'CANCELLED';
  } catch {
    return false;
  }
}

async function getScanSessionState(sessionId: string): Promise<ScanSessionState | null> {
  try {
    const session = await prisma.scanSession.findUnique({
      where: { id: sessionId },
    });
    
    if (!session) return null;
    
    const progress = (session.progressData as any) || {};
    
    return {
      id: session.id,
      status: session.status,
      phase: progress.phase || 'scanning',
      method: (session.scanType || 'hybrid') as ScanMethod,
      preparationStats: progress.preparationStats || {
        totalNeedingUpdate: 0,
        currentIndex: 0,
        currentUserName: '',
        updated: 0,
        skipped: 0,
        failed: 0,
        aiCallsMade: 0,
        embeddingCallsMade: 0,
      },
      currentUserIndex: progress.currentUserIndex || session.currentUserIndex || 0,
      totalUsers: progress.totalUsers || session.totalUsersToProcess || 0,
      currentUserName: progress.currentUserName,
      matchesFoundSoFar: progress.matchesFoundSoFar || session.matchesFound || 0,
      newMatchesFoundSoFar: progress.newMatchesFoundSoFar || 0,
      usersScanned: progress.usersScanned || session.totalUsersScanned || 0,
      progressPercent: progress.progressPercent || 0,
      scannedUserIds: progress.scannedUserIds || [],
      message: progress.message,
      error: progress.error,
      startedAt: session.startedAt,
    };
  } catch (error) {
    console.error(`[BatchScan] Failed to get session state:`, error);
    return null;
  }
}

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
      method = 'hybrid',
      forceRefresh = false,
      incremental = false,
      userId,
      userIds,
      scanId: cancelScanId,
      skipPreparation = false,
    } = body;

    // Handle Cancel
    if (action === 'cancel' && cancelScanId) {
      await prisma.scanSession.update({
        where: { id: cancelScanId },
        data: {
          status: 'CANCELLED',
          completedAt: new Date(),
          progressData: { phase: 'cancelled', message: 'בוטל על ידי המשתמש' },
        },
      }).catch(() => {});
      
      return NextResponse.json({ success: true, message: 'Scan cancelled' });
    }

    // Check for existing scan
    const { session: scanSession, isNew, isResuming } = await getOrCreateScanSession(
      session.user.id,
      method as ScanMethod,
      skipPreparation
    );

    if (!isNew) {
      const state = await getScanSessionState(scanSession.id);
      
      if (scanSession.status === 'IN_PROGRESS' || scanSession.status === 'PENDING') {
        return NextResponse.json({
          success: true,
          status: isResuming ? 'resuming' : 'already_running',
          scanId: scanSession.id,
          method: state?.method || method,
          phase: state?.phase || 'scanning',
          progress: state,
        });
      }
    }

    const methodLabels: Record<ScanMethod, string> = {
      hybrid: 'היברידי 🔥',
      algorithmic: 'AI מתקדם 🧠',
      vector: 'דמיון מהיר ⚡',
      metrics_v2: 'מדדים V2 🎯',
    };

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[BatchScan] 🚀 Starting ${methodLabels[method as ScanMethod]} scan: ${scanSession.id}`);
    console.log(`[BatchScan] Method: ${method}, IsNew: ${isNew}, IsResuming: ${isResuming}`);
    console.log(`[BatchScan] Skip Preparation: ${skipPreparation}`);
    console.log(`${'='.repeat(60)}\n`);

    // Start scan in background
    runBatchScan(scanSession.id, {
      action,
      method: method as ScanMethod,
      forceRefresh,
      incremental,
      userId,
      userIds,
      matchmakerId: session.user.id,
      skipPreparation,
      isResuming,
    }).catch(err => {
      console.error(`[BatchScan] Background scan error:`, err);
      updateScanProgress(scanSession.id, {
        phase: 'failed',
        error: err.message,
        message: `שגיאה: ${err.message}`,
      });
    });

    return NextResponse.json({
      success: true,
      scanId: scanSession.id,
      method,
      status: isResuming ? 'resuming' : 'pending',
      phase: skipPreparation ? 'scanning' : 'preparing',
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
    const checkActive = searchParams.get('checkActive');

    if (checkActive === 'true') {
      const activeSession = await prisma.scanSession.findFirst({
        where: {
          matchmakerId: session.user.id,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          startedAt: { gte: new Date(Date.now() - SCAN_TIMEOUT_MS) },
        },
        orderBy: { startedAt: 'desc' },
      });
      
      if (activeSession) {
        const state = await getScanSessionState(activeSession.id);
        return NextResponse.json({ success: true, hasActiveScan: true, scan: state });
      }
      
      return NextResponse.json({ success: true, hasActiveScan: false });
    }

    if (!scanId) {
      return NextResponse.json({
        name: "NeshamaTech Multi-Method Batch Scan API",
        version: "2.4",
        methods: ['hybrid', 'algorithmic', 'vector', 'metrics_v2'],
        features: ['smart_preparation', 'skip_redundant_ai', 'contentUpdatedAt'],
      });
    }

    const state = await getScanSessionState(scanId);
    if (!state) {
      return NextResponse.json({ success: false, error: "Scan not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      scan: {
        id: state.id,
        status: state.status,
        method: state.method,
        phase: state.phase,
        preparationStats: state.preparationStats,
        currentUserIndex: state.currentUserIndex,
        totalUsers: state.totalUsers,
        currentUserName: state.currentUserName,
        progressPercent: state.progressPercent,
        matchesFoundSoFar: state.matchesFoundSoFar,
        newMatchesFoundSoFar: state.newMatchesFoundSoFar,
        usersScanned: state.usersScanned,
        message: state.message,
        error: state.error,
        stats: {
          matchesFoundSoFar: state.matchesFoundSoFar,
          preparationUpdated: state.preparationStats.updated,
          preparationSkipped: state.preparationStats.skipped,
          preparationFailed: state.preparationStats.failed,
        },
      },
    });

  } catch (error) {
    console.error('[BatchScan] GET Error:', error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════
// 🆕 V2.4: SMART PREPARATION - findUsersNeedingUpdate
// ═══════════════════════════════════════════════════════════════

async function findUsersNeedingUpdate(): Promise<UserNeedingUpdate[]> {
  console.log('[Preparation] Finding users truly needing update...');
  
  // 🆕 V2.4: Smart query that checks actual needs
  const usersNeedingUpdate = await prisma.$queryRaw<any[]>`
    SELECT 
      u.id as "userId",
      p.id as "profileId",
      u."firstName",
      u."lastName",
      
      -- Check if metrics are missing
      CASE WHEN pm.id IS NULL THEN true ELSE false END as "needsMetrics",
      
      -- Check if vectors are missing
      CASE WHEN pv."selfVector" IS NULL THEN true ELSE false END as "needsVectors",
      
      -- Check if AI Summary is missing or too short
      CASE 
        WHEN p."aiProfileSummary" IS NULL THEN true
        WHEN p."aiProfileSummary"->>'personalitySummary' IS NULL THEN true
        WHEN LENGTH(COALESCE(p."aiProfileSummary"->>'personalitySummary', '')) < 50 THEN true
        ELSE false 
      END as "needsAiSummary",
      
      -- For debugging
      p."contentUpdatedAt",
      pm."updatedAt" as "metricsUpdatedAt"
      
    FROM "User" u
    JOIN "Profile" p ON p."userId" = u.id
    LEFT JOIN "profile_metrics" pm ON pm."profileId" = p.id
    LEFT JOIN "profile_vectors" pv ON pv."profileId" = p.id
    
    WHERE 
      -- Condition 1: Missing data entirely
      (
        pm.id IS NULL
        OR pv."selfVector" IS NULL
        OR p."aiProfileSummary" IS NULL
        OR p."aiProfileSummary"->>'personalitySummary' IS NULL
        OR LENGTH(COALESCE(p."aiProfileSummary"->>'personalitySummary', '')) < 50
      )
      OR
      -- Condition 2: Content was updated after metrics were calculated
      (
        pm.id IS NOT NULL 
        AND p."contentUpdatedAt" IS NOT NULL
        AND p."contentUpdatedAt" > pm."updatedAt"
      )
      
    ORDER BY 
      -- New users (no metrics) first
      CASE WHEN pm.id IS NULL THEN 0 ELSE 1 END,
      -- Then by content update date
      p."contentUpdatedAt" DESC NULLS LAST
      
    LIMIT 100
  `;

  // 🆕 V2.4: Enhanced logging with breakdown
  const breakdown = {
    missingMetrics: usersNeedingUpdate.filter(u => u.needsMetrics).length,
    missingVectors: usersNeedingUpdate.filter(u => u.needsVectors).length,
    missingAiSummary: usersNeedingUpdate.filter(u => u.needsAiSummary).length,
    contentChanged: usersNeedingUpdate.filter(u => !u.needsMetrics && !u.needsVectors && !u.needsAiSummary).length,
  };

  console.log(`[Preparation] Found ${usersNeedingUpdate.length} users truly needing update`);
  console.log(`[Preparation] Breakdown:`);
  console.log(`   - Missing Metrics: ${breakdown.missingMetrics}`);
  console.log(`   - Missing Vectors: ${breakdown.missingVectors}`);
  console.log(`   - Missing AI Summary: ${breakdown.missingAiSummary}`);
  console.log(`   - Content Changed: ${breakdown.contentChanged}`);

  return usersNeedingUpdate.map(u => ({
    userId: u.userId,
    profileId: u.profileId,
    firstName: u.firstName,
    lastName: u.lastName,
    needsMetrics: u.needsMetrics,
    needsVectors: u.needsVectors,
    needsAiSummary: u.needsAiSummary,
  }));
}

// ═══════════════════════════════════════════════════════════════
// 🆕 V2.4: SMART updateSingleUserData - Skip redundant steps
// ═══════════════════════════════════════════════════════════════

async function updateSingleUserData(
  userId: string,
  profileId: string,
  firstName: string,
  lastName: string,
  needsMetrics: boolean,
  needsVectors: boolean,
  needsAiSummary: boolean
): Promise<{ success: boolean; error?: string; stats: UpdateStats }> {
  
  const stats: UpdateStats = {
    aiSummaryCreated: false,
    metricsCalculated: false,
    vectorsCreated: false,
    skippedSteps: [],
    aiCallsMade: 0,
    embeddingCallsMade: 0,
  };

  console.log(`[Preparation] Updating ${firstName} ${lastName}...`);
  console.log(`   📋 Needs: Metrics=${needsMetrics}, Vectors=${needsVectors}, AI Summary=${needsAiSummary}`);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        questionnaireResponses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user || !user.profile) {
      return { success: false, error: 'User or profile not found', stats };
    }

    const profile = user.profile;
    const questionnaire = user.questionnaireResponses?.[0];
    let aiProfileSummary = profile.aiProfileSummary as any;

    // ═══════════════════════════════════════════════════════════
    // Step 1: AI Profile Summary (only if truly needed)
    // ═══════════════════════════════════════════════════════════
    if (needsAiSummary && deepAnalysisModel) {
      console.log(`   📊 Creating AI profile summary...`);
      
      const narrative = generateNarrativeForDeepAnalysis(user, profile, questionnaire);
      
      if (narrative && narrative.length >= 100) {
        const newSummary = await generateAiProfileSummary(narrative);
        
        if (newSummary) {
          aiProfileSummary = {
            ...(aiProfileSummary || {}),
            personalitySummary: newSummary.personalitySummary,
            lookingForSummary: newSummary.lookingForSummary,
            lastDeepAnalysisAt: new Date().toISOString(),
          };

          await prisma.profile.update({
            where: { id: profileId },
            data: { aiProfileSummary },
          });

          stats.aiSummaryCreated = true;
          stats.aiCallsMade++;
          console.log(`   ✓ AI Summary created`);
        }
      }
    } else if (!needsAiSummary) {
      stats.skippedSteps.push('ai_summary');
      console.log(`   ⏭️ AI Summary exists, skipping`);
    }

    // ═══════════════════════════════════════════════════════════
    // Step 2: Metrics (only if truly needed)
    // ═══════════════════════════════════════════════════════════
    if (needsMetrics && metricsModel) {
      console.log(`   🤖 Calculating metrics...`);
      
      const narrativeResult = buildFullNarrativeWithHardData(user, profile, questionnaire, aiProfileSummary);
      
      if (narrativeResult && narrativeResult.narrative.length >= 200) {
        const metrics = await calculateMetricsWithAI(
          narrativeResult.narrative,
          profile.gender,
          narrativeResult.missingFields
        );

        if (metrics) {
          await prisma.profileMetrics.upsert({
            where: { profileId },
            create: {
              profileId,
              calculatedBy: 'AI_AUTO',
              ...metrics,
            },
            update: {
              calculatedBy: 'AI_AUTO',
              updatedAt: new Date(),
              ...metrics,
            },
          });
          
          stats.metricsCalculated = true;
          stats.aiCallsMade++;
          console.log(`   ✓ Metrics saved`);

          // Step 3a: Vectors (after creating new metrics)
          console.log(`   📐 Creating vectors...`);
          
          const selfVector = await generateTextEmbedding(metrics.aiPersonalitySummary);
          const seekingVector = await generateTextEmbedding(metrics.aiSeekingSummary);

          if (selfVector && seekingVector) {
            await saveVectors(profileId, selfVector, seekingVector);
            stats.vectorsCreated = true;
            stats.embeddingCallsMade += 2;
            console.log(`   ✓ Vectors saved`);
          }
        }
      }
    } else if (!needsMetrics) {
      stats.skippedSteps.push('metrics');
      console.log(`   ⏭️ Metrics exist and up-to-date, skipping`);
      
      // Step 3b: Maybe still need vectors from existing metrics
      if (needsVectors) {
        console.log(`   📐 Creating vectors from existing metrics...`);
        
        const existingMetrics = await prisma.profileMetrics.findUnique({
          where: { profileId },
          select: { aiPersonalitySummary: true, aiSeekingSummary: true }
        });
        
        if (existingMetrics?.aiPersonalitySummary && existingMetrics?.aiSeekingSummary) {
          const selfVector = await generateTextEmbedding(existingMetrics.aiPersonalitySummary);
          const seekingVector = await generateTextEmbedding(existingMetrics.aiSeekingSummary);
          
          if (selfVector && seekingVector) {
            await saveVectors(profileId, selfVector, seekingVector);
            stats.vectorsCreated = true;
            stats.embeddingCallsMade += 2;
            console.log(`   ✓ Vectors saved`);
          }
        }
      } else {
        stats.skippedSteps.push('vectors');
        console.log(`   ⏭️ Vectors exist, skipping`);
      }
    }

    // Summary log
    const actionsTaken = [
      stats.aiSummaryCreated ? 'AI Summary' : null,
      stats.metricsCalculated ? 'Metrics' : null,
      stats.vectorsCreated ? 'Vectors' : null,
    ].filter(Boolean);

    if (actionsTaken.length > 0) {
      console.log(`   ✅ ${firstName} ${lastName} - Updated: ${actionsTaken.join(', ')}`);
    } else {
      console.log(`   ✅ ${firstName} ${lastName} - Nothing needed (all current)`);
    }
    
    return { success: true, stats };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`   ❌ Error updating ${firstName}: ${errorMsg}`);
    return { success: false, error: errorMsg, stats };
  }
}

// Helper function to save vectors
async function saveVectors(profileId: string, selfVector: number[], seekingVector: number[]): Promise<void> {
  const selfVectorStr = `[${selfVector.join(',')}]`;
  const seekingVectorStr = `[${seekingVector.join(',')}]`;

  const existingVector = await prisma.$queryRaw<any[]>`
    SELECT id FROM "profile_vectors" WHERE "profileId" = ${profileId}
  `;

  if (existingVector && existingVector.length > 0) {
    await prisma.$executeRawUnsafe(`
      UPDATE "profile_vectors"
      SET 
        "selfVector" = $1::vector,
        "seekingVector" = $2::vector,
        "selfVectorUpdatedAt" = NOW(),
        "seekingVectorUpdatedAt" = NOW(),
        "updatedAt" = NOW()
      WHERE "profileId" = $3
    `, selfVectorStr, seekingVectorStr, profileId);
  } else {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "profile_vectors" (
        "id", "profileId", "createdAt", "updatedAt",
        "selfVector", "seekingVector", "selfVectorUpdatedAt", "seekingVectorUpdatedAt"
      ) VALUES (
        gen_random_uuid(), $1, NOW(), NOW(),
        $2::vector, $3::vector, NOW(), NOW()
      )
    `, profileId, selfVectorStr, seekingVectorStr);
  }
}

// ═══════════════════════════════════════════════════════════════
// 🔥 MAIN BATCH SCAN - Updated with smart preparation
// ═══════════════════════════════════════════════════════════════

async function runBatchScan(
  sessionId: string,
  options: {
    action: string;
    method: ScanMethod;
    forceRefresh: boolean;
    incremental: boolean;
    userId?: string;
    userIds?: string[];
    matchmakerId: string;
    skipPreparation?: boolean;
    isResuming?: boolean;
  }
): Promise<void> {
  const startTime = Date.now();

  try {
    await updateScanProgress(sessionId, {
      phase: options.skipPreparation ? 'scanning' : 'preparing',
      message: 'מתחיל סריקה...',
    });

    // ═══════════════════════════════════════════════════════════
    // PHASE 1: SMART PREPARATION
    // ═══════════════════════════════════════════════════════════
    
    if (!options.skipPreparation) {
      await updateScanProgress(sessionId, {
        phase: 'preparing',
        message: 'בודק מי באמת צריך עדכון נתונים...',
      });
      
      const geminiReady = initGemini();
      
      if (geminiReady) {
        // 🆕 V2.4: Smart detection
        const usersNeedingUpdate = await findUsersNeedingUpdate();
        
        // Initialize stats
        let updated = 0;
        let skipped = 0;
        let failed = 0;
        let totalAiCalls = 0;
        let totalEmbeddingCalls = 0;
        
        await updateScanProgress(sessionId, {
          preparationStats: {
            totalNeedingUpdate: usersNeedingUpdate.length,
            currentIndex: 0,
            currentUserName: '',
            updated: 0,
            skipped: 0,
            failed: 0,
            aiCallsMade: 0,
            embeddingCallsMade: 0,
          },
        });
        
        if (usersNeedingUpdate.length > 0) {
          console.log(`\n[BatchScan] ═══ PREPARATION PHASE ═══`);
          console.log(`[BatchScan] Updating ${usersNeedingUpdate.length} users (smart detection)...`);
          
          for (let i = 0; i < usersNeedingUpdate.length; i++) {
            if (await isScanCancelled(sessionId)) {
              console.log(`[BatchScan] Preparation cancelled at user ${i + 1}`);
              break;
            }
            
            const user = usersNeedingUpdate[i];
            
            await updateScanProgress(sessionId, {
              preparationStats: {
                totalNeedingUpdate: usersNeedingUpdate.length,
                currentIndex: i + 1,
                currentUserName: `${user.firstName} ${user.lastName}`,
                updated,
                skipped,
                failed,
                aiCallsMade: totalAiCalls,
                embeddingCallsMade: totalEmbeddingCalls,
              },
              message: `מכין נתונים: ${user.firstName} ${user.lastName} (${i + 1}/${usersNeedingUpdate.length})`,
            });
            
            // 🆕 V2.4: Pass the specific needs
            const result = await updateSingleUserData(
              user.userId,
              user.profileId,
              user.firstName,
              user.lastName,
              user.needsMetrics,
              user.needsVectors,
              user.needsAiSummary
            );
            
            if (result.success) {
              const didWork = result.stats.aiSummaryCreated || 
                              result.stats.metricsCalculated || 
                              result.stats.vectorsCreated;
              
              if (didWork) {
                updated++;
              } else {
                skipped++;
              }
              
              totalAiCalls += result.stats.aiCallsMade;
              totalEmbeddingCalls += result.stats.embeddingCallsMade;
            } else {
              failed++;
            }
            
            // 🆕 V2.4: Dynamic delay - shorter if we skipped everything
            const didWork = result.stats.aiCallsMade > 0 || result.stats.embeddingCallsMade > 0;
            const delay = didWork ? PREPARATION_DELAY_MS : SKIP_DELAY_MS;
            
            if (i < usersNeedingUpdate.length - 1) {
              await sleep(delay);
            }
          }
          
          console.log(`[BatchScan] Preparation complete:`);
          console.log(`   - Updated: ${updated}`);
          console.log(`   - Skipped: ${skipped}`);
          console.log(`   - Failed: ${failed}`);
          console.log(`   - AI Calls: ${totalAiCalls}`);
          console.log(`   - Embedding Calls: ${totalEmbeddingCalls}`);
        } else {
          console.log(`[BatchScan] No users need preparation - all up to date! 🎉`);
        }
      }
    }

    // Check cancellation before scanning
    if (await isScanCancelled(sessionId)) {
      await updateScanProgress(sessionId, {
        phase: 'cancelled',
        message: 'הסריקה בוטלה',
      });
      return;
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 2: SCANNING (unchanged from V2.3)
    // ═══════════════════════════════════════════════════════════
    
    await updateScanProgress(sessionId, {
      phase: 'scanning',
      message: 'טוען משתמשים לסריקה...',
    });

    const currentState = await getScanSessionState(sessionId);
    const alreadyScannedUserIds = new Set(currentState?.scannedUserIds || []);
    
    const allUsersToScan = await getUsersToScan(options);
    
    const usersToScan = options.isResuming
      ? allUsersToScan.filter(u => !alreadyScannedUserIds.has(u.id))
      : allUsersToScan;
    
    const totalUsers = allUsersToScan.length;
    const alreadyScannedCount = alreadyScannedUserIds.size;
    
    await updateScanProgress(sessionId, {
      totalUsers,
      usersScanned: alreadyScannedCount,
      message: options.isResuming 
        ? `ממשיך סריקה: ${usersToScan.length} משתמשים נותרו`
        : `נמצאו ${totalUsers} משתמשים לסריקה`,
    });
    
    console.log(`\n[BatchScan] ═══ SCANNING PHASE ═══`);
    console.log(`[BatchScan] Total: ${totalUsers}, Already scanned: ${alreadyScannedCount}, Remaining: ${usersToScan.length}`);

    if (usersToScan.length === 0) {
      await updateScanProgress(sessionId, {
        phase: 'completed',
        progressPercent: 100,
        message: options.isResuming 
          ? 'הסריקה כבר הושלמה קודם'
          : 'אין משתמשים לסריקה',
      });
      return;
    }

    let totalMatches = currentState?.matchesFoundSoFar || 0;
    let newMatches = currentState?.newMatchesFoundSoFar || 0;

    for (let i = 0; i < usersToScan.length; i++) {
      if (await isScanCancelled(sessionId)) {
        console.log(`[BatchScan] Scan cancelled at user ${i + 1}`);
        break;
      }

      const user = usersToScan[i];
      const overallIndex = alreadyScannedCount + i + 1;
      
      await updateScanProgress(sessionId, {
        currentUserIndex: overallIndex,
        currentUserName: `${user.firstName} ${user.lastName}`,
        progressPercent: Math.round((overallIndex / totalUsers) * 100),
        message: `סורק ${user.firstName} ${user.lastName}...`,
      });

      console.log(`[BatchScan] [${overallIndex}/${totalUsers}] Scanning ${user.firstName} (${options.method})`);

      try {
        const checkCancelled = async () => await isScanCancelled(sessionId);
        
        const result = await scanUserByMethod(
          user.id, 
          options.method, 
          options.forceRefresh, 
          sessionId,
          checkCancelled
        );

        const saved = await saveToPotentialMatches(
          user.id,
          user.gender,
          result.matches,
          options.method
        );

        totalMatches += result.matches.length;
        newMatches += saved.new;
        
        await markUserAsScanned(sessionId, user.id);
        
        await updateScanProgress(sessionId, {
          matchesFoundSoFar: totalMatches,
          newMatchesFoundSoFar: newMatches,
          usersScanned: overallIndex,
        });

        console.log(`[BatchScan] ✓ ${user.firstName}: ${result.matches.length} matches (${saved.new} new)`);

      } catch (userError) {
        console.error(`[BatchScan] Error scanning ${user.firstName}:`, userError);
        await markUserAsScanned(sessionId, user.id);
      }

      await sleep(400);
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 3: COMPLETE
    // ═══════════════════════════════════════════════════════════
    
    const duration = Date.now() - startTime;
    const finalState = await getScanSessionState(sessionId);
    
    if (finalState?.phase === 'cancelled' || await isScanCancelled(sessionId)) {
      return;
    }
    
    await updateScanProgress(sessionId, {
      phase: 'completed',
      progressPercent: 100,
      message: `הסריקה הושלמה! נמצאו ${totalMatches} התאמות (${newMatches} חדשות)`,
    });

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[BatchScan] ✅ ${options.method} scan completed in ${(duration / 1000 / 60).toFixed(1)} minutes`);
    console.log(`[BatchScan] Matches: ${totalMatches} (${newMatches} new)`);
    console.log(`${'='.repeat(60)}\n`);

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await updateScanProgress(sessionId, {
      phase: 'failed',
      error: errorMsg,
      message: `שגיאה: ${errorMsg}`,
    });
    console.error(`[BatchScan] ❌ Failed:`, error);
  }
}

// ═══════════════════════════════════════════════════════════════
// SCAN BY METHOD (unchanged)
// ═══════════════════════════════════════════════════════════════

async function scanUserByMethod(
  userId: string,
  method: ScanMethod,
  forceRefresh: boolean,
  sessionId: string,
  checkCancelled?: () => Promise<boolean>
): Promise<{ matches: any[] }> {

  const baseOptions = {
    autoSave: false,
    forceRefresh,
    checkCancelled,
    skipAlreadyScannedPairs: true,
    saveScannedPairs: true,
    sessionId,
  };

  switch (method) {
    case 'hybrid':
      return await hybridScan(userId, {
        ...baseOptions,
        maxTier1Candidates: 300,
        maxTier2Candidates: 50,
        maxTier3Candidates: 20,
        topForDeepAnalysis: 15,
        useVectors: true,
        useBackgroundAnalysis: true,
        useAIFirstPass: true,
        useAIDeepAnalysis: true,
        minScoreToSave: 65,
      });

    case 'algorithmic':
      return await hybridScan(userId, {
        ...baseOptions,
        maxTier1Candidates: 200,
        maxTier2Candidates: 30,
        topForDeepAnalysis: 20,
        useVectors: false,
        useBackgroundAnalysis: true,
        useAIFirstPass: true,
        useAIDeepAnalysis: true,
        minScoreToSave: 65,
      });

    case 'vector':
      return await hybridScan(userId, {
        ...baseOptions,
        maxTier1Candidates: 500,
        maxTier2Candidates: 100,
        topForDeepAnalysis: 0,
        useVectors: true,
        useBackgroundAnalysis: false,
        useAIFirstPass: false,
        useAIDeepAnalysis: false,
        minScoreToSave: 60,
      });

    case 'metrics_v2':
      return await hybridScan(userId, {
        ...baseOptions,
        maxTier1Candidates: 300,
        maxTier2Candidates: 80,
        topForDeepAnalysis: 10,
        useVectors: true,
        useBackgroundAnalysis: true,
        useAIFirstPass: true,
        useAIDeepAnalysis: false,
        minScoreToSave: 65,
      });

    default:
      return await hybridScan(userId, baseOptions);
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS (unchanged)
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
    profile: { isNot: null },
  };

  if (options.action === 'scan_new_users') {
    where.createdAt = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
  }

  const users = await prisma.user.findMany({
    where,
    select: { id: true, firstName: true, lastName: true, profile: { select: { gender: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return users.map(u => ({ ...u, gender: u.profile?.gender || Gender.MALE }));
}

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
    const bestReasoning = match.detailedReasoning || match.shortReasoning || match.reasoning || null;

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
              shortReasoning: bestReasoning,
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
            shortReasoning: bestReasoning,
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
  const reasoning = match.detailedReasoning || match.shortReasoning || match.reasoning || '';
  const breakdown = match.scoreBreakdown || null;

  switch (method) {
    case 'hybrid':
      return {
        hybridScore: score,
        hybridReasoning: reasoning,
        hybridScannedAt: now,
        hybridScoreBreakdown: breakdown,
      };
    case 'algorithmic':
      return {
        algorithmicScore: score,
        algorithmicReasoning: reasoning,
        algorithmicScannedAt: now,
        algorithmicScoreBreakdown: breakdown,
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
        metricsV2ScoreBreakdown: breakdown,
      };
    default:
      return {};
  }
}

// ═══════════════════════════════════════════════════════════════
// AI HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateAge(birthDate: any): number | null {
  if (!birthDate) return null;
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function generateNarrativeForDeepAnalysis(user: any, profile: any, questionnaire: any): string {
  const parts: string[] = [];

  const age = calculateAge(profile.birthDate);
  const childrenStatus = profile.hasChildrenFromPrevious ? 'Has children' : 'No children';

  const personalInfo = `User Profile Summary:
Name: ${user.firstName} ${user.lastName}
Gender: ${profile.gender}
Age: ${age || 'Not specified'}
Height: ${profile.height ? profile.height + 'cm' : 'Not specified'}
Location: ${profile.city || 'Not specified'}
Marital Status: ${profile.maritalStatus || 'Not specified'} (${childrenStatus})

Religious Identity:
- Level: ${profile.religiousLevel || 'Not specified'}
- Journey: ${profile.religiousJourney || 'Not specified'}
- Shomer Negiah: ${profile.shomerNegiah ? 'Yes' : 'No/Unknown'}
${profile.kippahType ? `- Kippah: ${profile.kippahType}` : ''}
${profile.headCovering ? `- Head Covering: ${profile.headCovering}` : ''}

Professional & Education:
- Occupation: ${profile.occupation || 'Not specified'}
- Education: ${profile.education || 'Not specified'}`;

  parts.push(personalInfo);

  if (profile.about) parts.push(`About Me:\n${profile.about}`);
  if (profile.profileHeadline) parts.push(`Headline:\n${profile.profileHeadline}`);
  if (profile.matchingNotes) parts.push(`Looking For:\n${profile.matchingNotes}`);
  if (profile.internalMatchmakerNotes) parts.push(`Matchmaker Notes:\n${profile.internalMatchmakerNotes}`);

  if (questionnaire) {
    const formatQ = (json: any) => {
      if (!json) return '';
      if (Array.isArray(json)) {
        return json.map((v: any) => v.value || v).join('. ');
      }
      return Object.values(json).map((v: any) => (v as any).answer || (v as any).value || v).join('. ');
    };

    if (questionnaire.valuesAnswers) parts.push(`Values:\n${formatQ(questionnaire.valuesAnswers)}`);
    if (questionnaire.personalityAnswers) parts.push(`Personality:\n${formatQ(questionnaire.personalityAnswers)}`);
    if (questionnaire.relationshipAnswers) parts.push(`Relationship:\n${formatQ(questionnaire.relationshipAnswers)}`);
    if (questionnaire.partnerAnswers) parts.push(`Partner Expectations:\n${formatQ(questionnaire.partnerAnswers)}`);
  }

  return parts.join('\n\n---\n\n').substring(0, MAX_NARRATIVE_LENGTH);
}

async function generateAiProfileSummary(narrative: string): Promise<{ personalitySummary: string; lookingForSummary: string } | null> {
  if (!deepAnalysisModel) return null;

  const prompt = `
You are the Senior Analyst at NeshamaTech. Create a comprehensive profile analysis.

**Output Format:** Valid JSON in Hebrew.
{
  "personalitySummary": "Multi-paragraph analysis of: Bio, Career, Religious profile, Personality & vibe...",
  "lookingForSummary": "Multi-paragraph analysis of: Relationship dynamics, Deal breakers, Partner specs, Matchmaker directive..."
}

--- User Data ---
${narrative}
--- End Data ---
`;

  try {
    const result = await runGenAIWithRetry(async () => {
      return await deepAnalysisModel.generateContent(prompt);
    });

    let jsonString = result.response.text();
    if (!jsonString) return null;

    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7, -3).trim();
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.slice(3, -3).trim();
    }

    return JSON.parse(jsonString);
  } catch (error) {
    console.error('[AI] Profile summary error:', error);
    return null;
  }
}

function buildFullNarrativeWithHardData(
  user: any,
  profile: any,
  questionnaire: any,
  aiProfileSummary: any
): { narrative: string; missingFields: string[] } | null {
  
  const parts: string[] = [];
  const missingFields: string[] = [];

  const age = calculateAge(profile.birthDate);
  if (!age) missingFields.push('age');

  parts.push(`=== פרופיל בסיסי ===
שם: ${user.firstName} ${user.lastName}
מגדר: ${profile.gender}
גיל: ${age || 'לא צוין'}
עיר: ${profile.city || 'לא צוין'}
רמה דתית: ${profile.religiousLevel || 'לא צוין'}
מקצוע: ${profile.occupation || 'לא צוין'}
השכלה: ${profile.education || 'לא צוין'}`);

  if (profile.about) {
    parts.push(`=== אודות ===\n${profile.about}`);
  }

  if (aiProfileSummary?.personalitySummary) {
    parts.push(`=== ניתוח אישיות ===\n${aiProfileSummary.personalitySummary}`);
  }

  if (aiProfileSummary?.lookingForSummary) {
    parts.push(`=== מה מחפש/ת ===\n${aiProfileSummary.lookingForSummary}`);
  }

  if (profile.matchingNotes) {
    parts.push(`=== הערות שידוך ===\n${profile.matchingNotes}`);
  }

  if (!profile.city) missingFields.push('city');
  if (!profile.religiousLevel) missingFields.push('religiousLevel');
  if (!profile.preferredAgeMin) missingFields.push('preferredAgeMin');
  if (!profile.preferredAgeMax) missingFields.push('preferredAgeMax');

  const narrative = parts.join('\n\n');
  
  if (narrative.length < 200) return null;
  
  return { narrative, missingFields };
}

async function calculateMetricsWithAI(
  narrative: string,
  gender: string,
  missingFields: string[]
): Promise<any | null> {
  if (!metricsModel) return null;

  const prompt = `אתה מנתח פרופילים מומחה. חשב מדדים מספריים (0-100) עבור הפרופיל הבא.

${missingFields.length > 0 ? `שדות חסרים שצריך לנחש: ${missingFields.join(', ')}` : ''}

--- פרופיל ---
${narrative}
--- סוף פרופיל ---

החזר JSON בלבד עם המבנה הבא:
{
  "confidenceScore": 70,
  "dataCompleteness": 60,
  "socialEnergy": 50,
  "emotionalExpression": 50,
  "stabilityVsSpontaneity": 50,
  "religiousStrictness": 50,
  "careerOrientation": 50,
  "urbanScore": 50,
  "socioEconomicLevel": 50,
  "jobSeniorityLevel": 50,
  "educationLevelScore": 50,
  "appearancePickiness": 50,
  "inferredAge": null,
  "inferredCity": null,
  "inferredReligiousLevel": null,
  "inferredPreferredAgeMin": null,
  "inferredPreferredAgeMax": null,
  "aiPersonalitySummary": "סיכום קצר של האישיות",
  "aiSeekingSummary": "סיכום קצר של מה מחפש/ת",
  "aiBackgroundSummary": "סיכום רקע",
  "aiMatchmakerGuidelines": "הנחיות לשדכן",
  "aiInferredDealBreakers": [],
  "aiInferredMustHaves": [],
  "difficultyFlags": []
}`;

  try {
    const result = await runGenAIWithRetry(async () => {
      return await metricsModel.generateContent(prompt);
    });

    let jsonString = result.response.text();
    if (!jsonString) return null;

    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7, -3).trim();
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.slice(3, -3).trim();
    }

    return JSON.parse(jsonString);
  } catch (error) {
    console.error('[AI] Metrics calculation error:', error);
    return null;
  }
}

async function generateTextEmbedding(text: string | null | undefined): Promise<number[] | null> {
  if (!text || text.length < 10 || !genAI || !GEMINI_API_KEY) return null;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: { parts: [{ text }] }
        })
      }
    );

    if (!response.ok) {
      console.error(`[Embedding] Error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.embedding?.values || null;
  } catch (error) {
    console.error('[Embedding] Error:', error);
    return null;
  }
}

async function runGenAIWithRetry<T>(fn: () => Promise<T>, retries = 5, baseDelay = 5000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error.message?.includes('429') || error.message?.includes('Resource exhausted');
      const isServerOverload = error.message?.includes('503') || error.message?.includes('Overloaded');

      if (i < retries - 1 && (isRateLimit || isServerOverload)) {
        const waitTime = baseDelay * Math.pow(2, i);
        console.log(`[AI] Rate limit hit. Waiting ${waitTime / 1000}s (attempt ${i + 1}/${retries})...`);
        await sleep(waitTime);
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}