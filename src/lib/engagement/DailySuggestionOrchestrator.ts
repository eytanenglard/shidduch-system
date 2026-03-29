// src/lib/engagement/DailySuggestionOrchestrator.ts
// =============================================================================
// NeshamaTech - Daily Auto-Suggestion Orchestrator
// שולח הצעת שידוך יומית אחת לכל יוזר זכאי בשעה 19:00
//
// V3.0 - Major improvements:
// - Manual users (MANUAL_ENTRY/IMPORTED) eligible as second party
// - Hard/soft blocking split (FIRST_PARTY_APPROVED+ = hard, PENDING = soft)
// - Concurrent second party: up to 3 parallel suggestions per person
// - Contest mechanism: when first party approves, others get "in demand" hint
// - Batch query optimization in findBestMatch
// - Skipped match logging for matchmaker visibility
//
// V4.0 - Party assignment + matchmaker tools:
// - Male as first party by default (replaces wantsToBeFirstParty-only logic)
// - determinePartySwap() helper — centralized party logic
// - getAllMatchesForUser() — paginated full match list
// - checkEligibility() — pre-flight eligibility check
// =============================================================================

import prisma from '@/lib/prisma';
import type { MatchSuggestionStatus, PotentialMatchStatus } from '@prisma/client';
import { AutoSuggestionFeedbackService } from '@/lib/services/autoSuggestionFeedbackService';
import { initNotificationService } from '@/components/matchmaker/suggestions/services/notification/initNotifications';
import { sendPushToUser } from '@/lib/sendPushNotification';
import { getDictionary } from '@/lib/dictionaries';
import type { EmailDictionary } from '@/types/dictionary';
import { SignJWT } from 'jose';

// =============================================================================
// CONSTANTS
// =============================================================================

const MIN_AI_SCORE = 70;

const DECISION_DEADLINE_DAYS = 3;

// Hard block: user has an active match process — cannot participate at all (first or second party)
const HARD_BLOCK_STATUSES: MatchSuggestionStatus[] = [
  'FIRST_PARTY_APPROVED',
  'SECOND_PARTY_APPROVED',
  'AWAITING_MATCHMAKER_APPROVAL',
  'CONTACT_DETAILS_SHARED',
  'AWAITING_FIRST_DATE_FEEDBACK',
  'THINKING_AFTER_DATE',
  'PROCEEDING_TO_SECOND_DATE',
  'MEETING_PENDING',
  'MEETING_SCHEDULED',
  'MATCH_APPROVED',
  'DATING',
];

// Soft block: user has a pending suggestion — skip new auto-suggestion, let reminders cron handle it
const SOFT_BLOCK_STATUSES: MatchSuggestionStatus[] = [
  'PENDING_FIRST_PARTY',
  'PENDING_SECOND_PARTY',
];

// Max concurrent auto-suggestions where the same person is second party
const MAX_CONCURRENT_AS_SECOND_PARTY = 3;

// Shortened deadline when suggestion becomes contested (hours)
const CONTESTED_DEADLINE_HOURS = 24;

// All blocking statuses — user has any active/pending suggestion
const BLOCKING_SUGGESTION_STATUSES: MatchSuggestionStatus[] = [
  ...HARD_BLOCK_STATUSES,
  ...SOFT_BLOCK_STATUSES,
];

// סטטוסים שנחשבים "סגורים" — מותר ליצור הצעה חדשה אם קיימת כזו ישנה
const CLOSED_STATUSES: MatchSuggestionStatus[] = [
  'FIRST_PARTY_DECLINED',
  'SECOND_PARTY_DECLINED',
  'CLOSED',
  'CANCELLED',
  'EXPIRED',
];

// =============================================================================
// TYPES
// =============================================================================

interface DailySuggestionResult {
  processed: number;
  newSuggestionsSent: number;
  remindersSent: number; // Kept for backward compat (always 0 — reminders handled by suggestion-reminders cron)
  skipped: number;
  errors: number;
  details: {
    userId: string;
    action: 'new_suggestion' | 'reminder' | 'skipped' | 'error';
    reason?: string;
    matchId?: string;
    suggestionId?: string;
  }[];
}

// Inferred type from Prisma select query
type EligibleUser = Awaited<ReturnType<typeof DailySuggestionOrchestrator['getEligibleUsers']>>[number];

// =============================================================================
// MAIN ORCHESTRATOR
// =============================================================================

export class DailySuggestionOrchestrator {

  // ========== Party Assignment Helper ==========
  // V4.0: Male as first party by default.
  // Exceptions:
  //   - Male explicitly opted out (wantsToBeFirstParty === false) → female becomes first
  //   - Other party is MANUAL_ENTRY → can't be first party (no notifications)
  //
  // Returns true if parties should be swapped (i.e., the "other party" becomes first party)

  private static async determinePartySwap(
    user: { id: string; profile: { gender: string | null; wantsToBeFirstParty: boolean | null } | null },
    match: { maleUserId: string; femaleUserId: string }
  ): Promise<boolean> {
    const isMale = user.profile?.gender === 'MALE';

    if (isMale) {
      // User is male → default first party. Only swap if male explicitly opted out.
      if (user.profile?.wantsToBeFirstParty === false) {
        const otherPartyId = match.femaleUserId;
        const otherParty = await prisma.user.findUnique({
          where: { id: otherPartyId },
          select: { source: true },
        });
        if (otherParty?.source !== 'MANUAL_ENTRY') {
          console.log(`  🔄 Male opted out of first party → swapping to female`);
          return true;
        }
        console.log(`  ℹ️ Male opted out but female is manual user — keeping male as first`);
      }
      return false; // Male stays as first party
    } else {
      // User is female → swap so male becomes first party
      // Unless male opted out or is manual user
      const malePartyId = match.maleUserId;
      const maleUser = await prisma.user.findUnique({
        where: { id: malePartyId },
        select: { source: true, profile: { select: { wantsToBeFirstParty: true } } },
      });

      if (maleUser?.source === 'MANUAL_ENTRY') {
        console.log(`  ℹ️ Male is manual user — keeping female as first party`);
        return false;
      }
      if (maleUser?.profile?.wantsToBeFirstParty === false) {
        console.log(`  ℹ️ Male opted out of first party — keeping female as first`);
        return false;
      }
      console.log(`  🔄 Default: male as first party → swapping`);
      return true; // Swap so male becomes first party
    }
  }

  // ========== Main Entry Point ==========

  static async runDailySuggestions(matchmakerId: string): Promise<DailySuggestionResult> {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🌟 [Daily Suggestions] Starting daily suggestion run...');
    console.log(`📅 ${new Date().toISOString()}`);
    console.log(`👤 Matchmaker: ${matchmakerId}`);
    console.log('═══════════════════════════════════════════════════════\n');

    const result: DailySuggestionResult = {
      processed: 0,
      newSuggestionsSent: 0,
      remindersSent: 0,
      skipped: 0,
      errors: 0,
      details: [],
    };

    try {
      // Step 1: Get all eligible users
      const eligibleUsers = await this.getEligibleUsers();
      console.log(`📊 [Daily Suggestions] Found ${eligibleUsers.length} eligible users\n`);

      // Step 3: Load dictionaries once
      const [dictHe, dictEn] = await Promise.all([
        getDictionary('he'),
        getDictionary('en'),
      ]);
      const dictionaries = { he: dictHe.email, en: dictEn.email };

      // Step 4: Process users in parallel batches of 10
      const BATCH_SIZE = 10;
      for (let batchStart = 0; batchStart < eligibleUsers.length; batchStart += BATCH_SIZE) {
        const batch = eligibleUsers.slice(batchStart, batchStart + BATCH_SIZE);
        console.log(`\n--- Processing batch ${Math.floor(batchStart / BATCH_SIZE) + 1} (users ${batchStart + 1}-${batchStart + batch.length}/${eligibleUsers.length}) ---`);

        const batchResults = await Promise.allSettled(
          batch.map(async (user, idx) => {
            const globalIdx = batchStart + idx + 1;
            console.log(`  [${globalIdx}/${eligibleUsers.length}] ${user.firstName} ${user.lastName} (${user.id})`);
            return this.processUser(user, matchmakerId, dictionaries);
          })
        );

        for (let i = 0; i < batchResults.length; i++) {
          const settled = batchResults[i];
          result.processed++;

          if (settled.status === 'fulfilled') {
            const userResult = settled.value;
            result.details.push(userResult);

            switch (userResult.action) {
              case 'new_suggestion':
                result.newSuggestionsSent++;
                console.log(`  ✅ New suggestion sent (Match: ${userResult.matchId})`);
                break;
              case 'reminder':
                result.remindersSent++;
                console.log(`  🔔 Reminder sent for suggestion ${userResult.suggestionId}`);
                break;
              case 'skipped':
                result.skipped++;
                console.log(`  ⏭️  Skipped: ${userResult.reason}`);
                break;
            }
          } else {
            result.errors++;
            result.details.push({
              userId: batch[i].id,
              action: 'error',
              reason: settled.reason instanceof Error ? settled.reason.message : 'Unknown error',
            });
            console.error(`  ❌ Error: ${settled.reason instanceof Error ? settled.reason.message : settled.reason}`);
          }
        }
      }
    } catch (fatalError) {
      console.error('💥 [Daily Suggestions] Fatal error:', fatalError);
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🎉 [Daily Suggestions] Run Complete!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📊 Summary:`);
    console.log(`   Total Processed:    ${result.processed}`);
    console.log(`   ✅ New Suggestions: ${result.newSuggestionsSent}`);
    console.log(`   🔔 Reminders:       ${result.remindersSent}`);
    console.log(`   ⏭️  Skipped:         ${result.skipped}`);
    console.log(`   ❌ Errors:          ${result.errors}`);
    console.log('═══════════════════════════════════════════════════════\n');

    return result;
  }

  // ========== Step 2: Get Eligible Users ==========
  //
  // הערה: הסינון לפי availabilityStatus נעשה בקוד (ולא ב-Prisma where)
  // כי Prisma מייצר טיפוסים לא תואמים כאשר availabilityStatus הוא optional
  // על מודל Profile שהוא relation מ-User.
  //

  private static async getEligibleUsers() {
    const users = await prisma.user.findMany({
      where: {
        source: 'REGISTRATION',
        status: 'ACTIVE',
        isPhoneVerified: true,
        email: { not: '' },
        phone: { not: null },
        role: 'CANDIDATE',
        engagementEmailsConsent: true,
        profile: { isNot: null },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        language: true,
        profile: {
          select: {
            id: true,
            gender: true,
            availabilityStatus: true,
            wantsToBeFirstParty: true, // 🆕 V2.1
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // סינון בקוד: רק מי שזמין
    return users.filter(u => u.profile?.availabilityStatus === 'AVAILABLE');
  }

  // ========== Step 3: Process Individual User ==========

  private static async processUser(
    user: EligibleUser,
    matchmakerId: string,
    dictionaries: { he: EmailDictionary; en: EmailDictionary }
  ): Promise<DailySuggestionResult['details'][number]> {

    // Check 0: Idempotency — skip if user already received an auto-suggestion today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const existingToday = await prisma.matchSuggestion.findFirst({
      where: {
        isAutoSuggestion: true,
        createdAt: { gte: todayStart },
        OR: [
          { firstPartyId: user.id },
          { secondPartyId: user.id },
        ],
      },
      select: { id: true },
    });

    if (existingToday) {
      return {
        userId: user.id,
        action: 'skipped',
        reason: `Idempotency: already received auto-suggestion today (ID: ${existingToday.id})`,
      };
    }

    // Check 1a: Hard block — user has an advanced suggestion (FIRST_PARTY_APPROVED+)
    const hardBlock = await prisma.matchSuggestion.findFirst({
      where: {
        OR: [
          { firstPartyId: user.id },
          { secondPartyId: user.id },
        ],
        status: { in: HARD_BLOCK_STATUSES },
      },
      select: { id: true, status: true },
    });

    if (hardBlock) {
      return {
        userId: user.id,
        action: 'skipped',
        reason: `Hard-blocked: active suggestion at ${hardBlock.status} (ID: ${hardBlock.id})`,
      };
    }

    // Check 1b: Soft block — user has a pending suggestion (reminders handled by suggestion-reminders cron)
    const softBlock = await prisma.matchSuggestion.findFirst({
      where: {
        OR: [
          { firstPartyId: user.id },
          { secondPartyId: user.id },
        ],
        status: { in: SOFT_BLOCK_STATUSES },
      },
      select: { id: true, status: true },
    });

    if (softBlock) {
      return {
        userId: user.id,
        action: 'skipped',
        reason: `Soft-blocked: pending suggestion (${softBlock.status}) - ID: ${softBlock.id}`,
      };
    }

    // Check 2: Find the best match
    const bestMatch = await this.findBestMatch(user);

    if (!bestMatch) {
      return {
        userId: user.id,
        action: 'skipped',
        reason: 'No eligible potential match found with score >= 70',
      };
    }

    // =========================================================================
    // V4.0: Check 3 - Determine party assignment (male as first party by default)
    // =========================================================================
    const swapParties = await this.determinePartySwap(user, bestMatch);

    // Check 4: Create the suggestion (with optional party swap)
    const suggestion = await this.createAutoSuggestion(user, bestMatch, matchmakerId, dictionaries, swapParties);

    return {
      userId: user.id,
      action: 'new_suggestion',
      matchId: bestMatch.id,
      suggestionId: suggestion.id,
    };
  }

  // ========== Find Best Match ==========
  //
  // מחפש את ה-PotentialMatch הטוב ביותר (ציון >= 70) עבור היוזר.
  // הסינון לפי availabilityStatus של הצד השני נעשה בקוד אחרי השליפה.
  //

  private static async findBestMatch(user: EligibleUser) {
    if (!user.profile) return null;

    const isMale = user.profile.gender === 'MALE';

    // V3.0: Other party filter allows manual users (MANUAL_ENTRY with PENDING_EMAIL_VERIFICATION)
    const otherPartyFilter = {
      OR: [
        { status: 'ACTIVE' as const },
        { status: 'PENDING_EMAIL_VERIFICATION' as const, source: 'MANUAL_ENTRY' as const },
      ],
      profile: { is: { isProfileVisible: true } },
    };

    // V3.1: Fetch in pages — if all candidates in a page are blocked, fetch the next page
    const PAGE_SIZE = 15;
    const MAX_PAGES = 3; // Up to 45 candidates total

    for (let page = 0; page < MAX_PAGES; page++) {
    const matches = await prisma.potentialMatch.findMany({
      where: {
        ...(isMale ? { maleUserId: user.id } : { femaleUserId: user.id }),
        status: { in: ['PENDING', 'REVIEWED'] as PotentialMatchStatus[] },
        aiScore: { gte: MIN_AI_SCORE },
        ...(isMale ? { female: otherPartyFilter } : { male: otherPartyFilter }),
      },
      orderBy: { aiScore: 'desc' },
      skip: page * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        maleUserId: true,
        femaleUserId: true,
        aiScore: true,
        shortReasoning: true,
        detailedReasoning: true,
        male: {
          select: { profile: { select: { availabilityStatus: true } } },
        },
        female: {
          select: { profile: { select: { availabilityStatus: true } } },
        },
      },
    });

    if (matches.length === 0) return null;

    // === Batch queries to avoid N+1 ===

    // Collect all candidate pair IDs and other party IDs
    const otherPartyIds = matches.map(m =>
      user.id === m.maleUserId ? m.femaleUserId : m.maleUserId
    );

    // Batch 1: Check existing suggestions between all candidate pairs
    const pairConditions = matches.flatMap(m => [
      { firstPartyId: m.maleUserId, secondPartyId: m.femaleUserId },
      { firstPartyId: m.femaleUserId, secondPartyId: m.maleUserId },
    ]);

    const existingSuggestions = await prisma.matchSuggestion.findMany({
      where: {
        OR: pairConditions,
        status: { notIn: CLOSED_STATUSES },
      },
      select: { firstPartyId: true, secondPartyId: true },
    });

    const blockedPairs = new Set<string>();
    for (const s of existingSuggestions) {
      blockedPairs.add(`${s.firstPartyId}-${s.secondPartyId}`);
      blockedPairs.add(`${s.secondPartyId}-${s.firstPartyId}`);
    }

    // Batch 2: Check hard-blocked other parties + concurrent second party count
    const [hardBlockedSuggestions, concurrentSecondPartyCounts] = await Promise.all([
      prisma.matchSuggestion.findMany({
        where: {
          OR: [
            { firstPartyId: { in: otherPartyIds } },
            { secondPartyId: { in: otherPartyIds } },
          ],
          status: { in: HARD_BLOCK_STATUSES },
        },
        select: { firstPartyId: true, secondPartyId: true },
      }),
      // Count how many PENDING auto-suggestions each other party is already second party in
      prisma.matchSuggestion.groupBy({
        by: ['secondPartyId'],
        where: {
          secondPartyId: { in: otherPartyIds },
          isAutoSuggestion: true,
          status: { in: SOFT_BLOCK_STATUSES },
        },
        _count: { id: true },
      }),
    ]);

    const hardBlockedOtherPartyIds = new Set<string>();
    for (const s of hardBlockedSuggestions) {
      if (otherPartyIds.includes(s.firstPartyId)) hardBlockedOtherPartyIds.add(s.firstPartyId);
      if (otherPartyIds.includes(s.secondPartyId)) hardBlockedOtherPartyIds.add(s.secondPartyId);
    }

    const concurrentCountMap = new Map<string, number>();
    for (const g of concurrentSecondPartyCounts) {
      concurrentCountMap.set(g.secondPartyId, g._count.id);
    }

    // === Filter matches using batch results ===
    const validMatches: {
      id: string;
      maleUserId: string;
      femaleUserId: string;
      aiScore: number;
      shortReasoning: string | null;
      detailedReasoning: string | null;
    }[] = [];

    for (const match of matches) {
      const otherPartyId = user.id === match.maleUserId ? match.femaleUserId : match.maleUserId;

      // Check availabilityStatus of other party (AVAILABLE or null for manual users without explicit status)
      const otherPartyProfile = isMale ? match.female?.profile : match.male?.profile;
      const avStatus = otherPartyProfile?.availabilityStatus;
      if (avStatus && avStatus !== 'AVAILABLE') {
        continue;
      }

      // Check existing suggestion between the pair
      const pairKey = `${match.maleUserId}-${match.femaleUserId}`;
      if (blockedPairs.has(pairKey)) {
        await this.logSkippedMatch({ userId: user.id, otherPartyId, potentialMatchId: match.id, aiScore: match.aiScore, skipReason: 'existing_suggestion' });
        console.log(`  ⚠️ Existing suggestion between pair, trying next...`);
        continue;
      }

      // Check hard block on other party
      if (hardBlockedOtherPartyIds.has(otherPartyId)) {
        await this.logSkippedMatch({ userId: user.id, otherPartyId, potentialMatchId: match.id, aiScore: match.aiScore, skipReason: 'other_party_hard_blocked' });
        console.log(`  ⚠️ Other party (${otherPartyId}) hard-blocked, trying next...`);
        continue;
      }

      // Check concurrent second party limit
      const currentConcurrent = concurrentCountMap.get(otherPartyId) || 0;
      if (currentConcurrent >= MAX_CONCURRENT_AS_SECOND_PARTY) {
        await this.logSkippedMatch({ userId: user.id, otherPartyId, potentialMatchId: match.id, aiScore: match.aiScore, skipReason: 'concurrent_limit', skipDetails: `Already in ${currentConcurrent} pending auto-suggestions as second party` });
        console.log(`  ⚠️ Other party (${otherPartyId}) at concurrent limit (${currentConcurrent}/${MAX_CONCURRENT_AS_SECOND_PARTY}), trying next...`);
        continue;
      }

      validMatches.push({
        id: match.id,
        maleUserId: match.maleUserId,
        femaleUserId: match.femaleUserId,
        aiScore: match.aiScore,
        shortReasoning: match.shortReasoning,
        detailedReasoning: match.detailedReasoning,
      });
    }

    // If we found valid matches in this page, apply re-ranking and return
    if (validMatches.length > 0) {
      // Apply feedback-based re-ranking if user has enough feedback
      try {
        const reranked = await AutoSuggestionFeedbackService.applyFeedbackReranking(validMatches, user.id);
        console.log(`  📊 Feedback re-ranking applied for ${user.id}: ${reranked.length} valid matches`);
        return reranked[0];
      } catch (err) {
        console.error(`  ⚠️ Feedback re-ranking failed, using original order:`, err);
        return validMatches[0];
      }
    }

    // All candidates in this page were blocked — try next page
    if (matches.length < PAGE_SIZE) {
      // No more candidates to fetch
      return null;
    }
    console.log(`  📄 All ${PAGE_SIZE} candidates on page ${page + 1} were blocked, fetching next page...`);
    } // end pagination loop

    return null;
  }

  // ========== Log Skipped Match ==========

  private static async logSkippedMatch(params: {
    userId: string;
    otherPartyId: string;
    potentialMatchId?: string;
    aiScore?: number;
    skipReason: string;
    skipDetails?: string;
  }): Promise<void> {
    try {
      await prisma.skippedAutoSuggestion.create({
        data: {
          userId: params.userId,
          otherPartyId: params.otherPartyId,
          potentialMatchId: params.potentialMatchId,
          aiScore: params.aiScore,
          skipReason: params.skipReason,
          skipDetails: params.skipDetails,
        },
      });
    } catch (err) {
      // Non-critical — log and continue
      console.error(`[SkippedLog] Failed to log skip:`, err);
    }
  }

  // ========== Create Auto Suggestion ==========

  private static async createAutoSuggestion(
    user: EligibleUser,
    match: {
      id: string;
      maleUserId: string;
      femaleUserId: string;
      aiScore: number;
      shortReasoning: string | null;
      detailedReasoning: string | null;
    },
    matchmakerId: string,
    dictionaries: { he: EmailDictionary; en: EmailDictionary },
    swapParties: boolean = false // 🆕 V2.1: אם true — מחליפים צד ראשון ושני
  ) {
    // =========================================================================
    // 🆕 V2.1: Determine party assignment (with optional swap)
    // =========================================================================
    const defaultFirstPartyId = user.id;
    const defaultSecondPartyId = user.id === match.maleUserId ? match.femaleUserId : match.maleUserId;

    const firstPartyId = swapParties ? defaultSecondPartyId : defaultFirstPartyId;
    const secondPartyId = swapParties ? defaultFirstPartyId : defaultSecondPartyId;

    const decisionDeadline = new Date();
    decisionDeadline.setDate(decisionDeadline.getDate() + DECISION_DEADLINE_DAYS);

    // 🆕 V2.1: Get first party's language for the notes text
    // If swapped, we need to fetch the actual first party's language
    let noteLocale: 'he' | 'en' = (user.language as 'he' | 'en') || 'he';
    if (swapParties) {
      const firstPartyUser = await prisma.user.findUnique({
        where: { id: firstPartyId },
        select: { language: true },
      });
      noteLocale = (firstPartyUser?.language as 'he' | 'en') || 'he';
    }

    const suggestion = await prisma.$transaction(async (tx) => {
      const newSuggestion = await tx.matchSuggestion.create({
        data: {
          matchmakerId,
          isAutoSuggestion: true,
          firstPartyId,
          secondPartyId,
          status: 'PENDING_FIRST_PARTY',
          priority: 'MEDIUM',
          matchingReason: match.shortReasoning || `התאמת AI - ציון ${Math.round(match.aiScore)}`,
          firstPartyNotes: noteLocale === 'he'
            ? 'הצעה זו נבחרה על סמך ניתוח מעמיק של הפרופיל שלך, תשובותיך לשאלון, והעדפותיך. המערכת שלנו למדה מאלפי התאמות כדי למצוא את ההצעה הכי מתאימה עבורך.'
            : 'This match was selected based on a deep analysis of your profile, questionnaire responses, and preferences. Our system has learned from thousands of matches to find the best fit for you.',
          secondPartyNotes: null,
          // 🆕 V2.1: Internal notes include swap info
          internalNotes: `הצעה יומית אוטומטית | PotentialMatch: ${match.id} | Score: ${match.aiScore}${swapParties ? ' | 🔄 Parties Swapped (wantsToBeFirstParty preference)' : ''}`,
          decisionDeadline,
          firstPartySent: new Date(),
          lastActivity: new Date(),
          lastStatusChange: new Date(),
        },
        include: {
          firstParty: { include: { profile: true } },
          secondParty: { include: { profile: true } },
          matchmaker: true,
        },
      });

      await tx.suggestionStatusHistory.create({
        data: {
          suggestionId: newSuggestion.id,
          status: 'PENDING_FIRST_PARTY',
          notes: swapParties
            ? 'הצעה יומית אוטומטית - הצדדים הוחלפו (העדפת משתמש) - נשלחה לצד הראשון'
            : 'הצעה יומית אוטומטית - נשלחה לצד הראשון',
        },
      });

      await tx.potentialMatch.update({
        where: { id: match.id },
        data: {
          status: 'SENT' as PotentialMatchStatus,
          sentAt: new Date(),
          suggestionId: newSuggestion.id,
        },
      });

      return newSuggestion;
    });

    // Send notification to the first party (non-blocking)
    const firstPartyLang = ((suggestion.firstParty as any).language || 'he') as 'he' | 'en';
    const secondPartyLang = ((suggestion.secondParty as any).language || 'he') as 'he' | 'en';

    try {
      const notificationService = initNotificationService();

      // Generate opt-out URLs for the email footer
      const firstPartyEmail = suggestion.firstParty.email;
      const optOutUrls = await this.generateOptOutUrls(firstPartyId, firstPartyEmail, firstPartyLang);

      await notificationService.handleSuggestionStatusChange(
        suggestion,
        dictionaries,
        {
          channels: ['email', 'whatsapp'],
          notifyParties: ['first'],
          optOutUrls,
        },
        {
          firstParty: firstPartyLang,
          secondParty: secondPartyLang,
          matchmaker: 'he',
        }
      );

      console.log(`  📨 Notification sent for suggestion ${suggestion.id}${swapParties ? ' (parties swapped)' : ''}`);
    } catch (notifError) {
      console.error(`  ⚠️ Failed to send notification for suggestion ${suggestion.id}:`, notifError);
    }

    // Send push notification to first party's mobile devices (non-blocking)
    void sendPushToUser(firstPartyId, {
      title: firstPartyLang === 'he' ? '💌 הצעת שידוך חדשה!' : '💌 New match suggestion!',
      body: firstPartyLang === 'he'
        ? 'קיבלת הצעת שידוך שנבחרה במיוחד עבורך. היכנס/י לצפייה'
        : 'You received a specially selected match. Tap to view',
      data: {
        type: 'AUTO_SUGGESTION',
        suggestionId: suggestion.id,
        screen: 'suggestions',
      },
    }).catch(err => console.error(`  ⚠️ Push notification failed for ${firstPartyId}:`, err));

    return suggestion;
  }

  // ==========================================================================
  // ===== Generate Opt-Out URLs for email footer =====
  // ==========================================================================

  private static async generateOptOutUrls(
    userId: string,
    email: string,
    locale: 'he' | 'en'
  ): Promise<{ optOutFirstPartyUrl: string; unsubscribeUrl: string }> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const secretStr = process.env.NEXTAUTH_SECRET;

    if (!secretStr) {
      console.warn('[DailySuggestions] NEXTAUTH_SECRET not set, skipping opt-out URL generation');
      return { optOutFirstPartyUrl: '', unsubscribeUrl: '' };
    }

    const secret = new TextEncoder().encode(secretStr);

    // Token for opting out of being first party
    const optOutToken = await new SignJWT({ userId, email, action: 'opt-out-first-party' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('90d')
      .sign(secret);

    // Token for unsubscribing from all engagement emails
    const unsubToken = await new SignJWT({ userId, email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('90d')
      .sign(secret);

    return {
      optOutFirstPartyUrl: `${baseUrl}/${locale}/opt-out-first-party?token=${optOutToken}`,
      unsubscribeUrl: `${baseUrl}/${locale}/unsubscribe?token=${unsubToken}`,
    };
  }

  // ==========================================================================
  // ===== מצב אישי - הרצה על יוזר ספציפי עם N הצעות =====
  // ==========================================================================

  /**
   * שולח N הצעות יומיות ליוזר ספציפי.
   * מתעלם מהמגבלה של "הצעה אחת בו-זמנית" — מיועד להרצה ידנית ע"י שדכן.
   * 
   * 🆕 V2.1: Supports wantsToBeFirstParty — swaps parties or skips if both opted out.
   * 
   * @param userId - ID של היוזר
   * @param count - כמה הצעות לשלוח (ברירת מחדל: 1)
   * @param matchmakerId - ID של השדכן שמריץ
   */
  static async runForSpecificUser(
    userId: string,
    count: number = 1,
    matchmakerId: string,
    options?: { matchIds?: string[] }
  ): Promise<{
    success: boolean;
    userId: string;
    userName: string;
    requested: number;
    sent: number;
    suggestions: { suggestionId: string; matchId: string; aiScore: number; otherPartyName: string }[];
    skipped: string[];
    errors: string[];
    steps: { timestamp: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }[];
  }> {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`🎯 [Personal Mode] Running for user ${userId} — ${count} suggestions`);
    console.log('═══════════════════════════════════════════════════════\n');

    const steps: { timestamp: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }[] = [];
    const addStep = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
      steps.push({ timestamp: new Date().toISOString(), message, type });
    };

    const result = {
      success: false,
      userId,
      userName: '',
      requested: count,
      sent: 0,
      suggestions: [] as { suggestionId: string; matchId: string; aiScore: number; otherPartyName: string }[],
      skipped: [] as string[],
      errors: [] as string[],
      steps,
    };

    try {
      addStep('טוען פרופיל משתמש...');
      // 1. Fetch the user with profile
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          language: true,
          status: true,
          profile: {
            select: {
              id: true,
              gender: true,
              availabilityStatus: true,
              wantsToBeFirstParty: true, // 🆕 V2.1
            },
          },
        },
      });

      if (!user) {
        addStep('המשתמש לא נמצא', 'error');
        result.errors.push(`User not found: ${userId}`);
        return result;
      }

      result.userName = `${user.firstName} ${user.lastName}`;
      addStep(`נמצא: ${user.firstName} ${user.lastName} (${user.profile?.gender || 'N/A'})`, 'success');

      if (!user.profile) {
        addStep('למשתמש אין פרופיל', 'error');
        result.errors.push('User has no profile');
        return result;
      }

      console.log(`👤 User: ${user.firstName} ${user.lastName} (${user.profile.gender})`);
      console.log(`📧 Email: ${user.email}`);
      console.log(`📊 Requesting ${count} suggestions\n`);

      // 3. Load dictionaries
      addStep('טוען תבניות הודעות...');
      const [dictHe, dictEn] = await Promise.all([
        getDictionary('he'),
        getDictionary('en'),
      ]);
      const dictionaries = { he: dictHe.email, en: dictEn.email };

      // V4.0: If specific matchIds provided, use them instead of auto-finding
      let topMatches: Awaited<ReturnType<typeof this.findTopMatches>>;

      if (options?.matchIds && options.matchIds.length > 0) {
        addStep(`טוען ${options.matchIds.length} התאמות שנבחרו ידנית...`);
        const specificMatches = await prisma.potentialMatch.findMany({
          where: {
            id: { in: options.matchIds },
            status: { in: ['PENDING', 'REVIEWED'] as PotentialMatchStatus[] },
          },
          select: {
            id: true,
            maleUserId: true,
            femaleUserId: true,
            aiScore: true,
            shortReasoning: true,
            detailedReasoning: true,
          },
          orderBy: { aiScore: 'desc' },
        });
        topMatches = specificMatches;
        addStep(`נטענו ${specificMatches.length} התאמות ידניות`, specificMatches.length > 0 ? 'success' : 'warning');
      } else {
        // 4. Find top N matches (skipping blocking checks for THIS user)
        addStep(`מחפש ${count} התאמות מובילות...`);
        topMatches = await this.findTopMatches(user, count);
      }

      if (topMatches.length === 0) {
        addStep('לא נמצאו התאמות זמינות עם ציון >= 70', 'warning');
        result.skipped.push('No eligible potential matches found with score >= 70');
        console.log('  ⚠️ No eligible matches found');
        return result;
      }

      addStep(`נמצאו ${topMatches.length} התאמות (מתוך ${count} שנדרשו)`, 'success');
      console.log(`  📋 Found ${topMatches.length} eligible matches (requested ${count})\n`);

      // 5. Create suggestions for each match
      for (let i = 0; i < topMatches.length; i++) {
        const match = topMatches[i];
        const otherPartyId = user.id === match.maleUserId ? match.femaleUserId : match.maleUserId;

        addStep(`יוצר הצעה ${i + 1}/${topMatches.length} — ציון ${Math.round(match.aiScore)}...`);
        console.log(`  [${i + 1}/${topMatches.length}] Creating suggestion — Score: ${Math.round(match.aiScore)}, Other: ${otherPartyId}`);

        try {
          // V4.0: Male as first party by default
          const swapParties = await this.determinePartySwap(user, match);
          if (swapParties) addStep('מחליף צדדים — גבר כצד ראשון');

          const suggestion = await this.createAutoSuggestion(user, match, matchmakerId, dictionaries, swapParties);
          addStep(`הצעה נוצרה בהצלחה (${suggestion.id})`, 'success');

          // Get other party name for the result
          const otherParty = await prisma.user.findUnique({
            where: { id: otherPartyId },
            select: { firstName: true, lastName: true },
          });

          const otherName = otherParty ? `${otherParty.firstName} ${otherParty.lastName}` : otherPartyId;
          addStep(`נשלחו נוטיפיקציות — אימייל + WhatsApp + Push ל-${otherName}`, 'success');

          result.suggestions.push({
            suggestionId: suggestion.id,
            matchId: match.id,
            aiScore: match.aiScore,
            otherPartyName: otherName,
          });
          result.sent++;

          console.log(`  ✅ Suggestion created: ${suggestion.id}${swapParties ? ' (parties swapped)' : ''}`);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Unknown error';
          addStep(`שגיאה ביצירת הצעה: ${errMsg}`, 'error');
          result.errors.push(`Match ${match.id}: ${errMsg}`);
          console.error(`  ❌ Error creating suggestion for match ${match.id}: ${errMsg}`);
        }
      }

      result.success = result.sent > 0;
      addStep(`סיום — נשלחו ${result.sent} מתוך ${count} הצעות`, result.sent > 0 ? 'success' : 'warning');

      console.log(`\n🎯 [Personal Mode] Done: ${result.sent}/${count} sent`);
      return result;

    } catch (fatalError) {
      const errMsg = fatalError instanceof Error ? fatalError.message : 'Unknown error';
      addStep(`שגיאה קריטית: ${errMsg}`, 'error');
      result.errors.push(errMsg);
      console.error('💥 [Personal Mode] Fatal error:', fatalError);
      return result;
    }
  }

  // ========== Find Top N Matches (for personal mode) ==========
  //
  // כמו findBestMatch אבל מחזיר N תוצאות.
  // מתעלם מהצעות חוסמות של היוזר עצמו (כי זה מצב אישי).
  // עדיין בודק: הצד השני זמין, אין הצעה קיימת בין השניים.
  //

  private static async findTopMatches(
    user: { id: string; profile: { gender: string } | null },
    count: number,
    options?: { scanMethod?: string; scanAfter?: string }
  ) {
    if (!user.profile) return [];

    const isMale = user.profile.gender === 'MALE';

    // שליפת יותר התאמות כי חלק יסוננו
    const fetchCount = Math.max(count * 3, 20);

    const matches = await prisma.potentialMatch.findMany({
      where: {
        ...(isMale ? { maleUserId: user.id } : { femaleUserId: user.id }),
        status: { in: ['PENDING', 'REVIEWED'] as PotentialMatchStatus[] },
        aiScore: { gte: MIN_AI_SCORE },
        // Filter by scan method
        ...(options?.scanMethod ? { lastScanMethod: options.scanMethod } : {}),
        // Filter by scan date
        ...(options?.scanAfter ? { scannedAt: { gte: new Date(options.scanAfter) } } : {}),
        // V3.0: Allow manual users as other party
        ...(isMale
          ? {
              female: {
                OR: [
                  { status: 'ACTIVE' },
                  { status: 'PENDING_EMAIL_VERIFICATION', source: 'MANUAL_ENTRY' },
                ],
                profile: { is: { isProfileVisible: true } },
              },
            }
          : {
              male: {
                OR: [
                  { status: 'ACTIVE' },
                  { status: 'PENDING_EMAIL_VERIFICATION', source: 'MANUAL_ENTRY' },
                ],
                profile: { is: { isProfileVisible: true } },
              },
            }),
      },
      orderBy: { aiScore: 'desc' },
      take: fetchCount,
      select: {
        id: true,
        maleUserId: true,
        femaleUserId: true,
        aiScore: true,
        shortReasoning: true,
        detailedReasoning: true,
        male: {
          select: { profile: { select: { availabilityStatus: true } } },
        },
        female: {
          select: { profile: { select: { availabilityStatus: true } } },
        },
      },
    });

    if (matches.length === 0) return [];

    // Batch query: check existing suggestions for all candidate pairs
    const pairConditions = matches.flatMap(m => [
      { firstPartyId: m.maleUserId, secondPartyId: m.femaleUserId },
      { firstPartyId: m.femaleUserId, secondPartyId: m.maleUserId },
    ]);

    const existingSuggestions = await prisma.matchSuggestion.findMany({
      where: { OR: pairConditions, status: { notIn: CLOSED_STATUSES } },
      select: { firstPartyId: true, secondPartyId: true },
    });

    const blockedPairs = new Set<string>();
    for (const s of existingSuggestions) {
      blockedPairs.add(`${s.firstPartyId}-${s.secondPartyId}`);
      blockedPairs.add(`${s.secondPartyId}-${s.firstPartyId}`);
    }

    const validMatches: {
      id: string;
      maleUserId: string;
      femaleUserId: string;
      aiScore: number;
      shortReasoning: string | null;
      detailedReasoning: string | null;
    }[] = [];

    for (const match of matches) {
      if (validMatches.length >= count) break;

      // Check availabilityStatus (AVAILABLE or null for manual users)
      const otherPartyProfile = isMale ? match.female?.profile : match.male?.profile;
      const avStatus = otherPartyProfile?.availabilityStatus;
      if (avStatus && avStatus !== 'AVAILABLE') {
        continue;
      }

      // Check existing suggestion between the pair
      const pairKey = `${match.maleUserId}-${match.femaleUserId}`;
      if (blockedPairs.has(pairKey)) {
        console.log(`  ⚠️ Existing suggestion between ${match.maleUserId} & ${match.femaleUserId}, skipping`);
        continue;
      }

      validMatches.push({
        id: match.id,
        maleUserId: match.maleUserId,
        femaleUserId: match.femaleUserId,
        aiScore: match.aiScore,
        shortReasoning: match.shortReasoning,
        detailedReasoning: match.detailedReasoning,
      });
    }

    return validMatches;
  }

  // ==========================================================================
  // ===== V4.0: Get ALL matches for a specific user (paginated) =====
  // ==========================================================================

  /**
   * Returns all available PotentialMatches for a user with pagination.
   * Used by the expanded match picker in PreviewSuggestionsPanel.
   * Includes previousSuggestion info (badge "sent before").
   */
  static async getAllMatchesForUser(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      minScore?: number;
      sortBy?: 'score' | 'age' | 'city';
    }
  ): Promise<{
    matches: PreviewMatch[];
    total: number;
    hasMore: boolean;
  }> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const minScore = options?.minScore ?? MIN_AI_SCORE;
    const skip = (page - 1) * limit;

    // Fetch the user to determine gender
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profile: { select: { gender: true, wantsToBeFirstParty: true } },
      },
    });

    if (!user?.profile) {
      return { matches: [], total: 0, hasMore: false };
    }

    const isMale = user.profile.gender === 'MALE';

    // Count total
    const total = await prisma.potentialMatch.count({
      where: {
        ...(isMale ? { maleUserId: userId } : { femaleUserId: userId }),
        status: { in: ['PENDING', 'REVIEWED'] as PotentialMatchStatus[] },
        aiScore: { gte: minScore },
        ...(isMale
          ? {
              female: {
                OR: [
                  { status: 'ACTIVE' },
                  { status: 'PENDING_EMAIL_VERIFICATION', source: 'MANUAL_ENTRY' },
                ],
                profile: { is: { isProfileVisible: true } },
              },
            }
          : {
              male: {
                OR: [
                  { status: 'ACTIVE' },
                  { status: 'PENDING_EMAIL_VERIFICATION', source: 'MANUAL_ENTRY' },
                ],
                profile: { is: { isProfileVisible: true } },
              },
            }),
      },
    });

    // Fetch matches with pagination
    const rawMatches = await prisma.potentialMatch.findMany({
      where: {
        ...(isMale ? { maleUserId: userId } : { femaleUserId: userId }),
        status: { in: ['PENDING', 'REVIEWED'] as PotentialMatchStatus[] },
        aiScore: { gte: minScore },
        ...(isMale
          ? {
              female: {
                OR: [
                  { status: 'ACTIVE' },
                  { status: 'PENDING_EMAIL_VERIFICATION', source: 'MANUAL_ENTRY' },
                ],
                profile: { is: { isProfileVisible: true } },
              },
            }
          : {
              male: {
                OR: [
                  { status: 'ACTIVE' },
                  { status: 'PENDING_EMAIL_VERIFICATION', source: 'MANUAL_ENTRY' },
                ],
                profile: { is: { isProfileVisible: true } },
              },
            }),
      },
      orderBy: { aiScore: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        maleUserId: true,
        femaleUserId: true,
        aiScore: true,
        shortReasoning: true,
        male: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: {
              select: {
                gender: true,
                city: true,
                birthDate: true,
                religiousLevel: true,
                availabilityStatus: true,
                wantsToBeFirstParty: true,
              },
            },
            images: { where: { isMain: true }, select: { url: true }, take: 1 },
          },
        },
        female: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: {
              select: {
                gender: true,
                city: true,
                birthDate: true,
                religiousLevel: true,
                availabilityStatus: true,
                wantsToBeFirstParty: true,
              },
            },
            images: { where: { isMain: true }, select: { url: true }, take: 1 },
          },
        },
      },
    });

    // Check for blocked pairs (existing active suggestions)
    const blockedPairs = new Set<string>();
    const previousSuggestionMap = new Map<string, { status: string; createdAt: Date }>();

    if (rawMatches.length > 0) {
      const pairConditions = rawMatches.flatMap(m => [
        { firstPartyId: m.maleUserId, secondPartyId: m.femaleUserId },
        { firstPartyId: m.femaleUserId, secondPartyId: m.maleUserId },
      ]);

      const existingSuggestions = await prisma.matchSuggestion.findMany({
        where: { OR: pairConditions, status: { notIn: CLOSED_STATUSES } },
        select: { firstPartyId: true, secondPartyId: true },
      });

      for (const s of existingSuggestions) {
        blockedPairs.add(`${s.firstPartyId}-${s.secondPartyId}`);
        blockedPairs.add(`${s.secondPartyId}-${s.firstPartyId}`);
      }

      // Also get previous (closed) suggestions for badge "sent before"
      const closedSuggestions = await prisma.matchSuggestion.findMany({
        where: { OR: pairConditions, status: { in: CLOSED_STATUSES } },
        select: { firstPartyId: true, secondPartyId: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });

      for (const s of closedSuggestions) {
        const key = `${s.firstPartyId}-${s.secondPartyId}`;
        const reverseKey = `${s.secondPartyId}-${s.firstPartyId}`;
        if (!previousSuggestionMap.has(key)) previousSuggestionMap.set(key, { status: s.status, createdAt: s.createdAt });
        if (!previousSuggestionMap.has(reverseKey)) previousSuggestionMap.set(reverseKey, { status: s.status, createdAt: s.createdAt });
      }
    }

    // Build the response
    const matches: PreviewMatch[] = [];
    for (const match of rawMatches) {
      const pairKey = `${match.maleUserId}-${match.femaleUserId}`;
      // Skip blocked pairs (active suggestion exists)
      if (blockedPairs.has(pairKey)) continue;

      const otherPartyUser = isMale ? match.female : match.male;
      const otherAvStatus = otherPartyUser?.profile?.availabilityStatus;
      // Skip unavailable other parties (except manual users who may have null)
      if (otherAvStatus && otherAvStatus !== 'AVAILABLE') continue;

      // Determine party direction
      const maleUser = match.male;
      const femaleUser = match.female;
      const maleWantsFirst = maleUser?.profile?.wantsToBeFirstParty ?? true;
      const firstPartyGender: 'MALE' | 'FEMALE' = maleWantsFirst ? 'MALE' : 'FEMALE';

      // Previous suggestion lookup
      const prevSuggestion = previousSuggestionMap.get(pairKey) || null;

      matches.push({
        matchId: match.id,
        aiScore: match.aiScore,
        shortReasoning: match.shortReasoning,
        partyDirection: {
          firstPartyGender,
          firstPartyName: firstPartyGender === 'MALE'
            ? `${maleUser?.firstName || ''} ${maleUser?.lastName || ''}`
            : `${femaleUser?.firstName || ''} ${femaleUser?.lastName || ''}`,
          secondPartyName: firstPartyGender === 'MALE'
            ? `${femaleUser?.firstName || ''} ${femaleUser?.lastName || ''}`
            : `${maleUser?.firstName || ''} ${maleUser?.lastName || ''}`,
        },
        previousSuggestion: prevSuggestion
          ? { status: prevSuggestion.status, createdAt: prevSuggestion.createdAt.toISOString() }
          : null,
        otherParty: {
          id: otherPartyUser?.id || '',
          firstName: otherPartyUser?.firstName || '',
          lastName: otherPartyUser?.lastName || '',
          gender: otherPartyUser?.profile?.gender || null,
          city: otherPartyUser?.profile?.city || null,
          birthDate: otherPartyUser?.profile?.birthDate?.toISOString() || null,
          religiousLevel: otherPartyUser?.profile?.religiousLevel || null,
          mainImage: otherPartyUser?.images?.[0]?.url || null,
        },
      });
    }

    return {
      matches,
      total,
      hasMore: skip + limit < total,
    };
  }

  // ==========================================================================
  // ===== V4.0: Pre-flight Eligibility Check =====
  // ==========================================================================

  /**
   * Checks if a user is eligible for auto-suggestions without creating anything.
   * Returns detailed checklist for the matchmaker dashboard.
   */
  static async checkEligibility(userId: string): Promise<{
    eligible: boolean;
    checks: {
      name: string;
      label: string;
      passed: boolean;
      detail: string;
    }[];
    availableMatches: number;
    bestScore: number | null;
  }> {
    const checks: { name: string; label: string; passed: boolean; detail: string }[] = [];

    // 1. User exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        isPhoneVerified: true,
        isProfileComplete: true,
        engagementEmailsConsent: true,
        source: true,
        role: true,
        profile: {
          select: {
            gender: true,
            isProfileVisible: true,
            availabilityStatus: true,
          },
        },
      },
    });

    if (!user) {
      checks.push({ name: 'user_exists', label: 'משתמש קיים', passed: false, detail: 'המשתמש לא נמצא במערכת' });
      return { eligible: false, checks, availableMatches: 0, bestScore: null };
    }

    checks.push({ name: 'user_exists', label: 'משתמש קיים', passed: true, detail: `${user.firstName} ${user.lastName}` });

    // 2. Has profile
    const hasProfile = !!user.profile;
    checks.push({
      name: 'has_profile',
      label: 'פרופיל קיים',
      passed: hasProfile,
      detail: hasProfile ? 'פרופיל קיים' : 'חסר פרופיל — צריך להשלים רישום',
    });

    // 3. Profile complete
    const profileComplete = user.isProfileComplete === true;
    checks.push({
      name: 'profile_complete',
      label: 'פרופיל מלא',
      passed: profileComplete,
      detail: profileComplete ? 'הפרופיל מלא' : 'הפרופיל לא הושלם',
    });

    // 4. Phone verified
    checks.push({
      name: 'phone_verified',
      label: 'טלפון מאומת',
      passed: user.isPhoneVerified,
      detail: user.isPhoneVerified ? 'טלפון מאומת' : 'חסר אימות טלפון',
    });

    // 5. Availability
    const isAvailable = user.profile?.availabilityStatus === 'AVAILABLE';
    checks.push({
      name: 'available',
      label: 'זמין להצעות',
      passed: isAvailable,
      detail: isAvailable ? 'זמין' : `סטטוס: ${user.profile?.availabilityStatus || 'לא ידוע'}`,
    });

    // 6. Consent
    checks.push({
      name: 'consent',
      label: 'הסכמה למיילים',
      passed: user.engagementEmailsConsent,
      detail: user.engagementEmailsConsent ? 'מאושר' : 'המשתמש ביטל הסכמה למיילים',
    });

    // 7. Hard block check
    const hardBlock = await prisma.matchSuggestion.findFirst({
      where: {
        OR: [
          { firstPartyId: userId, status: { in: HARD_BLOCK_STATUSES } },
          { secondPartyId: userId, status: { in: HARD_BLOCK_STATUSES } },
        ],
      },
      select: { id: true, status: true },
    });
    checks.push({
      name: 'no_hard_block',
      label: 'אין חסימה קשה',
      passed: !hardBlock,
      detail: hardBlock
        ? `חסום — הצעה פעילה בסטטוס ${hardBlock.status} (${hardBlock.id})`
        : 'אין הצעות פעילות חוסמות',
    });

    // 8. Soft block check
    const softBlock = await prisma.matchSuggestion.findFirst({
      where: {
        OR: [
          { firstPartyId: userId, status: { in: SOFT_BLOCK_STATUSES } },
          { secondPartyId: userId, status: { in: SOFT_BLOCK_STATUSES } },
        ],
      },
      select: { id: true, status: true },
    });
    checks.push({
      name: 'no_soft_block',
      label: 'אין הצעה ממתינה',
      passed: !softBlock,
      detail: softBlock
        ? `הצעה ממתינה בסטטוס ${softBlock.status} (${softBlock.id})`
        : 'אין הצעות ממתינות',
    });

    // 9. Idempotency check
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const existingToday = await prisma.matchSuggestion.findFirst({
      where: {
        isAutoSuggestion: true,
        createdAt: { gte: todayStart },
        OR: [{ firstPartyId: userId }, { secondPartyId: userId }],
      },
      select: { id: true },
    });
    checks.push({
      name: 'not_sent_today',
      label: 'לא נשלח היום',
      passed: !existingToday,
      detail: existingToday
        ? `כבר קיבל הצעה אוטומטית היום (${existingToday.id})`
        : 'טרם קיבל הצעה היום',
    });

    // 10. Available matches
    const isMale = user.profile?.gender === 'MALE';
    const matchCount = hasProfile ? await prisma.potentialMatch.count({
      where: {
        ...(isMale ? { maleUserId: userId } : { femaleUserId: userId }),
        status: { in: ['PENDING', 'REVIEWED'] as PotentialMatchStatus[] },
        aiScore: { gte: MIN_AI_SCORE },
      },
    }) : 0;

    const bestMatch = hasProfile ? await prisma.potentialMatch.findFirst({
      where: {
        ...(isMale ? { maleUserId: userId } : { femaleUserId: userId }),
        status: { in: ['PENDING', 'REVIEWED'] as PotentialMatchStatus[] },
        aiScore: { gte: MIN_AI_SCORE },
      },
      orderBy: { aiScore: 'desc' },
      select: { aiScore: true },
    }) : null;

    checks.push({
      name: 'has_matches',
      label: 'התאמות זמינות',
      passed: matchCount > 0,
      detail: matchCount > 0
        ? `${matchCount} התאמות זמינות (ציון מקסימלי: ${Math.round(bestMatch?.aiScore || 0)})`
        : 'אין התאמות עם ציון >= 70',
    });

    const eligible = checks.every(c => c.passed);

    return {
      eligible,
      checks,
      availableMatches: matchCount,
      bestScore: bestMatch?.aiScore || null,
    };
  }

  // ==========================================================================
  // ===== Review Mode - Create DRAFT suggestions for matchmaker review =====
  // ==========================================================================

  /**
   * Creates auto-suggestions as DRAFT status, requiring matchmaker approval
   * before they are sent to users. Returns the created draft suggestions.
   */
  static async createDraftSuggestions(matchmakerId: string): Promise<{
    processed: number;
    draftsCreated: number;
    skipped: number;
    errors: number;
    drafts: { suggestionId: string; userId: string; userName: string; otherPartyName: string; aiScore: number }[];
  }> {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📝 [Review Mode] Creating draft suggestions for review...');
    console.log('═══════════════════════════════════════════════════════\n');

    const result = {
      processed: 0,
      draftsCreated: 0,
      skipped: 0,
      errors: 0,
      drafts: [] as { suggestionId: string; userId: string; userName: string; otherPartyName: string; aiScore: number }[],
    };

    const eligibleUsers = await this.getEligibleUsers();
    console.log(`📊 Found ${eligibleUsers.length} eligible users\n`);

    for (const user of eligibleUsers) {
      result.processed++;

      try {
        // Same blocking checks as processUser
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [existingToday, hardBlock, softBlock] = await Promise.all([
          prisma.matchSuggestion.findFirst({
            where: {
              isAutoSuggestion: true,
              createdAt: { gte: todayStart },
              OR: [{ firstPartyId: user.id }, { secondPartyId: user.id }],
            },
            select: { id: true },
          }),
          prisma.matchSuggestion.findFirst({
            where: {
              OR: [{ firstPartyId: user.id }, { secondPartyId: user.id }],
              status: { in: HARD_BLOCK_STATUSES },
            },
            select: { id: true },
          }),
          prisma.matchSuggestion.findFirst({
            where: {
              OR: [{ firstPartyId: user.id }, { secondPartyId: user.id }],
              status: { in: SOFT_BLOCK_STATUSES },
            },
            select: { id: true },
          }),
        ]);

        if (existingToday || hardBlock || softBlock) {
          result.skipped++;
          continue;
        }

        const bestMatch = await this.findBestMatch(user);
        if (!bestMatch) {
          result.skipped++;
          continue;
        }

        const otherPartyId = user.id === bestMatch.maleUserId ? bestMatch.femaleUserId : bestMatch.maleUserId;

        // Create as DRAFT — no notifications sent
        const suggestion = await prisma.matchSuggestion.create({
          data: {
            matchmakerId,
            isAutoSuggestion: true,
            firstPartyId: user.id,
            secondPartyId: otherPartyId,
            status: 'DRAFT',
            priority: 'MEDIUM',
            matchingReason: bestMatch.shortReasoning || `התאמת AI - ציון ${Math.round(bestMatch.aiScore)}`,
            internalNotes: `[DRAFT] הצעה יומית לאישור שדכן | PotentialMatch: ${bestMatch.id} | Score: ${bestMatch.aiScore}`,
            lastActivity: new Date(),
            lastStatusChange: new Date(),
          },
        });

        await prisma.suggestionStatusHistory.create({
          data: {
            suggestionId: suggestion.id,
            status: 'DRAFT',
            notes: 'הצעה יומית אוטומטית - נוצרה כטיוטה לאישור שדכן',
          },
        });

        const otherParty = await prisma.user.findUnique({
          where: { id: otherPartyId },
          select: { firstName: true, lastName: true },
        });

        result.drafts.push({
          suggestionId: suggestion.id,
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          otherPartyName: otherParty ? `${otherParty.firstName} ${otherParty.lastName}` : otherPartyId,
          aiScore: bestMatch.aiScore,
        });
        result.draftsCreated++;
      } catch (error) {
        result.errors++;
        console.error(`  ❌ Error creating draft for ${user.id}:`, error instanceof Error ? error.message : error);
      }
    }

    console.log(`\n📝 [Review Mode] Done: ${result.draftsCreated} drafts created, ${result.skipped} skipped\n`);
    return result;
  }

  /**
   * Approve a batch of draft auto-suggestions — transitions them to PENDING_FIRST_PARTY
   * and sends notifications. Matchmaker can also reject (delete) unwanted drafts.
   */
  static async approveDraftSuggestions(
    suggestionIds: string[],
    matchmakerId: string
  ): Promise<{ approved: number; errors: { id: string; error: string }[] }> {
    const [dictHe, dictEn] = await Promise.all([
      getDictionary('he'),
      getDictionary('en'),
    ]);
    const dictionaries = { he: dictHe.email, en: dictEn.email };

    let approved = 0;
    const errors: { id: string; error: string }[] = [];

    for (const id of suggestionIds) {
      try {
        const suggestion = await prisma.matchSuggestion.findUnique({
          where: { id },
          include: {
            firstParty: { include: { profile: true } },
            secondParty: { include: { profile: true } },
            matchmaker: true,
          },
        });

        if (!suggestion) {
          errors.push({ id, error: 'Suggestion not found' });
          continue;
        }

        if (suggestion.status !== 'DRAFT') {
          errors.push({ id, error: `Invalid status: ${suggestion.status} (expected DRAFT)` });
          continue;
        }

        // Determine party swap preference
        const firstPartyProfile = await prisma.profile.findUnique({
          where: { userId: suggestion.firstPartyId },
          select: { wantsToBeFirstParty: true },
        });

        const decisionDeadline = new Date();
        decisionDeadline.setDate(decisionDeadline.getDate() + DECISION_DEADLINE_DAYS);

        const noteLocale = ((suggestion.firstParty as any).language || 'he') as 'he' | 'en';

        await prisma.matchSuggestion.update({
          where: { id },
          data: {
            status: 'PENDING_FIRST_PARTY',
            matchmakerId,
            decisionDeadline,
            firstPartySent: new Date(),
            lastStatusChange: new Date(),
            lastActivity: new Date(),
            firstPartyNotes: noteLocale === 'he'
              ? 'הצעה זו נבחרה על סמך ניתוח מעמיק של הפרופיל שלך, תשובותיך לשאלון, והעדפותיך. המערכת שלנו למדה מאלפי התאמות כדי למצוא את ההצעה הכי מתאימה עבורך.'
              : 'This match was selected based on a deep analysis of your profile, questionnaire responses, and preferences. Our system has learned from thousands of matches to find the best fit for you.',
            internalNotes: (suggestion.internalNotes || '').replace('[DRAFT] ', '') + ' | Approved by matchmaker',
          },
        });

        await prisma.suggestionStatusHistory.create({
          data: {
            suggestionId: id,
            status: 'PENDING_FIRST_PARTY',
            notes: `הצעה אושרה ע"י שדכן ונשלחה לצד הראשון`,
          },
        });

        // Send notifications
        try {
          const notificationService = initNotificationService();
          const firstPartyLang = (suggestion.firstParty as any).language || 'he';
          const secondPartyLang = (suggestion.secondParty as any).language || 'he';

          const firstPartyEmail = suggestion.firstParty.email;
          const optOutUrls = await this.generateOptOutUrls(suggestion.firstPartyId, firstPartyEmail, firstPartyLang);

          await notificationService.handleSuggestionStatusChange(
            { ...suggestion, status: 'PENDING_FIRST_PARTY' as any },
            dictionaries,
            {
              channels: ['email', 'whatsapp'],
              notifyParties: ['first'],
              optOutUrls,
            },
            {
              firstParty: firstPartyLang,
              secondParty: secondPartyLang,
              matchmaker: 'he',
            }
          );

          // Also push notification
          void sendPushToUser(suggestion.firstPartyId, {
            title: firstPartyLang === 'he' ? '💌 הצעת שידוך חדשה!' : '💌 New match suggestion!',
            body: firstPartyLang === 'he'
              ? 'קיבלת הצעת שידוך שנבחרה במיוחד עבורך. היכנס/י לצפייה'
              : 'You received a specially selected match. Tap to view',
            data: {
              type: 'AUTO_SUGGESTION',
              suggestionId: id,
              screen: 'suggestions',
            },
          }).catch(() => {});
        } catch (notifErr) {
          console.error(`  ⚠️ Notification failed for approved draft ${id}:`, notifErr);
        }

        approved++;
      } catch (err) {
        errors.push({ id, error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    return { approved, errors };
  }

  // ==========================================================================
  // ===== Preview Mode - הכנת הצעות לתצוגה מקדימה בלי שמירה ב-DB =====
  // ==========================================================================

  /**
   * מחזיר רשימת הצעות מוצעות ליוזרים הזכאים — ללא שמירה ב-DB.
   * תומך בסינון, מיון, הגבלת כמות, וחיפוש לפי שם.
   */
  static async generatePreview(filters?: PreviewFilters): Promise<{
    eligibleCount: number;
    filteredCount: number;
    withMatches: number;
    withoutMatches: number;
    hasBlockingSuggestion: number;
    previews: PreviewItem[];
  }> {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('👁️ [Preview Mode] Generating preview...');
    if (filters) console.log('🔍 Filters:', JSON.stringify(filters));
    console.log('═══════════════════════════════════════════════════════\n');

    // 1. Get all eligible users with extra data for filtering/sorting
    const allUsers = await this.getEligibleUsersEnriched();
    const eligibleCount = allUsers.length;
    console.log(`📊 Found ${eligibleCount} eligible users`);

    // 2. Apply filters
    let filteredUsers = allUsers;

    // Filter: gender
    if (filters?.gender) {
      filteredUsers = filteredUsers.filter(u => u.profile?.gender === filters.gender);
    }

    // Filter: search by name
    if (filters?.searchName) {
      const term = filters.searchName.toLowerCase();
      filteredUsers = filteredUsers.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    }

    // Filter: no suggestion in X days
    if (filters?.noSuggestionDays && filters.noSuggestionDays > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - filters.noSuggestionDays);
      filteredUsers = filteredUsers.filter(u =>
        !u.lastSuggestionDate || u.lastSuggestionDate < cutoff
      );
    }

    // Filter: specific user IDs
    if (filters?.userIds && filters.userIds.length > 0) {
      const idSet = new Set(filters.userIds);
      filteredUsers = filteredUsers.filter(u => idSet.has(u.id));
    }

    // 3. Sort
    const sortBy = filters?.sortBy || 'waiting_time';
    filteredUsers.sort((a, b) => {
      switch (sortBy) {
            case 'waiting_time': {
          const aTime = a.lastSuggestionDate?.getTime() || 0;
          const bTime = b.lastSuggestionDate?.getTime() || 0;
          return aTime - bTime;
        }
        case 'best_match':
          // לפי ציון ההתאמה הטובה ביותר (מוכרח לסדר אחרי שנמצא matches, נעשה ב-post)
          return 0;
        case 'registration_date':
          return (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0);
        default:
          return 0;
      }
    });

    // 4. Limit count
    const limit = filters?.limit;
    if (limit && limit > 0) {
      filteredUsers = filteredUsers.slice(0, limit);
    }

    const filteredCount = filteredUsers.length;
    console.log(`🔍 After filters: ${filteredCount} users\n`);

    // 5. Generate previews — batch blocking check + parallel processing

    // 5a. Batch check blocking suggestions for ALL filtered users at once
    const allUserIds = filteredUsers.map(u => u.id);
    const blockingSuggestions = allUserIds.length > 0
      ? await prisma.matchSuggestion.findMany({
          where: {
            OR: [
              { firstPartyId: { in: allUserIds } },
              { secondPartyId: { in: allUserIds } },
            ],
            status: { in: BLOCKING_SUGGESTION_STATUSES },
          },
          select: { firstPartyId: true, secondPartyId: true },
        })
      : [];

    const blockedUserIds = new Set<string>();
    for (const s of blockingSuggestions) {
      if (allUserIds.includes(s.firstPartyId)) blockedUserIds.add(s.firstPartyId);
      if (allUserIds.includes(s.secondPartyId)) blockedUserIds.add(s.secondPartyId);
    }

    const hasBlockingSuggestion = blockedUserIds.size;
    const nonBlockedUsers = filteredUsers.filter(u => !blockedUserIds.has(u.id));

    // 5b. Process users in parallel (concurrency = 5)
    const CONCURRENCY = 5;
    const previews: PreviewItem[] = [];
    let withMatches = 0;
    let withoutMatches = 0;

    const processUser = async (user: typeof nonBlockedUsers[0]) => {
      const topMatches = await this.findTopMatches(user, 3, {
        scanMethod: filters?.scanMethod,
        scanAfter: filters?.scanAfter,
      });

      // Batch fetch other party info
      const otherPartyIds = topMatches.map(m =>
        user.id === m.maleUserId ? m.femaleUserId : m.maleUserId
      );

      const otherParties = otherPartyIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: otherPartyIds } },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profile: {
                select: {
                  gender: true,
                  city: true,
                  birthDate: true,
                  religiousLevel: true,
                },
              },
              images: {
                where: { isMain: true },
                select: { url: true },
                take: 1,
              },
            },
          })
        : [];

      const otherPartyMap = new Map(otherParties.map(p => [p.id, p]));

      const enrichedMatches: PreviewMatch[] = [];
      for (const match of topMatches) {
        const otherPartyId = user.id === match.maleUserId ? match.femaleUserId : match.maleUserId;
        const otherParty = otherPartyMap.get(otherPartyId);

        if (otherParty) {
          enrichedMatches.push({
            matchId: match.id,
            aiScore: match.aiScore,
            shortReasoning: match.shortReasoning,
            otherParty: {
              id: otherParty.id,
              firstName: otherParty.firstName,
              lastName: otherParty.lastName,
              gender: otherParty.profile?.gender || null,
              city: otherParty.profile?.city || null,
              birthDate: otherParty.profile?.birthDate?.toISOString() || null,
              religiousLevel: otherParty.profile?.religiousLevel || null,
              mainImage: otherParty.images[0]?.url || null,
            },
          });
        }
      }

      const daysSinceLastSuggestion = user.lastSuggestionDate
        ? Math.floor((Date.now() - user.lastSuggestionDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        preview: {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            gender: user.profile?.gender || null,
            lastSuggestionDate: user.lastSuggestionDate?.toISOString() || null,
            daysSinceLastSuggestion,
            mainImage: user.mainImage || null,
          },
          selectedMatchId: enrichedMatches[0]?.matchId || null,
          customMatchingReason: null,
          matches: enrichedMatches,
          status: (enrichedMatches.length > 0 ? 'ready' : 'no_matches') as 'ready' | 'no_matches',
        },
        hasMatches: enrichedMatches.length > 0,
      };
    };

    // Process in batches of CONCURRENCY
    for (let i = 0; i < nonBlockedUsers.length; i += CONCURRENCY) {
      const batch = nonBlockedUsers.slice(i, i + CONCURRENCY);
      const results = await Promise.all(batch.map(processUser));
      for (const r of results) {
        previews.push(r.preview);
        if (r.hasMatches) withMatches++;
        else withoutMatches++;
      }
    }

    // Post-sort by best_match if needed
    if (sortBy === 'best_match') {
      previews.sort((a, b) => {
        const aScore = a.matches[0]?.aiScore || 0;
        const bScore = b.matches[0]?.aiScore || 0;
        return bScore - aScore;
      });
    }

    console.log(`\n👁️ [Preview] Done: ${withMatches} with matches, ${withoutMatches} without, ${hasBlockingSuggestion} blocked\n`);

    return {
      eligibleCount,
      filteredCount,
      withMatches,
      withoutMatches,
      hasBlockingSuggestion,
      previews,
    };
  }

  // ========== Enriched eligible users (with lastSuggestionDate) ==========

  private static async getEligibleUsersEnriched() {
    const users = await prisma.user.findMany({
      where: {
        source: 'REGISTRATION',
        status: 'ACTIVE',
        isPhoneVerified: true,
        email: { not: '' },
        phone: { not: null },
        role: 'CANDIDATE',
        engagementEmailsConsent: true,
        profile: { isNot: null },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        language: true,
        createdAt: true,
        profile: {
          select: {
            id: true,
            gender: true,
            availabilityStatus: true,
            wantsToBeFirstParty: true, // 🆕 V2.1
          },
        },
        images: {
          where: { isMain: true },
          select: { url: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const availableUsers = users.filter(u => u.profile?.availabilityStatus === 'AVAILABLE');

    // Batch query: last suggestion date per user
    const userIds = availableUsers.map(u => u.id);
    const lastSuggestionDates = new Map<string, Date>();

    if (userIds.length > 0) {
      // Query as firstParty
      const asFirst = await prisma.matchSuggestion.groupBy({
        by: ['firstPartyId'],
        where: { firstPartyId: { in: userIds } },
        _max: { createdAt: true },
      });
      for (const row of asFirst) {
        if (row._max.createdAt) {
          lastSuggestionDates.set(row.firstPartyId, row._max.createdAt);
        }
      }

      // Query as secondParty
      const asSecond = await prisma.matchSuggestion.groupBy({
        by: ['secondPartyId'],
        where: { secondPartyId: { in: userIds } },
        _max: { createdAt: true },
      });
      for (const row of asSecond) {
        if (row._max.createdAt) {
          const existing = lastSuggestionDates.get(row.secondPartyId);
          if (!existing || row._max.createdAt > existing) {
            lastSuggestionDates.set(row.secondPartyId, row._max.createdAt);
          }
        }
      }
    }

    return availableUsers.map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      language: u.language,
      createdAt: u.createdAt,
      profile: u.profile,
      mainImage: u.images[0]?.url || null,
      lastSuggestionDate: lastSuggestionDates.get(u.id) || null,
    }));
  }

  /**
   * שולח הצעות מותאמות אישית לפי רשימה שהשדכן אישר.
   * 
   * 🆕 V2.1: Supports wantsToBeFirstParty — swaps parties or skips if both opted out.
   * 
   * @param assignments - רשימה של { userId, matchId, customMatchingReason? }
   * @param matchmakerId - ID של השדכן
   */
  static async sendApprovedSuggestions(
    assignments: { userId: string; matchId: string; customMatchingReason?: string }[],
    matchmakerId: string
  ): Promise<{
    sent: number;
    errors: { userId: string; error: string }[];
  }> {
    console.log(`\n🚀 [Send Approved] Sending ${assignments.length} approved suggestions...\n`);

    const [dictHe, dictEn] = await Promise.all([
      getDictionary('he'),
      getDictionary('en'),
    ]);
    const dictionaries = { he: dictHe.email, en: dictEn.email };

    let sent = 0;
    const errors: { userId: string; error: string }[] = [];

    for (const { userId, matchId, customMatchingReason } of assignments) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            language: true,
            profile: {
              select: {
                id: true,
                gender: true,
                availabilityStatus: true,
                wantsToBeFirstParty: true, // 🆕 V2.1
              },
            },
          },
        });

        if (!user || !user.profile) {
          errors.push({ userId, error: 'User or profile not found' });
          continue;
        }

        const match = await prisma.potentialMatch.findUnique({
          where: { id: matchId },
          select: {
            id: true,
            maleUserId: true,
            femaleUserId: true,
            aiScore: true,
            shortReasoning: true,
            detailedReasoning: true,
          },
        });

        if (!match) {
          errors.push({ userId, error: `Match ${matchId} not found` });
          continue;
        }

        // Override shortReasoning if custom reason was provided
        const matchWithReason = customMatchingReason
          ? { ...match, shortReasoning: customMatchingReason }
          : match;

        // V4.0: Male as first party by default
        const swapParties = await this.determinePartySwap(user, match);

        await this.createAutoSuggestion(user, matchWithReason, matchmakerId, dictionaries, swapParties);
        sent++;
        console.log(`  ✅ Sent to ${user.firstName} ${user.lastName}${swapParties ? ' (parties swapped)' : ''}`);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        errors.push({ userId, error: errMsg });
        console.error(`  ❌ Error for ${userId}: ${errMsg}`);
      }
    }

    console.log(`\n🚀 [Send Approved] Done: ${sent}/${assignments.length} sent\n`);
    return { sent, errors };
  }
}

// =============================================================================
// TYPES for Preview
// =============================================================================

export interface PreviewFilters {
  gender?: 'MALE' | 'FEMALE';
  searchName?: string;
  noSuggestionDays?: number;
  limit?: number;
  userIds?: string[];
  sortBy?: 'waiting_time' | 'best_match' | 'registration_date';
  scanMethod?: 'hybrid' | 'algorithmic' | 'vector' | 'metrics_v2';
  scanAfter?: string; // ISO date — only use PotentialMatches scanned after this date
}

export interface PreviewMatch {
  matchId: string;
  aiScore: number;
  shortReasoning: string | null;
  // V4.0: Party direction — which gender is first party
  partyDirection?: {
    firstPartyGender: 'MALE' | 'FEMALE';
    firstPartyName: string;
    secondPartyName: string;
  };
  // V4.0: Previous suggestion info (if this pair was suggested before)
  previousSuggestion?: {
    status: string;
    createdAt: string;
  } | null;
  otherParty: {
    id: string;
    firstName: string;
    lastName: string;
    gender: string | null;
    city: string | null;
    birthDate: string | null;
    religiousLevel: string | null;
    mainImage: string | null;
  };
}

export interface PreviewItem {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    gender: string | null;
    lastSuggestionDate: string | null;
    daysSinceLastSuggestion: number | null;
    mainImage: string | null;
  };
  selectedMatchId: string | null;
  customMatchingReason: string | null;
  matches: PreviewMatch[];
  status: 'ready' | 'no_matches';
}