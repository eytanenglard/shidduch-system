// src/app/api/matchmaker/suggestions/[id]/route.ts
// ════════════════════════════════════════════════════════════════
// 🔧 FIX: הסרת עדכון סטטוס ישיר מ-PATCH הכללי.
//    כל שינוי סטטוס חייב לעבור דרך /status endpoint
//    כדי שמיילים והתראות יישלחו כראוי.
// ════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { SuggestionService } from "@/components/matchmaker/suggestions/services/suggestions/SuggestionService";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const params = await props.params;
    const suggestionService = SuggestionService.getInstance();
    const suggestion = await suggestionService.getSuggestionDetails(params.id, session.user.id);

    return NextResponse.json(suggestion);
  } catch (error: unknown) {
    console.error("Error fetching suggestion:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch suggestion";
    const status = message.includes("not found") ? 404 : message.includes("Unauthorized") ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    if (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }
    
    const params = await props.params;
    const suggestionId = params.id;
    const data = await req.json();
    
    // ═══════════════════════════════════════════════════════════
    // 🔧 FIX: מסיר status מהבקשה — שינוי סטטוס חייב לעבור
    //    דרך PATCH /[id]/status שמפעיל StatusTransitionService
    //    ושולח מיילים + push + WhatsApp
    // ═══════════════════════════════════════════════════════════
    if (data.status) {
      console.warn(
        `[PATCH /suggestions/${suggestionId}] ⚠️ Received 'status' field in general PATCH. ` +
        `Status changes must go through /status endpoint for notifications to work. Ignoring status field.`
      );
      delete data.status;
    }
    // ═══════════════════════════════════════════════════════════

    const suggestionService = SuggestionService.getInstance();
    
    try {
      const updatedSuggestion = await suggestionService.updateSuggestion(
        suggestionId,
        session.user.id,
        {
          id: suggestionId,
          priority: data.priority,
          notes: {
            internal: data.internalNotes,
            forFirstParty: data.firstPartyNotes,
            forSecondParty: data.secondPartyNotes,
            matchingReason: data.matchingReason,
            followUpNotes: data.followUpNotes
          },
          decisionDeadline: data.decisionDeadline ? new Date(data.decisionDeadline) : undefined,
          responseDeadline: data.responseDeadline ? new Date(data.responseDeadline) : undefined
        }
      );
      
      return NextResponse.json({
        success: true,
        data: updatedSuggestion
      });
      
    } catch (serviceError: unknown) {
      console.error("Error from suggestion service:", serviceError);
      
      if (serviceError instanceof Error) {
        return NextResponse.json(
          { success: false, error: serviceError.message || "Failed to update suggestion" },
          { status: serviceError.message.includes("Unauthorized") ? 403 : 400 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: "Failed to update suggestion" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error updating suggestion:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update suggestion" },
      { status: 500 }
    );
  }
}