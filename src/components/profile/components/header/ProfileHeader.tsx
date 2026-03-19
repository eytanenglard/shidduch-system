'use client';

import React, { useMemo } from 'react';
import {
  MapPin,
  Cake,
  Ruler,
  Languages,
  Phone as PhoneIcon,
  Heart,
  ArrowRight,
  ArrowLeft,
  Quote,
  Camera,
  BookMarked,
  Briefcase,
} from 'lucide-react';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ThemeType, ColorPaletteName } from '../../constants/theme';
import { ProfileCardDisplayDict } from '@/types/dictionary';
import { UserProfile, UserImage as UserImageType } from '@/types/next-auth';
import { ExcitementFactor } from '../../types/profileCard';
import {
  formatEnumValue,
  getInitials,
  formatAvailabilityStatus,
} from '../../utils/formatters';
import {
  createCharacterTraitMap,
  createHobbiesMap,
  createReligiousLevelMap,
  createEducationLevelMap,
} from '../../utils/maps';
import ColorPaletteSelector from '../navigation/ColorPaletteSelector';
import KeyFactCard from './KeyFactCard';

const ProfileHeader: React.FC<{
  profile: UserProfile;
  age: number;
  mainImageToDisplay: UserImageType | null;
  availability: ReturnType<typeof formatAvailabilityStatus>;
  viewMode: 'matchmaker' | 'candidate';
  onSuggestClick: () => void;
  isMobile?: boolean;
  selectedPalette: ColorPaletteName;
  onPaletteChange?: (palette: ColorPaletteName) => void;
  THEME: ThemeType;
  dict: ProfileCardDisplayDict;
  compact?: boolean;
  characterTraitMap: ReturnType<typeof createCharacterTraitMap>;
  hobbiesMap: ReturnType<typeof createHobbiesMap>;
  religiousLevelMap: ReturnType<typeof createReligiousLevelMap>;
  educationLevelMap: ReturnType<typeof createEducationLevelMap>;
  locale: string;
  // --- תוספות חדשות ---
  totalImages: number;
  onAvatarClick: () => void;
}> = ({
  profile,
  age,
  mainImageToDisplay,
  availability,
  viewMode,
  onSuggestClick,
  isMobile = false,
  selectedPalette,
  onPaletteChange,
  THEME,
  dict,
  compact = false,
  characterTraitMap,
  hobbiesMap,
  religiousLevelMap,
  locale,
  totalImages,
  onAvatarClick,
}) => {
  const direction = locale === 'he' ? 'rtl' : 'ltr';

  const personalityHighlights = useMemo(() => {
    const highlights: ExcitementFactor[] = [];
    if (profile.profileCharacterTraits?.length > 0) {
      const trait = profile.profileCharacterTraits[0];
      const traitData = formatEnumValue(
        trait,
        characterTraitMap,
        trait,
        isMobile
      );
      highlights.push({
        icon: traitData.icon,
        text: traitData.label,
        shortText: traitData.shortLabel || traitData.label,
        gradient: THEME.colors.primary.light,
      });
    }

    if (profile.profileHobbies?.length > 0) {
      const hobby = profile.profileHobbies[0];
      const hobbyData = formatEnumValue(hobby, hobbiesMap, hobby, isMobile);
      highlights.push({
        icon: hobbyData.icon,
        text: hobbyData.label,
        shortText: hobbyData.shortLabel || hobbyData.label,
        gradient: THEME.colors.secondary.sage,
      });
    }

    if (profile.city) {
      const cityText = `גר/ה ב${profile.city}`;
      highlights.push({
        icon: MapPin,
        text: cityText,
        shortText:
          isMobile && cityText.length > 15 ? `${profile.city}` : cityText,
        gradient: THEME.colors.secondary.sky,
      });
    }

    return highlights.slice(0, 3);
  }, [
    profile.profileCharacterTraits,
    profile.profileHobbies,
    profile.city,
    isMobile,
    THEME.colors.primary.light,
    THEME.colors.secondary.sage,
    THEME.colors.secondary.sky,
    characterTraitMap,
    hobbiesMap,
  ]);

  const spokenLanguages = useMemo(() => {
    const rawLangs = [
      profile.nativeLanguage,
      ...(profile.additionalLanguages || []),
    ].filter((l): l is string => !!l);

    const langMap: Record<string, string> = {
      hebrew: 'עברית',
      english: 'אנגלית',
      russian: 'רוסית',
      french: 'צרפתית',
      spanish: 'ספרדית',
      amharic: 'אמהרית',
      arabic: 'ערבית',
      german: 'גרמנית',
      italian: 'איטלקית',
    };

    return rawLangs
      .map((lang) => {
        if (locale === 'he') {
          return langMap[lang.toLowerCase()] || lang;
        }
        return lang.charAt(0).toUpperCase() + lang.slice(1);
      })
      .join(', ');
  }, [profile.nativeLanguage, profile.additionalLanguages, locale]);

  return (
    <div className="relative overflow-hidden">
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br',
          THEME.colors.neutral.warm
        )}
      >
        <div
          className={cn(
            'absolute bg-gradient-to-br from-rose-200/40 to-pink-200/40 rounded-full blur-xl sm:blur-2xl animate-pulse',
            compact
              ? 'top-2 end-2 w-8 h-8 sm:w-16 sm:h-16'
              : 'top-4 end-4 sm:top-10 sm:end-10 w-16 h-16 sm:w-32 sm:h-32'
          )}
        ></div>
        <div
          className={cn(
            'absolute bg-gradient-to-br from-amber-200/40 to-orange-200/40 rounded-full blur-lg sm:blur-xl animate-pulse',
            compact
              ? 'bottom-2 start-2 w-6 h-6 sm:w-12 sm:h-12'
              : 'bottom-4 start-4 sm:bottom-10 sm:start-10 w-12 h-12 sm:w-24 sm:h-24'
          )}
          style={{ animationDelay: '1s' }}
        ></div>
        <div
          className={cn(
            'absolute bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-md sm:blur-lg animate-pulse',
            compact
              ? 'top-1/2 left-1/2 w-4 h-4 sm:w-8 sm:h-8'
              : 'top-1/2 left-1/2 w-8 h-8 sm:w-20 sm:h-20'
          )}
          style={{ animationDelay: '2s' }}
        ></div>
      </div>

      <div
        className={cn(
          'relative z-10',
          compact ? 'p-2 sm:p-3' : 'p-3 sm:p-4 md:p-6'
        )}
      >
        <div
          className={cn(
            'flex items-start',
            isMobile
              ? 'flex-col items-center text-center gap-3 sm:gap-4'
              : 'flex-row gap-4 sm:gap-6'
          )}
        >
          {/* אזור התמונה */}
          <div className="relative flex-shrink-0 group">
            {/* באדג' כמות תמונות - מוצג רק אם יש יותר מתמונה אחת */}
            {totalImages > 1 && (
              <div className="absolute top-0 right-0 z-30 pointer-events-none">
                <Badge className="bg-gray-900/80 text-white border-white/40 hover:bg-gray-900/80 gap-1 px-1.5 py-0.5 text-[10px] sm:text-xs backdrop-blur-sm shadow-md">
                  <Camera className="w-3 h-3" />
                  <span>{totalImages}</span>
                </Badge>
              </div>
            )}

            <div
              onClick={onAvatarClick}
              className={cn(
                'relative rounded-full overflow-hidden border-2 sm:border-4 border-white shadow-lg sm:shadow-2xl ring-2 sm:ring-4 ring-rose-200/50 transition-all duration-300',
                totalImages > 0 ? 'cursor-pointer hover:scale-105' : '',
                compact
                  ? 'h-32 w-32 sm:h-36 sm:w-36 md:h-40 md:w-40'
                  : isMobile
                    ? 'h-36 w-36 sm:h-40 sm:w-40 md:h-44 md:w-44'
                    : 'h-20 w-20 sm:h-24 sm:w-24 md:h-32 md:w-32 lg:h-36 lg:w-36',
                THEME.shadows.elegant
              )}
            >
              {mainImageToDisplay?.url ? (
                <>
                  <Image
                    src={getRelativeCloudinaryPath(mainImageToDisplay.url)}
                    alt={dict.header.profileImageAlt.replace(
                      '{{name}}',
                      `${profile.user?.firstName || ''} ${profile.user?.lastName || ''}`.trim()
                    )}
                    fill
                    className="object-cover transition-transform duration-700"
                    sizes={compact ? '160px' : isMobile ? '176px' : '144px'}
                    priority
                  />
                  {/* Overlay למעבר עכבר - מראה אייקון מצלמה */}
                  {totalImages > 0 && (
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Camera className="text-white w-8 h-8 drop-shadow-md" />
                    </div>
                  )}
                </>
              ) : (
                <div
                  className={cn(
                    'w-full h-full flex items-center justify-center',
                    `bg-gradient-to-br ${THEME.colors.primary.romantic}`
                  )}
                >
                  <span
                    className={cn(
                      'font-bold text-white',
                      compact
                        ? 'text-xl sm:text-2xl'
                        : 'text-3xl sm:text-4xl lg:text-6xl'
                    )}
                  >
                    {getInitials(
                      profile.user?.firstName,
                      profile.user?.lastName,
                      compact ? 1 : 2
                    )}
                  </span>
                </div>
              )}
            </div>

            <div
              className={cn(
                'absolute transition-all duration-300 z-20',
                compact ? '-bottom-1 -end-1' : '-bottom-2 -end-2'
              )}
            >
              <Badge
                className={cn(
                  'font-bold text-white border-0 transition-all duration-300 hover:scale-110',
                  compact
                    ? 'text-xs px-2 py-1'
                    : 'text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2',
                  isMobile
                    ? availability.bgColorSm || availability.bgColor
                    : availability.bgColor,
                  availability.pulse && 'animate-pulse',
                  THEME.shadows.warm
                )}
              >
                <availability.icon
                  className={cn(
                    'flex-shrink-0',
                    compact ? 'w-2 h-2 me-1' : 'w-3 h-3 me-1 sm:me-1.5'
                  )}
                />
                <span className={cn('break-words')}>
                  {isMobile && compact
                    ? availability.shortText || availability.text
                    : isMobile
                      ? availability.shortText || availability.text
                      : availability.text}
                </span>
              </Badge>
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-center items-center text-center w-full">
            {!isMobile && onPaletteChange && (
              <div className="flex justify-end mb-2 sm:mb-3 w-full">
                <ColorPaletteSelector
                  selectedPalette={selectedPalette}
                  onPaletteChange={onPaletteChange}
                  THEME={THEME}
                  dict={dict.colorPalette}
                  compact={compact}
                  direction={direction}
                />
              </div>
            )}
            <div
              className={cn(
                'w-full overflow-hidden',
                compact ? 'mb-2 sm:mb-3' : 'mb-3 sm:mb-4',
                'text-center'
              )}
            >
              <h1
                className={cn(
                  'font-extrabold leading-tight transition-all duration-300',
                  compact
                    ? 'text-sm sm:text-base md:text-lg'
                    : isMobile
                      ? 'text-lg sm:text-xl md:text-2xl'
                      : 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
                  'break-words hyphens-auto word-break-break-word overflow-wrap-anywhere',
                  'text-center max-w-full overflow-hidden',
                  'px-1 sm:px-2',
                  'text-gray-800'
                )}
              >
                {profile.user?.firstName
                  ? dict.header.storyOf.replace(
                      '{{name}}',
                      `${profile.user.firstName} ${profile.user.lastName || ''}`.trim()
                    )
                  : dict.placeholders.storyWaiting}
              </h1>

              <div
                className={cn(
                  'flex items-center justify-center gap-3 flex-wrap',
                  'justify-center',
                  'mt-2 sm:mt-3'
                )}
              >
                {age > 0 && (
                  <div className="flex items-center gap-1">
                    <Cake
                      className={cn(
                        'text-blue-500 flex-shrink-0',
                        compact ? 'w-3 h-3' : 'w-4 h-4 sm:w-5 sm:h-5'
                      )}
                    />
                    <span
                      className={cn(
                        'font-semibold text-gray-700',
                        compact
                          ? 'text-xs sm:text-sm'
                          : 'text-sm sm:text-base md:text-lg'
                      )}
                    >
                      {dict.header.ageLabel.replace('{{age}}', age.toString())}
                    </span>
                  </div>
                )}

                {profile.height && (
                  <div className="flex items-center gap-1 border-s ps-3 border-gray-300">
                    <Ruler
                      className={cn(
                        'text-blue-500 flex-shrink-0',
                        compact ? 'w-3 h-3' : 'w-4 h-4 sm:w-5 sm:h-5'
                      )}
                    />
                    <span
                      className={cn(
                        'font-semibold text-gray-700',
                        compact
                          ? 'text-xs sm:text-sm'
                          : 'text-sm sm:text-base md:text-lg'
                      )}
                    >
                      {dict.header.heightLabel.replace(
                        '{{height}}',
                        profile.height.toString()
                      )}
                    </span>
                  </div>
                )}
                {spokenLanguages && (
                  <div className="flex items-center gap-1 border-s ps-3 border-gray-300">
                    <Languages
                      className={cn(
                        'text-blue-500 flex-shrink-0',
                        compact ? 'w-3 h-3' : 'w-4 h-4 sm:w-5 sm:h-5'
                      )}
                    />
                    <span
                      className={cn(
                        'font-semibold text-gray-700',
                        compact
                          ? 'text-xs sm:text-sm'
                          : 'text-sm sm:text-base md:text-lg'
                      )}
                    >
                      {dict.header.languagesLabel.replace(
                        '{{languages}}',
                        spokenLanguages
                      )}
                    </span>
                  </div>
                )}

                {viewMode === 'matchmaker' && profile.user?.phone && (
                  <div className="flex items-center gap-1 border-s ps-3 border-gray-300">
                    <PhoneIcon
                      className={cn(
                        'text-teal-500 flex-shrink-0',
                        compact ? 'w-3 h-3' : 'w-4 h-4 sm:w-5 sm:h-5'
                      )}
                    />
                    <a
                      href={`tel:${profile.user.phone}`}
                      className={cn(
                        'font-semibold text-teal-600 hover:text-teal-700 hover:underline transition-all duration-200',
                        compact
                          ? 'text-xs sm:text-sm'
                          : 'text-sm sm:text-base md:text-lg'
                      )}
                      dir="ltr"
                    >
                      {profile.user.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {personalityHighlights.length > 0 && (
              <div
                className={cn(
                  'w-full overflow-hidden',
                  compact ? 'mt-2 mb-2' : 'mt-3 mb-4',
                  'flex justify-center'
                )}
              >
                <ScrollArea className="w-full max-w-full" dir={direction}>
                  <div
                    className={cn(
                      'flex gap-2 sm:gap-3 pb-2 px-1 w-full',
                      'justify-center flex-wrap'
                    )}
                  >
                    {personalityHighlights.map((highlight, index) => (
                      <div
                        key={index}
                        className={cn(
                          'flex items-center bg-white/80 border border-gray-200/50 text-gray-700 font-semibold backdrop-blur-sm flex-shrink-0 transition-all duration-300 hover:scale-105 hover:bg-white/90',
                          compact
                            ? 'gap-1 px-2 py-1 rounded-full text-xs'
                            : 'gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm',
                          THEME.shadows.soft
                        )}
                      >
                        <highlight.icon
                          className={cn(
                            'flex-shrink-0',
                            compact ? 'w-3 h-3' : 'w-3 h-3 sm:w-4 sm:h-4'
                          )}
                        />
                        <span className="whitespace-nowrap font-medium">
                          {isMobile && compact
                            ? highlight.shortText || highlight.text
                            : isMobile
                              ? highlight.shortText || highlight.text
                              : highlight.text}
                        </span>
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            )}

            <div
              className={cn(
                'w-full overflow-hidden',
                compact ? 'mt-2' : 'mt-4 sm:mt-6'
              )}
            >
              <div className="w-full max-w-full overflow-hidden px-1">
                <ScrollArea className="w-full" dir={direction}>
                  <div
                    className={cn(
                      'flex gap-2 sm:gap-3 pb-2 px-1 w-full',
                      'justify-center flex-wrap'
                    )}
                  >
                    {profile.city && (
                      <KeyFactCard
                        icon={MapPin}
                        label={dict.keyFacts.location}
                        value={profile.city}
                        color="rose"
                        compact={compact}
                      />
                    )}
                    {profile.occupation && (
                      <KeyFactCard
                        icon={Briefcase}
                        label={dict.keyFacts.occupation}
                        value={profile.occupation}
                        color="amber"
                        compact={compact}
                      />
                    )}
                    {(() => {
                      const religiousLevelData = profile.religiousLevel
                        ? formatEnumValue(
                            profile.religiousLevel,
                            religiousLevelMap,
                            '',
                            true
                          )
                        : null;
                      if (
                        religiousLevelData &&
                        religiousLevelData.shortLabel?.trim()
                      ) {
                        return (
                          <KeyFactCard
                            icon={BookMarked}
                            label={dict.keyFacts.outlook}
                            value={religiousLevelData.shortLabel}
                            color="purple"
                            compact={compact}
                          />
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            </div>

            {viewMode === 'matchmaker' && (
              <div
                className={cn(
                  'w-full flex max-w-full overflow-hidden',
                  compact ? 'pt-3' : 'pt-4 sm:pt-6',
                  'justify-center px-2'
                )}
              >
                <Button
                  size={compact ? 'default' : 'lg'}
                  className={cn(
                    `bg-gradient-to-r ${THEME.colors.primary.main} hover:${THEME.colors.primary.accent}`,
                    'text-white font-bold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95',
                    compact
                      ? 'px-4 py-2 text-sm max-w-full'
                      : 'px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base max-w-full',
                    'min-h-[44px]'
                  )}
                  onClick={onSuggestClick}
                >
                  <Heart
                    className={cn(
                      'flex-shrink-0',
                      compact ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5',
                      direction === 'rtl' ? 'ml-1 sm:ml-2' : 'mr-1 sm:mr-2'
                    )}
                  />
                  <span className="break-words">
                    {compact
                      ? dict.header.suggestMatchButton
                      : dict.header.suggestPerfectMatchButton}
                  </span>
                  {direction === 'rtl' ? (
                    <ArrowLeft
                      className={cn(
                        'flex-shrink-0',
                        compact
                          ? 'w-4 h-4 mr-1'
                          : 'w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2'
                      )}
                    />
                  ) : (
                    <ArrowRight
                      className={cn(
                        'flex-shrink-0',
                        compact
                          ? 'w-4 h-4 ml-1'
                          : 'w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2'
                      )}
                    />
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
        {!compact && (
          <div
            className={cn(
              'text-center w-full max-w-full overflow-hidden',
              isMobile ? 'mt-3 px-3' : 'mt-6 sm:mt-8'
            )}
          >
            <div
              className={cn(
                'inline-flex items-center justify-center rounded-full text-white shadow-lg transition-all duration-300 hover:scale-105',
                isMobile
                  ? 'gap-1.5 px-3 py-2 text-xs max-w-full'
                  : 'gap-2 px-4 py-3 text-base max-w-full',
                `bg-gradient-to-r ${THEME.colors.primary.romantic}`
              )}
            >
              <Quote
                aria-hidden="true"
                className={cn(
                  'flex-shrink-0',
                  isMobile ? 'w-3 h-3' : 'w-4 h-4'
                )}
              />
              <p className="font-medium italic text-center break-words flex-shrink min-w-0">
                {dict.header.excitementQuote}
              </p>
              <Quote
                aria-hidden="true"
                className={cn(
                  'transform rotate-180 flex-shrink-0',
                  isMobile ? 'w-3 h-3' : 'w-4 h-4'
                )}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
