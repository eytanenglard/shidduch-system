// src/components/matchmaker/inbox/AlertsBanner.tsx
// =============================================================================
// Phase 8: Smart Alerts Banner
// Displays MatchmakerAlert items at the top of the inbox as a collapsible banner.
// =============================================================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Bell,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertTriangle,
  UserPlus,
  X,
  XCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

type MatchmakerAlertType = 'NO_RESPONSE' | 'STALE_SUGGESTION' | 'NEW_REGISTRATION';

interface MatchmakerAlert {
  id: string;
  matchmakerId: string;
  alertType: MatchmakerAlertType;
  userId: string | null;
  suggestionId: string | null;
  message: string;
  isDismissed: boolean;
  createdAt: string;
}

interface AlertsBannerProps {
  isHe: boolean;
}

// =============================================================================
// Dictionary
// =============================================================================

const dict = {
  he: {
    title: 'התראות חכמות',
    noAlerts: 'אין התראות חדשות',
    dismissAll: 'סמן הכל כנקרא',
    dismiss: 'סגור',
    alertTypes: {
      NO_RESPONSE: 'ללא מענה',
      STALE_SUGGESTION: 'הצעה תקועה',
      NEW_REGISTRATION: 'רישום חדש',
    } as Record<MatchmakerAlertType, string>,
    timeAgo: (days: number) => {
      if (days === 0) return 'היום';
      if (days === 1) return 'אתמול';
      return `לפני ${days} ימים`;
    },
  },
  en: {
    title: 'Smart Alerts',
    noAlerts: 'No new alerts',
    dismissAll: 'Dismiss all',
    dismiss: 'Dismiss',
    alertTypes: {
      NO_RESPONSE: 'No response',
      STALE_SUGGESTION: 'Stale suggestion',
      NEW_REGISTRATION: 'New registration',
    } as Record<MatchmakerAlertType, string>,
    timeAgo: (days: number) => {
      if (days === 0) return 'Today';
      if (days === 1) return 'Yesterday';
      return `${days} days ago`;
    },
  },
};

// =============================================================================
// Alert config per type
// =============================================================================

const ALERT_CONFIG: Record<
  MatchmakerAlertType,
  {
    icon: React.ElementType;
    bgColor: string;
    borderColor: string;
    textColor: string;
    badgeColor: string;
  }
> = {
  NO_RESPONSE: {
    icon: Clock,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  STALE_SUGGESTION: {
    icon: AlertTriangle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    badgeColor: 'bg-red-100 text-red-800 border-red-200',
  },
  NEW_REGISTRATION: {
    icon: UserPlus,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    badgeColor: 'bg-green-100 text-green-800 border-green-200',
  },
};

// =============================================================================
// Helpers
// =============================================================================

function daysAgo(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

// =============================================================================
// Component
// =============================================================================

export default function AlertsBanner({ isHe }: AlertsBannerProps) {
  const [alerts, setAlerts] = useState<MatchmakerAlert[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [isDismissingAll, setIsDismissingAll] = useState(false);

  const t = isHe ? dict.he : dict.en;

  // ── Fetch alerts ──
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/matchmaker/smart-alerts?limit=50');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching smart alerts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    // Poll every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // ── Dismiss single alert ──
  const handleDismiss = async (alertId: string) => {
    setDismissingId(alertId);
    try {
      const res = await fetch('/api/matchmaker/smart-alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      });
      if (res.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      }
    } catch (error) {
      console.error('Error dismissing alert:', error);
    } finally {
      setDismissingId(null);
    }
  };

  // ── Dismiss all alerts ──
  const handleDismissAll = async () => {
    setIsDismissingAll(true);
    try {
      const res = await fetch('/api/matchmaker/smart-alerts', {
        method: 'DELETE',
      });
      if (res.ok) {
        setAlerts([]);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error dismissing all alerts:', error);
    } finally {
      setIsDismissingAll(false);
    }
  };

  // Don't render anything if there are no alerts and not loading
  if (!isLoading && alerts.length === 0) return null;

  // Loading state — small placeholder
  if (isLoading) {
    return (
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      {/* ── Collapsed header / trigger ── */}
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            'w-full px-4 py-2.5 flex items-center justify-between',
            'bg-gradient-to-r from-amber-50/80 to-red-50/60',
            'border-b border-amber-100/60',
            'hover:from-amber-50 hover:to-red-50/80 transition-colors',
            'cursor-pointer'
          )}
        >
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-amber-100">
              <Bell className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {t.title}
            </span>
            <Badge
              className={cn(
                'px-2 py-0 text-xs font-semibold border-0',
                alerts.length > 0
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              )}
            >
              {alerts.length}
            </Badge>
          </div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </CollapsibleTrigger>

      {/* ── Expanded content ── */}
      <CollapsibleContent>
        <div className="border-b border-amber-100/60 bg-white/80">
          {/* Dismiss all button */}
          {alerts.length > 1 && (
            <div
              className={cn(
                'px-4 py-1.5 flex border-b border-gray-100',
                isHe ? 'justify-start' : 'justify-end'
              )}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismissAll}
                disabled={isDismissingAll}
                className="text-xs text-gray-500 hover:text-gray-700 h-7 px-2"
              >
                {isDismissingAll ? (
                  <Loader2 className="w-3 h-3 animate-spin me-1" />
                ) : (
                  <XCircle className="w-3 h-3 me-1" />
                )}
                {t.dismissAll}
              </Button>
            </div>
          )}

          {/* Alert items */}
          <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
            {alerts.map((alert) => {
              const config = ALERT_CONFIG[alert.alertType];
              const Icon = config.icon;
              const days = daysAgo(alert.createdAt);

              return (
                <div
                  key={alert.id}
                  className={cn(
                    'px-4 py-2.5 flex items-start gap-3',
                    'hover:bg-gray-50/50 transition-colors',
                    config.bgColor + '/30'
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'mt-0.5 p-1.5 rounded-lg flex-shrink-0',
                      config.bgColor
                    )}
                  >
                    <Icon className={cn('w-3.5 h-3.5', config.textColor)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] px-1.5 py-0', config.badgeColor)}
                      >
                        {t.alertTypes[alert.alertType]}
                      </Badge>
                      <span className="text-[10px] text-gray-400">
                        {t.timeAgo(days)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed truncate">
                      {alert.message}
                    </p>
                  </div>

                  {/* Dismiss button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismiss(alert.id);
                    }}
                    disabled={dismissingId === alert.id}
                    className="flex-shrink-0 h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                    title={t.dismiss}
                  >
                    {dismissingId === alert.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <X className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
