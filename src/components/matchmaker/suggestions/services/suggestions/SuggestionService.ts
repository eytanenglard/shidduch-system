// src/components/matchmaker/suggestions/services/suggestions/SuggestionService.ts

import { MatchSuggestionStatus, Priority, UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { statusTransitionService, type SuggestionWithParties } from "./StatusTransitionService";
import { initNotificationService } from "../notification/initNotifications";
import type { 
  CreateSuggestionData,
  UpdateSuggestionData,
} from "@/types/suggestions";
// ========================= שינוי מרכזי 1: ייבוא טיפוס המילון =========================
import type { EmailDictionary } from "@/types/dictionary";

// Initialize notification service
const notificationService = initNotificationService();
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

  /**
   * יצירת הצעת שידוך חדשה
   * ========================= שינוי מרכזי 2: עדכון חתימת הפונקציה =========================
   * הפונקציה מקבלת כעת את אובייקט תרגומי המיילים כפרמטר נוסף
   */
  public async createSuggestion(
    data: CreateSuggestionData,
    dictionary: EmailDictionary 
  ): Promise<SuggestionWithParties> {
    // 1. וידוא הרשאות השדכן
    const matchmaker = await prisma.user.findUnique({
      where: { id: data.matchmakerId },
    });

    const allowedRoles: UserRole[] = [UserRole.MATCHMAKER, UserRole.ADMIN];
    if (!matchmaker || !allowedRoles.includes(matchmaker.role)) {
      throw new Error("Unauthorized - User must be a Matchmaker or Admin");
    }
  
    // 2. בדיקה אם קיימת הצעה פעילה
    const [firstParty, secondParty] = await Promise.all([
        prisma.user.findUnique({ where: { id: data.firstPartyId } }),
        prisma.user.findUnique({ where: { id: data.secondPartyId } })
    ]);

    if (!firstParty || !secondParty) {
        throw new Error("One or both candidates not found.");
    }
    
    const blockingSuggestion = await prisma.matchSuggestion.findFirst({
        where: {
            OR: [
                { firstPartyId: data.firstPartyId },
                { secondPartyId: data.firstPartyId },
                { firstPartyId: data.secondPartyId },
                { secondPartyId: data.secondPartyId },
            ],
            status: {
                in: BLOCKING_SUGGESTION_STATUSES,
            },
        },
    });

    if (blockingSuggestion) {
        const hasBlockingSuggestion = (id: string) => 
            blockingSuggestion.firstPartyId === id || blockingSuggestion.secondPartyId === id;
            
        if (hasBlockingSuggestion(data.firstPartyId)) {
            throw new Error(`לא ניתן ליצור הצעה חדשה. ל${firstParty.firstName} ${firstParty.lastName} יש כבר הצעה פעילה.`);
        }
        if (hasBlockingSuggestion(data.secondPartyId)) {
            throw new Error(`לא ניתן ליצור הצעה חדשה. ל${secondParty.firstName} ${secondParty.lastName} יש כבר הצעה פעילה.`);
        }
    }

    // 3. יצירת ההצעה בטרנזקציה
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

    // 4. שליחת התראות
    try {
      console.log('Sending notifications for new suggestion...');
      // ========================= שינוי מרכזי 3: תיקון הקריאה לשירות ההתראות =========================
      await notificationService.handleSuggestionStatusChange(
        suggestion,
        dictionary, // <-- הארגומנט השני הוא המילון
        { // <-- הארגומנט השלישי הוא אובייקט ההגדרות
          channels: ['email', 'whatsapp'],
          notifyParties: ['first']
        }
      );
    } catch (error) {
      console.error('Error sending initial suggestion notifications:', error);
    }

    return suggestion;
  }

  /**
   * עדכון פרטי הצעת שידוך
   */
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

    if (suggestion.matchmakerId !== matchmakerId) {
      throw new Error("Unauthorized - Only the original matchmaker can update the suggestion");
    }

    const cleanedUpdateData = {
      ...(data.notes?.matchingReason !== undefined && { matchingReason: data.notes.matchingReason }),
      ...(data.notes?.forFirstParty !== undefined && { firstPartyNotes: data.notes.forFirstParty }),
      ...(data.notes?.forSecondParty !== undefined && { secondPartyNotes: data.notes.forSecondParty }),
      ...(data.notes?.internal !== undefined && { internalNotes: data.notes.internal }),
      ...(data.notes?.followUpNotes !== undefined && { followUpNotes: data.notes.followUpNotes }),
      ...(data.priority && { priority: data.priority }),
      ...(data.responseDeadline && { responseDeadline: new Date(data.responseDeadline) }),
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

  /**
   * עדכון סטטוס של הצעת שידוך
   */
  public async updateSuggestionStatus(
    id: string,
    newStatus: MatchSuggestionStatus,
    userId: string,
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
    return await statusTransitionService.transitionStatus(suggestion, newStatus, notes);
  }

  /**
   * קבלת פרטי הצעת שידוך
   */
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

  /**
   * קבלת רשימת הצעות שידוך של משתמש
   */
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

  /**
   * אימות הרשאות לשינוי סטטוס
   */
  private validateStatusChangePermission(
    suggestion: SuggestionWithParties,
    userId: string,
    newStatus: MatchSuggestionStatus
  ): void {
    const isMatchmaker = userId === suggestion.matchmakerId;
    const isFirstParty = userId === suggestion.firstPartyId;

    switch (newStatus) {
      case MatchSuggestionStatus.FIRST_PARTY_APPROVED:
      case MatchSuggestionStatus.FIRST_PARTY_DECLINED:
        if (!isFirstParty) throw new Error("Only first party can approve/decline at this stage");
        break;

      default:
        if (!isMatchmaker) throw new Error("Only matchmaker can change status at this stage");
    }
  }
}

export const suggestionService = SuggestionService.getInstance();