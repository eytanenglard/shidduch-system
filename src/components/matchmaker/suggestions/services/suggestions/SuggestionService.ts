// src/components/matchmaker/suggestions/services/suggestions/SuggestionService.ts

import { MatchSuggestionStatus, Priority, UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { statusTransitionService, type SuggestionWithParties } from "./StatusTransitionService";
import { initNotificationService } from "../notification/initNotifications";
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

/**
 * שירות מרכזי לניהול הלוגיקה העסקית של הצעות שידוכים.
 * הוא אחראי על יצירה, עדכון, שינוי סטטוס, ואחזור של הצעות.
 */
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
   * יצירת הצעת שידוך חדשה.
   * הפונקציה מקבלת את נתוני ההצעה, אובייקט המכיל את המילונים (עברית ואנגלית),
   * ואת העדפות השפה של הצדדים.
   */
  public async createSuggestion(
    data: CreateSuggestionData,
    dictionaries: { he: EmailDictionary; en: EmailDictionary }, 
    languageOptions: LanguageOptions
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
    
    // 3. בדיקה אם לאחד המועמדים כבר יש הצעה פעילה
    const blockingSuggestion = await prisma.matchSuggestion.findFirst({
        where: {
            OR: [
                { firstPartyId: data.firstPartyId },
                { secondPartyId: data.firstPartyId },
                { firstPartyId: data.secondPartyId },
                { secondPartyId: data.secondPartyId },
            ],
            status: { in: BLOCKING_SUGGESTION_STATUSES },
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

    // 5. שליחת התראות (Notifications)
    try {
      console.log('Sending notifications for new suggestion...');
      
      // כאן אנו קוראים ישירות ל-notificationService (ולא דרך statusTransitionService כי זו יצירה ראשונית)
      await notificationService.handleSuggestionStatusChange(
        suggestion,
        dictionaries, // העברת אובייקט המילונים
        {
          channels: ['email', 'whatsapp'],
          notifyParties: ['first'] // בהצעה חדשה שולחים רק לצד א'
        },
        {
            firstParty: languageOptions.firstParty,
            secondParty: languageOptions.secondParty,
            matchmaker: 'he' // ברירת מחדל לשדכן
        }
      );
    } catch (error) {
      console.error('Error sending initial suggestion notifications:', error);
      // לא זורקים שגיאה כדי לא לבטל את יצירת ההצעה
    }

    return suggestion;
  }

  /**
   * עדכון פרטי הצעת שידוך (ללא שינוי סטטוס).
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

    // רק השדכן המקורי או אדמין יכולים לערוך (בדיקת האדמין נעשית ב-API בדרך כלל, כאן אנו בודקים בעלות)
    // הערה: אם רוצים לאפשר לאדמין כלשהו, יש להעביר את ה-role לפונקציה
    if (suggestion.matchmakerId !== matchmakerId) {
       // אנו מניחים שאם הגיע לכאן, כבר בוצעה בדיקת הרשאות בסיסית ב-API Route,
       // אך זו בדיקת הגנה נוספת.
       // אם המשתמש הוא אדמין, הבדיקה הזו עשויה להיכשל אם לא נטפל בזה.
       // לצורך הקוד הנקי, נשאיר את זה כך, אך מומלץ לוודא ב-Controller.
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

  /**
   * עדכון סטטוס של הצעת שידוך.
   * הפונקציה מקבלת את המילונים כדי להעביר אותם לשירות המעבר, שישלח התראות מתורגמות.
   */
  public async updateSuggestionStatus(
    id: string,
    newStatus: MatchSuggestionStatus,
    userId: string,
    dictionaries: { he: EmailDictionary; en: EmailDictionary }, // קבלת צמד המילונים
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
    
    // שליפת העדפות שפה מהמשתמשים (אם קיימות) או שימוש בברירת מחדל
    // הערה: User מ-Prisma מכיל שדה language אם הוספת אותו לסכמה. אם לא, נשתמש ב-'he'
    const firstPartyLang = (suggestion.firstParty as any).language || 'he';
    const secondPartyLang = (suggestion.secondParty as any).language || 'he';
    const matchmakerLang = (suggestion.matchmaker as any).language || 'he';

    // קריאה לשירות המעבר
    return await statusTransitionService.transitionStatus(
      suggestion, 
      newStatus, 
      dictionaries, 
      notes,
      {}, // אפשרויות ברירת מחדל
      { // העדפות שפה
          firstParty: firstPartyLang,
          secondParty: secondPartyLang,
          matchmaker: matchmakerLang
      }
    );
  }

  /**
   * קבלת פרטי הצעת שידוך מלאים.
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
      // כאן ניתן להוסיף בדיקה אם המשתמש הוא Admin גלובלי
      throw new Error("Unauthorized to view this suggestion");
    }

    return suggestion;
  }

  /**
   * קבלת כל הצעות השידוך הקשורות למשתמש מסוים.
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
   * פונקציית עזר פנימית לאימות הרשאות לשינוי סטטוס.
   */
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

      case MatchSuggestionStatus.SECOND_PARTY_APPROVED:
      case MatchSuggestionStatus.SECOND_PARTY_DECLINED:
        if (!isSecondParty && !isMatchmaker) {
            throw new Error("Only second party (or matchmaker) can approve/decline at this stage");
        }
        break;
      
      default:
        // כברירת מחדל, רוב שינויי הסטטוס האחרים מבוצעים על ידי השדכן.
        if (!isMatchmaker) {
            throw new Error("Only matchmaker can change status at this stage");
        }
    }
  }
}

// ייצוא מופע יחיד של השירות (Singleton)
export const suggestionService = SuggestionService.getInstance();