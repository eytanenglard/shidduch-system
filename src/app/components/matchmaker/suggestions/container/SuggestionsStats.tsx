import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Users, CheckCircle, Clock, Calendar } from "lucide-react";
import {
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
import type { Suggestion } from "@/types/suggestions";

interface StatsCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

interface SuggestionsStatsProps {
  suggestions: Suggestion[];
  className?: string;
}

const COLORS = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#6366F1"];

const StatsCard: React.FC<StatsCardProps> = ({
  icon: Icon,
  title,
  value,
  trend,
  className,
}) => (
  <Card className={`p-4 ${className}`}>
    <div className="flex items-center justify-between">
      <div className="p-2 bg-primary/10 rounded-lg">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-500">{title}</p>
        <h3 className="text-2xl font-semibold mt-1">{value}</h3>
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            <span
              className={trend.isPositive ? "text-green-600" : "text-red-600"}
            >
              {trend.value}%
            </span>
            <span className="text-xs text-gray-500">מהחודש שעבר</span>
          </div>
        )}
      </div>
    </div>
  </Card>
);

const SuggestionsStats: React.FC<SuggestionsStatsProps> = ({
  suggestions,
  className,
}) => {
  const stats = useMemo(() => {
    const total = suggestions.length;
    const active = suggestions.filter(
      (s) => !["CLOSED", "CANCELLED", "EXPIRED"].includes(s.status)
    ).length;
    const success = suggestions.filter((s) =>
      ["MARRIED", "ENGAGED"].includes(s.status)
    ).length;
    const pending = suggestions.filter((s) =>
      s.status.includes("PENDING")
    ).length;

    const byStatus = suggestions.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const monthlyData = suggestions.reduce((acc, s) => {
      const month = new Date(s.createdAt).getMonth();
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      total,
      active,
      success,
      pending,
      byStatus,
      monthlyData,
    };
  }, [suggestions]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          icon={Users}
          title="סה״כ הצעות"
          value={stats.total}
          trend={{ value: 5, isPositive: true }}
        />
        <StatsCard
          icon={CheckCircle}
          title="הצעות פעילות"
          value={stats.active}
        />
        <StatsCard icon={Clock} title="ממתינות לתגובה" value={stats.pending} />
        <StatsCard
          icon={Calendar}
          title="שידוכים מוצלחים"
          value={`${Math.round((stats.success / stats.total) * 100)}%`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">התפלגות סטטוסים</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(stats.byStatus).map(
                    ([status, count]) => ({
                      name: status,
                      value: count,
                    })
                  )}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  dataKey="value"
                >
                  {Object.entries(stats.byStatus).map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Monthly Trend */}
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">מגמה חודשית</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(stats.monthlyData).map(
                  ([month, count]) => ({
                    month: new Date(2024, parseInt(month)).toLocaleString(
                      "he",
                      { month: "short" }
                    ),
                    count,
                  })
                )}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SuggestionsStats;
