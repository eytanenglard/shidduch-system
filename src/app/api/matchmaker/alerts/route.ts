// =============================================================================
// 📁 src/app/api/matchmaker/alerts/route.ts
// =============================================================================
// 🎯 Alerts Management API V1.0 - NeshamaTech
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import alertsService, { type AlertSeverity, type AlertType } from "@/lib/services/alertsService";
import { UserRole } from "@prisma/client";

// =============================================================================
// Types
// =============================================================================

interface SessionUser {
  id: string;
  role: UserRole;
}

// =============================================================================
// GET - קבלת התראות
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
    
    const user = session.user as SessionUser;
    if (user.role !== UserRole.MATCHMAKER && user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    
    // פרמטרים
    const severity = searchParams.get('severity') as AlertSeverity | null;
    const type = searchParams.get('type') as AlertType | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const includeRead = searchParams.get('includeRead') === 'true';
    const userId = searchParams.get('userId');
    const summary = searchParams.get('summary') === 'true';
    
    // אם מבקשים סיכום
    if (summary) {
      const alertsSummary = await alertsService.getAlertsSummary();
      return NextResponse.json(alertsSummary);
    }
    
    // אם מבקשים התראות למשתמש ספציפי
    if (userId) {
      const userAlerts = await alertsService.getAlertsForUser(userId);
      return NextResponse.json({ alerts: userAlerts });
    }
    
    // התראות כלליות
    const alerts = await alertsService.getActiveAlerts({
      severity: severity || undefined,
      type: type || undefined,
      limit,
      includeRead,
    });
    
    return NextResponse.json({ 
      alerts,
      count: alerts.length,
    });
    
  } catch (error) {
    console.error("[Alerts API] Error:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - פעולות על התראות
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
    
    const user = session.user as SessionUser;
    if (user.role !== UserRole.MATCHMAKER && user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }
    
    const currentUserId = user.id;
    const body = await request.json();
    const { action, alertId, alertIds, reason } = body;
    
    switch (action) {
      case 'mark_read': {
        if (alertId) {
          await alertsService.markAlertAsRead(alertId);
          return NextResponse.json({ success: true });
        }
        if (alertIds && Array.isArray(alertIds)) {
          const count = await alertsService.markAlertsAsRead(alertIds);
          return NextResponse.json({ success: true, count });
        }
        return NextResponse.json(
          { error: "alertId or alertIds required" },
          { status: 400 }
        );
      }
        
      case 'dismiss': {
        if (alertId) {
          await alertsService.dismissAlert(alertId, currentUserId, reason);
          return NextResponse.json({ success: true });
        }
        if (alertIds && Array.isArray(alertIds)) {
          const count = await alertsService.dismissAlerts(alertIds, currentUserId, reason);
          return NextResponse.json({ success: true, count });
        }
        return NextResponse.json(
          { error: "alertId or alertIds required" },
          { status: 400 }
        );
      }
        
      case 'generate': {
        // יצירת התראות חדשות
        const result = await alertsService.generateAllAlerts();
        return NextResponse.json({ 
          success: true, 
          ...result 
        });
      }
        
      case 'cleanup': {
        // ניקוי התראות ישנות
        const daysOld = body.daysOld || 30;
        const deleted = await alertsService.cleanupOldAlerts(daysOld);
        return NextResponse.json({ 
          success: true, 
          deleted 
        });
      }
        
      case 'create': {
        // יצירת התראה ידנית
        const { userId: targetUserId, type, severity, title, message, data } = body;
        
        if (!targetUserId || !type || !severity || !title || !message) {
          return NextResponse.json(
            { error: "Missing required fields" },
            { status: 400 }
          );
        }
        
        const newAlertId = await alertsService.createAlert({
          userId: targetUserId,
          type,
          severity,
          title,
          message,
          data,
        });
        
        return NextResponse.json({ 
          success: true, 
          alertId: newAlertId 
        });
      }
        
      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error("[Alerts API] POST Error:", error);
    
    return NextResponse.json(
      { error: "Action failed" },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE - מחיקת התראות
// =============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const user = session.user as SessionUser;
    if (user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const daysOld = parseInt(searchParams.get('daysOld') || '30');
    
    const deleted = await alertsService.cleanupOldAlerts(daysOld);
    
    return NextResponse.json({ 
      success: true, 
      deleted 
    });
    
  } catch (error) {
    console.error("[Alerts API] DELETE Error:", error);
    
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}
