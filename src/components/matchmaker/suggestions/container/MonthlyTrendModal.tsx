import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Activity,
  Users,
  CheckCircle,
  Clock,
  Heart,
  Award,
  Target,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Star,
  Crown,
  Zap,
  Download,
  RefreshCw,
  Eye,
  XCircle,
} from 'lucide-react';
import type { Suggestion } from '@/types/suggestions';
import { cn } from '@/lib/utils';

interface MonthlyTrendModalProps {
  suggestions: Suggestion[];
}

interface MonthlyData {
  month: string;
  year: number;
  count: number;
  active: number;
  pending: number;
  success: number;
  declined: number;
}

interface TrendCardProps {
  title: string;
  value: number;
  trend: number;
  icon: React.ElementType;
  gradient: string;
  description: string;
}

const TrendCard: React.FC<TrendCardProps> = ({
  title,
  value,
  trend,
  icon: Icon,
  gradient,
  description,
}) => (
  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden rounded-2xl">
    <div
      className={cn('absolute inset-0 opacity-5 bg-gradient-to-br', gradient)}
    />
    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-xl" />

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
        <div
          className={cn(
            'flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold',
            trend >= 0
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          )}
        >
          {trend >= 0 ? (
            <ArrowUp className="w-3 h-3" />
          ) : (
            <ArrowDown className="w-3 h-3" />
          )}
          {Math.abs(trend)}%
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
      </div>
    </CardContent>
  </Card>
);

const MonthlyTrendModal: React.FC<MonthlyTrendModalProps> = ({
  suggestions,
}) => {
  // Group suggestions by month to prepare data for chart
  const monthlyData = useMemo(() => {
    const data = suggestions.reduce(
      (acc, s) => {
        const createdDate = new Date(s.createdAt);
        const month = createdDate.getMonth();
        const year = createdDate.getFullYear();
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
      {} as Record<string, MonthlyData>
    );

    // Convert to array and sort by date
    return Object.values(data).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      const monthA = new Date(
        a.year,
        a.month === 'ינו' ? 0 : new Date(`1 ${a.month} 2000`).getMonth()
      ).getMonth();
      const monthB = new Date(
        b.year,
        b.month === 'ינו' ? 0 : new Date(`1 ${b.month} 2000`).getMonth()
      ).getMonth();
      return monthA - monthB;
    });
  }, [suggestions]);

  // Calculate trends
  const trends = useMemo(() => {
    if (monthlyData.length < 2)
      return { active: 0, pending: 0, success: 0, total: 0 };

    const current = monthlyData[monthlyData.length - 1];
    const previous = monthlyData[monthlyData.length - 2];

    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      active: calculateTrend(current.active, previous.active),
      pending: calculateTrend(current.pending, previous.pending),
      success: calculateTrend(current.success, previous.success),
      total: calculateTrend(current.count, previous.count),
    };
  }, [monthlyData]);

  // Chart data
  const chartData = monthlyData.map((month) => ({
    name: `${month.month} ${month.year}`,
    פעילות: month.active,
    ממתינות: month.pending,
    הצלחות: month.success,
    נדחו: month.declined,
    'סה״כ': month.count,
  }));

  const pieData =
    monthlyData.length > 0
      ? [
          {
            name: 'פעילות',
            value: monthlyData[monthlyData.length - 1].active,
            color: '#3B82F6',
          },
          {
            name: 'ממתינות',
            value: monthlyData[monthlyData.length - 1].pending,
            color: '#F59E0B',
          },
          {
            name: 'הצלחות',
            value: monthlyData[monthlyData.length - 1].success,
            color: '#10B981',
          },
          {
            name: 'נדחו',
            value: monthlyData[monthlyData.length - 1].declined,
            color: '#EF4444',
          },
        ]
      : [];

  const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444'];

  if (monthlyData.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-6">
          <BarChart3 className="w-12 h-12 text-purple-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          אין מספיק נתונים
        </h3>
        <p className="text-gray-600">אין מספיק נתונים להצגת מגמה חודשית</p>
      </div>
    );
  }

  const currentMonth = monthlyData[monthlyData.length - 1];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-50 via-cyan-50/30 to-emerald-50/20 rounded-3xl"></div>
        <div className="relative z-10 p-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xl">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2">
            מגמה חודשית מפורטת
          </h2>
          <p className="text-gray-600 text-lg">
            ניתוח מעמיק של ביצועי ההצעות לאורך זמן
          </p>
        </div>
      </div>

      {/* Trend Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <TrendCard
          title="סה״כ הצעות"
          value={currentMonth.count}
          trend={trends.total}
          icon={Users}
          gradient="from-blue-500 to-cyan-500"
          description={`${trends.total >= 0 ? 'גידול' : 'ירידה'} מהחודש הקודם`}
        />

        <TrendCard
          title="הצעות פעילות"
          value={currentMonth.active}
          trend={trends.active}
          icon={Target}
          gradient="from-green-500 to-emerald-500"
          description="הצעות בטיפול פעיל"
        />

        <TrendCard
          title="ממתינות לאישור"
          value={currentMonth.pending}
          trend={trends.pending}
          icon={Clock}
          gradient="from-yellow-500 to-amber-500"
          description="זמן תגובה ממוצע"
        />

        <TrendCard
          title="הצעות מוצלחות"
          value={currentMonth.success}
          trend={trends.success}
          icon={Crown}
          gradient="from-purple-500 to-pink-500"
          description="הגיעו להצלחה מלאה"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Trend Chart */}
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white overflow-hidden rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  מגמת הצעות לאורך זמן
                </h3>
              </div>
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1 rounded-full">
                {monthlyData.length} חודשים
              </Badge>
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
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorPending"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorSuccess"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value, name) => [value, name]}
                    labelFormatter={(label) => `חודש: ${label}`}
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

        {/* Distribution Pie Chart */}
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white overflow-hidden rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                  <PieChartIcon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  התפלגות החודש הנוכחי
                </h3>
              </div>
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full">
                {currentMonth.month} {currentMonth.year}
              </Badge>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
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
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Monthly Breakdown Table */}
      <Card className="border-0 shadow-xl bg-white overflow-hidden rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                פירוט חודשי מלא
              </h3>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              >
                <Download className="w-4 h-4 ml-2" />
                ייצוא
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <Eye className="w-4 h-4 ml-2" />
                הצג הכל
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-slate-50">
                  <th className="p-4 text-right font-bold text-gray-800 border-b border-gray-200 rounded-tr-xl">
                    חודש
                  </th>
                  <th className="p-4 text-center font-bold text-gray-800 border-b border-gray-200">
                    סה״כ
                  </th>
                  <th className="p-4 text-center font-bold text-gray-800 border-b border-gray-200">
                    פעילות
                  </th>
                  <th className="p-4 text-center font-bold text-gray-800 border-b border-gray-200">
                    ממתינות
                  </th>
                  <th className="p-4 text-center font-bold text-gray-800 border-b border-gray-200">
                    הצלחות
                  </th>
                  <th className="p-4 text-center font-bold text-gray-800 border-b border-gray-200 rounded-tl-xl">
                    נדחו
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthlyData
                  .slice()
                  .reverse()
                  .map((month, idx) => (
                    <tr
                      key={idx}
                      className={cn(
                        'hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all duration-200',
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50',
                        idx === 0 &&
                          'bg-gradient-to-r from-blue-50 to-cyan-50 font-semibold'
                      )}
                    >
                      <td className="p-4 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <span className="font-bold text-gray-800">
                            {month.month} {month.year}
                          </span>
                          {idx === 0 && (
                            <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs px-2 py-1">
                              נוכחי
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center border-b border-gray-100">
                        <div className="flex items-center justify-center gap-2">
                          <Users className="w-4 h-4 text-blue-500" />
                          <span className="font-bold text-blue-600">
                            {month.count}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center border-b border-gray-100">
                        <div className="flex items-center justify-center gap-2">
                          <Target className="w-4 h-4 text-green-500" />
                          <span className="font-bold text-green-600">
                            {month.active}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center border-b border-gray-100">
                        <div className="flex items-center justify-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-500" />
                          <span className="font-bold text-yellow-600">
                            {month.pending}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center border-b border-gray-100">
                        <div className="flex items-center justify-center gap-2">
                          <Crown className="w-4 h-4 text-purple-500" />
                          <span className="font-bold text-purple-600">
                            {month.success}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center border-b border-gray-100">
                        <div className="flex items-center justify-center gap-2">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="font-bold text-red-600">
                            {month.declined}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-indigo-50 to-purple-50 overflow-hidden rounded-2xl">
        <CardContent className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-xl">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-indigo-800">
                תובנות מרכזיות
              </h3>
              <p className="text-indigo-600">ניתוח המגמות והביצועים</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-white/70 rounded-xl shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="w-6 h-6 text-green-500" />
                <h4 className="font-bold text-gray-800">מגמת צמיחה</h4>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {trends.total >= 0
                  ? `גידול של ${trends.total}% בכמות ההצעות השוטפות מהחודש הקודם`
                  : `ירידה של ${Math.abs(trends.total)}% בכמות ההצעות השוטפות מהחודש הקודם`}
              </p>
            </div>

            <div className="p-6 bg-white/70 rounded-xl shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <Award className="w-6 h-6 text-purple-500" />
                <h4 className="font-bold text-gray-800">אחוז הצלחה</h4>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {currentMonth.count > 0
                  ? `${Math.round((currentMonth.success / currentMonth.count) * 100)}% מההצעות הגיעו להצלחה בחודש הנוכחי`
                  : 'אין מספיק נתונים לחישוב אחוז הצלחה'}
              </p>
            </div>

            <div className="p-6 bg-white/70 rounded-xl shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <Activity className="w-6 h-6 text-blue-500" />
                <h4 className="font-bold text-gray-800">פעילות שוטפת</h4>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {currentMonth.active + currentMonth.pending} הצעות זקוקות לטיפול
                פעיל או המתנה לתגובה
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyTrendModal;
