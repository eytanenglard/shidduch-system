'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface CompletionData {
  range: string;
  count: number;
  color: string;
}

interface ActivityItem {
  time: string;
  user: string;
  action: string;
  status: 'sent' | 'failed';
}

interface EmailTypeData {
  name: string;
  value: number;
  color: string;
}

interface DashboardStats {
  todayEmails: number;
  weeklyEmails: number;
  activeUsers: number;
  completionDistribution: CompletionData[];
  recentActivity: ActivityItem[];
  emailTypeBreakdown: EmailTypeData[];
}

const EngagementDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    todayEmails: 0,
    weeklyEmails: 0,
    activeUsers: 0,
    completionDistribution: [],
    recentActivity: [],
    emailTypeBreakdown: [],
  });

  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState('');
  const [manualEmailType, setManualEmailType] = useState('NUDGE');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/engagement/stats');
      const data = await response.json();

      setStats({
        todayEmails: data.todayEmails || 0,
        weeklyEmails: data.weeklyEmails || 0,
        activeUsers: data.activeUsers || 0,
        completionDistribution: data.completionDistribution || [],
        recentActivity: data.recentActivity || [],
        emailTypeBreakdown: data.emailTypeBreakdown || [
          { name: 'Onboarding', value: 45, color: '#3b82f6' },
          { name: 'Nudge', value: 30, color: '#f59e0b' },
          { name: 'Evening Feedback', value: 15, color: '#8b5cf6' },
          { name: 'AI Summary', value: 10, color: '#10b981' },
        ],
      });

      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      setLoading(false);
    }
  };

  const sendManualEmail = async () => {
    if (!selectedUser) {
      alert('נא לבחור משתמש');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/admin/engagement/send-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser,
          emailType: manualEmailType,
        }),
      });

      if (response.ok) {
        alert('המייל נשלח בהצלחה!');
        setSelectedUser('');
        loadDashboardData();
      } else {
        alert('שגיאה בשליחת המייל');
      }
    } catch (error) {
      alert('שגיאה: ' + (error instanceof Error ? error.message : 'Unknown'));
    } finally {
      setSending(false);
    }
  };

  const runCampaignNow = async () => {
    if (!confirm('האם להריץ את הקמפיין עכשיו?')) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/engagement/run-now', {
        method: 'POST',
      });
      const data = await response.json();

      alert(
        `הקמפיין הסתיים!\n\nעובדו: ${data.processed} משתמשים\nנשלחו: ${data.sent} מיילים`
      );
      loadDashboardData();
    } catch (error) {
      alert('שגיאה: ' + (error instanceof Error ? error.message : 'Unknown'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-cyan-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-purple-50 p-6"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🎯 מרכז ניהול Engagement
          </h1>
          <p className="text-gray-600">
            ניהול וניטור מערכת התקשורת עם המשתמשים
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-cyan-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-semibold">מיילים היום</h3>
              <div className="bg-cyan-100 p-3 rounded-lg">
                <span className="text-2xl">📧</span>
              </div>
            </div>
            <p className="text-4xl font-bold text-cyan-600">
              {stats.todayEmails}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              +{stats.weeklyEmails} השבוע
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-semibold">משתמשים פעילים</h3>
              <div className="bg-purple-100 p-3 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
            </div>
            <p className="text-4xl font-bold text-purple-600">
              {stats.activeUsers}
            </p>
            <p className="text-sm text-gray-500 mt-2">בתהליך השלמה</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-semibold">קמפיין הבא</h3>
              <div className="bg-green-100 p-3 rounded-lg">
                <span className="text-2xl">⏰</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-green-600">מחר 09:00</p>
            <button
              onClick={runCampaignNow}
              className="mt-2 text-sm text-green-600 hover:text-green-700 font-semibold underline"
            >
              הרץ עכשיו
            </button>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Email Types Breakdown */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              התפלגות סוגי מיילים
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.emailTypeBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.emailTypeBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {stats.emailTypeBreakdown.map((type, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: type.color }}
                  ></div>
                  <span className="text-gray-600">{type.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              פעילות אחרונה
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {stats.recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        activity.status === 'sent'
                          ? 'bg-green-100'
                          : 'bg-red-100'
                      }`}
                    >
                      <span
                        className={
                          activity.status === 'sent'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }
                      >
                        {activity.status === 'sent' ? '✓' : '✗'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {activity.user}
                      </p>
                      <p className="text-sm text-gray-500">{activity.action}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Manual Email Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            📤 שליחת מייל ידנית
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                בחר משתמש
              </label>
              <input
                type="text"
                placeholder="ID משתמש או אימייל"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                סוג מייל
              </label>
              <select
                value={manualEmailType}
                onChange={(e) => setManualEmailType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="ONBOARDING">Onboarding</option>
                <option value="NUDGE">דחיפה</option>
                <option value="CELEBRATION">חגיגה</option>
                <option value="INSIGHT">תובנה</option>
                <option value="VALUE">ערך</option>
                <option value="EVENING_FEEDBACK">פידבק ערב</option>
                <option value="AI_SUMMARY">סיכום AI</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={sendManualEmail}
                disabled={sending}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-2 px-6 rounded-lg hover:from-cyan-600 hover:to-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? 'שולח...' : 'שלח מייל'}
              </button>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>טיפ:</strong> המערכת תבחר אוטומטית את התוכן המתאים ביותר
              על בסיס מצב הפרופיל של המשתמש
            </p>
          </div>
        </div>

        {/* Cron Jobs Status */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            🤖 סטטוס Cron Jobs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-700">קמפיין בוקר</h4>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                  פעיל
                </span>
              </div>
              <p className="text-sm text-gray-500">רץ כל יום בשעה 09:00</p>
              <p className="text-xs text-gray-400 mt-2">
                הרצה אחרונה: היום 09:00
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-700">פידבק ערב</h4>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                  פעיל
                </span>
              </div>
              <p className="text-sm text-gray-500">רץ כל יום בשעה 19:00</p>
              <p className="text-xs text-gray-400 mt-2">
                הרצה הבאה: היום 19:00
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngagementDashboard;
