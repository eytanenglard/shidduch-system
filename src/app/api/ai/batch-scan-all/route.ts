// ===========================================
// src/app/api/ai/batch-scan-all/route.ts
// ===========================================
// 🎯 סריקה לילית - תמיכה במספר שיטות סריקה
// שיטות: hybrid, algorithmic, vector, metrics_v2
// 🆕 V2: כולל שלב הכנת נתונים (מדדים + וקטורים + AI summaries)
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole, AvailabilityStatus, Gender } from "@prisma/client";
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

// 🆕 Phase type
type ScanPhase = 'preparing' | 'scanning' | 'completed' | 'failed' | 'cancelled';

interface ActiveScan {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  method: ScanMethod;
  
  // 🆕 Phase tracking
  phase: ScanPhase;
  
  // 🆕 Preparation phase stats
  preparationStats: {
    totalNeedingUpdate: number;
    currentIndex: number;
    currentUserName: string;
    updated: number;
    failed: number;
  };
  
  // Scanning phase stats
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
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const PREPARATION_DELAY_MS = 3000; // השהיה בין עדכוני יוזרים בשלב ההכנה
const MAX_NARRATIVE_LENGTH = 8000;

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
      skipPreparation = false, // 🆕 אפשרות לדלג על שלב ההכנה
    } = body;

    // ═══════════════════════════════════════════════════════════
    // Handle Cancel
    // ═══════════════════════════════════════════════════════════
    if (action === 'cancel' && cancelScanId) {
      const scan = activeScans.get(cancelScanId);
      if (scan) {
        scan.status = 'cancelled';
        scan.phase = 'cancelled';
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
        phase: existingActiveScan.phase,
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
      phase: 'preparing',
      preparationStats: {
        totalNeedingUpdate: 0,
        currentIndex: 0,
        currentUserName: '',
        updated: 0,
        failed: 0,
      },
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
    console.log(`[BatchScan] Skip Preparation: ${skipPreparation}`);
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
      skipPreparation,
    }).catch(err => {
      console.error(`[BatchScan] Background scan error:`, err);
    });

    return NextResponse.json({
      success: true,
      scanId,
      method,
      status: 'pending',
      phase: 'preparing',
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
        features: ['preparation_phase', 'auto_metrics_update'],
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
        method: scan.method,
        phase: scan.phase,
        
        // 🆕 Preparation stats
        preparationStats: scan.preparationStats,
        
        // Scanning stats
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
          preparationUpdated: scan.preparationStats.updated,
          preparationFailed: scan.preparationStats.failed,
        },
      },
    });

  } catch (error) {
    console.error('[BatchScan] GET Error:', error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════
// 🆕 PREPARATION PHASE - עדכון מדדים/וקטורים/AI לפני הסריקה
// ═══════════════════════════════════════════════════════════════

interface UserNeedingUpdate {
  userId: string;
  profileId: string;
  firstName: string;
  lastName: string;
  needsMetrics: boolean;
  needsVectors: boolean;
  needsAiSummary: boolean;
}

/**
 * מוצא את כל המשתמשים שצריכים עדכון מדדים/וקטורים/AI
 */
async function findUsersNeedingUpdate(): Promise<UserNeedingUpdate[]> {
  console.log('[Preparation] Finding users needing update...');
  
  const users = await prisma.user.findMany({
    where: {
      profile: { isNot: null },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profile: {
        select: {
          id: true,
          updatedAt: true,
          aiProfileSummary: true,
          metrics: {
            select: {
              updatedAt: true,
            },
          },
          vector: {
            select: {
              updatedAt: true,
              selfVectorUpdatedAt: true,
            },
          },
        },
      },
    },
  });

  const usersNeedingUpdate: UserNeedingUpdate[] = [];

  for (const user of users) {
    if (!user.profile) continue;

    const profileUpdatedAt = user.profile.updatedAt;
    
    // בדיקה: צריך עדכון מדדים?
    const metricsUpdatedAt = user.profile.metrics?.updatedAt;
    const needsMetrics = !metricsUpdatedAt || profileUpdatedAt > metricsUpdatedAt;
    
    // בדיקה: צריך עדכון וקטורים?
    const vectorsUpdatedAt = user.profile.vector?.selfVectorUpdatedAt || user.profile.vector?.updatedAt;
    const needsVectors = !vectorsUpdatedAt || profileUpdatedAt > vectorsUpdatedAt;
    
    // בדיקה: צריך עדכון AI Summary?
    const aiSummary = user.profile.aiProfileSummary as any;
    const aiUpdatedAt = aiSummary?.lastDeepAnalysisAt ? new Date(aiSummary.lastDeepAnalysisAt) : null;
    const hasValidSummary = aiSummary?.personalitySummary && aiSummary.personalitySummary.length > 50;
    const needsAiSummary = !hasValidSummary || !aiUpdatedAt || profileUpdatedAt > aiUpdatedAt;

    if (needsMetrics || needsVectors || needsAiSummary) {
      usersNeedingUpdate.push({
        userId: user.id,
        profileId: user.profile.id,
        firstName: user.firstName,
        lastName: user.lastName,
        needsMetrics,
        needsVectors,
        needsAiSummary,
      });
    }
  }

  console.log(`[Preparation] Found ${usersNeedingUpdate.length} users needing update`);
  console.log(`[Preparation] - Needs Metrics: ${usersNeedingUpdate.filter(u => u.needsMetrics).length}`);
  console.log(`[Preparation] - Needs Vectors: ${usersNeedingUpdate.filter(u => u.needsVectors).length}`);
  console.log(`[Preparation] - Needs AI Summary: ${usersNeedingUpdate.filter(u => u.needsAiSummary).length}`);

  return usersNeedingUpdate;
}

/**
 * עדכון יוזר בודד - מדדים + וקטורים + AI Summary
 */
async function updateSingleUserData(
  userId: string,
  profileId: string,
  firstName: string,
  lastName: string
): Promise<{ success: boolean; error?: string }> {
  
  console.log(`[Preparation] Updating ${firstName} ${lastName}...`);

  try {
    // שליפת המידע המלא
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
      return { success: false, error: 'User or profile not found' };
    }

    const profile = user.profile;
    const questionnaire = user.questionnaireResponses?.[0];

    // ═══════════════════════════════════════════════════════════
    // שלב 1: יצירת/עדכון AI Profile Summary
    // ═══════════════════════════════════════════════════════════
    let aiProfileSummary = profile.aiProfileSummary as any;
    
    const needsDeepAnalysis = !aiProfileSummary?.personalitySummary || 
                              aiProfileSummary.personalitySummary.length < 50;

    if (needsDeepAnalysis && deepAnalysisModel) {
      console.log(`   📊 Creating AI profile summary...`);
      
      const narrative = generateNarrativeForDeepAnalysis(user, profile, questionnaire);
      
      if (narrative && narrative.length >= 100) {
        const newSummary = await generateAiProfileSummary(narrative);
        
        if (newSummary) {
          const updatedAiProfile = {
            ...(aiProfileSummary || {}),
            personalitySummary: newSummary.personalitySummary,
            lookingForSummary: newSummary.lookingForSummary,
            lastDeepAnalysisAt: new Date().toISOString(),
          };

          await prisma.profile.update({
            where: { id: profileId },
            data: { aiProfileSummary: updatedAiProfile },
          });

          aiProfileSummary = updatedAiProfile;
          console.log(`   ✓ AI Summary created`);
        }
      }
    }

    // ═══════════════════════════════════════════════════════════
    // שלב 2: חישוב מדדים
    // ═══════════════════════════════════════════════════════════
    if (metricsModel) {
      console.log(`   🤖 Calculating metrics...`);
      
      const narrativeResult = buildFullNarrativeWithHardData(user, profile, questionnaire, aiProfileSummary);
      
      if (narrativeResult && narrativeResult.narrative.length >= 200) {
        const metrics = await calculateMetricsWithAI(
          narrativeResult.narrative,
          profile.gender,
          narrativeResult.missingFields
        );

        if (metrics) {
          // Upsert מדדים
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
          console.log(`   ✓ Metrics saved`);

          // ═══════════════════════════════════════════════════════════
          // שלב 3: יצירת וקטורים
          // ═══════════════════════════════════════════════════════════
          console.log(`   📐 Creating vectors...`);
          
          const selfVector = await generateTextEmbedding(metrics.aiPersonalitySummary);
          const seekingVector = await generateTextEmbedding(metrics.aiSeekingSummary);

          if (selfVector && seekingVector) {
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
            console.log(`   ✓ Vectors saved`);
          }
        }
      }
    }

    console.log(`   ✅ ${firstName} ${lastName} updated successfully`);
    return { success: true };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`   ❌ Error updating ${firstName}: ${errorMsg}`);
    return { success: false, error: errorMsg };
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
    skipPreparation?: boolean;
  }
): Promise<void> {
  const scan = activeScans.get(scanId);
  if (!scan) return;

  const startTime = Date.now();
  scan.status = 'running';

  try {
    // ═══════════════════════════════════════════════════════════
    // 🆕 PHASE 1: PREPARATION - עדכון מדדים/וקטורים/AI
    // ═══════════════════════════════════════════════════════════
    
    if (!options.skipPreparation) {
      scan.phase = 'preparing';
      scan.message = 'בודק מי צריך עדכון נתונים...';
      
      // Initialize Gemini
      const geminiReady = initGemini();
      if (!geminiReady) {
        console.warn('[BatchScan] Gemini not available, skipping preparation');
      } else {
        const usersNeedingUpdate = await findUsersNeedingUpdate();
        
        scan.preparationStats.totalNeedingUpdate = usersNeedingUpdate.length;
        
        if (usersNeedingUpdate.length > 0) {
          console.log(`\n[BatchScan] ═══ PREPARATION PHASE ═══`);
          console.log(`[BatchScan] Updating ${usersNeedingUpdate.length} users before scanning...`);
          
          for (let i = 0; i < usersNeedingUpdate.length; i++) {
            // בדיקת ביטול
            if (scan.status as string === 'cancelled') {
              console.log(`[BatchScan] Preparation cancelled at user ${i + 1}`);
              break;
            }
            
            const user = usersNeedingUpdate[i];
            
            scan.preparationStats.currentIndex = i + 1;
            scan.preparationStats.currentUserName = `${user.firstName} ${user.lastName}`;
            scan.message = `מכין נתונים: ${user.firstName} ${user.lastName} (${i + 1}/${usersNeedingUpdate.length})`;
            
            const result = await updateSingleUserData(
              user.userId,
              user.profileId,
              user.firstName,
              user.lastName
            );
            
            if (result.success) {
              scan.preparationStats.updated++;
            } else {
              scan.preparationStats.failed++;
            }
            
            // השהיה בין עדכונים
            if (i < usersNeedingUpdate.length - 1) {
              await sleep(PREPARATION_DELAY_MS);
            }
          }
          
          console.log(`[BatchScan] Preparation complete: ${scan.preparationStats.updated} updated, ${scan.preparationStats.failed} failed`);
        } else {
          console.log(`[BatchScan] No users need updating, proceeding to scan`);
        }
      }
    }

    // בדיקת ביטול לפני הסריקה
    if (scan.status as string === 'cancelled') {
      scan.phase = 'cancelled';
      return;
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 2: SCANNING - סריקה רגילה
    // ═══════════════════════════════════════════════════════════
    
    scan.phase = 'scanning';
    scan.message = 'טוען משתמשים לסריקה...';

    const usersToScan = await getUsersToScan(options);
    
    scan.totalUsers = usersToScan.length;
    scan.message = `נמצאו ${usersToScan.length} משתמשים לסריקה`;
    
    console.log(`\n[BatchScan] ═══ SCANNING PHASE ═══`);
    console.log(`[BatchScan] Found ${usersToScan.length} users to scan with method: ${options.method}`);

    if (usersToScan.length === 0) {
      scan.status = 'completed';
      scan.phase = 'completed';
      scan.progressPercent = 100;
      scan.message = 'אין משתמשים לסריקה';
      return;
    }

    let totalMatches = 0;
    let newMatches = 0;

    for (let i = 0; i < usersToScan.length; i++) {
      if (scan.status as string === 'cancelled') {
        console.log(`[BatchScan] Scan cancelled at user ${i + 1}`);
        break;
      }

      const user = usersToScan[i];
      
      scan.currentUserIndex = i + 1;
      scan.currentUserName = `${user.firstName} ${user.lastName}`;
      scan.progressPercent = Math.round((i / usersToScan.length) * 100);
      scan.message = `סורק ${user.firstName} ${user.lastName}...`;

      console.log(`[BatchScan] [${i + 1}/${usersToScan.length}] Scanning ${user.firstName} (${options.method})`);

      try {
        const result = await scanUserByMethod(user.id, options.method, options.forceRefresh, scanId);

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
    // PHASE 3: COMPLETE
    // ═══════════════════════════════════════════════════════════
    const duration = Date.now() - startTime;
    
    scan.status = 'completed';
    scan.phase = 'completed';
    scan.progressPercent = 100;
    scan.message = `הסריקה הושלמה! נמצאו ${totalMatches} התאמות (${newMatches} חדשות)`;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[BatchScan] ✅ ${options.method} scan completed in ${(duration / 1000 / 60).toFixed(1)} minutes`);
    console.log(`[BatchScan] Preparation: ${scan.preparationStats.updated} updated, ${scan.preparationStats.failed} failed`);
    console.log(`[BatchScan] Users scanned: ${scan.usersScanned}/${usersToScan.length}`);
    console.log(`[BatchScan] Matches: ${totalMatches} (${newMatches} new)`);
    console.log(`${'='.repeat(60)}\n`);

    setTimeout(() => activeScans.delete(scanId), 60 * 60 * 1000);

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    scan.status = 'failed';
    scan.phase = 'failed';
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
      return await hybridScan(userId, {
        maxTier1Candidates: 500,
        maxTier2Candidates: 100,
        topForDeepAnalysis: 0,
        useVectors: true,
        useBackgroundAnalysis: false,
        useAIFirstPass: false,
        useAIDeepAnalysis: false,
        minScoreToSave: 60,
        autoSave: false,
        forceRefresh,
      });

    case 'metrics_v2':
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
      isNot: null,
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

  if (!options.forceRefresh) {
    const thresholdDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentlyScanned = await prisma.matchingJob.findMany({
      where: {
        method: options.method,
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
              shortReasoning: match.detailedReasoning || match.shortReasoning || match.reasoning || null,
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
            shortReasoning: match.detailedReasoning || match.shortReasoning || match.reasoning || null,
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
  // 🆕 שימוש ב-detailedReasoning (האיכותי) במקום shortReasoning
  const reasoning = match.detailedReasoning || match.shortReasoning || match.reasoning || '';

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

/**
 * יצירת נרטיב לניתוח עומק (AI Profile Summary)
 */
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

/**
 * יצירת AI Profile Summary
 */
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

/**
 * בניית נרטיב מלא למדדים
 */
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

/**
 * חישוב מדדים עם AI
 */
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

/**
 * יצירת וקטור טקסט
 */
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

/**
 * Retry wrapper for Gemini API calls
 */
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