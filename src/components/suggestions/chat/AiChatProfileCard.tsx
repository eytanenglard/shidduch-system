// src/components/suggestions/chat/AiChatProfileCard.tsx
// =============================================================================
// Compact ProfileCard wrapper for display inside AI chat
// Fetches profile data and renders a condensed version
// Click to expand full profile in a Dialog
// =============================================================================

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
import { MapPin, Briefcase, GraduationCap, Heart, User, Loader2, Maximize2, X, Ruler, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface CandidateProfileData {
  profile: {
    firstName: string;
    lastName?: string;
    birthDate?: string | Date | null;
    city?: string | null;
    origin?: string | null;
    religiousLevel?: string | null;
    occupation?: string | null;
    education?: string | null;
    educationLevel?: string | null;
    about?: string | null;
    profileHeadline?: string | null;
    height?: number | null;
    maritalStatus?: string | null;
    profileCharacterTraits?: string[] | null;
    characterTraits?: string[] | null;
    profileHobbies?: string[] | null;
    hobbies?: string[] | null;
    parentStatus?: string | null;
    siblings?: number | null;
    smokingStatus?: string | null;
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
}

// Simple in-memory cache for profile data to avoid redundant fetches
const profileCache = new Map<string, CandidateProfileData>();

export default function AiChatProfileCard({
  candidateUserId,
  locale,
}: AiChatProfileCardProps) {
  const [data, setData] = useState<CandidateProfileData | null>(
    profileCache.get(candidateUserId) || null,
  );
  const [isLoading, setIsLoading] = useState(!profileCache.has(candidateUserId));
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogImageIndex, setDialogImageIndex] = useState(0);
  const isHebrew = locale === 'he';

  useEffect(() => {
    // Skip fetch if already cached
    if (profileCache.has(candidateUserId)) {
      setData(profileCache.get(candidateUserId)!);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchProfile() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/ai-chat/candidate-profile?userId=${candidateUserId}`);
        if (!res.ok) throw new Error('Failed to load profile');
        const json = await res.json();
        if (!cancelled && json.success) {
          profileCache.set(candidateUserId, json);
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

  const handleOpenDialog = useCallback(() => {
    setDialogImageIndex(0);
    setIsDialogOpen(true);
  }, []);

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
  const traits = profile.profileCharacterTraits || profile.characterTraits || [];
  const hobbies = profile.profileHobbies || profile.hobbies || [];

  // Calculate age
  const age = profile.birthDate
    ? Math.floor((Date.now() - new Date(profile.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <>
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
              {profile.profileHeadline && (
                <p className="text-sm text-gray-600 italic leading-relaxed">
                  &ldquo;{profile.profileHeadline}&rdquo;
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
              {traits.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {traits.slice(0, 5).map((trait) => (
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
              {hobbies.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {hobbies.slice(0, 4).map((hobby) => (
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
          <div className="px-4 py-2 border-t border-gray-100">
            <button
              onClick={handleOpenDialog}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-violet-600 hover:text-violet-700 font-medium py-1 transition-colors"
            >
              <Maximize2 className="w-3 h-3" />
              {isHebrew ? 'צפה בפרופיל מלא' : 'View full profile'}
            </button>
          </div>
        </div>
      </div>

      {/* Full Profile Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] !p-0 !overflow-hidden !gap-0">
          {/* Dialog Header with close */}
          <div className="bg-violet-600 px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              {isHebrew ? 'פרופיל מלא' : 'Full Profile'}
            </h2>
            <button
              onClick={() => setIsDialogOpen(false)}
              className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          <ScrollArea className="max-h-[calc(90vh-48px)]">
            <div className="pb-6">
              {/* Image gallery */}
              {images.length > 0 && (
                <div className="relative w-full h-72 bg-gray-100">
                  <Image
                    src={getRelativeCloudinaryPath(images[dialogImageIndex]?.url || mainImage?.url || '')}
                    alt={profile.firstName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 600px) 100vw, 600px"
                  />
                  {/* Image navigation */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setDialogImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors"
                      >
                        <ChevronRight className="w-5 h-5 text-white" />
                      </button>
                      <button
                        onClick={() => setDialogImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 text-white" />
                      </button>
                      {/* Dots */}
                      <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
                        {images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setDialogImageIndex(i)}
                            className={cn(
                              'w-2 h-2 rounded-full transition-all',
                              i === dialogImageIndex ? 'bg-white w-4' : 'bg-white/50',
                            )}
                          />
                        ))}
                      </div>
                    </>
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
                  {/* Name & age over image */}
                  <div className="absolute bottom-4 right-4 left-4 text-white">
                    <h3 className="text-xl font-bold leading-tight">
                      {profile.firstName}{age ? `, ${age}` : ''}
                    </h3>
                    {profile.city && (
                      <div className="flex items-center gap-1 text-white/90 text-sm mt-0.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {profile.city}
                        {profile.origin && profile.origin !== profile.city && (
                          <span className="text-white/70">({isHebrew ? 'מוצא' : 'from'}: {profile.origin})</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* No image fallback */}
              {images.length === 0 && (
                <div className="w-full h-40 bg-gradient-to-br from-violet-100 to-violet-50 flex flex-col items-center justify-center">
                  <User className="w-14 h-14 text-violet-300" />
                  <h3 className="text-lg font-bold text-gray-700 mt-2">
                    {profile.firstName}{age ? `, ${age}` : ''}
                  </h3>
                </div>
              )}

              <div className="px-5 py-4 space-y-5">
                {/* Headline */}
                {profile.profileHeadline && (
                  <p className="text-base text-gray-600 italic leading-relaxed text-center">
                    &ldquo;{profile.profileHeadline}&rdquo;
                  </p>
                )}

                {/* Info chips */}
                <div className="flex flex-wrap gap-2">
                  {profile.occupation && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-700 bg-gray-50 rounded-full px-3 py-1.5 border border-gray-100">
                      <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                      {profile.occupation}
                    </div>
                  )}
                  {(profile.educationLevel || profile.education) && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-700 bg-gray-50 rounded-full px-3 py-1.5 border border-gray-100">
                      <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                      {profile.educationLevel || profile.education}
                    </div>
                  )}
                  {profile.religiousLevel && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-700 bg-gray-50 rounded-full px-3 py-1.5 border border-gray-100">
                      <Heart className="w-3.5 h-3.5 text-gray-400" />
                      {profile.religiousLevel}
                    </div>
                  )}
                  {profile.height && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-700 bg-gray-50 rounded-full px-3 py-1.5 border border-gray-100">
                      <Ruler className="w-3.5 h-3.5 text-gray-400" />
                      {profile.height} {isHebrew ? 'ס"מ' : 'cm'}
                    </div>
                  )}
                  {profile.maritalStatus && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-700 bg-gray-50 rounded-full px-3 py-1.5 border border-gray-100">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      {profile.maritalStatus}
                    </div>
                  )}
                </div>

                {/* About */}
                {profile.about && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-1.5">
                      {isHebrew ? 'קצת עליי' : 'About'}
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {profile.about}
                    </p>
                  </div>
                )}

                {/* Character traits - all */}
                {traits.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-1.5">
                      {isHebrew ? 'תכונות אופי' : 'Character traits'}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {traits.map((trait) => (
                        <Badge
                          key={trait}
                          variant="secondary"
                          className="text-xs px-2.5 py-1 bg-violet-50 text-violet-700 border-violet-200"
                        >
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hobbies - all */}
                {hobbies.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-1.5">
                      {isHebrew ? 'תחביבים' : 'Hobbies'}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {hobbies.map((hobby) => (
                        <Badge
                          key={hobby}
                          variant="outline"
                          className="text-xs px-2.5 py-1 text-gray-600"
                        >
                          {hobby}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Family background */}
                {(profile.parentStatus || profile.siblings) && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-1.5">
                      {isHebrew ? 'רקע משפחתי' : 'Family background'}
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      {profile.parentStatus && (
                        <p>{isHebrew ? 'מצב הורים' : 'Parents'}: {profile.parentStatus}</p>
                      )}
                      {profile.siblings && (
                        <p>{isHebrew ? 'אחים/אחיות' : 'Siblings'}: {profile.siblings}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* All images grid */}
                {images.length > 1 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-1.5">
                      {isHebrew ? 'תמונות' : 'Photos'}
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {images.map((img, i) => (
                        <button
                          key={img.id}
                          onClick={() => setDialogImageIndex(i)}
                          className={cn(
                            'relative aspect-square rounded-lg overflow-hidden',
                            i === dialogImageIndex && 'ring-2 ring-violet-500',
                          )}
                        >
                          <Image
                            src={getRelativeCloudinaryPath(img.url)}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="120px"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
