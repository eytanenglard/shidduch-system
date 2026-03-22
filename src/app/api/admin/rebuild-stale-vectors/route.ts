import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { updateProfileVectorsAndMetrics } from '@/lib/services/dualVectorService';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

/**
 * מוצא את כל הפרופילים שהוקטורים שלהם ישנים לפי אחד מהתנאים:
 *  1. אין metrics / vectors כלל
 *  2. פרופיל / שאלון / טביעת נשמה (ProfileTags) עודכנו אחרי בניית הוקטורים
 *
 * ללא הגבלת מספר — מיועד להרצה חד-פעמית אחרי שינויים גדולים במערכת.
 */
async function findAllStaleProfiles(): Promise<{ profileId: string; userId: string; email: string; reason: string }[]> {
  return prisma.$queryRaw<{ profileId: string; userId: string; email: string; reason: string }[]>`
    SELECT
      p.id           as "profileId",
      u.id           as "userId",
      u.email        as "email",
      CASE
        WHEN pm.id IS NULL OR pv.id IS NULL OR pv."selfVector" IS NULL OR pv."seekingVector" IS NULL
          THEN 'missing'
        WHEN GREATEST(
               p."updatedAt",
               COALESCE(qr."updatedAt", p."updatedAt"),
               COALESCE(pt."updatedAt", p."updatedAt")
             ) > pv."updatedAt" + INTERVAL '2 hours'
          THEN 'stale'
        ELSE 'ok'
      END as reason
    FROM "Profile" p
    JOIN "User" u ON u.id = p."userId"
    LEFT JOIN "profile_metrics"       pm ON pm."profileId" = p.id
    LEFT JOIN "profile_vectors"       pv ON pv."profileId" = p.id
    LEFT JOIN "QuestionnaireResponse" qr ON qr."profileId" = p.id
    LEFT JOIN "ProfileTags"           pt ON pt."profileId" = p.id
    WHERE
      u.role = 'CANDIDATE'
      AND p."availabilityStatus" = 'AVAILABLE'
      AND (p."isProfileVisible" = true OR p."isProfileVisible" IS NULL)
      AND (
        pm.id IS NULL
        OR pv.id IS NULL
        OR pv."selfVector" IS NULL
        OR pv."seekingVector" IS NULL
        OR GREATEST(
             p."updatedAt",
             COALESCE(qr."updatedAt", p."updatedAt"),
             COALESCE(pt."updatedAt", p."updatedAt")
           ) > pv."updatedAt" + INTERVAL '2 hours'
      )
    ORDER BY p."updatedAt" DESC
  `;
}

async function runRebuild(profiles: { profileId: string; userId: string; email: string; reason: string }[]) {
  console.log(`\n🚀 [RebuildVectors] Starting rebuild for ${profiles.length} profiles...`);

  let success = 0;
  let failed = 0;

  for (const p of profiles) {
    try {
      await updateProfileVectorsAndMetrics(p.profileId);
      success++;
      console.log(`✅ [RebuildVectors] ${p.email} (${p.reason}) — ${success}/${profiles.length}`);
      // קצת השהייה כדי לא להציף את Gemini API
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (err) {
      failed++;
      console.error(`❌ [RebuildVectors] Failed for ${p.email}:`, err);
    }
  }

  console.log(`\n🏁 [RebuildVectors] Done. ✅ ${success} updated, ❌ ${failed} failed`);
  return { success, failed };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // dry_run=true מחזיר רק כמה יוזרים צריכים עדכון, ללא הרצה
    const { searchParams } = new URL(req.url);
    const dryRun = searchParams.get('dry_run') === 'true';

    const staleProfiles = await findAllStaleProfiles();

    const missingCount = staleProfiles.filter(p => p.reason === 'missing').length;
    const staleCount   = staleProfiles.filter(p => p.reason === 'stale').length;

    console.log(`[RebuildVectors] Found ${staleProfiles.length} profiles needing update (${missingCount} missing, ${staleCount} stale)`);

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        total: staleProfiles.length,
        missing: missingCount,
        stale: staleCount,
        profiles: staleProfiles.map(p => ({ email: p.email, reason: p.reason })),
      });
    }

    if (staleProfiles.length === 0) {
      return NextResponse.json({ success: true, message: 'כל הפרופילים עדכניים ✓', updated: 0 });
    }

    // הרץ ברקע כדי לא לחכות לסיום
    runRebuild(staleProfiles).catch(err =>
      console.error('[RebuildVectors] Background error:', err)
    );

    return NextResponse.json({
      success: true,
      message: `תהליך הרענון התחיל עבור ${staleProfiles.length} פרופילים (${missingCount} חסרים, ${staleCount} ישנים). בדוק את ה-logs להתקדמות.`,
      total: staleProfiles.length,
      missing: missingCount,
      stale: staleCount,
    });

  } catch (error) {
    console.error('[RebuildVectors] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
