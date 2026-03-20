// PhotoSection.tsx — Photo image with gradient, error fallback, hover zoom

import React from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';

interface PhotoSectionProps {
  mainImage: { url: string } | undefined;
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
  imageLoaded,
  imageError,
  isHovered,
  genderAccent,
  candidateName,
  noImageLabel,
  onLoad,
  onError,
  children,
}) => (
  <div className="relative h-48 sm:h-52 overflow-hidden bg-gray-100">
    {mainImage && !imageError ? (
      <>
        {!imageLoaded && <Skeleton className="absolute inset-0 h-full w-full" />}
        <Image
          src={getRelativeCloudinaryPath(mainImage.url)}
          alt={candidateName}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={false}
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

    {/* Children: badges, name overlay, etc. */}
    {children}
  </div>
);

export default React.memo(PhotoSection);
