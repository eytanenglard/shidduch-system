// src/app/api/matchmaker/hidden-candidates/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export const dynamic = 'force-dynamic';

// =============================================================================
// GET - קבלת רשימת המועמדים המוסתרים של השדכן
// =============================================================================
export async function GET() {
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

    // שליפת המועמדים המוסתרים עם פרטי המועמד
    const hiddenCandidates = await prisma.hiddenCandidate.findMany({
      where: {
        matchmakerId: session.user.id,
      },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            images: {
              where: { isMain: true },
              take: 1,
              select: { url: true },
            },
            profile: {
              select: {
                gender: true,
                city: true,
                religiousLevel: true,
                availabilityStatus: true,
              },
            },
          },
        },
      },
      orderBy: {
        hiddenAt: 'desc',
      },
    });

    // פורמט התוצאות
    const formattedCandidates = hiddenCandidates.map((hc) => ({
      id: hc.id,
      candidateId: hc.candidateId,
      reason: hc.reason,
      hiddenAt: hc.hiddenAt,
      candidate: {
        id: hc.candidate.id,
        firstName: hc.candidate.firstName,
        lastName: hc.candidate.lastName,
        phone: hc.candidate.phone,
        mainImage: hc.candidate.images[0]?.url || null,
        gender: hc.candidate.profile?.gender || null,
        city: hc.candidate.profile?.city || null,
        religiousLevel: hc.candidate.profile?.religiousLevel || null,
        availabilityStatus: hc.candidate.profile?.availabilityStatus || null,
      },
    }));

    return NextResponse.json({
      success: true,
      hiddenCandidates: formattedCandidates,
      count: formattedCandidates.length,
    });

  } catch (error) {
    console.error('Error fetching hidden candidates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hidden candidates' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - הוספת מועמד לרשימת המוסתרים
// =============================================================================
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { candidateId, reason } = body;

    if (!candidateId) {
      return NextResponse.json(
        { success: false, error: 'candidateId is required' },
        { status: 400 }
      );
    }

    // בדיקה שהמועמד קיים
    const candidate = await prisma.user.findUnique({
      where: { id: candidateId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!candidate) {
      return NextResponse.json(
        { success: false, error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // יצירת רשומה (upsert למניעת כפילויות)
    const hiddenCandidate = await prisma.hiddenCandidate.upsert({
      where: {
        matchmakerId_candidateId: {
          matchmakerId: session.user.id,
          candidateId: candidateId,
        },
      },
      update: {
        reason: reason || null,
        hiddenAt: new Date(), // עדכון תאריך אם כבר קיים
      },
      create: {
        matchmakerId: session.user.id,
        candidateId: candidateId,
        reason: reason || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${candidate.firstName} ${candidate.lastName} הוסתר/ה מרשימת ההצעות`,
      hiddenCandidate: {
        id: hiddenCandidate.id,
        candidateId: hiddenCandidate.candidateId,
        reason: hiddenCandidate.reason,
        hiddenAt: hiddenCandidate.hiddenAt,
      },
    });

  } catch (error) {
    console.error('Error hiding candidate:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to hide candidate' },
      { status: 500 }
    );
  }
}
