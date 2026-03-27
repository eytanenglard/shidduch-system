'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { ProfileCardDisplayDict } from '@/types/dictionary';

interface MobileHeaderProps {
  direction: 'ltr' | 'rtl';
  displayDict: ProfileCardDisplayDict;
  handleClose: () => void;
  // Legacy props (accepted but ignored)
  mobileViewLayout?: unknown;
  setMobileViewLayout?: unknown;
  THEME?: unknown;
  selectedPalette?: unknown;
  setSelectedPalette?: unknown;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  direction,
  displayDict,
  handleClose,
}) => (
  <div
    className={cn(
      'flex-shrink-0 flex items-center',
      'border-b border-gray-200 sticky top-0 z-30',
      'bg-white/95 backdrop-blur-md px-3 py-2 min-h-[48px]'
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
  </div>
);

export default MobileHeader;
