// =============================================================================
// 📁 src/components/matchmaker/new/PotentialMatches/MatchmakerDashboard.tsx
// =============================================================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Heart,
  Bell,
  AlertTriangle,
  Clock,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  MessageSquare,
  Sparkles,
  BarChart,
  PlayCircle, // אייקון חדש לכפתור הטעינה
} from 'lucide-react';

// ... (כל ה-Interfaces נשארים אותו דבר, אין שינוי ב-Types)
interface DashboardStats {
  totalActiveUsers: number;
  maleCount: number;
  femaleCount: number;
  newUsersThisWeek: number;
  newUsersToday: number;
  totalPotentialMatches: number;
  pendingMatches: number;
  sentSuggestions: number;
  activeMatches: number;
  matchesThisWeek: number;
  suggestionsThisWeek: number;
  acceptanceRate: number;
  usersWithNoMatches: number;
  usersWaitingLong: number;
  incompleteProfiles: number;
}

interface PriorityUserCard {
  userId: string;
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
  age: number | null;
  city: string | null;
  mainImage: string | null;
  priorityScore: number;
  category: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  isNewUser: boolean;
  isNeglected: boolean;
  hasNoPendingMatches: boolean;
  daysSinceRegistration: number;
  daysSinceLastSuggestion: number | null;
  pendingMatchesCount: number;
  profileCompleteness: number;
  tags: string[];
}

interface AlertResult {
  id: string;
  userId: string;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  user?: {
    firstName: string;
    lastName: string;
    gender: string;
    mainImage: string | null;
    city: string | null;
  };
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  userId?: string;
}

interface DashboardData {
  stats: DashboardStats;
  criticalUsers: PriorityUserCard[];
  highPriorityUsers: PriorityUserCard[];
  alerts: {
    total: number;
    unread: number;
    bySeverity: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      info: number;
    };
    alerts: AlertResult[];
  };
  recentActivity: RecentActivity[];
  quickActions: {
    newUsersToReview: number;
    matchesToReview: number;
    suggestionsToFollow: number;
  };
  lastScan: {
    timestamp: string | null;
    matchesFound: number;
    duration: number | null;
  } | null;
  generatedAt: string;
}

// ... (Sub-Components נשארים ללא שינוי: StatCard, PriorityUserCardComponent, AlertItem, ActivityItem, formatTimeAgo)

const StatCard: React.FC<{
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}> = ({ title, value, subtitle, icon, color, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        {trend !== undefined && (
          <div
            className={`flex items-center mt-2 text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            <TrendingUp size={12} className={trend < 0 ? 'rotate-180' : ''} />
            <span className="mr-1">{Math.abs(trend)}%</span>
            <span className="text-gray-400">מהשבוע שעבר</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
    </div>
  </motion.div>
);

const PriorityUserCardComponent: React.FC<{
  user: PriorityUserCard;
  onClick: (userId: string) => void;
}> = ({ user, onClick }) => {
  const categoryColors = {
    CRITICAL: 'bg-red-50 border-red-200',
    HIGH: 'bg-orange-50 border-orange-200',
    MEDIUM: 'bg-yellow-50 border-yellow-200',
    LOW: 'bg-green-50 border-green-200',
  };

  const categoryBadge = {
    CRITICAL: 'bg-red-500 text-white',
    HIGH: 'bg-orange-500 text-white',
    MEDIUM: 'bg-yellow-500 text-white',
    LOW: 'bg-green-500 text-white',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.02 }}
      onClick={() => onClick(user.userId)}
      className={`p-3 rounded-lg border cursor-pointer transition-all ${categoryColors[user.category]}`}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
            {user.mainImage ? (
              <img
                src={user.mainImage}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Users size={20} />
              </div>
            )}
          </div>
          <div
            className={`absolute -bottom-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${categoryBadge[user.category]}`}
          >
            {user.priorityScore}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-800 truncate">
              {user.firstName} {user.lastName}
            </p>
            {user.gender === 'FEMALE' && (
              <span className="text-pink-500">♀</span>
            )}
            {user.gender === 'MALE' && (
              <span className="text-blue-500">♂</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {user.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] bg-white/50 px-1.5 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <ChevronRight size={16} className="text-gray-400" />
      </div>
    </motion.div>
  );
};

const AlertItem: React.FC<{
  alert: AlertResult;
  onDismiss: (id: string) => void;
  onMarkRead: (id: string) => void;
}> = ({ alert, onDismiss, onMarkRead }) => {
  const severityColors = {
    CRITICAL: 'border-r-4 border-r-red-500 bg-red-50',
    HIGH: 'border-r-4 border-r-orange-500 bg-orange-50',
    MEDIUM: 'border-r-4 border-r-yellow-500 bg-yellow-50',
    LOW: 'border-r-4 border-r-green-500 bg-green-50',
    INFO: 'border-r-4 border-r-blue-500 bg-blue-50',
  };

  const severityIcons = {
    CRITICAL: <AlertTriangle size={16} className="text-red-500" />,
    HIGH: <AlertTriangle size={16} className="text-orange-500" />,
    MEDIUM: <Clock size={16} className="text-yellow-600" />,
    LOW: <Bell size={16} className="text-green-500" />,
    INFO: <Bell size={16} className="text-blue-500" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className={`p-3 rounded-lg ${severityColors[alert.severity]} ${!alert.isRead ? 'font-medium' : 'opacity-80'}`}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5">{severityIcons[alert.severity]}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800">{alert.title}</p>
          <p className="text-xs text-gray-600 mt-0.5 truncate">
            {alert.message}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {!alert.isRead && (
            <button
              onClick={() => onMarkRead(alert.id)}
              className="p-1 hover:bg-white/50 rounded"
              title="סמן כנקרא"
            >
              <Users size={14} className="text-gray-400" />
            </button>
          )}
          <button
            onClick={() => onDismiss(alert.id)}
            className="p-1 hover:bg-white/50 rounded"
            title="דחה התראה"
          >
            <XCircle size={14} className="text-gray-400" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const ActivityItem: React.FC<{ activity: RecentActivity }> = ({ activity }) => {
  const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
    new_user: {
      icon: <UserPlus size={14} />,
      color: 'text-green-500 bg-green-50',
    },
    new_match: { icon: <Heart size={14} />, color: 'text-pink-500 bg-pink-50' },
    suggestion_sent: {
      icon: <MessageSquare size={14} />,
      color: 'text-blue-500 bg-blue-50',
    },
    suggestion_accepted: {
      icon: <CheckCircle size={14} />,
      color: 'text-green-500 bg-green-50',
    },
    suggestion_declined: {
      icon: <XCircle size={14} />,
      color: 'text-red-500 bg-red-50',
    },
  };

  const config = typeConfig[activity.type] || typeConfig.new_user;

  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`p-2 rounded-full ${config.color}`}>{config.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700">{activity.title}</p>
        <p className="text-xs text-gray-500 truncate">{activity.description}</p>
      </div>
      <span className="text-xs text-gray-400">
        {formatTimeAgo(activity.timestamp)}
      </span>
    </div>
  );
};

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'עכשיו';
  if (diffMins < 60) return `לפני ${diffMins} דק'`;
  if (diffHours < 24) return `לפני ${diffHours} שע'`;
  if (diffDays < 7) return `לפני ${diffDays} ימים`;
  return date.toLocaleDateString('he-IL');
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function MatchmakerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false); // שונה ל-false כברירת מחדל
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'priority' | 'alerts'>('priority');

  // Fetch dashboard data
  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch('/api/matchmaker/dashboard');

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const dashboardData = await response.json();
      setData(dashboardData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Removed immediate useEffect call.
  // Now it only runs interval if data is present.
  useEffect(() => {
    if (!data) return; // רק אם יש דאטה, נפעיל טיימר לרענון

    // Auto refresh every 2 minutes
    const interval = setInterval(() => fetchData(true), 120000);
    return () => clearInterval(interval);
  }, [fetchData, data]);

  // Handle alert dismiss
  const handleDismissAlert = async (alertId: string) => {
    try {
      await fetch('/api/matchmaker/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss', alertId }),
      });

      // Update local state
      if (data) {
        setData({
          ...data,
          alerts: {
            ...data.alerts,
            alerts: data.alerts.alerts.filter((a) => a.id !== alertId),
            total: data.alerts.total - 1,
          },
        });
      }
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  };

  // Handle mark as read
  const handleMarkRead = async (alertId: string) => {
    try {
      await fetch('/api/matchmaker/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', alertId }),
      });

      // Update local state
      if (data) {
        setData({
          ...data,
          alerts: {
            ...data.alerts,
            alerts: data.alerts.alerts.map((a) =>
              a.id === alertId ? { ...a, isRead: true } : a
            ),
            unread: Math.max(0, data.alerts.unread - 1),
          },
        });
      }
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  // Navigate to user
  const handleUserClick = (userId: string) => {
    window.location.href = `/matchmaker/candidates/${userId}`;
  };

  // --- מצב 1: עדיין לא נטען דאטה ולא טוען כרגע (Initial State) ---
  if (!data && !loading && !error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center space-y-6">
        <div className="p-6 bg-indigo-50 rounded-full animate-pulse-slow">
          <BarChart className="w-16 h-16 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            דשבורד וניתוח נתונים
          </h2>
          <p className="text-gray-500 max-w-md mx-auto">
            לחץ על הכפתור כדי לטעון סטטיסטיקות, התראות ומשתמשים בעדיפות גבוהה.
            פעולה זו מבצעת ניתוח מעמיק ולכן אינה מופעלת אוטומטית.
          </p>
        </div>
        <button
          onClick={() => fetchData()}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg font-medium"
        >
          <PlayCircle size={24} />
          טען נתוני דשבורד
        </button>
      </div>
    );
  }

  // --- מצב 2: טוען (Loading State) ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <p className="text-gray-500">טוען נתונים ומנתח התראות...</p>
        </div>
      </div>
    );
  }

  // --- מצב 3: שגיאה (Error State) ---
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">שגיאה בטעינת הדשבורד</p>
          <p className="text-gray-500 text-sm mt-1">{error}</p>
          <button
            onClick={() => fetchData()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // --- מצב 4: הצגת הדשבורד (Dashboard View) ---
  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="text-primary" />
            דשבורד שדכן
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            עודכן {new Date(data.generatedAt).toLocaleTimeString('he-IL')}
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          <span>רענן נתונים</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="משתמשים פעילים"
          value={data.stats.totalActiveUsers}
          subtitle={`${data.stats.maleCount}♂ / ${data.stats.femaleCount}♀`}
          icon={<Users size={20} className="text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title="חדשים השבוע"
          value={data.stats.newUsersThisWeek}
          subtitle={`${data.stats.newUsersToday} היום`}
          icon={<UserPlus size={20} className="text-white" />}
          color="bg-green-500"
        />
        <StatCard
          title="התאמות ממתינות"
          value={data.stats.pendingMatches}
          icon={<Heart size={20} className="text-white" />}
          color="bg-pink-500"
        />
        <StatCard
          title="אחוז הצלחה"
          value={`${data.stats.acceptanceRate}%`}
          subtitle={`${data.stats.suggestionsThisWeek} הצעות השבוע`}
          icon={<TrendingUp size={20} className="text-white" />}
          color="bg-purple-500"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {data.quickActions.newUsersToReview > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 border border-green-200 rounded-xl p-4 cursor-pointer hover:bg-green-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <UserPlus size={20} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">
                  {data.quickActions.newUsersToReview}
                </p>
                <p className="text-sm text-green-600">משתמשים חדשים לבדיקה</p>
              </div>
            </div>
          </motion.div>
        )}

        {data.quickActions.matchesToReview > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-pink-50 border border-pink-200 rounded-xl p-4 cursor-pointer hover:bg-pink-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500 rounded-lg">
                <Heart size={20} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-pink-700">
                  {data.quickActions.matchesToReview}
                </p>
                <p className="text-sm text-pink-600">התאמות לבדיקה</p>
              </div>
            </div>
          </motion.div>
        )}

        {data.quickActions.suggestionsToFollow > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-orange-50 border border-orange-200 rounded-xl p-4 cursor-pointer hover:bg-orange-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Clock size={20} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-700">
                  {data.quickActions.suggestionsToFollow}
                </p>
                <p className="text-sm text-orange-600">הצעות ממתינות למעקב</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Users / Alerts - Left Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab Selector */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('priority')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'priority'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Users size={16} />
                משתמשים לטיפול (
                {data.criticalUsers.length + data.highPriorityUsers.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'alerts'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Bell size={16} />
                התראות
                {data.alerts.unread > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {data.alerts.unread}
                  </span>
                )}
              </span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'priority' ? (
              <motion.div
                key="priority"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Critical Users */}
                {data.criticalUsers.length > 0 && (
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-red-600 mb-3 flex items-center gap-2">
                      <AlertTriangle size={18} />
                      🔴 דחוף ({data.criticalUsers.length})
                    </h3>
                    <div className="space-y-2">
                      {data.criticalUsers.slice(0, 5).map((user) => (
                        <PriorityUserCardComponent
                          key={user.userId}
                          user={user}
                          onClick={handleUserClick}
                        />
                      ))}
                    </div>
                    {data.criticalUsers.length > 5 && (
                      <button className="w-full mt-3 text-sm text-red-600 hover:text-red-700">
                        הצג עוד {data.criticalUsers.length - 5} →
                      </button>
                    )}
                  </div>
                )}

                {/* High Priority Users */}
                {data.highPriorityUsers.length > 0 && (
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-orange-600 mb-3 flex items-center gap-2">
                      <Clock size={18} />
                      🟠 עדיפות גבוהה ({data.highPriorityUsers.length})
                    </h3>
                    <div className="space-y-2">
                      {data.highPriorityUsers.slice(0, 5).map((user) => (
                        <PriorityUserCardComponent
                          key={user.userId}
                          user={user}
                          onClick={handleUserClick}
                        />
                      ))}
                    </div>
                    {data.highPriorityUsers.length > 5 && (
                      <button className="w-full mt-3 text-sm text-orange-600 hover:text-orange-700">
                        הצג עוד {data.highPriorityUsers.length - 5} →
                      </button>
                    )}
                  </div>
                )}

                {/* No Priority Users */}
                {data.criticalUsers.length === 0 &&
                  data.highPriorityUsers.length === 0 && (
                    <div className="bg-green-50 rounded-xl p-8 text-center">
                      <CheckCircle
                        size={48}
                        className="text-green-500 mx-auto mb-3"
                      />
                      <p className="text-green-700 font-medium">
                        כל המשתמשים מטופלים! 🎉
                      </p>
                      <p className="text-green-600 text-sm mt-1">
                        אין משתמשים דחופים כרגע
                      </p>
                    </div>
                  )}
              </motion.div>
            ) : (
              <motion.div
                key="alerts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                {/* Alerts Summary */}
                <div className="flex items-center gap-4 mb-4 pb-4 border-b">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 bg-red-500 rounded-full" />
                    <span>{data.alerts.bySeverity.critical} קריטי</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 bg-orange-500 rounded-full" />
                    <span>{data.alerts.bySeverity.high} גבוה</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full" />
                    <span>{data.alerts.bySeverity.medium} בינוני</span>
                  </div>
                </div>

                {/* Alerts List */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  <AnimatePresence>
                    {data.alerts.alerts.slice(0, 10).map((alert) => (
                      <AlertItem
                        key={alert.id}
                        alert={alert}
                        onDismiss={handleDismissAlert}
                        onMarkRead={handleMarkRead}
                      />
                    ))}
                  </AnimatePresence>

                  {data.alerts.alerts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Bell size={32} className="mx-auto mb-2 opacity-50" />
                      <p>אין התראות חדשות</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column - Activity & Info */}
        <div className="space-y-4">
          {/* Last Scan Info */}
          {data.lastScan && (
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
              <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar size={16} />
                סריקה אחרונה
              </h3>
              <div className="space-y-1 text-sm">
                {data.lastScan.timestamp && (
                  <p className="text-gray-600">
                    {new Date(data.lastScan.timestamp).toLocaleString('he-IL')}
                  </p>
                )}
                <p className="text-gray-600">
                  נמצאו {data.lastScan.matchesFound} התאמות חדשות
                </p>
                {data.lastScan.duration && (
                  <p className="text-gray-500 text-xs">
                    משך: {(data.lastScan.duration / 1000 / 60).toFixed(1)} דקות
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Clock size={16} />
              פעילות אחרונה
            </h3>
            <div className="divide-y">
              {data.recentActivity.slice(0, 6).map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}

              {data.recentActivity.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">
                  אין פעילות אחרונה
                </p>
              )}
            </div>
          </div>

          {/* Problems Summary */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
              <AlertTriangle size={16} />
              בעיות לטיפול
            </h3>
            <div className="space-y-2">
              {data.stats.usersWaitingLong > 0 && (
                <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                  <span className="text-sm text-orange-700">
                    ממתינים 10+ ימים
                  </span>
                  <span className="font-bold text-orange-600">
                    {data.stats.usersWaitingLong}
                  </span>
                </div>
              )}
              {data.stats.usersWithNoMatches > 0 && (
                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                  <span className="text-sm text-yellow-700">ללא התאמות</span>
                  <span className="font-bold text-yellow-600">
                    {data.stats.usersWithNoMatches}
                  </span>
                </div>
              )}
              {data.stats.incompleteProfiles > 0 && (
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">פרופילים חלקיים</span>
                  <span className="font-bold text-gray-600">
                    {data.stats.incompleteProfiles}
                  </span>
                </div>
              )}
              {data.stats.usersWaitingLong === 0 &&
                data.stats.usersWithNoMatches === 0 &&
                data.stats.incompleteProfiles === 0 && (
                  <p className="text-green-600 text-sm text-center py-2">
                    ✅ אין בעיות כרגע
                  </p>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
