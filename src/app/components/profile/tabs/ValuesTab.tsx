// src/components/profile/tabs/ValuesTab.tsx
import React from 'react';
import { UserProfile, QuestionnaireResponse } from '@/types/next-auth';
import Section from '../shared/Section';
import InfoBlock from '../shared/InfoBlock';
import QuoteBlock from '../shared/QuoteBlock';
import { PiggyBank, Scale, Activity, ShieldCheck } from 'lucide-react';
import { findAnswer } from '@/lib/utils/questionnaireUtils';

interface ValuesTabProps {
  profile: UserProfile;
  questionnaire: QuestionnaireResponse | null;
}

const ValuesTab: React.FC<ValuesTabProps> = ({ profile, questionnaire }) => {
  const coreElaboration = findAnswer(
    questionnaire,
    'values_core_elaboration_revised'
  );
  const richLifeDefinition = findAnswer(
    questionnaire,
    'values_definition_of_rich_life'
  );
  const moneyAttitude = findAnswer(
    questionnaire,
    'values_attitude_towards_money_revised'
  );
  const healthImportance = findAnswer(
    questionnaire,
    'values_health_lifestyle_importance'
  );

  return (
    <div className="space-y-6">
      <Section
        title="מצפן ערכי"
        icon={ShieldCheck}
        subtitle="מה שמנחה אותי בהחלטות החשובות בחיים."
      >
        <div className="space-y-4">
          <QuoteBlock
            quote={coreElaboration}
            source={`סיפור על הערך שהכי מוביל אותי, ${profile.user?.firstName}`}
          />
          <QuoteBlock
            quote={richLifeDefinition}
            source="ההגדרה שלי ל'חיים עשירים'"
          />
        </div>
      </Section>

      <Section title="ערכים בפעולה" icon={Scale}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoBlock
            icon={PiggyBank}
            label="מערכת היחסים שלי עם כסף"
            value={moneyAttitude}
          />
          <InfoBlock
            icon={Activity}
            label="חשיבות בריאות ואורח חיים (1-נמוכה, 10-גבוהה)"
            value={healthImportance ? `דירוג: ${healthImportance}` : 'לא צוין'}
          />
        </div>
      </Section>
    </div>
  );
};

export default ValuesTab;
