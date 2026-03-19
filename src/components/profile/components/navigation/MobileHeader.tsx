'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { ProfileCardDisplayDict } from '@/types/dictionary';

interface MobileHeaderProps {
  direction: 'ltr' | 'rtl';
  displayDict: ProfileCardDisplayDict;
  mobileViewLayout: 'focus' | 'detailed';
  setMobileViewLayout: (value: 'focus' | 'detailed') => void;
  handleClose: () => void;
  // Legacy props (accepted but ignored)
  THEME?: unknown;
  selectedPalette?: unknown;
  setSelectedPalette?: unknown;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  direction,
  displayDict,
  mobileViewLayout,
  setMobileViewLayout,
  handleClose,
}) => (
  <div
    className={cn(
      'flex-shrink-0 flex justify-between items-center',
      'border-b border-gray-200 sticky top-0 z-30',
      'bg-white/95 backdrop-blur-md px-3 py-2 min-h-[52px]'
    )}
    dir={direction}
  >
    <Button
      variant="ghost"
      size="icon"
      className="w-9 h-9 min-h-[44px] min-w-[44px] rounded-full text-gray-500 hover:text-gray-700 touch-manipulation"
      onClick={handleClose}
      aria-label={displayDict.mobileNav.closePreview}
    >
      <X className="w-5 h-5" />
    </Button>
    <ToggleGroup
      type="single"
      value={mobileViewLayout}
      onValueChange={(value: 'focus' | 'detailed') => {
        if (value) setMobileViewLayout(value);
      }}
      className="bg-gray-100 rounded-lg p-0.5"
    >
      <ToggleGroupItem
        value="focus"
        aria-label={displayDict.mobileNav.introView}
        className="rounded-md px-3 py-1.5 text-xs font-medium data-[state=on]:bg-white data-[state=on]:shadow-sm min-h-[36px] touch-manipulation"
      >
        {displayDict.mobileNav.introView}
      </ToggleGroupItem>
      <ToggleGroupItem
        value="detailed"
        aria-label={displayDict.mobileNav.detailedView}
        className="rounded-md px-3 py-1.5 text-xs font-medium data-[state=on]:bg-white data-[state=on]:shadow-sm min-h-[36px] touch-manipulation"
      >
        {displayDict.mobileNav.detailedView}
      </ToggleGroupItem>
    </ToggleGroup>
    <div className="w-9" />
  </div>
);

export default MobileHeader;
