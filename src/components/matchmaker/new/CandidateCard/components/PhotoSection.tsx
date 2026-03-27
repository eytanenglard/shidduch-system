// PhotoSection.tsx — Photo image with gradient, error fallback, hover zoom, gallery navigation

import React, { useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';

interface PhotoSectionProps {
  mainImage: { url: string } | undefined;
  allImages: { url: string; isMain: boolean }[];
  activePhotoIndex: number;
  onPhotoIndexChange: (index: number) => void;
  imageLoaded: boolean;
  imageError: boolean;
  isHovered: boolean;
  genderAccent: string;
  candidateName: string;
  noImageLabel: string;
  onLoad: () => void;
  onError: () => void;
  children: React.ReactNode;
}

const PhotoSection: React.FC<PhotoSectionProps> = ({
  mainImage,
  allImages,
  activePhotoIndex,
  onPhotoIndexChange,
  imageLoaded,
  imageError,
  isHovered,
  genderAccent,
  candidateName,
  noImageLabel,
  onLoad,
  onError,
  children,
}) => {
  const hasMultiple = allImages.length > 1;
  const currentImage = allImages[activePhotoIndex] ?? mainImage;

  const goNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onPhotoIndexChange((activePhotoIndex + 1) % allImages.length);
  }, [activePhotoIndex, allImages.length, onPhotoIndexChange]);

  const goPrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onPhotoIndexChange((activePhotoIndex - 1 + allImages.length) % allImages.length);
  }, [activePhotoIndex, allImages.length, onPhotoIndexChange]);

  return (
    <div className="relative h-48 sm:h-52 overflow-hidden bg-gray-100">
      {currentImage && !imageError ? (
        <>
          {!imageLoaded && <Skeleton className="absolute inset-0 h-full w-full" />}
          <Image
            src={getRelativeCloudinaryPath(currentImage.url)}
            alt={candidateName}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
            loading="lazy"
            placeholder="blur"
            blurDataURL={`${getRelativeCloudinaryPath(currentImage.url).replace('/upload/', '/upload/w_40,q_10,e_blur:200/')}`}
            className={cn(
              'object-cover transition-all duration-500',
              imageLoaded ? 'opacity-100' : 'opacity-0',
              isHovered ? 'scale-[1.03]' : 'scale-100'
            )}
            onLoad={onLoad}
            onError={onError}
          />
        </>
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${genderAccent}15, ${genderAccent}08)` }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${genderAccent}18` }}
          >
            <span
              className="text-xl font-bold"
              style={{ color: `${genderAccent}90` }}
            >
              {candidateName
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')}
            </span>
          </div>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent pointer-events-none" />

      {/* Gallery navigation — arrows */}
      {hasMultiple && (
        <>
          <button
            onClick={goPrev}
            className={cn(
              'absolute start-1 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-opacity duration-200',
              isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            aria-label="Previous photo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={goNext}
            className={cn(
              'absolute end-1 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-opacity duration-200',
              isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            aria-label="Next photo"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Gallery dots */}
      {hasMultiple && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5">
          {allImages.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onPhotoIndexChange(i); }}
              className={cn(
                'rounded-full transition-all duration-200',
                i === activePhotoIndex
                  ? 'w-2.5 h-2.5 bg-white shadow-md'
                  : 'w-1.5 h-1.5 bg-white/60 hover:bg-white/80'
              )}
              aria-label={`Photo ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Children: badges, name overlay, etc. */}
      {children}
    </div>
  );
};

export default React.memo(PhotoSection);
