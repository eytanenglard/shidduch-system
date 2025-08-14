// src/components/profile/tabs/ReligionTab.tsx
import React from 'react';
import { UserProfile, QuestionnaireResponse, HeadCoveringType } from '@/types/next-auth';
import Section from '../shared/Section';
import InfoBlock from '../shared/InfoBlock';
import QuoteBlock from '../shared/QuoteBlock';
import { Badge } from '@/components/ui/badge';
import { BookMarked, ShieldCheck, Star, Sparkles, HandHeart } from 'lucide-react';
import { findAnswer } from '@/lib/utils/questionnaireUtils';

interface ReligionTabProps {
  profile: UserProfile;
  questionnaire: QuestionnaireResponse | null;
}

const religiousLevelMap: { [key: string]: string } = {
  charedi: "חרדי/ת",
  charedi_modern: "חרדי/ת מודרני/ת",
  dati_leumi_torani: "דתי/ה לאומי/ת תורני/ת",
  dati_leumi_liberal: "דתי/ה לאומי/ת ליברלי/ת",
  dati_leumi_standard: "דתי/ה לאומי/ת",
  masorti_strong: "מסורתי/ת (חזק)",
  masorti_light: "מסורתי/ת (קל)",
  secular_traditional_connection: "חילוני/ת עם זיקה",
  secular: "חילוני/ת",
  spiritual_not_religious: "רוחני/ת",
  other: "אחר",
};

const headCoveringMap: { [key in HeadCoveringType | 'any']?: string } = {
  FULL_COVERAGE: "כיסוי ראש מלא",
  PARTIAL_COVERAGE: "כיסוי ראש חלקי",
  HAT_BERET: "כובע / ברט",
  SCARF_ONLY_SOMETIMES: "מטפחת לאירועים",
  NONE: "ללא כיסוי ראש",
  any: "כל האפשרויות פתוחות"
};

const ReligionTab: React.FC<ReligionTabProps> = ({ profile, questionnaire }) => {
  if (!profile) return <div>טוען נתונים...</div>;

  const coreFaithFeeling = findAnswer(questionnaire, 'religion_core_feeling_of_faith');
  const shabbatExperience = findAnswer(questionnaire, 'religion_shabbat_experience');
  const influentialRabbi = profile.influentialRabbi;
  const educationVision = findAnswer(questionnaire, 'religion_children_education_religious_vision_revised');

  return (
    <div className="space-y-6">
      <Section title="דת, אמונה ומסורת" icon={BookMarked} subtitle="החיבור שלי לרוח, המסורת וההלכה.">
        <div className="space-y-4">
          <QuoteBlock
            quote={influentialRabbi}
            source={`הדמות שהשפיעה עליי, ${profile.user?.firstName}`}
          />
          <InfoBlock
            icon={Sparkles}
            label="התחושה שהאמונה מעניקה לי"
            value={coreFaithFeeling}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoBlock
                icon={Star}
                label="הגדרה דתית"
                value={religiousLevelMap[profile.religiousLevel || ''] || profile.religiousLevel}
            />
             <InfoBlock
                icon={ShieldCheck}
                label="שמירת נגיעה"
                value={profile.shomerNegiah ? "שומר/ת" : "לא שומר/ת"}
            />
            {profile.gender === 'FEMALE' && profile.headCovering && (
                 <InfoBlock
                    icon={ShieldCheck}
                    label="כיסוי ראש"
                    value={headCoveringMap[profile.headCovering as HeadCoveringType] || profile.headCovering}
                />
            )}
            {/* Add Kippah info for men similarly if you have a map for it */}
          </div>
        </div>
      </Section>

      <Section title="החזון לבית יהודי" icon={HandHeart}>
         <div className="space-y-4">
            <InfoBlock
                icon={Star}
                label="חווית השבת שלי"
                value={shabbatExperience}
            />
            <QuoteBlock
                quote={educationVision}
                source="החזון לחינוך הילדים"
            />
            {profile.preferredHeadCoverings && profile.preferredHeadCoverings.length > 0 && (
                 <InfoBlock
                    icon={ShieldCheck}
                    label="העדפות כיסוי ראש לבת הזוג"
                    value={
                        <div className="flex flex-wrap gap-2">
                           {profile.preferredHeadCoverings.map(val => <Badge key={val}>{headCoveringMap[val as HeadCoveringType | 'any'] || val}</Badge>)}
                        </div>
                    }
                />
            )}
            {/* Add preferred Kippah types similarly */}
         </div>
      </Section>
    </div>
  );
};

export default ReligionTab;