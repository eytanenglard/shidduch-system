// src/app/components/suggestions/timeline/SuggestionTimeline.tsx

import React from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
  Clock,
  MessageCircle,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getEnhancedStatusInfo } from "@/lib/utils/suggestionUtils";
import type { MatchSuggestionStatus } from "@prisma/client";

interface StatusHistoryItem {
  id: string;
  status: string;
  notes?: string | null;
  createdAt: Date | string;
}

interface SuggestionTimelineProps {
  statusHistory: StatusHistoryItem[];
  userId?: string;
  className?: string;
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case "pending":
      return "border-purple-200";
    case "approved":
      return "border-emerald-200";
    case "progress":
      return "border-blue-200";
    case "completed":
      return "border-yellow-200";
    case "declined":
      return "border-red-200";
    default:
      return "border-gray-200";
  }
};

const TimelineNode: React.FC<{
  statusInfo: ReturnType<typeof getEnhancedStatusInfo>;
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
        "relative z-10 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white",
        statusInfo.className.includes('purple') ? "bg-gradient-to-br from-purple-400 to-purple-500" :
        statusInfo.className.includes('emerald') || statusInfo.className.includes('green') ? "bg-gradient-to-br from-emerald-400 to-green-500" :
        statusInfo.className.includes('blue') || statusInfo.className.includes('cyan') ? "bg-gradient-to-br from-blue-400 to-cyan-500" :
        statusInfo.className.includes('red') || statusInfo.className.includes('rose') ? "bg-gradient-to-br from-red-400 to-rose-500" :
        statusInfo.className.includes('yellow') || statusInfo.className.includes('amber') ? "bg-gradient-to-br from-yellow-400 to-amber-500" :
        statusInfo.className.includes('orange') ? "bg-gradient-to-br from-orange-400 to-orange-500" :
        "bg-gradient-to-br from-gray-400 to-gray-500",
        isLatest && "ring-4 ring-cyan-200 animate-pulse-subtle"
      )}>
        <IconComponent className="w-6 h-6" />
      </div>
    </div>
  );
};

const SuggestionTimeline: React.FC<SuggestionTimelineProps> = ({ 
  statusHistory,
  userId,
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
  const latestStatusInfo = getEnhancedStatusInfo(
    sortedHistory[0].status as MatchSuggestionStatus,
    userId ? true : false
  );

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
            const statusInfo = getEnhancedStatusInfo(
              item.status as MatchSuggestionStatus,
              userId ? true : false
            );
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
                    <CardContent className={cn(
                      "p-4",
                      statusInfo.className.includes('purple') ? "bg-purple-50" :
                      statusInfo.className.includes('emerald') || statusInfo.className.includes('green') ? "bg-emerald-50" :
                      statusInfo.className.includes('blue') || statusInfo.className.includes('cyan') ? "bg-blue-50" :
                      statusInfo.className.includes('red') || statusInfo.className.includes('rose') ? "bg-red-50" :
                      statusInfo.className.includes('yellow') || statusInfo.className.includes('amber') ? "bg-yellow-50" :
                      statusInfo.className.includes('orange') ? "bg-orange-50" :
                      "bg-gray-50"
                    )}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              className={cn(
                                "border-0 shadow-sm font-semibold",
                                statusInfo.className
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
                          <p className={cn(
                            "text-sm font-medium mb-2",
                            statusInfo.className.includes('purple') ? "text-purple-700" :
                            statusInfo.className.includes('emerald') || statusInfo.className.includes('green') ? "text-emerald-700" :
                            statusInfo.className.includes('blue') || statusInfo.className.includes('cyan') ? "text-blue-700" :
                            statusInfo.className.includes('red') || statusInfo.className.includes('rose') ? "text-red-700" :
                            statusInfo.className.includes('yellow') || statusInfo.className.includes('amber') ? "text-yellow-700" :
                            statusInfo.className.includes('orange') ? "text-orange-700" :
                            "text-gray-700"
                          )}>
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
                {latestStatusInfo.category === 'completed' ? '🎉' : 
                 latestStatusInfo.category === 'progress' ? '⏳' : 
                 latestStatusInfo.category === 'approved' ? '✅' : '📋'}
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