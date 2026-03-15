'use client';

// src/components/admin/AnalyticsDashboard.tsx
// ==========================================
// NeshamaTech Admin - Analytics Dashboard
// Beautiful RTL dashboard with teal/orange brand palette
// ==========================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Users,
  TrendingUp,
  Heart,
  Smartphone,
  Monitor,
  Activity,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Zap,
  Filter,
  Eye,
} from 'lucide-react';

// ==========================================
// Types
// ==========================================

interface OverviewData {
  totalUsers: number;
  activeUsers: number;
  newUsersInRange: number;
  totalSuggestions: number;
  activeSuggestions: number;
  totalEvents: number;
}

interface DailyActiveUser {
  date: string;
  count: number;
}

interface TopEvent {
  event: string;
  count: number;
}

interface Funnel {
  registered: number;
  emailVerified: number;
  profileComplete: number;
  phoneVerified: number;
  active: number;
}

interface SuggestionResponse {
  status: string;
  count: number;
}

interface PlatformBreakdown {
  platform: string;
  count: number;
}

interface AnalyticsData {
  overview: OverviewData;
  dailyActiveUsers: DailyActiveUser[];
  topEvents: TopEvent[];
  funnel: Funnel;
  suggestionResponses: SuggestionResponse[];
  platformBreakdown: PlatformBreakdown[];
  range: string;
  since: string;
}

// ==========================================
// Event name translations
// ==========================================

const EVENT_LABELS: Record<string, string> = {
  app_opened: 'פתיחת אפליקציה',
  login_success: 'התחברות מוצלחת',
  login_failed: 'התחברות נכשלה',
  register_started: 'התחלת הרשמה',
  register_completed: 'סיום הרשמה',
  logout: 'התנתקות',
  suggestion_viewed: 'צפייה בהצעה',
  suggestion_approved: 'אישור הצעה',
  suggestion_declined: 'דחיית הצעה',
  suggestion_interested: 'מעוניין בהצעה',
  profile_updated: 'עדכון פרופיל',
  photo_uploaded: 'העלאת תמונה',
  questionnaire_started: 'התחלת שאלון',
  questionnaire_completed: 'סיום שאלון',
  questionnaire_world_completed: 'סיום עולם בשאלון',
  chat_message_sent: 'שליחת הודעה',
  chat_opened: "פתיחת צ'אט",
  screen_viewed: 'צפייה במסך',
  tab_switched: 'מעבר טאב',
  push_notification_received: 'קבלת נוטיפיקציה',
  push_notification_tapped: 'לחיצה על נוטיפיקציה',
  feedback_submitted: 'שליחת משוב',
  api_error: 'שגיאת API',
  app_crash: 'קריסת אפליקציה',
  $identify: 'זיהוי משתמש',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'טיוטה',
  PENDING_FIRST_PARTY: "ממתין לצד א'",
  FIRST_PARTY_APPROVED: "צד א' אישר",
  FIRST_PARTY_INTERESTED: "צד א' מעוניין",
  FIRST_PARTY_DECLINED: "צד א' דחה",
  PENDING_SECOND_PARTY: "ממתין לצד ב'",
  SECOND_PARTY_APPROVED: "צד ב' אישר",
  SECOND_PARTY_DECLINED: "צד ב' דחה",
  CONTACT_DETAILS_SHARED: 'פרטים שותפו',
  DATING: 'בדייטינג',
  ENGAGED: 'מאורסים',
  MARRIED: 'נשואים',
  CLOSED: 'סגור',
  CANCELLED: 'בוטל',
};

// ==========================================
// Utility Components
// ==========================================

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'teal',
  subtitle,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
  color?: 'teal' | 'orange' | 'rose' | 'emerald' | 'sky';
  subtitle?: string;
}) {
  const colorMap = {
    teal: 'from-teal-50 to-emerald-50 border-teal-200',
    orange: 'from-orange-50 to-amber-50 border-orange-200',
    rose: 'from-rose-50 to-pink-50 border-rose-200',
    emerald: 'from-emerald-50 to-teal-50 border-emerald-200',
    sky: 'from-sky-50 to-blue-50 border-sky-200',
  };
  const iconColorMap = {
    teal: 'text-teal-600 bg-teal-100',
    orange: 'text-orange-600 bg-orange-100',
    rose: 'text-rose-600 bg-rose-100',
    emerald: 'text-emerald-600 bg-emerald-100',
    sky: 'text-sky-600 bg-sky-100',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${colorMap[color]} p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="mt-1.5 text-3xl font-bold text-gray-900 tabular-nums">
            {typeof value === 'number' ? value.toLocaleString('he-IL') : value}
          </p>
          {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              {trend.isPositive ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-rose-500" />
              )}
              <span
                className={`text-sm font-semibold ${
                  trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {trend.value}%
              </span>
            </div>
          )}
        </div>
        <div className={`rounded-xl p-2.5 ${iconColorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function SimpleBarChart({
  data,
  maxValue,
  labelKey,
  valueKey,
  color = '#14B8A6',
  showLabels = true,
}: {
  data: Array<Record<string, any>>;
  maxValue: number;
  labelKey: string;
  valueKey: string;
  color?: string;
  showLabels?: boolean;
}) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        אין נתונים לתקופה זו
      </div>
    );
  }

  return (
    <div className="flex items-end gap-1 h-48 px-2">
      {data.map((item, i) => {
        const height = maxValue > 0 ? (item[valueKey] / maxValue) * 100 : 0;
        const label = item[labelKey];
        const displayLabel =
          typeof label === 'string' && label.includes('-')
            ? label.split('-').slice(1).join('/')
            : label;

        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1 group"
          >
            <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
              {item[valueKey]}
            </span>
            <div
              className="w-full rounded-t-md transition-all duration-500 ease-out min-h-[2px]"
              style={{
                height: `${Math.max(height, 2)}%`,
                backgroundColor: color,
                opacity: 0.7 + (height / 100) * 0.3,
              }}
            />
            {showLabels && (
              <span className="text-[9px] text-gray-400 truncate w-full text-center">
                {displayLabel}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FunnelStep({
  label,
  value,
  total,
  color,
  isLast = false,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  isLast?: boolean;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-600">{label}</span>
          <span className="text-sm font-bold text-gray-900 tabular-nums">
            {value.toLocaleString('he-IL')}
            <span className="text-gray-400 font-normal mr-1">({pct}%)</span>
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>
      {!isLast && <div className="text-gray-300 text-lg">↓</div>}
    </div>
  );
}

// ==========================================
// Main Dashboard Component
// ==========================================

interface AnalyticsDashboardProps {
  dict: any;
}

export default function AnalyticsDashboard({ dict }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('7d');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?range=${range}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Failed to load');
      }
    } catch (err) {
      setError('שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const rangeLabels: Record<string, string> = {
    '7d': '7 ימים',
    '30d': '30 יום',
    '90d': '90 יום',
  };

  // ── Loading State ──
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500 mx-auto" />
          <p className="mt-3 text-gray-500">טוען נתוני אנליטיקס...</p>
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (error && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-rose-500 text-lg font-medium">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const {
    overview,
    dailyActiveUsers,
    topEvents,
    funnel,
    suggestionResponses,
    platformBreakdown,
  } = data;
  const maxDAU = Math.max(...dailyActiveUsers.map((d) => d.count), 1);
  const maxEvent = Math.max(...topEvents.map((e) => e.count), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8" dir="rtl">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            📊 אנליטיקס
          </h1>
          <p className="mt-1 text-gray-500">
            מעקב אחר פעילות המשתמשים והאפליקציה
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Range Selector */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  range === r
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {rangeLabels[r]}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* ── Overview Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="סה״כ משתמשים"
          value={overview.totalUsers}
          icon={Users}
          color="teal"
        />
        <StatCard
          title="פעילים בתקופה"
          value={overview.activeUsers}
          icon={Activity}
          color="emerald"
          subtitle={`מתוך ${overview.totalUsers}`}
        />
        <StatCard
          title="משתמשים חדשים"
          value={overview.newUsersInRange}
          icon={TrendingUp}
          color="orange"
          subtitle={`ב-${rangeLabels[range]} האחרונים`}
        />
        <StatCard
          title="הצעות פעילות"
          value={overview.activeSuggestions}
          icon={Heart}
          color="rose"
        />
        <StatCard
          title="סה״כ הצעות"
          value={overview.totalSuggestions}
          icon={Zap}
          color="sky"
        />
        <StatCard
          title="אירועים נרשמו"
          value={overview.totalEvents}
          icon={BarChart3}
          color="orange"
          subtitle="analytics events"
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Active Users */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              משתמשים פעילים יומי
            </h2>
            <Activity className="h-5 w-5 text-teal-500" />
          </div>
          <SimpleBarChart
            data={dailyActiveUsers}
            maxValue={maxDAU}
            labelKey="date"
            valueKey="count"
            color="#14B8A6"
          />
        </div>

        {/* Top Events */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">אירועים מובילים</h2>
            <Zap className="h-5 w-5 text-orange-500" />
          </div>
          <div className="space-y-2.5 max-h-56 overflow-y-auto">
            {topEvents.slice(0, 10).map((event, i) => (
              <div key={event.event} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-300 w-5 text-center tabular-nums">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 truncate">
                      {EVENT_LABELS[event.event] || event.event}
                    </span>
                    <span className="text-sm font-bold text-gray-900 tabular-nums mr-2">
                      {event.count.toLocaleString('he-IL')}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-orange-400 to-amber-400 transition-all duration-500"
                      style={{ width: `${(event.count / maxEvent) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Funnel + Suggestions + Platform ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Funnel */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">משפך הרשמה</h2>
            <Filter className="h-5 w-5 text-teal-500" />
          </div>
          <div className="space-y-4">
            <FunnelStep
              label="נרשמו"
              value={funnel.registered}
              total={funnel.registered}
              color="#14B8A6"
            />
            <FunnelStep
              label="אימתו אימייל"
              value={funnel.emailVerified}
              total={funnel.registered}
              color="#0D9488"
            />
            <FunnelStep
              label="השלימו פרופיל"
              value={funnel.profileComplete}
              total={funnel.registered}
              color="#F97316"
            />
            <FunnelStep
              label="אימתו טלפון"
              value={funnel.phoneVerified}
              total={funnel.registered}
              color="#F59E0B"
            />
            <FunnelStep
              label="פעילים"
              value={funnel.active}
              total={funnel.registered}
              color="#10B981"
              isLast
            />
          </div>
        </div>

        {/* Suggestion Statuses */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">סטטוס הצעות</h2>
            <Heart className="h-5 w-5 text-rose-500" />
          </div>
          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {suggestionResponses.map((sr) => (
              <div
                key={sr.status}
                className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0"
              >
                <span className="text-sm text-gray-600">
                  {STATUS_LABELS[sr.status] || sr.status}
                </span>
                <span className="text-sm font-bold text-gray-900 tabular-nums">
                  {sr.count.toLocaleString('he-IL')}
                </span>
              </div>
            ))}
            {suggestionResponses.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">
                אין נתונים
              </p>
            )}
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">פלטפורמות</h2>
            <Smartphone className="h-5 w-5 text-sky-500" />
          </div>
          <div className="space-y-4">
            {platformBreakdown.map((p) => {
              const total = platformBreakdown.reduce(
                (sum, x) => sum + x.count,
                0
              );
              const pct = total > 0 ? Math.round((p.count / total) * 100) : 0;
              const Icon =
                p.platform === 'ios' || p.platform === 'android'
                  ? Smartphone
                  : Monitor;
              const platformLabel =
                p.platform === 'ios'
                  ? 'iOS'
                  : p.platform === 'android'
                    ? 'Android'
                    : p.platform === 'web'
                      ? 'Web'
                      : p.platform;

              return (
                <div key={p.platform} className="flex items-center gap-3">
                  <div className="bg-gray-100 rounded-lg p-2">
                    <Icon className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {platformLabel}
                      </span>
                      <span className="text-sm text-gray-500 tabular-nums">
                        {pct}%
                      </span>
                    </div>
                    <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-l from-sky-400 to-teal-400 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 tabular-nums w-10 text-left">
                    {p.count}
                  </span>
                </div>
              );
            })}
            {platformBreakdown.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">
                אין נתונים
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="text-center text-xs text-gray-400 pt-4">
        נתונים מ-{new Date(data.since).toLocaleDateString('he-IL')} ועד היום
        {loading && <span className="mr-2">• מעדכן...</span>}
      </div>
    </div>
  );
}
