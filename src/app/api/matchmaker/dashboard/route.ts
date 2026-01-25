// =============================================================================
// 📁 src/app/api/matchmaker/dashboard/route.ts
// =============================================================================
// 🎯 Matchmaker Dashboard API V1.0 - NeshamaTech
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dashboardService from "@/lib/services/dashboardService";

// =============================================================================
// GET - קבלת נתוני הדשבורד
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // אימות הרשאות
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // בדיקה שהמשתמש הוא שדכן
    const userRole = (session.user as any).role;
    if (userRole !== 'MATCHMAKER' && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: "Access denied. Matchmaker role required." },
        { status: 403 }
      );
    }
    
    // פרמטרים אופציונליים
    const searchParams = request.nextUrl.searchParams;
    const section = searchParams.get('section'); // stats, priority, alerts, activity
    
    // אם מבקשים רק חלק מסוים
    if (section) {
      switch (section) {
        case 'stats':
          const stats = await dashboardService.getStats();
          return NextResponse.json({ stats });
          
        case 'quick':
          const quickStats = await dashboardService.getQuickStats();
          return NextResponse.json(quickStats);
          
        case 'activity':
          const limit = parseInt(searchParams.get('limit') || '10');
          const activity = await dashboardService.getRecentActivity(limit);
          return NextResponse.json({ activity });
          
        case 'chart':
          const days = parseInt(searchParams.get('days') || '30');
          const chartData = await dashboardService.getMatchesOverTime(days);
          return NextResponse.json({ chartData });
          
        case 'priority':
          const category = searchParams.get('category') as any;
          const priorityLimit = parseInt(searchParams.get('limit') || '20');
          if (category) {
            const users = await dashboardService.getUsersByPriorityCategory(
              category, 
              priorityLimit
            );
            return NextResponse.json({ users });
          }
          break;
      }
    }
    
    // ברירת מחדל - כל הנתונים
    const dashboardData = await dashboardService.getDashboardData();
    
    return NextResponse.json(dashboardData);
    
  } catch (error) {
    console.error("[Dashboard API] Error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch dashboard data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - פעולות על הדשבורד
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
    const { action } = body;
    
    switch (action) {
      case 'refresh_priority':
        // עדכון Priority לכל המשתמשים
        const { updateAllUsersPriorityInDB } = await import("@/lib/services/priorityService");
        const result = await updateAllUsersPriorityInDB();
        return NextResponse.json({ 
          success: true, 
          message: `Updated ${result.updated} users`,
          ...result 
        });
        
      case 'generate_alerts':
        // יצירת התראות חדשות
        const { generateAllAlerts } = await import("@/lib/services/alertsService");
        const alertsResult = await generateAllAlerts();
        return NextResponse.json({ 
          success: true, 
          message: `Generated ${alertsResult.generated} alerts`,
          ...alertsResult 
        });
        
      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error("[Dashboard API] POST Error:", error);
    
    return NextResponse.json(
      { 
        error: "Action failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
