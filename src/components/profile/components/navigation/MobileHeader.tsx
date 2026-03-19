'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X, Heart, FileText } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import ColorPaletteSelector from './ColorPaletteSelector';
import type { ThemeType, ColorPaletteName } from '../../constants/theme';
import type { ProfileCardDisplayDict } from '@/types/dictionary';

interface MobileHeaderProps {
  direction: 'ltr' | 'rtl';
  THEME: ThemeType;
  displayDict: ProfileCardDisplayDict;
  mobileViewLayout: 'focus' | 'detailed';
  setMobileViewLayout: (value: 'focus' | 'detailed') => void;
  selectedPalette: ColorPaletteName;
  setSelectedPalette: (palette: ColorPaletteName) => void;
  handleClose: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  direction,
  THEME,
  displayDict,
  mobileViewLayout,
  setMobileViewLayout,
  selectedPalette,
  setSelectedPalette,
  handleClose,
}) => (
  <div
    className={cn(
      'flex-shrink-0 flex justify-between items-center border-b border-rose-200/50 sticky top-0 z-30 backdrop-blur-md',
      'p-3 sm:p-4 min-h-[60px]',
      `bg-gradient-to-r ${THEME.colors.neutral.warm}`
    )}
    dir={direction}
  >
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'text-gray-600 hover:text-gray-800 hover:bg-white/60 rounded-full transition-all duration-300 shadow-sm hover:shadow-md',
        'w-10 h-10 sm:w-12 sm:h-12 min-h-[44px] min-w-[44px] touch-manipulation'
      )}
      onClick={handleClose}
      aria-label={displayDict.mobileNav.closePreview}
    >
      <X className="w-4 h-4 sm:w-5 sm:h-5" />
    </Button>
    <div className="flex items-center gap-3 flex-1 justify-center">
      <ToggleGroup
        type="single"
        value={mobileViewLayout}
        onValueChange={(value: 'focus' | 'detailed') => {
          if (value) setMobileViewLayout(value);
        }}
        className={cn(
          'bg-white/95 backdrop-blur-sm rounded-2xl border border-rose-200/50 shadow-lg',
          'p-1',
          THEME.shadows.soft
        )}
      >
        <ToggleGroupItem
          value="focus"
          aria-label={displayDict.mobileNav.introView}
          className={cn(
            'rounded-xl transition-all duration-300 min-h-[44px] px-3 sm:px-4 py-2 touch-manipulation',
            'data-[state=on]:bg-gradient-to-r data-[state=on]:from-rose-500 data-[state=on]:to-pink-500 data-[state=on]:text-white data-[state=on]:shadow-md'
          )}
        >
          <Heart className="h-3 h-3 sm:h-4 sm:w-4" />
          <span className="mx-1.5 sm:mx-2 text-xs sm:text-sm font-medium">
            {displayDict.mobileNav.introView}
          </span>
        </ToggleGroupItem>
        <ToggleGroupItem
          value="detailed"
          aria-label={displayDict.mobileNav.detailedView}
          className={cn(
            'rounded-xl transition-all duration-300 min-h-[44px] px-3 sm:px-4 py-2 touch-manipulation',
            'data-[state=on]:bg-gradient-to-r data-[state=on]:from-purple-500 data-[state=on]:to-indigo-500 data-[state=on]:text-white data-[state=on]:shadow-md'
          )}
        >
          <FileText className="h-3 h-3 sm:h-4 sm:w-4" />
          <span className="mx-1.5 sm:mx-2 text-xs sm:text-sm font-medium">
            {displayDict.mobileNav.detailedView}
          </span>
        </ToggleGroupItem>
      </ToggleGroup>
      <ColorPaletteSelector
        selectedPalette={selectedPalette}
        onPaletteChange={setSelectedPalette}
        THEME={THEME}
        dict={displayDict.colorPalette}
        compact={true}
        direction={direction}
      />
    </div>
  </div>
);

export default MobileHeader;
