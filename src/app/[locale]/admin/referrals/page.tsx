// src/app/[locale]/admin/referrals/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  MousePointer,
  UserCheck,
  Trophy,
  TrendingUp,
  Download,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Gift,
  Crown,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// ================== Types ==================

interface CampaignStats {
  id: string;
  name: string;
  slug: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  totalReferrers: number;
  totalClicks: number;
  totalRegistrations: number;
  totalVerified: number;
  conversionRate: number;
  prizeTiers: Array<{ threshold: number; prize: string }> | string | null;
  grandPrize?: string;
}

// Helper function to parse prizeTiers
function parsePrizeTiers(
  prizeTiers: CampaignStats['prizeTiers']
): Array<{ threshold: number; prize: string }> {
  if (!prizeTiers) return [];
  if (typeof prizeTiers === 'string') {
    try {
      return JSON.parse(prizeTiers);
    } catch {
      return [];
    }
  }
  if (Array.isArray(prizeTiers)) {
    return prizeTiers;
  }
  return [];
}

interface ReferrerData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  code: string;
  tier: 'AMBASSADOR' | 'COMMUNITY';
  clickCount: number;
  registrationCount: number;
  verifiedCount: number;
  completedCount: number;
  referralsCount: number;
  createdAt: string;
  prizesAwarded?: Array<{ prize: string; awardedAt: string }>;
}

type SortField = 'verifiedCount' | 'clickCount' | 'createdAt' | 'name';
type SortOrder = 'asc' | 'desc';

// ================== Stats Card ==================

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'teal' | 'orange' | 'rose' | 'amber' | 'blue';
  subtitle?: string;
  trend?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  subtitle,
  trend,
}) => {
  const colorClasses = {
    teal: 'from-teal-500 to-emerald-600',
    orange: 'from-orange-500 to-amber-600',
    rose: 'from-rose-500 to-pink-600',
    amber: 'from-amber-500 to-yellow-600',
    blue: 'from-blue-500 to-indigo-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
    >
      <div className={`h-1 bg-gradient-to-r ${colorClasses[color]}`} />
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500">{title}</span>
          <div
            className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[color]} text-white`}
          >
            {icon}
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-bold text-gray-900">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            {subtitle && (
              <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
            )}
          </div>
          {trend !== undefined && (
            <div
              className={`flex items-center text-sm ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
            >
              <TrendingUp
                className={`w-4 h-4 mr-1 ${trend < 0 ? 'rotate-180' : ''}`}
              />
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ================== Campaign Info Card ==================

interface CampaignInfoProps {
  campaign: CampaignStats;
}

const CampaignInfoCard: React.FC<CampaignInfoProps> = ({ campaign }) => {
  const now = new Date();
  const endDate = new Date(campaign.endDate);
  const startDate = new Date(campaign.startDate);
  const daysRemaining = Math.max(
    0,
    Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );
  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const progress = Math.min(
    100,
    ((totalDays - daysRemaining) / totalDays) * 100
  );

  return (
    <Card className="border-teal-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            פרטי הקמפיין
          </CardTitle>
          <Badge variant={campaign.isActive ? 'default' : 'secondary'}>
            {campaign.isActive ? 'פעיל' : 'לא פעיל'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-xl font-bold text-gray-900">{campaign.name}</div>
          <div className="text-sm text-gray-500">קוד: {campaign.slug}</div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">תאריך התחלה</div>
            <div className="font-medium">
              {new Date(campaign.startDate).toLocaleDateString('he-IL')}
            </div>
          </div>
          <div>
            <div className="text-gray-500">תאריך סיום</div>
            <div className="font-medium">
              {new Date(campaign.endDate).toLocaleDateString('he-IL')}
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">התקדמות</span>
            <span className="font-medium">{daysRemaining} ימים נותרו</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Prize Tiers */}
        <div className="pt-2 border-t border-gray-100">
          <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <Gift className="w-4 h-4" />
            פרסים
          </div>
          <div className="space-y-1">
            {parsePrizeTiers(campaign.prizeTiers).map((tier, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-600">{tier.threshold}+ מאומתים</span>
                <span className="font-medium">{tier.prize}</span>
              </div>
            ))}
            {campaign.grandPrize && (
              <div className="flex justify-between text-sm pt-1 border-t border-gray-100">
                <span className="text-amber-600 flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  מקום ראשון
                </span>
                <span className="font-medium text-amber-600">
                  {campaign.grandPrize}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ================== Referrers Table (Native HTML) ==================

interface ReferrersTableProps {
  referrers: ReferrerData[];
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  onCopyCode: (code: string) => void;
  copiedCode: string | null;
}

const ReferrersTable: React.FC<ReferrersTableProps> = ({
  referrers,
  sortField,
  sortOrder,
  onSort,
  onCopyCode,
  copiedCode,
}) => {
  const SortHeader: React.FC<{
    field: SortField;
    children: React.ReactNode;
  }> = ({ field, children }) => (
    <th
      className="px-4 py-3 text-right text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field &&
          (sortOrder === 'desc' ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          ))}
      </div>
    </th>
  );

  const getTierBadge = (tier: string) => {
    if (tier === 'AMBASSADOR') {
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
          שגריר
        </Badge>
      );
    }
    return <Badge variant="secondary">קהילה</Badge>;
  };

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 w-12">
              #
            </th>
            <SortHeader field="name">שם</SortHeader>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
              קוד
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
              סוג
            </th>
            <SortHeader field="clickCount">לחיצות</SortHeader>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
              נרשמו
            </th>
            <SortHeader field="verifiedCount">מאומתים</SortHeader>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
              המרה
            </th>
            <SortHeader field="createdAt">הצטרף</SortHeader>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
              פעולות
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {referrers.map((referrer, index) => {
            const conversionRate =
              referrer.clickCount > 0
                ? (
                    (referrer.verifiedCount / referrer.clickCount) *
                    100
                  ).toFixed(1)
                : '0';

            return (
              <tr key={referrer.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-500">
                  {index + 1}
                </td>
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-900">
                      {referrer.name}
                    </div>
                    {referrer.email && (
                      <div className="text-xs text-gray-500">
                        {referrer.email}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <code className="bg-gray-100 px-2 py-0.5 rounded text-sm font-mono">
                      {referrer.code}
                    </code>
                    <button
                      onClick={() => onCopyCode(referrer.code)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      {copiedCode === referrer.code ? (
                        <Check className="w-3 h-3 text-teal-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-gray-400" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">{getTierBadge(referrer.tier)}</td>
                <td className="px-4 py-3 text-center">{referrer.clickCount}</td>
                <td className="px-4 py-3 text-center">
                  {referrer.registrationCount}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`font-bold ${referrer.verifiedCount >= 3 ? 'text-teal-600' : 'text-gray-900'}`}
                  >
                    {referrer.verifiedCount}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`${parseFloat(conversionRate) >= 10 ? 'text-emerald-600' : 'text-gray-600'}`}
                  >
                    {conversionRate}%
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(referrer.createdAt).toLocaleDateString('he-IL')}
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`/he/referral/dashboard?code=${referrer.code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-gray-100 rounded transition-colors inline-flex"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ================== Main Admin Page ==================

export default function AdminReferralsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<CampaignStats | null>(null);
  const [referrers, setReferrers] = useState<ReferrerData[]>([]);
  const [filteredReferrers, setFilteredReferrers] = useState<ReferrerData[]>(
    []
  );

  // Filters & Sort
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<
    'all' | 'AMBASSADOR' | 'COMMUNITY'
  >('all');
  const [sortField, setSortField] = useState<SortField>('verifiedCount');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch data
  const fetchData = async () => {
    try {
      const res = await fetch('/api/referral/campaign?stats=true');
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load data');
      }

      setCampaign(data.campaign);
      setReferrers(data.referrers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter & Sort
  useEffect(() => {
    let result = [...referrers];

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(term) ||
          r.code.toLowerCase().includes(term) ||
          r.email?.toLowerCase().includes(term)
      );
    }

    // Tier filter
    if (tierFilter !== 'all') {
      result = result.filter((r) => r.tier === tierFilter);
    }

    // Sort
    result.sort((a, b) => {
      let aVal: number | string = a[sortField];
      let bVal: number | string = b[sortField];

      if (sortField === 'createdAt') {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    setFilteredReferrers(result);
  }, [referrers, searchTerm, tierFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleCopyCode = async (code: string) => {
    const url = `${window.location.origin}/r/${code}`;
    await navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const exportToCSV = () => {
    const headers = [
      'שם',
      'אימייל',
      'טלפון',
      'קוד',
      'סוג',
      'לחיצות',
      'נרשמו',
      'מאומתים',
      'תאריך הצטרפות',
    ];
    const rows = filteredReferrers.map((r) => [
      r.name,
      r.email || '',
      r.phone || '',
      r.code,
      r.tier === 'AMBASSADOR' ? 'שגריר' : 'קהילה',
      r.clickCount,
      r.registrationCount,
      r.verifiedCount,
      new Date(r.createdAt).toLocaleDateString('he-IL'),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `referrers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto mb-4" />
          <div className="text-gray-600">טוען נתונים...</div>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">שגיאה</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh}>נסה שוב</Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              ניהול קמפיין רפרל
            </h1>
            <p className="text-gray-600 mt-1">
              מעקב אחר ביצועי המפנים והקמפיין
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`w-4 h-4 ml-1 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              רענן
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="w-4 h-4 ml-1" />
              ייצא CSV
            </Button>
            <Button size="sm">
              <Plus className="w-4 h-4 ml-1" />
              הוסף שגריר
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        {campaign && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <StatCard
              title="סה״כ מפנים"
              value={campaign.totalReferrers}
              icon={<Users className="w-5 h-5" />}
              color="blue"
            />
            <StatCard
              title="לחיצות"
              value={campaign.totalClicks}
              icon={<MousePointer className="w-5 h-5" />}
              color="teal"
            />
            <StatCard
              title="הרשמות"
              value={campaign.totalRegistrations}
              icon={<Users className="w-5 h-5" />}
              color="orange"
            />
            <StatCard
              title="מאומתים"
              value={campaign.totalVerified}
              icon={<UserCheck className="w-5 h-5" />}
              color="rose"
            />
            <StatCard
              title="המרה"
              value={`${(campaign.conversionRate ?? 0).toFixed(1)}%`}
              icon={<TrendingUp className="w-5 h-5" />}
              color="amber"
              subtitle="מלחיצה לאימות"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Campaign Info - Sidebar */}
          <div className="lg:col-span-1">
            {campaign && <CampaignInfoCard campaign={campaign} />}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="חיפוש לפי שם, קוד או אימייל..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  <Select
                    value={tierFilter}
                    onValueChange={(v) => setTierFilter(v as typeof tierFilter)}
                  >
                    <SelectTrigger className="w-full md:w-40">
                      <Filter className="w-4 h-4 ml-2" />
                      <SelectValue placeholder="סוג מפנה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">הכל</SelectItem>
                      <SelectItem value="AMBASSADOR">שגרירים</SelectItem>
                      <SelectItem value="COMMUNITY">קהילה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    רשימת מפנים ({filteredReferrers.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {filteredReferrers.length > 0 ? (
                  <ReferrersTable
                    referrers={filteredReferrers}
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    onCopyCode={handleCopyCode}
                    copiedCode={copiedCode}
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    {searchTerm || tierFilter !== 'all'
                      ? 'לא נמצאו תוצאות לחיפוש'
                      : 'אין מפנים עדיין'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
