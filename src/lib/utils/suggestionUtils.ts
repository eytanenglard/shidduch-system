// src/lib/utils/suggestionUtils.ts

import type { MatchSuggestionStatus } from "@prisma/client";

export interface StatusWithPartyInfo {
  label: string;
  shortLabel: string;
  description: string;
  currentParty: "first" | "second" | "matchmaker" | "both" | "none";
  icon: React.ElementType;
  className: string;
  pulse: boolean;
  category: "pending" | "approved" | "declined" | "progress" | "completed";
}

export function getEnhancedStatusInfo(
  status: MatchSuggestionStatus,
  isFirstParty: boolean = false
): StatusWithPartyInfo {
  const statusMap: Record<MatchSuggestionStatus, StatusWithPartyInfo> = {
    DRAFT: {
      label: "טיוטה בהכנה",
      shortLabel: "טיוטה",
      description: "השדכן/ית מכין/ה את ההצעה",
      currentParty: "matchmaker",
      icon: require("lucide-react").FileText,
      className: "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-200",
      pulse: false,
      category: "pending"
    },
    
    PENDING_FIRST_PARTY: {
      label: isFirstParty ? "ממתין לתשובתך" : "נשלח לצד הראשון",
      shortLabel: isFirstParty ? "ממתין לך" : "צד ראשון",
      description: isFirstParty 
        ? "ההצעה מחכה להחלטתך - אשר או דחה"
        : "השדכן שלח את ההצעה לצד הראשון וממתין לתשובה",
      currentParty: "first",
      icon: require("lucide-react").Clock,
      className: "bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 border-purple-200",
      pulse: true,
      category: "pending"
    },

    FIRST_PARTY_APPROVED: {
      label: isFirstParty ? "אישרת את ההצעה" : "הצד הראשון אישר",
      shortLabel: isFirstParty ? "אישרת" : "צד ראשון אישר",
      description: isFirstParty
        ? "אישרת את ההצעה - עכשיו ההצעה תשלח לצד השני"
        : "הצד הראשון אישר את ההצעה בהתלהבות",
      currentParty: "matchmaker",
      icon: require("lucide-react").CheckCircle,
      className: "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200",
      pulse: false,
      category: "approved"
    },

    FIRST_PARTY_DECLINED: {
      label: isFirstParty ? "דחית את ההצעה" : "הצד הראשון דחה",
      shortLabel: isFirstParty ? "דחית" : "צד ראשון דחה",
      description: isFirstParty
        ? "דחית את ההצעה - תודה על המשוב הכן"
        : "הצד הראשון החליט שההצעה לא מתאימה",
      currentParty: "none",
      icon: require("lucide-react").XCircle,
      className: "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200",
      pulse: false,
      category: "declined"
    },

    PENDING_SECOND_PARTY: {
      label: isFirstParty ? "ההצעה נשלחה לצד השני" : "ממתין לתשובתך",
      shortLabel: isFirstParty ? "צד שני" : "ממתין לך",
      description: isFirstParty
        ? "הצד השני בודק את ההצעה - נעדכן אותך כשיגיע המשוב"
        : "ההצעה מחכה להחלטתך - אשר או דחה",
      currentParty: "second",
      icon: require("lucide-react").UserPlus,
      className: "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-blue-200",
      pulse: true,
      category: "pending"
    },

    SECOND_PARTY_APPROVED: {
      label: isFirstParty ? "הצד השני אישר!" : "אישרת את ההצעה!",
      shortLabel: isFirstParty ? "צד שני אישר" : "אישרת",
      description: isFirstParty
        ? "הצד השני גם מעוניין - בקרוב תקבלו פרטי קשר"
        : "אישרת את ההצעה - בקרוב תקבלו פרטי קשר",
      currentParty: "matchmaker",
      icon: require("lucide-react").Heart,
      className: "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200",
      pulse: true,
      category: "approved"
    },

    SECOND_PARTY_DECLINED: {
      label: isFirstParty ? "הצד השני דחה" : "דחית את ההצעה",
      shortLabel: isFirstParty ? "צד שני דחה" : "דחית",
      description: isFirstParty
        ? "הצד השני החליט שההצעה לא מתאימה"
        : "דחית את ההצעה - תודה על המשוב הכן",
      currentParty: "none",
      icon: require("lucide-react").XCircle,
      className: "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200",
      pulse: false,
      category: "declined"
    },

    AWAITING_MATCHMAKER_APPROVAL: {
      label: "ממתין לאישור השדכן",
      shortLabel: "אישור שדכן",
      description: "שני הצדדים אישרו - השדכן/ית יאשר שיתוף פרטים",
      currentParty: "matchmaker",
      icon: require("lucide-react").Handshake,
      className: "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200",
      pulse: true,
      category: "pending"
    },

    CONTACT_DETAILS_SHARED: {
      label: "פרטי קשר שותפו",
      shortLabel: "פרטים שותפו",
      description: "פרטי הקשר של שניכם נשלחו - זמן ליצור קשר!",
      currentParty: "both",
      icon: require("lucide-react").Phone,
      className: "bg-gradient-to-r from-cyan-50 to-emerald-50 text-cyan-700 border-cyan-200",
      pulse: false,
      category: "progress"
    },

    AWAITING_FIRST_DATE_FEEDBACK: {
      label: "ממתין למשוב פגישה",
      shortLabel: "משוב פגישה",
      description: "כיף שנפגשתם! נשמח לשמוע איך עבר",
      currentParty: "both",
      icon: require("lucide-react").Calendar,
      className: "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200",
      pulse: true,
      category: "pending"
    },

    THINKING_AFTER_DATE: {
      label: "בחשיבה לאחר הפגישה",
      shortLabel: "בחשיבה",
      description: "זמן לעכל את הפגישה ולהחליט על המשך",
      currentParty: "both",
      icon: require("lucide-react").Brain,
      className: "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-blue-200",
      pulse: false,
      category: "pending"
    },

    PROCEEDING_TO_SECOND_DATE: {
      label: "ממשיכים לפגישה שנייה",
      shortLabel: "פגישה שנייה",
      description: "נהדר! שניכם רוצים להמשיך להכיר",
      currentParty: "both",
      icon: require("lucide-react").ArrowRight,
      className: "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200",
      pulse: false,
      category: "progress"
    },

    ENDED_AFTER_FIRST_DATE: {
      label: "הסתיים לאחר פגישה ראשונה",
      shortLabel: "הסתיים",
      description: "החלטתם שלא להמשיך - זה בסדר גמור",
      currentParty: "none",
      icon: require("lucide-react").XCircle,
      className: "bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-200",
      pulse: false,
      category: "completed"
    },

    MEETING_PENDING: {
      label: "פגישה בהמתנה",
      shortLabel: "פגישה ממתינה",
      description: "השדכן/ית מתאם פגישה ראשונה",
      currentParty: "matchmaker",
      icon: require("lucide-react").Clock,
      className: "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-blue-200",
      pulse: true,
      category: "pending"
    },

    MEETING_SCHEDULED: {
      label: "פגישה קבועה",
      shortLabel: "פגישה קבועה",
      description: "הפגישה הראשונה נקבעה - בהצלחה!",
      currentParty: "both",
      icon: require("lucide-react").Calendar,
      className: "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200",
      pulse: false,
      category: "progress"
    },

    MATCH_APPROVED: {
      label: "השידוך אושר",
      shortLabel: "אושר",
      description: "השידוך אושר רשמית - מזל טוב!",
      currentParty: "both",
      icon: require("lucide-react").CheckCircle,
      className: "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200",
      pulse: false,
      category: "approved"
    },

    MATCH_DECLINED: {
      label: "השידוך נדחה",
      shortLabel: "נדחה",
      description: "השידוך לא קיבל אישור להמשך",
      currentParty: "none",
      icon: require("lucide-react").XCircle,
      className: "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200",
      pulse: false,
      category: "declined"
    },

    DATING: {
      label: "בתהליך היכרות",
      shortLabel: "בהיכרות",
      description: "שניכם נמצאים בתהליך היכרות פעיל",
      currentParty: "both",
      icon: require("lucide-react").Heart,
      className: "bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 border-pink-200",
      pulse: false,
      category: "progress"
    },

    ENGAGED: {
      label: "אירוסין! 💍",
      shortLabel: "מאורסים",
      description: "מזל טוב על האירוסין! איזה שמחה",
      currentParty: "both",
      icon: require("lucide-react").Star,
      className: "bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border-yellow-200",
      pulse: true,
      category: "completed"
    },

    MARRIED: {
      label: "נישואין! 🎉",
      shortLabel: "נשואים",
      description: "מזל טוב על החתונה! איזה הצלחה",
      currentParty: "both",
      icon: require("lucide-react").Gift,
      className: "bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border-rose-200",
      pulse: true,
      category: "completed"
    },

    EXPIRED: {
      label: "פג תוקף",
      shortLabel: "פג תוקף",
      description: "ההצעה פגה מפאת אי מענה",
      currentParty: "none",
      icon: require("lucide-react").AlertTriangle,
      className: "bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-200",
      pulse: false,
      category: "completed"
    },

    CLOSED: {
      label: "ההצעה נסגרה",
      shortLabel: "נסגרה",
      description: "התהליך הסתיים והקובץ נסגר",
      currentParty: "none",
      icon: require("lucide-react").FileX,
      className: "bg-gradient-to-r from-slate-50 to-gray-50 text-slate-700 border-slate-200",
      pulse: false,
      category: "completed"
    },

    CANCELLED: {
      label: "ההצעה בוטלה",
      shortLabel: "בוטלה",
      description: "ההצעה בוטלה על ידי השדכן/ית",
      currentParty: "none",
      icon: require("lucide-react").Ban,
      className: "bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-200",
      pulse: false,
      category: "completed"
    }
  };

  return statusMap[status];
}

// Helper function to get party indicator
export function getPartyIndicator(
  status: MatchSuggestionStatus,
  isFirstParty: boolean
): {
  show: boolean;
  text: string;
  className: string;
} {
  const statusInfo = getEnhancedStatusInfo(status, isFirstParty);
  
  switch (statusInfo.currentParty) {
    case "first":
      return {
        show: true,
        text: isFirstParty ? "תורך!" : "צד ראשון",
        className: "bg-purple-500 text-white"
      };
    case "second":
      return {
        show: true,
        text: isFirstParty ? "צד שני" : "תורך!",
        className: "bg-blue-500 text-white"
      };
    case "matchmaker":
      return {
        show: true,
        text: "השדכן/ית",
        className: "bg-emerald-500 text-white"
      };
    case "both":
      return {
        show: true,
        text: "שני הצדדים",
        className: "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
      };
    default:
      return {
        show: false,
        text: "",
        className: ""
      };
  }
}