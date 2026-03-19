// src/components/profile/ProfileCard.tsx

'use client';

import React from 'react';
import Image from 'next/image';

import { cn, getRelativeCloudinaryPath } from '@/lib/utils';

// UI Components
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

// Icons
import {
  Heart,
  Eye,
  Sparkles,
  X,
  Camera,
  ArrowLeft,
  MessageSquareQuote,
} from 'lucide-react';

// Hook
import { useProfileCard } from './hooks/useProfileCard';

// Extracted components
import ProfileHeader from './components/header/ProfileHeader';
import MobileImageGallery from './components/gallery/MobileImageGallery';
import ImageDialog from './components/gallery/ImageDialog';
import MobileHeader from './components/navigation/MobileHeader';
import MainContentTabs from './components/tabs/MainContentTabs';

// Utilities & types
import { formatEnumValue } from './utils/formatters';
import type { ProfileCardProps } from './types/profileCard';

const ProfileCard: React.FC<ProfileCardProps> = ({
  profile: profileData,
  isProfileComplete,
  images = [],
  questionnaire,
  viewMode = 'candidate',
  className,
  onClose,
  dict,
  locale,
}) => {
  const hook = useProfileCard({
    profileData,
    isProfileComplete,
    images,
    questionnaire,
    viewMode,
    onClose,
    dict,
    locale,
  });

  const {
    direction,
    profile,
    displayDict,
    effectiveViewMode,
    THEME,
    WORLDS,
    isClient,
    isDesktop,
    selectedImageForDialog,
    activeTab,
    mobileViewLayout,
    setMobileViewLayout,
    setIsSuggestDialogOpen,
    setActiveTab,
    setSelectedImageForDialog,
    maritalStatusMap,
    religiousLevelMap,
    religiousJourneyMap,
    educationLevelMap,
    serviceTypeMap,
    headCoveringMap,
    kippahTypeMap,
    contactPreferenceMap,
    characterTraitMap,
    hobbiesMap,
    orderedImages,
    mainImageToDisplay,
    age,
    availability,
    tabItems,
    hasAnyPreferences,
    hasEducationAndCareerDetails,
    hasFamilyBackgroundDetails,
    hasUniqueTraitsOrHobbies,
    hasJudaismConnectionDetails,
    personalityAnswers,
    valuesAnswers,
    relationshipAnswers,
    partnerAnswers,
    religionAnswers,
    currentDialogImageIndex,
    handleTabChange,
    handleOpenImageDialog,
    handleCloseImageDialog,
    handleDialogNav,
    handleClose,
    contentScrollAreaRef,
  } = hook;

  // --- Shared MainContentTabs props ---
  const mainContentTabsProps = {
    activeTab,
    onTabChange: handleTabChange,
    tabItems,
    profile,
    displayDict,
    dict,
    direction,
    locale,
    THEME,
    effectiveViewMode,
    mobileViewLayout,
    contentScrollAreaRef,
    personalityAnswers,
    valuesAnswers,
    religionAnswers,
    relationshipAnswers,
    partnerAnswers,
    hasAnyPreferences,
    hasEducationAndCareerDetails,
    hasFamilyBackgroundDetails,
    hasJudaismConnectionDetails,
    WORLDS,
    characterTraitMap,
    hobbiesMap,
    educationLevelMap,
    serviceTypeMap,
    religiousLevelMap,
    religiousJourneyMap,
    headCoveringMap,
    kippahTypeMap,
    contactPreferenceMap,
    maritalStatusMap,
  };

  // --- Shared ProfileHeader props ---
  const profileHeaderProps = {
    profile,
    age,
    mainImageToDisplay,
    availability,
    viewMode: effectiveViewMode,
    onSuggestClick: () => setIsSuggestDialogOpen(true),
    THEME,
    dict: displayDict,
    religiousLevelMap,
    educationLevelMap,
    locale,
    totalImages: orderedImages.length,
    onAvatarClick: () =>
      orderedImages.length > 0 && handleOpenImageDialog(orderedImages[0]),
  };

  // --- Loading skeleton ---
  if (!isClient) {
    return (
      <Card
        dir={direction}
        className={cn(
          'w-full bg-white rounded-2xl overflow-hidden border border-gray-100 flex flex-col h-full',
          className
        )}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <div className="grid grid-cols-3 gap-3 mt-4">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>
        <div className="p-6 flex-grow">
          <div className="space-y-4" dir={direction}>
            <Skeleton className="h-6 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>
      </Card>
    );
  }

  // --- Desktop Layout: Photo Left (38%), Content Right (62%) ---
  const DesktopLayout = () => (
    <div className="flex flex-grow min-h-0 max-w-full" dir="ltr">
      {/* Left: Photo panel */}
      <div className="w-[38%] flex-shrink-0 relative bg-gray-100 overflow-hidden">
        {mainImageToDisplay?.url ? (
          <Image
            src={getRelativeCloudinaryPath(mainImageToDisplay.url)}
            alt={profile.user?.firstName || ''}
            fill
            className="object-cover cursor-pointer"
            sizes="38vw"
            priority
            onClick={() =>
              orderedImages.length > 0 &&
              handleOpenImageDialog(orderedImages[0])
            }
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="w-16 h-16 text-gray-300" />
          </div>
        )}

        {/* Thumbnail strip at bottom */}
        {orderedImages.length > 1 && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-10">
            <div className="flex gap-2 justify-center">
              {orderedImages.slice(0, 5).map((img, idx) => (
                <div
                  key={img.id}
                  className={cn(
                    'relative w-12 h-12 rounded-lg overflow-hidden cursor-pointer flex-shrink-0 transition-opacity',
                    'border-2',
                    idx === 0
                      ? cn(THEME.accentBorderStrong, 'opacity-100')
                      : 'border-white/40 opacity-70 hover:opacity-100'
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenImageDialog(img);
                  }}
                >
                  <Image
                    src={getRelativeCloudinaryPath(img.url)}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              ))}
              {orderedImages.length > 5 && (
                <div
                  className="relative w-12 h-12 rounded-lg overflow-hidden cursor-pointer flex-shrink-0 bg-black/50 flex items-center justify-center border-2 border-white/40"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenImageDialog(orderedImages[5]);
                  }}
                >
                  <span className="text-white text-sm font-medium">
                    +{orderedImages.length - 5}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Image count badge */}
        {orderedImages.length > 1 && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-black/60 text-white border-0 text-xs px-2 py-1 gap-1">
              <Camera className="w-3 h-3" />
              <span>{orderedImages.length}</span>
            </Badge>
          </div>
        )}
      </div>

      {/* Right: Content panel */}
      <div className="flex-1 min-w-0 flex flex-col" dir={direction}>
        <ScrollArea className="flex-1 min-h-0">
          <ProfileHeader mode="desktop" {...profileHeaderProps} />
          <div className="px-6 pb-6">
            <MainContentTabs isDesktop={true} {...mainContentTabsProps} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );

  // --- Detailed Mobile Layout ---
  const DetailedMobileLayout = () => (
    <ScrollArea className="flex-1 min-h-0 max-w-full overflow-hidden">
      <div className="flex flex-col min-w-0 max-w-full">
        <ProfileHeader mode="mobile" {...profileHeaderProps} />
        <MobileImageGallery
          orderedImages={orderedImages}
          profile={profile}
          onImageClick={handleOpenImageDialog}
          THEME={THEME}
          dict={displayDict.gallery}
          direction={direction}
        />
        <div className="p-3 sm:p-4 min-w-0 max-w-full bg-gray-50">
          <MainContentTabs isDesktop={false} {...mainContentTabsProps} />
        </div>
      </div>
    </ScrollArea>
  );

  // --- Focus Mobile Layout (teaser/discovery) ---
  const FocusMobileLayout = () => {
    const approvedTestimonials = (profile.testimonials || []).filter(
      (t) => t.status === 'APPROVED'
    );
    const firstTestimonial = approvedTestimonials[0];

    return (
      <div className="flex-1 min-h-0 flex flex-col max-w-full overflow-hidden">
        <ScrollArea className="flex-1 min-h-0 max-w-full">
          <div className="min-w-0 max-w-full">
            {/* Hero photo */}
            <ProfileHeader mode="mobile" {...profileHeaderProps} />

            <div className="px-4 py-4 space-y-4">
              {/* Headline */}
              {profile.profileHeadline && (
                <p className="text-center text-base italic font-medium text-gray-700">
                  &quot;{profile.profileHeadline}&quot;
                </p>
              )}

              {/* About with gradient fade */}
              {profile.isAboutVisible && profile.about && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {displayDict.content.focus.aboutMe}
                  </h3>
                  <div className="relative">
                    <p
                      className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words"
                      style={{
                        maxHeight: '7.5em',
                        overflow: 'hidden',
                        WebkitMaskImage:
                          'linear-gradient(to bottom, black 60%, transparent 100%)',
                        maskImage:
                          'linear-gradient(to bottom, black 60%, transparent 100%)',
                      }}
                    >
                      {profile.about}
                    </p>
                    <button
                      className={cn(
                        'text-sm font-semibold mt-1',
                        THEME.accentText
                      )}
                      onClick={() => setMobileViewLayout('detailed')}
                    >
                      {dict.display.content.focus.readFullStory}
                    </button>
                  </div>
                </div>
              )}

              {/* Testimonial preview */}
              {profile.isFriendsSectionVisible &&
                approvedTestimonials.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <MessageSquareQuote className="w-4 h-4 text-gray-400" />
                      {dict.display.content.friendTestimonials.title.replace(
                        '{{name}}',
                        profile.user?.firstName || ''
                      )}
                    </h3>
                    {firstTestimonial && (
                      <div
                        className={cn(
                          'bg-gray-50 rounded-lg p-4',
                          direction === 'rtl'
                            ? cn('border-r-2', THEME.accentBorder)
                            : cn('border-l-2', THEME.accentBorder)
                        )}
                      >
                        <p className="text-sm text-gray-700 italic leading-relaxed">
                          &quot;{firstTestimonial.content}&quot;
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          — {firstTestimonial.authorName}
                          {firstTestimonial.relationship &&
                            `, ${firstTestimonial.relationship}`}
                        </p>
                      </div>
                    )}
                    {approvedTestimonials.length > 1 && (
                      <button
                        className={cn(
                          'text-xs font-medium mt-2',
                          THEME.accentText
                        )}
                        onClick={() => {
                          setMobileViewLayout('detailed');
                          setActiveTab('essence');
                        }}
                      >
                        {dict.display.content.friendTestimonials.focusSubtitle.replace(
                          '{{count}}',
                          approvedTestimonials.length.toString()
                        )}
                      </button>
                    )}
                  </div>
                )}

              {/* Traits & hobbies chips */}
              {hasUniqueTraitsOrHobbies && (
                <div className="space-y-3">
                  {profile.profileCharacterTraits &&
                    profile.profileCharacterTraits.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            {displayDict.content.focus.myTraits}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.profileCharacterTraits
                            .slice(0, 4)
                            .map((trait) => {
                              const traitData = formatEnumValue(
                                trait,
                                characterTraitMap,
                                trait,
                                true
                              );
                              return (
                                <Badge
                                  key={trait}
                                  variant="outline"
                                  className="text-xs px-2.5 py-1 bg-white border-gray-200 text-gray-700 rounded-full"
                                >
                                  {traitData.shortLabel || traitData.label}
                                </Badge>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  {profile.profileHobbies &&
                    profile.profileHobbies.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            {displayDict.content.focus.whatILove}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.profileHobbies
                            .slice(0, 4)
                            .map((hobby) => {
                              const hobbyData = formatEnumValue(
                                hobby,
                                hobbiesMap,
                                hobby,
                                true
                              );
                              return (
                                <Badge
                                  key={hobby}
                                  variant="outline"
                                  className="text-xs px-2.5 py-1 bg-white border-gray-200 text-gray-700 rounded-full"
                                >
                                  {hobbyData.shortLabel || hobbyData.label}
                                </Badge>
                              );
                            })}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* CTA button */}
              <div className="pt-2 pb-4">
                <Button
                  onClick={() => setMobileViewLayout('detailed')}
                  className={cn(
                    'w-full text-white rounded-full py-3 text-sm font-semibold',
                    THEME.accentBg,
                    THEME.accentBgHover
                  )}
                >
                  <Eye
                    className={cn(
                      'w-4 h-4 flex-shrink-0',
                      direction === 'rtl' ? 'ml-2' : 'mr-2'
                    )}
                  />
                  {displayDict.content.focus.letsGetToKnow}
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  };

  // --- Main render ---
  return (
    <Card
      dir={direction}
      id="profile-card-container"
      className={cn(
        'w-full h-full overflow-hidden flex flex-col max-w-full min-w-0',
        'bg-white border border-gray-100 rounded-2xl',
        className
      )}
      style={{
        textAlign: direction === 'rtl' ? 'right' : 'left',
        overflow: 'hidden',
      }}
    >
      {isDesktop && onClose && (
        <div
          className={cn(
            'absolute top-4 z-40',
            direction === 'rtl' ? 'left-4' : 'right-4'
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'text-gray-500 hover:text-gray-700 bg-white/80 hover:bg-white rounded-full shadow-sm',
              'w-10 h-10 min-h-[44px] min-w-[44px]'
            )}
            onClick={handleClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      )}

      {isDesktop ? (
        <DesktopLayout />
      ) : (
        <div className="flex flex-col h-full w-full max-w-full min-w-0 overflow-hidden">
          <MobileHeader
            direction={direction}
            displayDict={displayDict}
            mobileViewLayout={mobileViewLayout}
            setMobileViewLayout={setMobileViewLayout}
            handleClose={handleClose}
          />
          {mobileViewLayout === 'detailed' ? (
            <DetailedMobileLayout />
          ) : (
            <FocusMobileLayout />
          )}
        </div>
      )}

      <ImageDialog
        selectedImage={selectedImageForDialog}
        currentIndex={currentDialogImageIndex}
        orderedImages={orderedImages}
        onClose={handleCloseImageDialog}
        onNavigate={handleDialogNav}
        onImageSelect={setSelectedImageForDialog}
        dict={displayDict.imageDialog}
        direction={direction}
        THEME={THEME}
      />
    </Card>
  );
};

export default ProfileCard;
