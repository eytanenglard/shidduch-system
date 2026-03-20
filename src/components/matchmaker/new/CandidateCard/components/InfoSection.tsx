// InfoSection.tsx — Structured data rows (city, religion, marital, occupation, height, languages)

import React from 'react';
import {
  MapPin,
  Scroll,
  Users,
  Briefcase,
  GraduationCap,
  Ruler,
  Languages,
} from 'lucide-react';
import { getReligiousLabel, highlightText } from '../MinimalCard.utils';
import type { CandidateWithAiData, MinimalCardDict } from '../MinimalCard.types';

interface InfoSectionProps {
  candidate: CandidateWithAiData;
  isManualEntry: boolean;
  maritalLabel: string | null;
  spokenLanguages: string;
  term: string;
  dict: MinimalCardDict;
}

const InfoSection: React.FC<InfoSectionProps> = ({
  candidate,
  isManualEntry,
  maritalLabel,
  spokenLanguages,
  term,
  dict,
}) => {
  const hl = (text: string | null | undefined) => highlightText(text, term);
  const profile = candidate.profile;

  if (isManualEntry && profile.manualEntryText) {
    return (
      <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
        <p className="line-clamp-4 text-[13px] leading-relaxed text-purple-800">
          {hl(profile.manualEntryText)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* City + Origin */}
      {(profile.city || (profile as any).origin) && (
        <div className="flex items-center justify-end gap-2 text-[13px]">
          <span>
            {profile.city && (
              <span className="font-semibold text-gray-800">{hl(profile.city)}</span>
            )}
            {profile.city && (profile as any).origin && (
              <span className="text-gray-300 mx-1.5">·</span>
            )}
            {(profile as any).origin && (
              <span className="text-gray-500 text-xs">{hl((profile as any).origin)}</span>
            )}
          </span>
          <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
        </div>
      )}

      {/* Religious level + journey */}
      {(profile.religiousLevel || (profile as any).religiousJourney) && (
        <div className="flex items-center justify-end gap-2 text-[13px]">
          <span className="text-gray-700">
            {getReligiousLabel(profile.religiousLevel) && (
              <>{hl(getReligiousLabel(profile.religiousLevel))}</>
            )}
            {getReligiousLabel(profile.religiousLevel) && (profile as any).religiousJourney && (
              <span className="text-gray-300 mx-1.5">·</span>
            )}
            {(profile as any).religiousJourney && (
              <span className="text-gray-500 text-xs">{hl((profile as any).religiousJourney)}</span>
            )}
          </span>
          <Scroll className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
        </div>
      )}

      {/* Marital status */}
      {maritalLabel && (
        <div className="flex items-center justify-end gap-2 text-[13px]">
          <span className="text-gray-700">{hl(maritalLabel)}</span>
          <Users className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
        </div>
      )}

      {/* Occupation */}
      {profile.occupation && (
        <div className="flex items-center justify-end gap-2 text-[13px]">
          <span className="text-gray-700 truncate max-w-[190px]">{hl(profile.occupation)}</span>
          <Briefcase className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
        </div>
      )}

      {/* Education (if no occupation) */}
      {!profile.occupation && profile.education && (
        <div className="flex items-center justify-end gap-2 text-[13px]">
          <span className="text-gray-700 truncate max-w-[190px]">{hl(profile.education)}</span>
          <GraduationCap className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
        </div>
      )}

      {/* Height + Languages — subtle chip row */}
      {(profile.height || spokenLanguages) && (
        <div className="flex items-center justify-end gap-1.5 flex-wrap pt-0.5">
          {profile.height && (
            <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
              <Ruler className="w-2.5 h-2.5 text-gray-400" />
              {dict.heightLabel.replace('{{height}}', profile.height.toString())}
            </span>
          )}
          {spokenLanguages && (
            <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
              <Languages className="w-2.5 h-2.5 text-gray-400" />
              <span className="truncate max-w-[90px]">{spokenLanguages}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(InfoSection);
