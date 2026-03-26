// src/lib/utils/suggestionUtils.ts

import type { MatchSuggestionStatus } from "@prisma/client";
import type { SuggestionsCardDict } from "@/types/dictionary";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  UserPlus,
  Heart,
  Handshake,
  Phone,
  Calendar,
  Brain,
  ArrowRight,
  Star,
  Gift,
  AlertTriangle,
  FileX,
  Ban,
  Bookmark,
  Pause,
  RefreshCw
} from "lucide-react";

export interface StatusWithPartyInfo {
  label: string;
  shortLabel: string;
  description: string;
  currentParty: "first" | "second" | "matchmaker" | "both" | "none";
  icon: React.ElementType;
  className: string;
  pulse: boolean;
  category: "pending" | "approved" | "declined" | "progress" | "completed" | "interested";
}

export function getEnhancedStatusInfo(
  status: MatchSuggestionStatus,
  isFirstParty: boolean = false,
  dict: SuggestionsCardDict
): StatusWithPartyInfo {
  const statusMap: Record<MatchSuggestionStatus, StatusWithPartyInfo> = {
    // --- Draft: Gray/Slate (Neutral) ---
    DRAFT: {
      label: "טיוטה בהכנה",
      shortLabel: "טיוטה",
      description: dict.statusDescriptions.draft,
      currentParty: "matchmaker",
      icon: FileText,
      className: "bg-gray-50 text-gray-700 border-gray-200",
      pulse: false,
      category: "pending"
    },

    // --- Pending First Party: Orange/Amber (Action Required) ---
    PENDING_FIRST_PARTY: {
      label: isFirstParty ? "ממתין לתשובתך" : "נשלח לצד הראשון",
      shortLabel: isFirstParty ? dict.statusIndicator.waitingForYou : dict.statusIndicator.firstParty,
      description: isFirstParty
        ? dict.statusDescriptions.pendingFirstPartyUser
        : dict.statusDescriptions.pendingFirstPartyOther,
      currentParty: "first",
      icon: Clock,
      className: "bg-orange-50 text-orange-700 border-orange-200",
      pulse: true,
      category: "pending"
    },

    // --- First Party Interested: Amber (Saved/Queued) ---
    FIRST_PARTY_INTERESTED: {
      label: isFirstParty
        ? (dict.statusLabels?.interested || "ממתין בתור")
        : (dict.statusLabels?.pending || "ממתין"),
      shortLabel: isFirstParty
        ? (dict.statusLabels?.interested || "ממתין בתור")
        : (dict.statusLabels?.pending || "ממתין"),
      description: isFirstParty
        ? (dict.statusDescriptions?.interestedFirstParty ||
          "ההצעה שמורה ברשימת ההמתנה שלך. תוכל/י לאשר אותה כשתהיה/י פנוי/ה.")
        : "",
      currentParty: isFirstParty ? "first" : "none",
      icon: isFirstParty ? Bookmark : Clock,
      className: isFirstParty
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-gray-50 text-gray-600 border-gray-200",
      pulse: false,
      category: "interested"
    },

    // --- First Party Approved: Teal/Emerald (Success) ---
    FIRST_PARTY_APPROVED: {
      label: isFirstParty ? "אישרת את ההצעה" : "הצד הראשון אישר",
      shortLabel: isFirstParty ? "אישרת" : `${dict.statusIndicator.firstParty} אישר`,
      description: isFirstParty
        ? dict.statusDescriptions.firstPartyApprovedUser
        : dict.statusDescriptions.firstPartyApprovedOther,
      currentParty: "matchmaker",
      icon: CheckCircle,
      className: "bg-teal-50 text-teal-700 border-teal-200",
      pulse: false,
      category: "approved"
    },

    // --- First Party Declined: Rose/Red (Declined) ---
    FIRST_PARTY_DECLINED: {
      label: isFirstParty ? "דחית את ההצעה" : "הצד הראשון דחה",
      shortLabel: isFirstParty ? "דחית" : `${dict.statusIndicator.firstParty} דחה`,
      description: isFirstParty
        ? dict.statusDescriptions.firstPartyDeclinedUser
        : dict.statusDescriptions.firstPartyDeclinedOther,
      currentParty: "none",
      icon: XCircle,
      className: "bg-rose-50 text-rose-700 border-rose-200",
      pulse: false,
      category: "declined"
    },

    // --- Pending Second Party: Orange/Amber (Action Required) ---
    PENDING_SECOND_PARTY: {
      label: isFirstParty ? "ההצעה נשלחה לצד השני" : "ממתין לתשובתך",
      shortLabel: isFirstParty ? dict.statusIndicator.secondParty : dict.statusIndicator.waitingForYou,
      description: isFirstParty
        ? dict.statusDescriptions.pendingSecondPartyUser
        : dict.statusDescriptions.pendingSecondPartyOther,
      currentParty: "second",
      icon: UserPlus,
      className: "bg-amber-50 text-amber-700 border-amber-200",
      pulse: true,
      category: "pending"
    },

    // ═══════════════════════════════════════════════════════════════
    // ✅ NEW: Second Party Not Available — Amber/Orange (On Hold)
    // ═══════════════════════════════════════════════════════════════
    SECOND_PARTY_NOT_AVAILABLE: {
      label: isFirstParty
        ? "ההצעה בהמתנה - לא רלוונטי כרגע"
        : "סימנת כלא זמין/ה",
      shortLabel: isFirstParty
        ? (dict.statusLabels?.onHold || "בהמתנה")
        : (dict.statusLabels?.youNotAvailable || "לא זמין/ה"),
      description: isFirstParty
        ? (dict.statusDescriptions?.secondPartyNotAvailableUser ||
          "הצד השני לא זמין כרגע. ההצעה תחזור כשיהיה זמין. בינתיים, תוכל/י לאשר הצעות אחרות.")
        : (dict.statusDescriptions?.secondPartyNotAvailableOther ||
          "סימנת שאת/ה לא זמין/ה כרגע. כשתחזור/י — ההצעה תחכה לך."),
      currentParty: isFirstParty ? "none" : "second",
      icon: Pause,
      className: "bg-amber-50 text-amber-700 border-amber-200",
      pulse: false,
      category: "pending"
    },

    // --- Second Party Approved: Teal/Emerald (Success) ---
    SECOND_PARTY_APPROVED: {
      label: isFirstParty ? "הצד השני אישר!" : "אישרת את ההצעה!",
      shortLabel: isFirstParty ? `${dict.statusIndicator.secondParty} אישר` : "אישרת",
      description: isFirstParty
        ? dict.statusDescriptions.secondPartyApprovedUser
        : dict.statusDescriptions.secondPartyApprovedOther,
      currentParty: "matchmaker",
      icon: Heart,
      className: "bg-teal-50 text-teal-700 border-teal-200",
      pulse: true,
      category: "approved"
    },

    // --- Second Party Declined: Rose/Red (Declined) ---
    SECOND_PARTY_DECLINED: {
      label: isFirstParty ? "הצד השני דחה" : "דחית את ההצעה",
      shortLabel: isFirstParty ? `${dict.statusIndicator.secondParty} דחה` : "דחית",
      description: isFirstParty
        ? dict.statusDescriptions.secondPartyDeclinedUser
        : dict.statusDescriptions.secondPartyDeclinedOther,
      currentParty: "none",
      icon: XCircle,
      className: "bg-rose-50 text-rose-700 border-rose-200",
      pulse: false,
      category: "declined"
    },

    // ═══════════════════════════════════════════════════════════════
    // ✅ NEW: Re-Offered to First Party — Blue (Re-ask)
    // ═══════════════════════════════════════════════════════════════
    RE_OFFERED_TO_FIRST_PARTY: {
      label: isFirstParty
        ? "ההצעה חזרה אליך!"
        : "ממתין לאישור מחדש מצד ראשון",
      shortLabel: isFirstParty
        ? (dict.statusLabels?.reOffered || "ההצעה חזרה!")
        : (dict.statusLabels?.waitingFirstPartyAgain || "אישור מחדש"),
      description: isFirstParty
        ? (dict.statusDescriptions?.reOfferedToFirstPartyUser ||
          "הצד השני חזר להיות זמין ואישר! האם ההצעה עדיין מתאימה לך?")
        : (dict.statusDescriptions?.reOfferedToFirstPartyOther ||
          "ההצעה נשלחה מחדש לצד הראשון לאישור."),
      currentParty: "first",
      icon: RefreshCw,
      className: isFirstParty
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : "bg-gray-50 text-gray-600 border-gray-200",
      pulse: isFirstParty,
      category: "pending"
    },

    // --- Awaiting Matchmaker: Teal (Matchmaker Action) ---
    AWAITING_MATCHMAKER_APPROVAL: {
      label: "ממתין לאישור השדכן",
      shortLabel: `אישור ${dict.statusIndicator.matchmaker}`,
      description: dict.statusDescriptions.awaitingMatchmakerApproval,
      currentParty: "matchmaker",
      icon: Handshake,
      className: "bg-teal-50 text-teal-700 border-teal-200",
      pulse: true,
      category: "pending"
    },

    // --- Contact Shared: Teal/Emerald (Progress) ---
    CONTACT_DETAILS_SHARED: {
      label: "פרטי קשר שותפו",
      shortLabel: "פרטים שותפו",
      description: dict.statusDescriptions.contactDetailsShared,
      currentParty: "both",
      icon: Phone,
      className: "bg-teal-50 text-teal-700 border-teal-200",
      pulse: false,
      category: "progress"
    },

    // --- Awaiting Feedback: Orange/Amber (Action) ---
    AWAITING_FIRST_DATE_FEEDBACK: {
      label: "ממתין למשוב פגישה",
      shortLabel: "משוב פגישה",
      description: dict.statusDescriptions.awaitingFirstDateFeedback,
      currentParty: "both",
      icon: Calendar,
      className: "bg-orange-50 text-orange-700 border-orange-200",
      pulse: true,
      category: "pending"
    },

    // --- Thinking: Orange/Amber (Pending Decision) ---
    THINKING_AFTER_DATE: {
      label: "בחשיבה לאחר הפגישה",
      shortLabel: "בחשיבה",
      description: dict.statusDescriptions.thinkingAfterDate,
      currentParty: "both",
      icon: Brain,
      className: "bg-amber-50 text-amber-700 border-amber-200",
      pulse: false,
      category: "pending"
    },

    // --- Second Date: Emerald/Teal (Progress) ---
    PROCEEDING_TO_SECOND_DATE: {
      label: "ממשיכים לפגישה שנייה",
      shortLabel: "פגישה שנייה",
      description: dict.statusDescriptions.proceedingToSecondDate,
      currentParty: "both",
      icon: ArrowRight,
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      pulse: false,
      category: "progress"
    },

    // --- Ended After First Date: Gray/Slate (Completed) ---
    ENDED_AFTER_FIRST_DATE: {
      label: "הסתיים לאחר פגישה ראשונה",
      shortLabel: "הסתיים",
      description: dict.statusDescriptions.endedAfterFirstDate,
      currentParty: "none",
      icon: XCircle,
      className: "bg-gray-50 text-gray-700 border-gray-200",
      pulse: false,
      category: "completed"
    },

    // --- Meeting Pending: Orange/Amber (Action) ---
    MEETING_PENDING: {
      label: "פגישה בהמתנה",
      shortLabel: "פגישה ממתינה",
      description: dict.statusDescriptions.meetingPending,
      currentParty: "matchmaker",
      icon: Clock,
      className: "bg-orange-50 text-orange-700 border-orange-200",
      pulse: true,
      category: "pending"
    },

    // --- Meeting Scheduled: Teal/Emerald (Progress) ---
    MEETING_SCHEDULED: {
      label: "פגישה קבועה",
      shortLabel: "פגישה קבועה",
      description: dict.statusDescriptions.meetingScheduled,
      currentParty: "both",
      icon: Calendar,
      className: "bg-teal-50 text-teal-700 border-teal-200",
      pulse: false,
      category: "progress"
    },

    // --- Match Approved: Teal/Emerald (Success) ---
    MATCH_APPROVED: {
      label: "השידוך אושר",
      shortLabel: "אושר",
      description: dict.statusDescriptions.matchApproved,
      currentParty: "both",
      icon: CheckCircle,
      className: "bg-teal-50 text-teal-700 border-teal-200",
      pulse: false,
      category: "approved"
    },

    // --- Match Declined: Rose/Red (Declined) ---
    MATCH_DECLINED: {
      label: "השידוך נדחה",
      shortLabel: "נדחה",
      description: dict.statusDescriptions.matchDeclined,
      currentParty: "none",
      icon: XCircle,
      className: "bg-rose-50 text-rose-700 border-rose-200",
      pulse: false,
      category: "declined"
    },

    // --- Dating: Rose/Pink (Romance/Personal) ---
    DATING: {
      label: "בתהליך היכרות",
      shortLabel: "בהיכרות",
      description: dict.statusDescriptions.dating,
      currentParty: "both",
      icon: Heart,
      className: "bg-rose-50 text-rose-700 border-rose-200",
      pulse: false,
      category: "progress"
    },

    // --- Engaged: Orange/Amber (Celebration) ---
    ENGAGED: {
      label: "אירוסין! 💍",
      shortLabel: "מאורסים",
      description: dict.statusDescriptions.engaged,
      currentParty: "both",
      icon: Star,
      className: "bg-orange-50 text-orange-700 border-orange-200",
      pulse: true,
      category: "completed"
    },

    // --- Married: Teal/Orange Gradient (Ultimate Success) ---
    MARRIED: {
      label: "נישואין! 🎉",
      shortLabel: "נשואים",
      description: dict.statusDescriptions.married,
      currentParty: "both",
      icon: Gift,
      className: "bg-teal-50 text-teal-700 border-teal-200",
      pulse: true,
      category: "completed"
    },

    // --- Expired: Gray/Slate (Inactive) ---
    EXPIRED: {
      label: "פג תוקף",
      shortLabel: "פג תוקף",
      description: dict.statusDescriptions.expired,
      currentParty: "none",
      icon: AlertTriangle,
      className: "bg-gray-50 text-gray-700 border-gray-200",
      pulse: false,
      category: "completed"
    },

    // --- Closed: Gray/Slate (Inactive) ---
    CLOSED: {
      label: "ההצעה נסגרה",
      shortLabel: "נסגרה",
      description: dict.statusDescriptions.closed,
      currentParty: "none",
      icon: FileX,
      className: "bg-slate-50 text-slate-700 border-slate-200",
      pulse: false,
      category: "completed"
    },

    // --- Cancelled: Gray/Slate (Inactive) ---
    CANCELLED: {
      label: "ההצעה בוטלה",
      shortLabel: "בוטלה",
      description: dict.statusDescriptions.cancelled,
      currentParty: "none",
      icon: Ban,
      className: "bg-gray-50 text-gray-700 border-gray-200",
      pulse: false,
      category: "completed"
    }
  };

  return statusMap[status];
}

// Helper function to get party indicator
// Updated to Teal/Orange/Rose palette
export function getPartyIndicator(
  status: MatchSuggestionStatus,
  isFirstParty: boolean,
  dict: SuggestionsCardDict
): {
  show: boolean;
  text: string;
  className: string;
} {
  const statusInfo = getEnhancedStatusInfo(status, isFirstParty, dict);

  // Special handling for FIRST_PARTY_INTERESTED
  if (status === "FIRST_PARTY_INTERESTED") {
    if (isFirstParty) {
      return {
        show: true,
        text: dict.partyIndicators?.interestedSaved || "שמרת לגיבוי",
        className: "bg-amber-500 text-white"
      };
    }
    return {
      show: false,
      text: "",
      className: ""
    };
  }

  // ✅ NEW: Special handling for SECOND_PARTY_NOT_AVAILABLE
  if (status === "SECOND_PARTY_NOT_AVAILABLE") {
    return {
      show: true,
      text: isFirstParty
        ? (dict.partyIndicators?.onHold || "בהמתנה")
        : (dict.partyIndicators?.youNotAvailable || "לא זמין/ה"),
      className: "bg-amber-500 text-white"
    };
  }

  // ✅ NEW: Special handling for RE_OFFERED_TO_FIRST_PARTY
  if (status === "RE_OFFERED_TO_FIRST_PARTY") {
    if (isFirstParty) {
      return {
        show: true,
        text: dict.partyIndicators?.reOffered || "ההצעה חזרה!",
        className: "bg-blue-500 text-white"
      };
    }
    return {
      show: true,
      text: dict.partyIndicators?.waitingFirstPartyAgain || "ממתין לצד ראשון",
      className: "bg-gray-400 text-white"
    };
  }

  switch (statusInfo.currentParty) {
    // First Party: Orange (Action Required)
    case "first":
      return {
        show: true,
        text: isFirstParty ? dict.statusIndicator.yourTurn : dict.statusIndicator.firstParty,
        className: "bg-orange-500 text-white"
      };
    // Second Party: Amber (Action Required)
    case "second":
      return {
        show: true,
        text: isFirstParty ? dict.statusIndicator.secondParty : dict.statusIndicator.yourTurn,
        className: "bg-amber-500 text-white"
      };
    // Matchmaker: Teal (Processing)
    case "matchmaker":
      return {
        show: true,
        text: dict.statusIndicator.matchmaker,
        className: "bg-teal-500 text-white"
      };
    // Both Parties: Teal to Orange Gradient (Shared)
    case "both":
      return {
        show: true,
        text: dict.statusIndicator.bothParties,
        className: "bg-teal-600 text-white"
      };
    default:
      return {
        show: false,
        text: "",
        className: ""
      };
  }
}