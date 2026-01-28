import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { updateProfileVectorsAndMetrics } from '@/lib/services/dualVectorService';
import { extractMetricsFromProfile } from '@/lib/services/metricsExtractionService';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const limit = body.limit ?? 100;
    const forceUpdate = body.forceUpdate ?? false;

    console.log(`[UpdateAllMetrics] Starting batch update, limit: ${limit}, force: ${forceUpdate}`);

    // שליפת פרופילים שצריכים עדכון
    const profiles = await prisma.profile.findMany({
      where: forceUpdate ? {} : {
        OR: [
          { metrics: null },
          { vector: null },
        ],
      },
      select: { id: true, userId: true },
      take: limit,
    });

    console.log(`[UpdateAllMetrics] Found ${profiles.length} profiles to update`);

    const results = {
      total: profiles.length,
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const profile of profiles) {
      try {
        // עדכון מדדים
        await extractMetricsFromProfile(profile.id);
        
        // עדכון וקטורים
        await updateProfileVectorsAndMetrics(profile.id);
        
        results.success++;
        
        // Delay למניעת עומס על API
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        results.failed++;
        results.errors.push(`${profile.id}: ${error}`);
      }
    }

    console.log(`[UpdateAllMetrics] Completed: ${results.success} success, ${results.failed} failed`);

    return NextResponse.json({
      success: true,
      results,
    });

  } catch (error) {
    console.error('[UpdateAllMetrics] Failed:', error);
    return NextResponse.json(
      { error: 'Update failed', details: String(error) },
      { status: 500 }
    );
  }
}