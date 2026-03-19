'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Heart,
  Star,
  Users,
  Users2,
  Quote,
  User,
  Telescope,
  BookOpen,
  Briefcase,
  Award,
  GraduationCap,
  Crown,
  Globe,
  Calendar,
  Clock,
  Compass,
  Target,
  Filter,
  Lock,
  BookMarked,
  Lightbulb,
  Stars,
  Phone,
  MessageSquareQuote,
  InfoIcon,
} from 'lucide-react';
import type { FormattedAnswer, UserProfile } from '@/types/next-auth';
import type {
  ProfileCardDict,
  ProfileCardDisplayDict,
  BudgetDisplayDict,
} from '@/types/dictionary';
import type { ThemeType } from '../../constants/theme';
import type { EnumMap } from '../../types/profileCard';
import { formatEnumValue, formatBooleanPreference } from '../../utils/formatters';
import SectionCard from '../shared/SectionCard';
import EmptyState from '../shared/EmptyState';
import DetailItem from '../shared/DetailItem';
import PreferenceBadges from '../shared/PreferenceBadges';
import QuestionnaireItem from './QuestionnaireItem';
import TabNavigationButtons from '../navigation/TabNavigationButtons';
import FriendTestimonials from '../content/FriendTestimonials';

interface WorldConfig {
  label: string;
  shortLabel?: string;
  icon: React.ElementType;
  gradient: string;
  accentColor: string;
}

interface TabItem {
  value: string;
  label: string;
  shortLabel?: string;
  icon: React.ElementType;
  gradient: string;
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
  // Questionnaire answers
  personalityAnswers: FormattedAnswer[];
  valuesAnswers: FormattedAnswer[];
  religionAnswers: FormattedAnswer[];
  relationshipAnswers: FormattedAnswer[];
  partnerAnswers: FormattedAnswer[];
  // Feature flags
  hasAnyPreferences: boolean;
  hasEducationAndCareerDetails: boolean;
  hasFamilyBackgroundDetails: boolean;
  hasJudaismConnectionDetails: boolean;
  // Worlds
  WORLDS: Record<string, WorldConfig>;
  // Maps
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
  const activeTabConfig = tabItems.find((tab) => tab.value === activeTab);

  const getTabContent = (
    answers: FormattedAnswer[]
  ): {
    hookAnswer: FormattedAnswer | undefined;
    deeperAnswers: FormattedAnswer[];
  } => {
    if (!answers || answers.length === 0) {
      return { hookAnswer: undefined, deeperAnswers: [] };
    }
    return {
      hookAnswer: answers[0],
      deeperAnswers: answers.slice(1),
    };
  };

  const personalityContent = getTabContent(personalityAnswers);
  const valuesContent = getTabContent(valuesAnswers);
  const religionContent = getTabContent(religionAnswers);
  const relationshipContent = getTabContent(relationshipAnswers);
  const partnerContent = getTabContent(partnerAnswers);

  const renderMobileNav = () => {
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
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      className="w-full flex flex-col flex-1 min-h-0 max-w-full overflow-hidden"
    >
      <div
        className={cn(
          'bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/50 overflow-hidden sticky top-0 z-20',
          'mb-3 sm:mb-4 md:mb-6 p-1 sm:p-2',
          THEME.shadows.elegant
        )}
      >
        <ScrollArea
          className="w-full max-w-full overflow-hidden"
          dir={direction}
        >
          <div className="flex gap-0.5 sm:gap-1 justify-center min-w-max px-2 sm:px-4">
            {tabItems.map((tab) => (
              <button
                key={tab.value}
                onClick={() => onTabChange(tab.value)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl flex-shrink-0 transition-all duration-300 border border-transparent',
                  'text-gray-600 hover:text-gray-800 hover:bg-rose-50',
                  'min-w-[50px] min-h-[44px] touch-manipulation',
                  'sm:min-w-[60px] md:min-w-[80px]',
                  'px-1.5 py-1.5 sm:px-2 sm:py-2 md:px-3 md:py-2',
                  'text-xs sm:text-sm font-semibold',
                  !tab.hasContent && 'opacity-50 cursor-not-allowed',
                  activeTab === tab.value &&
                    cn(
                      'font-bold text-white shadow-lg border-white/20',
                      `bg-gradient-to-r ${tab.gradient}`
                    )
                )}
                disabled={!tab.hasContent}
              >
                <tab.icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="leading-tight text-center break-words hyphens-auto word-break-break-word max-w-full">
                  {typeof window !== 'undefined' &&
                  window.innerWidth < 640 &&
                  tab.shortLabel
                    ? tab.shortLabel
                    : tab.label}
                </span>
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="mt-1" />
        </ScrollArea>
      </div>
      <ScrollArea
        id="profile-card-tabs-content"
        className="flex-1 overflow-auto h-full max-w-full"
        ref={contentScrollAreaRef}
      >
        <div className="space-y-3 sm:space-y-4 md:space-y-6 p-1 sm:p-2 min-w-0 max-w-full">
          {!(activeTabConfig && activeTabConfig.hasContent) && (
            <EmptyState
              icon={Telescope}
              title={displayDict.content.emptyStateTitle}
              description={displayDict.content.emptyStateDescription}
              variant="discovery"
              THEME={THEME}
            />
          )}

          {/* Essence Tab */}
          <TabsContent value="essence" className="mt-0 max-w-full min-w-0">
            <div className="space-y-6 sm:space-y-8 max-w-full min-w-0">
              {profile.profileHeadline && (
                <SectionCard
                  title={displayDict.content.openingSentence}
                  icon={Quote}
                  variant="elegant"
                  gradient={THEME.colors.primary.main}
                >
                  <p className="text-center text-lg italic font-semibold text-gray-700 break-words hyphens-auto word-break-break-word overflow-wrap-anywhere">
                    &quot;{profile.profileHeadline}&quot;
                  </p>
                </SectionCard>
              )}

              <SectionCard
                title={dict.display.content.aboutMe.titleCard.replace(
                  '{{name}}',
                  profile.user?.firstName || ''
                )}
                icon={User}
                variant="romantic"
                gradient={THEME.colors.primary.romantic}
              >
                <div className="relative p-4 bg-rose-50/30 rounded-lg border border-rose-200/50">
                  <Quote className="absolute top-2 right-2 w-6 h-6 text-rose-200" />
                  <p className="whitespace-pre-wrap text-gray-800 leading-relaxed italic px-4 break-words hyphens-auto word-break-break-word overflow-wrap-anywhere">
                    {profile.about}
                  </p>
                  <Quote className="absolute bottom-2 left-2 w-6 h-6 text-rose-200 transform rotate-180" />
                </div>
              </SectionCard>

              {profile.isFriendsSectionVisible &&
                (profile.testimonials || []).filter(
                  (t) => t.status === 'APPROVED'
                ).length > 0 && (
                  <SectionCard
                    title={displayDict.content.recommendationsTitle.replace(
                      '{{name}}',
                      profile.user?.firstName || ''
                    )}
                    subtitle={displayDict.content.recommendationsSubtitle}
                    icon={MessageSquareQuote}
                    variant="default"
                    gradient={THEME.colors.primary.light}
                  >
                    <FriendTestimonials
                      profile={profile}
                      dict={displayDict}
                      THEME={THEME}
                      direction={direction}
                    />
                  </SectionCard>
                )}

              {personalityContent.hookAnswer && (
                <QuestionnaireItem
                  answer={personalityContent.hookAnswer}
                  worldName={WORLDS.personality.label}
                  worldColor={WORLDS.personality.accentColor}
                  worldGradient={WORLDS.personality.gradient}
                  direction={direction}
                  displayDict={displayDict}
                  budgetDisplayDict={dict.budgetDisplay}
                  locale={locale}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-full min-w-0">
                {profile.profileCharacterTraits &&
                  profile.profileCharacterTraits.length > 0 && (
                    <SectionCard
                      title={displayDict.content.whatMakesMeSpecial}
                      subtitle={displayDict.content.myTraits}
                      icon={Sparkles}
                      variant="elegant"
                      gradient={THEME.colors.primary.light}
                    >
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {profile.profileCharacterTraits.map((trait) => {
                          const traitData = formatEnumValue(
                            trait,
                            characterTraitMap,
                            trait
                          );
                          return (
                            <Badge
                              key={trait}
                              className={cn(
                                'flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 font-semibold text-xs sm:text-sm',
                                'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800',
                                'border border-purple-200 rounded-full hover:scale-105 transition-transform',
                                'whitespace-normal h-auto text-center leading-tight max-w-full',
                                THEME.shadows.soft
                              )}
                            >
                              <traitData.icon
                                className={cn(
                                  'w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0',
                                  traitData.color
                                )}
                              />
                              <span className="break-words min-w-0">
                                {traitData.label}
                              </span>
                            </Badge>
                          );
                        })}
                      </div>
                    </SectionCard>
                  )}
                {profile.profileHobbies &&
                  profile.profileHobbies.length > 0 && (
                    <SectionCard
                      title={displayDict.content.whatFillsMySoul}
                      subtitle={displayDict.content.myHobbies}
                      icon={Heart}
                      variant="elegant"
                      gradient={THEME.colors.secondary.sage}
                    >
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {profile.profileHobbies.map((hobby) => {
                          const hobbyData = formatEnumValue(
                            hobby,
                            hobbiesMap,
                            hobby
                          );
                          return (
                            <Badge
                              key={hobby}
                              className={cn(
                                'flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 font-semibold text-xs sm:text-sm',
                                'bg-gradient-to-r from-emerald-100 to-cyan-100 text-emerald-800',
                                'border border-emerald-200 rounded-full hover:scale-105 transition-transform',
                                'whitespace-normal h-auto text-center leading-tight max-w-full',
                                THEME.shadows.soft
                              )}
                            >
                              <hobbyData.icon
                                className={cn(
                                  'w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0',
                                  hobbyData.color
                                )}
                              />
                              <span className="break-words min-w-0">
                                {hobbyData.label}
                              </span>
                            </Badge>
                          );
                        })}
                      </div>
                    </SectionCard>
                  )}
              </div>
              {personalityContent.deeperAnswers.length > 0 && (
                <SectionCard
                  title={displayDict.content.deepDivePersonality}
                  subtitle={displayDict.content.moreAnswersPersonality}
                  icon={Telescope}
                  variant="elegant"
                  gradient={WORLDS.personality.gradient}
                >
                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    {personalityContent.deeperAnswers.map((answer) => (
                      <QuestionnaireItem
                        key={answer.questionId}
                        answer={answer}
                        worldName={WORLDS.personality.label}
                        worldColor={WORLDS.personality.accentColor}
                        worldGradient={WORLDS.personality.gradient}
                        direction={direction}
                        displayDict={displayDict}
                        budgetDisplayDict={dict.budgetDisplay}
                        locale={locale}
                      />
                    ))}
                  </div>
                </SectionCard>
              )}
              {renderMobileNav()}
            </div>
          </TabsContent>

          {/* Journey Tab */}
          <TabsContent
            value="journey"
            className="mt-0 space-y-4 sm:space-y-6 max-w-full min-w-0"
          >
            <div className="space-y-6 sm:space-y-8 max-w-full min-w-0">
              {valuesContent.hookAnswer && (
                <QuestionnaireItem
                  answer={valuesContent.hookAnswer}
                  worldName={WORLDS.values.label}
                  worldColor={WORLDS.values.accentColor}
                  worldGradient={WORLDS.values.gradient}
                  direction={direction}
                  displayDict={displayDict}
                  budgetDisplayDict={dict.budgetDisplay}
                  locale={locale}
                />
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {hasEducationAndCareerDetails && (
                  <SectionCard
                    title={displayDict.content.educationAndCareer}
                    subtitle={displayDict.content.academicAndProfessionalPath}
                    icon={GraduationCap}
                    variant="elegant"
                    gradient={THEME.colors.secondary.sky}
                  >
                    <div className="space-y-4 sm:space-y-5">
                      {profile.educationLevel && (
                        <DetailItem
                          icon={GraduationCap}
                          label={
                            displayDict.content.detailLabels.educationLevel
                          }
                          value={
                            formatEnumValue(
                              profile.educationLevel,
                              educationLevelMap,
                              ''
                            ).label
                          }
                          variant="highlight"
                          textAlign="start"
                          placeholder=""
                        />
                      )}
                      {profile.education && (
                        <DetailItem
                          icon={BookOpen}
                          label={
                            displayDict.content.detailLabels.educationDetails
                          }
                          value={profile.education}
                          variant="elegant"
                          valueClassName="whitespace-pre-wrap"
                          placeholder={displayDict.placeholders.willDiscover}
                        />
                      )}
                      {profile.occupation && (
                        <DetailItem
                          icon={Briefcase}
                          label={
                            displayDict.content.detailLabels.professionalField
                          }
                          value={profile.occupation}
                          variant="elegant"
                          textAlign="start"
                          placeholder=""
                        />
                      )}
                      {profile.serviceType && (
                        <DetailItem
                          icon={Award}
                          label={
                            displayDict.content.detailLabels.militaryService
                          }
                          value={
                            formatEnumValue(
                              profile.serviceType,
                              serviceTypeMap,
                              ''
                            ).label
                          }
                          variant="elegant"
                          textAlign="start"
                          placeholder=""
                        />
                      )}
                      {profile.serviceDetails && (
                        <DetailItem
                          icon={InfoIcon}
                          label={
                            displayDict.content.detailLabels.serviceDetails
                          }
                          value={profile.serviceDetails}
                          variant="elegant"
                          valueClassName="whitespace-pre-wrap"
                          placeholder={displayDict.placeholders.willDiscover}
                        />
                      )}
                    </div>
                  </SectionCard>
                )}
                {hasFamilyBackgroundDetails && (
                  <SectionCard
                    title={displayDict.content.familyAndCulturalBackground}
                    subtitle={displayDict.content.familyThatShapedMe}
                    icon={Users2}
                    variant="romantic"
                    gradient={THEME.colors.primary.accent}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      {profile.parentStatus && (
                        <DetailItem
                          icon={Users2}
                          label={
                            displayDict.content.detailLabels.parentStatus
                          }
                          value={profile.parentStatus}
                          variant="elegant"
                          textAlign="start"
                          placeholder=""
                        />
                      )}
                      {profile.fatherOccupation && (
                        <DetailItem
                          icon={Briefcase}
                          label={
                            displayDict.content.detailLabels.fatherOccupation
                          }
                          value={profile.fatherOccupation}
                          variant="elegant"
                          textAlign="start"
                          placeholder={displayDict.placeholders.willDiscover}
                        />
                      )}
                      {profile.motherOccupation && (
                        <DetailItem
                          icon={Briefcase}
                          label={
                            displayDict.content.detailLabels.motherOccupation
                          }
                          value={profile.motherOccupation}
                          variant="elegant"
                          textAlign="start"
                          placeholder={displayDict.placeholders.willDiscover}
                        />
                      )}
                      {profile.siblings !== null &&
                        profile.siblings !== undefined && (
                          <DetailItem
                            icon={Users}
                            label={displayDict.content.detailLabels.siblings}
                            value={`${profile.siblings} אחים/אחיות`}
                            variant="elegant"
                            textAlign="start"
                            placeholder=""
                          />
                        )}
                      {profile.position && (
                        <DetailItem
                          icon={Crown}
                          label={displayDict.content.detailLabels.birthOrder}
                          value={`מקום ${profile.position}`}
                          variant="elegant"
                          textAlign="start"
                          placeholder=""
                        />
                      )}
                      {profile.aliyaCountry && (
                        <DetailItem
                          icon={Globe}
                          label={
                            displayDict.content.detailLabels.countryOfOrigin
                          }
                          value={`${profile.aliyaCountry} - השורשים שלי`}
                          variant="elegant"
                          textAlign="start"
                          placeholder={displayDict.placeholders.willDiscover}
                        />
                      )}
                      {profile.aliyaYear && (
                        <DetailItem
                          icon={Calendar}
                          label={displayDict.content.detailLabels.aliyaYear}
                          value={`${profile.aliyaYear} - הגעתי הביתה`}
                          variant="elegant"
                          textAlign="start"
                          placeholder={displayDict.placeholders.willDiscover}
                        />
                      )}
                    </div>
                  </SectionCard>
                )}
              </div>
              {valuesContent.deeperAnswers.length > 0 && (
                <SectionCard
                  title={displayDict.content.valuesAndPrinciples}
                  subtitle={displayDict.content.answersOnWhatMatters}
                  icon={BookMarked}
                  variant="elegant"
                  gradient={WORLDS.values.gradient}
                >
                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    {valuesContent.deeperAnswers.map((answer) => (
                      <QuestionnaireItem
                        key={answer.questionId}
                        answer={answer}
                        worldName={WORLDS.values.label}
                        worldColor={WORLDS.values.accentColor}
                        worldGradient={WORLDS.values.gradient}
                        direction={direction}
                        displayDict={displayDict}
                        budgetDisplayDict={dict.budgetDisplay}
                        locale={locale}
                      />
                    ))}
                  </div>
                </SectionCard>
              )}
              {renderMobileNav()}
            </div>
          </TabsContent>

          {/* Spirit Tab */}
          <TabsContent
            value="spirit"
            className="mt-0 space-y-4 sm:space-y-6 max-w-full min-w-0"
          >
            <div className="space-y-6 sm:space-y-8 max-w-full min-w-0">
              {religionContent.hookAnswer && (
                <QuestionnaireItem
                  answer={religionContent.hookAnswer}
                  worldName={WORLDS.religion.label}
                  worldColor={WORLDS.religion.accentColor}
                  worldGradient={WORLDS.religion.gradient}
                  direction={direction}
                  displayDict={displayDict}
                  budgetDisplayDict={dict.budgetDisplay}
                  locale={locale}
                />
              )}
              {hasJudaismConnectionDetails && (
                <SectionCard
                  title={displayDict.content.myConnectionToJudaism}
                  subtitle={displayDict.content.faithAndTraditionInMyLife}
                  icon={BookMarked}
                  variant="elegant"
                  gradient={THEME.colors.primary.gold}
                >
                  <div className="space-y-4 sm:space-y-5">
                    {(() => {
                      const religiousLevelData = profile.religiousLevel
                        ? formatEnumValue(
                            profile.religiousLevel,
                            religiousLevelMap,
                            ''
                          )
                        : null;
                      if (
                        religiousLevelData &&
                        religiousLevelData.label?.trim()
                      ) {
                        return (
                          <DetailItem
                            icon={BookMarked}
                            label="השקפת העולם שמנחה אותי"
                            value={religiousLevelData.label}
                            variant="highlight"
                            textAlign="start"
                            placeholder=""
                          />
                        );
                      }
                      return null;
                    })()}
                    {profile.religiousJourney && (
                      <DetailItem
                        icon={Compass}
                        label={
                          displayDict.content.detailLabels.religiousJourney
                        }
                        value={
                          formatEnumValue(
                            profile.religiousJourney,
                            religiousJourneyMap,
                            displayDict.placeholders.willDiscover
                          ).label
                        }
                        variant="elegant"
                        textAlign="start"
                        placeholder={displayDict.placeholders.willDiscover}
                      />
                    )}
                    {profile.shomerNegiah !== null &&
                      profile.shomerNegiah !== undefined && (
                        <DetailItem
                          icon={Heart}
                          label={
                            displayDict.content.detailLabels.shomerNegiah
                          }
                          value={
                            formatBooleanPreference(
                              profile.shomerNegiah,
                              {
                                ...displayDict.booleanPrefs,
                                willDiscover: '',
                              },
                              true
                            ).label
                          }
                          variant="elegant"
                          textAlign="start"
                          placeholder=""
                        />
                      )}
                    {profile.gender === 'FEMALE' && profile.headCovering && (
                      <DetailItem
                        icon={Crown}
                        label={displayDict.content.detailLabels.headCovering}
                        value={
                          formatEnumValue(
                            profile.headCovering,
                            headCoveringMap,
                            displayDict.placeholders.willDiscover
                          ).label
                        }
                        variant="elegant"
                        textAlign="start"
                        placeholder={displayDict.placeholders.willDiscover}
                      />
                    )}
                    {profile.gender === 'MALE' && profile.kippahType && (
                      <DetailItem
                        icon={Crown}
                        label={displayDict.content.detailLabels.kippahType}
                        value={
                          formatEnumValue(
                            profile.kippahType,
                            kippahTypeMap,
                            displayDict.placeholders.willDiscover
                          ).label
                        }
                        variant="elegant"
                        textAlign="start"
                        placeholder={displayDict.placeholders.willDiscover}
                      />
                    )}
                  </div>
                </SectionCard>
              )}
              {profile.influentialRabbi && (
                <SectionCard
                  title={displayDict.content.inspiringSpiritualFigure}
                  icon={Lightbulb}
                  variant="elegant"
                  gradient={THEME.colors.primary.gold}
                >
                  <div
                    className={cn(
                      'p-4 sm:p-6 rounded-2xl border border-amber-200',
                      `bg-gradient-to-r ${THEME.colors.neutral.warm}`
                    )}
                  >
                    <p className="text-amber-800 leading-relaxed italic">
                      &quot;{profile.influentialRabbi}&quot;
                    </p>
                  </div>
                </SectionCard>
              )}
              {religionContent.deeperAnswers.length > 0 && (
                <SectionCard
                  title={displayDict.content.myReligiousAndSpiritualWorld}
                  subtitle={displayDict.content.answersOnFaith}
                  icon={Star}
                  variant="elegant"
                  gradient={WORLDS.religion.gradient}
                >
                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    {religionContent.deeperAnswers.map((answer) => (
                      <QuestionnaireItem
                        key={answer.questionId}
                        answer={answer}
                        worldName={WORLDS.religion.label}
                        worldColor={WORLDS.religion.accentColor}
                        worldGradient={WORLDS.religion.gradient}
                        direction={direction}
                        displayDict={displayDict}
                        budgetDisplayDict={dict.budgetDisplay}
                        locale={locale}
                      />
                    ))}
                  </div>
                </SectionCard>
              )}
              {renderMobileNav()}
            </div>
          </TabsContent>

          {/* Vision Tab */}
          <TabsContent
            value="vision"
            className="mt-0 space-y-4 sm:space-y-6 max-w-full min-w-0"
          >
            <div className="space-y-6 sm:space-y-8 max-w-full min-w-0">
              {relationshipContent.hookAnswer && (
                <QuestionnaireItem
                  answer={relationshipContent.hookAnswer}
                  worldName={WORLDS.relationship.label}
                  worldColor={WORLDS.relationship.accentColor}
                  worldGradient={WORLDS.relationship.gradient}
                  direction={direction}
                  displayDict={displayDict}
                  budgetDisplayDict={dict.budgetDisplay}
                  locale={locale}
                />
              )}
              {profile.matchingNotes && (
                <SectionCard
                  title={displayDict.content.myDreamRelationship}
                  icon={Heart}
                  variant="romantic"
                  gradient={THEME.colors.primary.main}
                >
                  <div
                    className={cn(
                      'p-4 sm:p-6 rounded-2xl border border-rose-200 max-w-full min-w-0 overflow-hidden',
                      `bg-gradient-to-r ${THEME.colors.neutral.warm}`,
                      THEME.shadows.soft
                    )}
                  >
                    <p className="text-rose-700 leading-relaxed whitespace-pre-wrap italic text-base sm:text-lg break-words hyphens-auto word-break-break-word overflow-wrap-anywhere">
                      <Quote
                        className={cn(
                          'w-4 h-4 sm:w-5 sm:h-5 inline text-rose-400 flex-shrink-0',
                          direction === 'rtl' ? 'ml-1' : 'mr-1'
                        )}
                      />
                      {profile.matchingNotes}
                      <Quote
                        className={cn(
                          'w-4 h-4 sm:w-5 sm:h-5 inline text-rose-400 transform rotate-180 flex-shrink-0',
                          direction === 'rtl' ? 'mr-1' : 'ml-1'
                        )}
                      />
                    </p>
                  </div>
                </SectionCard>
              )}
              {profile.inspiringCoupleStory && (
                <SectionCard
                  title={displayDict.content.myRoleModelForRelationship}
                  subtitle={displayDict.content.theCoupleThatInspiresMe}
                  icon={Stars}
                  variant="elegant"
                  gradient={THEME.colors.primary.gold}
                >
                  <div
                    className={cn(
                      'p-4 sm:p-6 rounded-2xl border border-amber-200',
                      `bg-gradient-to-r ${THEME.colors.neutral.warm}`
                    )}
                  >
                    <p className="text-amber-800 leading-relaxed italic">
                      &quot;{profile.inspiringCoupleStory}&quot;
                    </p>
                  </div>
                </SectionCard>
              )}
              {relationshipContent.deeperAnswers.length > 0 && (
                <SectionCard
                  title={displayDict.content.moreOnMyVision}
                  subtitle={displayDict.content.answersOnLoveAndFamily}
                  icon={Heart}
                  variant="romantic"
                  gradient={WORLDS.relationship.gradient}
                >
                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    {relationshipContent.deeperAnswers.map((answer) => (
                      <QuestionnaireItem
                        key={answer.questionId}
                        answer={answer}
                        worldName={WORLDS.relationship.label}
                        worldColor={WORLDS.relationship.accentColor}
                        worldGradient={WORLDS.relationship.gradient}
                        direction={direction}
                        displayDict={displayDict}
                        budgetDisplayDict={dict.budgetDisplay}
                        locale={locale}
                      />
                    ))}
                  </div>
                </SectionCard>
              )}
              {renderMobileNav()}
            </div>
          </TabsContent>

          {/* Connection Tab */}
          <TabsContent
            value="connection"
            className="mt-0 space-y-4 sm:space-y-6 max-w-full min-w-0"
          >
            <div className="space-y-6 sm:space-y-8 max-w-full min-w-0">
              {partnerContent.hookAnswer && (
                <QuestionnaireItem
                  answer={partnerContent.hookAnswer}
                  worldName={WORLDS.partner.label}
                  worldColor={WORLDS.partner.accentColor}
                  worldGradient={WORLDS.partner.gradient}
                  direction={direction}
                  displayDict={displayDict}
                  budgetDisplayDict={dict.budgetDisplay}
                  locale={locale}
                />
              )}
              {hasAnyPreferences ? (
                <SectionCard
                  title={displayDict.content.matchingPreferences}
                  subtitle={displayDict.content.whatHelpsFindConnection}
                  icon={Filter}
                  variant="default"
                >
                  <div className="space-y-6 sm:space-y-8">
                    <PreferenceBadges
                      title={displayDict.content.maritalStatuses}
                      icon={Heart}
                      values={profile.preferredMaritalStatuses}
                      translationMap={maritalStatusMap}
                      gradientClass={THEME.colors.primary.main}
                      compact={false}
                      THEME={THEME}
                    />
                    <PreferenceBadges
                      title={displayDict.content.religiousLevels}
                      icon={BookMarked}
                      values={profile.preferredReligiousLevels}
                      translationMap={religiousLevelMap}
                      gradientClass={THEME.colors.secondary.peach}
                      compact={false}
                      THEME={THEME}
                    />
                    <PreferenceBadges
                      title={displayDict.content.partnerReligiousJourney}
                      icon={Compass}
                      values={profile.preferredReligiousJourneys as string[]}
                      translationMap={religiousJourneyMap}
                      gradientClass={THEME.colors.secondary.sage}
                      compact={false}
                      THEME={THEME}
                    />
                    <PreferenceBadges
                      title={displayDict.content.educationLevels}
                      icon={GraduationCap}
                      values={profile.preferredEducation}
                      translationMap={educationLevelMap}
                      gradientClass={THEME.colors.secondary.sky}
                      compact={false}
                      THEME={THEME}
                    />
                  </div>
                </SectionCard>
              ) : (
                !partnerContent.hookAnswer &&
                partnerContent.deeperAnswers.length === 0 && (
                  <EmptyState
                    icon={Compass}
                    title={displayDict.content.emptyPrefsTitle}
                    description={displayDict.content.emptyPrefsDescription}
                    variant="discovery"
                    THEME={THEME}
                  />
                )
              )}
              {partnerContent.deeperAnswers.length > 0 && (
                <SectionCard
                  title={displayDict.content.howIVisionMyPartner}
                  subtitle={displayDict.content.moreAnswersAboutPartner}
                  icon={Target}
                  variant="elegant"
                  gradient={WORLDS.partner.gradient}
                >
                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    {partnerContent.deeperAnswers.map((answer) => (
                      <QuestionnaireItem
                        key={answer.questionId}
                        answer={answer}
                        worldName={WORLDS.partner.label}
                        worldColor={WORLDS.partner.accentColor}
                        worldGradient={WORLDS.partner.gradient}
                        direction={direction}
                        displayDict={displayDict}
                        budgetDisplayDict={dict.budgetDisplay}
                        locale={locale}
                      />
                    ))}
                  </div>
                </SectionCard>
              )}
              {renderMobileNav()}
            </div>
          </TabsContent>

          {/* Professional Tab */}
          {effectiveViewMode === 'matchmaker' && (
            <TabsContent
              value="professional"
              className="mt-0 max-w-full min-w-0"
            >
              <SectionCard
                title={displayDict.content.confidentialInfo}
                subtitle={displayDict.content.professionalDetails}
                icon={Lock}
                variant="elegant"
                gradient={THEME.colors.primary.gold}
              >
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.contactPreference && (
                      <DetailItem
                        icon={Phone}
                        label={
                          displayDict.content.professionalInfo
                            .contactPreference
                        }
                        value={
                          formatEnumValue(
                            profile.contactPreference,
                            contactPreferenceMap,
                            ''
                          ).label
                        }
                        variant="elegant"
                        textAlign="start"
                        placeholder=""
                      />
                    )}
                    {profile.preferredMatchmakerGender && (
                      <DetailItem
                        icon={Users}
                        label={
                          displayDict.content.professionalInfo
                            .matchmakerGenderPref
                        }
                        value={
                          profile.preferredMatchmakerGender === 'MALE'
                            ? displayDict.content.professionalInfo
                                .matchmakerMale
                            : displayDict.content.professionalInfo
                                .matchmakerFemale
                        }
                        variant="elegant"
                        textAlign="start"
                        placeholder=""
                      />
                    )}
                  </div>
                  {profile.hasMedicalInfo && (
                    <DetailItem
                      icon={Heart}
                      label={displayDict.content.professionalInfo.medicalInfo}
                      value={
                        profile.isMedicalInfoVisible
                          ? displayDict.content.professionalInfo
                              .medicalInfoVisible
                          : displayDict.content.professionalInfo
                              .medicalInfoDiscreet
                      }
                      variant="elegant"
                      textAlign="start"
                      tooltip={profile.medicalInfoDetails || undefined}
                      placeholder={displayDict.placeholders.willDiscover}
                    />
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>
                        {displayDict.content.professionalInfo.profileCreated}{' '}
                        {profile.createdAt
                          ? new Date(profile.createdAt).toLocaleDateString(
                              locale
                            )
                          : displayDict.content.professionalInfo.unknown}
                      </span>
                    </div>
                    {profile.lastActive && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>
                          {displayDict.content.professionalInfo.lastActive}{' '}
                          {new Date(profile.lastActive).toLocaleDateString(
                            locale
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </SectionCard>
              {renderMobileNav()}
            </TabsContent>
          )}
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
