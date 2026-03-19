'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Palette, CheckCircle } from 'lucide-react';
import { COLOR_PALETTES } from '../../constants/theme';
import type { ColorPaletteName, ThemeType } from '../../constants/theme';
import type { ProfileCardDisplayDict } from '@/types/dictionary';

interface ColorPaletteSelectorProps {
  selectedPalette: ColorPaletteName;
  onPaletteChange: (palette: ColorPaletteName) => void;
  THEME: ThemeType;
  dict: ProfileCardDisplayDict['colorPalette'];
  compact?: boolean;
  direction: 'ltr' | 'rtl';
}

const ColorPaletteSelector: React.FC<ColorPaletteSelectorProps> = ({
  selectedPalette,
  onPaletteChange,
  dict,
  compact = false,
  direction,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        id="color-palette-button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        variant="ghost"
        size="icon"
        className={cn(
          'bg-white/90 backdrop-blur-sm rounded-full border border-gray-200/80 shadow-lg hover:shadow-xl transition-all duration-300',
          'text-gray-600 hover:text-gray-800 hover:bg-white/95',
          compact
            ? 'w-8 h-8 min-h-[44px] min-w-[44px]'
            : 'w-10 h-10 min-h-[44px] min-w-[44px]',
          'touch-manipulation',
          'active:scale-95 transition-transform'
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={dict.selectLabel}
      >
        <Palette
          className={cn(
            compact ? 'w-4 h-4' : 'w-5 h-5',
            'transition-all duration-300'
          )}
        />
      </Button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            role="menu"
            aria-labelledby="color-palette-button"
            className={cn(
              'absolute top-full mt-2 z-50',
              direction === 'rtl' ? 'right-0' : 'right-0',
              'bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/80 shadow-xl',
              'min-w-[160px] py-2',
              'animate-in fade-in-0 zoom-in-95 duration-200'
            )}
            dir={direction}
          >
            {Object.entries(COLOR_PALETTES).map(([key]) => (
              <button
                key={key}
                role="menuitem"
                onClick={() => {
                  onPaletteChange(key as ColorPaletteName);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full px-4 py-3 text-start transition-all duration-200',
                  'hover:bg-gray-100/80 active:bg-gray-200/50',
                  'flex items-center gap-3 min-h-[44px]',
                  selectedPalette === key && 'bg-gray-100/60 font-semibold'
                )}
              >
                <div
                  aria-hidden="true"
                  className={cn(
                    'w-4 h-4 rounded-full flex-shrink-0',
                    key === 'feminine' &&
                      'bg-gradient-to-r from-rose-400 to-pink-500',
                    key === 'masculine' &&
                      'bg-gradient-to-r from-blue-500 to-cyan-600',
                    key === 'luxury' &&
                      'bg-gradient-to-r from-amber-400 to-yellow-500',
                    key === 'professional' &&
                      'bg-gradient-to-r from-gray-500 to-slate-600'
                  )}
                />
                <span
                  className={cn(
                    'text-gray-700 font-medium text-sm',
                    selectedPalette === key && 'text-gray-900 font-semibold'
                  )}
                >
                  {dict.palettes[key as keyof typeof dict.palettes]}
                </span>
                {selectedPalette === key && (
                  <>
                    <span className="sr-only">{dict.selected}</span>
                    <CheckCircle
                      aria-hidden="true"
                      className="w-4 h-4 text-green-600 ms-auto"
                    />
                  </>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ColorPaletteSelector;
