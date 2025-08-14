// src/components/profile/tabs/RelationshipTab.tsx
import React from 'react';
import { UserProfile, QuestionnaireResponse } from '@/types/next-auth';
import Section from '../shared/Section';
import InfoBlock from '../shared/InfoBlock';
import QuoteBlock from '../shared/QuoteBlock';
import PreferencesGrid from '../shared/PreferencesGrid';
import { Heart, MessageCircle, Baby, Users } from 'lucide-react';
import { findAnswer } from '@/lib/utils/questionnaireUtils';

const maritalStatusOptions = [
  { value: "single", label: "רווק/ה" },
  { value: "divorced", label: "גרוש/ה" },
  { value: "widowed", label: "אלמן/ה" },
  { value: "annulled", label: "נישואין שבוטלו" },
  { value: "any", label: "כל האפשרויות פתוחות" },
];

interface RelationshipTabProps {
  profile: UserProfile;
  questionnaire: QuestionnaireResponse | null;
}

const RelationshipTab: React.FC<RelationshipTabProps> = ({ profile, questionnaire }) => {
  const inspiringCoupleStory = profile.inspiringCoupleStory;
  const coreMeaning = findAnswer(questionnaire, 'relationship_core_meaning_revised');
  const conflictHandling = findAnswer(questionnaire, 'relationship_handling_partner_disappointment_revised');
  const childrenVision = findAnswer(questionnaire, 'relationship_family_vision_children_revised');
  
  const preferredStatuses = profile.preferredMaritalStatuses
    ?.map(statusValue => maritalStatusOptions.find(opt => opt.value === statusValue))
    .filter((item): item is { value: string; label: string; } => !!item);
    
  return (
    <div className="space-y-6">
       <Section title="תמצית הזוגיות בעיניי" icon={Heart}>
          <div className="space-y-4">
             <QuoteBlock
                quote={inspiringCoupleStory}
                source={`הזוג שנותן לי השראה, ${profile.user?.firstName}`}
             />
             <InfoBlock
                icon={Heart}
                label="הלב הפועם של שותפות זוגית"
                value={coreMeaning}
             />
             <InfoBlock
                icon={MessageCircle}
                label="הנטייה הטבעית שלי במקרה של אכזבה"
                value={conflictHandling}
             />
          </div>
       </Section>
       
       <Section title="החזון למשפחה" icon={Users}>
          <div className="space-y-4">
             <InfoBlock
                icon={Baby}
                label="מקום ההורות בחזון האישי שלי"
                value={childrenVision}
             />
             <PreferencesGrid
                label="מצב משפחתי מועדף"
                items={preferredStatuses}
             />
          </div>
       </Section>
    </div>
  );
};

export default RelationshipTab;