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
  MessageSquareQuote,
  MapPin,
  Phone as PhoneIcon,
} from 'lucide-react';

// Hook
import { useProfileCard } from './hooks/useProfileCard';

// Extracted components
import ProfileHeader from './components/header/ProfileHeader';
import SfInsightsStrip from './components/header/SfInsightsStrip';
import MobileImageGallery from './components/gallery/MobileImageGallery';
import ImageDialog from './components/gallery/ImageDialog';
import MobileHeader from './components/navigation/MobileHeader';
import MainContentTabs from './components/tabs/MainContentTabs';

// Utilities & types
import { formatEnumValue } from './utils/formatters';
import { BRAND } from './constants/theme';
import type { ProfileCardProps } from './types/profileCard';

const ProfileCard: React.FC<ProfileCardProps> = ({
  profile: profileData,
  isProfileComplete,
  images = [],
  questionnaire,
  sfAnswers,
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
    sfAnswers,
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
    isOwnProfile,
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
    isOwnProfile,
    mobileViewLayout,
    contentScrollAreaRef,
    personalityAnswers,
    valuesAnswers,
    religionAnswers,
    relationshipAnswers,
    partnerAnswers,
    sfAnswers,
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
          'w-full bg-white rounded-2xl overflow-hidden border border-gray-100 flex flex-col h-full min-h-[600px]',
          className
        )}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        </div>
        <div className="flex flex-col flex-1">
          <Skeleton className="w-full h-[380px]" />
          <div className="flex-1 p-6 space-y-4">
            <Skeleton className="h-6 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>
      </Card>
    );
  }

  // --- Desktop Layout: Hero Image Top + Content Below ---
  const DesktopLayout = () => (
    <div className="flex flex-col flex-grow min-h-0 max-w-full">
      {/* Hero photo section */}
      <div
        className="relative w-full flex-shrink-0 bg-gray-100 overflow-hidden group cursor-pointer"
        style={{ height: '450px' }}
        onClick={() =>
          orderedImages.length > 0 && handleOpenImageDialog(orderedImages[0])
        }
      >
        {mainImageToDisplay?.url ? (
          <Image
            src={getRelativeCloudinaryPath(mainImageToDisplay.url)}
            alt={profile.user?.firstName || ''}
            fill
            className="object-cover object-[50%_30%] transition-transform duration-500 group-hover:scale-[1.02]"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <Camera className="w-16 h-16 text-gray-300" />
          </div>
        )}

        {/* Name overlay on gradient */}
        <div
          className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent px-6 pb-5 pt-24"
          dir={direction}
        >
          <h1 className="text-3xl font-bold text-white drop-shadow-md">
            {profile.user?.firstName
              ? `${profile.user.firstName} ${profile.user.lastName || ''}`.trim()
              : ''}
            {age > 0 ? `, ${age}` : ''}
          </h1>
          {(() => {
            const subtitleParts = [
              profile.occupation,
              profile.city,
            ].filter(Boolean);
            return subtitleParts.length > 0 ? (
              <p className="text-base text-white/90 mt-1 flex items-center gap-2 flex-wrap">
                {profile.city && (
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                )}
                {subtitleParts.join(' · ')}
              </p>
            ) : null;
          })()}
          <div className="mt-2 flex items-center gap-2">
            <span
              className={cn(
                'w-2.5 h-2.5 rounded-full flex-shrink-0',
                availability.dotColor
              )}
            />
            <span className="text-sm text-white/85">
              {availability.text}
            </span>
          </div>
        </div>

        {/* Image count badge */}
        {orderedImages.length > 1 && (
          <div
            className={cn(
              'absolute top-3 z-10',
              direction === 'rtl' ? 'left-3' : 'right-3'
            )}
          >
            <Badge className="bg-black/40 backdrop-blur-md text-white border-0 text-xs px-2.5 py-1 gap-1.5 shadow-sm">
              <Camera className="w-3 h-3" />
              <span>{orderedImages.length}</span>
            </Badge>
          </div>
        )}
      </div>

      {/* Thumbnail strip below hero */}
      {orderedImages.length > 1 && (
        <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-3" dir={direction}>
          <div className="flex gap-2">
            {orderedImages.slice(0, 6).map((img, idx) => (
              <div
                key={img.id}
                className={cn(
                  'relative w-14 h-14 rounded-lg overflow-hidden cursor-pointer flex-shrink-0 transition-all duration-200',
                  'border-2 hover:scale-105',
                  idx === 0
                    ? 'border-teal-500 ring-1 ring-teal-200'
                    : 'border-gray-200 hover:border-teal-300'
                )}
                onClick={() => handleOpenImageDialog(img)}
              >
                <Image
                  src={getRelativeCloudinaryPath(img.url)}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
            ))}
            {orderedImages.length > 6 && (
              <div
                className="relative w-14 h-14 rounded-lg overflow-hidden cursor-pointer flex-shrink-0 bg-gray-100 flex items-center justify-center border-2 border-gray-200 hover:border-teal-300 transition-all duration-200 hover:scale-105"
                onClick={() => handleOpenImageDialog(orderedImages[6])}
              >
                <span className="text-gray-600 text-sm font-semibold">
                  +{orderedImages.length - 6}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content panel below hero */}
      <div className="flex-1 min-h-0 flex flex-col bg-white" dir={direction}>
        <ScrollArea className="flex-1 min-h-0">
          {/* Matchmaker actions bar */}
          {effectiveViewMode === 'matchmaker' && (
            <div className="px-6 pt-4 pb-2 flex items-center gap-3 flex-wrap border-b border-gray-100">
              {profile.user?.phone && (
                <a
                  href={`tel:${profile.user.phone}`}
                  className="text-sm text-teal-600 hover:underline flex items-center gap-1.5"
                  dir="ltr"
                >
                  <PhoneIcon className="w-4 h-4 text-teal-500 flex-shrink-0" />
                  {profile.user.phone}
                </a>
              )}
              <Button
                onClick={() => setIsSuggestDialogOpen(true)}
                className={cn(
                  'text-white rounded-full px-5 py-2 transition-all shadow-sm hover:shadow-md text-sm',
                  BRAND.primaryBg,
                  BRAND.primaryBgHover
                )}
              >
                <Heart
                  className={cn(
                    'w-4 h-4 flex-shrink-0',
                    direction === 'rtl' ? 'ml-2' : 'mr-2'
                  )}
                />
                {displayDict.header.suggestMatchButton}
              </Button>
            </div>
          )}
          {/* NeshamaTech summary */}
          {profile.isNeshamaTechSummaryVisible && profile.manualEntryText && (
            <p
              className={cn(
                'mx-6 mt-4 text-sm text-gray-600 italic leading-relaxed',
                direction === 'rtl'
                  ? 'border-r-2 border-gray-200 pr-3'
                  : 'border-l-2 border-gray-200 pl-3'
              )}
            >
              {profile.manualEntryText}
            </p>
          )}
          {sfAnswers && (
            <SfInsightsStrip
              sfAnswers={sfAnswers}
              gender={profile.gender}
              locale={locale}
              direction={direction}
            />
          )}
          <div className="px-6 pb-6 pt-2">
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
        {sfAnswers && (
          <SfInsightsStrip
            sfAnswers={sfAnswers}
            gender={profile.gender}
            locale={locale}
            direction={direction}
          />
        )}
        <div className="p-3 sm:p-4 min-w-0 max-w-full bg-gray-50/50">
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

            <div className="px-4 py-4 space-y-5" dir={direction}>
              {/* Headline */}
              {profile.profileHeadline && (
                <div className={cn('py-3 px-4 rounded-xl', THEME.accentBgLight)}>
                  <p className={cn(
                    'text-center text-base italic font-medium',
                    THEME.accentTextDark
                  )}>
                    &quot;{profile.profileHeadline}&quot;
                  </p>
                </div>
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
                        'text-sm font-semibold mt-2',
                        BRAND.primaryText,
                        BRAND.primaryTextHover
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
                          'bg-gray-50 rounded-xl p-4',
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
                          BRAND.primaryText,
                          BRAND.primaryTextHover
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
                                  className="text-xs px-2.5 py-1 bg-purple-50/60 border-purple-200/80 text-purple-700 rounded-full"
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
                                  className="text-xs px-2.5 py-1 bg-emerald-50/60 border-emerald-200/80 text-emerald-700 rounded-full"
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
              <div className="pt-3 pb-6">
                <Button
                  onClick={() => setMobileViewLayout('detailed')}
                  className={cn(
                    'w-full text-white rounded-full py-3 text-sm font-semibold shadow-md hover:shadow-lg transition-all',
                    BRAND.ctaGradient,
                    BRAND.ctaGradientHover
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
        'bg-white border border-gray-200/60 rounded-2xl',
        'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06),0_8px_32px_rgba(0,0,0,0.04)]',
        // Immersive: ensure minimum height
        'min-h-[500px] lg:min-h-[600px]',
        // Entrance animation
        'animate-in fade-in-0 zoom-in-[0.98] duration-300',
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
              'text-gray-500 hover:text-gray-700 bg-white/90 hover:bg-white rounded-full shadow-sm hover:shadow-md transition-all duration-200',
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
        <div className="relative flex flex-col h-full w-full max-w-full min-w-0 overflow-hidden">
          {onClose && (
            <MobileHeader
              direction={direction}
              displayDict={displayDict}
              handleClose={handleClose}
            />
          )}
          <DetailedMobileLayout />
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
