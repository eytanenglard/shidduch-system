'use client';

import React from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type DialogSize = 'sm' | 'md' | 'lg' | 'xl';

const sizeMap: Record<DialogSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

interface DialogContainerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: DialogSize;
  dir?: 'rtl' | 'ltr';
  children: React.ReactNode;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
}

export function DialogContainer({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  dir = 'rtl',
  children,
  footer,
  showCloseButton = true,
}: DialogContainerProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        dir={dir}
        className={cn(
          sizeMap[size],
          'max-h-[85vh] overflow-y-auto',
          dir === 'rtl' && 'text-right'
        )}
        // Hide the default Radix close button — we render our own
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="relative">
          {showCloseButton && (
            <button
              onClick={onClose}
              className={cn(
                'absolute top-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                dir === 'rtl' ? 'left-0' : 'right-0'
              )}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="py-2">{children}</div>

        {footer && (
          <div
            className={cn(
              'flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t',
              dir === 'rtl' && 'sm:flex-row-reverse'
            )}
          >
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
