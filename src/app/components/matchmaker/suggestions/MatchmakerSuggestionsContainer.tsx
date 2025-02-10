"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Clock, History, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { MatchSuggestionStatus } from "@prisma/client";
import type { MatchSuggestion } from "@prisma/client";
import type { UserProfile, UserImage } from "@/types/next-auth";

// Types
interface ExtendedUserProfile extends UserProfile {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface PartyInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profile: ExtendedUserProfile;
  images: UserImage[];
}

interface ExtendedMatchSuggestion extends MatchSuggestion {
  firstParty: PartyInfo;
  secondParty: PartyInfo;
}

interface Stats {
  totalActive: number;
  pendingResponse: number;
  successRate: number;
}

const MatchmakerSuggestionsContainer = () => {
  // States
  const [activeSuggestions, setActiveSuggestions] = useState<
    ExtendedMatchSuggestion[]
  >([]);
  const [historySuggestions, setHistorySuggestions] = useState<
    ExtendedMatchSuggestion[]
  >([]);
  const [stats, setStats] = useState<Stats>({
    totalActive: 0,
    pendingResponse: 0,
    successRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showNewSuggestionDialog, setShowNewSuggestionDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("active");

  // Load suggestions
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        setIsLoading(true);
        const [activeRes, historyRes] = await Promise.all([
          fetch("/api/matchmaker/suggestions/active"),
          fetch("/api/matchmaker/suggestions/history"),
        ]);

        if (!activeRes.ok || !historyRes.ok) {
          throw new Error("Failed to fetch suggestions");
        }

        const activeData = await activeRes.json();
        const historyData = await historyRes.json();

        setActiveSuggestions(activeData.suggestions);
        setHistorySuggestions(historyData.suggestions);

        // Calculate stats
        const pendingCount = activeData.suggestions.filter(
          (s: ExtendedMatchSuggestion) =>
            [
              MatchSuggestionStatus.PENDING_FIRST_PARTY,
              MatchSuggestionStatus.PENDING_SECOND_PARTY,
            ].includes(s.status)
        ).length;

        const successCount = historyData.suggestions.filter(
          (s: ExtendedMatchSuggestion) =>
            [
              MatchSuggestionStatus.MARRIED,
              MatchSuggestionStatus.ENGAGED,
              MatchSuggestionStatus.DATING,
            ].includes(s.status)
        ).length;

        setStats({
          totalActive: activeData.suggestions.length,
          pendingResponse: pendingCount,
          successRate:
            historyData.suggestions.length > 0
              ? (successCount / historyData.suggestions.length) * 100
              : 0,
        });
      } catch (error) {
        console.error("Error loading suggestions:", error);
        toast.error("שגיאה בטעינת ההצעות");
      } finally {
        setIsLoading(false);
      }
    };

    loadSuggestions();
  }, []);

  // Stats cards
  const StatCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ReactNode;
  }> = ({ title, value, icon }) => (
    <Card className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>
        <div className="bg-blue-50 p-2 rounded-lg">{icon}</div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">ניהול הצעות שידוכים</h1>
        <Button onClick={() => setShowNewSuggestionDialog(true)}>
          <Plus className="w-4 h-4 ml-2" />
          הצעה חדשה
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="הצעות פעילות"
          value={stats.totalActive}
          icon={<Clock className="w-6 h-6 text-blue-600" />}
        />
        <StatCard
          title="ממתינות לתגובה"
          value={stats.pendingResponse}
          icon={<History className="w-6 h-6 text-yellow-600" />}
        />
        <StatCard
          title="אחוז הצלחה"
          value={`${stats.successRate.toFixed(1)}%`}
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
        />
      </div>

      {/* Tabs and Content */}
      <Card className="mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start p-4 bg-gray-50 border-b">
            <TabsTrigger value="active" className="flex items-center gap-2">
              הצעות פעילות
              {stats.totalActive > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
                  {stats.totalActive}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              ממתינות לתגובה
              {stats.pendingResponse > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-yellow-500 text-white text-xs">
                  {stats.pendingResponse}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">היסטוריה</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="p-4">
            {/* תוכן טאב הצעות פעילות יתווסף בהמשך */}
          </TabsContent>

          <TabsContent value="pending" className="p-4">
            {/* תוכן טאב הצעות ממתינות יתווסף בהמשך */}
          </TabsContent>

          <TabsContent value="history" className="p-4">
            {/* תוכן טאב היסטוריה יתווסף בהמשך */}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Dialog components will be added later */}
    </div>
  );
};

export default MatchmakerSuggestionsContainer;
