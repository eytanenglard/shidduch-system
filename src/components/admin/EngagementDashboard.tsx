'use client';

import { useState, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import {
  Search,
  Mail,
  Users,
  TrendingUp,
  Clock,
  Send,
  RefreshCw,
  Moon,
} from 'lucide-react';

// ===============================
// Types & Interfaces
// ===============================

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profile: {
    city: string | null;
  } | null;
  dripCampaign: {
    lastSentType: string | null;
    updatedAt: Date;
  } | null;
}

interface Stats {
  todayEmails: number;
  weeklyEmails: number;
  activeUsers: number;
  completionDistribution: Array<{
    range: string;
    count: number;
    color: string;
  }>;
  recentActivity: Array<{
    time: string;
    user: string;
    action: string;
    status: 'sent' | 'failed';
  }>;
  emailTypeBreakdown: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

interface EngagementDashboardProps {
  dict: any;
}

// ===============================
// Main Component
// ===============================

export default function EngagementDashboard({
  dict,
}: EngagementDashboardProps) {
  // ===============================
  // State Management
  // ===============================

  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); // 🎯 שמירת כל היוזרים
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedEmailType, setSelectedEmailType] =
    useState('EVENING_FEEDBACK');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRunningCampaign, setIsRunningCampaign] = useState(false);
  const [isRunningEveningCampaign, setIsRunningEveningCampaign] =
    useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ===============================
  // Data Fetching Functions
  // ===============================

  // טעינת כל המשתמשים הזכאים
  const fetchAllUsers = async () => {
    try {
      console.log('🔄 Fetching all eligible users...');
      const response = await fetch('/api/admin/engagement/eligible-users');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Received eligible users:', data);

      if (data.success && data.users) {
        setAllUsers(data.users);
        setUsers(data.users); // 🎯 הצג את כולם בהתחלה
        console.log(`✅ Loaded ${data.users.length} eligible users`);
      } else {
        throw new Error(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('❌ Error fetching eligible users:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // טעינת סטטיסטיקות
  const fetchStats = async () => {
    try {
      console.log('🔄 Fetching stats...');
      const response = await fetch('/api/admin/engagement/stats');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Received stats:', data);
      setStats(data);
    } catch (err) {
      console.error('❌ Error fetching stats:', err);
    }
  };

  // חיפוש משתמשים
  const searchUsers = async (query: string) => {
    // 🎯 אם אין חיפוש, הצג את כל היוזרים
    if (!query || query.trim().length === 0) {
      console.log('🔍 Empty search query - showing all users');
      setUsers(allUsers);
      return;
    }

    // 🎯 אם החיפוש קצר מדי, סנן מקומית
    if (query.length < 2) {
      const filtered = allUsers.filter(
        (user) =>
          user.firstName.toLowerCase().includes(query.toLowerCase()) ||
          user.lastName.toLowerCase().includes(query.toLowerCase()) ||
          user.email.toLowerCase().includes(query.toLowerCase())
      );
      setUsers(filtered);
      return;
    }

    try {
      console.log('🔍 Searching users with query:', query);
      const response = await fetch(
        `/api/admin/engagement/search-users?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Search results:', data);

      if (data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('❌ Error searching users:', err);
    }
  };

  // ===============================
  // Initial Data Loading
  // ===============================

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        await Promise.all([fetchAllUsers(), fetchStats()]);
      } catch (err) {
        console.error('❌ Error loading initial data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // ===============================
  // Search Effect
  // ===============================

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300); // דיליי של 300ms

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, allUsers]); // 🎯 תלות ב-allUsers

  // ===============================
  // Action Handlers
  // ===============================

  // בחירת/ביטול בחירת משתמש
  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  // בחירת כולם
  const selectAll = () => {
    setSelectedUsers(new Set(users.map((u) => u.id)));
  };

  // ביטול בחירת כולם
  const deselectAll = () => {
    setSelectedUsers(new Set());
  };

  // שליחת מייל למשתמש בודד
  const sendEmailToUser = async (userId: string) => {
    setIsSending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log(`📧 Sending ${selectedEmailType} to user ${userId}...`);

      const response = await fetch('/api/admin/engagement/send-manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          emailType: selectedEmailType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to send email');
      }

      console.log('✅ Email sent successfully:', data);
      setSuccessMessage(`Email sent to ${data.recipient}`);

      // רענן את הנתונים
      await Promise.all([fetchAllUsers(), fetchStats()]);
    } catch (err) {
      console.error('❌ Error sending email:', err);
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  // שליחת מיילים למשתמשים נבחרים
  const sendBulkEmails = async () => {
    if (selectedUsers.size === 0) {
      setError('Please select at least one user');
      return;
    }

    setIsSending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log(`📧 Sending bulk emails to ${selectedUsers.size} users...`);

      const promises = Array.from(selectedUsers).map((userId) =>
        fetch('/api/admin/engagement/send-manual', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            emailType: selectedEmailType,
          }),
        })
      );

      const results = await Promise.all(promises);
      const successCount = results.filter((r) => r.ok).length;

      console.log(`✅ Sent ${successCount}/${selectedUsers.size} emails`);
      setSuccessMessage(
        `Sent ${successCount}/${selectedUsers.size} emails successfully`
      );

      // רענן את הנתונים
      await Promise.all([fetchAllUsers(), fetchStats()]);

      // נקה את הבחירה
      setSelectedUsers(new Set());
    } catch (err) {
      console.error('❌ Error sending bulk emails:', err);
      setError(err instanceof Error ? err.message : 'Failed to send emails');
    } finally {
      setIsSending(false);
    }
  };

  // הרצת קמפיין יומי מלא (בוקר)
  const runFullCampaign = async () => {
    setIsRunningCampaign(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log('🚀 Running full daily campaign...');

      const response = await fetch('/api/admin/engagement/run-now', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to run campaign');
      }

      console.log('✅ Daily campaign complete:', data);
      setSuccessMessage(
        `Daily Campaign complete! Processed: ${data.processed}, Sent: ${data.sent}`
      );

      // רענן את הנתונים
      await Promise.all([fetchAllUsers(), fetchStats()]);
    } catch (err) {
      console.error('❌ Error running campaign:', err);
      setError(err instanceof Error ? err.message : 'Failed to run campaign');
    } finally {
      setIsRunningCampaign(false);
    }
  };

  // 🌙 הרצת קמפיין ערב
  const runEveningCampaign = async () => {
    setIsRunningEveningCampaign(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log('🌙 Running evening feedback campaign...');

      const response = await fetch('/api/admin/engagement/run-evening', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to run evening campaign');
      }

      console.log('✅ Evening campaign complete:', data);
      setSuccessMessage(
        `Evening Campaign complete! Processed: ${data.processed}, Sent: ${data.sent}`
      );

      // רענן את הנתונים
      await Promise.all([fetchAllUsers(), fetchStats()]);
    } catch (err) {
      console.error('❌ Error running evening campaign:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to run evening campaign'
      );
    } finally {
      setIsRunningEveningCampaign(false);
    }
  };

  // ===============================
  // Helper Functions
  // ===============================

  const getEmailTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      EVENING_FEEDBACK: '🌙 Evening Feedback',
      AI_SUMMARY: '🤖 AI Summary',
      NUDGE: '👉 Nudge',
      CELEBRATION: '🎉 Celebration',
      VALUE: '💎 Value',
      ONBOARDING: '👋 Onboarding (Generic)',
      ONBOARDING_DAY_1: '👋 Onboarding - Day 1',
      ONBOARDING_PHOTOS: '📸 Onboarding - Photos',
      ONBOARDING_AI_TEASER: '🤖 Onboarding - AI Teaser',
      ONBOARDING_QUESTIONNAIRE_WHY: '❓ Onboarding - Why',
      ONBOARDING_VALUE_ADD: '💎 Onboarding - Value',
    };
    return labels[type] || type;
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Never';
    try {
      return new Date(date).toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  // ===============================
  // Render
  // ===============================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Engagement Dashboard
            </h1>
            <p className="text-gray-600">
              Manage and monitor user engagement campaigns
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              Last updated: {new Date().toLocaleTimeString('he-IL')}
            </span>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <ErrorBoundary>
        <div className="max-w-7xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">
                Today&apos;s Emails
              </h3>
              <Mail className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.todayEmails}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">
                Weekly Emails
              </h3>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.weeklyEmails}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">
                Active Users
              </h3>
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.activeUsers}
            </p>
          </div>
        </div>
        </ErrorBoundary>
      )}

      {/* Main Content */}
      <ErrorBoundary>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          {/* Toolbar */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4 justify-between">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="חפש משתמש... (שם, אימייל, ID)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {users.length} משתמשים מוצגים מתוך {allUsers.length}
                </p>
              </div>

              {/* Email Type Selector and Campaign Buttons */}
              <div className="flex gap-2">
                <select
                  value={selectedEmailType}
                  onChange={(e) => setSelectedEmailType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <optgroup label="Evening Campaign">
                    <option value="EVENING_FEEDBACK">
                      🌙 Evening Feedback
                    </option>
                  </optgroup>
                  <optgroup label="Morning Campaign - Onboarding">
                    <option value="ONBOARDING_DAY_1">
                      👋 Onboarding - Day 1
                    </option>
                    <option value="ONBOARDING_PHOTOS">
                      📸 Onboarding - Photos
                    </option>
                    <option value="ONBOARDING_AI_TEASER">
                      🤖 Onboarding - AI Teaser
                    </option>
                    <option value="ONBOARDING_QUESTIONNAIRE_WHY">
                      ❓ Onboarding - Questionnaire Why
                    </option>
                    <option value="ONBOARDING_VALUE_ADD">
                      💎 Onboarding - Value Add
                    </option>
                  </optgroup>
                  <optgroup label="Morning Campaign - Engagement">
                    <option value="NUDGE">👉 Nudge (Contextual)</option>
                    <option value="CELEBRATION">
                      🎉 Celebration (Almost Done)
                    </option>
                    <option value="AI_SUMMARY">🤖 AI Summary</option>
                    <option value="VALUE">💎 Value (Periodic)</option>
                  </optgroup>
                </select>

                {/* 🌙 Evening Campaign Button */}
                <button
                  onClick={runEveningCampaign}
                  disabled={isRunningEveningCampaign}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title="Run Evening Feedback Campaign"
                >
                  {isRunningEveningCampaign ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4" />
                      Evening Campaign
                    </>
                  )}
                </button>

                {/* 🚀 Daily Campaign Button */}
                <button
                  onClick={runFullCampaign}
                  disabled={isRunningCampaign}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title="Run Daily Campaign"
                >
                  {isRunningCampaign ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Daily Campaign
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Selection Actions */}
            {selectedUsers.size > 0 && (
              <div className="mt-4 flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-900">
                  {selectedUsers.size} נבחרו
                </span>
                <button
                  onClick={sendBulkEmails}
                  disabled={isSending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center gap-2"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send to Selected
                    </>
                  )}
                </button>
                <button
                  onClick={deselectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ביטול בחירה
                </button>
              </div>
            )}
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    <input
                      type="checkbox"
                      checked={
                        selectedUsers.size === users.length && users.length > 0
                      }
                      onChange={(e) =>
                        e.target.checked ? selectAll() : deselectAll()
                      }
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    City
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Last Contact
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      {searchQuery ? 'לא נמצאו תוצאות' : 'אין משתמשים זכאים'}
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{user.id}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.profile?.city || '-'}
                      </td>
                      <td className="px-6 py-4">
                        {user.dripCampaign ? (
                          <div>
                            <div className="text-xs text-gray-600">
                              {getEmailTypeLabel(
                                user.dripCampaign.lastSentType || ''
                              )}
                            </div>
                            <div className="text-xs text-gray-400">
                              {formatDate(user.dripCampaign.updatedAt)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Never</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => sendEmailToUser(user.id)}
                          disabled={isSending}
                          className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3" />
                          Send
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </ErrorBoundary>
    </div>
  );
}
