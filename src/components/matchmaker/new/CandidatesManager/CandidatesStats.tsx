// /CandidatesManager/CandidatesStats.tsx

'use client';

import React from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserCheck,
  Clock,
  MapPin,
  CheckCircle,
  Image as ImageIcon,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Activity,
  Heart,
  Star,
  Award,
  Sparkles,
  Target,
  Crown,
  Zap,
} from 'lucide-react';
import { useStatistics } from '../hooks/useStatistics';
import type { Candidate } from '../types/candidates';
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
} from 'recharts';
import { cn } from '@/lib/utils';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';

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
  gradient: string;
  iconColor: string;
  dict: MatchmakerPageDictionary['candidatesManager']['stats']['mainStats']['trend'];
}

interface CandidatesStatsProps {
  candidates: Candidate[];
  className?: string;
  dict: MatchmakerPageDictionary['candidatesManager']['stats'];
}

const CHART_COLORS = [
  '#3B82F6', // כחול
  '#EF4444', // אדום
  '#10B981', // ירוק
  '#F59E0B', // כתום
  '#8B5CF6', // סגול
  '#EC4899', // ורוד
  '#06B6D4', // ציאן
  '#84CC16', // ליים
];

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  className,
  gradient,
  iconColor,
  dict,
}) => (
  <Card
    className={cn(
      'border-0 shadow-xl bg-gradient-to-br from-white via-gray-50/30 to-white overflow-hidden group hover:shadow-2xl transition-all duration-300 transform hover:scale-105',
      className
    )}
  >
    <CardContent className="p-6 relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-2xl opacity-50"></div>

      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-3 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-800">{value}</p>
            {trend && (
              <div
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold',
                  trend.isPositive
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700'
                    : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700'
                )}
              >
                {trend.isPositive ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )}
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
          {description && (
            <p className="text-sm text-gray-500 leading-relaxed">
              {description}
            </p>
          )}
          {trend && (
            <p className="text-xs text-gray-400">
              {trend.isPositive ? dict.increase : dict.decrease} {dict.period}
            </p>
          )}
        </div>

        <div
          className={cn(
            'p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300',
            `bg-gradient-to-r ${gradient}`
          )}
        >
          <div className={iconColor}>{icon}</div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const EnhancedChartCard: React.FC<{
  title: string;
  children: React.ReactNode;
  description?: string;
  gradient?: string;
  icon?: React.ReactNode;
}> = ({
  title,
  children,
  description,
  gradient = 'from-blue-500 to-cyan-500',
  icon,
}) => (
  <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-gray-50/30 to-white overflow-hidden hover:shadow-2xl transition-all duration-300">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {icon && (
            <div
              className={cn(
                'p-3 rounded-full shadow-lg',
                `bg-gradient-to-r ${gradient}`
              )}
            >
              <div className="text-white">{icon}</div>
            </div>
          )}
          <div>
            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
            {description && (
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            )}
          </div>
        </div>
      </div>
      {children}
    </CardContent>
  </Card>
);

const CandidatesStats: React.FC<CandidatesStatsProps> = ({
  candidates,
  className,
  dict,
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
    <div className={cn('space-y-8', className)}>
      <div className="relative min-h-[200px] bg-gradient-to-br from-purple-50 via-cyan-50/30 to-emerald-50/20 overflow-hidden rounded-3xl shadow-2xl p-8">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-64 h-64 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-float"></div>
          <div
            className="absolute bottom-10 left-10 w-48 h-48 bg-gradient-to-br from-cyan-200/30 to-blue-200/30 rounded-full blur-2xl animate-float"
            style={{ animationDelay: '2s' }}
          ></div>
        </div>

        <div className="relative z-10 text-center">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="p-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
              <Activity className="w-10 h-10" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4">
            {dict.hero.title}
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
            {dict.hero.subtitle}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={dict.mainStats.total.title}
          value={stats.gender.total}
          icon={<Users className="w-8 h-8" />}
          description={dict.mainStats.total.description}
          gradient="from-blue-500 to-cyan-500"
          iconColor="text-white"
          trend={{ value: 12, isPositive: true }}
          dict={dict.mainStats.trend}
        />
        <StatCard
          title={dict.mainStats.ratio.title}
          value={genderRatio.formattedRatio}
          icon={<UserCheck className="w-8 h-8" />}
          description={dict.mainStats.ratio.description}
          gradient="from-purple-500 to-pink-500"
          iconColor="text-white"
          dict={dict.mainStats.trend}
        />
        <StatCard
          title={dict.mainStats.activity.title}
          value={`${activeUsers}%`}
          icon={<Clock className="w-8 h-8" />}
          gradient="from-green-500 to-emerald-500"
          iconColor="text-white"
          trend={{ value: 8, isPositive: true }}
          dict={dict.mainStats.trend}
        />
        <StatCard
          title={dict.mainStats.completion.title}
          value={`${completionStats.percentage}%`}
          icon={<CheckCircle className="w-8 h-8" />}
          description={dict.mainStats.completion.description
            .replace('{{completed}}', completionStats.completed.toString())
            .replace('{{total}}', stats.gender.total.toString())}
          gradient="from-orange-500 to-amber-500"
          iconColor="text-white"
          trend={{ value: 5, isPositive: true }}
          dict={dict.mainStats.trend}
        />
      </div>

      <Tabs defaultValue="demographics" className="w-full">
        <TabsList className="bg-purple-50/50 rounded-2xl p-1.5 h-auto shadow-lg border border-white/50 grid w-full grid-cols-3">
          <TabsTrigger
            value="demographics"
            className="flex items-center gap-2 rounded-xl transition-all duration-300 py-3 hover:scale-105 data-[state=active]:bg-white data-[state=active]:shadow-lg font-semibold"
          >
            <Users className="w-5 h-5" />
            {dict.tabs.demographics}
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="flex items-center gap-2 rounded-xl transition-all duration-300 py-3 hover:scale-105 data-[state=active]:bg-white data-[state=active]:shadow-lg font-semibold"
          >
            <Activity className="w-5 h-5" />
            {dict.tabs.activity}
          </TabsTrigger>
          <TabsTrigger
            value="completion"
            className="flex items-center gap-2 rounded-xl transition-all duration-300 py-3 hover:scale-105 data-[state=active]:bg-white data-[state=active]:shadow-lg font-semibold"
          >
            <Target className="w-5 h-5" />
            {dict.tabs.completion}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="demographics" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <EnhancedChartCard
              title={dict.charts.ageDistribution.title}
              description={dict.charts.ageDistribution.description}
              gradient="from-blue-500 to-cyan-500"
              icon={<Users className="w-6 h-6" />}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ageDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#666" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#blueGradient)"
                    radius={[4, 4, 0, 0]}
                  />
                  <defs>
                    <linearGradient
                      id="blueGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop
                        offset="95%"
                        stopColor="#06B6D4"
                        stopOpacity={0.6}
                      />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </EnhancedChartCard>

            <EnhancedChartCard
              title={dict.charts.religiousDistribution.title}
              description={dict.charts.religiousDistribution.description}
              gradient="from-purple-500 to-pink-500"
              icon={<Heart className="w-6 h-6" />}
            >
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={religiousDistribution}
                    dataKey="count"
                    nameKey="level"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={40}
                    paddingAngle={2}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {religiousDistribution.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </EnhancedChartCard>

            <EnhancedChartCard
              title={dict.charts.topCities.title}
              description={dict.charts.topCities.description}
              gradient="from-green-500 to-emerald-500"
              icon={<MapPin className="w-6 h-6" />}
            >
              <div className="space-y-4">
                {topCities.map((city, index) => (
                  <div
                    key={city.city}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg',
                          index === 0
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                            : index === 1
                              ? 'bg-gradient-to-r from-gray-400 to-gray-500'
                              : index === 2
                                ? 'bg-gradient-to-r from-orange-400 to-red-500'
                                : 'bg-gradient-to-r from-green-400 to-emerald-500'
                        )}
                      >
                        {index + 1}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-gray-800">
                          {city.city}
                        </span>
                      </div>
                    </div>
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-sm px-3 py-1 font-bold">
                      {city.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </EnhancedChartCard>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <EnhancedChartCard
              title={dict.charts.userActivity.title}
              description={dict.charts.userActivity.description}
              gradient="from-orange-500 to-amber-500"
              icon={<Activity className="w-6 h-6" />}
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-orange-800">
                        {dict.charts.userActivity.weeklyActive}
                      </span>
                      <TrendingUp className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="text-2xl font-bold text-orange-900">
                      {activityTrend.weekly}
                    </span>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-amber-800">
                        {dict.charts.userActivity.monthlyActive}
                      </span>
                      <Activity className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="text-2xl font-bold text-amber-900">
                      {activityTrend.monthly}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-yellow-800">
                      {dict.charts.userActivity.avgLogin}
                    </span>
                    <Clock className="w-4 h-4 text-yellow-600" />
                  </div>
                  <span className="text-2xl font-bold text-yellow-900">
                    {activityTrend.average} {dict.charts.userActivity.days}
                  </span>
                </div>
              </div>
            </EnhancedChartCard>

            <EnhancedChartCard
              title={dict.charts.activityTrend.title}
              description={dict.charts.activityTrend.description}
              gradient="from-indigo-500 to-purple-500"
              icon={<Star className="w-6 h-6" />}
            >
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-indigo-400" />
                  <p>{dict.charts.activityTrend.comingSoon}</p>
                  <p className="text-sm">
                    {dict.charts.activityTrend.subtitle}
                  </p>
                </div>
              </div>
            </EnhancedChartCard>
          </div>
        </TabsContent>

        <TabsContent value="completion" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <EnhancedChartCard
              title={dict.charts.profileCompletion.title}
              description={dict.charts.profileCompletion.description}
              gradient="from-red-500 to-pink-500"
              icon={<Target className="w-6 h-6" />}
            >
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-100 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-gray-800">
                        {dict.charts.profileCompletion.hasPhotos}
                      </span>
                    </div>
                    <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-sm px-3 py-1 font-bold">
                      {stats.completion.percentages.hasPhotos}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-100 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-gray-800">
                        {dict.charts.profileCompletion.isVerified}
                      </span>
                    </div>
                    <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 shadow-sm px-3 py-1 font-bold">
                      {stats.completion.percentages.isVerified}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-rose-50 to-red-50 rounded-xl border border-rose-100 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-lg">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-gray-800">
                        {dict.charts.profileCompletion.hasReferences}
                      </span>
                    </div>
                    <Badge className="bg-gradient-to-r from-rose-500 to-red-500 text-white border-0 shadow-sm px-3 py-1 font-bold">
                      {stats.completion.percentages.hasReferences}%
                    </Badge>
                  </div>
                </div>
              </div>
            </EnhancedChartCard>

            <EnhancedChartCard
              title={dict.charts.performance.title}
              description={dict.charts.performance.description}
              gradient="from-emerald-500 to-green-500"
              icon={<Award className="w-6 h-6" />}
            >
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
                    <Crown className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                    <div className="text-2xl font-bold text-emerald-800">
                      A+
                    </div>
                    <div className="text-sm text-emerald-600">
                      {dict.charts.performance.qualityRating}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                    <Zap className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold text-green-800">95%</div>
                    <div className="text-sm text-green-600">
                      {dict.charts.performance.satisfaction}
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-blue-800">
                      {dict.charts.performance.monthlyProgress}
                    </span>
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-700">
                        {dict.charts.performance.newCandidates}
                      </span>
                      <span className="font-bold text-blue-800">+12%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-700">
                        {dict.charts.performance.activity}
                      </span>
                      <span className="font-bold text-blue-800">+8%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-700">
                        {dict.charts.performance.profileCompletion}
                      </span>
                      <span className="font-bold text-blue-800">+5%</span>
                    </div>
                  </div>
                </div>
              </div>
            </EnhancedChartCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CandidatesStats;
