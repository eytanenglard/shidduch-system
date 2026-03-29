'use client';

import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Heart, Stars } from 'lucide-react';
import SectionCard from '../shared/SectionCard';
import QuestionnaireItem from './QuestionnaireItem';
import SoulFingerprintSection from './SoulFingerprintSection';
import { useProfileTab } from './ProfileTabContext';

const VisionTab: React.FC = () => {
  const {
    profile,
    direction,
    locale,
    displayDict,
    dict,
    WORLDS,
    relationshipContent,
    sfAnswers,
    renderMobileNav,
    SectionDivider,
  } = useProfileTab();

  return (
    <TabsContent
      value="vision"
      className="mt-0 max-w-full min-w-0 animate-in fade-in-0 duration-200"
    >
      <div className="space-y-3 md:space-y-6 max-w-full min-w-0" dir={direction}>
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
              subtitle={displayDict.content.questionnaire.fromSoulFingerprint}
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
        {sfAnswers && (
          <>
            <SectionDivider />
            <SoulFingerprintSection
              sfAnswers={sfAnswers}
              sectionIds={['family', 'relationship']}
              gender={profile.gender}
              locale={locale}
              direction={direction}
              selfOnly
            />
          </>
        )}
        {renderMobileNav()}
      </div>
    </TabsContent>
  );
};

export default VisionTab;
