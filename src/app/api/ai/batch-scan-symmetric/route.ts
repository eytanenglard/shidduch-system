// =============================================================================
// 📁 src/app/api/ai/batch-scan-symmetric/route.ts
// =============================================================================
// 🎯 Symmetric Batch Scan API V2.0 - NeshamaTech
// 
// סריקה אסינכרונית עם Tiered Matching
// מחזיר מיד scanId ומאפשר polling על ההתקדמות
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import symmetricScanService from "@/lib/services/symmetricScanService";
import prisma from "@/lib/prisma";

// =============================================================================
// In-Memory Scan State (for active scans)
// In production, consider using Redis for distributed state
// =============================================================================

interface ActiveScan {
  scanId: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: Date;
  progress: number;
  currentPhase: string;
  error?: string;
  result?: any;
}

// Global map for tracking active scans
const activeScans = new Map<string, ActiveScan>();

// =============================================================================
// GET - מידע על סריקה או polling
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const userRole = (session.user as any).role;
    if (userRole !== 'MATCHMAKER' && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const scanId = searchParams.get('scanId');
    
    // אם יש scanId - מחזיר סטטוס של סריקה ספציפית
    if (scanId) {
      // בדוק קודם ב-memory
      const activeScan = activeScans.get(scanId);
      if (activeScan) {
        return NextResponse.json({
          success: true,
          scan: {
            id: activeScan.scanId,
            status: activeScan.status,
            progress: activeScan.progress,
            currentPhase: activeScan.currentPhase,
            startedAt: activeScan.startedAt,
            error: activeScan.error,
            // אם הסתיים - כלול את התוצאות
            ...(activeScan.status === 'completed' && activeScan.result ? {
              matchesFound: activeScan.result.stats?.matchesFound || 0,
              newMatches: activeScan.result.stats?.newMatches || 0,
              durationMs: activeScan.result.stats?.durationMs || 0,
            } : {}),
          },
        });
      }
      
      // אם לא ב-memory - בדוק בדאטהבייס
      const dbScan = await prisma.scanSession.findUnique({
        where: { id: scanId },
      });
      
      if (dbScan) {
        return NextResponse.json({
          success: true,
          scan: {
            id: dbScan.id,
            status: dbScan.status,
            progress: dbScan.status === 'completed' ? 100 : 
                      dbScan.status === 'failed' ? 0 : 50,
            matchesFound: dbScan.matchesFound,
            newMatches: dbScan.newMatches,
            durationMs: dbScan.durationMs,
            error: dbScan.error,
            startedAt: dbScan.startedAt,
            completedAt: dbScan.completedAt,
          },
        });
      }
      
      return NextResponse.json({
        success: false,
        error: "Scan not found",
      }, { status: 404 });
    }
    
    // מידע כללי על הגדרות הסריקה
    return NextResponse.json({
      version: "2.0",
      scanType: "symmetric_tiered_async",
      tiers: {
        quickFilter: {
          description: "מסנן מהיר - גיל, דת, היסטוריה",
          thresholds: symmetricScanService.QUICK_FILTER,
        },
        vectorFilter: {
          description: "סינון וקטורי - דמיון פרופילים",
          thresholds: symmetricScanService.VECTOR_FILTER,
        },
        softScoring: {
          description: "ציון רך - התאמות בסיסיות",
          thresholds: symmetricScanService.SOFT_SCORING,
        },
        aiScoring: {
          description: "ניתוח AI - רק Top 30",
          thresholds: symmetricScanService.AI_SCORING,
        },
      },
      features: [
        "✅ סריקה אסינכרונית",
        "✅ סריקה דו-כיוונית (גברים + נשים)",
        "✅ Tiered Matching לחיסכון ב-API",
        "✅ Asymmetric Scoring",
        "✅ Vector Similarity",
        "✅ Progress Polling",
      ],
      activeScans: Array.from(activeScans.values())
        .filter(s => s.status === 'running')
        .map(s => ({ id: s.scanId, startedAt: s.startedAt, progress: s.progress })),
    });
    
  } catch (error) {
    console.error("[SymmetricScan API] Error:", error);
    return NextResponse.json(
      { error: "Failed to get scan info" },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - הרצת סריקה (אסינכרונית)
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const userRole = (session.user as any).role;
    if (userRole !== 'MATCHMAKER' && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { 
      action,
      usersToScan,
      forceRefresh,
      skipVectorTier,
      minAiScore,
    } = body;
    
    // בדוק אם כבר רצה סריקה
    const runningScans = Array.from(activeScans.values()).filter(s => s.status === 'running');
    if (runningScans.length > 0) {
      return NextResponse.json({
        success: false,
        status: 'already_running',
        message: 'סריקה כבר רצה כרגע',
        scanId: runningScans[0].scanId,
      });
    }
    
    switch (action) {
      case 'full_scan': { 
        console.log(`[SymmetricScan API] Starting async full scan (forceRefresh: ${forceRefresh})`);
        
        // יצירת session מראש בדאטהבייס
        const scanSession = await prisma.scanSession.create({
          data: {
            scanType: 'nightly',
            status: 'running',
          },
        });
        
        const scanId = scanSession.id;
        
        // שמור ב-memory
        activeScans.set(scanId, {
          scanId,
          status: 'running',
          startedAt: new Date(),
          progress: 0,
          currentPhase: 'initializing',
        });
        
        // הרץ את הסריקה ברקע (לא מחכים לסיום!)
        runScanInBackground(scanId, {
          forceRefresh: forceRefresh ?? false,
          skipVectorTier: skipVectorTier ?? false,
          minAiScore: minAiScore ?? 70,
        });
        
        // מחזיר מיד עם scanId
        return NextResponse.json({
          success: true,
          status: 'started',
          message: 'הסריקה החלה ברקע',
          scanId,
        });
      }
      
      case 'scan_users': {
        if (!usersToScan || !Array.isArray(usersToScan) || usersToScan.length === 0) {
          return NextResponse.json(
            { error: "usersToScan array required" },
            { status: 400 }
          );
        }
        
        console.log(`[SymmetricScan API] Starting async scan for ${usersToScan.length} users`);
        
        const scanSession = await prisma.scanSession.create({
          data: {
            scanType: 'manual',
            status: 'running',
          },
        });
        
        const scanId = scanSession.id;
        
        activeScans.set(scanId, {
          scanId,
          status: 'running',
          startedAt: new Date(),
          progress: 0,
          currentPhase: 'initializing',
        });
        
        runScanInBackground(scanId, {
          usersToScan,
          forceRefresh: true,
        });
        
        return NextResponse.json({
          success: true,
          status: 'started',
          message: `סריקה ל-${usersToScan.length} משתמשים החלה`,
          scanId,
        });
      }

      case 'scan_single': { 
        const { userId } = body;
        
        if (!userId) {
          return NextResponse.json(
            { error: "userId required" },
            { status: 400 }
          );
        }
        
        console.log(`[SymmetricScan API] Scanning single user: ${userId}`);
        
        // סריקת משתמש בודד - מספיק מהירה לרוץ סינכרוני
        const singleResult = await symmetricScanService.scanSingleUser(userId);
        
        return NextResponse.json({ 
          success: true, 
          ...singleResult 
        });
      }
      
      case 'scan_new_users': { 
        console.log(`[SymmetricScan API] Starting async scan for new users`);
        
        const scanSession = await prisma.scanSession.create({
          data: {
            scanType: 'new_users',
            status: 'running',
          },
        });
        
        const scanId = scanSession.id;
        
        activeScans.set(scanId, {
          scanId,
          status: 'running',
          startedAt: new Date(),
          progress: 0,
          currentPhase: 'initializing',
        });
        
        // הרץ ברקע
        (async () => {
          try {
            const result = await symmetricScanService.scanNewUsers();
            activeScans.set(scanId, {
              ...activeScans.get(scanId)!,
              status: 'completed',
              progress: 100,
              currentPhase: 'done',
              result,
            });
          } catch (error) {
            console.error('[SymmetricScan API] New users scan error:', error);
            activeScans.set(scanId, {
              ...activeScans.get(scanId)!,
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        })();
        
        return NextResponse.json({
          success: true,
          status: 'started',
          message: 'סריקת משתמשים חדשים החלה',
          scanId,
        });
      }
      
      case 'cancel': {
        // ביטול סריקה (אם נתמך)
        const { scanId: cancelScanId } = body;
        if (cancelScanId && activeScans.has(cancelScanId)) {
          const scan = activeScans.get(cancelScanId)!;
          scan.status = 'failed';
          scan.error = 'Cancelled by user';
          
          // עדכון בדאטהבייס
          await prisma.scanSession.update({
            where: { id: cancelScanId },
            data: {
              status: 'failed',
              error: 'Cancelled by user',
              completedAt: new Date(),
            },
          });
          
          return NextResponse.json({
            success: true,
            message: 'הסריקה בוטלה',
          });
        }
        return NextResponse.json({
          success: false,
          error: 'Scan not found or not running',
        }, { status: 404 });
      }
      
      default:
        return NextResponse.json(
          { error: "Unknown action. Valid actions: full_scan, scan_users, scan_single, scan_new_users, cancel" },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error("[SymmetricScan API] POST Error:", error);
    
    return NextResponse.json(
      { 
        error: "Scan failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// Background Scan Runner
// =============================================================================

async function runScanInBackground(
  scanId: string, 
  options: Parameters<typeof symmetricScanService.runSymmetricScan>[0]
) {
  try {
    // עדכון התקדמות
    const updateProgress = (progress: number, phase: string) => {
      const scan = activeScans.get(scanId);
      if (scan) {
        scan.progress = progress;
        scan.currentPhase = phase;
      }
    };
    
    updateProgress(5, 'loading_users');
    
    // הרץ את הסריקה
    const result = await symmetricScanService.runSymmetricScan(options);
    
    // עדכון סופי
    activeScans.set(scanId, {
      scanId,
      status: result.success ? 'completed' : 'failed',
      startedAt: activeScans.get(scanId)?.startedAt || new Date(),
      progress: 100,
      currentPhase: 'done',
      result,
      error: result.error,
    });
    
    console.log(`[SymmetricScan API] Background scan ${scanId} completed:`, {
      success: result.success,
      matchesFound: result.stats?.matchesFound,
      newMatches: result.stats?.newMatches,
    });
    
    // נקה מה-memory אחרי 10 דקות
    setTimeout(() => {
      activeScans.delete(scanId);
    }, 10 * 60 * 1000);
    
  } catch (error) {
    console.error(`[SymmetricScan API] Background scan ${scanId} failed:`, error);
    
    activeScans.set(scanId, {
      scanId,
      status: 'failed',
      startedAt: activeScans.get(scanId)?.startedAt || new Date(),
      progress: 0,
      currentPhase: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    // עדכון בדאטהבייס
    await prisma.scanSession.update({
      where: { id: scanId },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    }).catch(console.error);
  }
}