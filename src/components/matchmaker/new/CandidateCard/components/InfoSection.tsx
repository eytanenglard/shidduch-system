// InfoSection.tsx — Structured data rows (city, religion, marital, occupation, + extended fields)

import React from 'react';
import {
  MapPin,
  Scroll,
  Users,
  Briefcase,
  GraduationCap,
  Ruler,
  Shield,
  Wind,
  UserCheck,
  Palette,
  Sparkles,
} from 'lucide-react';
import { getReligiousLabel, highlightText } from '../MinimalCard.utils';
import type { CandidateWithAiData, MinimalCardDict } from '../MinimalCard.types';

interface InfoSectionProps {
  candidate: CandidateWithAiData;
  isManualEntry: boolean;
  maritalLabel: string | null;
  spokenLanguages: string;
  serviceTypeLabel: string | null;
  headCoveringLabel: string | null;
  smokingLabel: string | null;
  bodyTypeLabel: string | null;
  appearanceToneLabel: string | null;
  groomingStyleLabel: string | null;
  isCompact: boolean;
  term: string;
  dict: MinimalCardDict;
}

const Row: React.FC<{
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ icon, children }) => (
  <div className="flex items-center gap-2 text-[13px]">
    <span className="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center">
      {icon}
    </span>
    <span className="text-gray-700 truncate">{children}</span>
  </div>
);

const InfoSection: React.FC<InfoSectionProps> = ({
  candidate,
  isManualEntry,
  maritalLabel,
  spokenLanguages,
  serviceTypeLabel,
  headCoveringLabel,
  smokingLabel,
  bodyTypeLabel,
  appearanceToneLabel,
  groomingStyleLabel,
  isCompact,
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

  const religiousLabel = getReligiousLabel(profile.religiousLevel);
  const religiousJourney = (profile as any).religiousJourney as string | null | undefined;

  // Height + body type combined
  const heightBodyParts: string[] = [];
  if (profile.height) heightBodyParts.push(dict.heightLabel.replace('{{height}}', profile.height.toString()));
  if (bodyTypeLabel) heightBodyParts.push(bodyTypeLabel);
  const heightBodyText = heightBodyParts.join(' · ');

  // Occupation or education
  const occupationText = profile.occupation || profile.education || null;
  const OccupationIcon = profile.occupation ? Briefcase : GraduationCap;
  const occupationIconColor = profile.occupation ? 'text-amber-500' : 'text-teal-500';

  return (
    <div className="space-y-1.5">
      {/* ── CORE FIELDS (always shown) ────────────────────────────── */}

      {/* City + Origin */}
      {(profile.city || (profile as any).origin) && (
        <Row icon={<MapPin className="w-3.5 h-3.5 text-blue-400" />}>
          {profile.city && (
            <span className="font-semibold text-gray-800">{hl(profile.city)}</span>
          )}
          {profile.city && (profile as any).origin && (
            <span className="text-gray-300 mx-1.5">·</span>
          )}
          {(profile as any).origin && (
            <span className="text-gray-500 text-xs">{hl((profile as any).origin)}</span>
          )}
        </Row>
      )}

      {/* Religious level + journey */}
      {(religiousLabel || religiousJourney) && (
        <Row icon={<Scroll className="w-3.5 h-3.5 text-violet-400" />}>
          {religiousLabel && <span>{hl(religiousLabel)}</span>}
          {religiousLabel && religiousJourney && (
            <span className="text-gray-300 mx-1.5">·</span>
          )}
          {religiousJourney && (
            <span className="text-gray-500 text-xs">{hl(religiousJourney)}</span>
          )}
        </Row>
      )}

      {/* Marital status */}
      {maritalLabel && (
        <Row icon={<Users className="w-3.5 h-3.5 text-rose-400" />}>
          {hl(maritalLabel)}
        </Row>
      )}

      {/* Occupation / Education */}
      {occupationText && (
        <Row icon={<OccupationIcon className={`w-3.5 h-3.5 ${occupationIconColor}`} />}>
          <span className="truncate max-w-[190px]">{hl(occupationText)}</span>
        </Row>
      )}

      {/* ── EXTENDED FIELDS (hidden in compact mode) ──────────────── */}
      {!isCompact && (
        <>
          {/* Head covering / Kippah */}
          {headCoveringLabel && (
            <Row icon={<Shield className="w-3.5 h-3.5 text-teal-500" />}>
              {hl(headCoveringLabel)}
            </Row>
          )}

          {/* Service type */}
          {serviceTypeLabel && (
            <Row icon={<UserCheck className="w-3.5 h-3.5 text-indigo-400" />}>
              {hl(serviceTypeLabel)}
            </Row>
          )}

          {/* Smoking */}
          {smokingLabel && (
            <Row icon={<Wind className="w-3.5 h-3.5 text-slate-400" />}>
              {hl(smokingLabel)}
            </Row>
          )}

          {/* Height + Body type */}
          {heightBodyText && (
            <Row icon={<Ruler className="w-3.5 h-3.5 text-gray-400" />}>
              {heightBodyText}
            </Row>
          )}

          {/* Appearance tone */}
          {appearanceToneLabel && (
            <Row icon={<Palette className="w-3.5 h-3.5 text-purple-400" />}>
              {hl(appearanceToneLabel)}
            </Row>
          )}

          {/* Grooming style */}
          {groomingStyleLabel && (
            <Row icon={<Sparkles className="w-3.5 h-3.5 text-pink-400" />}>
              {hl(groomingStyleLabel)}
            </Row>
          )}

          {/* Languages */}
          {spokenLanguages && (
            <Row icon={<span className="text-[10px] font-bold text-gray-400">אב</span>}>
              <span className="text-gray-500 text-xs">{spokenLanguages}</span>
            </Row>
          )}
        </>
      )}

      {/* In compact mode: show height as a subtle chip if available */}
      {isCompact && (profile.height || spokenLanguages) && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {profile.height && (
            <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
              <Ruler className="w-2.5 h-2.5 text-gray-300" />
              {dict.heightLabel.replace('{{height}}', profile.height.toString())}
            </span>
          )}
          {spokenLanguages && (
            <span className="text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100 truncate max-w-[100px]">
              {spokenLanguages}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(InfoSection);
