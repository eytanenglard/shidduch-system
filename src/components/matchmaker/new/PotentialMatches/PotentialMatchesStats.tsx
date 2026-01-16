// =============================================================================
// src/components/matchmaker/PotentialMatches/PotentialMatchesStats.tsx
// סטטיסטיקות התאמות פוטנציאליות
// =============================================================================

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  Eye,
  Send,
  X,
  AlertTriangle,
  TrendingUp,
  Star,
  Heart,
  CheckCircle,
  Calendar,
  Timer,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import type { PotentialMatchesStats as StatsType, LastScanInfo } from '@/types/potentialMatches';

// =============================================================================
// TYPES
// =============================================================================

interface PotentialMatchesStatsProps {
  stats: StatsType | null;
  lastScanInfo: LastScanInfo | null;
  isScanRunning?: boolean;
  scanProgress?: number;
  className?: string;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  subValue?: string;
  gradient: string;
  iconColor: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  subValue,
  gradient,
  iconColor,
  onClick,
}) => (
  <Card
    className={cn(
      'relative overflow-hidden p-4 border-0 shadow-lg transition-all duration-300',
      'hover:shadow-xl hover:scale-105 cursor-pointer',
      `bg-gradient-to-br ${gradient}`
    )}
    onClick={onClick}
  >
    {/* Background Pattern */}
    <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
      <svg viewBox="0 0 80 80" fill="currentColor">
        <circle cx="60" cy="20" r="40" />
      </svg>
    </div>

    <div className="relative flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
        {subValue && (
          <p className="text-xs text-gray-500 mt-1">{subValue}</p>
        )}
      </div>
      <div className={cn(
        'p-3 rounded-xl shadow-lg',
        iconColor
      )}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </Card>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const PotentialMatchesStats: React.FC<PotentialMatchesStatsProps> = ({
  stats,
  lastScanInfo,
  isScanRunning = false,
  scanProgress = 0,
  className,
}) => {
  if (!stats) {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4', className)}>
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 w-20 bg-gray-200 rounded mb-2" />
            <div className="h-8 w-16 bg-gray-200 rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={Heart}
          label="סה״כ התאמות"
          value={stats.total}
          gradient="from-pink-50 to-rose-100"
          iconColor="bg-gradient-to-br from-pink-500 to-rose-500"
        />
        
        <StatCard
          icon={Clock}
          label="ממתינות"
          value={stats.pending}
          subValue="טרם נבדקו"
          gradient="from-amber-50 to-yellow-100"
          iconColor="bg-gradient-to-br from-amber-500 to-yellow-500"
        />
        
        <StatCard
          icon={Eye}
          label="נבדקו"
          value={stats.reviewed}
          gradient="from-blue-50 to-cyan-100"
          iconColor="bg-gradient-to-br from-blue-500 to-cyan-500"
        />
        
        <StatCard
          icon={Send}
          label="נשלחו הצעות"
          value={stats.sent}
          gradient="from-green-50 to-emerald-100"
          iconColor="bg-gradient-to-br from-green-500 to-emerald-500"
        />
        
        <StatCard
          icon={X}
          label="נדחו"
          value={stats.dismissed}
          gradient="from-gray-50 to-slate-100"
          iconColor="bg-gradient-to-br from-gray-500 to-slate-500"
        />
        
        <StatCard
          icon={AlertTriangle}
          label="עם אזהרות"
          value={stats.withWarnings}
          subValue="בהצעה פעילה"
          gradient="from-orange-50 to-amber-100"
          iconColor="bg-gradient-to-br from-orange-500 to-amber-500"
        />
      </div>

      {/* Score Distribution & Last Scan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Score Distribution */}
        <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-white to-purple-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">התפלגות ציונים</h3>
              <p className="text-sm text-gray-500">ציון ממוצע: {stats.avgScore}</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* High Score (85+) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-emerald-700 flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  ציון גבוה (85+)
                </span>
                <span className="text-sm text-gray-600">{stats.highScore}</span>
              </div>
              <Progress 
                value={(stats.highScore / (stats.total || 1)) * 100} 
                className="h-2 bg-gray-200"
              />
            </div>

            {/* Medium Score (70-85) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-blue-700 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  ציון בינוני (70-84)
                </span>
                <span className="text-sm text-gray-600">{stats.mediumScore}</span>
              </div>
              <Progress 
                value={(stats.mediumScore / (stats.total || 1)) * 100} 
                className="h-2 bg-gray-200"
              />
            </div>

            {/* Pie visualization */}
            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-gray-600">גבוה</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs text-gray-600">בינוני</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Last Scan Info */}
        <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-white to-cyan-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">סריקה אחרונה</h3>
              <p className="text-sm text-gray-500">
                {lastScanInfo ? (
                  formatDistanceToNow(new Date(lastScanInfo.startedAt), { 
                    addSuffix: true, 
                    locale: he 
                  })
                ) : 'לא בוצעה עדיין'}
              </p>
            </div>
          </div>

          {/* Scan Running Progress */}
          {isScanRunning && (
            <div className="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700 flex items-center gap-2">
                  <Timer className="w-4 h-4 animate-spin" />
                  סריקה בתהליך...
                </span>
                <span className="text-sm text-blue-600">{scanProgress}%</span>
              </div>
              <Progress value={scanProgress} className="h-2" />
            </div>
          )}

          {lastScanInfo && !isScanRunning && (
            <div className="space-y-3">
              {/* Status */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/60">
                <span className="text-sm text-gray-600">סטטוס</span>
                <Badge className={cn(
                  lastScanInfo.status === 'completed' 
                    ? 'bg-green-100 text-green-700' 
                    : lastScanInfo.status === 'partial'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
                )}>
                  {lastScanInfo.status === 'completed' ? 'הושלם' : 
                   lastScanInfo.status === 'partial' ? 'הושלם חלקית' : 'נכשל'}
                </Badge>
              </div>

              {/* Candidates Scanned */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/60">
                <span className="text-sm text-gray-600">מועמדים שנסרקו</span>
                <span className="font-medium text-gray-800">
                  {lastScanInfo.candidatesScanned} / {lastScanInfo.totalCandidates}
                </span>
              </div>

              {/* Matches Found */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/60">
                <span className="text-sm text-gray-600">התאמות שנמצאו</span>
                <span className="font-medium text-gray-800 flex items-center gap-1">
                  <Heart className="w-4 h-4 text-pink-500" />
                  {lastScanInfo.matchesFound}
                </span>
              </div>

              {/* New Matches */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/60">
                <span className="text-sm text-gray-600">התאמות חדשות</span>
                <span className="font-medium text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  {lastScanInfo.newMatches}
                </span>
              </div>

              {/* Duration */}
              {lastScanInfo.durationMs && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/60">
                  <span className="text-sm text-gray-600">משך הסריקה</span>
                  <span className="font-medium text-gray-800">
                    {Math.round(lastScanInfo.durationMs / 1000 / 60)} דקות
                  </span>
                </div>
              )}
            </div>
          )}

          {!lastScanInfo && !isScanRunning && (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>טרם בוצעה סריקה</p>
              <p className="text-sm">הפעל סריקה לילית למציאת התאמות</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PotentialMatchesStats;
