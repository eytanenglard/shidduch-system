'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ThemeType } from '../../constants/theme';
import { BRAND } from '../../constants/theme';
import type { ProfileCardDisplayDict } from '@/types/dictionary';

interface TabNavigationButtonsProps {
  activeTab: string;
  tabItems: {
    value: string;
    label: string;
    shortLabel?: string;
    icon: React.ElementType;
  }[];
  onTabChange: (newTab: string) => void;
  THEME: ThemeType;
  dict: ProfileCardDisplayDict['mobileNav'];
  direction: 'ltr' | 'rtl';
}

const TabNavigationButtons: React.FC<TabNavigationButtonsProps> = ({
  activeTab,
  tabItems,
  onTabChange,
  THEME,
  dict,
  direction,
}) => {
  const currentIndex = useMemo(
    () => tabItems.findIndex((tab) => tab.value === activeTab),
    [tabItems, activeTab]
  );
  const prevTab = currentIndex > 0 ? tabItems[currentIndex - 1] : null;
  const nextTab =
    currentIndex < tabItems.length - 1 ? tabItems[currentIndex + 1] : null;

  if (!prevTab && !nextTab) return null;

  const PrevIcon = direction === 'rtl' ? ChevronRight : ChevronLeft;
  const NextIcon = direction === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <div
      className={cn(
        'mt-6 pt-4 border-t border-gray-100 flex gap-3',
        direction === 'rtl' && 'flex-row-reverse'
      )}
    >
      {prevTab ? (
        <button
          onClick={() => onTabChange(prevTab.value)}
          className="flex-1 flex items-center gap-2 p-3 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-start min-h-[44px]"
        >
          <PrevIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-400">{dict.previous}</p>
            <p className="text-sm font-medium break-words">{prevTab.label}</p>
          </div>
        </button>
      ) : (
        <div className="flex-1" />
      )}
      {nextTab ? (
        <button
          onClick={() => onTabChange(nextTab.value)}
          className={cn(
            'flex-1 flex items-center justify-end gap-2 p-3 rounded-lg text-white transition-all text-end min-h-[44px] shadow-sm hover:shadow-md',
            BRAND.primaryBg,
            BRAND.primaryBgHover
          )}
        >
          <div>
            <p className="text-xs text-white/80">{dict.next}</p>
            <p className="text-sm font-medium break-words">{nextTab.label}</p>
          </div>
          <NextIcon className="w-4 h-4 flex-shrink-0" />
        </button>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
};

export default TabNavigationButtons;
