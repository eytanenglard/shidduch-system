// ===========================================
// src/app/api/ai/batch-scan-all/route.ts
// ===========================================
// 🎯 סריקה לילית V2.6 - עם מילוי שדות חסרים אוטומטי
// 
// 🆕 V2.6 Changes:
// - Auto-fill missing profile fields (religiousLevel, maritalStatus, height, birthDate)
// - AI inference with confidence levels (HIGH/MEDIUM/LOW)
// - Only fills fields if confidence >= MEDIUM and field is empty
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
      generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
    });
    
    deepAnalysisModel = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
    });
  }
  
  return true;
}

// ═══════════════════════════════════════════════════════════════
// 🆕 V2.6: VALID VALUES FOR AI INFERENCE
// ═══════════════════════════════════════════════════════════════

const VALID_MARITAL_STATUSES = ['SINGLE', 'DIVORCED', 'WIDOWED'] as const;

const VALID_RELIGIOUS_LEVELS = [
  'dati_leumi_standard',
  'dati_leumi_liberal',
  'dati_leumi_torani',
  'masorti_strong',
  'masorti_light',
  'secular_traditional_connection',
  'secular',
  'spiritual_not_religious',
  'charedi_modern',
  'charedi_litvak',
  'charedi_sephardic',
  'charedi_hasidic',
  'chabad',
  'breslov',
  'other',
] as const;

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

type ScanMethod = 'hybrid' | 'algorithmic' | 'vector' | 'metrics_v2';
type ScanPhase = 'preparing' | 'scanning' | 'completed' | 'failed' | 'cancelled';

interface AICallStats {
  tier3FirstPass: {
    batchesSent: number;
    candidatesAnalyzed: number;
    callsMade: number;
    totalTokensEstimated: number;
    durationMs: number;
  };
  tier4DeepAnalysis: {
    candidatesAnalyzed: number;
    callsMade: number;
    totalTokensEstimated: number;
    durationMs: number;
  };
  embeddings: {
    callsMade: number;
    durationMs: number;
  };
  total: {
    aiCalls: number;
    embeddingCalls: number;
    estimatedCost: number;
  };
}

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
    fieldsAutoFilled: number; // 🆕 V2.6
  };
  
  currentUserIndex: number;
  totalUsers: number;
  currentUserName?: string;
  matchesFoundSoFar: number;
  newMatchesFoundSoFar: number;
  usersScanned: number;
  progressPercent: number;
  scannedUserIds: string[];
  aiCallStats?: AICallStats;

  message?: string;
  error?: string;
  startedAt: Date;
}

interface UserNeedingUpdate {
  userId: string;
  profileId: string;
  firstName: string;
  lastName: string;
  needsMetrics: boolean;
  needsVectors: boolean;
  needsAiSummary: boolean;
}

interface UpdateStats {
  aiSummaryCreated: boolean;
  metricsCalculated: boolean;
  vectorsCreated: boolean;
  skippedSteps: string[];
  aiCallsMade: number;
  embeddingCallsMade: number;
  fieldsAutoFilled: string[]; // 🆕 V2.6
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const PREPARATION_DELAY_MS = 2000;
const SKIP_DELAY_MS = 100;
const MAX_NARRATIVE_LENGTH = 8000;
const SCAN_TIMEOUT_MS = 60 * 60 * 1000;

// ═══════════════════════════════════════════════════════════════
// DB-BASED SCAN STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

async function getOrCreateScanSession(
  matchmakerId: string, method: ScanMethod, skipPreparation: boolean
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
    const progressData = existingSession.progressData as any || {};
    return {
      session: existingSession, isNew: false,
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
          totalNeedingUpdate: 0, currentIndex: 0, currentUserName: '',
          updated: 0, skipped: 0, failed: 0, aiCallsMade: 0, embeddingCallsMade: 0,
          fieldsAutoFilled: 0,
        },
        currentUserIndex: 0, totalUsers: 0,
        matchesFoundSoFar: 0, newMatchesFoundSoFar: 0,
        usersScanned: 0, progressPercent: 0, scannedUserIds: [],
        message: 'מתחיל סריקה...',
      },
    },
  });
  
  return { session: newSession, isNew: true, isResuming: false };
}

async function updateScanProgress(sessionId: string, updates: Partial<ScanSessionState>): Promise<void> {
  try {
    const session = await prisma.scanSession.findUnique({
      where: { id: sessionId }, select: { progressData: true },
    });
    
    const currentProgress = (session?.progressData as any) || {};
    const newProgress = { ...currentProgress, ...updates };
    
    if (updates.preparationStats) {
      newProgress.preparationStats = { ...currentProgress.preparationStats, ...updates.preparationStats };
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
          ? { completedAt: new Date() } : {}),
      },
    });
  } catch (error) {
    console.error(`[BatchScan] Failed to update progress:`, error);
  }
}

async function markUserAsScanned(sessionId: string, userId: string): Promise<void> {
  try {
    const session = await prisma.scanSession.findUnique({
      where: { id: sessionId }, select: { progressData: true },
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
      where: { id: sessionId }, select: { status: true },
    });
    return session?.status === 'CANCELLED';
  } catch { return false; }
}

async function getScanSessionState(sessionId: string): Promise<ScanSessionState | null> {
  try {
    const session = await prisma.scanSession.findUnique({ where: { id: sessionId } });
    if (!session) return null;
    const progress = (session.progressData as any) || {};
    
    return {
      id: session.id,
      status: session.status,
      phase: progress.phase || 'scanning',
      method: (session.scanType || 'hybrid') as ScanMethod,
      preparationStats: progress.preparationStats || {
        totalNeedingUpdate: 0, currentIndex: 0, currentUserName: '',
        updated: 0, skipped: 0, failed: 0, aiCallsMade: 0, embeddingCallsMade: 0,
        fieldsAutoFilled: 0,
      },
      currentUserIndex: progress.currentUserIndex || session.currentUserIndex || 0,
      totalUsers: progress.totalUsers || session.totalUsersToProcess || 0,
      currentUserName: progress.currentUserName,
      matchesFoundSoFar: progress.matchesFoundSoFar || session.matchesFound || 0,
      newMatchesFoundSoFar: progress.newMatchesFoundSoFar || 0,
      usersScanned: progress.usersScanned || session.totalUsersScanned || 0,
      progressPercent: progress.progressPercent || 0,
      scannedUserIds: progress.scannedUserIds || [],
      aiCallStats: progress.aiCallStats,
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
      action = 'full_scan', method = 'hybrid', forceRefresh = false,
      incremental = false, userId, userIds, scanId: cancelScanId,
      skipPreparation = false,
    } = body;

    if (action === 'cancel' && cancelScanId) {
      await prisma.scanSession.update({
        where: { id: cancelScanId },
        data: {
          status: 'CANCELLED', completedAt: new Date(),
          progressData: { phase: 'cancelled', message: 'בוטל על ידי המשתמש' },
        },
      }).catch(() => {});
      return NextResponse.json({ success: true, message: 'Scan cancelled' });
    }

    const { session: scanSession, isNew, isResuming } = await getOrCreateScanSession(
      session.user.id, method as ScanMethod, skipPreparation
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

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[BatchScan V2.6] 🚀 Starting scan: ${scanSession.id}`);
    console.log(`[BatchScan V2.6] Method: ${method}, Skip Preparation: ${skipPreparation}`);
    console.log(`${'='.repeat(60)}\n`);

    runBatchScan(scanSession.id, {
      action, method: method as ScanMethod, forceRefresh, incremental,
      userId, userIds, matchmakerId: session.user.id,
      skipPreparation, isResuming,
    }).catch(err => {
      console.error(`[BatchScan] Background scan error:`, err);
      updateScanProgress(scanSession.id, {
        phase: 'failed', error: err.message, message: `שגיאה: ${err.message}`,
      });
    });

    return NextResponse.json({
      success: true, scanId: scanSession.id, method,
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
        version: "2.6",
        methods: ['hybrid', 'algorithmic', 'vector', 'metrics_v2'],
        features: ['scanned_pair_exclusion', 'existing_matches_loading', 'smart_preparation', 'auto_fill_missing_fields'],
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
        aiCallStats: state.aiCallStats || {
          tier3FirstPass: { callsMade: 0, candidatesAnalyzed: 0 },
          tier4DeepAnalysis: { callsMade: 0, candidatesAnalyzed: 0 },
          total: { aiCalls: 0, embeddingCalls: 0, estimatedCost: 0 }
        },
        stats: {
          matchesFoundSoFar: state.matchesFoundSoFar,
          preparationUpdated: state.preparationStats.updated,
          preparationSkipped: state.preparationStats.skipped,
          preparationFailed: state.preparationStats.failed,
          fieldsAutoFilled: state.preparationStats.fieldsAutoFilled,
        },
      },
    });

  } catch (error) {
    console.error('[BatchScan] GET Error:', error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════
// SMART PREPARATION
// ═══════════════════════════════════════════════════════════════

async function findUsersNeedingUpdate(): Promise<UserNeedingUpdate[]> {
  console.log('[Preparation] Finding users truly needing update...');
  
  const usersNeedingUpdate = await prisma.$queryRaw<any[]>`
    SELECT 
      u.id as "userId", p.id as "profileId",
      u."firstName", u."lastName",
      CASE WHEN pm.id IS NULL THEN true ELSE false END as "needsMetrics",
      CASE WHEN pv."selfVector" IS NULL THEN true ELSE false END as "needsVectors",
      CASE 
        WHEN p."aiProfileSummary" IS NULL THEN true
        WHEN p."aiProfileSummary"->>'personalitySummary' IS NULL THEN true
        WHEN LENGTH(COALESCE(p."aiProfileSummary"->>'personalitySummary', '')) < 50 THEN true
        ELSE false 
      END as "needsAiSummary",
      p."contentUpdatedAt", pm."updatedAt" as "metricsUpdatedAt"
    FROM "User" u
    JOIN "Profile" p ON p."userId" = u.id
    LEFT JOIN "profile_metrics" pm ON pm."profileId" = p.id
    LEFT JOIN "profile_vectors" pv ON pv."profileId" = p.id
    WHERE 
      (
        pm.id IS NULL OR pv."selfVector" IS NULL
        OR p."aiProfileSummary" IS NULL
        OR p."aiProfileSummary"->>'personalitySummary' IS NULL
        OR LENGTH(COALESCE(p."aiProfileSummary"->>'personalitySummary', '')) < 50
      )
      OR (
        pm.id IS NOT NULL AND p."contentUpdatedAt" IS NOT NULL
        AND p."contentUpdatedAt" > pm."updatedAt"
      )
    ORDER BY 
      CASE WHEN pm.id IS NULL THEN 0 ELSE 1 END,
      p."contentUpdatedAt" DESC NULLS LAST
  `;

  console.log(`[Preparation] Found ${usersNeedingUpdate.length} users truly needing update`);

  return usersNeedingUpdate.map(u => ({
    userId: u.userId, profileId: u.profileId,
    firstName: u.firstName, lastName: u.lastName,
    needsMetrics: u.needsMetrics, needsVectors: u.needsVectors,
    needsAiSummary: u.needsAiSummary,
  }));
}

async function updateSingleUserData(
  userId: string, profileId: string, firstName: string, lastName: string,
  needsMetrics: boolean, needsVectors: boolean, needsAiSummary: boolean
): Promise<{ success: boolean; error?: string; stats: UpdateStats }> {
  
  const stats: UpdateStats = {
    aiSummaryCreated: false, metricsCalculated: false, vectorsCreated: false,
    skippedSteps: [], aiCallsMade: 0, embeddingCallsMade: 0,
    fieldsAutoFilled: [], // 🆕 V2.6
  };

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        questionnaireResponses: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!user || !user.profile) return { success: false, error: 'User or profile not found', stats };

    const profile = user.profile;
    const questionnaire = user.questionnaireResponses?.[0];
    let aiProfileSummary = profile.aiProfileSummary as any;

    // Step 1: AI Profile Summary
    if (needsAiSummary && deepAnalysisModel) {
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
          await prisma.profile.update({ where: { id: profileId }, data: { aiProfileSummary } });
          stats.aiSummaryCreated = true;
          stats.aiCallsMade++;
        }
      }
    } else if (!needsAiSummary) {
      stats.skippedSteps.push('ai_summary');
    }

    // Step 2: Metrics
    if (needsMetrics && metricsModel) {
      const narrativeResult = buildFullNarrativeWithHardData(user, profile, questionnaire, aiProfileSummary);
      if (narrativeResult && narrativeResult.narrative.length >= 200) {
        const metrics = await calculateMetricsWithAI(
          narrativeResult.narrative, 
          profile.gender, 
          narrativeResult.missingFields
        );
        
        if (metrics) {
          // שמירת המטריקות
          await prisma.profileMetrics.upsert({
            where: { profileId },
            create: { profileId, calculatedBy: 'AI_AUTO', ...metrics },
            update: { calculatedBy: 'AI_AUTO', updatedAt: new Date(), ...metrics },
          });
          stats.metricsCalculated = true;
          stats.aiCallsMade++;

          // 🆕 V2.6: עדכון שדות חסרים בפרופיל
          const autoFilledFields = await autoFillMissingProfileFields(
            profileId, 
            profile, 
            metrics
          );
          stats.fieldsAutoFilled = autoFilledFields;

          // Step 3a: Vectors after new metrics
          const selfVector = await generateTextEmbedding(metrics.aiPersonalitySummary);
          const seekingVector = await generateTextEmbedding(metrics.aiSeekingSummary);
          if (selfVector && seekingVector) {
            await saveVectors(profileId, selfVector, seekingVector);
            stats.vectorsCreated = true;
            stats.embeddingCallsMade += 2;
          }
        }
      }
    } else if (!needsMetrics) {
      stats.skippedSteps.push('metrics');
      
      // Step 3b: Vectors from existing metrics
      if (needsVectors) {
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
          }
        }
      } else {
        stats.skippedSteps.push('vectors');
      }
    }

    return { success: true, stats };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error', stats };
  }
}

// ═══════════════════════════════════════════════════════════════
// 🆕 V2.6: AUTO-FILL MISSING PROFILE FIELDS
// ═══════════════════════════════════════════════════════════════

async function autoFillMissingProfileFields(
  profileId: string,
  currentProfile: any,
  metrics: any
): Promise<string[]> {
  const filledFields: string[] = [];
  const profileUpdates: any = {};

  // בדיקת רמת ביטחון - רק MEDIUM או HIGH
  const confidence = metrics.inferredConfidence?.toUpperCase();
  if (confidence !== 'HIGH' && confidence !== 'MEDIUM') {
    console.log(`[AutoFill] Skipping - confidence too low: ${confidence}`);
    return filledFields;
  }

  // 1. עדכון רמה דתית (religiousLevel)
  if (!currentProfile.religiousLevel && metrics.inferredReligiousLevel) {
    const validLevel = validateReligiousLevel(metrics.inferredReligiousLevel);
    if (validLevel) {
      profileUpdates.religiousLevel = validLevel;
      filledFields.push('religiousLevel');
    }
  }

  // 2. עדכון מצב משפחתי (maritalStatus)
  if (!currentProfile.maritalStatus && metrics.inferredMaritalStatus) {
    const validStatus = validateMaritalStatus(metrics.inferredMaritalStatus);
    if (validStatus) {
      profileUpdates.maritalStatus = validStatus;
      filledFields.push('maritalStatus');
    }
  }

  // 3. עדכון גובה (height)
  if (!currentProfile.height && metrics.inferredHeight) {
    const height = parseInt(metrics.inferredHeight);
    if (height >= 140 && height <= 220) {
      profileUpdates.height = height;
      filledFields.push('height');
    }
  }

  // 4. עדכון תאריך לידה (birthDate) מגיל
  if (!currentProfile.birthDate && metrics.inferredAge) {
    const age = parseInt(metrics.inferredAge);
    if (age >= 18 && age <= 120) {
      const birthYear = new Date().getFullYear() - age;
      // קובעים ל-1 ביולי כדי להיות במרכז השנה
      profileUpdates.birthDate = new Date(`${birthYear}-07-01`);
      filledFields.push('birthDate');
    }
  }

  // ביצוע העדכון אם יש שדות לעדכן
  if (Object.keys(profileUpdates).length > 0) {
    try {
      await prisma.profile.update({
        where: { id: profileId },
        data: profileUpdates
      });
      console.log(`[AutoFill] ✅ Updated profile ${profileId}:`, filledFields.join(', '));
    } catch (error) {
      console.error(`[AutoFill] ❌ Failed to update profile ${profileId}:`, error);
      return [];
    }
  }

  return filledFields;
}

// 🆕 V2.6: Validation helpers
function validateReligiousLevel(value: string | null | undefined): string | null {
  if (!value) return null;
  
  const normalized = value.toLowerCase().trim();
  
  // בדיקה ישירה
  if (VALID_RELIGIOUS_LEVELS.includes(normalized as any)) {
    return normalized;
  }
  
  // מיפוי ערכים נפוצים
  const mappings: Record<string, string> = {
    'דתי לאומי': 'dati_leumi_standard',
    'דתי': 'dati_leumi_standard',
    'דתי לאומי ליברלי': 'dati_leumi_liberal',
    'דתל': 'dati_leumi_liberal',
    'דתי לאומי תורני': 'dati_leumi_torani',
    'חרדל': 'dati_leumi_torani',
    'מסורתי': 'masorti_strong',
    'מסורתי חזק': 'masorti_strong',
    'מסורתי לייט': 'masorti_light',
    'חילוני': 'secular',
    'חילוני מסורתי': 'secular_traditional_connection',
    'חרדי': 'charedi_modern',
    'חרדי מודרני': 'charedi_modern',
    'חרדי ליטאי': 'charedi_litvak',
    'ליטאי': 'charedi_litvak',
    'חרדי ספרדי': 'charedi_sephardic',
    'ספרדי': 'charedi_sephardic',
    'חרדי חסידי': 'charedi_hasidic',
    'חסידי': 'charedi_hasidic',
    'חבד': 'chabad',
    "חב''ד": 'chabad',
    'ברסלב': 'breslov',
    'רוחני': 'spiritual_not_religious',
  };
  
  if (mappings[normalized]) {
    return mappings[normalized];
  }
  
  // חיפוש חלקי
  for (const [key, val] of Object.entries(mappings)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return val;
    }
  }
  
  return null;
}

function validateMaritalStatus(value: string | null | undefined): string | null {
  if (!value) return null;
  
  const normalized = value.toUpperCase().trim();
  
  // בדיקה ישירה
  if (VALID_MARITAL_STATUSES.includes(normalized as any)) {
    return normalized;
  }
  
  // מיפוי ערכים נפוצים
  const mappings: Record<string, string> = {
    'רווק': 'SINGLE',
    'רווקה': 'SINGLE',
    'single': 'SINGLE',
    'גרוש': 'DIVORCED',
    'גרושה': 'DIVORCED',
    'divorced': 'DIVORCED',
    'פרוד': 'DIVORCED',
    'פרודה': 'DIVORCED',
    'אלמן': 'WIDOWED',
    'אלמנה': 'WIDOWED',
    'widowed': 'WIDOWED',
  };
  
  const lowerValue = value.toLowerCase().trim();
  if (mappings[lowerValue]) {
    return mappings[lowerValue];
  }
  
  return null;
}

async function saveVectors(profileId: string, selfVector: number[], seekingVector: number[]): Promise<void> {
  const selfVectorStr = `[${selfVector.join(',')}]`;
  const seekingVectorStr = `[${seekingVector.join(',')}]`;

  const existingVector = await prisma.$queryRaw<any[]>`
    SELECT id FROM "profile_vectors" WHERE "profileId" = ${profileId}
  `;

  if (existingVector && existingVector.length > 0) {
    await prisma.$executeRawUnsafe(`
      UPDATE "profile_vectors"
      SET "selfVector" = $1::vector, "seekingVector" = $2::vector,
          "selfVectorUpdatedAt" = NOW(), "seekingVectorUpdatedAt" = NOW(), "updatedAt" = NOW()
      WHERE "profileId" = $3
    `, selfVectorStr, seekingVectorStr, profileId);
  } else {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "profile_vectors" (
        "id", "profileId", "createdAt", "updatedAt",
        "selfVector", "seekingVector", "selfVectorUpdatedAt", "seekingVectorUpdatedAt"
      ) VALUES (
        gen_random_uuid(), $1, NOW(), NOW(), $2::vector, $3::vector, NOW(), NOW()
      )
    `, profileId, selfVectorStr, seekingVectorStr);
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN BATCH SCAN
// ═══════════════════════════════════════════════════════════════

async function runBatchScan(
  sessionId: string,
  options: {
    action: string; method: ScanMethod; forceRefresh: boolean;
    incremental: boolean; userId?: string; userIds?: string[];
    matchmakerId: string; skipPreparation?: boolean; isResuming?: boolean;
  }
): Promise<void> {
  const startTime = Date.now();
  let totalFieldsAutoFilled = 0; // 🆕 V2.6

  try {
    await updateScanProgress(sessionId, {
      phase: options.skipPreparation ? 'scanning' : 'preparing',
      message: 'מתחיל סריקה...',
    });

    // PHASE 1: SMART PREPARATION
    if (!options.skipPreparation) {
      await updateScanProgress(sessionId, {
        phase: 'preparing', message: 'בודק מי באמת צריך עדכון נתונים...',
      });
      
      const geminiReady = initGemini();
      
      if (geminiReady) {
        const usersNeedingUpdate = await findUsersNeedingUpdate();
        let updated = 0, skipped = 0, failed = 0;
        let totalAiCalls = 0, totalEmbeddingCalls = 0;
        
        await updateScanProgress(sessionId, {
          preparationStats: {
            totalNeedingUpdate: usersNeedingUpdate.length,
            currentIndex: 0, currentUserName: '',
            updated: 0, skipped: 0, failed: 0,
            aiCallsMade: 0, embeddingCallsMade: 0,
            fieldsAutoFilled: 0,
          },
        });
        
        if (usersNeedingUpdate.length > 0) {
          for (let i = 0; i < usersNeedingUpdate.length; i++) {
            if (await isScanCancelled(sessionId)) break;
            
            const user = usersNeedingUpdate[i];
            
            await updateScanProgress(sessionId, {
              preparationStats: {
                totalNeedingUpdate: usersNeedingUpdate.length,
                currentIndex: i + 1,
                currentUserName: `${user.firstName} ${user.lastName}`,
                updated, skipped, failed,
                aiCallsMade: totalAiCalls, embeddingCallsMade: totalEmbeddingCalls,
                fieldsAutoFilled: totalFieldsAutoFilled,
              },
              message: `מכין נתונים: ${user.firstName} ${user.lastName} (${i + 1}/${usersNeedingUpdate.length})`,
            });
            
            const result = await updateSingleUserData(
              user.userId, user.profileId, user.firstName, user.lastName,
              user.needsMetrics, user.needsVectors, user.needsAiSummary
            );
            
            if (result.success) {
              const didWork = result.stats.aiSummaryCreated || result.stats.metricsCalculated || result.stats.vectorsCreated;
              if (didWork) updated++; else skipped++;
              totalAiCalls += result.stats.aiCallsMade;
              totalEmbeddingCalls += result.stats.embeddingCallsMade;
              totalFieldsAutoFilled += result.stats.fieldsAutoFilled.length; // 🆕 V2.6
              
              // 🆕 V2.6: Log auto-filled fields
              if (result.stats.fieldsAutoFilled.length > 0) {
                console.log(`[BatchScan] 🔧 Auto-filled for ${user.firstName}: ${result.stats.fieldsAutoFilled.join(', ')}`);
              }
            } else {
              failed++;
            }
            
            const delay = (result.stats.aiCallsMade > 0 || result.stats.embeddingCallsMade > 0)
              ? PREPARATION_DELAY_MS : SKIP_DELAY_MS;
            if (i < usersNeedingUpdate.length - 1) await sleep(delay);
          }
        }
        
        console.log(`[BatchScan] 🔧 Total fields auto-filled: ${totalFieldsAutoFilled}`);
      }
    }

    if (await isScanCancelled(sessionId)) {
      await updateScanProgress(sessionId, { phase: 'cancelled', message: 'הסריקה בוטלה' });
      return;
    }

    // PHASE 2: SCANNING
    await updateScanProgress(sessionId, { phase: 'scanning', message: 'טוען משתמשים לסריקה...' });

    const currentState = await getScanSessionState(sessionId);
    const alreadyScannedUserIds = new Set(currentState?.scannedUserIds || []);
    const allUsersToScan = await getUsersToScan(options);
    
    const usersToScan = options.isResuming
      ? allUsersToScan.filter(u => !alreadyScannedUserIds.has(u.id))
      : allUsersToScan;
    
    const totalUsers = allUsersToScan.length;
    const alreadyScannedCount = alreadyScannedUserIds.size;
    
    await updateScanProgress(sessionId, {
      totalUsers, usersScanned: alreadyScannedCount,
      message: options.isResuming 
        ? `ממשיך סריקה: ${usersToScan.length} משתמשים נותרו`
        : `נמצאו ${totalUsers} משתמשים לסריקה`,
    });

    if (usersToScan.length === 0) {
      await updateScanProgress(sessionId, {
        phase: 'completed', progressPercent: 100,
        message: options.isResuming ? 'הסריקה כבר הושלמה קודם' : 'אין משתמשים לסריקה',
      });
      return;
    }

    let totalMatches = currentState?.matchesFoundSoFar || 0;
    let newMatches = currentState?.newMatchesFoundSoFar || 0;

    for (let i = 0; i < usersToScan.length; i++) {
      if (await isScanCancelled(sessionId)) break;

      const user = usersToScan[i];
      const overallIndex = alreadyScannedCount + i + 1;
      
      await updateScanProgress(sessionId, {
        currentUserIndex: overallIndex,
        currentUserName: `${user.firstName} ${user.lastName}`,
        progressPercent: Math.round((overallIndex / totalUsers) * 100),
        message: `סורק ${user.firstName} ${user.lastName}...`,
      });

      try {
        const checkCancelled = async () => await isScanCancelled(sessionId);
        
        const result = await scanUserByMethod(
          user.id, options.method, options.forceRefresh, sessionId, checkCancelled
        );

        const saved = await saveToPotentialMatches(
          user.id, user.gender, result.matches, options.method
        );

        totalMatches += result.matches.length;
        newMatches += saved.new;
        
        await markUserAsScanned(sessionId, user.id);
        
        await prisma.profile.updateMany({
          where: { userId: user.id },
          data: { lastScannedAt: new Date() },
        });
                
        await updateScanProgress(sessionId, {
          matchesFoundSoFar: totalMatches,
          newMatchesFoundSoFar: newMatches,
          usersScanned: overallIndex,
        });

        console.log(`[BatchScan] ✓ ${user.firstName}: ${result.matches.length} new matches (${saved.new} saved)`);

      } catch (userError) {
        console.error(`[BatchScan] Error scanning ${user.firstName}:`, userError);
        await markUserAsScanned(sessionId, user.id);
      }

      await sleep(400);
    }

    // PHASE 3: COMPLETE
    const duration = Date.now() - startTime;
    const finalState = await getScanSessionState(sessionId);
    
    if (finalState?.phase === 'cancelled' || await isScanCancelled(sessionId)) return;
    
    await updateScanProgress(sessionId, {
      phase: 'completed', progressPercent: 100,
      message: `הסריקה הושלמה! נמצאו ${totalMatches} התאמות חדשות (${newMatches} נשמרו), ${totalFieldsAutoFilled} שדות הושלמו אוטומטית`,
    });

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[BatchScan V2.6] ✅ Completed in ${(duration / 1000 / 60).toFixed(1)} minutes`);
    console.log(`[BatchScan V2.6] New Matches: ${totalMatches} (${newMatches} saved)`);
    console.log(`[BatchScan V2.6] Fields Auto-Filled: ${totalFieldsAutoFilled}`);
    console.log(`${'='.repeat(60)}\n`);

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await updateScanProgress(sessionId, {
      phase: 'failed', error: errorMsg, message: `שגיאה: ${errorMsg}`,
    });
    console.error(`[BatchScan] ❌ Failed:`, error);
  }
}

// ═══════════════════════════════════════════════════════════════
// SCAN BY METHOD
// ═══════════════════════════════════════════════════════════════

async function scanUserByMethod(
  userId: string, method: ScanMethod, forceRefresh: boolean,
  sessionId: string, checkCancelled?: () => Promise<boolean>
): Promise<{ matches: any[] }> {

  const baseOptions = {
    autoSave: false,
    forceRefresh,
    checkCancelled,
    excludeAlreadyScannedPairs: true,
    saveScannedPairs: true,
    includeExistingMatches: false,
    sessionId,
  };

  switch (method) {
    case 'hybrid':
      return await hybridScan(userId, {
        ...baseOptions,
        maxTier1Candidates: 300, maxTier2Candidates: 50,
        maxTier3Candidates: 20, topForDeepAnalysis: 15,
        useVectors: true, useBackgroundAnalysis: true,
        useAIFirstPass: true, useAIDeepAnalysis: true, minScoreToSave: 65,
      });

    case 'algorithmic':
      return await hybridScan(userId, {
        ...baseOptions,
        maxTier1Candidates: 200, maxTier2Candidates: 30,
        topForDeepAnalysis: 20, useVectors: false,
        useBackgroundAnalysis: true, useAIFirstPass: true,
        useAIDeepAnalysis: true, minScoreToSave: 65,
      });

    case 'vector':
      return await hybridScan(userId, {
        ...baseOptions,
        maxTier1Candidates: 500, maxTier2Candidates: 100,
        topForDeepAnalysis: 0, useVectors: true,
        useBackgroundAnalysis: false, useAIFirstPass: false,
        useAIDeepAnalysis: false, minScoreToSave: 60,
      });

    case 'metrics_v2':
      return await hybridScan(userId, {
        ...baseOptions,
        maxTier1Candidates: 300, maxTier2Candidates: 80,
        topForDeepAnalysis: 10, useVectors: true,
        useBackgroundAnalysis: true, useAIFirstPass: true,
        useAIDeepAnalysis: false, minScoreToSave: 65,
      });

    default:
      return await hybridScan(userId, baseOptions);
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function getUsersToScan(options: {
  action: string; method: ScanMethod; userId?: string;
  userIds?: string[]; forceRefresh: boolean; incremental: boolean;
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

  const where: any = { profile: { isNot: null } };
  if (options.action === 'scan_new_users') {
    where.createdAt = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
  }

  const users = await prisma.user.findMany({
    where,
    select: { id: true, firstName: true, lastName: true, profile: { select: { gender: true, lastScannedAt: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return users
    .sort((a, b) => {
      const aScanned = a.profile?.lastScannedAt;
      const bScanned = b.profile?.lastScannedAt;
      if (!aScanned && bScanned) return -1;
      if (aScanned && !bScanned) return 1;
      if (!aScanned && !bScanned) return 0;
      return aScanned!.getTime() - bScanned!.getTime();
    })
    .map(u => ({ ...u, gender: u.profile?.gender || Gender.MALE }));
}

async function saveToPotentialMatches(
  targetUserId: string, targetGender: Gender,
  matches: any[], scanMethod: ScanMethod
): Promise<{ new: number; updated: number }> {
  
  const isMale = targetGender === Gender.MALE;
  let newCount = 0, updatedCount = 0;

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
              aiScore: score, shortReasoning: bestReasoning, lastScanMethod: scanMethod,
            } : {}),
            ...methodFields, scannedAt: new Date(),
          },
        });
        updatedCount++;
      } else {
        await prisma.potentialMatch.create({
          data: {
            maleUserId, femaleUserId,
            aiScore: score, shortReasoning: bestReasoning,
            status: 'PENDING', scannedAt: new Date(),
            lastScanMethod: scanMethod, ...methodFields,
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
      return { hybridScore: score, hybridReasoning: reasoning, hybridScannedAt: now, hybridScoreBreakdown: breakdown };
    case 'algorithmic':
      return { algorithmicScore: score, algorithmicReasoning: reasoning, algorithmicScannedAt: now, algorithmicScoreBreakdown: breakdown };
    case 'vector':
      return { vectorScore: score, vectorReasoning: reasoning, vectorScannedAt: now };
    case 'metrics_v2':
      return { metricsV2Score: score, metricsV2Reasoning: reasoning, metricsV2ScannedAt: now, metricsV2ScoreBreakdown: breakdown };
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
  return Math.floor((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

function generateNarrativeForDeepAnalysis(user: any, profile: any, questionnaire: any): string {
  const parts: string[] = [];
  const age = calculateAge(profile.birthDate);
  const childrenStatus = profile.hasChildrenFromPrevious ? 'Has children' : 'No children';

  parts.push(`User Profile Summary:
Name: ${user.firstName} ${user.lastName}
Gender: ${profile.gender}
Age: ${age || 'Not specified'}
Height: ${profile.height ? profile.height + 'cm' : 'Not specified'}
Location: ${profile.city || 'Not specified'}
Marital Status: ${profile.maritalStatus || 'Not specified'} (${childrenStatus})
Religious Level: ${profile.religiousLevel || 'Not specified'}
${profile.kippahType ? `Kippah: ${profile.kippahType}` : ''}
${profile.headCovering ? `Head Covering: ${profile.headCovering}` : ''}
Occupation: ${profile.occupation || 'Not specified'}
Education: ${profile.education || 'Not specified'}`);

  if (profile.about) parts.push(`About Me:\n${profile.about}`);
  if (profile.profileHeadline) parts.push(`Headline:\n${profile.profileHeadline}`);
  if (profile.matchingNotes) parts.push(`Looking For:\n${profile.matchingNotes}`);
  if (profile.internalMatchmakerNotes) parts.push(`Matchmaker Notes:\n${profile.internalMatchmakerNotes}`);

  if (questionnaire) {
    const formatQ = (json: any) => {
      if (!json) return '';
      if (Array.isArray(json)) return json.map((v: any) => v.value || v).join('. ');
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
  const prompt = `You are the Senior Analyst at NeshamaTech. Create a comprehensive profile analysis.
**Output Format:** Valid JSON in Hebrew.
{
  "personalitySummary": "Multi-paragraph analysis...",
  "lookingForSummary": "Multi-paragraph analysis..."
}
--- User Data ---
${narrative}
--- End Data ---`;

  try {
    const result = await runGenAIWithRetry(async () => await deepAnalysisModel.generateContent(prompt));
    let jsonString = result.response.text();
    if (!jsonString) return null;
    if (jsonString.startsWith('```json')) jsonString = jsonString.slice(7, -3).trim();
    else if (jsonString.startsWith('```')) jsonString = jsonString.slice(3, -3).trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('[AI] Profile summary error:', error);
    return null;
  }
}

function buildFullNarrativeWithHardData(user: any, profile: any, questionnaire: any, aiProfileSummary: any): { narrative: string; missingFields: string[] } | null {
  const parts: string[] = [];
  const missingFields: string[] = [];
  const age = calculateAge(profile.birthDate);
  if (!age) missingFields.push('age');

  parts.push(`=== פרופיל בסיסי ===
שם: ${user.firstName} ${user.lastName}
מגדר: ${profile.gender}
גיל: ${age || 'לא צוין'}
גובה: ${profile.height || 'לא צוין'}
עיר: ${profile.city || 'לא צוין'}
רמה דתית: ${profile.religiousLevel || 'לא צוין'}
מצב משפחתי: ${profile.maritalStatus || 'לא צוין'}
מקצוע: ${profile.occupation || 'לא צוין'}
השכלה: ${profile.education || 'לא צוין'}`);

  if (profile.about) parts.push(`=== אודות ===\n${profile.about}`);
  if (aiProfileSummary?.personalitySummary) parts.push(`=== ניתוח אישיות ===\n${aiProfileSummary.personalitySummary}`);
  if (aiProfileSummary?.lookingForSummary) parts.push(`=== מה מחפש/ת ===\n${aiProfileSummary.lookingForSummary}`);
  if (profile.matchingNotes) parts.push(`=== הערות שידוך ===\n${profile.matchingNotes}`);

  // 🆕 V2.6: הוספת שדות חסרים לרשימה
  if (!profile.city) missingFields.push('city');
  if (!profile.religiousLevel) missingFields.push('religiousLevel');
  if (!profile.maritalStatus) missingFields.push('maritalStatus');
  if (!profile.height) missingFields.push('height');
  if (!profile.preferredAgeMin) missingFields.push('preferredAgeMin');
  if (!profile.preferredAgeMax) missingFields.push('preferredAgeMax');

  const narrative = parts.join('\n\n');
  if (narrative.length < 200) return null;
  return { narrative, missingFields };
}

// 🆕 V2.6: Updated prompt with inference fields
async function calculateMetricsWithAI(narrative: string, gender: string, missingFields: string[]): Promise<any | null> {
  if (!metricsModel) return null;

  const prompt = `אתה מנתח פרופילים מומחה בקהילה הדתית והחרדית בישראל.
נתח את הפרופיל הבא וחשב מדדים מספריים (0-100).

בנוסף, אם יש שדות חסרים, בצע הסקה לוגית מהטקסט (אודות, סיכום אישיות, שאלונים).
הסק רק אם אתה בטוח ברמת MEDIUM או HIGH. אם אין מספיק מידע, השאר null.

שדות חסרים שצריך לנסות להסיק: ${missingFields.join(', ') || 'אין'}

=== ערכים תקינים ===
רמה דתית (religiousLevel) - אחד מ:
'dati_leumi_standard', 'dati_leumi_liberal', 'dati_leumi_torani', 'masorti_strong', 'masorti_light', 'secular_traditional_connection', 'secular', 'spiritual_not_religious', 'charedi_modern', 'charedi_litvak', 'charedi_sephardic', 'charedi_hasidic', 'chabad', 'breslov', 'other'

מצב משפחתי (maritalStatus) - אחד מ:
'SINGLE', 'DIVORCED', 'WIDOWED'

=== פרופיל לניתוח ===
${narrative}
=== סוף פרופיל ===

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
  "inferredHeight": null,
  "inferredCity": null,
  "inferredReligiousLevel": null,
  "inferredMaritalStatus": null,
  "inferredPreferredAgeMin": null,
  "inferredPreferredAgeMax": null,
  
  "inferredConfidence": "HIGH/MEDIUM/LOW",
  "inferenceReasoning": "הסבר קצר להסקה",
  
  "aiPersonalitySummary": "סיכום קצר של האישיות",
  "aiSeekingSummary": "סיכום קצר של מה מחפש/ת",
  "aiBackgroundSummary": "סיכום רקע",
  "aiMatchmakerGuidelines": "הנחיות לשדכן",
  "aiInferredDealBreakers": [],
  "aiInferredMustHaves": [],
  "difficultyFlags": []
}

=== הנחיות להסקה ===
1. גיל (inferredAge): אם כתוב "בן 25" או "בת 30" - הסק את הגיל. אם כתוב "צעיר/ה" ללא גיל מדויק - השאר null.
2. גובה (inferredHeight): אם כתוב "גובה 175" או "1.80" - הסק (בס"מ). אם לא צוין - השאר null.
3. רמה דתית (inferredReligiousLevel): הסק מסוג כיפה, שמירת נגיעה, סוג ישיבה, כיסוי ראש.
4. מצב משפחתי (inferredMaritalStatus): אם כתוב "גרוש/ה" או "יש ילדים מנישואים קודמים" - DIVORCED. אם לא צוין - השאר null או SINGLE.
5. רמת ביטחון (inferredConfidence): HIGH אם יש ראיות ברורות בטקסט, MEDIUM אם יש רמזים, LOW אם זה ניחוש.`;

  try {
    const result = await runGenAIWithRetry(async () => await metricsModel.generateContent(prompt));
    let jsonString = result.response.text();
    if (!jsonString) return null;
    if (jsonString.startsWith('```json')) jsonString = jsonString.slice(7, -3).trim();
    else if (jsonString.startsWith('```')) jsonString = jsonString.slice(3, -3).trim();
    const parsed = JSON.parse(jsonString);
    
    // Ensure string type for inferred religious level
    if (parsed.inferredReligiousLevel != null && typeof parsed.inferredReligiousLevel !== 'string') {
      parsed.inferredReligiousLevel = String(parsed.inferredReligiousLevel);
    }
    
    return parsed;
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
        body: JSON.stringify({ content: { parts: [{ text }] } })
      }
    );
    if (!response.ok) return null;
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