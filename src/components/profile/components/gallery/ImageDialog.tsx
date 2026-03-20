// src/components/profile/components/gallery/ImageDialog.tsx

'use client';

import React from 'react';
import Image from 'next/image';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, X, Camera } from 'lucide-react';

import type { ThemeType } from '../../constants/theme';
import { BRAND } from '../../constants/theme';
import type { UserImage } from '@/types/next-auth';
import type { ProfileCardDisplayDict } from '@/types/dictionary';

interface ImageDialogProps {
  selectedImage: UserImage | null;
  orderedImages: UserImage[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (direction: 'next' | 'prev') => void;
  onImageSelect: (image: UserImage) => void;
  THEME: ThemeType;
  dict: ProfileCardDisplayDict['imageDialog'];
  direction: 'ltr' | 'rtl';
}

const ImageDialog: React.FC<ImageDialogProps> = ({
  selectedImage,
  orderedImages,
  currentIndex,
  onClose,
  onNavigate,
  onImageSelect,
  THEME,
  dict,
  direction,
}) => {
  if (!selectedImage) return null;
  const PrevIcon = direction === 'rtl' ? ChevronRight : ChevronLeft;
  const NextIcon = direction === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <Dialog
      open={!!selectedImage}
      onOpenChange={(isOpen) => !isOpen && onClose()}
    >
      <DialogContent
        className={cn(
          'max-w-5xl w-[95vw] h-[90vh] p-0 border-none rounded-2xl flex flex-col',
          'bg-black/95 backdrop-blur-md'
        )}
        dir={direction}
      >
        <DialogHeader
          className={cn(
            'p-3 sm:p-4 text-white flex-row justify-between items-center border-b border-gray-700/50',
            'bg-black/80 backdrop-blur-sm'
          )}
        >
          <DialogTitle
            className={cn(
              'font-bold flex items-center gap-2',
              'text-base sm:text-lg'
            )}
          >
            <Camera className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="break-words">
              {dict.title
                .replace('{{current}}', (currentIndex + 1).toString())
                .replace('{{total}}', orderedImages.length.toString())}
            </span>
          </DialogTitle>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={dict.closeLabel}
              className={cn(
                'text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-all',
                'w-8 h-8 sm:w-10 sm:h-10 min-h-[44px] min-w-[44px]'
              )}
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="relative flex-1 w-full min-h-0 overflow-hidden">
          <Image
            key={selectedImage.id}
            src={getRelativeCloudinaryPath(selectedImage.url)}
            alt={`תמונה מוגדלת ${currentIndex + 1}`}
            fill
            className="object-contain"
            sizes="90vw"
            priority
          />

          {orderedImages.length > 1 && (
            <>
              <Button
                variant="ghost"
                aria-label={dict.prevLabel}
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 rounded-full',
                  direction === 'rtl' ? 'right-4' : 'left-4',
                  BRAND.primaryBg,
                  'text-white border-0',
                  'backdrop-blur-sm transition-all hover:opacity-90 hover:scale-105',
                  'w-12 h-12 sm:w-14 sm:h-14 min-h-[44px] min-w-[44px]'
                )}
                onClick={() => onNavigate('prev')}
              >
                <PrevIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
              <Button
                variant="ghost"
                aria-label={dict.nextLabel}
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 rounded-full',
                  direction === 'rtl' ? 'left-4' : 'right-4',
                  BRAND.primaryBg,
                  'text-white border-0',
                  'backdrop-blur-sm transition-all hover:opacity-90 hover:scale-105',
                  'w-12 h-12 sm:w-14 sm:h-14 min-h-[44px] min-w-[44px]'
                )}
                onClick={() => onNavigate('next')}
              >
                <NextIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </>
          )}
        </div>

        {orderedImages.length > 1 && (
          <DialogFooter className="border-t border-gray-700/50 bg-black/80 backdrop-blur-sm p-0">
            <ScrollArea dir={direction} className="w-full">
              <div className="flex gap-2 p-3 justify-center min-w-max">
                {orderedImages.map((img) => (
                  <div
                    key={img.id}
                    className={cn(
                      'relative flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden cursor-pointer transition-opacity',
                      'border-2',
                      img.id === selectedImage.id
                        ? cn(THEME.accentBorderStrong, 'opacity-100')
                        : 'border-white/20 opacity-60 hover:opacity-100 hover:border-white/40'
                    )}
                    onClick={() => onImageSelect(img)}
                  >
                    <Image
                      src={getRelativeCloudinaryPath(img.url)}
                      alt={dict.thumbAlt}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImageDialog;
