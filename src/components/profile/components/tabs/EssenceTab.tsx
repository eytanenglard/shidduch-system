'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Heart,
  User,
  Telescope,
  MessageSquareQuote,
  Fingerprint,
} from 'lucide-react';
import SectionCard from '../shared/SectionCard';
import EmptyState from '../shared/EmptyState';
import QuestionnaireItem from './QuestionnaireItem';
import SoulFingerprintSection from './SoulFingerprintSection';
import FriendTestimonials from '../content/FriendTestimonials';
import { formatEnumValue } from '../../utils/formatters';
import { useProfileTab } from './ProfileTabContext';

const EssenceTab: React.FC = () => {
  const {
    profile,
    direction,
    locale,
    displayDict,
    dict,
    THEME,
    WORLDS,
    personalityContent,
    sfAnswers,
    isOwnProfile,
    characterTraitMap,
    hobbiesMap,
    renderMobileNav,
    SectionDivider,
  } = useProfileTab();

  return (
    <TabsContent value="essence" className="mt-0 max-w-full min-w-0 animate-in fade-in-0 duration-200">
      <div className="space-y-3 md:space-y-6 max-w-full min-w-0" dir={direction}>
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
              subtitle={displayDict.content.questionnaire.fromSoulFingerprint}
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
        {sfAnswers ? (
          <>
            <SectionDivider />
            <SoulFingerprintSection
              sfAnswers={sfAnswers}
              sectionIds={['personality', 'lifestyle']}
              gender={profile.gender}
              locale={locale}
              direction={direction}
              selfOnly
            />
          </>
        ) : isOwnProfile ? (
          <>
            <SectionDivider />
            <EmptyState
              icon={Fingerprint}
              title={locale === 'he' ? 'טביעת הנשמה שלך עדיין לא הושלמה' : 'Your Soul Fingerprint is not yet complete'}
              description={locale === 'he' ? 'השלם/י את טביעת הנשמה כדי להעשיר את הפרופיל ולשפר את איכות ההתאמות' : 'Complete your Soul Fingerprint to enrich your profile and improve match quality'}
            />
          </>
        ) : null}
        {renderMobileNav()}
      </div>
    </TabsContent>
  );
};

export default EssenceTab;
