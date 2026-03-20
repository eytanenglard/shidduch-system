'use client';

import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { BRAND } from '../../constants/theme';
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
  // Auto-scroll active tab into view
  const tabBarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!tabBarRef.current) return;
    const activeBtn = tabBarRef.current.querySelector('[data-active="true"]');
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

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

  // Divider between major sections
  const SectionDivider = () => (
    <div className="border-t border-gray-100 my-2" />
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
          {/* Essence Tab */}
          <TabsContent value="essence" className="mt-0 max-w-full min-w-0 animate-in fade-in-0 duration-200">
            <div className="space-y-6 max-w-full min-w-0" dir={direction}>
              {profile.profileHeadline && (
                <div className={cn(
                  'py-4 px-6 rounded-xl',
                  THEME.accentBgLight
                )}>
                  <p className={cn(
                    'text-center text-lg italic font-medium break-words',
                    THEME.accentTextDark
                  )}>
                    &quot;{profile.profileHeadline}&quot;
                  </p>
                </div>
              )}

              {profile.about && (
                <SectionCard
                  title={dict.display.content.aboutMe.titleCard.replace(
                    '{{name}}',
                    profile.user?.firstName || ''
                  )}
                  icon={User}
                >
                  <p className="whitespace-pre-wrap text-gray-700 leading-relaxed break-words">
                    {profile.about}
                  </p>
                </SectionCard>
              )}

              {profile.isFriendsSectionVisible &&
                (profile.testimonials || []).filter(
                  (t) => t.status === 'APPROVED'
                ).length > 0 && (
                  <>
                    <SectionDivider />
                    <SectionCard
                      title={displayDict.content.recommendationsTitle.replace(
                        '{{name}}',
                        profile.user?.firstName || ''
                      )}
                      subtitle={displayDict.content.recommendationsSubtitle}
                      icon={MessageSquareQuote}
                    >
                      <FriendTestimonials
                        profile={profile}
                        dict={displayDict}
                        THEME={THEME}
                        direction={direction}
                      />
                    </SectionCard>
                  </>
                )}

              {personalityContent.hookAnswer && (
                <>
                  <SectionDivider />
                  <QuestionnaireItem
                    answer={personalityContent.hookAnswer}
                    worldName={WORLDS.personality.label}
                    worldColor={WORLDS.personality.color}
                    direction={direction}
                    displayDict={displayDict}
                    budgetDisplayDict={dict.budgetDisplay}
                    locale={locale}
                  />
                </>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-full min-w-0">
                {profile.profileCharacterTraits &&
                  profile.profileCharacterTraits.length > 0 && (
                    <SectionCard
                      title={displayDict.content.whatMakesMeSpecial}
                      subtitle={displayDict.content.myTraits}
                      icon={Sparkles}
                    >
                      <div className="flex flex-wrap gap-2">
                        {profile.profileCharacterTraits.map((trait) => {
                          const traitData = formatEnumValue(
                            trait,
                            characterTraitMap,
                            trait
                          );
                          return (
                            <Badge
                              key={trait}
                              variant="outline"
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-50/60 border-purple-200/80 text-purple-700 rounded-full"
                            >
                              <traitData.icon
                                className={cn(
                                  'w-3 h-3 flex-shrink-0',
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
                    >
                      <div className="flex flex-wrap gap-2">
                        {profile.profileHobbies.map((hobby) => {
                          const hobbyData = formatEnumValue(
                            hobby,
                            hobbiesMap,
                            hobby
                          );
                          return (
                            <Badge
                              key={hobby}
                              variant="outline"
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-50/60 border-emerald-200/80 text-emerald-700 rounded-full"
                            >
                              <hobbyData.icon
                                className={cn(
                                  'w-3 h-3 flex-shrink-0',
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
                <>
                  <SectionDivider />
                  <SectionCard
                    title={displayDict.content.deepDivePersonality}
                    subtitle={displayDict.content.moreAnswersPersonality}
                    icon={Telescope}
                  >
                    <div className="grid grid-cols-1 gap-4">
                      {personalityContent.deeperAnswers.map((answer) => (
                        <QuestionnaireItem
                          key={answer.questionId}
                          answer={answer}
                          worldName={WORLDS.personality.label}
                          worldColor={WORLDS.personality.color}
                          direction={direction}
                          displayDict={displayDict}
                          budgetDisplayDict={dict.budgetDisplay}
                          locale={locale}
                        />
                      ))}
                    </div>
                  </SectionCard>
                </>
              )}
              {renderMobileNav()}
            </div>
          </TabsContent>

          {/* Journey Tab (includes spirit content) */}
          <TabsContent
            value="journey"
            className="mt-0 max-w-full min-w-0 animate-in fade-in-0 duration-200"
          >
            <div className="space-y-6 max-w-full min-w-0" dir={direction}>
              {valuesContent.hookAnswer && (
                <QuestionnaireItem
                  answer={valuesContent.hookAnswer}
                  worldName={WORLDS.values.label}
                  worldColor={WORLDS.values.color}
                  direction={direction}
                  displayDict={displayDict}
                  budgetDisplayDict={dict.budgetDisplay}
                  locale={locale}
                />
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {hasEducationAndCareerDetails && (
                  <SectionCard
                    title={displayDict.content.educationAndCareer}
                    subtitle={displayDict.content.academicAndProfessionalPath}
                    icon={GraduationCap}
                  >
                    <div className="space-y-1">
                      {profile.educationLevel && (
                        <DetailItem
                          icon={GraduationCap}
                          label={displayDict.content.detailLabels.educationLevel}
                          value={
                            formatEnumValue(
                              profile.educationLevel,
                              educationLevelMap,
                              ''
                            ).label
                          }
                        />
                      )}
                      {profile.education && (
                        <DetailItem
                          icon={BookOpen}
                          label={displayDict.content.detailLabels.educationDetails}
                          value={profile.education}
                        />
                      )}
                      {profile.occupation && (
                        <DetailItem
                          icon={Briefcase}
                          label={displayDict.content.detailLabels.professionalField}
                          value={profile.occupation}
                        />
                      )}
                      {profile.serviceType && (
                        <DetailItem
                          icon={Award}
                          label={displayDict.content.detailLabels.militaryService}
                          value={
                            formatEnumValue(
                              profile.serviceType,
                              serviceTypeMap,
                              ''
                            ).label
                          }
                        />
                      )}
                      {profile.serviceDetails && (
                        <DetailItem
                          icon={InfoIcon}
                          label={displayDict.content.detailLabels.serviceDetails}
                          value={profile.serviceDetails}
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
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {profile.parentStatus && (
                        <DetailItem
                          icon={Users2}
                          label={displayDict.content.detailLabels.parentStatus}
                          value={profile.parentStatus}
                        />
                      )}
                      {profile.fatherOccupation && (
                        <DetailItem
                          icon={Briefcase}
                          label={displayDict.content.detailLabels.fatherOccupation}
                          value={profile.fatherOccupation}
                        />
                      )}
                      {profile.motherOccupation && (
                        <DetailItem
                          icon={Briefcase}
                          label={displayDict.content.detailLabels.motherOccupation}
                          value={profile.motherOccupation}
                        />
                      )}
                      {profile.siblings !== null &&
                        profile.siblings !== undefined && (
                          <DetailItem
                            icon={Users}
                            label={displayDict.content.detailLabels.siblings}
                            value={`${profile.siblings} אחים/אחיות`}
                          />
                        )}
                      {profile.position && (
                        <DetailItem
                          icon={Crown}
                          label={displayDict.content.detailLabels.birthOrder}
                          value={`מקום ${profile.position}`}
                        />
                      )}
                      {profile.aliyaCountry && (
                        <DetailItem
                          icon={Globe}
                          label={displayDict.content.detailLabels.countryOfOrigin}
                          value={`${profile.aliyaCountry} - השורשים שלי`}
                        />
                      )}
                      {profile.aliyaYear && (
                        <DetailItem
                          icon={Calendar}
                          label={displayDict.content.detailLabels.aliyaYear}
                          value={`${profile.aliyaYear} - הגעתי הביתה`}
                        />
                      )}
                    </div>
                  </SectionCard>
                )}
              </div>

              {valuesContent.deeperAnswers.length > 0 && (
                <>
                  <SectionDivider />
                  <SectionCard
                    title={displayDict.content.valuesAndPrinciples}
                    subtitle={displayDict.content.answersOnWhatMatters}
                    icon={BookMarked}
                  >
                    <div className="grid grid-cols-1 gap-4">
                      {valuesContent.deeperAnswers.map((answer) => (
                        <QuestionnaireItem
                          key={answer.questionId}
                          answer={answer}
                          worldName={WORLDS.values.label}
                          worldColor={WORLDS.values.color}
                          direction={direction}
                          displayDict={displayDict}
                          budgetDisplayDict={dict.budgetDisplay}
                          locale={locale}
                        />
                      ))}
                    </div>
                  </SectionCard>
                </>
              )}

              {/* Spirit content (merged into journey) */}
              {(religionContent.hookAnswer || hasJudaismConnectionDetails || profile.influentialRabbi || religionContent.deeperAnswers.length > 0) && (
                <SectionDivider />
              )}

              {religionContent.hookAnswer && (
                <QuestionnaireItem
                  answer={religionContent.hookAnswer}
                  worldName={WORLDS.religion.label}
                  worldColor={WORLDS.religion.color}
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
                >
                  <div className="space-y-1">
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
                          />
                        );
                      }
                      return null;
                    })()}
                    {profile.religiousJourney && (
                      <DetailItem
                        icon={Compass}
                        label={displayDict.content.detailLabels.religiousJourney}
                        value={
                          formatEnumValue(
                            profile.religiousJourney,
                            religiousJourneyMap,
                            displayDict.placeholders.willDiscover
                          ).label
                        }
                      />
                    )}
                    {profile.shomerNegiah !== null &&
                      profile.shomerNegiah !== undefined && (
                        <DetailItem
                          icon={Heart}
                          label={displayDict.content.detailLabels.shomerNegiah}
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
                      />
                    )}
                  </div>
                </SectionCard>
              )}

              {profile.influentialRabbi && (
                <SectionCard
                  title={displayDict.content.inspiringSpiritualFigure}
                  icon={Lightbulb}
                >
                  <p className="text-gray-700 leading-relaxed italic">
                    &quot;{profile.influentialRabbi}&quot;
                  </p>
                </SectionCard>
              )}

              {religionContent.deeperAnswers.length > 0 && (
                <SectionCard
                  title={displayDict.content.myReligiousAndSpiritualWorld}
                  subtitle={displayDict.content.answersOnFaith}
                  icon={Star}
                >
                  <div className="grid grid-cols-1 gap-4">
                    {religionContent.deeperAnswers.map((answer) => (
                      <QuestionnaireItem
                        key={answer.questionId}
                        answer={answer}
                        worldName={WORLDS.religion.label}
                        worldColor={WORLDS.religion.color}
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
            className="mt-0 max-w-full min-w-0 animate-in fade-in-0 duration-200"
          >
            <div className="space-y-6 max-w-full min-w-0" dir={direction}>
              {relationshipContent.hookAnswer && (
                <QuestionnaireItem
                  answer={relationshipContent.hookAnswer}
                  worldName={WORLDS.relationship.label}
                  worldColor={WORLDS.relationship.color}
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
                >
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap italic break-words">
                    &quot;{profile.matchingNotes}&quot;
                  </p>
                </SectionCard>
              )}

              {profile.inspiringCoupleStory && (
                <>
                  <SectionDivider />
                  <SectionCard
                    title={displayDict.content.myRoleModelForRelationship}
                    subtitle={displayDict.content.theCoupleThatInspiresMe}
                    icon={Stars}
                  >
                    <p className="text-gray-700 leading-relaxed italic">
                      &quot;{profile.inspiringCoupleStory}&quot;
                    </p>
                  </SectionCard>
                </>
              )}

              {relationshipContent.deeperAnswers.length > 0 && (
                <>
                  <SectionDivider />
                  <SectionCard
                    title={displayDict.content.moreOnMyVision}
                    subtitle={displayDict.content.answersOnLoveAndFamily}
                    icon={Heart}
                  >
                    <div className="grid grid-cols-1 gap-4">
                      {relationshipContent.deeperAnswers.map((answer) => (
                        <QuestionnaireItem
                          key={answer.questionId}
                          answer={answer}
                          worldName={WORLDS.relationship.label}
                          worldColor={WORLDS.relationship.color}
                          direction={direction}
                          displayDict={displayDict}
                          budgetDisplayDict={dict.budgetDisplay}
                          locale={locale}
                        />
                      ))}
                    </div>
                  </SectionCard>
                </>
              )}
              {renderMobileNav()}
            </div>
          </TabsContent>

          {/* Connection Tab */}
          <TabsContent
            value="connection"
            className="mt-0 max-w-full min-w-0 animate-in fade-in-0 duration-200"
          >
            <div className="space-y-6 max-w-full min-w-0" dir={direction}>
              {partnerContent.hookAnswer && (
                <QuestionnaireItem
                  answer={partnerContent.hookAnswer}
                  worldName={WORLDS.partner.label}
                  worldColor={WORLDS.partner.color}
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
                >
                  <div className="space-y-6">
                    <PreferenceBadges
                      title={displayDict.content.maritalStatuses}
                      icon={Heart}
                      values={profile.preferredMaritalStatuses}
                      translationMap={maritalStatusMap}
                    />
                    <PreferenceBadges
                      title={displayDict.content.religiousLevels}
                      icon={BookMarked}
                      values={profile.preferredReligiousLevels}
                      translationMap={religiousLevelMap}
                    />
                    <PreferenceBadges
                      title={displayDict.content.partnerReligiousJourney}
                      icon={Compass}
                      values={profile.preferredReligiousJourneys as string[]}
                      translationMap={religiousJourneyMap}
                    />
                    <PreferenceBadges
                      title={displayDict.content.educationLevels}
                      icon={GraduationCap}
                      values={profile.preferredEducation}
                      translationMap={educationLevelMap}
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
                  />
                )
              )}

              {partnerContent.deeperAnswers.length > 0 && (
                <>
                  <SectionDivider />
                  <SectionCard
                    title={displayDict.content.howIVisionMyPartner}
                    subtitle={displayDict.content.moreAnswersAboutPartner}
                    icon={Target}
                  >
                    <div className="grid grid-cols-1 gap-4">
                      {partnerContent.deeperAnswers.map((answer) => (
                        <QuestionnaireItem
                          key={answer.questionId}
                          answer={answer}
                          worldName={WORLDS.partner.label}
                          worldColor={WORLDS.partner.color}
                          direction={direction}
                          displayDict={displayDict}
                          budgetDisplayDict={dict.budgetDisplay}
                          locale={locale}
                        />
                      ))}
                    </div>
                  </SectionCard>
                </>
              )}
              {renderMobileNav()}
            </div>
          </TabsContent>

          {/* Professional Tab (matchmaker only) */}
          {effectiveViewMode === 'matchmaker' && (
            <TabsContent
              value="professional"
              className="mt-0 max-w-full min-w-0 animate-in fade-in-0 duration-200"
            >
              <div dir={direction}>
                <SectionCard
                  title={displayDict.content.confidentialInfo}
                  subtitle={displayDict.content.professionalDetails}
                  icon={Lock}
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      {profile.contactPreference && (
                        <DetailItem
                          icon={Phone}
                          label={displayDict.content.professionalInfo.contactPreference}
                          value={
                            formatEnumValue(
                              profile.contactPreference,
                              contactPreferenceMap,
                              ''
                            ).label
                          }
                        />
                      )}
                      {profile.preferredMatchmakerGender && (
                        <DetailItem
                          icon={Users}
                          label={displayDict.content.professionalInfo.matchmakerGenderPref}
                          value={
                            profile.preferredMatchmakerGender === 'MALE'
                              ? displayDict.content.professionalInfo.matchmakerMale
                              : displayDict.content.professionalInfo.matchmakerFemale
                          }
                        />
                      )}
                    </div>
                    {profile.hasMedicalInfo && (
                      <DetailItem
                        icon={Heart}
                        label={displayDict.content.professionalInfo.medicalInfo}
                        value={
                          profile.isMedicalInfoVisible
                            ? displayDict.content.professionalInfo.medicalInfoVisible
                            : displayDict.content.professionalInfo.medicalInfoDiscreet
                        }
                        tooltip={profile.medicalInfoDetails || undefined}
                      />
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>
                          {displayDict.content.professionalInfo.profileCreated}{' '}
                          {profile.createdAt
                            ? new Date(profile.createdAt).toLocaleDateString(locale)
                            : displayDict.content.professionalInfo.unknown}
                        </span>
                      </div>
                      {profile.lastActive && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>
                            {displayDict.content.professionalInfo.lastActive}{' '}
                            {new Date(profile.lastActive).toLocaleDateString(locale)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </SectionCard>
                {renderMobileNav()}
              </div>
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
