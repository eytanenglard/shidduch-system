// src/components/profile/tabs/PersonalityTab.tsx
import React from 'react';
import { UserProfile, QuestionnaireResponse } from '@/types/next-auth';
import Section from '../shared/Section';
import InfoBlock from '../shared/InfoBlock';
import QuoteBlock from '../shared/QuoteBlock';
import { Badge } from '@/components/ui/badge';
import { Heart, Brain, Users, Compass, Clock } from 'lucide-react';
import { findAnswer } from '@/lib/utils/questionnaireUtils';

interface PersonalityTabProps {
  profile: UserProfile;
  questionnaire: QuestionnaireResponse | null;
}

const PersonalityTab: React.FC<PersonalityTabProps> = ({
  profile,
  questionnaire,
}) => {
  const selfPortrayal = findAnswer(
    questionnaire,
    'personality_self_portrayal_revised'
  );
  const socialBatteryRecharge = findAnswer(
    questionnaire,
    'personality_social_battery_recharge'
  );
  const biologicalClock = findAnswer(
    questionnaire,
    'personality_biological_clock'
  );
  const humorStory = profile.humorStory;

  return (
    <div className="space-y-6">
      <Section title="הסיפור שלי" icon={Heart} subtitle="מי אני, במילים שלי.">
        <div className="space-y-4">
          <QuoteBlock
            quote={selfPortrayal}
            source={`כך אני רואה את עצמי, ${profile.user?.firstName}`}
          />
          <QuoteBlock quote={humorStory} source="סיפור קטן על חוש ההומור שלי" />
        </div>
      </Section>

      <Section title="סגנון חיים ואנרגיות" icon={Compass}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoBlock
            icon={Users}
            label="טעינת 'סוללה חברתית'"
            value={socialBatteryRecharge}
          />
          <InfoBlock
            icon={Clock}
            label="שעון ביולוגי (1-בוקר, 10-לילה)"
            value={biologicalClock ? `דירוג: ${biologicalClock}` : 'לא צוין'}
          />
          <InfoBlock
            icon={Brain}
            label="תחביבים"
            value={
              profile.profileHobbies && profile.profileHobbies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.profileHobbies.map((hobby) => (
                    <Badge key={hobby}>{hobby}</Badge>
                  ))}
                </div>
              ) : (
                'לא צוינו תחביבים'
              )
            }
          />
        </div>
      </Section>
    </div>
  );
};

export default PersonalityTab;
