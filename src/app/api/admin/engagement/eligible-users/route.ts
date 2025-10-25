// src/app/api/admin/engagement/eligible-users/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] GET /api/admin/engagement/eligible-users - Request received.`);

  try {
    // שלב 1: אימות והרשאות
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
      const reason = !session?.user?.id ? 'No active session' : `Invalid role: ${session.user.role}`;
      console.warn(`[${timestamp}] Unauthorized access attempt: ${reason}.`);
      return NextResponse.json(
        { success: false, error: 'Forbidden: Administrator access required.' },
        { status: 403 }
      );
    }

    console.log(`[${timestamp}] Access granted for ADMIN user: ${session.user.id}`);

    // שלב 2: שליפת הנתונים מה-Database
    // 🎯 עדכון: מחזירים את כל המשתמשים הפעילים (לא רק אלה עם פרופיל לא שלם)
    const users = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        role: 'CANDIDATE', // רק מועמדים, לא אדמינים/שדכנים
        // 🎯 הסרנו את התנאי isProfileComplete: false
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isProfileComplete: true, // 🎯 נוסיף את זה כדי לראות את הסטטוס
        profile: {
          select: {
            city: true,
          },
        },
        dripCampaign: {
          select: {
            lastSentType: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`[${timestamp}] Found ${users.length} eligible users for engagement campaign.`);

    // שלב 3: החזרת תגובה מוצלחת
    return NextResponse.json({ success: true, users: users });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`[${timestamp}] Error in /api/admin/engagement/eligible-users:`, error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch eligible users due to an internal server error.',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';