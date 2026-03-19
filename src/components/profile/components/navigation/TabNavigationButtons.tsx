'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ThemeType } from '../../constants/theme';
import type { ProfileCardDisplayDict } from '@/types/dictionary';

interface TabNavigationButtonsProps {
  activeTab: string;
  tabItems: {
    value: string;
    label: string;
    shortLabel?: string;
    icon: React.ElementType;
    gradient: string;
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

  const prevTab = useMemo(
    () => (currentIndex > 0 ? tabItems[currentIndex - 1] : null),
    [tabItems, currentIndex]
  );
  const nextTab = useMemo(
    () =>
      currentIndex < tabItems.length - 1 ? tabItems[currentIndex + 1] : null,
    [tabItems, currentIndex]
  );

  if (!prevTab && !nextTab) {
    return null;
  }

  const baseButtonClasses =
    'flex-1 flex flex-col p-4 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

  const PrevIcon = direction === 'rtl' ? ChevronRight : ChevronLeft;
  const NextIcon = direction === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <div
      className={cn(
        'mt-8 pt-6 border-t border-gray-200/80 flex items-stretch justify-between gap-3 sm:gap-4 w-full',
        direction === 'rtl' && 'flex-row-reverse'
      )}
    >
      {' '}
      {prevTab ? (
        <button
          className={cn(
            baseButtonClasses,
            'items-start text-start',
            'bg-white border border-gray-200/80 hover:border-gray-300',
            'focus-visible:ring-gray-400'
          )}
          onClick={() => onTabChange(prevTab.value)}
        >
          <div className="flex items-center gap-2">
            <PrevIcon className="w-6 h-6 text-gray-400 flex-shrink-0" />
            <p className="text-xs font-medium text-gray-500">{dict.previous}</p>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <prevTab.icon className="w-5 h-5 text-gray-600 flex-shrink-0" />
            <span className="text-base font-bold text-gray-800 text-start break-words min-w-0">
              {prevTab.label}
            </span>
          </div>
        </button>
      ) : (
        <div className="flex-1" />
      )}
      {nextTab ? (
        <button
          className={cn(
            baseButtonClasses,
            'items-end text-end',
            `bg-gradient-to-r ${THEME.colors.primary.main} hover:${THEME.colors.primary.accent}`,
            'text-white',
            'focus-visible:ring-rose-500' // TODO: Make this dynamic
          )}
          onClick={() => onTabChange(nextTab.value)}
        >
          <div className="flex items-center gap-2 justify-end">
            <p className="text-xs font-medium text-white/90">{dict.next}</p>
            <NextIcon className="w-6 h-6 text-white flex-shrink-0" />
          </div>
          <div className="flex items-center justify-end gap-2 mt-1.5">
            <span className="text-base font-bold text-white text-end break-words min-w-0">
              {nextTab.label}
            </span>
            <nextTab.icon className="w-5 h-5 text-white flex-shrink-0" />
          </div>
        </button>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
};

export default TabNavigationButtons;
