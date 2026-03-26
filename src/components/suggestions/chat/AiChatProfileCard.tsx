// src/components/suggestions/chat/AiChatProfileCard.tsx
// =============================================================================
// Compact ProfileCard wrapper for display inside AI chat
// Fetches profile data and renders a condensed version
// =============================================================================

'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
import { MapPin, Briefcase, GraduationCap, Heart, User, Loader2, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CandidateProfileData {
  profile: {
    firstName: string;
    lastName?: string;
    birthDate?: string | Date | null;
    city?: string | null;
    religiousLevel?: string | null;
    occupation?: string | null;
    education?: string | null;
    educationLevel?: string | null;
    about?: string | null;
    headline?: string | null;
    height?: number | null;
    characterTraits?: string[] | null;
    hobbies?: string[] | null;
  };
  images: Array<{
    id: string;
    url: string;
    isMain?: boolean;
  }>;
  isProfileComplete: boolean;
}

interface AiChatProfileCardProps {
  candidateUserId: string;
  locale: 'he' | 'en';
  onViewFullProfile?: () => void;
}

export default function AiChatProfileCard({
  candidateUserId,
  locale,
  onViewFullProfile,
}: AiChatProfileCardProps) {
  const [data, setData] = useState<CandidateProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isHebrew = locale === 'he';

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/ai-chat/candidate-profile?userId=${candidateUserId}`);
        if (!res.ok) throw new Error('Failed to load profile');
        const json = await res.json();
        if (!cancelled && json.success) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          setError(isHebrew ? 'שגיאה בטעינת הפרופיל' : 'Failed to load profile');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchProfile();
    return () => { cancelled = true; };
  }, [candidateUserId, isHebrew]);

  if (isLoading) {
    return (
      <div className="w-full max-w-sm mx-auto rounded-xl border border-violet-200 bg-white p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
        <span className="text-sm text-gray-500 mr-2">
          {isHebrew ? 'טוען פרופיל...' : 'Loading profile...'}
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full max-w-sm mx-auto rounded-xl border border-red-200 bg-red-50 p-4 text-center">
        <p className="text-sm text-red-600">{error || (isHebrew ? 'פרופיל לא נמצא' : 'Profile not found')}</p>
      </div>
    );
  }

  const { profile, images } = data;
  const mainImage = images.find((img) => img.isMain) || images[0];

  // Calculate age
  const age = profile.birthDate
    ? Math.floor((Date.now() - new Date(profile.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="w-full max-w-sm mx-auto my-2">
      <div className={cn(
        'rounded-xl border border-violet-200 bg-white overflow-hidden',
        'shadow-sm hover:shadow-md transition-shadow duration-200',
      )}>
        {/* Image */}
        {mainImage ? (
          <div className="relative w-full h-52 bg-gray-100">
            <Image
              src={getRelativeCloudinaryPath(mainImage.url)}
              alt={profile.firstName}
              fill
              className="object-cover"
              sizes="(max-width: 400px) 100vw, 400px"
            />
            {/* Gradient overlay at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
            {/* Name & age over image */}
            <div className="absolute bottom-3 right-3 left-3 text-white">
              <h3 className="text-lg font-bold leading-tight">
                {profile.firstName}{age ? `, ${age}` : ''}
              </h3>
              {profile.city && (
                <div className="flex items-center gap-1 text-white/90 text-xs mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {profile.city}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-32 bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center">
            <User className="w-12 h-12 text-violet-300" />
          </div>
        )}

        {/* Details */}
        <ScrollArea className="max-h-[250px]">
          <div className="p-4 space-y-3">
            {/* Headline */}
            {profile.headline && (
              <p className="text-sm text-gray-600 italic leading-relaxed">
                &ldquo;{profile.headline}&rdquo;
              </p>
            )}

            {/* Info chips */}
            <div className="flex flex-wrap gap-2">
              {profile.occupation && (
                <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 rounded-full px-2.5 py-1">
                  <Briefcase className="w-3 h-3 text-gray-400" />
                  {profile.occupation}
                </div>
              )}
              {(profile.educationLevel || profile.education) && (
                <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 rounded-full px-2.5 py-1">
                  <GraduationCap className="w-3 h-3 text-gray-400" />
                  {profile.educationLevel || profile.education}
                </div>
              )}
              {profile.religiousLevel && (
                <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 rounded-full px-2.5 py-1">
                  <Heart className="w-3 h-3 text-gray-400" />
                  {profile.religiousLevel}
                </div>
              )}
            </div>

            {/* About */}
            {profile.about && (
              <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">
                {profile.about}
              </p>
            )}

            {/* Character traits */}
            {profile.characterTraits && profile.characterTraits.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {profile.characterTraits.slice(0, 5).map((trait) => (
                  <Badge
                    key={trait}
                    variant="secondary"
                    className="text-[11px] px-2 py-0.5 bg-violet-50 text-violet-700 border-violet-200"
                  >
                    {trait}
                  </Badge>
                ))}
              </div>
            )}

            {/* Hobbies */}
            {profile.hobbies && profile.hobbies.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {profile.hobbies.slice(0, 4).map((hobby) => (
                  <Badge
                    key={hobby}
                    variant="outline"
                    className="text-[11px] px-2 py-0.5 text-gray-600"
                  >
                    {hobby}
                  </Badge>
                ))}
              </div>
            )}

            {/* Image thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {images.slice(0, 4).map((img) => (
                  <div key={img.id} className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={getRelativeCloudinaryPath(img.url)}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                ))}
                {images.length > 4 && (
                  <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-gray-500 font-medium">+{images.length - 4}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* View full profile button */}
        {onViewFullProfile && (
          <div className="px-4 py-2 border-t border-gray-100">
            <button
              onClick={onViewFullProfile}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-violet-600 hover:text-violet-700 font-medium py-1 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              {isHebrew ? 'צפה בפרופיל מלא' : 'View full profile'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
