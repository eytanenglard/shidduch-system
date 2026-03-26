'use client';

import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import {
  Heart,
  Star,
  Users,
  Users2,
  BookOpen,
  Briefcase,
  Award,
  GraduationCap,
  Crown,
  Globe,
  Calendar,
  Compass,
  BookMarked,
  Lightbulb,
  InfoIcon,
} from 'lucide-react';
import SectionCard from '../shared/SectionCard';
import DetailItem from '../shared/DetailItem';
import QuestionnaireItem from './QuestionnaireItem';
import { formatEnumValue, formatBooleanPreference } from '../../utils/formatters';
import { useProfileTab } from './ProfileTabContext';

const JourneyTab: React.FC = () => {
  const {
    profile,
    direction,
    locale,
    displayDict,
    dict,
    WORLDS,
    valuesContent,
    religionContent,
    hasEducationAndCareerDetails,
    hasFamilyBackgroundDetails,
    hasJudaismConnectionDetails,
    educationLevelMap,
    serviceTypeMap,
    religiousLevelMap,
    religiousJourneyMap,
    headCoveringMap,
    kippahTypeMap,
    renderMobileNav,
    SectionDivider,
  } = useProfileTab();

  return (
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
  );
};

export default JourneyTab;
