'use client';

import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sparkles,
  User,
  GitCompareArrows,
  MessageCircle,
  X,
  Maximize,
  Minimize,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TabHeaderProps } from '../types/modal.types';

const TAB_CONFIG = [
  { value: 'presentation', Icon: Sparkles, labelKey: 'presentation', shortKey: 'presentationShort' },
  { value: 'profile', Icon: User, labelKey: 'profile', shortKey: 'profileShort' },
  { value: 'compatibility', Icon: GitCompareArrows, labelKey: 'compatibility', shortKey: 'compatibilityShort' },
  { value: 'details', Icon: MessageCircle, labelKey: 'details', shortKey: 'detailsShort' },
] as const;

const TabHeader: React.FC<TabHeaderProps> = ({
  onClose,
  isFullscreen,
  onToggleFullscreen,
  isMobile,
  isTransitioning = false,
  dict,
  personName,
  personAge,
  statusLabel,
  statusBadgeClass,
  visitedTabs,
}) => {
  return (
    <div className="px-3 sm:px-5 pt-3 pb-2.5 bg-white/80 backdrop-blur-2xl border-b border-gray-200/50 sticky top-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Person identity row */}
      {personName && (
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-bold text-gray-800 truncate">
              {personName}
              {personAge ? ` (${personAge})` : ''}
            </span>
          </div>
          {statusLabel && (
            <span
              className={cn(
                'text-xs font-semibold px-2.5 py-0.5 rounded-full border backdrop-blur-sm',
                statusBadgeClass || 'bg-gray-100/80 text-gray-600 border-gray-200/50'
              )}
            >
              {statusLabel}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Glass tab pills — Apple-style segmented control */}
        <TabsList className="flex-1 flex bg-gray-950/[0.04] rounded-[14px] p-[3px] h-11 ring-1 ring-inset ring-gray-950/[0.06] backdrop-blur-sm">
          {TAB_CONFIG.map(({ value, Icon, labelKey, shortKey }) => {
            const hasNotification = visitedTabs && !visitedTabs.has(value) && value !== 'presentation';
            return (
              <TabsTrigger
                key={value}
                value={value}
                className={cn(
                  'relative flex-1 flex items-center justify-center gap-1.5 rounded-[11px] text-xs sm:text-sm',
                  'transition-all duration-300 ease-out',
                  'font-medium text-gray-500/90 hover:text-gray-700',
                  // Active state — clean white pill with Apple-style shadow
                  'data-[state=active]:bg-white',
                  'data-[state=active]:text-gray-900',
                  'data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)]',
                  'data-[state=active]:ring-1 data-[state=active]:ring-black/[0.04]',
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{dict[labelKey as keyof typeof dict]}</span>
                <span className="sm:hidden">{dict[shortKey as keyof typeof dict]}</span>
                {hasNotification && (
                  <span className="absolute top-1 end-1.5 w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Controls */}
        <div className="flex items-center gap-1">
          {!isMobile && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleFullscreen}
                    className="rounded-full h-9 w-9 text-gray-400 hover:text-gray-600 hover:bg-gray-100/60 backdrop-blur-sm"
                    disabled={isTransitioning}
                  >
                    {isFullscreen ? (
                      <Minimize className="w-4.5 h-4.5" />
                    ) : (
                      <Maximize className="w-4.5 h-4.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{isFullscreen ? dict.exitFullscreen : dict.fullscreen}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full h-9 w-9 text-gray-400 hover:text-gray-600 hover:bg-gray-100/60 backdrop-blur-sm"
          >
            <X className="w-4.5 h-4.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TabHeader;
