// src/components/suggestions/panels/PanelHeader.tsx

import React from 'react';
import Image from 'next/image';
import { X, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, getRelativeCloudinaryPath, calculateAge } from '@/lib/utils';
import { getEnhancedStatusInfo } from '@/lib/utils/suggestionUtils';
import type { ExtendedMatchSuggestion } from '../../../types/suggestions';
import type { SuggestionsCardDict } from '@/types/dictionary';

interface PanelHeaderProps {
  suggestion: ExtendedMatchSuggestion;
  userId: string;
  onClose: () => void;
  dict: SuggestionsCardDict;
  locale: 'he' | 'en';
}

const PanelHeader: React.FC<PanelHeaderProps> = ({
  suggestion,
  userId,
  onClose,
  dict,
  locale,
}) => {
  const isRtl = locale === 'he';
  const isFirstParty = suggestion.firstPartyId === userId;
  const targetParty = isFirstParty
    ? suggestion.secondParty
    : suggestion.firstParty;
  const mainImage = targetParty?.images?.find((img) => img.isMain);
  const age = calculateAge(targetParty?.profile?.birthDate ?? null);
  const statusInfo = getEnhancedStatusInfo(suggestion.status, isFirstParty, dict);

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center gap-3">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex-shrink-0"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Photo */}
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          {mainImage?.url ? (
            <Image
              src={getRelativeCloudinaryPath(mainImage.url)}
              alt={targetParty?.firstName || ''}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-400" />
            </div>
          )}
        </div>

        {/* Name + Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900 truncate">
              {targetParty?.firstName}
              {targetParty?.lastName ? ` ${targetParty.lastName.charAt(0)}.` : ''}
            </h2>
            {age > 0 && <span className="text-sm text-gray-500">({age})</span>}
          </div>
          {suggestion.matchmaker && (
            <p className="text-xs text-gray-400 truncate">
              {dict.suggestedBy} {suggestion.matchmaker.firstName} {suggestion.matchmaker.lastName}
            </p>
          )}
        </div>

        {/* Status badge */}
        <Badge
          variant="outline"
          className={cn('text-xs font-medium flex-shrink-0', statusInfo.className)}
        >
          <statusInfo.icon className={cn('w-3 h-3', isRtl ? 'ml-1' : 'mr-1')} />
          {statusInfo.shortLabel}
        </Badge>
      </div>
    </div>
  );
};

export default PanelHeader;
