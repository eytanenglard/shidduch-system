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
      'absolute top-2 z-30',
      direction === 'rtl' ? 'left-2' : 'right-2'
    )}
  >
    <Button
      variant="ghost"
      size="icon"
      className="w-9 h-9 min-h-[44px] min-w-[44px] rounded-full bg-white/80 backdrop-blur-sm shadow-sm text-gray-500 hover:text-gray-700 hover:bg-white touch-manipulation"
      onClick={handleClose}
      aria-label={displayDict.mobileNav.closePreview}
    >
      <X className="w-5 h-5" />
    </Button>
  </div>
);

export default MobileHeader;
