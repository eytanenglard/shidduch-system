// =============================================================================
// 📁 src/app/api/matchmaker/rejection-feedback/route.ts
// =============================================================================
// 🎯 Rejection Feedback API V1.0 - NeshamaTech
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import rejectionFeedbackService, { 
  type RejectionCategory,
  REJECTION_CATEGORY_INFO 
} from "@/lib/services/rejectionFeedbackService";

// =============================================================================
// GET - קבלת נתוני דחיות
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
    
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const userId1 = searchParams.get('userId1');
    const userId2 = searchParams.get('userId2');
    
    switch (action) {
      case 'categories':
        // החזרת קטגוריות הדחייה
        const categories = Object.entries(REJECTION_CATEGORY_INFO).map(([key, info]) => ({
          value: key,
          label: info.labelHe,
          labelEn: info.label,
          group: info.group,
          description: info.description,
        }));
        
        // מיון לפי groups
        const groupedCategories = {
          objective: categories.filter(c => c.group === 'objective'),
          subjective: categories.filter(c => c.group === 'subjective'),
          timing: categories.filter(c => c.group === 'timing'),
          red_flag: categories.filter(c => c.group === 'red_flag'),
          other: categories.filter(c => c.group === 'other'),
        };
        
        return NextResponse.json({ 
          categories, 
          grouped: groupedCategories 
        });
        
      case 'stats':
        // סטטיסטיקות כלליות
        const dateFrom = searchParams.get('dateFrom') 
          ? new Date(searchParams.get('dateFrom')!) 
          : undefined;
        const dateTo = searchParams.get('dateTo') 
          ? new Date(searchParams.get('dateTo')!) 
          : undefined;
          
        const stats = await rejectionFeedbackService.getRejectionStats(dateFrom, dateTo);
        return NextResponse.json(stats);
        
      case 'user_profile':
        // פרופיל דחיות למשתמש
        if (!userId) {
          return NextResponse.json(
            { error: "userId required" },
            { status: 400 }
          );
        }
        
        const userProfile = await rejectionFeedbackService.getUserRejectionProfile(userId);
        return NextResponse.json(userProfile);
        
      case 'pair_history':
        // היסטוריה בין שני משתמשים
        if (!userId1 || !userId2) {
          return NextResponse.json(
            { error: "userId1 and userId2 required" },
            { status: 400 }
          );
        }
        
        const pairHistory = await rejectionFeedbackService.getPairRejectionHistory(
          userId1, 
          userId2
        );
        return NextResponse.json(pairHistory);
        
      case 'insights':
        // תובנות מניתוח הדחיות
        const insights = await rejectionFeedbackService.getRejectionInsights();
        return NextResponse.json({ insights });
        
      default:
        // ברירת מחדל - סטטיסטיקות
        const defaultStats = await rejectionFeedbackService.getRejectionStats();
        return NextResponse.json(defaultStats);
    }
    
  } catch (error) {
    console.error("[RejectionFeedback API] Error:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch rejection data" },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - שמירת פידבק דחייה
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
    
    const matchmakerId = (session.user as any).id;
    const body = await request.json();
    
    const {
      rejectedUserId,
      rejectingUserId,
      suggestionId,
      potentialMatchId,
      category,
      subcategory,
      freeText,
      wasExpected,
    } = body;
    
    // וולידציה
    if (!rejectedUserId || !rejectingUserId || !category) {
      return NextResponse.json(
        { error: "rejectedUserId, rejectingUserId, and category are required" },
        { status: 400 }
      );
    }
    
    // בדיקה שהקטגוריה תקינה
    if (!REJECTION_CATEGORY_INFO[category as RejectionCategory]) {
      return NextResponse.json(
        { error: "Invalid rejection category" },
        { status: 400 }
      );
    }
    
    // שמירה
    const feedbackId = await rejectionFeedbackService.saveRejectionFeedback({
      rejectedUserId,
      rejectingUserId,
      suggestionId,
      potentialMatchId,
      category: category as RejectionCategory,
      subcategory,
      freeText,
      recordedBy: matchmakerId,
      wasExpected,
    });
    
    return NextResponse.json({ 
      success: true, 
      feedbackId 
    });
    
  } catch (error) {
    console.error("[RejectionFeedback API] POST Error:", error);
    
    return NextResponse.json(
      { error: "Failed to save rejection feedback" },
      { status: 500 }
    );
  }
}
