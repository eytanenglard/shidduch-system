// src/app/api/admin/engagement/send-manual/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { SmartEngagementOrchestrator } from '@/lib/engagement/SmartEngagementOrchestrator';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getEmailDictionary } from '@/lib/dictionaries';
import { Language } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, emailType } = await request.json();

    if (!userId || !emailType) {
      return NextResponse.json(
        { error: 'Missing userId or emailType' },
        { status: 400 }
      );
    }

    // מצא את המשתמש
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        images: true,
        questionnaireResponses: { take: 1, orderBy: { lastSaved: 'desc' } },
        dripCampaign: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // טען את מילון המיילים המתאים לשפת המשתמש
// ✅ קוד מתוקן
const dict = await getEmailDictionary(user.language as Language);
    // בנה פרופיל engagement
    const profile = await SmartEngagementOrchestrator['buildUserEngagementProfile'](userId);
    
    // צור מייל מתאים
    let email;
    switch (emailType) {
      case 'EVENING_FEEDBACK':
        const dailyActivity = await SmartEngagementOrchestrator['detectDailyActivity'](userId);
        email = await SmartEngagementOrchestrator['getEveningFeedbackEmail'](profile, dailyActivity, dict);
        break;
      case 'AI_SUMMARY':
        email = await SmartEngagementOrchestrator['getAiSummaryEmail'](profile, dict);
        break;
      case 'NUDGE':
        email = await SmartEngagementOrchestrator['getQuestionnaireNudgeEmail'](profile, dict);
        break;
      // הוסף עוד מקרים לפי הצורך
      default:
        return NextResponse.json(
          { error: 'Unsupported email type' },
          { status: 400 }
        );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Could not generate email for this user state' },
        { status: 400 }
      );
    }

    // שלח
    await SmartEngagementOrchestrator['sendEmail'](user, email);
    await SmartEngagementOrchestrator['updateCampaignRecord'](userId, emailType);

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      emailType: email.type
    });

  } catch (error) {
    console.error('Error sending manual email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}