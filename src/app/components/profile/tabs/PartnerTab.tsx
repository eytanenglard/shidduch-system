// src/components/profile/tabs/PartnerTab.tsx
import React from 'react';
import { UserProfile, QuestionnaireResponse } from '@/types/next-auth';
import Section from '../shared/Section';
import InfoBlock from '../shared/InfoBlock';
import QuoteBlock from '../shared/QuoteBlock';
import PreferencesGrid from '../shared/PreferencesGrid';
import {
  Target,
  Lightbulb,
  GraduationCap,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import { findAnswer } from '@/lib/utils/questionnaireUtils';

const educationPreferenceOptions = [
  { value: 'תיכונית', label: 'תיכונית' },
  { value: 'על תיכונית', label: 'על תיכונית' },
  { value: 'אקדמית', label: 'אקדמית' },
  { value: 'תורנית', label: 'תורנית' },
  { value: 'ללא העדפה', label: 'ללא העדפה' },
];

interface PartnerTabProps {
  profile: UserProfile;
  questionnaire: QuestionnaireResponse | null;
}

const PartnerTab: React.FC<PartnerTabProps> = ({ profile, questionnaire }) => {
  const completionTrait = findAnswer(questionnaire, 'partner_completion_trait');
  const dealBreakers = findAnswer(
    questionnaire,
    'partner_deal_breakers_open_text_revised'
  );

  const preferredEducation = profile.preferredEducation
    ?.map((eduValue) =>
      educationPreferenceOptions.find((opt) => opt.value === eduValue)
    )
    .filter((item): item is { value: string; label: string } => !!item);

  const preferredLocations = profile.preferredLocations?.map((loc) => ({
    value: loc,
    label: loc,
  }));

  return (
    <div className="space-y-6">
      <Section
        title="החיפוש שלי"
        icon={Target}
        subtitle="התכונות, הערכים והרקע שאני מחפש/ת בשותפ/ה לחיים."
      >
        <div className="space-y-4">
          <QuoteBlock
            quote={profile.matchingNotes}
            source={`תיאור המועמד/ת המבוקש/ת, ${profile.user?.firstName}`}
          />
          <QuoteBlock
            quote={completionTrait}
            source="התכונה שהייתי שמח/ה שתשלים אותי"
          />
          <InfoBlock
            icon={AlertTriangle}
            label="הקו האדום שלי"
            value={dealBreakers}
          />
        </div>
      </Section>

      <Section title="העדפות וגמישות" icon={Lightbulb}>
        <div className="space-y-4">
          <PreferencesGrid
            label="רמות השכלה מועדפות"
            items={preferredEducation}
          />
          <PreferencesGrid
            label="אזורי מגורים מועדפים"
            items={preferredLocations}
          />
          {/* You can add more PreferencesGrid components here for other preferences like religious levels etc. */}
        </div>
      </Section>
    </div>
  );
};

export default PartnerTab;
