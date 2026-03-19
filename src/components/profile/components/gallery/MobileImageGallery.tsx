// src/components/profile/components/gallery/MobileImageGallery.tsx

'use client';

import React from 'react';
import Image from 'next/image';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

import type { ThemeType } from '../../constants/theme';
import type { UserProfile, UserImage } from '@/types/next-auth';
import type { ProfileCardDisplayDict } from '@/types/dictionary';

interface MobileImageGalleryProps {
  orderedImages: UserImage[];
  profile: UserProfile;
  onImageClick: (image: UserImage) => void;
  THEME: ThemeType;
  dict: ProfileCardDisplayDict['gallery'];
  compact?: boolean;
  direction: 'ltr' | 'rtl';
}

const MobileImageGallery: React.FC<MobileImageGalleryProps> = ({
  orderedImages,
  onImageClick,
  THEME,
  direction,
}) => {
  if (orderedImages.length <= 1) return null;

  return (
    <div className="px-3 py-2 bg-white">
      <ScrollArea dir={direction} className="w-full">
        <div className="flex gap-2 pb-1 justify-center">
          {orderedImages.map((image, idx) => (
            <button
              key={image.id}
              type="button"
              aria-label={`תמונה ${idx + 1}`}
              className={cn(
                'relative flex-shrink-0 w-14 h-16 rounded-lg overflow-hidden transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                'border-2',
                idx === 0
                  ? cn(THEME.accentBorderStrong, 'opacity-100')
                  : 'border-gray-200 opacity-75 hover:opacity-100'
              )}
              onClick={() => onImageClick(image)}
            >
              <Image
                src={getRelativeCloudinaryPath(image.url)}
                alt=""
                fill
                className="object-cover"
                sizes="56px"
              />
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default MobileImageGallery;
