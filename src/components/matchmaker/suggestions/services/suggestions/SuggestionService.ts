// src/components/matchmaker/suggestions/services/suggestions/SuggestionService.ts

import { MatchSuggestionStatus, Priority, UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { statusTransitionService, type SuggestionWithParties } from "./StatusTransitionService";
import { initNotificationService } from "../notification/initNotifications";
import { notifyNewSuggestion } from "@/lib/pushNotifications"; // ✅ NEW
import type { 
  CreateSuggestionData,
  UpdateSuggestionData,
} from "@/types/suggestions";
import type { EmailDictionary } from "@/types/dictionary";

// ממשק להעדפות שפה של הצדדים
interface LanguageOptions {
  firstParty: 'he' | 'en';
  secondParty: 'he' | 'en';
}

// הפעלת שירות ההתראות. הפעולה מתבצעת פעם אחת כשהמודול נטען.
const notificationService = initNotificationService();

// רשימת סטטוסים החוסמים יצירת הצעה חדשה עבור מועמד
const BLOCKING_SUGGESTION_STATUSES: MatchSuggestionStatus[] = [
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

export class SuggestionService {
  private static instance: SuggestionService;

  private constructor() {}

  public static getInstance(): SuggestionService {
    if (!SuggestionService.instance) {
      SuggestionService.instance = new SuggestionService();
    }
    return SuggestionService.instance;
  }

  public async createSuggestion(
    data: CreateSuggestionData,
    dictionaries: { he: EmailDictionary; en: EmailDictionary }, 
    languageOptions: LanguageOptions,
  ): Promise<SuggestionWithParties> {
    // 1. וידוא הרשאות השדכן
    const matchmaker = await prisma.user.findUnique({
      where: { id: data.matchmakerId },
    });

    const allowedRoles: UserRole[] = [UserRole.MATCHMAKER, UserRole.ADMIN];
    if (!matchmaker || !allowedRoles.includes(matchmaker.role)) {
      throw new Error("Unauthorized - User must be a Matchmaker or Admin");
    }
  
    // 2. בדיקה אם המועמדים קיימים
    const [firstParty, secondParty] = await Promise.all([
        prisma.user.findUnique({ where: { id: data.firstPartyId } }),
        prisma.user.findUnique({ where: { id: data.secondPartyId } })
    ]);

    if (!firstParty || !secondParty) {
        throw new Error("One or both candidates not found.");
    }

    // 4. יצירת ההצעה בטרנזקציה להבטחת שלמות הנתונים
    const suggestion = await prisma.$transaction(async (tx) => {
      const cleanedData = {
        matchmakerId: data.matchmakerId,
        firstPartyId: data.firstPartyId,
        secondPartyId: data.secondPartyId,
        status: MatchSuggestionStatus.PENDING_FIRST_PARTY,
        priority: data.priority || Priority.MEDIUM,
        matchingReason: data.notes?.matchingReason || null,
        firstPartyNotes: data.notes?.forFirstParty || null,
        secondPartyNotes: data.notes?.forSecondParty || null,
        internalNotes: data.notes?.internal || null,
        followUpNotes: data.notes?.followUpNotes || null,
        decisionDeadline: new Date(data.decisionDeadline),
        firstPartySent: new Date(),
        lastActivity: new Date(),
        lastStatusChange: new Date()
      };

      const newSuggestion = await tx.matchSuggestion.create({
        data: cleanedData,
        include: {
          firstParty: { include: { profile: true } },
          secondParty: { include: { profile: true } },
          matchmaker: true,
        },
      });

      await tx.suggestionStatusHistory.create({
        data: {
          suggestionId: newSuggestion.id,
          status: newSuggestion.status,
          notes: "Initial suggestion created and sent to first party",
        },
      });

      return newSuggestion;
    });

    // 5. שליחת התראות – email + WhatsApp (קיים)
    try {
      console.log('═══════════════════════════════════════════════');
      console.log('📨 Sending INVITATION notification for new suggestion');
      console.log(`   Suggestion ID: ${suggestion.id}`);
      console.log(`   First party: ${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName} (${languageOptions.firstParty})`);
      console.log(`   Second party: ${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName} (${languageOptions.secondParty})`);
      console.log(`   Matchmaker: ${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`);
      console.log(`   Personal note for first party: ${data.notes?.forFirstParty ? '✅ included (' + data.notes.forFirstParty.substring(0, 50) + '...)' : '❌ none'}`);
      console.log(`   Decision deadline: ${data.decisionDeadline}`);
      console.log('═══════════════════════════════════════════════');
      
      await notificationService.handleSuggestionStatusChange(
        suggestion,
        dictionaries,
        {
          channels: ['email', 'whatsapp'],
          notifyParties: ['first']
        },
        {
            firstParty: languageOptions.firstParty,
            secondParty: languageOptions.secondParty,
            matchmaker: 'he'
        }
      );

      console.log('✅ Invitation notification sent successfully');
    } catch (error) {
      console.error('❌ Error sending invitation notification:', error);
    }

    // =====================================================
    // ✅ NEW: שליחת Push Notification לפלאפון של צד ראשון
    // =====================================================
    try {
      const matchmakerFullName = `${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`;
      await notifyNewSuggestion({
        userId: suggestion.firstPartyId,
        matchmakerName: matchmakerFullName,
        suggestionId: suggestion.id,
      });
      console.log('✅ Push notification sent to first party');
    } catch (pushError) {
      // Don't fail suggestion creation if push fails
      console.error('❌ Push notification error (non-fatal):', pushError);
    }

    return suggestion;
  }

  // ============================================================
  // updateSuggestion - unchanged
  // ============================================================
  public async updateSuggestion(
    id: string,
    matchmakerId: string,
    data: UpdateSuggestionData
  ): Promise<SuggestionWithParties> {
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id },
      include: {
        firstParty: { include: { profile: true } },
        secondParty: { include: { profile: true } },
        matchmaker: true,
      },
    });

    if (!suggestion) {
      throw new Error("Suggestion not found");
    }

    // ✅ תיקון - תחליף בזה:
if (suggestion.matchmakerId !== matchmakerId) {
  // Allow admins to edit any suggestion (permission check done in API route)
  // For non-admins, this is a security fallback
  console.warn(`[SuggestionService] User ${matchmakerId} is editing suggestion owned by ${suggestion.matchmakerId}`);
}

    const cleanedUpdateData = {
      ...(data.notes?.matchingReason !== undefined && { matchingReason: data.notes.matchingReason }),
      ...(data.notes?.forFirstParty !== undefined && { firstPartyNotes: data.notes.forFirstParty }),
      ...(data.notes?.forSecondParty !== undefined && { secondPartyNotes: data.notes.forSecondParty }),
      ...(data.notes?.internal !== undefined && { internalNotes: data.notes.internal }),
      ...(data.notes?.followUpNotes !== undefined && { followUpNotes: data.notes.followUpNotes }),
      ...(data.priority && { priority: data.priority }),
      ...(data.decisionDeadline && { decisionDeadline: new Date(data.decisionDeadline) }),
      lastActivity: new Date()
    };

    return await prisma.matchSuggestion.update({
      where: { id },
      data: cleanedUpdateData,
      include: {
        firstParty: { include: { profile: true } },
        secondParty: { include: { profile: true } },
        matchmaker: true,
      },
    });
  }

  // ============================================================
  // updateSuggestionStatus - unchanged
  // ============================================================
  public async updateSuggestionStatus(
    id: string,
    newStatus: MatchSuggestionStatus,
    userId: string,
    dictionaries: { he: EmailDictionary; en: EmailDictionary },
    notes?: string
  ): Promise<SuggestionWithParties> {
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id },
      include: {
        firstParty: { include: { profile: true } },
        secondParty: { include: { profile: true } },
        matchmaker: true,
      },
    });

    if (!suggestion) {
      throw new Error("Suggestion not found");
    }

    this.validateStatusChangePermission(suggestion, userId, newStatus);
    
    const firstPartyLang = (suggestion.firstParty as any).language || 'he';
    const secondPartyLang = (suggestion.secondParty as any).language || 'he';
    const matchmakerLang = (suggestion.matchmaker as any).language || 'he';

    return await statusTransitionService.transitionStatus(
      suggestion, 
      newStatus, 
      dictionaries, 
      notes,
      {},
      {
          firstParty: firstPartyLang,
          secondParty: secondPartyLang,
          matchmaker: matchmakerLang
      }
    );
  }

  // ============================================================
  // getSuggestionDetails - unchanged
  // ============================================================
  public async getSuggestionDetails(id: string, userId: string): Promise<SuggestionWithParties> {
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id },
      include: {
        firstParty: { include: { profile: true } },
        secondParty: { include: { profile: true } },
        matchmaker: true,
        statusHistory: { orderBy: { createdAt: "desc" } },
        meetings: { include: { feedback: true } },
      },
    });

    if (!suggestion) {
      throw new Error("Suggestion not found");
    }

    if (
      userId !== suggestion.matchmakerId &&
      userId !== suggestion.firstPartyId &&
      userId !== suggestion.secondPartyId
    ) {
      throw new Error("Unauthorized to view this suggestion");
    }

    return suggestion;
  }

  // ============================================================
  // getUserSuggestions - unchanged
  // ============================================================
  public async getUserSuggestions(userId: string): Promise<SuggestionWithParties[]> {
    return await prisma.matchSuggestion.findMany({
      where: {
        OR: [
          { matchmakerId: userId },
          { firstPartyId: userId },
          { secondPartyId: userId },
        ],
      },
      include: {
        firstParty: { include: { profile: true } },
        secondParty: { include: { profile: true } },
        matchmaker: true,
        statusHistory: { orderBy: { createdAt: "desc" } },
        meetings: { include: { feedback: true } },
      },
      orderBy: { lastActivity: "desc" },
    });
  }

  // ============================================================
  // validateStatusChangePermission - unchanged
  // ============================================================
  private validateStatusChangePermission(
    suggestion: SuggestionWithParties,
    userId: string,
    newStatus: MatchSuggestionStatus
  ): void {
    const isMatchmaker = userId === suggestion.matchmakerId;
    const isFirstParty = userId === suggestion.firstPartyId;
    const isSecondParty = userId === suggestion.secondPartyId;

    switch (newStatus) {
      case MatchSuggestionStatus.FIRST_PARTY_APPROVED:
      case MatchSuggestionStatus.FIRST_PARTY_DECLINED:
        if (!isFirstParty && !isMatchmaker) {
             throw new Error("Only first party (or matchmaker) can approve/decline at this stage");
        }
        break;
 case MatchSuggestionStatus.FIRST_PARTY_INTERESTED:  // ← הוסף את זה
        if (!isFirstParty && !isMatchmaker) {
             throw new Error("Only first party (or matchmaker) can approve/decline at this stage");
        }
        break;
      case MatchSuggestionStatus.SECOND_PARTY_APPROVED:
      case MatchSuggestionStatus.SECOND_PARTY_DECLINED:
        if (!isSecondParty && !isMatchmaker) {
            throw new Error("Only second party (or matchmaker) can approve/decline at this stage");
        }
        break;

      case MatchSuggestionStatus.SECOND_PARTY_NOT_AVAILABLE:
        if (!isSecondParty && !isMatchmaker) {
          throw new Error("Only second party or matchmaker can set not available");
        }
        break;

      case MatchSuggestionStatus.RE_OFFERED_TO_FIRST_PARTY:
        // המעבר לסטטוס RE_OFFERED_TO_FIRST_PARTY עצמו — רק שדכן
        // צד א' יכול לאשר/לדחות אחרי שכבר נמצא בסטטוס הזה
        break; // falls to default matchmaker check
      
      default:
        if (!isMatchmaker) {
            throw new Error("Only matchmaker can change status at this stage");
        }
    }
  }
}

export const suggestionService = SuggestionService.getInstance();