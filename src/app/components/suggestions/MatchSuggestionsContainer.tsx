// src/app/components/suggestions/MatchSuggestionsContainer.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Clock, 
  History, 
  AlertCircle, 
  RefreshCw, 
  Bell, 
  TrendingUp,
  Users,
  CheckCircle,
  Target,
  Sparkles,
  Heart,
  Zap,
  XCircle // הוספת אייקון לדחייה
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { MatchSuggestion } from "@prisma/client";
import type { UserProfile, UserImage } from "@/types/next-auth";

import SuggestionsList from "./list/SuggestionsList";
import type { ExtendedMatchSuggestion } from "./types";
import { cn } from "@/lib/utils";
import { getEnhancedStatusInfo, getPartyIndicator } from "@/lib/utils/suggestionUtils";

// --- START: הוספת imports עבור AlertDialog ---
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
// --- END: הוספת imports ---

// קומפוננטת סטטיסטיקות מפושטת ונקייה עם עיצוב חדש
const WelcomeStats: React.FC<{
  activeSuggestions: ExtendedMatchSuggestion[];
  historySuggestions: ExtendedMatchSuggestion[];
  pendingCount: number;
  userId: string;
}> = ({ activeSuggestions, historySuggestions, pendingCount, userId }) => {
  const totalSuggestions = activeSuggestions.length + historySuggestions.length;
  const approvedCount = [...activeSuggestions, ...historySuggestions].filter(s => 
    s.status === "FIRST_PARTY_APPROVED" || s.status === "SECOND_PARTY_APPROVED"
  ).length;

  const myTurnCount = activeSuggestions.filter(s => {
    const isFirstParty = s.firstPartyId === userId;
    return (
      (s.status === "PENDING_FIRST_PARTY" && isFirstParty) ||
      (s.status === "PENDING_SECOND_PARTY" && !isFirstParty)
    );
  }).length;

  const stats = [
    {
      label: "הצעות חדשות",
      value: activeSuggestions.length,
      icon: <Sparkles className="w-5 h-5" />,
      color: "from-cyan-500 to-blue-500",
      description: "ממתינות לתשובתך"
    },
    {
      label: "התור שלך",
      value: myTurnCount,
      icon: <Zap className="w-5 h-5" />,
      color: "from-orange-500 to-amber-500",
      description: "דורשות החלטה ממך",
      pulse: myTurnCount > 0
    },
    {
      label: "אושרו",
      value: approvedCount,
      icon: <CheckCircle className="w-5 h-5" />,
      color: "from-emerald-500 to-green-500",
      description: "הצעות שאושרו"
    },
  ];

  return (
    <div className="mb-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 mb-4">
         <div className="p-3 rounded-full bg-gradient-to-r from-purple-100 to-cyan-100">
          <Heart className="w-8 h-8 text-purple-600" />
        </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent mb-3">
          ההצעות שלך
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          הזדמנויות מיוחדות להכיר את האדם המושלם עבורך
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-lg overflow-hidden bg-white hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "p-3 rounded-xl bg-gradient-to-r text-white shadow-lg group-hover:scale-110 transition-transform duration-300", 
                  stat.color,
                  stat.pulse && "animate-pulse"
                )}>
                  {stat.icon}
                </div>
                <div className="text-right">
                  <div className={cn(
                    "text-3xl font-bold text-gray-900",
                    stat.pulse && "animate-bounce"
                  )}>{stat.value}</div>
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-gray-800">{stat.label}</h3>
                <p className="text-sm text-gray-600">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

interface MatchSuggestionsContainerProps {
  userId: string;
  className?: string;
}

const MatchSuggestionsContainer: React.FC<MatchSuggestionsContainerProps> = ({  userId,
  className,
}) => {
  // States
  const [activeSuggestions, setActiveSuggestions] = useState<ExtendedMatchSuggestion[]>([]);
  const [historySuggestions, setHistorySuggestions] = useState<ExtendedMatchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [hasNewSuggestions, setHasNewSuggestions] = useState(false);
  const [isUserInActiveProcess, setIsUserInActiveProcess] = useState(false);

  // --- START: State חדש לניהול חלון האישור ---
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [suggestionForAction, setSuggestionForAction] = useState<ExtendedMatchSuggestion | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'decline' | null>(null);
  // --- END: State חדש ---

  // Calculate counts
  const pendingCount = activeSuggestions.filter(
    (s) => s.status === "PENDING_FIRST_PARTY" || s.status === "PENDING_SECOND_PARTY"
  ).length;

  const myTurnCount = activeSuggestions.filter(s => {
    const isFirstParty = s.firstPartyId === userId;
    return (
      (s.status === "PENDING_FIRST_PARTY" && isFirstParty) ||
      (s.status === "PENDING_SECOND_PARTY" && !isFirstParty)
    );
  }).length;

  // Fetch suggestions function
  const fetchSuggestions = useCallback(
    async (showLoadingState = true) => {
      // ... (ללא שינוי)
      try {
        if (showLoadingState) {
          setIsLoading(true);
        } else {
          setIsRefreshing(true);
        }
        setError(null);

        const [activeResponse, historyResponse] = await Promise.all([
          fetch(`/api/suggestions/active`),
          fetch(`/api/suggestions/history`),
        ]);

        if (!activeResponse.ok || !historyResponse.ok) {
          const activeError = !activeResponse.ok ? await activeResponse.text() : "";
          const historyError = !historyResponse.ok ? await historyResponse.text() : "";
          console.error("Fetch errors:", { activeError, historyError });
          throw new Error(
            `Failed to fetch suggestions (${activeResponse.status}/${historyResponse.status})`
          );
        }

        const activeData = await activeResponse.json();
        const historyData = await historyResponse.json();

        if (!showLoadingState && activeData.suggestions.length > activeSuggestions.length) {
          setHasNewSuggestions(true);
          toast.success("התקבלו הצעות שידוך חדשות!", {
            description: "בדוק את ההצעות החדשות שמחכות לך",
            duration: 5000,
          });
        }

        setActiveSuggestions(activeData.suggestions);
        setHistorySuggestions(historyData.suggestions);
      } catch (error) {
        console.error("Error loading suggestions:", error);
        setError(
          `אירעה שגיאה בטעינת ההצעות: ${
            error instanceof Error ? error.message : "שגיאה לא ידועה"
          }`
        );
        toast.error("שגיאה בטעינת ההצעות", {
          description: "נסה לרענן את הדף או פנה לתמיכה",
        });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeSuggestions.length]
  );

  // Handle suggestion status change (This is now the central logic)
  const handleStatusChange = useCallback(
    async (suggestionId: string, newStatus: string, notes?: string) => {
      try {
        const response = await fetch(`/api/suggestions/${suggestionId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, notes }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update suggestion status");
        }

        await fetchSuggestions(false);

        const statusMessages: Record<string, string> = {
          FIRST_PARTY_APPROVED: "אישרת את ההצעה בהצלחה",
          SECOND_PARTY_APPROVED: "אישרת את ההצעה בהצלחה",
          FIRST_PARTY_DECLINED: "דחית את ההצעה בהצלחה",
          SECOND_PARTY_DECLINED: "דחית את ההצעה בהצלחה",
        };

        let description: string;
        if (newStatus === 'FIRST_PARTY_APPROVED') {
          description = "באישורך, ההצעה נשלחה לצד השני. אם גם הצד השני יאשר, פרטי הקשר המלאים שלכם יוחלפו.";
        } else if (newStatus === 'SECOND_PARTY_APPROVED') {
          description = "מעולה! כעת, מאחר ושניכם אישרתם, פרטי הקשר שלך יישלחו לצד הראשון ופרטיו יישלחו אליך.";
        } else if (newStatus.includes("DECLINED")) {
          description = "תודה על המשוב - זה עוזר לנו להציע התאמות טובות יותר";
        } else {
          description = "השדכן יקבל הודעה ויתקדם עם התהליך";
        }

        toast.success(statusMessages[newStatus] || "הסטטוס עודכן בהצלחה", { description });

      } catch (error) {
        console.error("Error updating suggestion status:", error);
        toast.error(
          `אירעה שגיאה בעדכון הסטטוס: ${
            error instanceof Error ? error.message : "שגיאה לא ידועה"
          }`
        );
      }
    },
    [fetchSuggestions]
  );

  // --- START: פונקציות חדשות לניהול הדיאלוג ---

  // פונקציה שמופעלת מהילדים כדי לבקש פתיחת דיאלוג
  const handleRequestAction = useCallback((suggestion: ExtendedMatchSuggestion, action: 'approve' | 'decline') => {
      setSuggestionForAction(suggestion);
      setActionType(action);
      setShowConfirmDialog(true);
  }, []);

  // פונקציה שמופעלת בלחיצה על "אישור" בתוך הדיאלוג
  const handleConfirmAction = useCallback(async () => {
    if (!suggestionForAction || !actionType) return;

    const isFirstParty = suggestionForAction.firstPartyId === userId;
    let newStatus = "";
    if (actionType === "approve") {
      newStatus = isFirstParty ? "FIRST_PARTY_APPROVED" : "SECOND_PARTY_APPROVED";
    } else {
      newStatus = isFirstParty ? "FIRST_PARTY_DECLINED" : "SECOND_PARTY_DECLINED";
    }

    // קריאה לפונקציה המרכזית שמעדכנת סטטוס
    await handleStatusChange(suggestionForAction.id, newStatus);
    
    // סגירת הדיאלוג ואיפוס ה-state
    setShowConfirmDialog(false);
    setSuggestionForAction(null);
    setActionType(null);

  }, [suggestionForAction, actionType, userId, handleStatusChange]);

  // --- END: פונקציות חדשות ---

  // Initial load and periodic refresh
  useEffect(() => {
    fetchSuggestions();

    const intervalId = setInterval(() => {
      fetchSuggestions(false);
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(intervalId);
  }, [userId, fetchSuggestions]);

  // Effect to determine if user is in an active process
  useEffect(() => {
    const activeProcessStatuses: MatchSuggestion['status'][] = [
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
      'ENGAGED',
    ];

    const hasActiveProcess = activeSuggestions.some(s =>
      activeProcessStatuses.includes(s.status)
    );
    setIsUserInActiveProcess(hasActiveProcess);
  }, [activeSuggestions]);

  // Clear new suggestions notification when changing to active tab
  useEffect(() => {
    if (activeTab === "active") {
      setHasNewSuggestions(false);
    }
  }, [activeTab]);


  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    await fetchSuggestions(false);
    toast.success("הנתונים עודכנו בהצלחה", {
      description: "כל ההצעות עודכנו למצב הנוכחי"
    });
  }, [fetchSuggestions]);

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/20 to-emerald-50/20", className)}>
      <div className="container mx-auto px-4 py-8">
        <WelcomeStats
          activeSuggestions={activeSuggestions}
          historySuggestions={historySuggestions}
          pendingCount={pendingCount}
          userId={userId}
        />

        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-white via-cyan-50/30 to-emerald-50/30 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing || isLoading}
                  className="rounded-full h-10 w-10 hover:bg-cyan-100 transition-colors"
                  aria-label="רענן הצעות"
                >
                  <RefreshCw
                    className={cn(
                      "h-5 w-5 text-cyan-600",
                      isRefreshing && "animate-spin"
                    )}
                  />
                </Button>
                
               {hasNewSuggestions && (
                  <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 shadow-xl animate-pulse">
                    <Bell className="w-3 h-3 ml-1" />
                    הצעות חדשות
                  </Badge>
                )}
              </div>
              <div className="text-center flex-grow">
                <CardTitle className="text-xl font-bold text-gray-800">
                  ניהול ההצעות
                </CardTitle>
              </div>
              <div className="w-16"></div> {/* Spacer */}
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl" className="space-y-6">
              <div className="flex justify-center">
                <TabsList className="grid grid-cols-3 bg-purple-50/50 rounded-2xl p-1 h-14 w-fit">
                  <TabsTrigger
                    value="active"
                    className="relative flex items-center gap-3 px-6 py-3 rounded-xl transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg font-semibold text-base"
                  >
                    <Target className="w-5 h-5 text-purple-500" />
                    <span>פעילות</span>
                    {activeSuggestions.length > 0 && (
                      <Badge className="bg-purple-500 text-white border-0 px-2 py-1 text-xs font-bold rounded-full min-w-[24px] h-6">
                        {activeSuggestions.length}
                      </Badge>
                    )}
                  </TabsTrigger>

                  {myTurnCount > 0 && (
                    <TabsTrigger
                      value="urgent"
                      className="flex items-center gap-3 px-6 py-3 rounded-xl transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg font-semibold text-base"
                    >
                      <Zap className="w-5 h-5 text-orange-500" />
                      <span>התור שלך</span>
                      <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 px-2 py-1 text-xs font-bold rounded-full min-w-[24px] h-6 animate-pulse shadow-lg">
                        {myTurnCount}
                      </Badge>
                    </TabsTrigger>
                  )}

                  <TabsTrigger
                    value="history"
                    className="flex items-center gap-3 px-6 py-3 rounded-xl transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg font-semibold text-base"
                  >
                    <History className="w-5 h-5 text-gray-500" />
                    <span>היסטוריה</span>
                    {historySuggestions.length > 0 && (
                      <Badge className="bg-gray-500 text-white border-0 px-2 py-1 text-xs font-bold rounded-full min-w-[24px] h-6">
                        {historySuggestions.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50" dir="rtl">
                  <AlertCircle className="h-5 w-5 ml-2" />
                  <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="active" className="space-y-6">
                <SuggestionsList
                  suggestions={activeSuggestions}
                  userId={userId}
                  viewMode={viewMode}
                  isLoading={isLoading}
                  onStatusChange={handleStatusChange}
                  onActionRequest={handleRequestAction}
                  onRefresh={handleRefresh}
                  isUserInActiveProcess={isUserInActiveProcess}
                />
              </TabsContent>

              <TabsContent value="history" className="space-y-6">
                <SuggestionsList
                  suggestions={historySuggestions}
                  userId={userId}
                  viewMode={viewMode}
                  isLoading={isLoading}
                  isHistory={true}
                  onStatusChange={handleStatusChange}
                  onActionRequest={handleRequestAction}
                  onRefresh={handleRefresh}
                  isUserInActiveProcess={isUserInActiveProcess}
                />
              </TabsContent>

              <TabsContent value="urgent" className="space-y-6">
                <SuggestionsList
                  suggestions={activeSuggestions.filter(s => {
                    const isFirstParty = s.firstPartyId === userId;
                    return (
                      (s.status === "PENDING_FIRST_PARTY" && isFirstParty) ||
                      (s.status === "PENDING_SECOND_PARTY" && !isFirstParty)
                    );
                  })}
                  userId={userId}
                  viewMode={viewMode}
                  isLoading={isLoading}
                  onStatusChange={handleStatusChange}
                  onActionRequest={handleRequestAction}
                  onRefresh={handleRefresh}
                  isUserInActiveProcess={isUserInActiveProcess}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* --- START: רינדור ה-AlertDialog ברמה הגבוהה --- */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="border-0 shadow-2xl rounded-2xl z-[9999]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-center">
              {actionType === "approve"
                ? "אישור הצעת השידוך"
                : "דחיית הצעת השידוך"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-600 leading-relaxed">
              {actionType === "approve"
                ? "האם אתה בטוח שברצונך לאשר את הצעת השידוך? לאחר האישור, השדכן יקבל הודעה ויתקדם עם התהליך."
                : "האם אתה בטוח שברצונך לדחות את הצעת השידוך? המשוב שלך עוזר לנו להציע התאמות טובות יותר בעתיד."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-xl">ביטול</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmAction}
              className={cn(
                "rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300",
                actionType === "approve"
                  ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              )}
            >
              {actionType === "approve" ? (
                <>
                  <CheckCircle className="w-4 h-4 ml-2" />
                  אישור ההצעה
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 ml-2" />
                  דחיית ההצעה
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* --- END: רינדור ה-AlertDialog --- */}
    </div>
  );
};

export default MatchSuggestionsContainer;