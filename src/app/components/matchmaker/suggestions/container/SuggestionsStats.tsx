import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  Users,
  CheckCircle,
  Clock,
  Calendar,
  AlertCircle,
  Ban,
  X,
} from "lucide-react";
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
  Legend,
} from "recharts";
import type { Suggestion, SuggestionFilters } from "@/types/suggestions";
import { MatchSuggestionStatus, Priority } from "@prisma/client";

interface StatsCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  onClick?: () => void;
  isClickable?: boolean;
}

interface SuggestionsStatsProps {
  suggestions: Suggestion[];
  className?: string;
  onFilterChange?: (filter: Partial<SuggestionFilters>) => void;
}

const COLORS = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
];

const StatsCard: React.FC<StatsCardProps> = ({
  icon: Icon,
  title,
  value,
  trend,
  className,
  onClick,
  isClickable = false,
}) => (
  <Card
    className={`p-4 ${className} ${
      isClickable ? "cursor-pointer hover:shadow-md transition-shadow" : ""
    }`}
    onClick={onClick}
  >
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
              {trend.value > 0 ? "+" : ""}
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
  onFilterChange,
}) => {
  const stats = useMemo(() => {
    const total = suggestions.length;
    const active = suggestions.filter((s) => s.category === "ACTIVE").length;
    const pending = suggestions.filter((s) => s.category === "PENDING").length;
    const history = suggestions.filter((s) => s.category === "HISTORY").length;

    const approvedByFirst = suggestions.filter(
      (s) => s.status === "FIRST_PARTY_APPROVED"
    ).length;
    const approvedBySecond = suggestions.filter(
      (s) => s.status === "SECOND_PARTY_APPROVED"
    ).length;
    const declined = suggestions.filter(
      (s) =>
        s.status === "FIRST_PARTY_DECLINED" ||
        s.status === "SECOND_PARTY_DECLINED"
    ).length;
    const expired = suggestions.filter((s) => s.status === "EXPIRED").length;
    const dating = suggestions.filter((s) => s.status === "DATING").length;
    const success = suggestions.filter((s) =>
      ["MARRIED", "ENGAGED"].includes(s.status)
    ).length;

    const byStatus = suggestions.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group suggestions by month
    const monthlyData = suggestions.reduce(
      (acc, s) => {
        const month = new Date(s.createdAt).getMonth();
        const year = new Date(s.createdAt).getFullYear();
        const key = `${year}-${month + 1}`;

        if (!acc[key]) {
          acc[key] = {
            month: new Date(year, month).toLocaleString("he", {
              month: "short",
            }),
            year: year,
            count: 0,
            active: 0,
            pending: 0,
            success: 0,
            declined: 0,
          };
        }

        acc[key].count += 1;

        if (s.category === "ACTIVE") acc[key].active += 1;
        if (s.category === "PENDING") acc[key].pending += 1;
        if (["MARRIED", "ENGAGED"].includes(s.status)) acc[key].success += 1;
        if (
          s.status === "FIRST_PARTY_DECLINED" ||
          s.status === "SECOND_PARTY_DECLINED"
        ) {
          acc[key].declined += 1;
        }

        return acc;
      },
      {} as Record<
        string,
        {
          month: string;
          year: number;
          count: number;
          active: number;
          pending: number;
          success: number;
          declined: number;
        }
      >
    );

    // Convert to array and sort by date
    const monthlyArray = Object.values(monthlyData).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month.localeCompare(b.month);
    });

    // Calculate trends
    const calculateTrend = (currentValue: number, previousValue: number) => {
      if (previousValue === 0) return currentValue > 0 ? 100 : 0;
      return Math.round(((currentValue - previousValue) / previousValue) * 100);
    };

    // Calculate success rate
    const successRate = total > 0 ? Math.round((success / total) * 100) : 0;

    // Get current month stats vs previous month for trend
    let activeTrend = 0;
    let pendingTrend = 0;
    let successTrend = 0;

    if (monthlyArray.length >= 2) {
      const currentMonth = monthlyArray[monthlyArray.length - 1];
      const previousMonth = monthlyArray[monthlyArray.length - 2];

      activeTrend = calculateTrend(currentMonth.active, previousMonth.active);
      pendingTrend = calculateTrend(
        currentMonth.pending,
        previousMonth.pending
      );
      successTrend = calculateTrend(
        currentMonth.success,
        previousMonth.success
      );
    }

    // Group by priority
    const byPriority = suggestions.reduce((acc, s) => {
      acc[s.priority] = (acc[s.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      active,
      pending,
      history,
      approvedByFirst,
      approvedBySecond,
      declined,
      expired,
      dating,
      success,
      successRate,
      byStatus,
      byPriority,
      monthlyData: monthlyArray,
      trends: {
        active: activeTrend,
        pending: pendingTrend,
        success: successTrend,
      },
    };
  }, [suggestions]);

  // Filter by status
  const handleStatusClick = (status: MatchSuggestionStatus) => {
    if (onFilterChange) {
      onFilterChange({ status: [status] });
    }
  };

  // Filter by priority
  const handlePriorityClick = (priority: string) => {
    if (onFilterChange) {
      onFilterChange({ priority: [priority as Priority] });
    }
  };

  // Get nice display label for status
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING_FIRST_PARTY: "ממתין לצד א׳",
      PENDING_SECOND_PARTY: "ממתין לצד ב׳",
      FIRST_PARTY_APPROVED: "צד א׳ אישר",
      SECOND_PARTY_APPROVED: "צד ב׳ אישר",
      FIRST_PARTY_DECLINED: "צד א׳ דחה",
      SECOND_PARTY_DECLINED: "צד ב׳ דחה",
      CONTACT_DETAILS_SHARED: "פרטי קשר שותפו",
      DATING: "בתהליך היכרות",
      EXPIRED: "פג תוקף",
      ENGAGED: "מאורסים",
      MARRIED: "נישאו",
      DRAFT: "טיוטה",
      CLOSED: "סגור",
      CANCELLED: "בוטל",
      AWAITING_FIRST_DATE_FEEDBACK: "ממתין למשוב פגישה",
    };

    return statusMap[status] || status;
  };

  // Get priority display label
  const getPriorityLabel = (priority: string) => {
    const priorityMap: Record<string, string> = {
      URGENT: "דחוף",
      HIGH: "עדיפות גבוהה",
      MEDIUM: "עדיפות רגילה",
      LOW: "עדיפות נמוכה",
    };

    return priorityMap[priority] || priority;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          icon={Users}
          title="סה״כ הצעות"
          value={stats.total}
          trend={{
            value: stats.trends.active,
            isPositive: stats.trends.active >= 0,
          }}
          isClickable={true}
          onClick={() => onFilterChange && onFilterChange({})}
        />
        <StatsCard
          icon={CheckCircle}
          title="הצעות פעילות"
          value={stats.active}
          trend={{
            value: stats.trends.active,
            isPositive: stats.trends.active >= 0,
          }}
          isClickable={true}
          onClick={() =>
            onFilterChange &&
            onFilterChange({
              status: [
                "DATING",
                "FIRST_PARTY_APPROVED",
                "SECOND_PARTY_APPROVED",
                "CONTACT_DETAILS_SHARED",
              ],
            })
          }
        />
        <StatsCard
          icon={Clock}
          title="ממתינות לתגובה"
          value={stats.pending}
          trend={{
            value: stats.trends.pending,
            isPositive: stats.trends.pending >= 0,
          }}
          isClickable={true}
          onClick={() =>
            onFilterChange &&
            onFilterChange({
              status: ["PENDING_FIRST_PARTY", "PENDING_SECOND_PARTY"],
            })
          }
        />
        <StatsCard
          icon={Calendar}
          title="שידוכים מוצלחים"
          value={`${stats.successRate}%`}
          trend={{
            value: stats.trends.success,
            isPositive: stats.trends.success >= 0,
          }}
          isClickable={true}
          onClick={() =>
            onFilterChange &&
            onFilterChange({
              status: ["DATING", "ENGAGED", "MARRIED"],
            })
          }
        />
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-4">
        <Card
          className="p-3 cursor-pointer hover:shadow-md transition-shadow bg-yellow-50"
          onClick={() =>
            onFilterChange &&
            onFilterChange({
              status: ["PENDING_FIRST_PARTY"],
            })
          }
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <div className="text-xs">ממתין לצד א׳</div>
            <div className="font-bold ml-auto">
              {stats.byStatus["PENDING_FIRST_PARTY"] || 0}
            </div>
          </div>
        </Card>

        <Card
          className="p-3 cursor-pointer hover:shadow-md transition-shadow bg-blue-50"
          onClick={() =>
            onFilterChange &&
            onFilterChange({
              status: ["PENDING_SECOND_PARTY"],
            })
          }
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <div className="text-xs">ממתין לצד ב׳</div>
            <div className="font-bold ml-auto">
              {stats.byStatus["PENDING_SECOND_PARTY"] || 0}
            </div>
          </div>
        </Card>

        <Card
          className="p-3 cursor-pointer hover:shadow-md transition-shadow bg-red-50"
          onClick={() =>
            onFilterChange &&
            onFilterChange({
              status: ["FIRST_PARTY_DECLINED", "SECOND_PARTY_DECLINED"],
            })
          }
        >
          <div className="flex items-center gap-2">
            <X className="w-4 h-4 text-red-600" />
            <div className="text-xs">הצעות שנדחו</div>
            <div className="font-bold ml-auto">{stats.declined}</div>
          </div>
        </Card>

        <Card
          className="p-3 cursor-pointer hover:shadow-md transition-shadow bg-pink-50"
          onClick={() =>
            onFilterChange &&
            onFilterChange({
              status: ["DATING"],
            })
          }
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-pink-600" />
            <div className="text-xs">בתהליך היכרות</div>
            <div className="font-bold ml-auto">
              {stats.byStatus["DATING"] || 0}
            </div>
          </div>
        </Card>

        <Card
          className="p-3 cursor-pointer hover:shadow-md transition-shadow bg-gray-50"
          onClick={() =>
            onFilterChange &&
            onFilterChange({
              status: ["EXPIRED"],
            })
          }
        >
          <div className="flex items-center gap-2">
            <Ban className="w-4 h-4 text-gray-600" />
            <div className="text-xs">פג תוקף</div>
            <div className="font-bold ml-auto">
              {stats.byStatus["EXPIRED"] || 0}
            </div>
          </div>
        </Card>
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
                  data={Object.entries(stats.byStatus)
                    .filter(([, count]) => count > 0)
                    .map(([status, count]) => ({
                      name: getStatusLabel(status),
                      value: count,
                      status: status,
                    }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  dataKey="value"
                  onClick={(data) =>
                    handleStatusClick(data.status as MatchSuggestionStatus)
                  }
                >
                  {Object.entries(stats.byStatus)
                    .filter(([, count]) => count > 0)
                    .map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        style={{ cursor: "pointer" }}
                      />
                    ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} הצעות`, ""]} />
                <Legend />
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
                data={stats.monthlyData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`${value} הצעות`, ""]}
                  labelFormatter={(label) => `חודש ${label}`}
                />
                <Legend />
                <Bar dataKey="active" name="פעילות" fill="#3B82F6" />
                <Bar dataKey="pending" name="ממתינות" fill="#F59E0B" />
                <Bar dataKey="success" name="הצלחות" fill="#10B981" />
                <Bar dataKey="declined" name="נדחו" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Priority Distribution */}
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">התפלגות לפי עדיפות</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {Object.entries(stats.byPriority)
            .sort(([a], [b]) => {
              const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
              return (
                priorityOrder[a as keyof typeof priorityOrder] -
                priorityOrder[b as keyof typeof priorityOrder]
              );
            })
            .map(([priority, count]) => (
              <Card
                key={priority}
                className={`p-3 cursor-pointer hover:shadow-md transition-shadow
                  ${
                    priority === "URGENT"
                      ? "bg-red-50"
                      : priority === "HIGH"
                      ? "bg-orange-50"
                      : priority === "MEDIUM"
                      ? "bg-blue-50"
                      : "bg-gray-50"
                  }`}
                onClick={() => handlePriorityClick(priority)}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full 
                    ${
                      priority === "URGENT"
                        ? "bg-red-500"
                        : priority === "HIGH"
                        ? "bg-orange-500"
                        : priority === "MEDIUM"
                        ? "bg-blue-500"
                        : "bg-gray-500"
                    }`}
                  />
                  <div className="text-sm">{getPriorityLabel(priority)}</div>
                  <div className="font-bold ml-auto">{count}</div>
                </div>
              </Card>
            ))}
        </div>
      </Card>
    </div>
  );
};

export default SuggestionsStats;
