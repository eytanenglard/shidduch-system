'use client';

import React from 'react';
import { Dialog, DialogContent, DialogPrimitive } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { ModalShellProps } from '../types/modal.types';

const getModalClasses = (isMobile: boolean, isFullscreen: boolean) => {
  const baseClasses =
    'p-0 shadow-2xl border-0 bg-white overflow-hidden z-[50] flex flex-col transition-all duration-300 ease-in-out';
  if (isMobile) {
    return `${baseClasses} !w-screen !h-[100dvh] !max-w-none !max-h-none !rounded-none !fixed !inset-0 !m-0 !transform-none`;
  } else if (isFullscreen) {
    return `${baseClasses} !w-screen !h-[100dvh] !max-w-none !max-h-none !rounded-none !fixed !inset-0 !m-0 !translate-x-0 !translate-y-0 !transform-none`;
  } else {
    return `${baseClasses} md:max-w-7xl md:w-[95vw] md:h-[95vh] md:rounded-3xl`;
  }
};

const ModalShell: React.FC<ModalShellProps> = ({
  isOpen,
  onClose,
  locale,
  isMobile,
  isFullscreen,
  children,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(getModalClasses(isMobile, isFullscreen))}
        dir={locale === 'he' ? 'rtl' : 'ltr'}
        onOpenAutoFocus={(e) => e.preventDefault()}
        data-fullscreen={isFullscreen}
        data-mobile={isMobile}
        style={
          isMobile || isFullscreen
            ? {
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)',
              }
            : undefined
        }
      >
        <DialogPrimitive.Title className="sr-only">
          {locale === 'he' ? 'פרטי הצעה' : 'Suggestion Details'}
        </DialogPrimitive.Title>
        <DialogPrimitive.Description className="sr-only">
          {locale === 'he' ? 'פרטים מלאים על ההצעה' : 'Full suggestion details'}
        </DialogPrimitive.Description>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export { ModalShell, ScrollArea };
export default ModalShell;
