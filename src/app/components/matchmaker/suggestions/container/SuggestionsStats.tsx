import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  CheckCircle,
  Clock,
  Calendar,
  AlertCircle,
  Ban,
  X,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Heart,
  Star,
  Target,
  Crown,
  Zap,
  Award,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Sparkles,
  Gift,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import type { Suggestion, SuggestionFilters } from '@/types/suggestions';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  className?: string;
  onClick?: () => void;
  isClickable?: boolean;
  description?: string;
  gradient: string;
}

interface SuggestionsStatsProps {
  suggestions: Suggestion[];
  className?: string;
  onFilterChange?: (filter: Partial<SuggestionFilters>) => void;
}

const ModernStatsCard: React.FC<StatsCardProps> = ({
  icon: Icon,
  title,
  value,
  trend,
  className,
  onClick,
  isClickable = false,
  description,
  gradient,
}) => (
  <Card
    className={cn(
      'relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group',
      'bg-gradient-to-br from-white via-gray-50/30 to-white',
      isClickable && 'cursor-pointer transform hover:scale-105',
      className
    )}
    onClick={onClick}
  >
    {/* Background gradient overlay */}
    <div
      className={cn('absolute inset-0 opacity-5 bg-gradient-to-br', gradient)}
    />

    {/* Decorative elements */}
    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-xl" />
    <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-lg" />

    <CardContent className="relative z-10 p-6">
      <div className="flex items-center justify-between mb-4">
        <div
          className={cn(
            'p-3 rounded-full shadow-lg group-hover:scale-110 transition-transform bg-gradient-to-r text-white',
            gradient
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold',
              trend.isPositive
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            )}
          >
            {trend.isPositive ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            )}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3
          className="text-3xl font-bold text-gray-800 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text transition-all duration-300"
          style={{
            backgroundImage: `linear-gradient(to right, ${gradient.replace('from-', '').replace('to-', ', ')})`,
          }}
        >
          {value}
        </h3>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {description && (
          <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
        )}
        {trend?.label && <p className="text-xs text-gray-500">{trend.label}</p>}
      </div>
    </CardContent>
  </Card>
);

const SuggestionsStats: React.FC<SuggestionsStatsProps> = ({
  suggestions,
  className,
  onFilterChange,
}) => {
  const stats = useMemo(() => {
    const total = suggestions.length;
    const active = suggestions.filter((s) => s.category === 'ACTIVE').length;
    const pending = suggestions.filter((s) => s.category === 'PENDING').length;
    const history = suggestions.filter((s) => s.category === 'HISTORY').length;

    const approvedByFirst = suggestions.filter(
      (s) => s.status === 'FIRST_PARTY_APPROVED'
    ).length;
    const approvedBySecond = suggestions.filter(
      (s) => s.status === 'SECOND_PARTY_APPROVED'
    ).length;
    const declined = suggestions.filter(
      (s) =>
        s.status === 'FIRST_PARTY_DECLINED' ||
        s.status === 'SECOND_PARTY_DECLINED'
    ).length;
    const expired = suggestions.filter((s) => s.status === 'EXPIRED').length;
    const dating = suggestions.filter((s) => s.status === 'DATING').length;
    const success = suggestions.filter((s) =>
      ['MARRIED', 'ENGAGED'].includes(s.status)
    ).length;

    const byStatus = suggestions.reduce(
      (acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Group suggestions by month for trends
    const monthlyData = suggestions.reduce(
      (acc, s) => {
        const month = new Date(s.createdAt).getMonth();
        const year = new Date(s.createdAt).getFullYear();
        const key = `${year}-${month + 1}`;

        if (!acc[key]) {
          acc[key] = {
            month: new Date(year, month).toLocaleString('he', {
              month: 'short',
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
        if (s.category === 'ACTIVE') acc[key].active += 1;
        if (s.category === 'PENDING') acc[key].pending += 1;
        if (['MARRIED', 'ENGAGED'].includes(s.status)) acc[key].success += 1;
        if (
          s.status === 'FIRST_PARTY_DECLINED' ||
          s.status === 'SECOND_PARTY_DECLINED'
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

    const monthlyArray = Object.values(monthlyData).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month.localeCompare(b.month);
    });

    // Calculate trends
    const calculateTrend = (currentValue: number, previousValue: number) => {
      if (previousValue === 0) return currentValue > 0 ? 100 : 0;
      return Math.round(((currentValue - previousValue) / previousValue) * 100);
    };

    const successRate = total > 0 ? Math.round((success / total) * 100) : 0;

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
      monthlyData: monthlyArray,
      trends: {
        active: activeTrend,
        pending: pendingTrend,
        success: successTrend,
      },
    };
  }, [suggestions]);

  // Chart data preparation
  const chartData = stats.monthlyData.map((month) => ({
    name: month.month,
    פעילות: month.active,
    ממתינות: month.pending,
    הצלחות: month.success,
    נדחו: month.declined,
  }));

  const pieData = [
    { name: 'פעילות', value: stats.active, color: '#3B82F6' },
    { name: 'ממתינות', value: stats.pending, color: '#F59E0B' },
    { name: 'הצלחות', value: stats.success, color: '#10B981' },
    { name: 'היסטוריה', value: stats.history, color: '#6B7280' },
  ];

  const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#6B7280'];

  return (
    <div className={cn('space-y-8', className)}>
      {/* Hero Stats Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-50 via-cyan-50/30 to-emerald-50/20 rounded-3xl"></div>
        <div className="relative z-10 p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2">
              סקירת הצעות השידוך
            </h2>
            <p className="text-gray-600 text-lg">
              סטטיסטיקות מפורטות על פעילות המערכת
            </p>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <ModernStatsCard
              icon={Users}
              title="סה״כ הצעות"
              value={stats.total}
              trend={{
                value: stats.trends.active,
                isPositive: stats.trends.active >= 0,
                label: 'מהחודש שעבר',
              }}
              gradient="from-blue-500 to-cyan-500"
              isClickable={true}
              onClick={() => onFilterChange && onFilterChange({})}
              description="כלל ההצעות במערכת"
            />

            <ModernStatsCard
              icon={Target}
              title="הצעות פעילות"
              value={stats.active}
              trend={{
                value: stats.trends.active,
                isPositive: stats.trends.active >= 0,
                label: 'גידול חודשי',
              }}
              gradient="from-green-500 to-emerald-500"
              isClickable={true}
              onClick={() =>
                onFilterChange &&
                onFilterChange({
                  status: [
                    'DATING',
                    'FIRST_PARTY_APPROVED',
                    'SECOND_PARTY_APPROVED',
                    'CONTACT_DETAILS_SHARED',
                  ],
                })
              }
              description="הצעות בטיפול פעיל"
            />

            <ModernStatsCard
              icon={Clock}
              title="ממתינות לתגובה"
              value={stats.pending}
              trend={{
                value: stats.trends.pending,
                isPositive: stats.trends.pending <= 0,
                label: 'זמן תגובה ממוצע',
              }}
              gradient="from-yellow-500 to-amber-500"
              isClickable={true}
              onClick={() =>
                onFilterChange &&
                onFilterChange({
                  status: ['PENDING_FIRST_PARTY', 'PENDING_SECOND_PARTY'],
                })
              }
              description="מחכות להחלטת המועמדים"
            />

            <ModernStatsCard
              icon={Crown}
              title="אחוז הצלחה"
              value={`${stats.successRate}%`}
              trend={{
                value: stats.trends.success,
                isPositive: stats.trends.success >= 0,
                label: 'שיפור ביצועים',
              }}
              gradient="from-purple-500 to-pink-500"
              isClickable={true}
              onClick={() =>
                onFilterChange &&
                onFilterChange({
                  status: ['DATING', 'ENGAGED', 'MARRIED'],
                })
              }
              description="זוגות שהגיעו להצלחה"
            />
          </div>
        </div>
      </div>

      {/* Detailed Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card
          className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-yellow-50 to-amber-50"
          onClick={() =>
            onFilterChange &&
            onFilterChange({
              status: ['PENDING_FIRST_PARTY'],
            })
          }
        >
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-amber-500/5" />
          <CardContent className="relative z-10 p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg group-hover:scale-110 transition-transform">
                <AlertCircle className="w-4 h-4" />
              </div>
              <span className="text-2xl font-bold text-yellow-700">
                {stats.byStatus['PENDING_FIRST_PARTY'] || 0}
              </span>
            </div>
            <p className="text-xs font-medium text-yellow-600">ממתין לצד א'</p>
          </CardContent>
        </Card>

        <Card
          className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-blue-50 to-cyan-50"
          onClick={() =>
            onFilterChange &&
            onFilterChange({
              status: ['PENDING_SECOND_PARTY'],
            })
          }
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5" />
          <CardContent className="relative z-10 p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg group-hover:scale-110 transition-transform">
                <AlertCircle className="w-4 h-4" />
              </div>
              <span className="text-2xl font-bold text-blue-700">
                {stats.byStatus['PENDING_SECOND_PARTY'] || 0}
              </span>
            </div>
            <p className="text-xs font-medium text-blue-600">ממתין לצד ב'</p>
          </CardContent>
        </Card>

        <Card
          className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-red-50 to-pink-50"
          onClick={() =>
            onFilterChange &&
            onFilterChange({
              status: ['FIRST_PARTY_DECLINED', 'SECOND_PARTY_DECLINED'],
            })
          }
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-pink-500/5" />
          <CardContent className="relative z-10 p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg group-hover:scale-110 transition-transform">
                <X className="w-4 h-4" />
              </div>
              <span className="text-2xl font-bold text-red-700">
                {stats.declined}
              </span>
            </div>
            <p className="text-xs font-medium text-red-600">הצעות שנדחו</p>
          </CardContent>
        </Card>

        <Card
          className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-pink-50 to-rose-50"
          onClick={() =>
            onFilterChange &&
            onFilterChange({
              status: ['DATING'],
            })
          }
        >
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-rose-500/5" />
          <CardContent className="relative z-10 p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg group-hover:scale-110 transition-transform">
                <Heart className="w-4 h-4" />
              </div>
              <span className="text-2xl font-bold text-pink-700">
                {stats.byStatus['DATING'] || 0}
              </span>
            </div>
            <p className="text-xs font-medium text-pink-600">בתהליך היכרות</p>
          </CardContent>
        </Card>

        <Card
          className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-purple-50 to-indigo-50"
          onClick={() =>
            onFilterChange &&
            onFilterChange({
              status: ['ENGAGED'],
            })
          }
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5" />
          <CardContent className="relative z-10 p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg group-hover:scale-110 transition-transform">
                <Crown className="w-4 h-4" />
              </div>
              <span className="text-2xl font-bold text-purple-700">
                {stats.byStatus['ENGAGED'] || 0}
              </span>
            </div>
            <p className="text-xs font-medium text-purple-600">מאורסים</p>
          </CardContent>
        </Card>

        <Card
          className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-gray-50 to-slate-50"
          onClick={() =>
            onFilterChange &&
            onFilterChange({
              status: ['EXPIRED'],
            })
          }
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-slate-500/5" />
          <CardContent className="relative z-10 p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-lg group-hover:scale-110 transition-transform">
                <Ban className="w-4 h-4" />
              </div>
              <span className="text-2xl font-bold text-gray-700">
                {stats.byStatus['EXPIRED'] || 0}
              </span>
            </div>
            <p className="text-xs font-medium text-gray-600">פג תוקף</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {stats.monthlyData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Monthly Trend Chart */}
          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white overflow-hidden rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">מגמה חודשית</h3>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient
                        id="colorActive"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3B82F6"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3B82F6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorPending"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#F59E0B"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#F59E0B"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorSuccess"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10B981"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10B981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="פעילות"
                      stroke="#3B82F6"
                      fillOpacity={1}
                      fill="url(#colorActive)"
                      strokeWidth={3}
                    />
                    <Area
                      type="monotone"
                      dataKey="ממתינות"
                      stroke="#F59E0B"
                      fillOpacity={1}
                      fill="url(#colorPending)"
                      strokeWidth={3}
                    />
                    <Area
                      type="monotone"
                      dataKey="הצלחות"
                      stroke="#10B981"
                      fillOpacity={1}
                      fill="url(#colorSuccess)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Status Distribution Pie Chart */}
          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white overflow-hidden rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                  <PieChart className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  התפלגות סטטוס
                </h3>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Success Metrics */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 overflow-hidden rounded-2xl">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-xl">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-emerald-800">
                  מדדי הצלחה
                </h3>
                <p className="text-emerald-600">תוצאות וביצועים</p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-4xl font-bold text-emerald-700">
                {stats.successRate}%
              </div>
              <div className="text-sm text-emerald-600">אחוז הצלחה כללי</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white/70 rounded-xl shadow-lg">
              <div className="text-3xl font-bold text-pink-600 mb-2">
                {stats.dating}
              </div>
              <div className="text-sm font-medium text-pink-700">
                זוגות בהיכרות
              </div>
            </div>

            <div className="text-center p-4 bg-white/70 rounded-xl shadow-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {stats.byStatus['ENGAGED'] || 0}
              </div>
              <div className="text-sm font-medium text-purple-700">
                זוגות מאורסים
              </div>
            </div>

            <div className="text-center p-4 bg-white/70 rounded-xl shadow-lg">
              <div className="text-3xl font-bold text-emerald-600 mb-2">
                {stats.byStatus['MARRIED'] || 0}
              </div>
              <div className="text-sm font-medium text-emerald-700">
                זוגות נשואים
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuggestionsStats;
