import { MatchSuggestionStatus, Priority, User, UserRole, Profile } from "@prisma/client";
import prisma from "@/lib/prisma";
import { statusTransitionService, type SuggestionWithParties } from "./StatusTransitionService";
import { emailService } from "../email/EmailService";
import type { 
  CreateSuggestionData,
  UpdateSuggestionData,
  Suggestion
} from "@/types/suggestions";

type UserWithProfile = User & {
  profile: Profile | null;
};

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
   */
  public async createSuggestion(data: CreateSuggestionData): Promise<SuggestionWithParties> {
    // 1. וידוא הרשאות השדכן
    const matchmaker = await prisma.user.findUnique({
      where: { id: data.matchmakerId },
    });

    if (!matchmaker || matchmaker.role !== UserRole.MATCHMAKER) {
      throw new Error("Unauthorized - User is not a matchmaker");
    }

  /*   // 2. בדיקת זמינות המועמדים
    const [firstParty, secondParty] = await Promise.all([
      prisma.user.findUnique({
        where: { id: data.firstPartyId },
        include: { profile: true },
      }),
      prisma.user.findUnique({
        where: { id: data.secondPartyId },
        include: { profile: true },
      }),
    ]); 

    if (!firstParty || !secondParty) {
      throw new Error("One or both parties not found");
    }

    if (
      firstParty.profile?.availabilityStatus !== "AVAILABLE" ||
      secondParty.profile?.availabilityStatus !== "AVAILABLE"
    ) {
      throw new Error("One or both parties are not available for matching");
    } 
 */
  /*   // 3. בדיקת הצעות קיימות
    const existingSuggestion = await this.checkExistingSuggestion(
      data.firstPartyId,
      data.secondPartyId
    );

    if (existingSuggestion) {
      throw new Error("Active suggestion already exists between these parties");
    }
 */
    // 4. יצירת ההצעה בטרנזקציה
    const suggestion = await prisma.$transaction(async (tx) => {
      // יצירת ההצעה עם הנתונים המנוקים
      console.log('Decision deadline value:', data.decisionDeadline);
console.log('Decision deadline type:', typeof data.decisionDeadline);
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
          firstParty: {
            include: { profile: true }
          },
          secondParty: {
            include: { profile: true }
          },
          matchmaker: true,
        },
      });

      // יצירת רשומת היסטוריה ראשונית
      await tx.suggestionStatusHistory.create({
        data: {
          suggestionId: newSuggestion.id,
          status: newSuggestion.status,
          notes: "Initial suggestion created and sent to first party",
        },
      });

      return newSuggestion;
    });

    // 5. שליחת התראות מייל
    console.log('email:------------');
    await emailService.handleSuggestionStatusChange(
      suggestion,
      MatchSuggestionStatus.DRAFT
    );

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
    // 1. בדיקת קיום ההצעה והרשאות
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id },
      include: {
        firstParty: {
          include: { profile: true }
        },
        secondParty: {
          include: { profile: true }
        },
        matchmaker: true,
      },
    });

    if (!suggestion) {
      throw new Error("Suggestion not found");
    }

    if (suggestion.matchmakerId !== matchmakerId) {
      throw new Error("Unauthorized - Only the original matchmaker can update the suggestion");
    }

    // 2. ניקוי והכנת נתוני העדכון
    const cleanedUpdateData = {
      ...(data.notes?.matchingReason !== undefined && { 
        matchingReason: data.notes.matchingReason 
      }),
      ...(data.notes?.forFirstParty !== undefined && { 
        firstPartyNotes: data.notes.forFirstParty 
      }),
      ...(data.notes?.forSecondParty !== undefined && { 
        secondPartyNotes: data.notes.forSecondParty 
      }),
      ...(data.notes?.internal !== undefined && { 
        internalNotes: data.notes.internal 
      }),
      ...(data.notes?.followUpNotes !== undefined && { 
        followUpNotes: data.notes.followUpNotes 
      }),
      ...(data.priority && { priority: data.priority }),
      ...(data.responseDeadline && { 
        responseDeadline: new Date(data.responseDeadline) 
      }),
      ...(data.decisionDeadline && { 
        decisionDeadline: new Date(data.decisionDeadline) 
      }),
      lastActivity: new Date()
    };

    // 3. עדכון הנתונים
    return await prisma.matchSuggestion.update({
      where: { id },
      data: cleanedUpdateData,
      include: {
        firstParty: {
          include: { profile: true }
        },
        secondParty: {
          include: { profile: true }
        },
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
        firstParty: {
          include: { profile: true }
        },
        secondParty: {
          include: { profile: true }
        },
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
        firstParty: {
          include: { profile: true }
        },
        secondParty: {
          include: { profile: true }
        },
        matchmaker: true,
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
        meetings: {
          include: {
            feedback: true
          }
        },
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
        firstParty: {
          include: { profile: true }
        },
        secondParty: {
          include: { profile: true }
        },
        matchmaker: true,
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
        meetings: {
          include: {
            feedback: true
          }
        },
      },
      orderBy: {
        lastActivity: "desc",
      },
    });
  }

  /**
   * אימות הרשאות לשינוי סטטוס
   */
  private validateStatusChangePermission(
    suggestion: Suggestion,
    userId: string,
    newStatus: MatchSuggestionStatus
  ): void {
    const isMatchmaker = userId === suggestion.matchmakerId;
    const isFirstParty = userId === suggestion.firstPartyId;
    const isSecondParty = userId === suggestion.secondPartyId;

    switch (newStatus) {
      case MatchSuggestionStatus.FIRST_PARTY_APPROVED:
      case MatchSuggestionStatus.FIRST_PARTY_DECLINED:
        if (!isFirstParty) throw new Error("Only first party can approve/decline at this stage");
        break;

      case MatchSuggestionStatus.SECOND_PARTY_APPROVED:
      case MatchSuggestionStatus.SECOND_PARTY_DECLINED:
        if (!isSecondParty) throw new Error("Only second party can approve/decline at this stage");
        break;

      case MatchSuggestionStatus.CANCELLED:
        if (!isMatchmaker && !isFirstParty && !isSecondParty) {
          throw new Error("Only involved parties can cancel the suggestion");
        }
        break;

      default:
        if (!isMatchmaker) throw new Error("Only matchmaker can change status at this stage");
    }
  }

  /**
   * בדיקת קיום הצעה פעילה בין שני מועמדים
   */
  private async checkExistingSuggestion(
    firstPartyId: string,
    secondPartyId: string
  ): Promise<Suggestion | null> {
    return await prisma.matchSuggestion.findFirst({
      where: {
        AND: [
          {
            OR: [
              { firstPartyId, secondPartyId },
              { firstPartyId: secondPartyId, secondPartyId: firstPartyId },
            ],
          },
          {
            status: {
              notIn: [
                MatchSuggestionStatus.CLOSED,
                MatchSuggestionStatus.CANCELLED,
                MatchSuggestionStatus.EXPIRED,
                MatchSuggestionStatus.MATCH_DECLINED,
              ],
            },
          },
        ],
      },
    });
  }
}

export const suggestionService = SuggestionService.getInstance();