// src/components/profile/components/gallery/MobileImageGallery.tsx

'use client';

import React from 'react';
import Image from 'next/image';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Star, Camera } from 'lucide-react';

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
  profile,
  onImageClick,
  THEME,
  dict,
  compact = false,
  direction,
}) => {
  if (orderedImages.length === 0) return null;

  return (
    <div
      className={cn(
        'overflow-hidden',
        compact ? 'px-2 pt-2 pb-2' : 'px-3 sm:px-4 pt-3 sm:pt-4 pb-2 sm:pb-3',
        `bg-gradient-to-r ${THEME.colors.neutral.warm}`
      )}
    >
      <div
        className={cn(
          'text-center overflow-hidden',
          compact ? 'mb-2' : 'mb-3 sm:mb-4'
        )}
      >
        <h3
          className={cn(
            'font-bold text-gray-800 flex items-center justify-center gap-1.5 sm:gap-2',
            compact ? 'text-sm mb-1' : 'text-base sm:text-lg mb-1 sm:mb-2'
          )}
        >
          <Camera
            aria-label={dict.title || 'תמונות'}
            className={cn(
              'text-white',
              'flex-shrink-0',
              compact ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5'
            )}
          />
          <span className="break-words min-w-0">
            {dict.title.replace(
              '{{name}}',
              profile.user?.firstName || 'המועמד'
            )}
          </span>
        </h3>
        <p
          className={cn(
            'text-gray-600',
            compact ? 'text-xs' : 'text-xs sm:text-sm'
          )}
        >
          {dict.subtitle}
        </p>
      </div>
      <ScrollArea dir={direction} className="w-full overflow-hidden">
        <div
          className={cn(
            'flex pb-2 sm:pb-3',
            compact ? 'gap-2' : 'gap-2 sm:gap-3 md:gap-4',
            'justify-center min-w-full'
          )}
        >
          {orderedImages.map((image, idx) => (
            <button
              key={image.id}
              type="button"
              aria-label={dict.showImageAlt.replace(
                '{{index}}',
                (idx + 1).toString()
              )}
              className={cn(
                'relative flex-shrink-0 rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-rose-500',
                orderedImages.length <= 3
                  ? compact
                    ? 'w-20 h-24 border-2'
                    : 'w-24 h-32 sm:w-28 sm:h-36 border-2 sm:border-3'
                  : compact
                    ? 'w-16 h-20 border-2'
                    : 'w-20 h-26 sm:w-22 sm:h-30 border-2 sm:border-3',
                'border-white shadow-md hover:shadow-lg sm:shadow-lg sm:hover:shadow-xl',
                'max-w-[calc((100vw-3rem)/5)]'
              )}
              onClick={() => onImageClick(image)}
            >
              <Image
                src={getRelativeCloudinaryPath(image.url)}
                alt={dict.imageAlt.replace('{{index}}', (idx + 1).toString())}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes={
                  orderedImages.length <= 3
                    ? compact
                      ? '80px'
                      : '112px'
                    : compact
                      ? '64px'
                      : '88px'
                }
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {image.isMain && (
                <Badge
                  className={cn(
                    'absolute font-bold',
                    compact
                      ? 'top-0.5 end-0.5 text-xs px-1 py-0.5 gap-0.5'
                      : 'top-1 end-1 text-xs px-1.5 py-0.5 gap-1',
                    'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-sm',
                    THEME.shadows.warm
                  )}
                >
                  <Star
                    className={cn(
                      'fill-current',
                      compact ? 'w-2 h-2' : 'w-2 h-2 sm:w-2.5 sm:h-2.5'
                    )}
                  />
                  {!compact && <span>{dict.mainBadge}</span>}
                </Badge>
              )}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="mt-1" />
      </ScrollArea>
    </div>
  );
};

export default MobileImageGallery;
