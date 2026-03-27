'use client';

import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Tabs } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FormattedAnswer, UserProfile } from '@/types/next-auth';
import type {
  ProfileCardDict,
  ProfileCardDisplayDict,
} from '@/types/dictionary';
import type { ThemeType } from '../../constants/theme';
import { BRAND } from '../../constants/theme';
import type { EnumMap } from '../../types/profileCard';
import TabNavigationButtons from '../navigation/TabNavigationButtons';
import { ProfileTabContext } from './ProfileTabContext';
import type { ProfileTabContextType, TabContentData } from './ProfileTabContext';
import EssenceTab from './EssenceTab';
import JourneyTab from './JourneyTab';
import VisionTab from './VisionTab';
import ConnectionTab from './ConnectionTab';
import ProfessionalTab from './ProfessionalTab';

interface WorldConfig {
  label: string;
  icon: React.ElementType;
  color: string;
}

interface TabItem {
  value: string;
  label: string;
  shortLabel?: string;
  icon: React.ElementType;
  hasContent: boolean;
}

export interface MainContentTabsProps {
  isDesktop: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabItems: TabItem[];
  profile: UserProfile;
  displayDict: ProfileCardDisplayDict;
  dict: ProfileCardDict;
  direction: 'ltr' | 'rtl';
  locale: string;
  THEME: ThemeType;
  effectiveViewMode: 'matchmaker' | 'candidate';
  mobileViewLayout: 'focus' | 'detailed';
  contentScrollAreaRef: React.RefObject<HTMLDivElement | null>;
  personalityAnswers: FormattedAnswer[];
  valuesAnswers: FormattedAnswer[];
  religionAnswers: FormattedAnswer[];
  relationshipAnswers: FormattedAnswer[];
  partnerAnswers: FormattedAnswer[];
  sfAnswers?: Record<string, unknown> | null;
  hasAnyPreferences: boolean;
  hasEducationAndCareerDetails: boolean;
  hasFamilyBackgroundDetails: boolean;
  hasJudaismConnectionDetails: boolean;
  WORLDS: Record<string, WorldConfig>;
  characterTraitMap: EnumMap;
  hobbiesMap: EnumMap;
  educationLevelMap: EnumMap;
  serviceTypeMap: EnumMap;
  religiousLevelMap: EnumMap;
  religiousJourneyMap: EnumMap;
  headCoveringMap: EnumMap;
  kippahTypeMap: EnumMap;
  contactPreferenceMap: EnumMap;
  maritalStatusMap: EnumMap;
}

// Divider between major sections
const SectionDivider: React.FC = () => (
  <div className="border-t border-gray-100 my-2" />
);

const getTabContent = (
  answers: FormattedAnswer[]
): TabContentData => {
  if (!answers || answers.length === 0) {
    return { hookAnswer: undefined, deeperAnswers: [] };
  }
  return {
    hookAnswer: answers[0],
    deeperAnswers: answers.slice(1),
  };
};

const MainContentTabs: React.FC<MainContentTabsProps> = ({
  isDesktop,
  activeTab,
  onTabChange,
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
}) => {
  // Auto-scroll active tab into view
  const tabBarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!tabBarRef.current) return;
    const activeBtn = tabBarRef.current.querySelector('[data-active="true"]');
    if (activeBtn) {
      activeBtn.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeTab]);

  const personalityContent = useMemo(
    () => getTabContent(personalityAnswers),
    [personalityAnswers]
  );
  const valuesContent = useMemo(
    () => getTabContent(valuesAnswers),
    [valuesAnswers]
  );
  const religionContent = useMemo(
    () => getTabContent(religionAnswers),
    [religionAnswers]
  );
  const relationshipContent = useMemo(
    () => getTabContent(relationshipAnswers),
    [relationshipAnswers]
  );
  const partnerContent = useMemo(
    () => getTabContent(partnerAnswers),
    [partnerAnswers]
  );

  const renderMobileNav = useCallback(() => {
    if (isDesktop || mobileViewLayout !== 'detailed') return null;
    return (
      <TabNavigationButtons
        activeTab={activeTab}
        tabItems={tabItems}
        onTabChange={onTabChange}
        THEME={THEME}
        dict={displayDict.mobileNav}
        direction={direction}
      />
    );
  }, [
    isDesktop,
    mobileViewLayout,
    activeTab,
    tabItems,
    onTabChange,
    THEME,
    displayDict.mobileNav,
    direction,
  ]);

  const ctxValue = useMemo<ProfileTabContextType>(
    () => ({
      isDesktop,
      activeTab,
      onTabChange,
      tabItems,
      direction,
      locale,
      effectiveViewMode,
      mobileViewLayout,
      profile,
      THEME,
      WORLDS,
      displayDict,
      dict,
      personalityContent,
      valuesContent,
      religionContent,
      relationshipContent,
      partnerContent,
      sfAnswers: sfAnswers || null,
      hasAnyPreferences,
      hasEducationAndCareerDetails,
      hasFamilyBackgroundDetails,
      hasJudaismConnectionDetails,
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
      renderMobileNav,
      SectionDivider,
    }),
    [
      isDesktop,
      activeTab,
      onTabChange,
      tabItems,
      direction,
      locale,
      effectiveViewMode,
      mobileViewLayout,
      profile,
      THEME,
      WORLDS,
      displayDict,
      dict,
      personalityContent,
      valuesContent,
      religionContent,
      relationshipContent,
      partnerContent,
      sfAnswers,
      hasAnyPreferences,
      hasEducationAndCareerDetails,
      hasFamilyBackgroundDetails,
      hasJudaismConnectionDetails,
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
      renderMobileNav,
    ]
  );

  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      dir={direction}
      className="w-full flex flex-col flex-1 min-h-0 max-w-full overflow-hidden"
    >
      {/* Underline-style tab bar with scroll shadow */}
      <div
        className={cn(
          'border-b border-gray-200 sticky top-0 z-20 bg-white',
          'relative'
        )}
      >
        <div
          ref={tabBarRef}
          className="flex overflow-x-auto scrollbar-none"
          dir={direction}
        >
          {tabItems.map((tab) => (
            <button
              key={tab.value}
              data-active={activeTab === tab.value}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                'px-4 py-3 text-sm font-medium transition-colors duration-200 relative flex-shrink-0',
                'min-h-[44px] touch-manipulation whitespace-nowrap',
                activeTab === tab.value
                  ? 'text-teal-700 font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.shortLabel || tab.label}
              {activeTab === tab.value && (
                <div
                  className={cn(
                    'absolute bottom-0 inset-x-0 h-0.5 rounded-full',
                    BRAND.primaryBg
                  )}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea
        id="profile-card-tabs-content"
        className="flex-1 overflow-auto h-full max-w-full"
        ref={contentScrollAreaRef}
      >
        <div
          dir={direction}
          className="space-y-4 sm:space-y-6 p-4 sm:p-6 min-w-0 max-w-full"
        >
          <ProfileTabContext.Provider value={ctxValue}>
            <EssenceTab />
            <JourneyTab />
            <VisionTab />
            <ConnectionTab />
            {effectiveViewMode === 'matchmaker' && <ProfessionalTab />}
          </ProfileTabContext.Provider>

          {isDesktop && (
            <TabNavigationButtons
              activeTab={activeTab}
              tabItems={tabItems}
              onTabChange={onTabChange}
              THEME={THEME}
              dict={displayDict.mobileNav}
              direction={direction}
            />
          )}
        </div>
      </ScrollArea>
    </Tabs>
  );
};

export default MainContentTabs;
