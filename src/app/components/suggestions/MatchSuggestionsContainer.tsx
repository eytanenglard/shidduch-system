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
  Heart
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

interface MatchSuggestionsContainerProps {
  userId: string;
  className?: string;
}

// קומפוננטת סטטיסטיקות מפושטת ונקייה עם עיצוב חדש
const WelcomeStats: React.FC<{
  activeSuggestions: ExtendedMatchSuggestion[];
  historySuggestions: ExtendedMatchSuggestion[];
  pendingCount: number;
}> = ({ activeSuggestions, historySuggestions, pendingCount }) => {
  const totalSuggestions = activeSuggestions.length + historySuggestions.length;
  const approvedCount = [...activeSuggestions, ...historySuggestions].filter(s => 
    s.status === "FIRST_PARTY_APPROVED" || s.status === "SECOND_PARTY_APPROVED"
  ).length;

  // עדכון בקובץ MatchSuggestionsContainer.tsx - החלק של WelcomeStats

const stats = [
  {
    label: "הצעות חדשות",
    value: activeSuggestions.length,
    icon: <Sparkles className="w-5 h-5" />,
    color: "from-cyan-500 to-blue-500", // נשאר כמו קודם
    description: "ממתינות לתשובתך"
  },
  {
    label: "בטיפול", // זה משתנה לסגול
    value: pendingCount,
    icon: <Clock className="w-5 h-5" />,
    color: "from-purple-500 to-violet-500", // 🟣 סגול חדש!
    description: "דורשות החלטה"
  },
  {
    label: "אושרו", // זה משתנה לירוק
    value: approvedCount,
    icon: <CheckCircle className="w-5 h-5" />,
    color: "from-emerald-500 to-green-500", // 🟢 ירוק עבר לכאן
    description: "הצעות שאושרו"
  },
];

  return (
    <div className="mb-8">
      {/* כותרת ראשית */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 mb-4">
         <div className="p-3 rounded-full bg-gradient-to-r from-purple-100 to-cyan-100"> {/* 🟣 רקע סגול-תכלת */}
  <Heart className="w-8 h-8 text-purple-600" /> {/* 🟣 לב סגול */}
</div>
        </div>
    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent mb-3"> {/* 🟣 מתחיל בסגול */}
  ההצעות שלך
</h1>

        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          הזדמנויות מיוחדות להכיר את האדם המושלם עבורך
        </p>
      </div>

      {/* סטטיסטיקות */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-lg overflow-hidden bg-white hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-xl bg-gradient-to-r text-white shadow-lg group-hover:scale-110 transition-transform duration-300", stat.color)}>
                  {stat.icon}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
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

const MatchSuggestionsContainer: React.FC<MatchSuggestionsContainerProps> = ({
  userId,
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
  // --- START OF CHANGE ---
  const [isUserInActiveProcess, setIsUserInActiveProcess] = useState(false);
  // --- END OF CHANGE ---

  // Calculate counts
  const pendingCount = activeSuggestions.filter(
    (s) => s.status === "PENDING_FIRST_PARTY" || s.status === "PENDING_SECOND_PARTY"
  ).length;

  // Fetch suggestions function
  const fetchSuggestions = useCallback(
    async (showLoadingState = true) => {
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

        // Check for new suggestions
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

  // Initial load and periodic refresh
  useEffect(() => {
    fetchSuggestions();

    const intervalId = setInterval(() => {
      fetchSuggestions(false);
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(intervalId);
  }, [userId, fetchSuggestions]);

  // --- START OF CHANGE ---
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
  // --- END OF CHANGE ---

  // Clear new suggestions notification when changing to active tab
  useEffect(() => {
    if (activeTab === "active") {
      setHasNewSuggestions(false);
    }
  }, [activeTab]);

  // Handle suggestion status change
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

        toast.success(statusMessages[newStatus] || "הסטטוס עודכן בהצלחה", {
          description: newStatus.includes("APPROVED") 
            ? "השדכן יקבל הודעה ויתקדם עם התהליך"
            : "תודה על המשוב - זה עוזר לנו להציע התאמות טובות יותר"
        });
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
        {/* כותרת וסטטיסטיקות */}
        <WelcomeStats
          activeSuggestions={activeSuggestions}
          historySuggestions={historySuggestions}
          pendingCount={pendingCount}
        />

        {/* תוכן ראשי */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
          {/* כותרת עם כפתור רענון */}
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
  <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 shadow-xl animate-pulse"> {/* 🧡 כתום חזק */}
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

              <div className="w-16"></div> {/* Spacer for balance */}
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl" className="space-y-6">
              {/* טאבים מעוצבים */}
              <div className="flex justify-center">

<TabsList className="grid grid-cols-3 bg-purple-50/50 rounded-2xl p-1 h-14 w-fit"> {/* 🟣 רקע סגול */}
  <TabsTrigger
    value="active"
    className="relative flex items-center gap-3 px-6 py-3 rounded-xl transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg font-semibold text-base"
  >
    <Target className="w-5 h-5 text-purple-500" /> {/* 🟣 אייקון סגול */}
    <span>פעילות</span>
    {activeSuggestions.length > 0 && (
      <Badge className="bg-purple-500 text-white border-0 px-2 py-1 text-xs font-bold rounded-full min-w-[24px] h-6"> {/* 🟣 סגול */}
        {activeSuggestions.length}
      </Badge>
    )}
  </TabsTrigger>

  {/* הטאב הדחוף עם כתום מחוזק */}
  {pendingCount > 0 && (
    <TabsTrigger
      value="pending"
      className="flex items-center gap-3 px-6 py-3 rounded-xl transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg font-semibold text-base"
    >
      <Bell className="w-5 h-5 text-orange-500" /> {/* 🧡 כתום */}
      <span>דחוף</span>
      <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 px-2 py-1 text-xs font-bold rounded-full min-w-[24px] h-6 animate-pulse shadow-lg"> {/* 🧡 כתום מחוזק */}
        {pendingCount}
      </Badge>
    </TabsTrigger>
  )}
</TabsList>
              </div>

              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50" dir="rtl">
                  <AlertCircle className="h-5 w-5 ml-2" />
                  <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
                </Alert>
              )}

              {/* תוכן הטאבים */}
              <TabsContent value="active" className="space-y-6">
                <SuggestionsList
                  suggestions={activeSuggestions}
                  userId={userId}
                  viewMode={viewMode}
                  isLoading={isLoading}
                  onStatusChange={handleStatusChange}
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
                  onRefresh={handleRefresh}
                  isUserInActiveProcess={isUserInActiveProcess}
                />
              </TabsContent>

              <TabsContent value="pending" className="space-y-6">
                <SuggestionsList
                  suggestions={activeSuggestions.filter(
                    (s) =>
                      s.status === "PENDING_FIRST_PARTY" ||
                      s.status === "PENDING_SECOND_PARTY"
                  )}
                  userId={userId}
                  viewMode={viewMode}
                  isLoading={isLoading}
                  onStatusChange={handleStatusChange}
                  onRefresh={handleRefresh}
                  isUserInActiveProcess={isUserInActiveProcess}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MatchSuggestionsContainer;