// src/app/api/referral/stats/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getReferrerStats, getReferrerByCode } from '@/lib/services/referralService';
import prisma from '@/lib/prisma';
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Missing code parameter' },
        { status: 400 }
      );
    }

    // בדוק שהמפנה קיים
    const referrer = await getReferrerByCode(code);
    if (!referrer) {
      return NextResponse.json(
        { success: false, error: 'REFERRER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // הבא סטטיסטיקות
    const stats = await getReferrerStats(code);
    if (!stats) {
      return NextResponse.json(
        { success: false, error: 'STATS_NOT_FOUND' },
        { status: 404 }
      );
    }

    // הבא פירוט הפניות לפי סטטוס
    const statusCounts = await prisma.referral.groupBy({
      by: ['status'],
      where: { referrerId: referrer.id },
      _count: { id: true },
    });

    const byStatus = statusCounts.reduce((acc, curr) => {
      acc[curr.status] = curr._count.id;
      return acc;
    }, {} as Record<string, number>);

    // הבא הפניות אחרונות
    const recentReferrals = await prisma.referral.findMany({
      where: { referrerId: referrer.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        status: true,
        createdAt: true,
      },
    });

    // חשב ימים שנותרו לקמפיין
    const now = new Date();
    const endDate = new Date(referrer.campaign.endDate);
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return NextResponse.json({
      success: true,
      stats,
      referrals: {
        total: Object.values(byStatus).reduce((a, b) => a + b, 0),
        byStatus,
        recent: recentReferrals.map(r => ({
          status: r.status,
          createdAt: r.createdAt.toISOString(),
        })),
      },
      campaign: {
        name: referrer.campaign.name,
        endsAt: referrer.campaign.endDate.toISOString(),
        daysRemaining,
        isActive: referrer.campaign.isActive && endDate > now,
      },
    });

  } catch (error) {
    console.error('[Referral Stats] Error:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}