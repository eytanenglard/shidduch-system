// Full path: src/app/components/suggestions/timeline/SuggestionTimeline.tsx

import React from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  Heart,
  AlertCircle,
  User,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StatusHistoryItem {
  id: string;
  status: string;
  notes?: string | null;
  createdAt: Date | string;
}

interface SuggestionTimelineProps {
  statusHistory: StatusHistoryItem[];
  className?: string;
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case "DRAFT":
      return {
        label: "טיוטה",
        icon: <Clock className="w-4 h-4" />,
        color: "text-gray-500 bg-gray-100",
        description: "ההצעה נוצרה אך טרם נשלחה למועמדים"
      };
    case "PENDING_FIRST_PARTY":
      return {
        label: "ממתין לתשובת הצד הראשון",
        icon: <User className="w-4 h-4" />,
        color: "text-yellow-700 bg-yellow-100",
        description: "ההצעה נשלחה לצד הראשון וממתינה לתשובה"
      };
    case "FIRST_PARTY_APPROVED":
      return {
        label: "הצד הראשון אישר",
        icon: <CheckCircle className="w-4 h-4" />,
        color: "text-green-700 bg-green-100",
        description: "הצד הראשון אישר את ההצעה"
      };
    case "FIRST_PARTY_DECLINED":
      return {
        label: "הצד הראשון דחה",
        icon: <XCircle className="w-4 h-4" />,
        color: "text-red-700 bg-red-100",
        description: "הצד הראשון דחה את ההצעה"
      };
    case "PENDING_SECOND_PARTY":
      return {
        label: "ממתין לתשובת הצד השני",
        icon: <User className="w-4 h-4" />,
        color: "text-blue-700 bg-blue-100",
        description: "ההצעה נשלחה לצד השני וממתינה לתשובה"
      };
    case "SECOND_PARTY_APPROVED":
      return {
        label: "הצד השני אישר",
        icon: <CheckCircle className="w-4 h-4" />,
        color: "text-green-700 bg-green-100",
        description: "הצד השני אישר את ההצעה"
      };
    case "SECOND_PARTY_DECLINED":
      return {
        label: "הצד השני דחה",
        icon: <XCircle className="w-4 h-4" />,
        color: "text-red-700 bg-red-100",
        description: "הצד השני דחה את ההצעה"
      };
    case "CONTACT_DETAILS_SHARED":
      return {
        label: "פרטי קשר שותפו",
        icon: <MessageCircle className="w-4 h-4" />,
        color: "text-purple-700 bg-purple-100",
        description: "פרטי הקשר של שני הצדדים שותפו ביניהם"
      };
    case "AWAITING_FIRST_DATE_FEEDBACK":
      return {
        label: "ממתין למשוב פגישה ראשונה",
        icon: <Calendar className="w-4 h-4" />,
        color: "text-indigo-700 bg-indigo-100",
        description: "ממתין למשוב לאחר הפגישה הראשונה"
      };
    case "DATING":
      return {
        label: "בתהליך היכרות",
        icon: <Heart className="w-4 h-4" />,
        color: "text-pink-700 bg-pink-100",
        description: "הצדדים נמצאים בתהליך היכרות"
      };
    case "ENGAGED":
      return {
        label: "אירוסין",
        icon: <Heart className="w-4 h-4" fill="currentColor" />,
        color: "text-pink-700 bg-pink-100",
        description: "הצדדים התארסו"
      };
    case "MARRIED":
      return {
        label: "נישואין",
        icon: <Heart className="w-4 h-4" fill="currentColor" />,
        color: "text-pink-700 bg-pink-100",
        description: "הצדדים נישאו"
      };
    case "CANCELLED":
      return {
        label: "בוטל",
        icon: <XCircle className="w-4 h-4" />,
        color: "text-red-700 bg-red-100",
        description: "ההצעה בוטלה"
      };
    case "CLOSED":
      return {
        label: "נסגר",
        icon: <XCircle className="w-4 h-4" />,
        color: "text-gray-700 bg-gray-100",
        description: "ההצעה נסגרה"
      };
    default:
      return {
        label: status,
        icon: <AlertCircle className="w-4 h-4" />,
        color: "text-gray-700 bg-gray-100",
        description: "סטטוס אחר"
      };
  }
};

const SuggestionTimeline: React.FC<SuggestionTimelineProps> = ({ 
  statusHistory,
  className
}) => {
  // Sort history from newest to oldest
  const sortedHistory = [...statusHistory].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className={cn("px-4 py-2", className)}>
      <h3 className="text-lg font-semibold mb-4 text-right">היסטוריית סטטוסים</h3>
      
      <div className="relative border-r-2 border-gray-200 pr-6 space-y-6">
        {sortedHistory.map((item, index) => {
          const statusInfo = getStatusInfo(item.status);
          const formattedDate = format(
            new Date(item.createdAt),
            "dd בMMMM yyyy, HH:mm",
            { locale: he }
          );
          
          return (
            <div 
              key={item.id} 
              className={cn(
                "relative",
                index === 0 ? "opacity-100" : "opacity-80"
              )}
            >
              {/* Timeline node */}
              <div 
                className={cn(
                  "absolute right-[-21px] p-1 rounded-full",
                  statusInfo.color
                )}
              >
                {statusInfo.icon}
              </div>
              
              {/* Content */}
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-gray-500 mt-1">{formattedDate}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{statusInfo.label}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className={cn("h-2 w-2 rounded-full p-0", statusInfo.color)} />
                        </TooltipTrigger>
                        <TooltipContent className="text-right">
                          <p>{statusInfo.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                
                {item.notes && (
                  <p className="mt-2 text-sm text-gray-600 text-right">
                    {item.notes}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SuggestionTimeline;