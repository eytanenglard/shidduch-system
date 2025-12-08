// src/app/[locale]/referral/dashboard/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link'; // Added import
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
  nextPrizeThreshold?: number;
  nextPrize?: string;
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
  recent: Array<{
    status: string;
    createdAt: string;
  }>;
}

interface CampaignData {
  name: string;
  endsAt: string;
  daysRemaining: number;
  isActive: boolean;
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

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => {
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
      <div className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</div>
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
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
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

// ================== Prizes Progress Component ==================

interface PrizesProgressProps {
  currentCount: number;
  prizesEarned: ReferrerStats['prizesEarned'];
  nextPrize?: string;
  nextThreshold?: number;
}

const PrizesProgress: React.FC<PrizesProgressProps> = ({
  currentCount,
  prizesEarned,
  nextPrize,
  nextThreshold,
}) => {
  const tiers = [
    { threshold: 3, prize: 'שובר קפה 50₪' },
    { threshold: 7, prize: 'שובר מסעדה 150₪' },
    { threshold: 15, prize: 'ארוחה זוגית 400₪' },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Gift className="w-5 h-5 text-amber-500" />
          התקדמות לפרסים
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress tiers */}
        <div className="space-y-3">
          {tiers.map((tier, index) => {
            const isEarned = currentCount >= tier.threshold;
            const progress = Math.min((currentCount / tier.threshold) * 100, 100);

            return (
              <div key={index} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm ${isEarned ? 'text-teal-600 font-medium' : 'text-gray-600'}`}>
                    {tier.prize}
                  </span>
                  <span className="text-xs text-gray-500">
                    {isEarned ? (
                      <span className="text-teal-600 flex items-center gap-1">
                        <Check className="w-3 h-3" /> הושג!
                      </span>
                    ) : (
                      `${currentCount}/${tier.threshold}`
                    )}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isEarned
                        ? 'bg-gradient-to-r from-teal-400 to-emerald-500'
                        : 'bg-gradient-to-r from-orange-300 to-amber-400'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Next milestone */}
        {nextPrize && nextThreshold && (
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center gap-2 text-amber-700">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">הפרס הבא:</span>
            </div>
            <div className="mt-1 text-amber-900 font-bold">{nextPrize}</div>
            <div className="text-xs text-amber-600 mt-1">
              עוד {nextThreshold - currentCount} חברים מאומתים להשגה
            </div>
          </div>
        )}

        {/* Already earned all */}
        {!nextPrize && currentCount >= 15 && (
          <div className="bg-teal-50 rounded-xl p-4 border border-teal-200 text-center">
            <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <div className="text-teal-700 font-medium">כל הכבוד! הגעתם לכל היעדים</div>
            <div className="text-sm text-teal-600 mt-1">המשיכו להביא חברים להגדיל את הסיכוי לפרס הראשון!</div>
          </div>
        )}
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

const Leaderboard: React.FC<LeaderboardProps> = ({ entries, currentUserCode, currentUserRank }) => {
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
              className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                entry.isCurrentUser
                  ? 'bg-gradient-to-r from-teal-50 to-orange-50 border border-teal-200'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    entry.rank === 1
                      ? 'bg-amber-100 text-amber-700'
                      : entry.rank === 2
                      ? 'bg-gray-200 text-gray-700'
                      : entry.rank === 3
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
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
                <div className="font-bold text-gray-900">{entry.verifiedCount}</div>
                <div className="text-xs text-gray-500">מאומתים</div>
              </div>
            </div>
          ))}
        </div>

        {/* Show current user rank if not in top */}
        {currentUserRank && currentUserRank > 10 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-center text-sm text-gray-600">
              המיקום שלכם: <span className="font-bold text-teal-600">#{currentUserRank}</span>
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
          <div className="text-4xl font-bold text-gray-900">{campaign.daysRemaining}</div>
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
        // Fetch stats
        const statsRes = await fetch(`/api/referral/stats?code=${code}`);
        const statsData = await statsRes.json();

        if (!statsData.success) {
          throw new Error(statsData.error || 'שגיאה בטעינת נתונים');
        }

        setStats(statsData.stats);
        setReferrals(statsData.referrals);
        setCampaign(statsData.campaign);

        // Fetch leaderboard
        const leaderboardRes = await fetch(`/api/referral/leaderboard?myCode=${code}`);
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

  // Loading state
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

  // Error state
  if (error || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-orange-50">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">שגיאה</h1>
          <p className="text-gray-600 mb-4">{error || 'לא נמצאו נתונים'}</p>
          <Button
            onClick={() => window.location.href = '/he/friends'}
            variant="outline"
          >
            חזרה לעמוד ההרשמה
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Image src="/logo.png" alt="NeshamaTech" width={40} height={40}  unoptimized/>
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

          {/* Right Column */}
          <div className="space-y-6">
            <PrizesProgress
              currentCount={stats.verifiedCount}
              prizesEarned={stats.prizesEarned}
              nextPrize={stats.nextPrize}
              nextThreshold={stats.nextPrizeThreshold}
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