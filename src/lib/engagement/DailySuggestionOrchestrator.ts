// src/lib/engagement/DailySuggestionOrchestrator.ts
// =============================================================================
// NeshamaTech - Daily Auto-Suggestion Orchestrator
// שולח הצעת שידוך יומית אחת לכל יוזר זכאי בשעה 19:00
// 
// 🆕 V2.1 - wantsToBeFirstParty Support:
// - If user opted out of being first party → swap parties (other party becomes first)
// - If BOTH users opted out → send generic notification email, don't create suggestion
// =============================================================================

import prisma from '@/lib/prisma';
import type { MatchSuggestionStatus, PotentialMatchStatus } from '@prisma/client';
import { AutoSuggestionFeedbackService } from '@/lib/services/autoSuggestionFeedbackService';
import { initNotificationService } from '@/components/matchmaker/suggestions/services/notification/initNotifications';
import { getDictionary } from '@/lib/dictionaries';
import type { EmailDictionary } from '@/types/dictionary';

// =============================================================================
// CONSTANTS
// =============================================================================

const MIN_AI_SCORE = 70;

const DECISION_DEADLINE_DAYS = 3;

// סטטוסים שחוסמים הצעות חדשות
const BLOCKING_SUGGESTION_STATUSES: MatchSuggestionStatus[] = [
  'PENDING_FIRST_PARTY',
  'PENDING_SECOND_PARTY',
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

// סטטוסים שנחשבים "ממתינים לתגובה"
const PENDING_RESPONSE_STATUSES: MatchSuggestionStatus[] = [
  'PENDING_FIRST_PARTY',
  'PENDING_SECOND_PARTY',
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
  remindersSent: number;
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

      // Step 4: Process each user
      for (let i = 0; i < eligibleUsers.length; i++) {
        const user = eligibleUsers[i];
        result.processed++;

        console.log(`\n--- [${i + 1}/${eligibleUsers.length}] Processing ${user.firstName} ${user.lastName} (${user.id}) ---`);

        try {
          const userResult = await this.processUser(user, matchmakerId, dictionaries);
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
        } catch (error) {
          result.errors++;
          result.details.push({
            userId: user.id,
            action: 'error',
            reason: error instanceof Error ? error.message : 'Unknown error',
          });
          console.error(`  ❌ Error: ${error instanceof Error ? error.message : error}`);
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

    // Check 1: Does user have a blocking active suggestion?
    const blockingSuggestion = await prisma.matchSuggestion.findFirst({
      where: {
        OR: [
          { firstPartyId: user.id },
          { secondPartyId: user.id },
        ],
        status: { in: BLOCKING_SUGGESTION_STATUSES },
      },
      select: {
        id: true,
        status: true,
        isAutoSuggestion: true,
        firstPartyId: true,
        secondPartyId: true,
        createdAt: true,
      },
    });

    if (blockingSuggestion) {
      // Is it an auto-suggestion pending response? → send reminder
      if (
        blockingSuggestion.isAutoSuggestion === true &&
        PENDING_RESPONSE_STATUSES.includes(blockingSuggestion.status)
      ) {
        const hoursSinceCreated = (Date.now() - blockingSuggestion.createdAt.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceCreated >= 24) {
          await this.sendReminder(user, blockingSuggestion, dictionaries);
          return {
            userId: user.id,
            action: 'reminder',
            suggestionId: blockingSuggestion.id,
          };
        } else {
          return {
            userId: user.id,
            action: 'skipped',
            reason: 'System suggestion exists but is less than 24h old',
          };
        }
      }

      return {
        userId: user.id,
        action: 'skipped',
        reason: `Has active suggestion (${blockingSuggestion.status}) - ID: ${blockingSuggestion.id}`,
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
    // 🆕 V2.1: Check 3 - Determine party assignment based on wantsToBeFirstParty
    // =========================================================================
    const otherPartyId = user.id === bestMatch.maleUserId ? bestMatch.femaleUserId : bestMatch.maleUserId;
    const userWantsFirst = user.profile?.wantsToBeFirstParty ?? true;

    let swapParties = false;

    if (!userWantsFirst) {
      // User doesn't want to be first party → check other party's preference
      const otherPartyProfile = await prisma.profile.findUnique({
        where: { userId: otherPartyId },
        select: { wantsToBeFirstParty: true },
      });
      const otherWantsFirst = otherPartyProfile?.wantsToBeFirstParty ?? true;

      if (!otherWantsFirst) {
        // ❌ Both opted out → send generic notification, don't create suggestion
        console.log(`  🚫 Both parties opted out of first party — sending generic notification`);
        await this.sendBothOptedOutNotification(user, bestMatch, dictionaries);
        return {
          userId: user.id,
          action: 'skipped',
          reason: `Both parties opted out of auto-scan first party — generic notification sent (Match: ${bestMatch.id})`,
        };
      }

      // 🔄 Other party is OK being first → swap sides
      swapParties = true;
      console.log(`  🔄 Swapping parties: ${user.firstName} opted out of first party → other party (${otherPartyId}) will be first`);
    }

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

    // שליפת top 10 התאמות עם סינון בסיסי ברמת ה-DB
    const matches = await prisma.potentialMatch.findMany({
      where: {
        ...(isMale ? { maleUserId: user.id } : { femaleUserId: user.id }),
        status: { in: ['PENDING', 'REVIEWED'] as PotentialMatchStatus[] },
        aiScore: { gte: MIN_AI_SCORE },
        // וידוא שהצד השני הוא יוזר רשום ופעיל (ללא availabilityStatus ברמת DB)
        ...(isMale
          ? {
              female: {
                source: 'REGISTRATION',
                status: 'ACTIVE',
                isPhoneVerified: true,
                email: { not: '' },
                phone: { not: null },
                profile: { isNot: null },
              },
            }
          : {
              male: {
                source: 'REGISTRATION',
                status: 'ACTIVE',
                isPhoneVerified: true,
                email: { not: '' },
                phone: { not: null },
                profile: { isNot: null },
              },
            }),
      },
      orderBy: { aiScore: 'desc' },
      take: 10,
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

    // סינון בקוד: availabilityStatus + בדיקות נוספות
    // Collect all valid matches first, then apply feedback re-ranking
    const validMatches: {
      id: string;
      maleUserId: string;
      femaleUserId: string;
      aiScore: number;
      shortReasoning: string | null;
      detailedReasoning: string | null;
    }[] = [];

    for (const match of matches) {
      // בדיקת availabilityStatus של הצד השני
      const otherPartyProfile = isMale ? match.female?.profile : match.male?.profile;
      if (otherPartyProfile?.availabilityStatus !== 'AVAILABLE') {
        continue;
      }

      // בדיקה שלא קיימת כבר הצעה בין שני הצדדים
      const existingSuggestion = await prisma.matchSuggestion.findFirst({
        where: {
          OR: [
            { firstPartyId: match.maleUserId, secondPartyId: match.femaleUserId },
            { firstPartyId: match.femaleUserId, secondPartyId: match.maleUserId },
          ],
          status: { notIn: CLOSED_STATUSES },
        },
      });

      if (existingSuggestion) {
        console.log(`  ⚠️ Existing suggestion between ${match.maleUserId} & ${match.femaleUserId}, trying next...`);
        continue;
      }

      // בדיקה שלצד השני אין הצעה פעילה חוסמת
      const otherPartyId = user.id === match.maleUserId ? match.femaleUserId : match.maleUserId;
      const otherPartyBlocking = await prisma.matchSuggestion.findFirst({
        where: {
          OR: [
            { firstPartyId: otherPartyId },
            { secondPartyId: otherPartyId },
          ],
          status: { in: BLOCKING_SUGGESTION_STATUSES },
        },
      });

      if (otherPartyBlocking) {
        console.log(`  ⚠️ Other party (${otherPartyId}) has active suggestion, trying next...`);
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

    if (validMatches.length === 0) return null;

    // 🆕 Apply feedback-based re-ranking if user has enough feedback
    try {
      const reranked = await AutoSuggestionFeedbackService.applyFeedbackReranking(validMatches, user.id);
      console.log(`  📊 Feedback re-ranking applied for ${user.id}: ${reranked.length} valid matches`);
      return reranked[0]; // Return top-ranked match
    } catch (err) {
      console.error(`  ⚠️ Feedback re-ranking failed, using original order:`, err);
      return validMatches[0]; // Fallback to original order
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
    try {
      const notificationService = initNotificationService();

      const firstPartyLang = (suggestion.firstParty as any).language || 'he';
      const secondPartyLang = (suggestion.secondParty as any).language || 'he';

      await notificationService.handleSuggestionStatusChange(
        suggestion,
        dictionaries,
        {
          channels: ['email', 'whatsapp'],
          notifyParties: ['first'],
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

    return suggestion;
  }

  // ========== Send Reminder ==========

  private static async sendReminder(
    user: EligibleUser,
    suggestion: { id: string; firstPartyId: string; secondPartyId: string },
    dictionaries: { he: EmailDictionary; en: EmailDictionary }
  ): Promise<void> {
    const locale = (user.language as 'he' | 'en') || 'he';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const reviewUrl = `${baseUrl}/matches`;

    const isHebrew = locale === 'he';
    const greeting = isHebrew ? `שלום ${user.firstName},` : `Hello ${user.firstName},`;

    const subject = isHebrew 
      ? '⏰ ההצעה שלך עדיין מחכה לך'
      : '⏰ Your match is still waiting for you';
    
    const body = [
      greeting,
      '',
      isHebrew
        ? 'שלחנו לך הצעת שידוך שנבחרה במיוחד עבורך. היא עדיין מחכה לתגובתך.'
        : 'We sent you a specially selected match that\'s still waiting for your response.',
      '',
      isHebrew ? `👉 צפה בהצעה: ${reviewUrl}` : `👉 View match: ${reviewUrl}`,
      '',
      isHebrew ? 'בברכה,' : 'Best regards,',
      isHebrew ? 'NeshamaTech - המערכת החכמה' : 'NeshamaTech Smart System',
    ].join('\n');

    const htmlBody = `
      <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%); color: #ffffff; padding: 35px 25px; text-align: center; border-radius: 16px 16px 0 0;">
        <span style="font-size: 32px; display: block; margin-bottom: 10px;">⏰</span>
        <h1 style="margin: 0; font-size: 24px; color: #fbbf24;">${isHebrew ? 'ההצעה שלך מחכה' : 'Your Match is Waiting'}</h1>
      </div>
      <div style="padding: 30px 25px; font-family: 'Segoe UI', sans-serif; direction: ${isHebrew ? 'rtl' : 'ltr'}; text-align: ${isHebrew ? 'right' : 'left'};">
        <p style="font-size: 20px; color: #1e293b; margin-bottom: 15px;">${greeting}</p>
        <p style="color: #475569; line-height: 1.8; margin-bottom: 25px;">
          ${isHebrew 
            ? 'שלחנו לך הצעת שידוך שנבחרה במיוחד עבורך על בסיס הלמידה של המערכת. היא עדיין מחכה לתגובתך. קח/י רגע לצפות בה – אולי זה הדבר הכי חשוב שתעשה/י היום.'
            : 'We sent you a specially selected match based on our system\'s learning. It\'s still waiting for your response. Take a moment to review it – this could be the most important thing you do today.'}
        </p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${reviewUrl}" style="display: inline-block; padding: 16px 45px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #1e293b !important; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px;">
            ${isHebrew ? '👀 צפה בהצעה' : '👀 View Match'}
          </a>
        </div>
        <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
          <p>NeshamaTech - ${isHebrew ? 'המערכת החכמה' : 'Smart System'}</p>
        </div>
      </div>
    `;

    try {
      const notificationService = initNotificationService();
      
      await notificationService.sendNotification(
        {
          email: user.email,
          phone: user.phone || undefined,
          name: user.firstName,
        },
        { subject, body, htmlBody },
        { channels: ['email', 'whatsapp'] }
      );

      console.log(`  📨 Reminder sent to ${user.email}`);
    } catch (error) {
      console.error(`  ⚠️ Failed to send reminder to ${user.email}:`, error);
    }
  }

  // =========================================================================
  // 🆕 V2.1: Send notification when BOTH parties opted out of being first party
  // =========================================================================

  private static async sendBothOptedOutNotification(
    user: EligibleUser,
    match: {
      id: string;
      maleUserId: string;
      femaleUserId: string;
      aiScore: number;
    },
    dictionaries: { he: EmailDictionary; en: EmailDictionary }
  ): Promise<void> {
    const locale = (user.language as 'he' | 'en') || 'he';
    const isHebrew = locale === 'he';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const matchesUrl = `${baseUrl}/matches`;
    const settingsUrl = `${baseUrl}/settings`;

    const subject = isHebrew
      ? '💡 מצאנו הצעה מעניינת בשבילך'
      : '💡 We found an interesting match for you';

    const body = [
      isHebrew ? `שלום ${user.firstName},` : `Hello ${user.firstName},`,
      '',
      isHebrew
        ? 'המערכת שלנו מצאה עבורך הצעת שידוך שנראית מעניינת במיוחד.'
        : 'Our system found a match that looks especially interesting for you.',
      '',
      isHebrew
        ? 'מכיוון שבחרת שלא לקבל הצעות מהסריקה האוטומטית כצד ראשון, לא שלחנו אותה ישירות.'
        : 'Since you chose not to receive auto-scan suggestions as first party, we didn\'t send it directly.',
      '',
      isHebrew
        ? 'אם את/ה מעוניין/ת לשמוע על ההצעה, פשוט פנה/י אלינו דרך המערכת ונשמח לספר לך.'
        : 'If you\'re interested, simply reach out to us through the system and we\'ll be happy to share.',
      '',
      isHebrew ? `👉 פנה אלינו: ${matchesUrl}` : `👉 Contact us: ${matchesUrl}`,
      '',
      isHebrew ? 'בברכה,' : 'Best regards,',
      isHebrew ? 'NeshamaTech' : 'NeshamaTech',
    ].join('\n');

    const htmlBody = `
      <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%); color: #ffffff; padding: 35px 25px; text-align: center; border-radius: 16px 16px 0 0;">
        <span style="font-size: 32px; display: block; margin-bottom: 10px;">💡</span>
        <h1 style="margin: 0; font-size: 22px; color: #a78bfa;">
          ${isHebrew ? 'מצאנו הצעה מעניינת בשבילך' : 'We Found an Interesting Match'}
        </h1>
      </div>
      <div style="padding: 30px 25px; font-family: 'Segoe UI', Tahoma, sans-serif; direction: ${isHebrew ? 'rtl' : 'ltr'}; text-align: ${isHebrew ? 'right' : 'left'}; background-color: #ffffff;">
        <p style="font-size: 18px; color: #1e293b; margin-bottom: 15px;">
          ${isHebrew ? `שלום ${user.firstName},` : `Hello ${user.firstName},`}
        </p>
        
        <p style="color: #475569; line-height: 1.8; margin-bottom: 20px;">
          ${isHebrew
            ? 'המערכת שלנו מצאה עבורך הצעת שידוך שנראית לנו מעניינת במיוחד. 🌟'
            : 'Our system found a match that looks especially interesting for you. 🌟'
          }
        </p>

        <div style="background: linear-gradient(135deg, #f5f3ff, #ede9fe); border: 1px solid #ddd6fe; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="color: #5b21b6; font-weight: 600; margin: 0 0 8px 0; font-size: 15px;">
            ${isHebrew ? '📋 למה לא שלחנו ישירות?' : '📋 Why didn\'t we send it directly?'}
          </p>
          <p style="color: #6d28d9; margin: 0; line-height: 1.6; font-size: 14px;">
            ${isHebrew
              ? 'מכיוון שבחרת בהגדרות הפרופיל שלך שלא לקבל הצעות מהסריקה האוטומטית כצד ראשון, לא שלחנו את ההצעה באופן אוטומטי. אנחנו מכבדים את ההעדפות שלך.'
              : 'Because you chose in your profile settings not to receive auto-scan suggestions as first party, we didn\'t send the suggestion automatically. We respect your preferences.'
            }
          </p>
        </div>

        <p style="color: #475569; line-height: 1.8; margin-bottom: 25px;">
          ${isHebrew
            ? 'אם את/ה מעוניין/ת לשמוע על ההצעה, פשוט פנה/י אלינו דרך המערכת ונשמח לספר לך עליה. 😊'
            : 'If you\'re interested in hearing about this match, simply reach out to us through the system and we\'ll be happy to share more. 😊'
          }
        </p>

        <div style="text-align: center; margin: 25px 0;">
          <a href="${matchesUrl}" style="display: inline-block; padding: 16px 45px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: #ffffff !important; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);">
            ${isHebrew ? '💬 פנה אלינו דרך המערכת' : '💬 Contact Us Through the System'}
          </a>
        </div>

        <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 13px; text-align: center;">
          <p style="margin: 0;">
            ${isHebrew
              ? 'ניתן לשנות את הגדרות קבלת ההצעות בכל עת'
              : 'You can change your suggestion preferences anytime'
            }
            — <a href="${settingsUrl}" style="color: #8b5cf6; text-decoration: underline;">
              ${isHebrew ? 'הגדרות פרופיל' : 'Profile Settings'}
            </a>
          </p>
          <p style="margin: 8px 0 0 0;">NeshamaTech 💜</p>
        </div>
      </div>
    `;

    try {
      const notificationService = initNotificationService();

      await notificationService.sendNotification(
        {
          email: user.email,
          phone: user.phone || undefined,
          name: user.firstName,
        },
        { subject, body, htmlBody },
        { channels: ['email'] } // רק אימייל — לא וואטסאפ, כי זה לא הצעה ממשית
      );

      console.log(`  📧 Both-opted-out notification sent to ${user.email} (Match: ${match.id})`);
    } catch (error) {
      console.error(`  ⚠️ Failed to send both-opted-out notification to ${user.email}:`, error);
    }
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
    matchmakerId: string
  ): Promise<{
    success: boolean;
    userId: string;
    userName: string;
    requested: number;
    sent: number;
    suggestions: { suggestionId: string; matchId: string; aiScore: number; otherPartyName: string }[];
    skipped: string[];
    errors: string[];
  }> {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`🎯 [Personal Mode] Running for user ${userId} — ${count} suggestions`);
    console.log('═══════════════════════════════════════════════════════\n');

    const result = {
      success: false,
      userId,
      userName: '',
      requested: count,
      sent: 0,
      suggestions: [] as { suggestionId: string; matchId: string; aiScore: number; otherPartyName: string }[],
      skipped: [] as string[],
      errors: [] as string[],
    };

    try {
      // 1. Fetch the user with profile (🆕 V2.1: includes wantsToBeFirstParty)
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
        result.errors.push(`User not found: ${userId}`);
        return result;
      }

      result.userName = `${user.firstName} ${user.lastName}`;

      if (!user.profile) {
        result.errors.push('User has no profile');
        return result;
      }

      console.log(`👤 User: ${user.firstName} ${user.lastName} (${user.profile.gender})`);
      console.log(`📧 Email: ${user.email}`);
      console.log(`🔄 wantsToBeFirstParty: ${user.profile.wantsToBeFirstParty}`); // 🆕 V2.1
      console.log(`📊 Requesting ${count} suggestions\n`);

      // 3. Load dictionaries
      const [dictHe, dictEn] = await Promise.all([
        getDictionary('he'),
        getDictionary('en'),
      ]);
      const dictionaries = { he: dictHe.email, en: dictEn.email };

      // 4. Find top N matches (skipping blocking checks for THIS user)
      const topMatches = await this.findTopMatches(user, count);

      if (topMatches.length === 0) {
        result.skipped.push('No eligible potential matches found with score >= 70');
        console.log('  ⚠️ No eligible matches found');
        return result;
      }

      console.log(`  📋 Found ${topMatches.length} eligible matches (requested ${count})\n`);

      // 🆕 V2.1: Get user's first party preference once (used in the loop)
      const userWantsFirst = user.profile.wantsToBeFirstParty ?? true;

      // Track if we already sent a both-opted-out notification (to avoid spam)
      let bothOptedOutNotificationSent = false;

      // 5. Create suggestions for each match
      for (let i = 0; i < topMatches.length; i++) {
        const match = topMatches[i];
        const otherPartyId = user.id === match.maleUserId ? match.femaleUserId : match.maleUserId;

        console.log(`  [${i + 1}/${topMatches.length}] Creating suggestion — Score: ${Math.round(match.aiScore)}, Other: ${otherPartyId}`);

        try {
          // =====================================================================
          // 🆕 V2.1: Determine party assignment based on wantsToBeFirstParty
          // =====================================================================
          let swapParties = false;

          if (!userWantsFirst) {
            const otherProfile = await prisma.profile.findUnique({
              where: { userId: otherPartyId },
              select: { wantsToBeFirstParty: true },
            });
            const otherWantsFirst = otherProfile?.wantsToBeFirstParty ?? true;

            if (!otherWantsFirst) {
              // Both opted out → skip this match, try next
              console.log(`  🚫 Both parties opted out of first party — skipping match ${match.id}`);
              const skipReason = `Match ${match.id}: Both parties opted out of first party`;
              result.skipped.push(skipReason);

              // Send notification only once (to avoid spam)
              if (!bothOptedOutNotificationSent) {
                await this.sendBothOptedOutNotification(user, match, dictionaries);
                bothOptedOutNotificationSent = true;
                console.log(`  📧 Both-opted-out notification sent`);
              }
              continue;
            }

            swapParties = true;
            console.log(`  🔄 Swapping parties: user opted out of first party`);
          }

          const suggestion = await this.createAutoSuggestion(user, match, matchmakerId, dictionaries, swapParties);

          // Get other party name for the result
          const otherParty = await prisma.user.findUnique({
            where: { id: otherPartyId },
            select: { firstName: true, lastName: true },
          });

          result.suggestions.push({
            suggestionId: suggestion.id,
            matchId: match.id,
            aiScore: match.aiScore,
            otherPartyName: otherParty ? `${otherParty.firstName} ${otherParty.lastName}` : otherPartyId,
          });
          result.sent++;

          console.log(`  ✅ Suggestion created: ${suggestion.id}${swapParties ? ' (parties swapped)' : ''}`);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Unknown error';
          result.errors.push(`Match ${match.id}: ${errMsg}`);
          console.error(`  ❌ Error creating suggestion for match ${match.id}: ${errMsg}`);
        }
      }

      result.success = result.sent > 0;

      console.log(`\n🎯 [Personal Mode] Done: ${result.sent}/${count} sent`);
      return result;

    } catch (fatalError) {
      const errMsg = fatalError instanceof Error ? fatalError.message : 'Unknown error';
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
        ...(isMale
          ? {
              female: {
                source: 'REGISTRATION',
                status: 'ACTIVE',
                profile: { isNot: null },
              },
            }
          : {
              male: {
                source: 'REGISTRATION',
                status: 'ACTIVE',
                profile: { isNot: null },
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

      // בדיקת availabilityStatus של הצד השני
      const otherPartyProfile = isMale ? match.female?.profile : match.male?.profile;
      if (otherPartyProfile?.availabilityStatus !== 'AVAILABLE') {
        continue;
      }

      // בדיקה שלא קיימת כבר הצעה בין שני הצדדים (כולל הצעות פעילות)
      const existingSuggestion = await prisma.matchSuggestion.findFirst({
        where: {
          OR: [
            { firstPartyId: match.maleUserId, secondPartyId: match.femaleUserId },
            { firstPartyId: match.femaleUserId, secondPartyId: match.maleUserId },
          ],
          status: { notIn: CLOSED_STATUSES },
        },
      });

      if (existingSuggestion) {
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

    // 5. Generate previews
    const previews: PreviewItem[] = [];
    let withMatches = 0;
    let withoutMatches = 0;
    let hasBlockingSuggestion = 0;

    for (const user of filteredUsers) {
      // Check blocking suggestion
      const blockingSuggestion = await prisma.matchSuggestion.findFirst({
        where: {
          OR: [
            { firstPartyId: user.id },
            { secondPartyId: user.id },
          ],
          status: { in: BLOCKING_SUGGESTION_STATUSES },
        },
        select: { id: true, status: true },
      });

      if (blockingSuggestion) {
        hasBlockingSuggestion++;
        continue;
      }

      // Find top 3 matches (with optional scan method/date filter)
      const topMatches = await this.findTopMatches(user, 3, {
        scanMethod: filters?.scanMethod,
        scanAfter: filters?.scanAfter,
      });

      // Enrich with other party info
      const enrichedMatches: PreviewMatch[] = [];
      for (const match of topMatches) {
        const otherPartyId = user.id === match.maleUserId ? match.femaleUserId : match.maleUserId;
        const otherParty = await prisma.user.findUnique({
          where: { id: otherPartyId },
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
        });

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

      if (enrichedMatches.length > 0) {
        withMatches++;
      } else {
        withoutMatches++;
      }

      const daysSinceLastSuggestion = user.lastSuggestionDate
        ? Math.floor((Date.now() - user.lastSuggestionDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      previews.push({
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
        status: enrichedMatches.length > 0 ? 'ready' : 'no_matches',
      });
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

        // =====================================================================
        // 🆕 V2.1: Check wantsToBeFirstParty — same logic as batch mode
        // =====================================================================
        let swapParties = false;
        const userWantsFirst = user.profile.wantsToBeFirstParty ?? true;

        if (!userWantsFirst) {
          const otherPartyId = userId === match.maleUserId ? match.femaleUserId : match.maleUserId;
          const otherProfile = await prisma.profile.findUnique({
            where: { userId: otherPartyId },
            select: { wantsToBeFirstParty: true },
          });
          const otherWantsFirst = otherProfile?.wantsToBeFirstParty ?? true;

          if (!otherWantsFirst) {
            errors.push({ userId, error: 'Both parties opted out of being first party in auto-suggestions' });
            console.log(`  🚫 Skipped ${user.firstName}: both parties opted out of first party`);
            continue;
          }

          swapParties = true;
          console.log(`  🔄 Swapping parties for ${user.firstName}: opted out of first party`);
        }

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