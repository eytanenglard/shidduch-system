// src/app/api/admin/engagement/stats/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // בדיקת הרשאות
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // ספירת מיילים היום
    const todayEmails = await prisma.userDripCampaign.count({
      where: {
        updatedAt: { gte: today }
      }
    });

    // ספירת מיילים השבוע
    const weeklyEmails = await prisma.userDripCampaign.count({
      where: {
        updatedAt: { gte: weekAgo }
      }
    });

    // משתמשים פעילים
    const activeUsers = await prisma.user.count({
      where: {
        status: 'ACTIVE',
        isProfileComplete: false
      }
    });

    // התפלגות השלמה
    const allUsers = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      include: {
        profile: true,
        images: true,
        questionnaireResponses: { take: 1 }
      }
    });

    const completionRanges = {
      '0-25%': 0,
      '26-50%': 0,
      '51-75%': 0,
      '76-90%': 0,
      '91-100%': 0
    };

    allUsers.forEach(user => {
      // חישוב פשטני של אחוז השלמה
      let score = 0;
      if (user.images.length >= 3) score += 20;
      if (user.profile?.profileHeadline) score += 20;
      if (user.profile?.about && user.profile.about.length >= 100) score += 20;
      if (user.questionnaireResponses[0]?.completed) score += 40;
      
      if (score <= 25) completionRanges['0-25%']++;
      else if (score <= 50) completionRanges['26-50%']++;
      else if (score <= 75) completionRanges['51-75%']++;
      else if (score <= 90) completionRanges['76-90%']++;
      else completionRanges['91-100%']++;
    });

    const completionDistribution = [
      { range: '0-25%', count: completionRanges['0-25%'], color: '#ef4444' },
      { range: '26-50%', count: completionRanges['26-50%'], color: '#f59e0b' },
      { range: '51-75%', count: completionRanges['51-75%'], color: '#3b82f6' },
      { range: '76-90%', count: completionRanges['76-90%'], color: '#8b5cf6' },
      { range: '91-100%', count: completionRanges['91-100%'], color: '#10b981' }
    ];

    // פעילות אחרונה
    const recentActivity = await prisma.userDripCampaign.findMany({
      take: 10,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    const formattedActivity = recentActivity.map(activity => ({
      time: new Date(activity.updatedAt).toLocaleTimeString('he-IL', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      user: `${activity.user.firstName} ${activity.user.lastName}`,
      action: activity.lastSentType || 'UNKNOWN',
      status: 'sent' as const
    }));

    // התפלגות סוגי מיילים
    const emailTypes = await prisma.userDripCampaign.groupBy({
      by: ['lastSentType'],
      _count: true,
      where: {
        updatedAt: { gte: weekAgo }
      }
    });

    const typeColors: Record<string, string> = {
      'ONBOARDING': '#3b82f6',
      'NUDGE': '#f59e0b',
      'CELEBRATION': '#10b981',
      'INSIGHT': '#8b5cf6',
      'VALUE': '#06b6d4',
      'EVENING_FEEDBACK': '#ec4899',
      'AI_SUMMARY': '#14b8a6'
    };

    const emailTypeBreakdown = emailTypes.map(type => ({
      name: type.lastSentType || 'Unknown',
      value: type._count,
      color: typeColors[type.lastSentType || ''] || '#6b7280'
    }));

    return NextResponse.json({
      todayEmails,
      weeklyEmails,
      activeUsers,
      completionDistribution,
      recentActivity: formattedActivity,
      emailTypeBreakdown
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
