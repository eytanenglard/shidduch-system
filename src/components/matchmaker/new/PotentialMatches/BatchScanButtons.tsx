// src/components/matchmaker/new/PotentialMatches/BatchScanButtons.tsx

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Moon,
  Brain,
  Zap,
  Users,
  Target,
  Loader2,
  X,
  CheckCircle2,
  Clock,
  Rocket,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  // 👇 Added this property based on your usage in the component
  preparationStats?: {
    currentIndex: number;
    totalNeedingUpdate: number;
    currentUserName?: string;
    updated: number;
    skipped?: number;
    failed: number;
    aiCallsMade?: number;
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
  onStartScan: (method: ScanMethod, skipPreparation: boolean) => void;
  onCancelScan: () => void;
  lastScanInfo?: {
    date: Date;
    matchCount: number;
  } | null;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════
// Method Configurations
// ═══════════════════════════════════════════════════════════════

const METHOD_CONFIG: Record<ScanMethod, {
  label: string;
  icon: typeof Brain;
  gradient: string;
  hoverGradient: string;
  time: string;
  fastTime: string; // זמן משוער במצב מהיר
}> = {
  algorithmic: {
    label: 'AI מתקדם',
    icon: Brain,
    gradient: 'from-purple-500 to-purple-600',
    hoverGradient: 'hover:from-purple-600 hover:to-purple-700',
    time: '~5 דק',
    fastTime: '~2 דק',
  },
  vector: {
    label: 'דמיון מהיר ⚡',
    icon: Zap,
    gradient: 'from-blue-500 to-cyan-500',
    hoverGradient: 'hover:from-blue-600 hover:to-cyan-600',
    time: '~1 דק',
    fastTime: '~20 שנ',
  },
  hybrid: {
    label: 'היברידי 🔥',
    icon: Users,
    gradient: 'from-emerald-500 to-teal-500',
    hoverGradient: 'hover:from-emerald-600 hover:to-teal-600',
    time: '~3 דק',
    fastTime: '~1 דק',
  },
  metrics_v2: {
    label: 'מדדים V2 🎯',
    icon: Target,
    gradient: 'from-indigo-500 to-violet-500',
    hoverGradient: 'hover:from-indigo-600 hover:to-violet-600',
    time: '~4 דק',
    fastTime: '~1.5 דק',
  },
};

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
  const [skipPreparation, setSkipPreparation] = useState(false);
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
  // Render: Progress State
  // ═══════════════════════════════════════════════════════════

  if (isScanning && scanProgress) {
    const config = METHOD_CONFIG[currentMethod || 'hybrid'];
    // const Icon = config.icon; // Removed unused variable

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
               {scanProgress.phase === 'preparing' && scanProgress.preparationStats && (
  <div className="space-y-2 mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
    <div className="flex items-center gap-2 text-amber-700">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="font-medium text-sm">
        מכין נתונים ({scanProgress.preparationStats.currentIndex}/{scanProgress.preparationStats.totalNeedingUpdate})
      </span>
    </div>
    
    {scanProgress.preparationStats.currentUserName && (
      <p className="text-xs text-amber-600">
        מעדכן: {scanProgress.preparationStats.currentUserName}
      </p>
    )}
    
    {/* 🆕 Progress breakdown */}
    <div className="grid grid-cols-4 gap-2 text-xs">
      <div className="text-center p-1.5 bg-emerald-100 rounded">
        <div className="font-bold text-emerald-700">{scanProgress.preparationStats.updated}</div>
        <div className="text-emerald-600">עודכנו</div>
      </div>
      <div className="text-center p-1.5 bg-blue-100 rounded">
        <div className="font-bold text-blue-700">{scanProgress.preparationStats.skipped || 0}</div>
        <div className="text-blue-600">דולגו</div>
      </div>
      <div className="text-center p-1.5 bg-red-100 rounded">
        <div className="font-bold text-red-700">{scanProgress.preparationStats.failed}</div>
        <div className="text-red-600">נכשלו</div>
      </div>
      <div className="text-center p-1.5 bg-purple-100 rounded">
        <div className="font-bold text-purple-700">{scanProgress.preparationStats.aiCallsMade || 0}</div>
        <div className="text-purple-600">קריאות AI</div>
      </div>
    </div>
  </div>
)}

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
  // Render: Buttons
  // ═══════════════════════════════════════════════════════════

  return (
    <Card className={cn('p-4', className)}>
      <div className="space-y-4">
        {/* Header & Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg">
              <Moon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">סריקה לילית</h3>
              <p className="text-xs text-gray-500">
                {skipPreparation ? 'מצב מהיר פעיל' : 'מצב רגיל (כולל עדכון נתונים)'}
              </p>
            </div>
          </div>

          {/* Quick Scan Toggle */}
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
            <Checkbox 
              id="skip-prep" 
              checked={skipPreparation}
              onCheckedChange={(checked) => setSkipPreparation(checked as boolean)}
              className={cn(
                "data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500",
                "w-5 h-5"
              )}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Label 
                    htmlFor="skip-prep" 
                    className="text-xs font-medium cursor-pointer flex items-center gap-1.5"
                  >
                    <Rocket className={cn("w-3.5 h-3.5", skipPreparation ? "text-orange-500" : "text-gray-400")} />
                    סריקה מהירה
                  </Label>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">
                    מדלג על עדכון מדדים ונתוני AI למועמדים (חוסך זמן משמעותי, אך הנתונים עשויים להיות פחות עדכניים)
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex gap-2 flex-wrap">
          {METHODS_ORDER.map((method) => {
            const config = METHOD_CONFIG[method];
            const Icon = config.icon;
            
            return (
              <motion.div
                key={method}
                className="flex-1 min-w-[120px]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => onStartScan(method, skipPreparation)}
                  className={cn(
                    'w-full h-11 font-bold transition-all duration-300 shadow-lg px-2 sm:px-4 flex-col gap-0',
                    `bg-gradient-to-r ${config.gradient} ${config.hoverGradient} text-white`,
                    skipPreparation && "ring-2 ring-orange-400 ring-offset-1"
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-4 h-4" />
                    <span className="truncate text-xs sm:text-sm">
                      {config.label}
                    </span>
                  </div>
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* Time estimates */}
        <div className="flex gap-2 text-[10px] text-gray-400 px-1">
          {METHODS_ORDER.map((method) => (
            <span key={method} className="flex-1 text-center truncate min-w-[120px]">
              {skipPreparation ? METHOD_CONFIG[method].fastTime : METHOD_CONFIG[method].time}
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
          <div className="flex items-center gap-2 text-xs text-gray-400 pt-3 border-t">
            <Clock className="w-3.5 h-3.5" />
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