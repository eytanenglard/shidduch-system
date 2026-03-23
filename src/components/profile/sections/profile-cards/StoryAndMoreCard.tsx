'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ProfileCardHeader from '@/components/profile/ProfileCardHeader';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProfileCardProps } from './types';
import { renderDisplayValue } from './helpers';

const StoryAndMoreCard: React.FC<ProfileCardProps> = ({
  profile,
  isEditing,
  formData,
  handleChange,
  dict,
  direction,
}) => {
  if (!profile) return null;
  const tAboutCard = dict.cards.about;
  const tAboutMe = dict.aboutMe;

  return (
    <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-gray-300/50">
      <ProfileCardHeader
        icon={<Info className="w-4 h-4 text-slate-600" />}
        title={tAboutCard.title}
        gradientFrom="from-slate-50/60 to-gray-100/60"
        iconGradient="from-slate-500/10 to-slate-600/10"
      />
      <CardContent className="p-3 md:p-4">
        <div className="space-y-4">
          {/* Profile Headline */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Label htmlFor="profileHeadline" className="text-sm font-medium text-gray-700">
                {tAboutCard.headlineLabel}
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-describedby="headline-tooltip">
                      <Info className="w-4 h-4 text-gray-400" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent id="headline-tooltip" side="top" className="max-w-xs text-center" dir={direction} sideOffset={5} collisionPadding={10}>
                    <p>{tAboutCard.headlinePlaceholder}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {isEditing ? (
              <Input
                id="profileHeadline"
                value={formData.profileHeadline || ''}
                onChange={(e) => handleChange('profileHeadline', e.target.value)}
                className="text-sm focus:ring-cyan-500 rounded-lg"
                placeholder={tAboutCard.headlinePlaceholder}
                maxLength={80}
              />
            ) : (
              <div className="mt-1">
                {formData.profileHeadline &&
                typeof formData.profileHeadline === 'string' &&
                formData.profileHeadline.trim() ? (
                  <p className="text-lg font-semibold text-cyan-700 italic">
                    {`"${formData.profileHeadline}"`}
                  </p>
                ) : (
                  <div className="rounded-lg bg-slate-50 p-3 text-base italic border border-slate-200/80">
                    <p className="font-medium not-italic text-slate-600">
                      {tAboutCard.headlineEmpty.title}
                    </p>
                    <p className="mt-1.5 text-slate-500">
                      {tAboutCard.headlineEmpty.subtitle}
                      <span className="block mt-1 font-semibold text-slate-700">
                        {tAboutCard.headlineEmpty.example}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* My Story */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="about" className="text-sm font-medium text-gray-700">
                  {tAboutMe.cardTitle}
                </Label>
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" aria-describedby="about-tooltip" className="text-gray-400 hover:text-gray-600">
                        <Info className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent id="about-tooltip" side="top" className="max-w-xs text-center" dir={direction} sideOffset={5} collisionPadding={10}>
                      <p>{tAboutMe.placeholder}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            {isEditing ? (
              <div>
                <Textarea
                  id="about"
                  value={formData.about || ''}
                  onChange={(e) => handleChange('about', e.target.value)}
                  className={cn(
                    'text-sm focus:ring-cyan-500 min-h-[120px] rounded-lg',
                    formData.about && formData.about.trim().length < 100 ? 'border-red-400 focus:ring-red-300' : ''
                  )}
                  placeholder={tAboutMe.placeholder}
                  rows={5}
                  aria-describedby="about-char-count"
                />
                {formData.about && (
                  <div
                    id="about-char-count"
                    className={cn(
                      'text-xs mt-1 text-end',
                      formData.about.trim().length < 100 ? 'text-red-600' : 'text-gray-500'
                    )}
                  >
                    {formData.about.trim().length}
                    {dict.charCount.replace('{{count}}', '100')}
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap min-h-[60px] bg-gradient-to-br from-slate-50/70 to-gray-50/40 p-3 rounded-xl border border-slate-200/30">
                {formData.about || (
                  <span className="text-gray-500 italic">{tAboutCard.aboutEmpty}</span>
                )}
              </p>
            )}
          </div>

          {/* Inspiring Couple */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Label htmlFor="inspiringCoupleStory" className="text-sm font-medium text-gray-700">
                {tAboutCard.inspiringCoupleLabel}
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-describedby="couple-tooltip">
                      <Info className="w-4 h-4 text-gray-400" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent id="couple-tooltip" side="top" className="max-w-xs text-center" dir={direction} sideOffset={5} collisionPadding={10}>
                    <p>{tAboutCard.inspiringCouplePlaceholder}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {isEditing ? (
              <Textarea
                id="inspiringCoupleStory"
                value={formData.inspiringCoupleStory || ''}
                onChange={(e) => handleChange('inspiringCoupleStory', e.target.value)}
                className="text-sm focus:ring-cyan-500 min-h-[90px] rounded-lg"
                placeholder={tAboutCard.inspiringCouplePlaceholder}
                rows={3}
              />
            ) : (
              <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap min-h-[50px] bg-gradient-to-br from-slate-50/70 to-gray-50/40 p-3 rounded-xl border border-slate-200/30">
                {renderDisplayValue(formData.inspiringCoupleStory, dict, tAboutCard.inspiringCoupleEmpty)}
              </p>
            )}
          </div>

          {/* Private Notes */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Label htmlFor="internalMatchmakerNotes" className="text-sm font-medium text-gray-700">
                {tAboutCard.privateNotesLabel}
              </Label>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-describedby="private-notes-tooltip" className="text-gray-400 hover:text-gray-600">
                      <Info className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent id="private-notes-tooltip" side="top" className="max-w-xs text-center" dir={direction} sideOffset={5} collisionPadding={10}>
                    <p>{tAboutCard.privateNotesPlaceholder}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {isEditing ? (
              <Textarea
                id="internalMatchmakerNotes"
                value={formData.internalMatchmakerNotes || ''}
                onChange={(e) => handleChange('internalMatchmakerNotes', e.target.value)}
                className="text-sm focus:ring-cyan-500 min-h-[90px] rounded-lg"
                placeholder={tAboutCard.privateNotesPlaceholder}
                rows={3}
              />
            ) : (
              <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap min-h-[50px] bg-gradient-to-br from-slate-50/70 to-gray-50/40 p-3 rounded-xl border border-slate-200/30">
                {formData.internalMatchmakerNotes || (
                  <span className="text-gray-500 italic">{tAboutCard.privateNotesEmpty}</span>
                )}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(StoryAndMoreCard);
