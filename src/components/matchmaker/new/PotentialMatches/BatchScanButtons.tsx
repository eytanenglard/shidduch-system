// ============================================================
// src/components/matchmaker/new/PotentialMatches/BatchScanButtons.tsx
// ============================================================
// 🎯 כפתורי סריקה לילית - בדיוק כמו ב-SplitView
// ============================================================

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Moon,
  Brain,
  Zap,
  Users,
  Target,
  RefreshCw,
  Loader2,
  X,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

type ScanMethod = 'hybrid' | 'algorithmic' | 'vector' | 'metrics_v2';

interface ScanProgress {
  phase?: string;
  method?: ScanMethod;
  currentUserIndex?: number;
  totalUsers?: number;
  currentUserName?: string;
  progressPercent?: number;
  matchesFoundSoFar?: number;
  newMatchesFoundSoFar?: number;
  usersScanned?: number;
  message?: string;
  stats?: {
    matchesFoundSoFar?: number;
  };
}

interface ScanResult {
  matchesFound?: number;
  newMatches?: number;
  totalMatchesFound?: number;
  newMatchesFound?: number;
}

interface BatchScanButtonsProps {
  isScanning: boolean;
  scanProgress: ScanProgress | null;
  scanResult: ScanResult | null;
  onStartScan: (method: ScanMethod) => void;
  onCancelScan: () => void;
  lastScanInfo?: {
    date: Date;
    matchCount: number;
  } | null;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════
// Method Configurations - בדיוק כמו ב-SplitView
// ═══════════════════════════════════════════════════════════════

const METHOD_CONFIG: Record<ScanMethod, {
  label: string;
  icon: typeof Brain;
  gradient: string;
  hoverGradient: string;
  time: string;
}> = {
  algorithmic: {
    label: 'AI מתקדם',
    icon: Brain,
    gradient: 'from-purple-500 to-purple-600',
    hoverGradient: 'hover:from-purple-600 hover:to-purple-700',
    time: '~3-5 דק',
  },
  vector: {
    label: 'דמיון מהיר ⚡',
    icon: Zap,
    gradient: 'from-blue-500 to-cyan-500',
    hoverGradient: 'hover:from-blue-600 hover:to-cyan-600',
    time: '~30 שנ',
  },
  hybrid: {
    label: 'היברידי 🔥',
    icon: Users,
    gradient: 'from-emerald-500 to-teal-500',
    hoverGradient: 'hover:from-emerald-600 hover:to-teal-600',
    time: '~1-2 דק',
  },
  metrics_v2: {
    label: 'מדדים V2 🎯',
    icon: Target,
    gradient: 'from-indigo-500 to-violet-500',
    hoverGradient: 'hover:from-indigo-600 hover:to-violet-600',
    time: '~2-3 דק',
  },
};

// סדר הכפתורים - בדיוק כמו ב-SplitView
const METHODS_ORDER: ScanMethod[] = ['algorithmic', 'vector', 'hybrid', 'metrics_v2'];

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

const BatchScanButtons: React.FC<BatchScanButtonsProps> = ({
  isScanning,
  scanProgress,
  scanResult,
  onStartScan,
  onCancelScan,
  lastScanInfo,
  className,
}) => {
  const currentMethod = scanProgress?.method;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ═══════════════════════════════════════════════════════════
  // Render: Progress State (כמו InlineJobProgress ב-SplitView)
  // ═══════════════════════════════════════════════════════════

  if (isScanning && scanProgress) {
    const config = METHOD_CONFIG[currentMethod || 'hybrid'];
    const Icon = config.icon;

    return (
      <Card className={cn('p-4', className)}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2.5 rounded-xl bg-gradient-to-r shadow-lg',
                config.gradient
              )}>
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  סריקת {config.label.replace(' 🔥', '').replace(' ⚡', '').replace(' 🎯', '')}
                  {scanProgress.currentUserName && (
                    <Badge variant="secondary" className="font-normal text-xs">
                      {scanProgress.currentUserName}
                    </Badge>
                  )}
                </h3>
                <p className="text-sm text-gray-500">
                  {scanProgress.message || 'מעבד...'}
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelScan}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <X className="w-4 h-4 ml-1" />
              בטל
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {scanProgress.currentUserIndex || 0} / {scanProgress.totalUsers || '?'} משתמשים
              </span>
              <span className="font-medium text-gray-800">
                {scanProgress.progressPercent || 0}%
              </span>
            </div>
            <Progress 
              value={scanProgress.progressPercent || 0} 
              className="h-3"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-100">
              <Users className="w-4 h-4 text-blue-600" />
              <div className="flex flex-col">
                <span className="text-xs text-blue-600">נסרקו</span>
                <span className="font-bold text-blue-800">
                  {scanProgress.usersScanned || scanProgress.currentUserIndex || 0}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <div className="flex flex-col">
                <span className="text-xs text-emerald-600">התאמות</span>
                <span className="font-bold text-emerald-800">
                  {scanProgress.matchesFoundSoFar || scanProgress.stats?.matchesFoundSoFar || 0}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 border border-purple-100">
              <Target className="w-4 h-4 text-purple-600" />
              <div className="flex flex-col">
                <span className="text-xs text-purple-600">חדשות</span>
                <span className="font-bold text-purple-800">
                  {scanProgress.newMatchesFoundSoFar || 0}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </Card>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // Render: Buttons (בדיוק כמו ב-SplitView)
  // ═══════════════════════════════════════════════════════════

  return (
    <Card className={cn('p-4', className)}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg">
            <Moon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">סריקה לילית</h3>
            <p className="text-sm text-gray-500">סרוק את כל המשתמשים</p>
          </div>
        </div>

        {/* Buttons Row - בדיוק כמו ב-SplitView */}
        <div className="flex gap-2 flex-wrap">
          {METHODS_ORDER.map((method) => {
            const config = METHOD_CONFIG[method];
            const Icon = config.icon;
            
            return (
              <motion.div
                key={method}
                className="flex-1 min-w-[120px]"
                whileHover={{ scale: 1.02 }}
              >
                <Button
                  onClick={() => onStartScan(method)}
                  className={cn(
                    'w-full h-11 font-bold transition-all duration-300 shadow-lg px-2 sm:px-4',
                    `bg-gradient-to-r ${config.gradient} ${config.hoverGradient} text-white`
                  )}
                >
                  <Icon className="w-5 h-5 ml-1.5 flex-shrink-0" />
                  <span className="truncate text-xs sm:text-sm">
                    {config.label}
                  </span>
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* Time estimates - בדיוק כמו ב-SplitView */}
        <div className="flex gap-2 text-xs text-gray-500 mt-1">
          {METHODS_ORDER.map((method) => (
            <span key={method} className="flex-1 text-center truncate min-w-[120px]">
              {METHOD_CONFIG[method].time}
            </span>
          ))}
        </div>

        {/* Completion Banner */}
        <AnimatePresence>
          {scanResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 mt-2"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-emerald-800">
                  הסריקה הושלמה!
                </span>
              </div>
              <p className="text-sm text-emerald-700 mt-1">
                נמצאו {scanResult.matchesFound || scanResult.totalMatchesFound || 0} התאמות
                {' '}({scanResult.newMatches || scanResult.newMatchesFound || 0} חדשות)
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Last Scan Info */}
        {lastScanInfo && !scanResult && (
          <div className="flex items-center gap-2 text-sm text-gray-500 pt-2 border-t">
            <Clock className="w-4 h-4" />
            <span>
              סריקה אחרונה: {formatDate(lastScanInfo.date)} 
              ({lastScanInfo.matchCount} התאמות)
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default BatchScanButtons;