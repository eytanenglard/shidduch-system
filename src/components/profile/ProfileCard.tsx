// src/components/profile/ProfileCard.tsx

'use client';

import React from 'react';
import Image from 'next/image';

import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';

// UI Components
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

// Icons
import {
  Heart,
  Eye,
  Briefcase,
  GraduationCap,
  Sparkles,
  X,
  BookMarked,
  Camera,
  Zap,
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
import NeshamaTechSummary from './components/content/NeshamaTechSummary';
import SectionCard from './components/shared/SectionCard';
import DetailItem from './components/shared/DetailItem';
import EmptyState from './components/shared/EmptyState';
import MainContentTabs from './components/tabs/MainContentTabs';

// Utilities & types
import { formatEnumValue, formatBooleanPreference } from './utils/formatters';
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
    selectedPalette,
    setMobileViewLayout,
    setSelectedPalette,
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
    selectedPalette,
    THEME,
    dict: displayDict,
    characterTraitMap,
    hobbiesMap,
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
          'w-full bg-white shadow-2xl rounded-2xl overflow-hidden border-0 flex flex-col h-full',
          className
        )}
      >
        <div
          className={cn(
            'p-4 sm:p-6 border-b border-gray-200/80',
            `bg-gradient-to-r ${THEME.colors.neutral.warm}`
          )}
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <Skeleton className="h-24 w-24 sm:h-36 sm:w-36 rounded-full flex-shrink-0" />
            <div className="flex-grow w-full space-y-4">
              <Skeleton className="h-8 sm:h-12 w-3/4 mx-auto sm:mx-0" />
              <Skeleton className="h-4 sm:h-6 w-1/2 mx-auto sm:mx-0" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-4">
                <Skeleton className="h-10 sm:h-12 w-full rounded-xl" />
                <Skeleton className="h-10 sm:h-12 w-full rounded-xl" />
                <Skeleton className="h-10 sm:h-12 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6 flex-grow">
          <div className="space-y-4" dir={direction}>
            <Skeleton className="h-6 sm:h-8 w-full rounded-xl" />
            <Skeleton className="h-24 sm:h-32 w-full rounded-xl" />
            <Skeleton className="h-16 sm:h-24 w-full rounded-xl" />
          </div>
        </div>
      </Card>
    );
  }

  // --- Desktop Layout ---
  const DesktopLayout = () => (
    <ResizablePanelGroup
      direction="horizontal"
      dir={direction}
      className="flex-grow min-h-0 max-w-full"
    >
      <ResizablePanel
        defaultSize={60}
        minSize={40}
        className="min-w-0 flex flex-col max-w-full overflow-hidden"
      >
        <ScrollArea className="flex-1 min-h-0 max-w-full">
          <ProfileHeader
            {...profileHeaderProps}
            onPaletteChange={setSelectedPalette}
          />
          <div className="p-4 sm:p-6 overflow-hidden flex max-w-full">
            <MainContentTabs isDesktop={true} {...mainContentTabsProps} />
          </div>
        </ScrollArea>
      </ResizablePanel>
      <ResizableHandle
        withHandle
        className={cn(
          'bg-gradient-to-b from-rose-200 to-pink-200 hover:from-rose-300 hover:to-pink-300',
          'transition-all duration-300'
        )}
      />
      <ResizablePanel
        defaultSize={40}
        minSize={25}
        className="min-w-0 flex flex-col max-w-full overflow-hidden"
      >
        <ScrollArea className="flex-grow min-h-0 max-w-full">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 min-w-0 max-w-full">
            <NeshamaTechSummary
              profile={profile}
              dict={displayDict}
              THEME={THEME}
              direction={direction}
            />
            <SectionCard
              title={displayDict.gallery.title.replace(
                '{{name}}',
                profile.user?.firstName || 'המועמד'
              )}
              subtitle={displayDict.gallery.subtitle}
              icon={Camera}
              variant="elegant"
              gradient={THEME.colors.primary.main}
              className="min-w-0 max-w-full"
            >
              {orderedImages.length > 0 ? (
                <div className="space-y-4 min-w-0 max-w-full">
                  <div
                    className="relative aspect-video rounded-2xl overflow-hidden cursor-pointer group border-2 sm:border-3 border-white shadow-lg hover:shadow-xl transition-all duration-300 max-w-full"
                    onClick={() => handleOpenImageDialog(orderedImages[0])}
                  >
                    <Image
                      src={getRelativeCloudinaryPath(orderedImages[0].url)}
                      alt={displayDict.gallery.imageAlt.replace(
                        '{{index}}',
                        '1'
                      )}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="35vw"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-center text-white">
                        <Eye className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2" />
                        <p className="font-bold text-sm sm:text-base">
                          {displayDict.gallery.subtitle}
                        </p>
                      </div>
                    </div>
                  </div>
                  {orderedImages.length > 1 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 min-w-0 max-w-full">
                      {orderedImages.slice(1, 7).map((img, idx) => (
                        <div
                          key={img.id}
                          className="relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-rose-400 transition-all duration-300 shadow-md hover:shadow-lg max-w-full"
                          onClick={() => handleOpenImageDialog(img)}
                        >
                          <Image
                            src={getRelativeCloudinaryPath(img.url)}
                            alt={displayDict.gallery.imageAlt.replace(
                              '{{index}}',
                              (idx + 2).toString()
                            )}
                            fill
                            className="object-cover hover:scale-110 transition-transform duration-300"
                            sizes="15vw"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={Camera}
                  title={displayDict.content.emptyStateTitle}
                  description={displayDict.content.emptyStateDescription}
                  variant="romantic"
                  THEME={THEME}
                />
              )}
            </SectionCard>
          </div>
        </ScrollArea>
      </ResizablePanel>
    </ResizablePanelGroup>
  );

  // --- Detailed Mobile Layout ---
  const DetailedMobileLayout = () => (
    <ScrollArea className="flex-1 min-h-0 max-w-full overflow-hidden">
      <div className="flex flex-col min-w-0 max-w-full">
        <ProfileHeader
          {...profileHeaderProps}
          isMobile={true}
          compact={false}
        />
        <MobileImageGallery
          orderedImages={orderedImages}
          profile={profile}
          onImageClick={handleOpenImageDialog}
          THEME={THEME}
          dict={displayDict.gallery}
          compact={false}
          direction={direction}
        />
        <div
          className={cn(
            'p-3 sm:p-4 min-w-0 max-w-full overflow-hidden',
            `bg-gradient-to-br ${THEME.colors.neutral.cool}`
          )}
        >
          <MainContentTabs isDesktop={false} {...mainContentTabsProps} />
        </div>
      </div>
    </ScrollArea>
  );

  // --- Focus Mobile Layout ---
  const FocusMobileLayout = () => (
    <div className="flex-1 min-h-0 flex flex-col max-w-full overflow-hidden">
      <ScrollArea className="flex-1 min-h-0 max-w-full">
        <div className="pb-4 px-2 sm:px-3 min-w-0 max-w-full overflow-hidden">
          <ProfileHeader
            {...profileHeaderProps}
            isMobile={true}
            onPaletteChange={setSelectedPalette}
            compact={true}
          />
          <MobileImageGallery
            orderedImages={orderedImages}
            profile={profile}
            onImageClick={handleOpenImageDialog}
            THEME={THEME}
            dict={displayDict.gallery}
            compact={true}
            direction={direction}
          />
          <div
            className={cn(
              'px-2 sm:px-3 py-2 space-y-3 sm:space-y-4 min-w-0 max-w-full overflow-hidden',
              `bg-gradient-to-br ${THEME.colors.neutral.warm}`
            )}
          >
            <NeshamaTechSummary
              profile={profile}
              dict={displayDict}
              THEME={THEME}
              direction={direction}
            />

            {profile.isAboutVisible && profile.about && (
              <SectionCard
                title={displayDict.content.focus.aboutMe}
                subtitle={displayDict.content.focus.myStory}
                icon={Heart}
                variant="romantic"
                gradient={THEME.colors.primary.main}
                compact={true}
              >
                <div className="p-3 text-start">
                  <p className="text-gray-800 leading-relaxed italic font-medium break-words line-clamp-4">
                    {profile.about}
                  </p>
                  <div className="text-center mt-3">
                    <Button
                      variant="link"
                      className={cn(
                        'font-bold',
                        THEME.colors.primary.main.includes('rose')
                          ? 'text-rose-600'
                          : THEME.colors.primary.main.includes('blue')
                            ? 'text-blue-600'
                            : THEME.colors.primary.main.includes('amber')
                              ? 'text-amber-600'
                              : 'text-gray-600'
                      )}
                      onClick={() => setMobileViewLayout('detailed')}
                    >
                      {dict.display.content.focus.readFullStory}{' '}
                      <ArrowLeft className="w-4 h-4 mr-1" />
                    </Button>
                  </div>
                </div>
              </SectionCard>
            )}

            {profile.isFriendsSectionVisible &&
              (profile.testimonials || []).filter(
                (t) => t.status === 'APPROVED'
              ).length > 0 && (
                <SectionCard
                  title={dict.display.content.friendTestimonials.title.replace(
                    '{{name}}',
                    profile.user?.firstName || ''
                  )}
                  subtitle={dict.display.content.friendTestimonials.focusSubtitle.replace(
                    '{{count}}',
                    (profile.testimonials || [])
                      .filter((t) => t.status === 'APPROVED')
                      .length.toString()
                  )}
                  icon={MessageSquareQuote}
                  variant="default"
                  compact={true}
                >
                  <div className="text-center p-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setMobileViewLayout('detailed');
                        setActiveTab('essence');
                      }}
                    >
                      {dict.display.content.friendTestimonials.viewButton}
                    </Button>
                  </div>
                </SectionCard>
              )}

            <SectionCard
              title={displayDict.content.focus.quickSummary}
              subtitle={displayDict.content.focus.importantDetails}
              icon={Zap}
              variant="elegant"
              gradient={THEME.colors.primary.gold}
              compact={true}
              className="min-w-0 max-w-full"
            >
              <div className="grid grid-cols-1 gap-2 sm:gap-3 min-w-0 max-w-full">
                {(() => {
                  const religiousLevelData = profile.religiousLevel
                    ? formatEnumValue(
                        profile.religiousLevel,
                        religiousLevelMap,
                        displayDict.placeholders.willDiscover
                      )
                    : null;
                  if (
                    religiousLevelData &&
                    religiousLevelData.label?.trim() &&
                    religiousLevelData.label !==
                      displayDict.placeholders.willDiscover
                  ) {
                    return (
                      <DetailItem
                        icon={BookMarked}
                        label={dict.display.keyFacts.outlook}
                        value={religiousLevelData.label}
                        variant="highlight"
                        size="sm"
                        useMobileLayout={true}
                        textAlign="center"
                        placeholder={displayDict.placeholders.willDiscover}
                      />
                    );
                  }
                  return null;
                })()}
                {profile.shomerNegiah !== null &&
                  profile.shomerNegiah !== undefined && (
                    <DetailItem
                      icon={Heart}
                      label={displayDict.content.detailLabels.shomerNegiah}
                      value={
                        formatBooleanPreference(profile.shomerNegiah, {
                          ...displayDict.booleanPrefs,
                          willDiscover: displayDict.placeholders.willDiscover,
                        }).label
                      }
                      variant="elegant"
                      size="sm"
                      useMobileLayout={true}
                      placeholder={displayDict.placeholders.willDiscover}
                    />
                  )}
                {profile.occupation && (
                  <DetailItem
                    icon={Briefcase}
                    label={dict.display.keyFacts.occupation}
                    value={
                      profile.occupation ||
                      displayDict.placeholders.willDiscover
                    }
                    variant="elegant"
                    size="sm"
                    useMobileLayout={true}
                    placeholder={displayDict.placeholders.willDiscover}
                  />
                )}
                {profile.educationLevel && (
                  <DetailItem
                    icon={GraduationCap}
                    label={displayDict.content.detailLabels.educationLevel}
                    value={
                      formatEnumValue(
                        profile.educationLevel,
                        educationLevelMap,
                        displayDict.placeholders.willDiscover
                      ).label
                    }
                    variant="elegant"
                    size="sm"
                    useMobileLayout={true}
                    placeholder={displayDict.placeholders.willDiscover}
                  />
                )}
              </div>
            </SectionCard>
            {hasUniqueTraitsOrHobbies && (
              <SectionCard
                title={displayDict.content.focus.whatMakesMeUnique}
                subtitle={displayDict.content.focus.traitsAndHobbies}
                icon={Sparkles}
                variant="romantic"
                gradient={THEME.colors.primary.romantic}
                compact={true}
                className="min-w-0 max-w-full"
              >
                <div className="space-y-4 sm:space-y-5 min-w-0 max-w-full">
                  {profile.profileCharacterTraits &&
                    profile.profileCharacterTraits.length > 0 && (
                      <div className="min-w-0 max-w-full">
                        <h4 className="text-sm font-bold text-purple-700 mb-2 sm:mb-3 flex items-center justify-center gap-2">
                          <span className="break-words">
                            {displayDict.content.focus.myTraits}
                          </span>
                          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        </h4>
                        <div className="flex flex-wrap gap-2 min-w-0 max-w-full justify-center">
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
                                  className={cn(
                                    'flex items-center gap-1 px-2 py-1 text-xs font-semibold min-w-0 max-w-full',
                                    `bg-gradient-to-r ${THEME.colors.secondary.lavender} text-purple-800`,
                                    'border border-purple-200 rounded-full',
                                    'break-words'
                                  )}
                                >
                                  <traitData.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                                  <span className="break-words min-w-0 overflow-hidden">
                                    {traitData.shortLabel || traitData.label}
                                  </span>
                                </Badge>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  {profile.profileHobbies &&
                    profile.profileHobbies.length > 0 && (
                      <div className="min-w-0 max-w-full">
                        <h4 className="text-sm font-bold text-emerald-700 mb-2 sm:mb-3 flex items-center justify-center gap-2">
                          <span className="break-words">
                            {displayDict.content.focus.whatILove}
                          </span>
                          <Heart className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        </h4>
                        <div className="flex flex-wrap gap-2 min-w-0 max-w-full justify-center">
                          {profile.profileHobbies.slice(0, 4).map((hobby) => {
                            const hobbyData = formatEnumValue(
                              hobby,
                              hobbiesMap,
                              hobby,
                              true
                            );
                            return (
                              <Badge
                                key={hobby}
                                className={cn(
                                  'flex items-center gap-1 px-2 py-1 text-xs font-semibold min-w-0 max-w-full',
                                  `bg-gradient-to-r ${THEME.colors.secondary.sage} text-emerald-800`,
                                  'border border-emerald-200 rounded-full',
                                  'break-words'
                                )}
                              >
                                <hobbyData.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                                <span className="break-words min-w-0 overflow-hidden">
                                  {hobbyData.shortLabel || hobbyData.label}
                                </span>
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                </div>
              </SectionCard>
            )}
            <div
              className={cn(
                'bg-white hover:bg-gray-50 font-bold rounded-full min-h-[44px]',
                'px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base',
                THEME.colors.primary.main.includes('rose')
                  ? 'text-rose-700'
                  : THEME.colors.primary.main.includes('blue')
                    ? 'text-blue-700'
                    : THEME.colors.primary.main.includes('amber')
                      ? 'text-amber-700'
                      : 'text-gray-700',
                THEME.shadows.warm
              )}
            >
              <h3 className="text-base sm:text-lg font-bold mb-2 break-words">
                {displayDict.content.focus.wantToKnowMore}
              </h3>
              <p className="mb-3 sm:mb-4 opacity-90 text-sm break-words">
                {displayDict.content.focus.moreToDiscover}
              </p>
              <Button
                onClick={() => setMobileViewLayout('detailed')}
                className={cn(
                  'bg-white text-gray-600 hover:bg-gray-50 font-bold rounded-full min-h-[44px]',
                  'px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base',
                  THEME.shadows.warm
                )}
              >
                <Eye
                  className={cn(
                    'w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0',
                    direction === 'rtl' ? 'ml-2' : 'mr-2'
                  )}
                />
                <span className="break-words">
                  {displayDict.content.focus.letsGetToKnow}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );

  // --- Main render ---
  return (
    <TooltipProvider>
      <Card
        dir={direction}
        id="profile-card-container"
        className={cn(
          'w-full h-full overflow-hidden flex flex-col max-w-full min-w-0',
          `bg-gradient-to-br ${THEME.colors.neutral.elegant}`,
          THEME.shadows.elegant,
          '[&_*]:box-border [&_*]:max-w-full',
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'text-gray-600 hover:text-gray-800 bg-white/80 hover:bg-white/90 rounded-full shadow-lg hover:shadow-xl transition-all duration-300',
                    'w-10 h-10 sm:w-12 sm:h-12 min-h-[44px] min-w-[44px]'
                  )}
                  onClick={handleClose}
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{displayDict.mobileNav.closePreview}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {isDesktop ? (
          <DesktopLayout />
        ) : (
          <div className="flex flex-col h-full w-full max-w-full min-w-0 overflow-hidden">
            <MobileHeader
              direction={direction}
              THEME={THEME}
              displayDict={displayDict}
              mobileViewLayout={mobileViewLayout}
              setMobileViewLayout={setMobileViewLayout}
              selectedPalette={selectedPalette}
              setSelectedPalette={setSelectedPalette}
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
    </TooltipProvider>
  );
};

export default ProfileCard;
