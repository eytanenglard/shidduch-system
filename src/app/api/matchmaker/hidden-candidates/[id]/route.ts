// src/app/api/matchmaker/hidden-candidates/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export const dynamic = 'force-dynamic';

// =============================================================================
// DELETE - הסרת מועמד מרשימת המוסתרים
// =============================================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Not logged in' },
        { status: 401 }
      );
    }

    // וידוא שהמשתמש הוא שדכן או אדמין
    const allowedRoles: UserRole[] = [UserRole.MATCHMAKER, UserRole.ADMIN];
    if (!allowedRoles.includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Matchmaker or Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Hidden candidate ID is required' },
        { status: 400 }
      );
    }

    // בדיקה שהרשומה קיימת ושייכת לשדכן הנוכחי
    const hiddenCandidate = await prisma.hiddenCandidate.findUnique({
      where: { id },
      include: {
        candidate: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!hiddenCandidate) {
      return NextResponse.json(
        { success: false, error: 'Hidden candidate record not found' },
        { status: 404 }
      );
    }

    // וידוא שזה השדכן שהסתיר את המועמד
    if (hiddenCandidate.matchmakerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'You can only unhide candidates you have hidden' },
        { status: 403 }
      );
    }

    // מחיקת הרשומה
    await prisma.hiddenCandidate.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `${hiddenCandidate.candidate.firstName} ${hiddenCandidate.candidate.lastName} הוחזר/ה לרשימת ההצעות`,
      candidateId: hiddenCandidate.candidateId,
    });

  } catch (error) {
    console.error('Error unhiding candidate:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unhide candidate' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PATCH - עדכון סיבת ההסתרה
// =============================================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Not logged in' },
        { status: 401 }
      );
    }

    const allowedRoles: UserRole[] = [UserRole.MATCHMAKER, UserRole.ADMIN];
    if (!allowedRoles.includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Matchmaker or Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    // בדיקה שהרשומה קיימת ושייכת לשדכן הנוכחי
    const hiddenCandidate = await prisma.hiddenCandidate.findUnique({
      where: { id },
    });

    if (!hiddenCandidate) {
      return NextResponse.json(
        { success: false, error: 'Hidden candidate record not found' },
        { status: 404 }
      );
    }

    if (hiddenCandidate.matchmakerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'You can only update your own hidden candidates' },
        { status: 403 }
      );
    }

    // עדכון הסיבה
    const updated = await prisma.hiddenCandidate.update({
      where: { id },
      data: { reason: reason || null },
    });

    return NextResponse.json({
      success: true,
      message: 'Reason updated successfully',
      hiddenCandidate: {
        id: updated.id,
        reason: updated.reason,
      },
    });

  } catch (error) {
    console.error('Error updating hidden candidate:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update hidden candidate' },
      { status: 500 }
    );
  }
}