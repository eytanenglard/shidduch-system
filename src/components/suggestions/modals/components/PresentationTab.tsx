'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  Quote,
  Puzzle,
  Calendar,
  MapPin,
  Briefcase,
  ArrowLeft,
  ArrowRight,
  MessageCircle,
  Scroll,
  GraduationCap,
} from 'lucide-react';
import { getInitials, cn, getRelativeCloudinaryPath } from '@/lib/utils';
import {
  createReligiousLevelMap,
  createEducationLevelMap,
  createCharacterTraitMap,
} from '@/components/profile/utils/maps';
import type { PresentationTabProps } from '../types/modal.types';

const PresentationTab: React.FC<PresentationTabProps> = ({
  matchmaker,
  targetParty,
  personalNote,
  matchingReason,
  locale,
  onViewProfile,
  onStartConversation,
  dict,
  profileCardDict,
}) => {
  const isHe = locale === 'he';
  const matchmakerDisplay = {
    firstName: matchmaker?.firstName ?? '',
    lastName: matchmaker?.lastName ?? '',
  };
  const age = targetParty.profile?.birthDate
    ? new Date().getFullYear() -
      new Date(targetParty.profile.birthDate).getFullYear()
    : null;
  const mainImage = targetParty.images?.find((img) => img.isMain)?.url;
  const city = targetParty.profile?.city;
  const occupation = targetParty.profile?.occupation;
  const religiousLevel = targetParty.profile?.religiousLevel;
  const educationLevel = targetParty.profile?.educationLevel;
  const traits = targetParty.profile?.profileCharacterTraits;
  const about = targetParty.profile?.about;

  // Maps for enum → label translation
  const religiousMap = useMemo(
    () => profileCardDict ? createReligiousLevelMap(profileCardDict.options.religiousLevel) : {},
    [profileCardDict]
  );
  const educationMap = useMemo(
    () => profileCardDict ? createEducationLevelMap(profileCardDict.options.educationLevel) : {},
    [profileCardDict]
  );
  const traitMap = useMemo(
    () => profileCardDict ? createCharacterTraitMap(profileCardDict.options.traits) : {},
    [profileCardDict]
  );

  return (
    <div className="bg-slate-50 min-h-[500px]">
      <div className="max-w-6xl mx-auto p-5 md:p-8 space-y-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
        {/* Section A: Matchmaker Context */}
        <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border-s-4 border-teal-500 shadow-sm">
          <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
            <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-xs font-bold">
              {getInitials(
                `${matchmakerDisplay.firstName} ${matchmakerDisplay.lastName}`
              )}
            </AvatarFallback>
          </Avatar>
          <div className={cn(isHe ? 'text-right' : 'text-left')}>
            <p className="text-xs font-medium text-teal-600">
              {dict.suggestedBy}
            </p>
            <p className="text-sm font-bold text-gray-800">
              {matchmakerDisplay.firstName} {matchmakerDisplay.lastName}
            </p>
          </div>
        </div>

        {/* Section B: Person Spotlight */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Photo */}
            <div className="relative w-full md:w-2/5 aspect-[3/4] md:aspect-auto md:min-h-[320px] bg-gray-100 flex-shrink-0">
              {mainImage ? (
                <Image
                  src={getRelativeCloudinaryPath(mainImage)}
                  alt={`${targetParty.firstName}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 40vw"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-orange-50 flex items-center justify-center">
                  <User className="w-20 h-20 text-teal-300" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 p-5 md:p-6 flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                {targetParty.firstName}
              </h2>

              {/* Primary badges */}
              <div className="flex flex-wrap gap-2 mb-2">
                {age && (
                  <Badge className="bg-orange-50 text-orange-700 border border-orange-200 shadow-none font-semibold px-3 py-1">
                    <Calendar className={cn('w-3.5 h-3.5', isHe ? 'ml-1.5' : 'mr-1.5')} />
                    {dict.ageInYears.replace('{{age}}', age.toString())}
                  </Badge>
                )}
                {city && (
                  <Badge className="bg-teal-50 text-teal-700 border border-teal-200 shadow-none font-semibold px-3 py-1">
                    <MapPin className={cn('w-3.5 h-3.5', isHe ? 'ml-1.5' : 'mr-1.5')} />
                    {city}
                  </Badge>
                )}
                {occupation && (
                  <Badge className="bg-slate-50 text-slate-700 border border-slate-200 shadow-none font-semibold px-3 py-1">
                    <Briefcase className={cn('w-3.5 h-3.5', isHe ? 'ml-1.5' : 'mr-1.5')} />
                    {occupation}
                  </Badge>
                )}
              </div>

              {/* Secondary badges: religious level, education */}
              <div className="flex flex-wrap gap-2 mb-3">
                {religiousLevel && (religiousMap as Record<string, { label: string }>)[religiousLevel] && (
                  <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-none font-semibold px-3 py-1">
                    <Scroll className={cn('w-3.5 h-3.5', isHe ? 'ml-1.5' : 'mr-1.5')} />
                    {(religiousMap as Record<string, { label: string }>)[religiousLevel].label}
                  </Badge>
                )}
                {educationLevel && (educationMap as Record<string, { label: string }>)[educationLevel] && (
                  <Badge className="bg-purple-50 text-purple-700 border border-purple-200 shadow-none font-semibold px-3 py-1">
                    <GraduationCap className={cn('w-3.5 h-3.5', isHe ? 'ml-1.5' : 'mr-1.5')} />
                    {(educationMap as Record<string, { label: string }>)[educationLevel].label}
                  </Badge>
                )}
              </div>

              {/* Character traits chips (first 3) */}
              {traits && traits.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {traits.slice(0, 3).map((trait) => {
                    const traitData = (traitMap as Record<string, { label: string; color: string }>)[trait];
                    return traitData ? (
                      <span
                        key={trait}
                        className={cn(
                          'text-xs font-medium bg-gray-100 px-2.5 py-1 rounded-full',
                          traitData.color
                        )}
                      >
                        {traitData.label}
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              {/* About excerpt */}
              {about && (
                <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">
                  {about}
                </p>
              )}

              <Button
                onClick={onViewProfile}
                className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white shadow-sm rounded-xl h-11 font-bold text-sm px-6"
              >
                <User className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
                {dict.viewFullProfile}
                {isHe ? (
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Section C: Matchmaker's Insight */}
        {(personalNote || matchingReason) && (
          <div
            className="bg-white rounded-2xl shadow-sm border border-gray-100 border-s-4 border-s-orange-400 overflow-hidden"
            dir={isHe ? 'rtl' : 'ltr'}
          >
            <div className="p-5 md:p-6 space-y-4">
              <h3 className="font-bold text-orange-800 text-base">
                {dict.matchmakerInsight}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personalNote && (
                  <div className="p-4 bg-orange-50/60 rounded-xl border border-orange-100">
                    <div className="flex items-start gap-2.5">
                      <Quote className="w-4 h-4 text-orange-400 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="text-xs font-semibold text-orange-600 mb-1.5 uppercase tracking-wide">
                          {dict.whyYou}
                        </h4>
                        <p className="text-sm text-orange-800 leading-relaxed italic font-medium">
                          &quot;{personalNote}&quot;
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {matchingReason && (
                  <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-100">
                    <div className="flex items-start gap-2.5">
                      <Puzzle className="w-4 h-4 text-teal-400 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="text-xs font-semibold text-teal-600 mb-1.5 uppercase tracking-wide">
                          {dict.ourConnection}
                        </h4>
                        <p className="text-sm text-teal-800 leading-relaxed font-medium">
                          &quot;{matchingReason}&quot;
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Section D: Action Nudge */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onViewProfile}
            variant="outline"
            className="flex-1 border-teal-200 text-teal-700 hover:bg-teal-50 hover:border-teal-300 rounded-xl h-11 font-semibold text-sm"
          >
            <User className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
            {dict.toFullProfile || dict.viewFullProfile}
          </Button>
          <Button
            onClick={onStartConversation}
            variant="outline"
            className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 rounded-xl h-11 font-semibold text-sm"
          >
            <MessageCircle className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
            {dict.iHaveQuestions}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PresentationTab;
