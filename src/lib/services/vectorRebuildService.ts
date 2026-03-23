// ============================================================
// NeshamaTech - Vector Rebuild Service
// src/lib/services/vectorRebuildService.ts
// ============================================================
// Shared logic for finding and rebuilding stale profile vectors.
// Used by:
//   - /api/admin/rebuild-stale-vectors (manual admin trigger)
//   - /api/cron/rebuild-vectors        (nightly Heroku Scheduler)
// ============================================================

import prisma from '@/lib/prisma';
import { updateProfileVectorsAndMetrics } from './dualVectorService';

export interface StaleProfile {
  profileId: string;
  userId: string;
  email: string;
  reason: 'missing' | 'stale';
}

/**
 * מוצא את כל הפרופילים שהוקטורים שלהם ישנים לפי אחד מהתנאים:
 *  1. אין metrics / vectors כלל
 *  2. פרופיל / שאלון / טביעת נשמה (ProfileTags) עודכנו אחרי בניית הוקטורים
 *
 * ללא הגבלת מספר — המגבלה מוחלת על ידי הקורא.
 */
export async function findAllStaleProfiles(): Promise<StaleProfile[]> {
  return prisma.$queryRaw<StaleProfile[]>`
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

/**
 * מריץ rebuild לרשימת פרופילים.
 * @param profiles - רשימת הפרופילים לעדכון
 * @param delayMs  - השהייה בין קריאות Gemini (ברירת מחדל: 300ms)
 */
export async function runRebuild(
  profiles: StaleProfile[],
  delayMs = 300
): Promise<{ success: number; failed: number }> {
  console.log(`\n🚀 [RebuildVectors] Starting rebuild for ${profiles.length} profiles...`);

  let success = 0;
  let failed = 0;

  for (const p of profiles) {
    try {
      await updateProfileVectorsAndMetrics(p.profileId);
      success++;
      console.log(`[RebuildVectors] profileId: ${p.profileId} (${p.reason}) — ${success}/${profiles.length}`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } catch (err) {
      failed++;
      console.error(`[RebuildVectors] Failed for profileId: ${p.profileId}:`, err);
    }
  }

  console.log(`\n🏁 [RebuildVectors] Done. ✅ ${success} updated, ❌ ${failed} failed`);
  return { success, failed };
}
