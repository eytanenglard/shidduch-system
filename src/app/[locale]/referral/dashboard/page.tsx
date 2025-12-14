// src/app/[locale]/referral/dashboard/page.tsx
// דשבורד מפנה - קמפיין חנוכה "מוסיפים אור בחנוכה"

'use client';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Copy,
  Check,
  Share2,
  Trophy,
  Users,
  MousePointer,
  UserCheck,
  Clock,
  ChevronRight,
  Loader2,
  AlertCircle,
  Crown,
  X,
  MessageCircle,
  Forward,
  Sparkles,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ================== Hanukkah Config ==================
const HANUKKAH_CONFIG = {
  startDate: new Date('2024-12-25'), // כ"ה כסלו - נר ראשון
  endDate: new Date('2025-01-02'), // סוף חנוכה
  currentCandle: 1, // נר ראשון
};

// חישוב איזה נר היום
const getCurrentCandle = (): number => {
  const today = new Date();
  const start = HANUKKAH_CONFIG.startDate;
  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(diffDays + 1, 1), 8);
};

// ================== Hanukkiah SVG Component ==================
interface HanukkiahProps {
  litCandles: number;
  className?: string;
}

const Hanukkiah: React.FC<HanukkiahProps> = ({
  litCandles,
  className = '',
}) => {
  const candlePositions = [
    { x: 25, height: 35 }, // נר 1 (שמאל קיצוני)
    { x: 55, height: 35 }, // נר 2
    { x: 85, height: 35 }, // נר 3
    { x: 115, height: 35 }, // נר 4
    { x: 175, height: 50 }, // שמש (מוגבה) - אמצע
    { x: 205, height: 35 }, // נר 5
    { x: 235, height: 35 }, // נר 6
    { x: 265, height: 35 }, // נר 7
    { x: 295, height: 35 }, // נר 8 (ימין קיצוני)
  ];

  // סדר ההדלקה: שמש (4) תמיד דולק, ואז מימין לשמאל
  const getLitStatus = (index: number): boolean => {
    if (index === 4) return true; // שמש תמיד דולק
    if (index > 4) {
      // נרות מימין לשמש (5,6,7,8 -> נר 1,2,3,4)
      const candleNumber = index - 4;
      return candleNumber <= litCandles;
    } else {
      // נרות משמאל לשמש (0,1,2,3 -> נר 8,7,6,5)
      const candleNumber = 8 - index;
      return candleNumber <= litCandles;
    }
  };

  return (
    <svg
      viewBox="0 0 320 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* בסיס החנוכייה */}
      <defs>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F6E05E" />
          <stop offset="50%" stopColor="#D69E2E" />
          <stop offset="100%" stopColor="#B7791F" />
        </linearGradient>
        <linearGradient id="flameGradient" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#F6AD55" />
          <stop offset="50%" stopColor="#ED8936" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* בסיס */}
      <rect
        x="60"
        y="100"
        width="200"
        height="8"
        rx="2"
        fill="url(#goldGradient)"
      />
      <rect
        x="150"
        y="85"
        width="20"
        height="20"
        rx="2"
        fill="url(#goldGradient)"
      />

      {/* נרות */}
      {candlePositions.map((pos, index) => {
        const isLit = getLitStatus(index);
        const isShamash = index === 4;
        const baseY = isShamash ? 35 : 50;

        return (
          <g key={index}>
            {/* גוף הנר */}
            <rect
              x={pos.x - 4}
              y={baseY}
              width="8"
              height={pos.height}
              rx="2"
              fill={isShamash ? '#FBD38D' : '#E2E8F0'}
              stroke="url(#goldGradient)"
              strokeWidth="1"
            />

            {/* פתילה */}
            <line
              x1={pos.x}
              y1={baseY}
              x2={pos.x}
              y2={baseY - 5}
              stroke="#4A5568"
              strokeWidth="1"
            />

            {/* להבה */}
            {isLit && (
              <g filter="url(#glow)">
                <motion.ellipse
                  cx={pos.x}
                  cy={baseY - 12}
                  rx="5"
                  ry="10"
                  fill="url(#flameGradient)"
                  initial={{ scaleY: 0.8, opacity: 0.8 }}
                  animate={{
                    scaleY: [0.8, 1, 0.9, 1, 0.8],
                    opacity: [0.8, 1, 0.9, 1, 0.8],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                <motion.ellipse
                  cx={pos.x}
                  cy={baseY - 14}
                  rx="2"
                  ry="5"
                  fill="#FEF3C7"
                  initial={{ scaleY: 0.9 }}
                  animate={{
                    scaleY: [0.9, 1.1, 0.9],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </g>
            )}
          </g>
        );
      })}

      {/* עמודי החנוכייה */}
      <rect x="157" y="50" width="6" height="35" fill="url(#goldGradient)" />
      {[25, 55, 85, 115, 205, 235, 265, 295].map((x, i) => (
        <g key={`stand-${i}`}>
          <line
            x1={x}
            y1="85"
            x2={x}
            y2="100"
            stroke="url(#goldGradient)"
            strokeWidth="3"
          />
          <line
            x1={x}
            y1="85"
            x2="160"
            y2="85"
            stroke="url(#goldGradient)"
            strokeWidth="2"
          />
        </g>
      ))}
    </svg>
  );
};

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

// ================== Stats Card Component (Hanukkah Theme) ==================
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'gold' | 'amber' | 'indigo';
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
    blue: 'from-blue-900/20 to-blue-800/10 border-blue-400/30 text-blue-300',
    gold: 'from-amber-500/20 to-yellow-500/10 border-amber-400/30 text-amber-300',
    amber:
      'from-orange-500/20 to-amber-500/10 border-orange-400/30 text-orange-300',
    indigo:
      'from-indigo-500/20 to-purple-500/10 border-indigo-400/30 text-indigo-300',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${colorClasses[color]} border rounded-2xl p-5 backdrop-blur-sm`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-blue-100/80">{title}</span>
        <div className={colorClasses[color].split(' ').pop()}>{icon}</div>
      </div>
      <div className="text-3xl font-bold text-white">
        {value.toLocaleString()}
      </div>
      {subtitle && (
        <div className="text-xs text-blue-200/60 mt-1">{subtitle}</div>
      )}
    </motion.div>
  );
};

// ================== WhatsApp Share Modal Component (Hanukkah Theme) ==================
interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  referrerName: string;
}

const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  shareUrl,
  referrerName,
}) => {
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // הודעת השיתוף המותאמת לחנוכה
  const shareMessage = `חג חנוכה שמח! 🕎✨

בחנוכה הזה אני רוצה להמליץ לך על משהו מיוחד - NeshamaTech, מערכת שידוכים שפועלת אחרת לגמרי מאפליקציות ההיכרויות.

🕯️ מה מיוחד פה?
• שדכנים אמיתיים מחפשים בשבילך - בלי סווייפים אינסופיים
• דיסקרטיות מלאה - הפרטים שלך לא חשופים
• התאמות על בסיס ערכים והשקפת עולם

💫 כמו נס פך השמן - לפעמים דבר קטן יכול להוביל לדבר גדול!

הנה הקישור להרשמה:
${shareUrl}

חג אורים שמח! 🕎`;

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2500);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const openWhatsAppDirect = () => {
    const text = encodeURIComponent(shareMessage);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = `whatsapp://send?text=${text}`;
    } else {
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-blue-950/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg z-50 max-h-[80vh] overflow-y-auto"
          >
            <div className="bg-gradient-to-b from-blue-900 to-blue-950 rounded-3xl shadow-2xl overflow-hidden border border-amber-400/30">
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 px-6 py-4 relative">
                <button
                  onClick={onClose}
                  className="absolute left-4 top-4 text-amber-900/80 hover:text-amber-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="text-center text-amber-900">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-2xl">🕎</span>
                    <h3 className="text-xl font-bold">שתפו את האור</h3>
                    <span className="text-2xl">🕎</span>
                  </div>
                  <p className="text-sm text-amber-800">
                    הזמינו חברים להצטרף בחנוכה
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                {/* Message Preview */}
                <div className="relative">
                  <div className="text-sm font-medium text-amber-300 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    ההודעה שתשלח:
                  </div>
                  <div
                    className="bg-blue-950/50 rounded-2xl p-4 text-sm text-blue-100 leading-relaxed max-h-48 overflow-y-auto border border-blue-800/50"
                    dir="rtl"
                  >
                    <div className="whitespace-pre-wrap">{shareMessage}</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {/* Copy Message Button */}
                  <Button
                    onClick={copyMessage}
                    variant="outline"
                    className={`w-full h-12 text-base transition-all duration-300 border-blue-700 ${
                      copiedMessage
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-blue-900/50 text-blue-100 hover:bg-blue-800/50'
                    }`}
                  >
                    {copiedMessage ? (
                      <>
                        <Check className="ml-2 w-5 h-5" />
                        ההודעה הועתקה!
                      </>
                    ) : (
                      <>
                        <Copy className="ml-2 w-5 h-5" />
                        העתקת ההודעה
                      </>
                    )}
                  </Button>

                  {/* Copy Link Only Button */}
                  <Button
                    onClick={copyLink}
                    variant="outline"
                    className={`w-full h-12 text-base transition-all duration-300 border-blue-700 ${
                      copiedLink
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-blue-900/50 text-blue-100 hover:bg-blue-800/50'
                    }`}
                  >
                    {copiedLink ? (
                      <>
                        <Check className="ml-2 w-5 h-5" />
                        הקישור הועתק!
                      </>
                    ) : (
                      <>
                        <Copy className="ml-2 w-5 h-5" />
                        העתקת הקישור בלבד
                      </>
                    )}
                  </Button>

                  {/* Divider */}
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-blue-800"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-blue-900 px-3 text-sm text-blue-400">
                        או
                      </span>
                    </div>
                  </div>

                  {/* Open WhatsApp Button */}
                  <Button
                    onClick={openWhatsAppDirect}
                    className="w-full h-14 text-lg bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg shadow-green-900/30 hover:shadow-xl transition-all duration-300"
                  >
                    <Forward className="ml-2 w-5 h-5" />
                    פתיחת וואטסאפ ושליחה לחבר
                  </Button>
                </div>

                {/* Tip */}
                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-3 border border-amber-500/20">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">🕯️</span>
                    <p className="text-xs text-amber-200 leading-relaxed">
                      <span className="font-bold">טיפ:</span> כמו שמוסיפים נר כל
                      יום - כל חבר שמצטרף מוסיף אור לקהילה!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ================== Share Card Component (Hanukkah Theme) ==================
interface ShareCardProps {
  code: string;
  shareUrl: string;
  referrerName: string;
}

const ShareCard: React.FC<ShareCardProps> = ({
  code,
  shareUrl,
  referrerName,
}) => {
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Card className="border-amber-400/30 bg-gradient-to-br from-blue-900/80 to-blue-950/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-amber-300">
            <Share2 className="w-5 h-5 text-amber-400" />
            הקישור שלכם
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-sm text-blue-200/70 mb-1">
              הקוד האישי שלכם:
            </div>
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500">
              {code}
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              value={shareUrl}
              readOnly
              className="font-mono text-sm bg-blue-950/50 border-blue-700 text-blue-100"
              dir="ltr"
            />
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="icon"
              className={`transition-all duration-300 border-blue-700 ${copied ? 'bg-amber-500/20 text-amber-300 border-amber-400' : 'bg-blue-900/50 text-blue-200'}`}
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-amber-900 font-semibold text-base shadow-lg shadow-amber-500/20 hover:shadow-xl transition-all duration-300"
          >
            <Flame className="ml-2 w-5 h-5" />
            שתפו את האור 🕎
          </Button>
        </CardContent>
      </Card>

      {/* WhatsApp Share Modal */}
      <WhatsAppShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        shareUrl={shareUrl}
        referrerName={referrerName}
      />
    </>
  );
};

// ================== Winner Prize Card (Hanukkah Theme) ==================
interface WinnerPrizeCardProps {
  rank: number;
  totalReferrers: number;
}

const WinnerPrizeCard: React.FC<WinnerPrizeCardProps> = ({
  rank,
  totalReferrers,
}) => {
  const isLeading = rank === 1;
  const currentCandle = getCurrentCandle();

  return (
    <Card className="border-amber-400/30 bg-gradient-to-br from-blue-900/80 to-blue-950/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-amber-300">
          <Crown className="w-5 h-5 text-amber-400" />
          הפרס הגדול
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hanukkiah Display */}
        <div className="bg-blue-950/50 rounded-2xl p-4 border border-blue-800/30">
          <Hanukkiah litCandles={currentCandle} className="w-full h-auto" />
          <div className="text-center mt-2">
            <span className="text-amber-300 text-sm">
              נר {currentCandle} של חנוכה
            </span>
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm text-blue-200/70 mb-2">
            🍽️ שובר לארוחה זוגית
          </div>
          <div className="text-xs text-blue-300/60">למנצח/ת הקמפיין</div>
        </div>

        <div
          className={`rounded-xl p-4 text-center ${isLeading ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-900' : 'bg-blue-950/50 border border-blue-800/30'}`}
        >
          {isLeading ? (
            <>
              <div className="text-2xl mb-1">🏆</div>
              <div className="font-bold">את/ה מובילים!</div>
              <div className="text-sm opacity-90">
                המשיכו להאיר כדי לזכות בפרס
              </div>
            </>
          ) : (
            <>
              <div className="text-3xl font-bold text-amber-300">#{rank}</div>
              <div className="text-sm text-blue-200/70">
                מתוך {totalReferrers} משתתפים
              </div>
              <div className="text-xs text-amber-400 font-medium mt-1">
                הוסיפו עוד אור כדי לעלות בדירוג! 🕯️
              </div>
            </>
          )}
        </div>

        <div className="bg-blue-950/50 backdrop-blur-sm rounded-xl p-3 text-center border border-blue-800/30">
          <div className="text-xs text-blue-200/70">
            <span className="font-bold text-amber-400">💡 טיפ:</span> מי שמביא
            הכי הרבה חברים מאומתים עד סוף חנוכה - מנצח!
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ================== Leaderboard Component (Hanukkah Theme) ==================
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
    <Card className="border-amber-400/30 bg-gradient-to-br from-blue-900/80 to-blue-950/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-amber-300">
          <Trophy className="w-5 h-5 text-amber-400" />
          טבלת מאירי האור 🕎
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entries.slice(0, 10).map((entry) => (
            <div
              key={entry.code}
              className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                entry.isCurrentUser
                  ? 'bg-amber-500/20 border border-amber-400/30'
                  : 'bg-blue-950/50 hover:bg-blue-900/50 border border-blue-800/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    entry.rank === 1
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900'
                      : entry.rank === 2
                        ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700'
                        : entry.rank === 3
                          ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white'
                          : 'bg-blue-800 text-blue-200'
                  }`}
                >
                  {entry.rank}
                </div>
                <div>
                  <div className="font-medium text-blue-100">
                    {entry.name}
                    {entry.isCurrentUser && (
                      <span className="text-xs text-amber-400 mr-1">(אתם)</span>
                    )}
                  </div>
                  <div className="text-xs text-blue-400/60">{entry.code}</div>
                </div>
              </div>
              <div className="text-left">
                <div className="font-bold text-amber-300">
                  {entry.verifiedCount}
                </div>
                <div className="text-xs text-blue-300/60">נרות 🕯️</div>
              </div>
            </div>
          ))}
        </div>
        {currentUserRank && currentUserRank > 10 && (
          <div className="mt-4 pt-4 border-t border-blue-800/30">
            <div className="text-center text-sm text-blue-200/70">
              המיקום שלכם:{' '}
              <span className="font-bold text-amber-400">
                #{currentUserRank}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ================== Campaign Timer Component (Hanukkah Theme) ==================
interface CampaignTimerProps {
  campaign: CampaignData;
}

const CampaignTimer: React.FC<CampaignTimerProps> = ({ campaign }) => {
  const currentCandle = getCurrentCandle();

  if (!campaign.isActive) {
    return (
      <div className="bg-blue-900/50 rounded-xl p-4 text-center border border-blue-800/30">
        <div className="text-blue-200">הקמפיין הסתיים</div>
      </div>
    );
  }

  return (
    <Card className="border-amber-400/30 bg-gradient-to-br from-blue-900/80 to-blue-950/80 backdrop-blur-sm">
      <CardContent className="pt-6">
        <div className="flex items-center justify-center gap-2 text-amber-300 mb-2">
          <Clock className="w-5 h-5" />
          <span className="font-medium">נרות שנותרו להדליק</span>
        </div>
        <div className="text-center">
          <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500">
            {8 - currentCandle}
          </div>
          <div className="text-sm text-blue-200/70 mt-1">מתוך 8 נרות</div>
        </div>
        <div className="flex justify-center gap-1 mt-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((candle) => (
            <motion.div
              key={candle}
              className={`w-3 h-8 rounded-full ${
                candle <= currentCandle
                  ? 'bg-gradient-to-t from-amber-500 to-yellow-400'
                  : 'bg-blue-800/50'
              }`}
              initial={candle <= currentCandle ? { scale: 0.8 } : {}}
              animate={
                candle <= currentCandle
                  ? {
                      scale: [0.8, 1.1, 1],
                      boxShadow: [
                        '0 0 0px rgba(251, 191, 36, 0)',
                        '0 0 10px rgba(251, 191, 36, 0.5)',
                        '0 0 5px rgba(251, 191, 36, 0.3)',
                      ],
                    }
                  : {}
              }
              transition={{ duration: 0.5, delay: candle * 0.1 }}
            />
          ))}
        </div>
        <div className="text-xs text-center text-blue-300/60 mt-4">
          הקמפיין מסתיים בסוף החנוכה 🕎
        </div>
      </CardContent>
    </Card>
  );
};

// ================== Main Dashboard Component ==================
export default function ReferralDashboard() {
  const router = useRouter();
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
  const currentCandle = getCurrentCandle();

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-10 h-10 text-amber-400 mx-auto mb-4" />
          </motion.div>
          <div className="text-blue-200">טוען נתונים...</div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">שגיאה</h1>
          <p className="text-blue-200 mb-4">{error || 'לא נמצאו נתונים'}</p>
          <Button
            onClick={() => router.push('/he/friends')}
            variant="outline"
            className="border-blue-700 text-blue-200 hover:bg-blue-800"
          >
            חזרה לעמוד ההרשמה
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main
      className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 py-8 relative overflow-hidden"
      dir="rtl"
    >
      {/* Background Stars/Sparkles Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-amber-300/30 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Image src="/logo.png" alt="NeshamaTech" width={40} height={40} />
            <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500">
              NeshamaTech
            </span>
          </div>

          {/* Hanukkah Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 rounded-2xl p-4 mb-6 border border-amber-400/30"
          >
            <div className="text-2xl mb-1">🕎 מוסיפים אור בחנוכה 🕎</div>
            <div className="text-sm text-amber-200/80">
              נר {currentCandle} של חנוכה
            </div>
          </motion.div>

          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            היי {stats.name}! 👋
          </h1>
          <p className="text-blue-200/80">
            הנה הסטטיסטיקות שלכם בקמפיין החנוכה
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="לחיצות"
            value={stats.clickCount}
            icon={<MousePointer className="w-5 h-5" />}
            color="blue"
            subtitle="לחצו על הקישור"
          />
          <StatCard
            title="נרשמו"
            value={referrals?.byStatus?.REGISTERED || 0}
            icon={<Users className="w-5 h-5" />}
            color="gold"
            subtitle="השלימו הרשמה"
          />
          <StatCard
            title="מאומתים"
            value={stats.verifiedCount}
            icon={<UserCheck className="w-5 h-5" />}
            color="amber"
            subtitle="נרות שהדלקתם 🕯️"
          />
          <StatCard
            title="דירוג"
            value={stats.rank || 0}
            icon={<Trophy className="w-5 h-5" />}
            color="indigo"
            subtitle="מתוך כל המשתתפים"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <ShareCard
              code={stats.code}
              shareUrl={shareUrl}
              referrerName={stats.name}
            />
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
          <Link
            href="/he/friends"
            className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 text-sm transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
            חזרה לעמוד הקמפיין
          </Link>
        </div>

        {/* Footer Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-blue-300/60 text-sm"
        >
          חג אורים שמח! ✨
        </motion.div>
      </div>
    </main>
  );
}
