// src/components/suggestions/presentation/MatchmakerRationale.tsx
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Heart, Sparkles } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import type { SuggestionsPresentationDict } from '@/types/dictionary';

interface MatchmakerRationaleProps {
  matchmaker: { firstName: string; lastName: string };
  generalReason?: string | null;
  personalNote?: string | null;
  dict: SuggestionsPresentationDict['rationale'];
}

const MatchmakerRationale: React.FC<MatchmakerRationaleProps> = ({
  matchmaker,
  generalReason,
  personalNote,
  dict,
}) => {
  const fullName = `${matchmaker.firstName} ${matchmaker.lastName}`;

  return (
    // Background: Teal -> Orange -> Rose
    <Card className="bg-gradient-to-br from-teal-50 via-orange-50 to-rose-50 shadow-xl border-teal-200/50">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center gap-3 mb-3">
          <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
            {/* Avatar: Teal */}
            <AvatarFallback className="bg-teal-500 text-white font-bold">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardDescription className="text-sm text-teal-800">
              {dict.description.replace('{{name}}', fullName)}
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-gray-800">
              {dict.title}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 text-center">
        {personalNote && (
          // Personal Note: Rose Tint (Love/Heart)
          <div className="bg-white/70 p-4 rounded-xl shadow-inner border border-rose-100">
            <h3 className="font-semibold text-lg text-rose-700 flex items-center justify-center gap-2 mb-2">
              <Heart className="w-5 h-5" />
              {dict.personalNoteTitle}
            </h3>
            <p className="text-gray-700 text-base leading-relaxed italic">
              {personalNote}
            </p>
          </div>
        )}

        {generalReason && (
          // General Reason: Teal Tint (Sparkles/Magic)
          <div className="bg-white/70 p-4 rounded-xl shadow-inner border border-teal-100">
            <h3 className="font-semibold text-lg text-teal-700 flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              {dict.generalReasonTitle}
            </h3>
            <p className="text-gray-600 text-base leading-relaxed">
              {generalReason}
            </p>
          </div>
        )}

        {!personalNote && !generalReason && (
          <p className="text-gray-500">{dict.noReasonText}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default MatchmakerRationale;