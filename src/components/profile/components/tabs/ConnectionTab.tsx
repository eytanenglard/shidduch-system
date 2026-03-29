'use client';

import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import {
  Heart,
  GraduationCap,
  Compass,
  Target,
  Filter,
  BookMarked,
} from 'lucide-react';
import SectionCard from '../shared/SectionCard';
import EmptyState from '../shared/EmptyState';
import PreferenceBadges from '../shared/PreferenceBadges';
import QuestionnaireItem from './QuestionnaireItem';
import SoulFingerprintSection from './SoulFingerprintSection';
import { useProfileTab } from './ProfileTabContext';

const ConnectionTab: React.FC = () => {
  const {
    profile,
    direction,
    locale,
    displayDict,
    dict,
    WORLDS,
    partnerContent,
    sfAnswers,
    hasAnyPreferences,
    maritalStatusMap,
    religiousLevelMap,
    religiousJourneyMap,
    educationLevelMap,
    renderMobileNav,
    SectionDivider,
  } = useProfileTab();

  return (
    <TabsContent
      value="connection"
      className="mt-0 max-w-full min-w-0 animate-in fade-in-0 duration-200"
    >
      <div className="space-y-3 md:space-y-6 max-w-full min-w-0" dir={direction}>
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
              subtitle={displayDict.content.questionnaire.fromSoulFingerprint}
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
        {sfAnswers && (
          <>
            <SectionDivider />
            <SoulFingerprintSection
              sfAnswers={sfAnswers}
              sectionIds={['identity', 'background', 'personality', 'career', 'lifestyle', 'family', 'relationship']}
              gender={profile.gender}
              locale={locale}
              direction={direction}
              partnerOnly
            />
          </>
        )}
        {renderMobileNav()}
      </div>
    </TabsContent>
  );
};

export default ConnectionTab;
