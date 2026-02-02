// =============================================================================
// 📁 src/app/api/ai/batch-scan-symmetric/route.ts
// =============================================================================
// 🎯 Symmetric Batch Scan API V3.0 - NeshamaTech
// 
// ✅ Features:
// - Async job pattern with immediate response
// - SSE (Server-Sent Events) for real-time progress
// - Polling fallback for clients that don't support SSE
// - Progress tracking in database
// - Multiple scan actions (full, incremental, single user, cancel)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { 
  runSymmetricScan, 
  scanSingleUser, 
  scanNewUsers,
  runIncrementalScan,
  type ScanProgress,
  type SymmetricScanResult,
} from "@/lib/services/symmetricScanService";

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

// =============================================================================
// TYPES
// =============================================================================

interface ActiveScan {
  scanId: string;
  scanSessionId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: ScanProgress;
  result?: SymmetricScanResult;
  startedAt: Date;
  error?: string;
}

export interface BatchScanProgress {
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  scanId: string | null;
  progress: {
    phase: string;
    currentUserIndex: number;
    totalUsers: number;
    currentUserName?: string;
    progressPercent: number;
    pairsEvaluated: number;
    pairsPassedQuickFilter: number;
    pairsPassedVectorFilter: number;
    pairsSentToAi: number;
    matchesFoundSoFar: number;
    message: string;
  };
  result?: {
    matchesFound: number;
    newMatches: number;
    updatedMatches: number;
    durationMs: number;
  };
  error: string | null;
}

// =============================================================================
// IN-MEMORY STATE (for active scans)
// =============================================================================

const activeScans = new Map<string, ActiveScan>();

// Cleanup old scans every 10 minutes
setInterval(() => {
  const now = Date.now();
  const TEN_MINUTES = 10 * 60 * 1000;
  
  for (const [scanId, scan] of activeScans.entries()) {
    if (now - scan.startedAt.getTime() > TEN_MINUTES && 
        (scan.status === 'COMPLETED' || scan.status === 'FAILED' || scan.status === 'CANCELLED')) {
      activeScans.delete(scanId);
      console.log(`[BatchScan] 🧹 Cleaned up old scan: ${scanId}`);
    }
  }
}, 10 * 60 * 1000);

// =============================================================================
// POST - Start Scan
// =============================================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || !['MATCHMAKER', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { action = 'full_scan', userId, incremental = false, forceRefresh = false } = body;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[BatchScan] 📥 POST request received`);
    console.log(`[BatchScan] Action: ${action}, Incremental: ${incremental}`);
    console.log(`${'='.repeat(60)}\n`);

    // Check if a scan is already running
    const runningScan = Array.from(activeScans.values()).find(s => s.status === 'RUNNING');
    if (runningScan && action !== 'cancel') {
      return NextResponse.json({
        success: false,
        error: "A scan is already running",
        scanId: runningScan.scanId,
      }, { status: 409 });
    }

    // ==========================================================================
    // Handle different actions
    // ==========================================================================

    switch (action) {
      case 'cancel': {
        const scanIdToCancel = body.scanId;
        if (scanIdToCancel && activeScans.has(scanIdToCancel)) {
          const scan = activeScans.get(scanIdToCancel)!;
          scan.status = 'CANCELLED';
          scan.progress.phase = 'failed';
          scan.progress.message = 'הסריקה בוטלה על ידי המשתמש';
          
          // Update DB
          if (scan.scanSessionId) {
            await prisma.scanSession.update({
              where: { id: scan.scanSessionId },
              data: { status: 'CANCELLED' }
            }).catch(() => {});
          }
          
          return NextResponse.json({ success: true, message: "Scan cancelled" });
        }
        return NextResponse.json({ success: false, error: "Scan not found" }, { status: 404 });
      }

      case 'scan_single': {
        if (!userId) {
          return NextResponse.json({ error: "userId required for scan_single" }, { status: 400 });
        }
        
        const scanId = `single_${Date.now()}`;
        
        // Start scan in background
        runScanInBackground(scanId, 'single', { userId });
        
        return NextResponse.json({
          success: true,
          scanId,
          message: "Single user scan started",
        });
      }

      case 'scan_new_users': {
        const scanId = `new_${Date.now()}`;
        
        // Start scan in background
        runScanInBackground(scanId, 'new_users', {});
        
        return NextResponse.json({
          success: true,
          scanId,
          message: "New users scan started",
        });
      }

      case 'scan_users': {
        const userIds = body.userIds;
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
          return NextResponse.json({ error: "userIds array required" }, { status: 400 });
        }
        
        const scanId = `users_${Date.now()}`;
        
        // Start scan in background
        runScanInBackground(scanId, 'specific_users', { userIds, forceRefresh });
        
        return NextResponse.json({
          success: true,
          scanId,
          message: `Started scan for ${userIds.length} users`,
        });
      }

      case 'full_scan':
      default: {
        const scanId = `full_${Date.now()}`;
        
        // Start scan in background
        runScanInBackground(scanId, incremental ? 'incremental' : 'full', { forceRefresh });
        
        return NextResponse.json({
          success: true,
          scanId,
          message: incremental ? "Incremental scan started" : "Full scan started",
        });
      }
    }

  } catch (error) {
    console.error('[BatchScan] POST error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// =============================================================================
// GET - Check Progress / SSE Stream
// =============================================================================

export async function GET(req: NextRequest): Promise<NextResponse | Response> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scanId = searchParams.get('scanId');
    const stream = searchParams.get('stream') === 'true';

    // ==========================================================================
    // SSE Streaming Mode
    // ==========================================================================
    if (stream && scanId) {
      return createSSEStream(scanId);
    }

    // ==========================================================================
    // Polling Mode - Return current status
    // ==========================================================================
    if (scanId) {
      const scan = activeScans.get(scanId);
      
      if (!scan) {
        // Try to find in database
        const dbSession = await prisma.scanSession.findFirst({
          where: {
            OR: [
              { id: scanId },
              { id: { startsWith: scanId.split('_')[1] || scanId } }
            ]
          },
          orderBy: { startedAt: 'desc' }
        });

        if (dbSession) {
          return NextResponse.json({
            status: dbSession.status === 'COMPLETED' ? 'COMPLETED' : 
                   dbSession.status === 'FAILED' ? 'FAILED' : 
                   dbSession.status === 'CANCELLED' ? 'CANCELLED' : 'IDLE',
            scanId,
            progress: {
              phase: dbSession.status,
              currentUserIndex: dbSession.totalUsersScanned || 0,
              totalUsers: dbSession.totalUsersScanned || 0,
              progressPercent: dbSession.status === 'COMPLETED' ? 100 : 0,
              pairsEvaluated: dbSession.pairsEvaluated || 0,
              pairsPassedQuickFilter: 0,
              pairsPassedVectorFilter: 0,
              pairsSentToAi: 0,
              matchesFoundSoFar: dbSession.matchesFound || 0,
              message: dbSession.status === 'COMPLETED' ? 'הושלם' : dbSession.error || '',
            },
            result: dbSession.status === 'COMPLETED' ? {
              matchesFound: dbSession.matchesFound || 0,
              newMatches: dbSession.newMatches || 0,
              updatedMatches: dbSession.updatedMatches || 0,
              durationMs: dbSession.durationMs || 0,
            } : undefined,
            error: dbSession.error || null,
          } satisfies BatchScanProgress);
        }

        return NextResponse.json({
          status: 'IDLE',
          scanId: null,
          progress: {
            phase: 'idle',
            currentUserIndex: 0,
            totalUsers: 0,
            progressPercent: 0,
            pairsEvaluated: 0,
            pairsPassedQuickFilter: 0,
            pairsPassedVectorFilter: 0,
            pairsSentToAi: 0,
            matchesFoundSoFar: 0,
            message: 'לא נמצאה סריקה',
          },
          error: null,
        } satisfies BatchScanProgress);
      }

      // Return current status
      const response: BatchScanProgress = {
        status: scan.status,
        scanId: scan.scanId,
        progress: {
          phase: scan.progress.phase,
          currentUserIndex: scan.progress.currentUserIndex,
          totalUsers: scan.progress.totalUsers,
          currentUserName: scan.progress.currentUserName,
          progressPercent: scan.progress.progressPercent,
          pairsEvaluated: scan.progress.stats.pairsEvaluated,
          pairsPassedQuickFilter: scan.progress.stats.pairsPassedQuickFilter,
          pairsPassedVectorFilter: scan.progress.stats.pairsPassedVectorFilter,
          pairsSentToAi: scan.progress.stats.pairsSentToAi,
          matchesFoundSoFar: scan.progress.stats.matchesFoundSoFar,
          message: scan.progress.message,
        },
        error: scan.error || null,
      };

      if (scan.result) {
        response.result = {
          matchesFound: scan.result.stats.matchesFound,
          newMatches: scan.result.stats.newMatches,
          updatedMatches: scan.result.stats.updatedMatches,
          durationMs: scan.result.stats.durationMs,
        };
      }

      return NextResponse.json(response);
    }

    // ==========================================================================
    // No scanId - Return overall status
    // ==========================================================================
    const runningScan = Array.from(activeScans.values()).find(s => s.status === 'RUNNING');
    
    if (runningScan) {
      return NextResponse.json({
        status: 'RUNNING',
        scanId: runningScan.scanId,
        progress: {
          phase: runningScan.progress.phase,
          currentUserIndex: runningScan.progress.currentUserIndex,
          totalUsers: runningScan.progress.totalUsers,
          progressPercent: runningScan.progress.progressPercent,
          pairsEvaluated: runningScan.progress.stats.pairsEvaluated,
          pairsPassedQuickFilter: runningScan.progress.stats.pairsPassedQuickFilter,
          pairsPassedVectorFilter: runningScan.progress.stats.pairsPassedVectorFilter,
          pairsSentToAi: runningScan.progress.stats.pairsSentToAi,
          matchesFoundSoFar: runningScan.progress.stats.matchesFoundSoFar,
          message: runningScan.progress.message,
        },
        error: null,
      } satisfies BatchScanProgress);
    }

    // Get last completed scan from DB
    const lastScan = await prisma.scanSession.findFirst({
      where: { status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' }
    });

    return NextResponse.json({
      status: 'IDLE',
      scanId: null,
      progress: {
        phase: 'idle',
        currentUserIndex: 0,
        totalUsers: 0,
        progressPercent: 0,
        pairsEvaluated: 0,
        pairsPassedQuickFilter: 0,
        pairsPassedVectorFilter: 0,
        pairsSentToAi: 0,
        matchesFoundSoFar: 0,
        message: lastScan 
          ? `סריקה אחרונה: ${lastScan.matchesFound} התאמות (${new Date(lastScan.completedAt!).toLocaleString('he-IL')})`
          : 'מוכן לסריקה',
      },
      error: null,
    } satisfies BatchScanProgress);

  } catch (error) {
    console.error('[BatchScan] GET error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// =============================================================================
// SSE STREAM HELPER
// =============================================================================

function createSSEStream(scanId: string): Response {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Send initial status
      const scan = activeScans.get(scanId);
      if (scan) {
        sendEvent({
          type: 'progress',
          ...scan.progress,
          status: scan.status,
        });
      }

      // Poll for updates
      const interval = setInterval(() => {
        const currentScan = activeScans.get(scanId);
        
        if (!currentScan) {
          sendEvent({ type: 'error', message: 'Scan not found' });
          clearInterval(interval);
          controller.close();
          return;
        }

        sendEvent({
          type: 'progress',
          ...currentScan.progress,
          status: currentScan.status,
        });

        // Close stream when done
        if (currentScan.status === 'COMPLETED' || 
            currentScan.status === 'FAILED' || 
            currentScan.status === 'CANCELLED') {
          
          if (currentScan.result) {
            sendEvent({
              type: 'complete',
              result: {
                matchesFound: currentScan.result.stats.matchesFound,
                newMatches: currentScan.result.stats.newMatches,
                updatedMatches: currentScan.result.stats.updatedMatches,
                durationMs: currentScan.result.stats.durationMs,
              }
            });
          } else if (currentScan.error) {
            sendEvent({
              type: 'error',
              error: currentScan.error,
            });
          }
          
          clearInterval(interval);
          controller.close();
        }
      }, 1000); // Update every second

      // Cleanup on close
      return () => {
        clearInterval(interval);
      };
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// =============================================================================
// BACKGROUND SCAN RUNNER
// =============================================================================

async function runScanInBackground(
  scanId: string,
  scanType: 'full' | 'incremental' | 'single' | 'new_users' | 'specific_users',
  options: { 
    userId?: string; 
    userIds?: string[]; 
    forceRefresh?: boolean 
  }
): Promise<void> {
  
  // Initialize active scan
  const initialProgress: ScanProgress = {
    phase: 'initializing',
    currentUserIndex: 0,
    totalUsers: 0,
    progressPercent: 0,
    stats: {
      pairsEvaluated: 0,
      pairsPassedQuickFilter: 0,
      pairsPassedVectorFilter: 0,
      pairsSentToAi: 0,
      matchesFoundSoFar: 0,
    },
    message: 'מאתחל סריקה...',
  };

  const activeScan: ActiveScan = {
    scanId,
    scanSessionId: '',
    status: 'RUNNING',
    progress: initialProgress,
    startedAt: new Date(),
  };

  activeScans.set(scanId, activeScan);

  console.log(`[BatchScan] 🚀 Starting background scan: ${scanId} (type: ${scanType})`);

  try {
    // Progress callback
    const onProgress = async (progress: ScanProgress) => {
      const scan = activeScans.get(scanId);
      if (scan && scan.status !== 'CANCELLED') {
        scan.progress = progress;
      }
    };

    let result: SymmetricScanResult;

    switch (scanType) {
      case 'single': { 
        if (!options.userId) throw new Error('userId required for single scan');
        const singleResult = await scanSingleUser(options.userId);
        result = {
          success: true,
          scanSessionId: scanId,
          stats: {
            usersScanned: 1,
            malesScanned: 0,
            femalesScanned: 0,
            pairsEvaluated: 0,
            pairsPassedQuickFilter: 0,
            pairsPassedVectorFilter: 0,
            pairsPassedSoftScoring: 0,
            pairsSentToAi: 0,
            matchesFound: singleResult.matchesFound,
            newMatches: singleResult.newMatches,
            updatedMatches: 0,
            durationMs: 0,
            aiCallsCount: 0,
          },
          topMatches: [],
        };
        break;
      } 
      
      case 'new_users':
        result = await scanNewUsers();
        break;

      case 'incremental':
        result = await runIncrementalScan(onProgress);
        break;

      case 'specific_users':
        result = await runSymmetricScan({
          usersToScan: options.userIds,
          forceRefresh: options.forceRefresh,
          onProgress,
        });
        break;

      case 'full':
      default:
        result = await runSymmetricScan({
          forceRefresh: options.forceRefresh,
          onProgress,
        });
        break;
    }

    // Update active scan with result
    const scan = activeScans.get(scanId);
    if (scan) {
      scan.status = result.success ? 'COMPLETED' : 'FAILED';
      scan.result = result;
      scan.scanSessionId = result.scanSessionId;
      scan.progress = {
        phase: 'completed',
        currentUserIndex: result.stats.usersScanned,
        totalUsers: result.stats.usersScanned,
        progressPercent: 100,
        stats: {
          pairsEvaluated: result.stats.pairsEvaluated,
          pairsPassedQuickFilter: result.stats.pairsPassedQuickFilter,
          pairsPassedVectorFilter: result.stats.pairsPassedVectorFilter,
          pairsSentToAi: result.stats.pairsSentToAi,
          matchesFoundSoFar: result.stats.matchesFound,
        },
        message: `הושלם! נמצאו ${result.stats.matchesFound} התאמות (${result.stats.newMatches} חדשות)`,
      };
      
      if (result.error) {
        scan.error = result.error;
      }
    }

    console.log(`[BatchScan] ✅ Scan ${scanId} completed: ${result.stats.matchesFound} matches`);

  } catch (error) {
    console.error(`[BatchScan] ❌ Scan ${scanId} failed:`, error);
    
    const scan = activeScans.get(scanId);
    if (scan) {
      scan.status = 'FAILED';
      scan.error = error instanceof Error ? error.message : 'Unknown error';
      scan.progress.phase = 'failed';
      scan.progress.message = `שגיאה: ${scan.error}`;
    }
  }
}