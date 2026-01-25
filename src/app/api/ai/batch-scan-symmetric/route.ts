// =============================================================================
// 📁 src/app/api/ai/batch-scan-symmetric/route.ts
// =============================================================================
// 🎯 Symmetric Batch Scan API V1.0 - NeshamaTech
// 
// סריקה סימטרית עם Tiered Matching
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import symmetricScanService from "@/lib/services/symmetricScanService";

// =============================================================================
// GET - מידע על הסריקה
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
    
    // מידע על הגדרות הסריקה
    return NextResponse.json({
      version: "1.0",
      scanType: "symmetric_tiered",
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
        "✅ סריקה דו-כיוונית (גברים + נשים)",
        "✅ Tiered Matching לחיסכון ב-API",
        "✅ Asymmetric Scoring",
        "✅ Vector Similarity",
      ],
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
// POST - הרצת סריקה
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
    
    switch (action) {
      case 'full_scan': { 
        // סריקה מלאה
        console.log(`[SymmetricScan API] Starting full scan (forceRefresh: ${forceRefresh})`);
        
        const fullResult = await symmetricScanService.runSymmetricScan({
          forceRefresh: forceRefresh ?? false,
          skipVectorTier: skipVectorTier ?? false,
          minAiScore: minAiScore ?? 70,
        });
        
        return NextResponse.json(fullResult);
      }
 case 'scan_users': { // <--- הוספת סוגריים מסולסלים כאן
        // סריקה למשתמשים ספציפיים
        if (!usersToScan || !Array.isArray(usersToScan) || usersToScan.length === 0) {
          return NextResponse.json(
            { error: "usersToScan array required" },
            { status: 400 }
          );
        }
        
        console.log(`[SymmetricScan API] Scanning ${usersToScan.length} specific users`);
        
        const usersResult = await symmetricScanService.runSymmetricScan({
          usersToScan,
          forceRefresh: true,
        });
        
        return NextResponse.json(usersResult);
      } // <--- סגירת סוגריים מסולסלים כאן

        
      case 'scan_single':{ 
        // סריקה למשתמש בודד
        const { userId } = body;
        
        if (!userId) {
          return NextResponse.json(
            { error: "userId required" },
            { status: 400 }
          );
        }
        
        console.log(`[SymmetricScan API] Scanning single user: ${userId}`);
        
        const singleResult = await symmetricScanService.scanSingleUser(userId);
        
        return NextResponse.json({ 
          success: true, 
          ...singleResult 
        });
      }
      case 'scan_new_users':{ 
        // סריקת משתמשים חדשים (24 שעות אחרונות)
        console.log(`[SymmetricScan API] Scanning new users`);
        
        const newUsersResult = await symmetricScanService.scanNewUsers();
        
        return NextResponse.json(newUsersResult);
      }
      default:
        return NextResponse.json(
          { error: "Unknown action. Valid actions: full_scan, scan_users, scan_single, scan_new_users" },
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
