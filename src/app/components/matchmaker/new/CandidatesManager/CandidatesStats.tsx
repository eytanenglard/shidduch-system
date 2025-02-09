// /CandidatesManager/CandidatesStats.tsx

"use client";

import React, { useState, useCallback } from "react";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  UserSquare2,
  HeartHandshake,
  Clock,
  MapPin,
  Scroll,
  CheckCircle,
  Image as ImageIcon,
} from "lucide-react";
import { useStatistics } from "../hooks/useStatistics";
import type { Candidate } from "../types/candidates";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

interface CandidatesStatsProps {
  candidates: Candidate[];
  className?: string;
}

const CHART_COLORS = [
  "#3B82F6", // כחול
  "#EF4444", // אדום
  "#10B981", // ירוק
  "#F59E0B", // כתום
  "#6366F1", // סגול
  "#EC4899", // ורוד
];

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  className,
}) => (
  <Card className={`p-6 ${className}`}>
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-semibold">{value}</p>
        {description && <p className="text-xs text-gray-400">{description}</p>}
        {trend && (
          <div
            className={`text-xs flex items-center gap-1 ${
              trend.isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            <span>{trend.isPositive ? "↑" : "↓"}</span>
            <span>{Math.abs(trend.value)}%</span>
            <span>מהחודש שעבר</span>
          </div>
        )}
      </div>
      <div className="bg-blue-50 p-3 rounded-lg">{icon}</div>
    </div>
  </Card>
);

const CandidatesStats: React.FC<CandidatesStatsProps> = ({
  candidates,
  className,
}) => {
  const {
    stats,
    getGenderRatio,
    getTopCities,
    getActiveUsersPercent,
    getAgeGroupDistribution,
    getReligiousDistribution,
    getActivityTrend,
    getProfileCompletionStats,
  } = useStatistics(candidates);

  const genderRatio = getGenderRatio();
  const activeUsers = getActiveUsersPercent();
  const completionStats = getProfileCompletionStats();
  const ageDistribution = getAgeGroupDistribution();
  const religiousDistribution = getReligiousDistribution();
  const activityTrend = getActivityTrend();
  const topCities = getTopCities(5);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* סטטיסטיקות עיקריות */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="סה״כ מועמדים"
          value={stats.gender.total}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          description="סה״כ מועמדים פעילים במערכת"
        />
        <StatCard
          title="יחס מועמדים/ות"
          value={genderRatio.formattedRatio}
          icon={<UserSquare2 className="w-6 h-6 text-blue-600" />}
          description="גברים/נשים"
        />
        <StatCard
          title="פעילות בשבוע האחרון"
          value={`${activeUsers}%`}
          icon={<Clock className="w-6 h-6 text-blue-600" />}
          trend={{
            value: 5,
            isPositive: true,
          }}
        />
        <StatCard
          title="פרופילים מלאים"
          value={`${completionStats.percentage}%`}
          icon={<CheckCircle className="w-6 h-6 text-blue-600" />}
          description={`${completionStats.completed} מתוך ${stats.gender.total}`}
        />
      </div>

      {/* טאבים לניתוחים מתקדמים */}
      <Tabs defaultValue="demographics" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="demographics">דמוגרפיה</TabsTrigger>
          <TabsTrigger value="activity">פעילות</TabsTrigger>
          <TabsTrigger value="completion">שלמות פרופילים</TabsTrigger>
        </TabsList>

        {/* דמוגרפיה */}
        <TabsContent value="demographics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* התפלגות גילאים */}
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">התפלגות גילאים</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ageDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* התפלגות דתית */}
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">התפלגות רמת דתיות</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={religiousDistribution}
                    dataKey="count"
                    nameKey="level"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {religiousDistribution.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* מיקומים מובילים */}
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">ערים מובילות</h3>
              <div className="space-y-4">
                {topCities.map((city) => (
                  <div
                    key={city.city}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span>{city.city}</span>
                    </div>
                    <span className="font-medium">{city.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* פעילות */}
        <TabsContent value="activity">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* פעילות לאורך זמן */}
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">פעילות משתמשים</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>פעילים בשבוע האחרון</span>
                  <span className="font-medium">{activityTrend.weekly}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>פעילים בחודש האחרון</span>
                  <span className="font-medium">{activityTrend.monthly}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>ממוצע ימים בין התחברויות</span>
                  <span className="font-medium">
                    {activityTrend.average} ימים
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* שלמות פרופילים */}
        <TabsContent value="completion">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">שלמות פרופילים</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span>תמונות פרופיל</span>
                  </div>
                  <span className="font-medium">
                    {stats.completion.percentages.hasPhotos}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span>פרופיל מאומת</span>
                  </div>
                  <span className="font-medium">
                    {stats.completion.percentages.isVerified}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>המלצות</span>
                  </div>
                  <span className="font-medium">
                    {stats.completion.percentages.hasReferences}%
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CandidatesStats;
