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
}) => {
  return (
    <div className="border-b border-gray-200 px-3 sm:px-5 pt-3 pb-2 bg-white sticky top-0 z-20">
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
                'text-xs font-semibold px-2.5 py-0.5 rounded-full border',
                statusBadgeClass || 'bg-gray-100 text-gray-600 border-gray-200'
              )}
            >
              {statusLabel}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Tab pills */}
        <TabsList className="flex-1 flex bg-gray-100 rounded-xl p-1 h-12 border border-gray-200/60">
          <TabsTrigger
            value="presentation"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg text-xs sm:text-sm transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">{dict.presentation}</span>
            <span className="sm:hidden">{dict.presentationShort}</span>
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg text-xs sm:text-sm transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">{dict.profile}</span>
            <span className="sm:hidden">{dict.profileShort}</span>
          </TabsTrigger>
          <TabsTrigger
            value="compatibility"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg text-xs sm:text-sm transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <GitCompareArrows className="w-4 h-4" />
            <span className="hidden sm:inline">{dict.compatibility}</span>
            <span className="sm:hidden">{dict.compatibilityShort}</span>
          </TabsTrigger>
          <TabsTrigger
            value="details"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg text-xs sm:text-sm transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">{dict.details}</span>
            <span className="sm:hidden">{dict.detailsShort}</span>
          </TabsTrigger>
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
                    className="rounded-full h-9 w-9 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
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
            className="rounded-full h-9 w-9 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-4.5 h-4.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TabHeader;
