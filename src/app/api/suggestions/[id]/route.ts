// src/app/api/suggestions/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole, Priority } from "@prisma/client";
import prisma from "@/lib/prisma";

interface SuggestionUpdateData {
  priority?: Priority;
  matchingReason?: string;
  firstPartyNotes?: string;
  secondPartyNotes?: string;
  internalNotes?: string;
  decisionDeadline?: string | null;
}

interface PrismaUpdateData {
  lastActivity: Date;
  priority?: Priority;
  matchingReason?: string;
  firstPartyNotes?: string;
  secondPartyNotes?: string;
  internalNotes?: string;
  decisionDeadline?: Date | null;
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> } // ✅ שינוי: התאמה ל-Next.js 15
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
    
    const params = await props.params; // ✅ שינוי: הוספת await
    const suggestionId = params.id;
    const data: SuggestionUpdateData = await req.json();
    
    console.log("PATCH request for suggestion:", suggestionId, "with data:", data);

    const existingSuggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      select: {
        id: true,
        matchmakerId: true,
        status: true
      }
    });

    if (!existingSuggestion) {
      return NextResponse.json(
        { success: false, error: "Suggestion not found" },
        { status: 404 }
      );
    }

    if (existingSuggestion.matchmakerId !== session.user.id && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: "You don't have permission to edit this suggestion" },
        { status: 403 }
      );
    }

    const updateData: PrismaUpdateData = {
      lastActivity: new Date(),
    };

    if (data.priority !== undefined) {
      updateData.priority = data.priority;
    }
    if (data.matchingReason !== undefined) {
      updateData.matchingReason = data.matchingReason;
    }
    if (data.firstPartyNotes !== undefined) {
      updateData.firstPartyNotes = data.firstPartyNotes;
    }
    if (data.secondPartyNotes !== undefined) {
      updateData.secondPartyNotes = data.secondPartyNotes;
    }
    if (data.internalNotes !== undefined) {
      updateData.internalNotes = data.internalNotes;
    }
    if (data.decisionDeadline !== undefined) {
      updateData.decisionDeadline = data.decisionDeadline ? new Date(data.decisionDeadline) : null;
    }

    console.log("Updating suggestion with data:", updateData);

    const updatedSuggestion = await prisma.matchSuggestion.update({
      where: { id: suggestionId },
      data: updateData,
      include: {
        firstParty: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true,
            images: { 
              select: { id: true, url: true, isMain: true }, 
              orderBy: [{ isMain: 'desc' }, { createdAt: 'asc'}] 
            }, 
            profile: true 
          }
        },
        secondParty: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true,
            images: { 
              select: { id: true, url: true, isMain: true }, 
              orderBy: [{ isMain: 'desc' }, { createdAt: 'asc'}] 
            }, 
            profile: true 
          }
        },
        matchmaker: {
          select: { id: true, firstName: true, lastName: true }
        },
        statusHistory: { 
          orderBy: { createdAt: 'desc' } 
        }
      }
    });

    console.log("Suggestion updated successfully:", updatedSuggestion.id);

    if (updatedSuggestion.firstParty.profile && !updatedSuggestion.firstParty.profile.isMedicalInfoVisible) {
      updatedSuggestion.firstParty.profile.medicalInfoDetails = null;
    }
    if (updatedSuggestion.secondParty.profile && !updatedSuggestion.secondParty.profile.isMedicalInfoVisible) {
      updatedSuggestion.secondParty.profile.medicalInfoDetails = null;
    }

    const formattedSuggestion = {
      ...updatedSuggestion,
      firstParty: {
        ...updatedSuggestion.firstParty,
        profile: updatedSuggestion.firstParty.profile ? {
          ...updatedSuggestion.firstParty.profile,
          birthDate: updatedSuggestion.firstParty.profile.birthDate?.toISOString(),
          lastActive: updatedSuggestion.firstParty.profile.lastActive?.toISOString(),
          availabilityUpdatedAt: updatedSuggestion.firstParty.profile.availabilityUpdatedAt?.toISOString(),
          createdAt: updatedSuggestion.firstParty.profile.createdAt?.toISOString(),
          updatedAt: updatedSuggestion.firstParty.profile.updatedAt?.toISOString()
        } : null
      },
      secondParty: {
        ...updatedSuggestion.secondParty,
        profile: updatedSuggestion.secondParty.profile ? {
          ...updatedSuggestion.secondParty.profile,
          birthDate: updatedSuggestion.secondParty.profile.birthDate?.toISOString(),
          lastActive: updatedSuggestion.secondParty.profile.lastActive?.toISOString(),
          availabilityUpdatedAt: updatedSuggestion.secondParty.profile.availabilityUpdatedAt?.toISOString(),
          createdAt: updatedSuggestion.secondParty.profile.createdAt?.toISOString(),
          updatedAt: updatedSuggestion.secondParty.profile.updatedAt?.toISOString()
        } : null
      },
      statusHistory: updatedSuggestion.statusHistory.map(history => ({
        ...history,
        createdAt: history.createdAt.toISOString()
      })),
      responseDeadline: updatedSuggestion.responseDeadline?.toISOString(),
      decisionDeadline: updatedSuggestion.decisionDeadline?.toISOString(),
      lastStatusChange: updatedSuggestion.lastStatusChange?.toISOString(),
      firstPartySent: updatedSuggestion.firstPartySent?.toISOString(),
      firstPartyResponded: updatedSuggestion.firstPartyResponded?.toISOString(),
      secondPartySent: updatedSuggestion.secondPartySent?.toISOString(),
      secondPartyResponded: updatedSuggestion.secondPartyResponded?.toISOString(),
      firstMeetingScheduled: updatedSuggestion.firstMeetingScheduled?.toISOString(),
      closedAt: updatedSuggestion.closedAt?.toISOString(),
      createdAt: updatedSuggestion.createdAt.toISOString(),
      updatedAt: updatedSuggestion.updatedAt.toISOString(),
      lastActivity: updatedSuggestion.lastActivity.toISOString()
    };
      
    return NextResponse.json({
      success: true,
      data: formattedSuggestion
    });
      
  } catch (error) {
    console.error("Error updating suggestion:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    return NextResponse.json(
      { success: false, error: "Failed to update suggestion", details: errorMessage },
      { status: 500 }
    );
  }
}