// ===========================================
// קובץ חדש: src/app/api/ai/virtual-profile/route.ts
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserRole, Gender } from "@prisma/client";
import prisma from "@/lib/prisma";
import aiService from "@/lib/services/aiService";

export const dynamic = 'force-dynamic';

// ============================================================================
// POST - יצירת פרופיל וירטואלי חדש
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    // 1. אימות והרשאות
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || 
        (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 });
    }

    const matchmakerId = session.user.id;

    // 2. קבלת פרמטרים
    const body = await req.json();
    const { sourceText, gender, religiousLevel, name } = body;

    // 3. ולידציה
    if (!sourceText || typeof sourceText !== 'string' || sourceText.trim().length < 20) {
      return NextResponse.json({ 
        success: false, 
        message: 'sourceText is required and must be at least 20 characters.' 
      }, { status: 400 });
    }

    if (!gender || !['MALE', 'FEMALE'].includes(gender)) {
      return NextResponse.json({ 
        success: false, 
        message: 'gender is required and must be MALE or FEMALE.' 
      }, { status: 400 });
    }

    if (!religiousLevel || typeof religiousLevel !== 'string') {
      return NextResponse.json({ 
        success: false, 
        message: 'religiousLevel is required.' 
      }, { status: 400 });
    }

    console.log(`[Virtual Profile API] Creating profile for matchmaker: ${session.user.email}`);
    console.log(`[Virtual Profile API] Gender: ${gender}, Religious: ${religiousLevel}`);

    // 4. יצירת הפרופיל באמצעות AI
    const generatedProfile = await aiService.generateVirtualProfile(
      sourceText.trim(),
      gender as 'MALE' | 'FEMALE',
      religiousLevel
    );

    if (!generatedProfile) {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to generate virtual profile. Please try again.' 
      }, { status: 500 });
    }

    // 5. יצירת וקטור מהסיכום (לחיפוש וקטורי)
    const textForEmbedding = `
      ${generatedProfile.personalitySummary}
      ${generatedProfile.lookingForSummary}
      תכונות: ${generatedProfile.keyTraits?.join(', ') || ''}
      מחפש: ${generatedProfile.idealPartnerTraits?.join(', ') || ''}
    `;
    
    const vector = await aiService.generateTextEmbedding(textForEmbedding);

    // 6. שמירה ב-DB
    const virtualProfile = await prisma.virtualProfile.create({
      data: {
        matchmakerId,
        name: name?.trim() || null,
        sourceText: sourceText.trim(),
        gender: gender as Gender,
        religiousLevel,
        generatedProfile: generatedProfile as any,
        // הוקטור יישמר בנפרד אם נדרש (pgvector)
      },
    });

    // 6.1 שמירת הוקטור (אם נוצר בהצלחה)
    if (vector && vector.length === 768) {
      try {
        const vectorSqlString = `[${vector.join(',')}]`;
        await prisma.$executeRaw`
          UPDATE "VirtualProfile"
          SET vector = ${vectorSqlString}::vector
          WHERE id = ${virtualProfile.id}
        `;
        console.log(`[Virtual Profile API] Vector saved successfully`);
      } catch (vectorError) {
        console.error(`[Virtual Profile API] Failed to save vector:`, vectorError);
        // לא נכשיל את כל הבקשה בגלל הוקטור
      }
    }

    console.log(`[Virtual Profile API] ✅ Created profile: ${virtualProfile.id}`);

    // 7. החזרת התוצאה
    return NextResponse.json({
      success: true,
      virtualProfile: {
        id: virtualProfile.id,
        name: virtualProfile.name,
        gender: virtualProfile.gender,
        religiousLevel: virtualProfile.religiousLevel,
        generatedProfile,
        createdAt: virtualProfile.createdAt,
      }
    });

  } catch (error) {
    console.error('[Virtual Profile API] POST Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error',
      details: errorMessage 
    }, { status: 500 });
  }
}

// ============================================================================
// GET - שליפת פרופילים וירטואליים שמורים
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    // 1. אימות
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || 
        (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 });
    }

    const matchmakerId = session.user.id;
    const { searchParams } = new URL(req.url);
    
    // פרמטרים אופציונליים
    const starred = searchParams.get('starred') === 'true';
    const profileId = searchParams.get('id');

    // 2. שליפת פרופיל בודד
    if (profileId) {
      const profile = await prisma.virtualProfile.findFirst({
        where: {
          id: profileId,
          matchmakerId, // וידוא שהפרופיל שייך לשדכן הזה
        },
      });

      if (!profile) {
        return NextResponse.json({ 
          success: false, 
          message: 'Profile not found' 
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        virtualProfile: profile,
      });
    }

    // 3. שליפת רשימת פרופילים
    const whereClause: any = { matchmakerId };
    if (starred) {
      whereClause.isStarred = true;
    }

    const profiles = await prisma.virtualProfile.findMany({
      where: whereClause,
      orderBy: [
        { isStarred: 'desc' },
        { lastUsedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        name: true,
        gender: true,
        religiousLevel: true,
        generatedProfile: true,
        editedSummary: true,
        wasEdited: true,
        isStarred: true,
        lastUsedAt: true,
        usageCount: true,
        createdAt: true,
      },
      take: 50, // מקסימום 50 פרופילים
    });

    return NextResponse.json({
      success: true,
      profiles,
      count: profiles.length,
    });

  } catch (error) {
    console.error('[Virtual Profile API] GET Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}

// ============================================================================
// PATCH - עדכון פרופיל (שם, כוכב, סיכום ערוך)
// ============================================================================

export async function PATCH(req: NextRequest) {
  try {
    // 1. אימות
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || 
        (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 });
    }

    const matchmakerId = session.user.id;

    // 2. קבלת פרמטרים
    const body = await req.json();
    const { id, name, isStarred, editedSummary, markAsUsed } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ 
        success: false, 
        message: 'id is required' 
      }, { status: 400 });
    }

    // 3. וידוא שהפרופיל שייך לשדכן
    const existingProfile = await prisma.virtualProfile.findFirst({
      where: { id, matchmakerId },
    });

    if (!existingProfile) {
      return NextResponse.json({ 
        success: false, 
        message: 'Profile not found or access denied' 
      }, { status: 404 });
    }

    // 4. בניית אובייקט העדכון
    const updateData: any = {};

    if (name !== undefined) {
      updateData.name = name?.trim() || null;
    }

    if (isStarred !== undefined) {
      updateData.isStarred = Boolean(isStarred);
    }

    if (editedSummary !== undefined) {
      updateData.editedSummary = editedSummary?.trim() || null;
      updateData.wasEdited = Boolean(editedSummary?.trim());
      
      // אם הסיכום עודכן, ניצור וקטור חדש
      if (editedSummary?.trim()) {
        const newVector = await aiService.generateTextEmbedding(editedSummary.trim());
        if (newVector && newVector.length === 768) {
          try {
            const vectorSqlString = `[${newVector.join(',')}]`;
            await prisma.$executeRaw`
              UPDATE "VirtualProfile"
              SET vector = ${vectorSqlString}::vector
              WHERE id = ${id}
            `;
          } catch (vectorError) {
            console.error(`[Virtual Profile API] Failed to update vector:`, vectorError);
          }
        }
      }
    }

    if (markAsUsed) {
      updateData.lastUsedAt = new Date();
      updateData.usageCount = { increment: 1 };
    }

    // 5. ביצוע העדכון
    const updatedProfile = await prisma.virtualProfile.update({
      where: { id },
      data: updateData,
    });

    console.log(`[Virtual Profile API] ✅ Updated profile: ${id}`);

    return NextResponse.json({
      success: true,
      virtualProfile: updatedProfile,
    });

  } catch (error) {
    console.error('[Virtual Profile API] PATCH Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}

// ============================================================================
// DELETE - מחיקת פרופיל
// ============================================================================

export async function DELETE(req: NextRequest) {
  try {
    // 1. אימות
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || 
        (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 });
    }

    const matchmakerId = session.user.id;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        message: 'id is required' 
      }, { status: 400 });
    }

    // 2. וידוא שהפרופיל שייך לשדכן ומחיקה
    const deletedProfile = await prisma.virtualProfile.deleteMany({
      where: { 
        id, 
        matchmakerId 
      },
    });

    if (deletedProfile.count === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Profile not found or access denied' 
      }, { status: 404 });
    }

    console.log(`[Virtual Profile API] ✅ Deleted profile: ${id}`);

    return NextResponse.json({
      success: true,
      message: 'Profile deleted successfully',
    });

  } catch (error) {
    console.error('[Virtual Profile API] DELETE Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}