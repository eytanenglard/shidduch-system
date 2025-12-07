// src/app/api/referral/campaign/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma'; // 🔴 תיקון: default import
import { getCampaignWithStats, getActiveCampaign } from '@/lib/services/referralService';
import { z } from 'zod';

// Validation schema for creating campaign
const createCampaignSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens'),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  prizeTiers: z.array(z.object({
    threshold: z.number().min(1),
    prize: z.string(),
    prizeValue: z.number().optional(),
  })).optional(),
  grandPrize: z.string().optional(),
  settings: z.object({
    requireVerification: z.boolean().default(true),
    requireProfileComplete: z.boolean().default(false),
    maxReferralsPerIP: z.number().min(0).default(5),
    allowSelfReferral: z.boolean().default(false),
  }).optional(),
});

// GET - הבא קמפיין פעיל או ספציפי
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('id');
    const slug = searchParams.get('slug');
    const withStats = searchParams.get('stats') === 'true';

    // אם מבקשים קמפיין ספציפי עם סטטיסטיקות - צריך להיות אדמין
    if (withStats) {
      const session = await getServerSession(authOptions);
      if (!session?.user || !['ADMIN', 'MATCHMAKER'].includes(session.user.role)) {
        return NextResponse.json(
          { success: false, error: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }
    }

    let campaign;

    if (campaignId && withStats) {
      campaign = await getCampaignWithStats(campaignId);
    } else if (slug) {
      campaign = await getActiveCampaign(slug);
    } else {
      campaign = await getActiveCampaign();
    }

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'CAMPAIGN_NOT_FOUND' },
        { status: 404 }
      );
    }

    // אם זה עם סטטיסטיקות, הבא גם את המפנים
    if (withStats && campaignId) {
      const referrers = await prisma.referrer.findMany({
        where: { campaignId },
        orderBy: { verifiedCount: 'desc' },
        include: {
          _count: {
            select: { referrals: true }
          }
        }
      });

      return NextResponse.json({
        success: true,
        campaign,
        referrers: referrers.map(r => ({
          ...r,
          referralsCount: r._count.referrals,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        slug: campaign.slug,
        description: campaign.description,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        isActive: campaign.isActive,
        prizeTiers: campaign.prizeTiers,
        grandPrize: campaign.grandPrize,
      },
    });

  } catch (error) {
    console.error('[Campaign GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST - צור קמפיין חדש (אדמין בלבד)
export async function POST(request: NextRequest) {
  try {
    // בדוק הרשאות
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate
    const validationResult = createCampaignSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'VALIDATION_ERROR',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // בדוק ש-slug ייחודי
    const existingSlug = await prisma.referralCampaign.findUnique({
      where: { slug: data.slug },
    });

    if (existingSlug) {
      return NextResponse.json(
        { success: false, error: 'SLUG_TAKEN' },
        { status: 409 }
      );
    }

    // צור את הקמפיין
    const campaign = await prisma.referralCampaign.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: true,
        prizeTiers: data.prizeTiers ?? undefined, // 🔴 תיקון: undefined במקום null
        grandPrize: data.grandPrize,
        settings: data.settings ?? undefined, // 🔴 תיקון: undefined במקום null
      },
    });

    return NextResponse.json({
      success: true,
      campaign,
    });

  } catch (error) {
    console.error('[Campaign POST] Error:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// PATCH - עדכן קמפיין (אדמין בלבד)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing campaign ID' },
        { status: 400 }
      );
    }

    // עדכן
    const campaign = await prisma.referralCampaign.update({
      where: { id },
      data: {
        ...updates,
        startDate: updates.startDate ? new Date(updates.startDate) : undefined,
        endDate: updates.endDate ? new Date(updates.endDate) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      campaign,
    });

  } catch (error) {
    console.error('[Campaign PATCH] Error:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}