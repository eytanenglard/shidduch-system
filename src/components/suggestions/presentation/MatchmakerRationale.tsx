// src/app/components/suggestions/presentation/MatchmakerRationale.tsx
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
  dict: SuggestionsPresentationDict['rationale']; // Updated to use the specific dictionary part
}

const MatchmakerRationale: React.FC<MatchmakerRationaleProps> = ({
  matchmaker,
  generalReason,
  personalNote,
  dict,
}) => {
  const fullName = `${matchmaker.firstName} ${matchmaker.lastName}`;

  return (
    <Card className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 shadow-xl border-purple-200/50">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center gap-3 mb-3">
          <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
            <AvatarFallback className="bg-purple-500 text-white font-bold">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardDescription className="text-sm text-purple-800">
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
          <div className="bg-white/70 p-4 rounded-xl shadow-inner border border-purple-100">
            <h3 className="font-semibold text-lg text-purple-700 flex items-center justify-center gap-2 mb-2">
              <Heart className="w-5 h-5" />
              {dict.personalNoteTitle}
            </h3>
            <p className="text-gray-700 text-base leading-relaxed italic">
              {personalNote}
            </p>
          </div>
        )}

        {generalReason && (
          <div className="bg-white/70 p-4 rounded-xl shadow-inner border border-blue-100">
            <h3 className="font-semibold text-lg text-blue-700 flex items-center justify-center gap-2 mb-2">
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
