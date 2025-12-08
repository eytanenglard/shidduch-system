// src/app/[locale]/referral/dashboard/page.tsx
// דשבורד מפנה - פרס יחיד למנצח

'use client';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  Copy,
  Check,
  Share2,
  Trophy,
  Users,
  MousePointer,
  UserCheck,
  Gift,
  Clock,
  ChevronRight,
  Loader2,
  AlertCircle,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ================== Types ==================
interface ReferrerStats {
  code: string;
  name: string;
  tier: 'AMBASSADOR' | 'COMMUNITY';
  clickCount: number;
  verifiedCount: number;
  rank?: number;
  prizesEarned: Array<{
    prize: string;
    prizeValue?: number;
    threshold: number;
    awardedAt: string;
  }>;
}

interface ReferralsData {
  total: number;
  byStatus: Record<string, number>;
  recent: Array<{ status: string; createdAt: string }>;
}

interface CampaignData {
  name: string;
  endsAt: string;
  daysRemaining: number;
  isActive: boolean;
  totalReferrers?: number;
}

interface LeaderboardEntry {
  rank: number;
  code: string;
  name: string;
  verifiedCount: number;
  isCurrentUser: boolean;
}

// ================== Stats Card Component ==================
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'teal' | 'orange' | 'rose' | 'amber';
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  subtitle,
}) => {
  const colorClasses = {
    teal: 'from-teal-50 to-emerald-50 border-teal-200 text-teal-600',
    orange: 'from-orange-50 to-amber-50 border-orange-200 text-orange-600',
    rose: 'from-rose-50 to-pink-50 border-rose-200 text-rose-600',
    amber: 'from-amber-50 to-yellow-50 border-amber-200 text-amber-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${colorClasses[color]} border rounded-2xl p-5`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-600">{title}</span>
        <div className={`${colorClasses[color].split(' ').pop()}`}>{icon}</div>
      </div>
      <div className="text-3xl font-bold text-gray-900">
        {value.toLocaleString()}
      </div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </motion.div>
  );
};

// ================== Share Card Component ==================
interface ShareCardProps {
  code: string;
  shareUrl: string;
}

const ShareCard: React.FC<ShareCardProps> = ({ code, shareUrl }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `היי! אני רוצה להמליץ לך על NeshamaTech - מערכת שידוכים מיוחדת שמתמקדת באנשים ולא בסווייפים.\n\nהנה הקישור להרשמה: ${shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <Card className="border-teal-200 bg-gradient-to-br from-teal-50 via-white to-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Share2 className="w-5 h-5 text-teal-600" />
          הקישור שלכם
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-sm text-gray-500 mb-1">הקוד האישי שלכם:</div>
          <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-orange-600">
            {code}
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            value={shareUrl}
            readOnly
            className="font-mono text-sm bg-white"
            dir="ltr"
          />
          <Button
            onClick={copyToClipboard}
            variant="outline"
            size="icon"
            className={copied ? 'bg-teal-50 text-teal-600 border-teal-200' : ''}
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
        <Button
          onClick={shareWhatsApp}
          className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white"
        >
          <Share2 className="ml-2 w-4 h-4" />
          שתפו בוואטסאפ
        </Button>
      </CardContent>
    </Card>
  );
};

// ================== Winner Prize Card - NEW ==================
interface WinnerPrizeCardProps {
  rank: number;
  totalReferrers: number;
}

const WinnerPrizeCard: React.FC<WinnerPrizeCardProps> = ({
  rank,
  totalReferrers,
}) => {
  const isLeading = rank === 1;

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-500" />
          הפרס הגדול
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-2">שובר לארוחה זוגית</div>
          <div className="text-2xl">🍽️</div>
        </div>

        <div
          className={`rounded-xl p-4 text-center ${isLeading ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white' : 'bg-white/60'}`}
        >
          {isLeading ? (
            <>
              <div className="text-2xl mb-1">🏆</div>
              <div className="font-bold">את/ה מובילים!</div>
              <div className="text-sm opacity-90">המשיכו כך כדי לזכות בפרס</div>
            </>
          ) : (
            <>
              <div className="text-3xl font-bold text-gray-800">#{rank}</div>
              <div className="text-sm text-gray-600">
                מתוך {totalReferrers} משתתפים
              </div>
              <div className="text-xs text-amber-600 font-medium mt-1">
                הזמינו עוד חברים כדי לעלות בדירוג!
              </div>
            </>
          )}
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 text-center">
          <div className="text-xs text-gray-600">
            <span className="font-bold text-teal-600">טיפ:</span> מי שמביא הכי
            הרבה חברים מאומתים עד סוף הקמפיין - מנצח!
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ================== Leaderboard Component ==================
interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserCode: string;
  currentUserRank?: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  entries,
  currentUserCode,
  currentUserRank,
}) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          טבלת המובילים
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.code}
              className={`flex items-center justify-between p-3 rounded-xl transition-colors ${entry.isCurrentUser ? 'bg-gradient-to-r from-teal-50 to-orange-50 border border-teal-200' : 'bg-gray-50 hover:bg-gray-100'}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${entry.rank === 1 ? 'bg-amber-100 text-amber-700' : entry.rank === 2 ? 'bg-gray-200 text-gray-700' : entry.rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}
                >
                  {entry.rank}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {entry.name}
                    {entry.isCurrentUser && (
                      <span className="text-xs text-teal-600 mr-1">(אתם)</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{entry.code}</div>
                </div>
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900">
                  {entry.verifiedCount}
                </div>
                <div className="text-xs text-gray-500">מאומתים</div>
              </div>
            </div>
          ))}
        </div>
        {currentUserRank && currentUserRank > 10 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-center text-sm text-gray-600">
              המיקום שלכם:{' '}
              <span className="font-bold text-teal-600">
                #{currentUserRank}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ================== Campaign Timer Component ==================
interface CampaignTimerProps {
  campaign: CampaignData;
}

const CampaignTimer: React.FC<CampaignTimerProps> = ({ campaign }) => {
  if (!campaign.isActive) {
    return (
      <div className="bg-gray-100 rounded-xl p-4 text-center">
        <div className="text-gray-600">הקמפיין הסתיים</div>
      </div>
    );
  }

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
      <CardContent className="pt-6">
        <div className="flex items-center justify-center gap-2 text-orange-700 mb-2">
          <Clock className="w-5 h-5" />
          <span className="font-medium">זמן שנותר לקמפיין</span>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900">
            {campaign.daysRemaining}
          </div>
          <div className="text-sm text-gray-600">ימים</div>
        </div>
        <div className="text-xs text-center text-gray-500 mt-3">
          מסתיים ב-{new Date(campaign.endsAt).toLocaleDateString('he-IL')}
        </div>
      </CardContent>
    </Card>
  );
};

// ================== Main Dashboard Component ==================
export default function ReferralDashboard() {
    const router = useRouter(); // <--- הוסף את השורה הזו כאן
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferrerStats | null>(null);
  const [referrals, setReferrals] = useState<ReferralsData | null>(null);
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = code ? `${baseUrl}/r/${code}` : '';

  useEffect(() => {
    if (!code) {
      setError('לא סופק קוד מפנה');
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const statsRes = await fetch(`/api/referral/stats?code=${code}`);
        const statsData = await statsRes.json();

        if (!statsData.success) {
          throw new Error(statsData.error || 'שגיאה בטעינת נתונים');
        }

        setStats(statsData.stats);
        setReferrals(statsData.referrals);
        setCampaign(statsData.campaign);

        const leaderboardRes = await fetch(
          `/api/referral/leaderboard?myCode=${code}`
        );
        const leaderboardData = await leaderboardRes.json();

        if (leaderboardData.success) {
          setLeaderboard(leaderboardData.leaderboard || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'שגיאה בטעינת נתונים');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [code]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-orange-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto mb-4" />
          <div className="text-gray-600">טוען נתונים...</div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-orange-50">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">שגיאה</h1>
          <p className="text-gray-600 mb-4">{error || 'לא נמצאו נתונים'}</p>
          <Button
            onClick={() => router.push('/he/friends')} // שינוי כאן
            variant="outline"
          >
            חזרה לעמוד ההרשמה
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main
      className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8"
      dir="rtl"
    >
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Image src="/logo.png" alt="NeshamaTech" width={40} height={40} />
            <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-orange-600">
              NeshamaTech
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            היי {stats.name}! 👋
          </h1>
          <p className="text-gray-600">הנה הסטטיסטיקות שלכם בקמפיין</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="לחיצות"
            value={stats.clickCount}
            icon={<MousePointer className="w-5 h-5" />}
            color="teal"
            subtitle="לחצו על הקישור"
          />
          <StatCard
            title="נרשמו"
            value={referrals?.byStatus?.REGISTERED || 0}
            icon={<Users className="w-5 h-5" />}
            color="orange"
            subtitle="השלימו הרשמה"
          />
          <StatCard
            title="מאומתים"
            value={stats.verifiedCount}
            icon={<UserCheck className="w-5 h-5" />}
            color="rose"
            subtitle="אימתו טלפון"
          />
          <StatCard
            title="דירוג"
            value={stats.rank || 0}
            icon={<Trophy className="w-5 h-5" />}
            color="amber"
            subtitle="מתוך כל המשתתפים"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <ShareCard code={stats.code} shareUrl={shareUrl} />
            {campaign && <CampaignTimer campaign={campaign} />}
          </div>

          {/* Right Column - Winner Prize Card */}
          <div className="space-y-6">
            <WinnerPrizeCard
              rank={stats.rank || 999}
              totalReferrers={
                campaign?.totalReferrers || leaderboard.length || 1
              }
            />
          </div>
        </div>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="mt-8">
            <Leaderboard
              entries={leaderboard}
              currentUserCode={stats.code}
              currentUserRank={stats.rank}
            />
          </div>
        )}

        {/* Back Link */}
        <div className="mt-8 text-center">
          {/* הקוד החדש והתקין */}
          <Link
            href="/he/friends"
            className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 text-sm"
          >
            <ChevronRight className="w-4 h-4" />
            חזרה לעמוד הקמפיין
          </Link>
        </div>
      </div>
    </main>
  );
}
