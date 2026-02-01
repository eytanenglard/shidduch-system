// src/components/matchmaker/new/PotentialMatches/AllReasoningsDisplay.tsx

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Brain,
  Sparkles,
  Clock,
  CheckCircle2,
  ChevronDown,
  BarChart3,
} from 'lucide-react';
import type { PotentialMatch, ScoreBreakdown } from './types/potentialMatches';

// =============================================================================
// TYPES
// =============================================================================

interface ScanMethodInfo {
  key: string;
  label: string;
  icon: string;
  description: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  score: number | null;
  reasoning: string | null;
  scannedAt: Date | null;
  scoreBreakdown: ScoreBreakdown | null;
}

interface AllReasoningsDisplayProps {
  match: PotentialMatch;
  isOpen: boolean;
  onClose: () => void;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const getScoreColor = (score: number): string => {
  if (score >= 85) return 'text-emerald-600';
  if (score >= 75) return 'text-blue-600';
  if (score >= 70) return 'text-amber-600';
  return 'text-gray-600';
};

const getScanMethods = (match: PotentialMatch): ScanMethodInfo[] => {
  const methods: ScanMethodInfo[] = [
    {
      key: 'hybrid',
      label: 'היברידי',
      icon: '🔥',
      description: 'סריקה היברידית (4 שלבים) - הכי מקיף',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200',
      score: match.hybridScore ?? null,
      reasoning: match.hybridReasoning ?? null,
      scannedAt: match.hybridScannedAt ?? null,
      scoreBreakdown: match.hybridScoreBreakdown ?? null,
    },
    {
      key: 'algorithmic',
      label: 'AI מתקדם',
      icon: '🧠',
      description: 'ניתוח AI מעמיק עם הבנת הקשר',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200',
      score: match.algorithmicScore ?? null,
      reasoning: match.algorithmicReasoning ?? null,
      scannedAt: match.algorithmicScannedAt ?? null,
      scoreBreakdown: match.algorithmicScoreBreakdown ?? null,
    },
    {
      key: 'vector',
      label: 'סריקה מהירה',
      icon: '⚡',
      description: 'סריקה וקטורית מהירה לפי דמיון טקסטואלי',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      score: match.vectorScore ?? null,
      reasoning: match.vectorReasoning ?? null,
      scannedAt: match.vectorScannedAt ?? null,
      scoreBreakdown: null, // וקטורי אין לו breakdown
    },
    {
      key: 'metricsV2',
      label: 'מטריקות V2',
      icon: '🎯',
      description: 'ניתוח לפי מדדים מספריים מדויקים',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      borderColor: 'border-indigo-200',
      score: match.metricsV2Score ?? null,
      reasoning: match.metricsV2Reasoning ?? null,
      scannedAt: match.metricsV2ScannedAt ?? null,
      scoreBreakdown: match.metricsV2ScoreBreakdown ?? null,
    },
  ];

  // מסנן רק שיטות שיש להן ציון או נימוק
  return methods.filter(m => m.score !== null || m.reasoning);
};

// =============================================================================
// SCORE BREAKDOWN COMPONENT - משופר
// =============================================================================

const ScoreBreakdownDisplay: React.FC<{ 
  breakdown: ScoreBreakdown;
  methodKey?: string;
}> = ({ breakdown, methodKey }) => {
  const categories = [
    { key: 'religious', label: 'התאמה דתית', max: 25, color: 'bg-purple-500' },
    { key: 'ageCompatibility', label: 'התאמת גיל', max: 10, color: 'bg-blue-500' },
    { key: 'careerFamily', label: 'קריירה-משפחה', max: 15, color: 'bg-cyan-500' },
    { key: 'lifestyle', label: 'סגנון חיים', max: 10, color: 'bg-green-500' },
    { key: 'socioEconomic', label: 'סוציו-אקונומי', max: 10, color: 'bg-orange-500' },
    { key: 'education', label: 'השכלה', max: 10, color: 'bg-pink-500' },
    { key: 'background', label: 'רקע תרבותי', max: 10, color: 'bg-amber-500' },
    { key: 'values', label: 'ערכים ותקשורת', max: 10, color: 'bg-indigo-500' },
  ];

  // מסנן קטגוריות שיש להן ערך
  const availableCategories = categories.filter(
    cat => breakdown[cat.key as keyof ScoreBreakdown] !== undefined && 
           breakdown[cat.key as keyof ScoreBreakdown] !== null
  );

  if (availableCategories.length === 0) {
    return (
      <div className="text-center py-3 text-sm text-gray-400 italic">
        אין פירוט ניקוד זמין לשיטה זו
      </div>
    );
  }

  // חישוב סה"כ
  const totalScore = availableCategories.reduce(
    (sum, cat) => sum + (breakdown[cat.key as keyof ScoreBreakdown] || 0),
    0
  );
  const maxTotal = availableCategories.reduce((sum, cat) => sum + cat.max, 0);

  return (
    <div className="space-y-3 mt-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h5 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-500" />
          פירוט הניקוד
        </h5>
        <Badge variant="outline" className="text-xs">
          סה״כ: {totalScore}/{maxTotal}
        </Badge>
      </div>
      
      <div className="space-y-2.5">
        {availableCategories.map((cat) => {
          const value = breakdown[cat.key as keyof ScoreBreakdown] || 0;
          const percentage = (value / cat.max) * 100;

          return (
            <div key={cat.key} className="group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600 font-medium">{cat.label}</span>
                <span className="text-xs text-gray-500 font-semibold">
                  {value}/{cat.max}
                </span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                  className={cn(
                    'h-full rounded-full transition-all',
                    cat.color,
                    'group-hover:opacity-90'
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// REASONING CONTENT COMPONENT
// =============================================================================

const ReasoningContent: React.FC<{ reasoning: string | null }> = ({ reasoning }) => {
  if (!reasoning) {
    return (
      <p className="text-sm text-gray-400 italic text-center py-4">
        אין נימוק זמין לשיטה זו
      </p>
    );
  }

  const paragraphs = reasoning.split(/\n\n+/).filter(p => p.trim());

  return (
    <div className="space-y-2">
      {paragraphs.map((para, index) => {
        const isList = para.includes('\n- ') || para.includes('\n• ') || para.includes('\n* ');
        
        if (isList) {
          const lines = para.split('\n').filter(l => l.trim());
          return (
            <ul key={index} className="space-y-1.5 my-2">
              {lines.map((line, i) => {
                const cleanLine = line.replace(/^[*\-•]\s*/, '').trim();
                if (!cleanLine) return null;
                return (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-purple-400 mt-1">•</span>
                    <span className="leading-relaxed">{cleanLine}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        return (
          <p key={index} className="text-sm text-gray-700 leading-relaxed">
            {para.trim()}
          </p>
        );
      })}
    </div>
  );
};

// =============================================================================
// SINGLE METHOD TAB CONTENT - משופר
// =============================================================================

const MethodTabContent: React.FC<{ 
  method: ScanMethodInfo; 
  isCurrentMethod: boolean;
}> = ({ method, isCurrentMethod }) => {
  
  // Debug log לבדיקה
  console.log(`[MethodTabContent] ${method.key}:`, {
    score: method.score,
    hasReasoning: !!method.reasoning,
    hasBreakdown: !!method.scoreBreakdown,
    breakdown: method.scoreBreakdown
  });

  return (
    <div className="space-y-4">
      {/* Header with score and time */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{method.icon}</span>
          <div>
            <h4 className="font-bold text-gray-800">{method.label}</h4>
            <p className="text-xs text-gray-500">{method.description}</p>
          </div>
        </div>
        
        <div className="text-left">
          {method.score !== null && (
            <div className={cn('text-2xl font-bold', getScoreColor(method.score))}>
              {Math.round(method.score)}
            </div>
          )}
          {method.scannedAt && (
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(method.scannedAt), {
                addSuffix: true,
                locale: he,
              })}
            </div>
          )}
        </div>
      </div>

      {/* Current method badge */}
      {isCurrentMethod && (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
          <CheckCircle2 className="w-3 h-3 ml-1" />
          השיטה הנוכחית (הציון המוצג)
        </Badge>
      )}

      {/* Reasoning */}
      <div className={cn(
        'p-4 rounded-xl border',
        method.bgColor,
        method.borderColor
      )}>
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">נימוק ההתאמה</span>
        </div>
        <ReasoningContent reasoning={method.reasoning} />
      </div>

      {/* Score Breakdown - תמיד מוצג אם קיים */}
      {method.scoreBreakdown && Object.keys(method.scoreBreakdown).length > 0 ? (
        <ScoreBreakdownDisplay 
          breakdown={method.scoreBreakdown} 
          methodKey={method.key}
        />
      ) : (
        method.key !== 'vector' && ( // וקטורי לא אמור להיות לו breakdown
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              פירוט ניקוד לא זמין לשיטה זו
            </p>
          </div>
        )
      )}
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const AllReasoningsDisplay: React.FC<AllReasoningsDisplayProps> = ({
  match,
  isOpen,
  onClose,
}) => {
  const methods = getScanMethods(match);
  
  // קובע את הטאב הפעיל לפי השיטה האחרונה או הראשונה בזמינות
  const getInitialTab = () => {
    if (match.lastScanMethod) {
      // המרה מ-metrics_v2 ל-metricsV2 אם צריך
      const normalizedMethod = match.lastScanMethod === 'metrics_v2' 
        ? 'metricsV2' 
        : match.lastScanMethod;
      
      if (methods.some(m => m.key === normalizedMethod)) {
        return normalizedMethod;
      }
    }
    return methods[0]?.key || 'hybrid';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());

  // Debug log
  console.log('[AllReasoningsDisplay] Match data:', {
    id: match.id,
    lastScanMethod: match.lastScanMethod,
    metricsV2Score: match.metricsV2Score,
    metricsV2ScoreBreakdown: match.metricsV2ScoreBreakdown,
    methods: methods.map(m => ({ key: m.key, hasBreakdown: !!m.scoreBreakdown }))
  });

  if (methods.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]" dir="rtl">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500">
              <Brain className="w-5 h-5 text-white" />
            </div>
            ניתוחי AI לכל שיטות הסריקה
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            צפה בנימוקים, ציונים ופירוט מכל שיטת סריקה שהורצה
          </p>
        </DialogHeader>

        <div className="py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
            {/* Tab List */}
            <TabsList 
              className="grid w-full mb-4" 
              style={{ gridTemplateColumns: `repeat(${methods.length}, 1fr)` }}
            >
              {methods.map((method) => {
                const isCurrentMethod = 
                  method.key === match.lastScanMethod ||
                  (method.key === 'metricsV2' && match.lastScanMethod === 'metrics_v2');
                
                return (
                  <TabsTrigger
                    key={method.key}
                    value={method.key}
                    className={cn(
                      'flex items-center gap-1.5 text-xs',
                      isCurrentMethod && 'ring-2 ring-emerald-400 ring-offset-1'
                    )}
                  >
                    <span>{method.icon}</span>
                    <span className="hidden sm:inline">{method.label}</span>
                    {method.score !== null && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                        {Math.round(method.score)}
                      </Badge>
                    )}
                    {/* אינדיקטור לפירוט ניקוד */}
                    {method.scoreBreakdown && (
                      <BarChart3 className="w-3 h-3 text-indigo-400" />
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Tab Contents */}
            <div className="max-h-[50vh] overflow-y-auto">
              {methods.map((method) => {
                const isCurrentMethod = 
                  method.key === match.lastScanMethod ||
                  (method.key === 'metricsV2' && match.lastScanMethod === 'metrics_v2');
                
                return (
                  <TabsContent key={method.key} value={method.key} className="mt-0">
                    <MethodTabContent
                      method={method}
                      isCurrentMethod={isCurrentMethod}
                    />
                  </TabsContent>
                );
              })}
            </div>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t flex justify-between items-center">
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <span>{methods.length} שיטות סריקה זמינות</span>
            {methods.some(m => m.scoreBreakdown) && (
              <Badge variant="outline" className="text-[10px]">
                <BarChart3 className="w-3 h-3 ml-1" />
                כולל פירוט ניקוד
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            סגור
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AllReasoningsDisplay;