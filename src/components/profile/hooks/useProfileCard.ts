'use client';

import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useSession } from 'next-auth/react';
import {
  Sparkles,
  Heart,
  Star,
  Users,
  FileText,
  Compass,
  Target,
  Lock,
  BookMarked,
} from 'lucide-react';
import type {
  UserProfile,
  UserImage as UserImageType,
  QuestionnaireResponse,
  FormattedAnswer,
  ServiceType,
  HeadCoveringType,
  KippahType,
  WorldId,
} from '@/types/next-auth';
import type { ProfileCardDict } from '@/types/dictionary';

import { getProfileTheme } from '../constants/theme';
import { calculateProfileAge, formatAvailabilityStatus } from '../utils/formatters';
import {
  createMaritalStatusMap,
  createReligiousLevelMap,
  createReligiousJourneyMap,
  createEducationLevelMap,
  createServiceTypeMap,
  createHeadCoveringMap,
  createKippahTypeMap,
  createContactPreferenceMap,
  createCharacterTraitMap,
  createHobbiesMap,
} from '../utils/maps';

interface UseProfileCardParams {
  profileData: Omit<UserProfile, 'isProfileComplete'>;
  isProfileComplete: boolean;
  images: UserImageType[];
  questionnaire?: QuestionnaireResponse | null;
  sfAnswers?: Record<string, unknown> | null;
  viewMode: 'matchmaker' | 'candidate';
  onClose?: () => void;
  dict: ProfileCardDict;
  locale: string;
}

export function useProfileCard({
  profileData,
  isProfileComplete,
  images,
  questionnaire,
  sfAnswers,
  viewMode,
  onClose,
  dict,
  locale,
}: UseProfileCardParams) {
  const direction: 'rtl' | 'ltr' = locale === 'he' ? 'rtl' : 'ltr';

  const { data: session } = useSession();
  const isMatchmaker = session?.user?.role === 'ADMIN';
  const effectiveViewMode = isMatchmaker ? 'matchmaker' : viewMode;
  const isOwnProfile = !!(session?.user?.id && session.user.id === profileData.user?.id);

  const contentScrollAreaRef = useRef<HTMLDivElement>(null);

  const profile = useMemo(
    () => ({ ...profileData, isProfileComplete }),
    [profileData, isProfileComplete]
  );

  const displayDict = dict.display;

  // --- State ---
  const [isClient, setIsClient] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [selectedImageForDialog, setSelectedImageForDialog] =
    useState<UserImageType | null>(null);
  const [activeTab, setActiveTab] = useState('essence');
  const [, setIsSuggestDialogOpen] = useState(false);
  const [mobileViewLayout, setMobileViewLayout] = useState<'focus' | 'detailed'>('focus');

  // --- Maps ---
  const maritalStatusMap = useMemo(
    () => createMaritalStatusMap(dict.options.maritalStatus),
    [dict.options.maritalStatus]
  );
  const religiousLevelMap = useMemo(
    () => createReligiousLevelMap(dict.options.religiousLevel),
    [dict.options.religiousLevel]
  );
  const religiousJourneyMap = useMemo(
    () => createReligiousJourneyMap(dict.options.religiousJourney),
    [dict.options.religiousJourney]
  );
  const educationLevelMap = useMemo(
    () => createEducationLevelMap(dict.options.educationLevel),
    [dict.options.educationLevel]
  );
  const serviceTypeMap = useMemo(
    () => createServiceTypeMap(dict.options.serviceType as Record<ServiceType, string>),
    [dict.options.serviceType]
  );
  const headCoveringMap = useMemo(
    () => createHeadCoveringMap(dict.options.headCovering as Record<HeadCoveringType, string>),
    [dict.options.headCovering]
  );
  const kippahTypeMap = useMemo(
    () => createKippahTypeMap(dict.options.kippahType as Record<KippahType, string>),
    [dict.options.kippahType]
  );
  const contactPreferenceMap = useMemo(() => createContactPreferenceMap(), []);
  const characterTraitMap = useMemo(
    () => createCharacterTraitMap(dict.options.traits),
    [dict.options.traits]
  );
  const hobbiesMap = useMemo(
    () => createHobbiesMap(dict.options.hobbies),
    [dict.options.hobbies]
  );

  // --- Tab scroll ---
  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const scrollViewport = contentScrollAreaRef.current?.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (scrollViewport) {
        scrollViewport.scrollTo({ top: 0, behavior: 'smooth' });
      }
      const mainContainer = document.querySelector(
        '#profile-card-tabs-content [data-radix-scroll-area-viewport]'
      );
      if (mainContainer) {
        mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const handleTabChange = (newTab: string) => {
    if (activeTabRef.current === newTab) return;
    setActiveTab(newTab);
  };

  // --- Theme (gender-based, no palette selector) ---
  const THEME = useMemo(() => getProfileTheme(profile.gender), [profile.gender]);

  // --- WORLDS ---
  const WORLDS = useMemo(
    () => ({
      values: {
        label: displayDict.content.worlds.values.label,
        icon: BookMarked,
        color: 'blue',
      },
      personality: {
        label: displayDict.content.worlds.personality.label,
        icon: Sparkles,
        color: 'purple',
      },
      relationship: {
        label: displayDict.content.worlds.relationship.label,
        icon: Heart,
        color: 'rose',
      },
      partner: {
        label: displayDict.content.worlds.partner.label,
        icon: Users,
        color: 'blue',
      },
      religion: {
        label: displayDict.content.worlds.religion.label,
        icon: Star,
        color: 'amber',
      },
      general: {
        label: displayDict.content.worlds.general.label,
        icon: FileText,
        color: 'gray',
      },
    }),
    [displayDict]
  );

  // --- Feature flags ---
  const hasAnyPreferences = useMemo(() => {
    return (
      (profile.preferredMaritalStatuses && profile.preferredMaritalStatuses.length > 0) ||
      (profile.preferredReligiousLevels && profile.preferredReligiousLevels.length > 0) ||
      (profile.preferredReligiousJourneys && profile.preferredReligiousJourneys.length > 0) ||
      (profile.preferredEducation && profile.preferredEducation.length > 0) ||
      (profile.preferredOccupations && profile.preferredOccupations.length > 0) ||
      (profile.preferredLocations && profile.preferredLocations.length > 0) ||
      (profile.preferredCharacterTraits && profile.preferredCharacterTraits.length > 0) ||
      (profile.preferredHobbies && profile.preferredHobbies.length > 0)
    );
  }, [profile]);

  const hasEducationAndCareerDetails = useMemo(() => {
    return !!profile.educationLevel || !!profile.education || !!profile.occupation ||
      !!profile.serviceType || !!profile.serviceDetails;
  }, [profile.educationLevel, profile.education, profile.occupation, profile.serviceType, profile.serviceDetails]);

  const hasFamilyBackgroundDetails = useMemo(() => {
    return !!profile.parentStatus || !!profile.fatherOccupation || !!profile.motherOccupation ||
      (profile.siblings !== null && profile.siblings !== undefined) ||
      !!profile.position || !!profile.aliyaCountry || !!profile.aliyaYear;
  }, [profile.parentStatus, profile.fatherOccupation, profile.motherOccupation, profile.siblings, profile.position, profile.aliyaCountry, profile.aliyaYear]);

  const hasUniqueTraitsOrHobbies = useMemo(() => {
    return (profile.profileCharacterTraits && profile.profileCharacterTraits.length > 0) ||
      (profile.profileHobbies && profile.profileHobbies.length > 0);
  }, [profile.profileCharacterTraits, profile.profileHobbies]);

  const hasJudaismConnectionDetails = useMemo(() => {
    return !!profile.religiousLevel || !!profile.religiousJourney ||
      (profile.shomerNegiah !== null && profile.shomerNegiah !== undefined) ||
      (profile.gender === 'FEMALE' && !!profile.headCovering) ||
      (profile.gender === 'MALE' && !!profile.kippahType);
  }, [profile.religiousLevel, profile.religiousJourney, profile.shomerNegiah, profile.gender, profile.headCovering, profile.kippahType]);

  // --- Images ---
  const orderedImages = useMemo(() => {
    const validImages = (images || []).filter((img) => img.url);
    const mainImg = validImages.find((img) => img.isMain);
    const otherImages = mainImg
      ? validImages.filter((img) => img.id !== mainImg.id)
      : validImages;
    return mainImg ? [mainImg, ...otherImages] : validImages;
  }, [images]);

  const mainImageToDisplay = useMemo(
    () => (orderedImages.length > 0 ? orderedImages[0] : null),
    [orderedImages]
  );

  const age = useMemo(() => calculateProfileAge(profile.birthDate), [profile.birthDate]);

  const availability = useMemo(
    () => formatAvailabilityStatus(
      profile.availabilityStatus,
      { ...displayDict.availability, mysterious: displayDict.placeholders.mysterious },
      displayDict.header.availabilityBadge
    ),
    [profile.availabilityStatus, displayDict]
  );

  // --- Questionnaire ---
  const isRawValueAnswered = (value: FormattedAnswer['rawValue']): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return false;
    return true;
  };

  const getVisibleAnswers = useCallback(
    (world: WorldId) => {
      if (!questionnaire?.formattedAnswers?.[world]) return [];
      return questionnaire.formattedAnswers[world].filter((a) => {
        const hasContent = isRawValueAnswered(a.rawValue);
        if (!hasContent) return false;
        if (effectiveViewMode === 'matchmaker') return true;
        return a.isVisible !== false;
      });
    },
    [questionnaire, effectiveViewMode]
  );

  const personalityAnswers = useMemo(() => getVisibleAnswers('PERSONALITY'), [getVisibleAnswers]);
  const valuesAnswers = useMemo(() => getVisibleAnswers('VALUES'), [getVisibleAnswers]);
  const relationshipAnswers = useMemo(() => getVisibleAnswers('RELATIONSHIP'), [getVisibleAnswers]);
  const partnerAnswers = useMemo(() => getVisibleAnswers('PARTNER'), [getVisibleAnswers]);
  const religionAnswers = useMemo(() => getVisibleAnswers('RELIGION'), [getVisibleAnswers]);

  // --- Image dialog ---
  const currentDialogImageIndex = useMemo(
    () => selectedImageForDialog ? orderedImages.findIndex((img) => img.id === selectedImageForDialog.id) : -1,
    [selectedImageForDialog, orderedImages]
  );

  const handleOpenImageDialog = (image: UserImageType) =>
    image.url && setSelectedImageForDialog(image);
  const handleCloseImageDialog = () => setSelectedImageForDialog(null);

  const handleDialogNav = (navDirection: 'next' | 'prev') => {
    if (currentDialogImageIndex === -1 || orderedImages.length <= 1) return;
    const newIndex = (currentDialogImageIndex + (navDirection === 'next' ? 1 : -1) + orderedImages.length) % orderedImages.length;
    setSelectedImageForDialog(orderedImages[newIndex]);
  };

  const handleClose = useCallback(() => {
    if (onClose) {
      const scrollY = window.scrollY;
      onClose();
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
    }
  }, [onClose]);

  // --- Tab items (spirit merged into journey, empty tabs hidden) ---
  const tabItems = useMemo(
    () =>
      [
        {
          value: 'essence',
          label: displayDict.tabs.essence.label,
          shortLabel: displayDict.tabs.essence.shortLabel,
          icon: Sparkles,
          hasContent:
            !!profile.profileHeadline || !!profile.about ||
            (profile.isFriendsSectionVisible && (profile.testimonials || []).filter((t) => t.status === 'APPROVED').length > 0) ||
            personalityAnswers.length > 0 ||
            (profile.profileCharacterTraits && profile.profileCharacterTraits.length > 0) ||
            (profile.profileHobbies && profile.profileHobbies.length > 0),
        },
        {
          value: 'journey',
          label: displayDict.tabs.journey.label,
          shortLabel: displayDict.tabs.journey.shortLabel,
          icon: Compass,
          hasContent:
            valuesAnswers.length > 0 || !!profile.educationLevel || !!profile.occupation ||
            !!profile.serviceType || !!profile.parentStatus ||
            // Spirit content (merged)
            religionAnswers.length > 0 || !!profile.religiousLevel ||
            !!profile.religiousJourney || !!profile.influentialRabbi,
        },
        {
          value: 'vision',
          label: displayDict.tabs.vision.label,
          shortLabel: displayDict.tabs.vision.shortLabel,
          icon: Heart,
          hasContent: relationshipAnswers.length > 0 || !!profile.matchingNotes?.trim() || !!profile.inspiringCoupleStory?.trim(),
        },
        {
          value: 'connection',
          label: displayDict.tabs.connection.label,
          shortLabel: displayDict.tabs.connection.shortLabel,
          icon: Target,
          hasContent: hasAnyPreferences || partnerAnswers.length > 0,
        },
        effectiveViewMode === 'matchmaker' && {
          value: 'professional',
          label: displayDict.tabs.professional.label,
          shortLabel: displayDict.tabs.professional.shortLabel,
          icon: Lock,
          hasContent: true,
        },
      ]
        .filter(Boolean)
        .filter((tab) => (tab as { hasContent: boolean }).hasContent) as {
        value: string;
        label: string;
        shortLabel?: string;
        icon: React.ElementType;
        hasContent: boolean;
      }[],
    [profile, hasAnyPreferences, effectiveViewMode, personalityAnswers, valuesAnswers, relationshipAnswers, partnerAnswers, religionAnswers, displayDict]
  );

  // --- Screen size ---
  useEffect(() => {
    setIsClient(true);
    const checkScreenSize = () => setIsDesktop(window.innerWidth >= 1024);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return {
    // Core
    direction,
    profile,
    displayDict,
    effectiveViewMode,
    isOwnProfile,
    THEME,
    WORLDS,
    // State
    isClient,
    isDesktop,
    selectedImageForDialog,
    activeTab,
    mobileViewLayout,
    setMobileViewLayout,
    setIsSuggestDialogOpen,
    setActiveTab,
    setSelectedImageForDialog,
    // Maps
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
    // Computed
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
    // Handlers
    handleTabChange,
    handleOpenImageDialog,
    handleCloseImageDialog,
    handleDialogNav,
    handleClose,
    // Refs
    contentScrollAreaRef,
  };
}
