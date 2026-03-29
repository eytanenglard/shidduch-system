'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
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
  Scroll,
  GraduationCap,
  MessageSquareQuote,
} from 'lucide-react';
import { getInitials, cn, getRelativeCloudinaryPath } from '@/lib/utils';
import {
  createReligiousLevelMap,
  createEducationLevelMap,
  createCharacterTraitMap,
} from '@/components/profile/utils/maps';
import ImageLightbox from './ImageLightbox';
import AiInsightBar from './AiInsightBar';
import type { PresentationTabProps } from '../types/modal.types';

const PresentationTab: React.FC<PresentationTabProps> = ({
  matchmaker,
  targetParty,
  personalNote,
  matchingReason,
  locale,
  onViewProfile,
  onRequestAiSummary,
  onNavigateToCompatibility,
  dict,
  aiInsightBarDict,
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

  // Image gallery state
  const allImages = targetParty.images || [];
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [showAllTraits, setShowAllTraits] = useState(false);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const imgs = targetParty.images || [];
    const mainIdx = imgs.findIndex(img => img.isMain);
    setSelectedImageIdx(mainIdx >= 0 ? mainIdx : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetParty.id]);

  const displayImage = allImages[selectedImageIdx]?.url;

  // Mobile photo swipe
  const handlePhotoTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handlePhotoTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || allImages.length <= 1) return;
      const diff = e.changedTouches[0].clientX - touchStartX.current;
      const SWIPE_THRESHOLD = 50;

      if (Math.abs(diff) >= SWIPE_THRESHOLD) {
        e.stopPropagation(); // Prevent tab swipe from firing
        const direction = diff > 0 ? (isHe ? 1 : -1) : (isHe ? -1 : 1);
        const nextIdx = selectedImageIdx + direction;
        if (nextIdx >= 0 && nextIdx < allImages.length) {
          setSelectedImageIdx(nextIdx);
        }
      }
      touchStartX.current = null;
    },
    [isHe, selectedImageIdx, allImages.length]
  );

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
    <>
      <div className="bg-gradient-to-b from-slate-50 via-gray-50/50 to-white min-h-[500px]">
        <div className="max-w-6xl mx-auto p-5 md:p-8 space-y-5">
          {/* Section A: Matchmaker Context */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-teal-100 shadow-sm overflow-hidden"
          >
            <div className="absolute inset-y-0 start-0 w-1 bg-gradient-to-b from-teal-400 to-emerald-500" />
            <Avatar className="w-10 h-10 border-2 border-white shadow-md ring-2 ring-teal-100">
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
          </motion.div>

          {/* AI Insight Bar */}
          <AiInsightBar
            targetName={targetParty.firstName}
            onRequestAiSummary={onRequestAiSummary}
            onNavigateToCompatibility={onNavigateToCompatibility}
            locale={locale}
            dict={aiInsightBarDict}
          />

          {/* Section B: Person Spotlight */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden hover:shadow-md transition-shadow duration-300"
          >
            <div className="flex flex-col md:flex-row">
              {/* Photo with gallery, swipe, lightbox */}
              <div
                className="group/photo relative w-full md:w-2/5 aspect-[3/4] md:aspect-auto md:min-h-[320px] bg-gray-100 flex-shrink-0 overflow-hidden"
                onTouchStart={handlePhotoTouchStart}
                onTouchEnd={handlePhotoTouchEnd}
              >
                {displayImage ? (
                  <Image
                    key={displayImage}
                    src={getRelativeCloudinaryPath(displayImage)}
                    alt={`${targetParty.firstName}`}
                    fill
                    className="object-cover cursor-pointer transition-all duration-500 group-hover/photo:scale-[1.03] animate-in fade-in-0 duration-300"
                    sizes="(max-width: 768px) 100vw, 40vw"
                    onClick={() => setIsLightboxOpen(true)}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-orange-50 flex items-center justify-center">
                    <User className="w-20 h-20 text-teal-300" />
                  </div>
                )}

                {/* Photo counter */}
                {allImages.length > 1 && (
                  <div className="absolute top-3 end-3 bg-black/50 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm z-[1]">
                    {selectedImageIdx + 1} / {allImages.length}
                  </div>
                )}

                {/* Desktop arrow navigation on hover */}
                {allImages.length > 1 && (
                  <>
                    {selectedImageIdx > 0 && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedImageIdx(i => i - 1); }}
                        className="absolute start-2 top-1/2 -translate-y-1/2 z-[2] hidden md:flex w-8 h-8 items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover/photo:opacity-100 transition-opacity duration-200 hover:bg-black/60 backdrop-blur-sm"
                      >
                        {isHe ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                      </button>
                    )}
                    {selectedImageIdx < allImages.length - 1 && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedImageIdx(i => i + 1); }}
                        className="absolute end-2 top-1/2 -translate-y-1/2 z-[2] hidden md:flex w-8 h-8 items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover/photo:opacity-100 transition-opacity duration-200 hover:bg-black/60 backdrop-blur-sm"
                      >
                        {isHe ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                      </button>
                    )}
                  </>
                )}

                {/* Mobile: dot indicators + swipe hint */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-3 inset-x-0 flex flex-col items-center gap-1.5 md:hidden z-[1]">
                    <div className="flex justify-center gap-1.5">
                      {allImages.map((_, idx) => (
                        <span
                          key={idx}
                          className={cn(
                            'w-2 h-2 rounded-full transition-all',
                            idx === selectedImageIdx ? 'bg-white scale-125' : 'bg-white/50'
                          )}
                        />
                      ))}
                    </div>
                    {selectedImageIdx === 0 && (
                      <span className="text-[10px] text-white/70 font-medium animate-pulse motion-reduce:animate-none">
                        {isHe ? 'החליקו לתמונות נוספות ←' : 'Swipe for more photos →'}
                      </span>
                    )}
                  </div>
                )}

                {/* Desktop: thumbnail gallery */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent pt-8 pb-3 px-3 hidden md:block z-[1]">
                    <div className="flex gap-1.5 justify-center">
                      {allImages.map((img, idx) => (
                        <button
                          key={img.url}
                          type="button"
                          onClick={() => setSelectedImageIdx(idx)}
                          className={cn(
                            'relative w-10 h-10 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0',
                            idx === selectedImageIdx
                              ? 'border-white shadow-md scale-110'
                              : 'border-white/40 opacity-70 hover:opacity-100'
                          )}
                        >
                          <Image
                            src={getRelativeCloudinaryPath(img.url)}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </button>
                      ))}
                    </div>
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
                    <Badge className="bg-orange-50/80 text-orange-700 border border-orange-200/60 shadow-none font-semibold px-3 py-1 hover:bg-orange-100/80 hover:scale-[1.03] transition-all duration-200 cursor-default">
                      <Calendar className={cn('w-3.5 h-3.5', isHe ? 'ml-1.5' : 'mr-1.5')} />
                      {dict.ageInYears.replace('{{age}}', age.toString())}
                    </Badge>
                  )}
                  {city && (
                    <Badge className="bg-teal-50/80 text-teal-700 border border-teal-200/60 shadow-none font-semibold px-3 py-1 hover:bg-teal-100/80 hover:scale-[1.03] transition-all duration-200 cursor-default">
                      <MapPin className={cn('w-3.5 h-3.5', isHe ? 'ml-1.5' : 'mr-1.5')} />
                      {city}
                    </Badge>
                  )}
                  {occupation && (
                    <Badge className="bg-slate-50/80 text-slate-700 border border-slate-200/60 shadow-none font-semibold px-3 py-1 hover:bg-slate-100/80 hover:scale-[1.03] transition-all duration-200 cursor-default">
                      <Briefcase className={cn('w-3.5 h-3.5', isHe ? 'ml-1.5' : 'mr-1.5')} />
                      {occupation}
                    </Badge>
                  )}
                </div>

                {/* Secondary badges: religious level, education */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {religiousLevel && (religiousMap as Record<string, { label: string }>)[religiousLevel] && (
                    <Badge className="bg-indigo-50/80 text-indigo-700 border border-indigo-200/60 shadow-none font-semibold px-3 py-1 hover:bg-indigo-100/80 hover:scale-[1.03] transition-all duration-200 cursor-default">
                      <Scroll className={cn('w-3.5 h-3.5', isHe ? 'ml-1.5' : 'mr-1.5')} />
                      {(religiousMap as Record<string, { label: string }>)[religiousLevel].label}
                    </Badge>
                  )}
                  {educationLevel && (educationMap as Record<string, { label: string }>)[educationLevel] && (
                    <Badge className="bg-purple-50/80 text-purple-700 border border-purple-200/60 shadow-none font-semibold px-3 py-1 hover:bg-purple-100/80 hover:scale-[1.03] transition-all duration-200 cursor-default">
                      <GraduationCap className={cn('w-3.5 h-3.5', isHe ? 'ml-1.5' : 'mr-1.5')} />
                      {(educationMap as Record<string, { label: string }>)[educationLevel].label}
                    </Badge>
                  )}
                </div>

                {/* Character traits chips */}
                {traits && traits.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(showAllTraits ? traits : traits.slice(0, 3)).map((trait) => {
                      const traitData = (traitMap as Record<string, { label: string; color: string }>)[trait];
                      return traitData ? (
                        <span
                          key={trait}
                          className={cn(
                            'text-xs font-medium bg-gray-100/80 px-2.5 py-1 rounded-full border border-gray-200/50 hover:shadow-sm hover:scale-[1.05] transition-all duration-200 cursor-default',
                            traitData.color
                          )}
                        >
                          {traitData.label}
                        </span>
                      ) : null;
                    })}
                    {traits.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setShowAllTraits((prev) => !prev)}
                        className="text-xs font-medium text-teal-600 hover:text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/50 transition-all duration-200 hover:shadow-sm hover:scale-[1.05]"
                      >
                        {showAllTraits
                          ? dict.showLessTraits
                          : dict.showMoreTraits.replace('{{count}}', String(traits.length - 3))}
                      </button>
                    )}
                  </div>
                )}

                {/* About excerpt */}
                {about && (
                  <div className="mb-4">
                    <p className={cn(
                      'text-sm text-gray-500 leading-relaxed',
                      !isAboutExpanded && 'line-clamp-2'
                    )}>
                      {about}
                    </p>
                    {about.length > 120 && (
                      <button
                        type="button"
                        onClick={() => setIsAboutExpanded((prev) => !prev)}
                        className="text-xs font-medium text-teal-600 hover:text-teal-700 mt-1 transition-colors"
                      >
                        {isAboutExpanded ? dict.readLess : dict.readMore}
                      </button>
                    )}
                  </div>
                )}

                <Button
                  onClick={onViewProfile}
                  className="group/profile w-full sm:w-auto relative overflow-hidden bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 rounded-xl h-11 font-bold text-sm px-6 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/profile:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
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
          </motion.div>

          {/* Section C: Matchmaker's Insight */}
          {(personalNote || matchingReason) && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2, ease: 'easeOut' }}
              className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden"
              dir={isHe ? 'rtl' : 'ltr'}
            >
              <div className="absolute inset-y-0 start-0 w-1 bg-gradient-to-b from-orange-400 to-amber-500" />
              <div className="p-5 md:p-6 space-y-4">
                <h3 className="font-bold text-orange-800 text-base">
                  {dict.matchmakerInsight}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {personalNote && (
                    <div className="p-4 bg-gradient-to-br from-orange-50/80 to-amber-50/40 rounded-xl border border-orange-100/60 hover:shadow-sm transition-shadow duration-200">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center flex-shrink-0 shadow-sm shadow-orange-400/20">
                          <Quote className="w-3.5 h-3.5 text-white" />
                        </div>
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
                    <div className="p-4 bg-gradient-to-br from-teal-50/80 to-emerald-50/40 rounded-xl border border-teal-100/60 hover:shadow-sm transition-shadow duration-200">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center flex-shrink-0 shadow-sm shadow-teal-400/20">
                          <Puzzle className="w-3.5 h-3.5 text-white" />
                        </div>
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
            </motion.div>
          )}

          {/* Section D: Friend Testimonials */}
          {targetParty.profile?.testimonials && targetParty.profile.testimonials.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.3, ease: 'easeOut' }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden"
              dir={isHe ? 'rtl' : 'ltr'}
            >
              <div className="p-5 md:p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-sm shadow-violet-400/20">
                    <MessageSquareQuote className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h3 className="font-bold text-violet-800 text-base">
                    {dict.testimonials}
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {targetParty.profile.testimonials.map((testimonial, idx) => (
                    <motion.div
                      key={testimonial.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.35 + idx * 0.08 }}
                      className="p-4 bg-gradient-to-br from-violet-50/60 to-purple-50/30 rounded-xl border border-violet-100/60 hover:shadow-sm hover:border-violet-200/60 transition-all duration-200"
                    >
                      <p className="text-sm text-violet-900 leading-relaxed mb-2 italic">
                        &quot;{testimonial.content}&quot;
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-violet-700">
                          {testimonial.authorName}
                        </span>
                        {testimonial.relationship && (
                          <>
                            <span className="text-violet-300">·</span>
                            <span className="text-xs text-violet-500">
                              {testimonial.relationship}
                            </span>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        images={allImages}
        currentIndex={selectedImageIdx}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        onNavigate={setSelectedImageIdx}
        isRtl={isHe}
      />
    </>
  );
};

export default PresentationTab;
