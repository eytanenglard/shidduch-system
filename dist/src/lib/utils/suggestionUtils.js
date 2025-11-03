"use strict";
// src/lib/utils/suggestionUtils.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnhancedStatusInfo = getEnhancedStatusInfo;
exports.getPartyIndicator = getPartyIndicator;
const lucide_react_1 = require("lucide-react");
function getEnhancedStatusInfo(status, isFirstParty = false, dict) {
    const statusMap = {
        DRAFT: {
            label: "טיוטה בהכנה",
            shortLabel: "טיוטה",
            description: dict.statusDescriptions.draft,
            currentParty: "matchmaker",
            icon: lucide_react_1.FileText,
            className: "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-200",
            pulse: false,
            category: "pending"
        },
        PENDING_FIRST_PARTY: {
            label: isFirstParty ? "ממתין לתשובתך" : "נשלח לצד הראשון",
            shortLabel: isFirstParty ? dict.statusIndicator.waitingForYou : dict.statusIndicator.firstParty,
            description: isFirstParty
                ? dict.statusDescriptions.pendingFirstPartyUser
                : dict.statusDescriptions.pendingFirstPartyOther,
            currentParty: "first",
            icon: lucide_react_1.Clock,
            className: "bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 border-purple-200",
            pulse: true,
            category: "pending"
        },
        FIRST_PARTY_APPROVED: {
            label: isFirstParty ? "אישרת את ההצעה" : "הצד הראשון אישר",
            shortLabel: isFirstParty ? "אישרת" : `${dict.statusIndicator.firstParty} אישר`,
            description: isFirstParty
                ? dict.statusDescriptions.firstPartyApprovedUser
                : dict.statusDescriptions.firstPartyApprovedOther,
            currentParty: "matchmaker",
            icon: lucide_react_1.CheckCircle,
            className: "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200",
            pulse: false,
            category: "approved"
        },
        FIRST_PARTY_DECLINED: {
            label: isFirstParty ? "דחית את ההצעה" : "הצד הראשון דחה",
            shortLabel: isFirstParty ? "דחית" : `${dict.statusIndicator.firstParty} דחה`,
            description: isFirstParty
                ? dict.statusDescriptions.firstPartyDeclinedUser
                : dict.statusDescriptions.firstPartyDeclinedOther,
            currentParty: "none",
            icon: lucide_react_1.XCircle,
            className: "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200",
            pulse: false,
            category: "declined"
        },
        PENDING_SECOND_PARTY: {
            label: isFirstParty ? "ההצעה נשלחה לצד השני" : "ממתין לתשובתך",
            shortLabel: isFirstParty ? dict.statusIndicator.secondParty : dict.statusIndicator.waitingForYou,
            description: isFirstParty
                ? dict.statusDescriptions.pendingSecondPartyUser
                : dict.statusDescriptions.pendingSecondPartyOther,
            currentParty: "second",
            icon: lucide_react_1.UserPlus,
            className: "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-blue-200",
            pulse: true,
            category: "pending"
        },
        SECOND_PARTY_APPROVED: {
            label: isFirstParty ? "הצד השני אישר!" : "אישרת את ההצעה!",
            shortLabel: isFirstParty ? `${dict.statusIndicator.secondParty} אישר` : "אישרת",
            description: isFirstParty
                ? dict.statusDescriptions.secondPartyApprovedUser
                : dict.statusDescriptions.secondPartyApprovedOther,
            currentParty: "matchmaker",
            icon: lucide_react_1.Heart,
            className: "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200",
            pulse: true,
            category: "approved"
        },
        SECOND_PARTY_DECLINED: {
            label: isFirstParty ? "הצד השני דחה" : "דחית את ההצעה",
            shortLabel: isFirstParty ? `${dict.statusIndicator.secondParty} דחה` : "דחית",
            description: isFirstParty
                ? dict.statusDescriptions.secondPartyDeclinedUser
                : dict.statusDescriptions.secondPartyDeclinedOther,
            currentParty: "none",
            icon: lucide_react_1.XCircle,
            className: "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200",
            pulse: false,
            category: "declined"
        },
        AWAITING_MATCHMAKER_APPROVAL: {
            label: "ממתין לאישור השדכן",
            shortLabel: `אישור ${dict.statusIndicator.matchmaker}`,
            description: dict.statusDescriptions.awaitingMatchmakerApproval,
            currentParty: "matchmaker",
            icon: lucide_react_1.Handshake,
            className: "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200",
            pulse: true,
            category: "pending"
        },
        CONTACT_DETAILS_SHARED: {
            label: "פרטי קשר שותפו",
            shortLabel: "פרטים שותפו",
            description: dict.statusDescriptions.contactDetailsShared,
            currentParty: "both",
            icon: lucide_react_1.Phone,
            className: "bg-gradient-to-r from-cyan-50 to-emerald-50 text-cyan-700 border-cyan-200",
            pulse: false,
            category: "progress"
        },
        AWAITING_FIRST_DATE_FEEDBACK: {
            label: "ממתין למשוב פגישה",
            shortLabel: "משוב פגישה",
            description: dict.statusDescriptions.awaitingFirstDateFeedback,
            currentParty: "both",
            icon: lucide_react_1.Calendar,
            className: "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200",
            pulse: true,
            category: "pending"
        },
        THINKING_AFTER_DATE: {
            label: "בחשיבה לאחר הפגישה",
            shortLabel: "בחשיבה",
            description: dict.statusDescriptions.thinkingAfterDate,
            currentParty: "both",
            icon: lucide_react_1.Brain,
            className: "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-blue-200",
            pulse: false,
            category: "pending"
        },
        PROCEEDING_TO_SECOND_DATE: {
            label: "ממשיכים לפגישה שנייה",
            shortLabel: "פגישה שנייה",
            description: dict.statusDescriptions.proceedingToSecondDate,
            currentParty: "both",
            icon: lucide_react_1.ArrowRight,
            className: "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200",
            pulse: false,
            category: "progress"
        },
        ENDED_AFTER_FIRST_DATE: {
            label: "הסתיים לאחר פגישה ראשונה",
            shortLabel: "הסתיים",
            description: dict.statusDescriptions.endedAfterFirstDate,
            currentParty: "none",
            icon: lucide_react_1.XCircle,
            className: "bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-200",
            pulse: false,
            category: "completed"
        },
        MEETING_PENDING: {
            label: "פגישה בהמתנה",
            shortLabel: "פגישה ממתינה",
            description: dict.statusDescriptions.meetingPending,
            currentParty: "matchmaker",
            icon: lucide_react_1.Clock,
            className: "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-blue-200",
            pulse: true,
            category: "pending"
        },
        MEETING_SCHEDULED: {
            label: "פגישה קבועה",
            shortLabel: "פגישה קבועה",
            description: dict.statusDescriptions.meetingScheduled,
            currentParty: "both",
            icon: lucide_react_1.Calendar,
            className: "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200",
            pulse: false,
            category: "progress"
        },
        MATCH_APPROVED: {
            label: "השידוך אושר",
            shortLabel: "אושר",
            description: dict.statusDescriptions.matchApproved,
            currentParty: "both",
            icon: lucide_react_1.CheckCircle,
            className: "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200",
            pulse: false,
            category: "approved"
        },
        MATCH_DECLINED: {
            label: "השידוך נדחה",
            shortLabel: "נדחה",
            description: dict.statusDescriptions.matchDeclined,
            currentParty: "none",
            icon: lucide_react_1.XCircle,
            className: "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200",
            pulse: false,
            category: "declined"
        },
        DATING: {
            label: "בתהליך היכרות",
            shortLabel: "בהיכרות",
            description: dict.statusDescriptions.dating,
            currentParty: "both",
            icon: lucide_react_1.Heart,
            className: "bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 border-pink-200",
            pulse: false,
            category: "progress"
        },
        ENGAGED: {
            label: "אירוסין! 💍",
            shortLabel: "מאורסים",
            description: dict.statusDescriptions.engaged,
            currentParty: "both",
            icon: lucide_react_1.Star,
            className: "bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border-yellow-200",
            pulse: true,
            category: "completed"
        },
        MARRIED: {
            label: "נישואין! 🎉",
            shortLabel: "נשואים",
            description: dict.statusDescriptions.married,
            currentParty: "both",
            icon: lucide_react_1.Gift,
            className: "bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border-rose-200",
            pulse: true,
            category: "completed"
        },
        EXPIRED: {
            label: "פג תוקף",
            shortLabel: "פג תוקף",
            description: dict.statusDescriptions.expired,
            currentParty: "none",
            icon: lucide_react_1.AlertTriangle,
            className: "bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-200",
            pulse: false,
            category: "completed"
        },
        CLOSED: {
            label: "ההצעה נסגרה",
            shortLabel: "נסגרה",
            description: dict.statusDescriptions.closed,
            currentParty: "none",
            icon: lucide_react_1.FileX,
            className: "bg-gradient-to-r from-slate-50 to-gray-50 text-slate-700 border-slate-200",
            pulse: false,
            category: "completed"
        },
        CANCELLED: {
            label: "ההצעה בוטלה",
            shortLabel: "בוטלה",
            description: dict.statusDescriptions.cancelled,
            currentParty: "none",
            icon: lucide_react_1.Ban,
            className: "bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-200",
            pulse: false,
            category: "completed"
        }
    };
    return statusMap[status];
}
// Helper function to get party indicator
function getPartyIndicator(status, isFirstParty, dict) {
    const statusInfo = getEnhancedStatusInfo(status, isFirstParty, dict);
    switch (statusInfo.currentParty) {
        case "first":
            return {
                show: true,
                text: isFirstParty ? dict.statusIndicator.yourTurn : dict.statusIndicator.firstParty,
                className: "bg-purple-500 text-white"
            };
        case "second":
            return {
                show: true,
                text: isFirstParty ? dict.statusIndicator.secondParty : dict.statusIndicator.yourTurn,
                className: "bg-blue-500 text-white"
            };
        case "matchmaker":
            return {
                show: true,
                text: dict.statusIndicator.matchmaker,
                className: "bg-emerald-500 text-white"
            };
        case "both":
            return {
                show: true,
                text: dict.statusIndicator.bothParties,
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
