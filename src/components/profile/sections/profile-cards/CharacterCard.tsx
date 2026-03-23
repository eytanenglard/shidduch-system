'use client';

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ProfileCardHeader from '@/components/profile/ProfileCardHeader';
import { Button } from '@/components/ui/button';
import {
  Smile,
  Heart,
  Briefcase,
  Users,
  BookOpen,
  Palette,
  MapPin,
  Shield,
  Languages,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProfileCardProps } from './types';
import { renderMultiSelectBadges } from './helpers';

const TRAIT_ICONS: Record<string, React.ElementType> = {
  empathetic: Heart,
  driven: Briefcase,
  optimistic: Smile,
  family_oriented: Users,
  intellectual: BookOpen,
  organized: Palette,
  calm: Heart,
  humorous: Smile,
  sociable: Users,
  sensitive: Heart,
  independent: MapPin,
  creative: Palette,
  honest: Shield,
  responsible: Shield,
  easy_going: Smile,
};

const HOBBY_ICONS: Record<string, React.ElementType> = {
  travel: MapPin,
  sports: Briefcase,
  reading: BookOpen,
  cooking_baking: Palette,
  music_playing_instrument: Languages,
  art_crafts: Palette,
  volunteering: Heart,
  learning_courses: BookOpen,
  board_games_puzzles: Smile,
  movies_theater: Smile,
  dancing: Users,
  writing: BookOpen,
  nature_hiking: MapPin,
  photography: Palette,
};

const CharacterCard: React.FC<ProfileCardProps> = ({
  isEditing,
  viewOnly = false,
  formData,
  handleChange,
  handleMultiSelectToggle,
  dict,
}) => {
  const characterTraitsOptions = useMemo(
    () =>
      Object.entries(dict.options.traits).map(([value, label]) => ({
        value,
        label,
        icon: TRAIT_ICONS[value] || Smile,
      })),
    [dict.options.traits]
  );

  const hobbiesOptions = useMemo(
    () =>
      Object.entries(dict.options.hobbies).map(([value, label]) => ({
        value,
        label,
        icon: HOBBY_ICONS[value] || Smile,
      })),
    [dict.options.hobbies]
  );

  return (
    <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-gray-300/50">
      <ProfileCardHeader
        icon={<Smile className="w-4 h-4 text-amber-600" />}
        title={dict.cards.character.title}
        gradientFrom="from-amber-50/60 to-yellow-50/60"
        iconGradient="from-amber-500/10 to-amber-600/10"
      />
      <CardContent className="p-3 md:p-4 space-y-4">
        {/* Character Traits */}
        <fieldset>
          <legend className="block mb-2 text-sm font-medium text-gray-700">
            {dict.cards.character.traitsLabel}
          </legend>
          {isEditing && !viewOnly ? (
            <div className="flex flex-wrap gap-2">
              {characterTraitsOptions.map((trait) => (
                <Button
                  key={trait.value}
                  type="button"
                  variant={
                    (formData.profileCharacterTraits || []).includes(trait.value) ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() => handleMultiSelectToggle('profileCharacterTraits', trait.value)}
                  disabled={
                    !viewOnly &&
                    (formData.profileCharacterTraits || []).length >= 3 &&
                    !(formData.profileCharacterTraits || []).includes(trait.value)
                  }
                  className={cn(
                    'rounded-full text-xs px-3 py-1.5 transition-all',
                    (formData.profileCharacterTraits || []).includes(trait.value)
                      ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                  )}
                >
                  {trait.icon && <trait.icon className="w-3.5 h-3.5 ms-1.5" />}
                  {trait.label}
                </Button>
              ))}
            </div>
          ) : (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {renderMultiSelectBadges(
                formData.profileCharacterTraits,
                characterTraitsOptions,
                dict.cards.character.traitsEmpty
              )}
            </div>
          )}
        </fieldset>

        {/* Hobbies */}
        <fieldset>
          <legend className="block mb-2 text-sm font-medium text-gray-700">
            {dict.cards.character.hobbiesLabel}
          </legend>
          {isEditing && !viewOnly ? (
            <div className="flex flex-wrap gap-2">
              {hobbiesOptions.map((hobby) => (
                <Button
                  key={hobby.value}
                  type="button"
                  variant={
                    (formData.profileHobbies || []).includes(hobby.value) ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() => handleMultiSelectToggle('profileHobbies', hobby.value)}
                  disabled={
                    !viewOnly &&
                    (formData.profileHobbies || []).length >= 3 &&
                    !(formData.profileHobbies || []).includes(hobby.value)
                  }
                  className={cn(
                    'rounded-full text-xs px-3 py-1.5 transition-all',
                    (formData.profileHobbies || []).includes(hobby.value)
                      ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-500'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                  )}
                >
                  {hobby.icon && <hobby.icon className="w-3.5 h-3.5 ms-1.5" />}
                  {hobby.label}
                </Button>
              ))}
            </div>
          ) : (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {renderMultiSelectBadges(
                formData.profileHobbies,
                hobbiesOptions,
                dict.cards.character.hobbiesEmpty
              )}
            </div>
          )}
        </fieldset>
      </CardContent>
    </Card>
  );
};

export default React.memo(CharacterCard);
