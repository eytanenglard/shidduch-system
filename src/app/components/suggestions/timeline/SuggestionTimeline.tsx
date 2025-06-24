// src/app/components/suggestions/timeline/SuggestionTimeline.tsx

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
  Calendar,
  FileText,
  Send,
  UserPlus,
  Handshake,
  Star,
  Gift,
  Phone,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
        label: "טיוטה נוצרה",
        icon: FileText,
        color: "from-gray-400 to-gray-500",
        bgColor: "from-gray-50 to-gray-100",
        textColor: "text-gray-700",
        description: "ההצעה נוצרה ונמצאת בהכנה",
        category: "preparation"
      };
    case "PENDING_FIRST_PARTY":
      return {
        label: "נשלח לצד הראשון",
        icon: Send,
        color: "from-cyan-400 to-blue-500",
        bgColor: "from-cyan-50 to-blue-100",
        textColor: "text-cyan-700",
        description: "ההצעה נשלחה וממתינה לתשובת הצד הראשון",
        category: "pending"
      };
    case "FIRST_PARTY_APPROVED":
      return {
        label: "הצד הראשון אישר",
        icon: CheckCircle,
        color: "from-emerald-400 to-green-500",
        bgColor: "from-emerald-50 to-green-100",
        textColor: "text-emerald-700",
        description: "הצד הראשון אישר את ההצעה בהתלהבות",
        category: "success"
      };
    case "FIRST_PARTY_DECLINED":
      return {
        label: "הצד הראשון דחה",
        icon: XCircle,
        color: "from-red-400 to-red-500",
        bgColor: "from-red-50 to-red-100",
        textColor: "text-red-700",
        description: "הצד הראשון החליט שזה לא מתאים",
        category: "declined"
      };
    case "PENDING_SECOND_PARTY":
      return {
        label: "נשלח לצד השני",
        icon: UserPlus,
        color: "from-blue-400 to-cyan-500",
        bgColor: "from-blue-50 to-cyan-100",
        textColor: "text-blue-700",
        description: "ההצעה הועברה לצד השני לבדיקה",
        category: "pending"
      };
    case "SECOND_PARTY_APPROVED":
      return {
        label: "הצד השני אישר",
        icon: CheckCircle,
        color: "from-emerald-400 to-green-500",
        bgColor: "from-emerald-50 to-green-100",
        textColor: "text-emerald-700",
        description: "הצד השני גם הוא מעוניין להמשיך",
        category: "success"
      };
    case "SECOND_PARTY_DECLINED":
      return {
        label: "הצד השני דחה",
        icon: XCircle,
        color: "from-red-400 to-red-500",
        bgColor: "from-red-50 to-red-100",
        textColor: "text-red-700",
        description: "הצד השני החליט שזה לא בשבילו",
        category: "declined"
      };
    case "CONTACT_DETAILS_SHARED":
      return {
        label: "פרטי קשר שותפו",
        icon: Phone,
        color: "from-cyan-400 to-emerald-500",
        bgColor: "from-cyan-50 to-emerald-100",
        textColor: "text-cyan-700",
        description: "פרטי הקשר של שני הצדדים הועברו",
        category: "progress"
      };
    case "AWAITING_FIRST_DATE_FEEDBACK":
      return {
        label: "ממתין למשוב פגישה",
        icon: Calendar,
        color: "from-amber-400 to-orange-500",
        bgColor: "from-amber-50 to-orange-100",
        textColor: "text-amber-700",
        description: "ממתין למשוב לאחר הפגישה הראשונה",
        category: "pending"
      };
    case "DATING":
      return {
        label: "בתהליך היכרות",
        icon: Heart,
        color: "from-pink-400 to-rose-500",
        bgColor: "from-pink-50 to-rose-100",
        textColor: "text-pink-700",
        description: "הצדדים נמצאים בתהליך היכרות פעיל",
        category: "progress"
      };
    case "ENGAGED":
      return {
        label: "אירוסין! 💍",
        icon: Star,
        color: "from-yellow-400 to-amber-500",
        bgColor: "from-yellow-50 to-amber-100",
        textColor: "text-yellow-700",
        description: "מזל טוב! הצדדים התארסו",
        category: "celebration"
      };
    case "MARRIED":
      return {
        label: "נישואין! 🎉",
        icon: Gift,
        color: "from-rose-400 to-pink-500",
        bgColor: "from-rose-50 to-pink-100",
        textColor: "text-rose-700",
        description: "מזל טוב! הצדדים נישאו בשמחה",
        category: "celebration"
      };
    case "CANCELLED":
      return {
        label: "ההצעה בוטלה",
        icon: XCircle,
        color: "from-gray-400 to-gray-500",
        bgColor: "from-gray-50 to-gray-100",
        textColor: "text-gray-700",
        description: "ההצעה בוטלה מסיבות שונות",
        category: "declined"
      };
    case "CLOSED":
      return {
        label: "ההצעה נסגרה",
        icon: FileText,
        color: "from-slate-400 to-slate-500",
        bgColor: "from-slate-50 to-slate-100",
        textColor: "text-slate-700",
        description: "התהליך הסתיים והקובץ נסגר",
        category: "declined"
      };
    default:
      return {
        label: status,
        icon: AlertCircle,
        color: "from-gray-400 to-gray-500",
        bgColor: "from-gray-50 to-gray-100",
        textColor: "text-gray-700",
        description: "סטטוס לא מוכר במערכת",
        category: "other"
      };
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case "preparation":
      return "border-gray-200";
    case "pending":
      return "border-cyan-200";
    case "success":
      return "border-emerald-200";
    case "progress":
      return "border-blue-200";
    case "celebration":
      return "border-yellow-200";
    case "declined":
      return "border-red-200";
    default:
      return "border-gray-200";
  }
};

const TimelineNode: React.FC<{
  statusInfo: ReturnType<typeof getStatusInfo>;
  isLatest: boolean;
  isLast: boolean;
}> = ({ statusInfo, isLatest, isLast }) => {
  const IconComponent = statusInfo.icon;
  
  return (
    <div className="relative flex items-center">
      {/* Connecting Line */}
      {!isLast && (
        <div 
          className={cn(
            "absolute top-12 right-6 w-0.5 h-16 bg-gradient-to-b rounded-full",
            isLatest ? "from-cyan-300 to-cyan-100" : "from-gray-300 to-gray-100"
          )}
        />
      )}
      
      {/* Node Circle */}
      <div className={cn(
        "relative z-10 w-12 h-12 rounded-full bg-gradient-to-br shadow-lg flex items-center justify-center text-white",
        statusInfo.color,
        isLatest && "ring-4 ring-cyan-200 animate-pulse-subtle"
      )}>
        <IconComponent className="w-6 h-6" />
      </div>
    </div>
  );
};

const SuggestionTimeline: React.FC<SuggestionTimelineProps> = ({ 
  statusHistory,
  className
}) => {
  // Sort history from newest to oldest
  const sortedHistory = [...statusHistory].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (sortedHistory.length === 0) {
    return (
      <Card className={cn("border-0 shadow-lg", className)}>
        <CardContent className="p-8 text-center">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">אין היסטוריה זמינה</h3>
          <p className="text-gray-500">עדיין לא בוצעו פעולות על ההצעה הזו</p>
        </CardContent>
      </Card>
    );
  }

  // Get info for the latest status to use in the summary section
  const latestStatusInfo = getStatusInfo(sortedHistory[0].status);

  return (
    <Card className={cn("border-0 shadow-lg overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-md">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">מסלול ההצעה</h3>
            <p className="text-sm text-gray-600">עקוב אחר התקדמות ההצעה לאורך זמן</p>
          </div>
        </div>
        
        <div className="space-y-6">
          {sortedHistory.map((item, index) => {
            const statusInfo = getStatusInfo(item.status);
            const isLatest = index === 0;
            const isLast = index === sortedHistory.length - 1;
            
            const formattedDate = format(
              new Date(item.createdAt),
              "dd בMMMM yyyy",
              { locale: he }
            );
            
            const formattedTime = format(
              new Date(item.createdAt),
              "HH:mm",
              { locale: he }
            );
            
            return (
              <div key={item.id} className="flex gap-4">
                <TimelineNode 
                  statusInfo={statusInfo}
                  isLatest={isLatest}
                  isLast={isLast}
                />
                
                <div className="flex-1 pb-4">
                  <Card className={cn(
                    "border-2 transition-all duration-300 hover:shadow-md",
                    getCategoryColor(statusInfo.category),
                    isLatest && "shadow-md"
                  )}>
                    <CardContent className={cn("p-4 bg-gradient-to-r", statusInfo.bgColor)}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              className={cn(
                                "bg-gradient-to-r text-white border-0 shadow-sm font-semibold",
                                statusInfo.color
                              )}
                            >
                              {statusInfo.label}
                            </Badge>
                            {isLatest && (
                              <Badge variant="outline" className="bg-white/80 text-cyan-600 border-cyan-200 text-xs">
                                עכשיו
                              </Badge>
                            )}
                          </div>
                          <p className={cn("text-sm font-medium mb-2", statusInfo.textColor)}>
                            {statusInfo.description}
                          </p>
                        </div>
                        
                        <div className="text-left text-xs text-gray-500 space-y-1">
                          <div className="font-medium">{formattedDate}</div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formattedTime}
                          </div>
                        </div>
                      </div>
                      
                      {item.notes && (
                        <div className="mt-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-white/40">
                          <div className="flex items-start gap-2">
                            <MessageCircle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700 leading-relaxed">{item.notes}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-cyan-600">{sortedHistory.length}</div>
              <div className="text-xs text-gray-500 font-medium">שלבים סה״כ</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-emerald-600">
                {Math.ceil((Date.now() - new Date(sortedHistory[sortedHistory.length - 1].createdAt).getTime()) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-xs text-gray-500 font-medium">ימים פעילים</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-blue-600">
                {sortedHistory.filter(s => s.status.includes('APPROVED')).length}
              </div>
              <div className="text-xs text-gray-500 font-medium">אישורים</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-amber-600">
                {latestStatusInfo.category === 'celebration' ? '🎉' : 
                 latestStatusInfo.category === 'progress' ? '⏳' : 
                 latestStatusInfo.category === 'success' ? '✅' : '📋'}
              </div>
              <div className="text-xs text-gray-500 font-medium">סטטוס נוכחי</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SuggestionTimeline;