// src/components/matchmaker/new/ProfileSummaryDisplay.tsx
'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { User, Target } from 'lucide-react';
import { AiProfileSummaryResult } from '@/lib/services/aiService';

// נגדיר כאן את הטיפוס למילון הספציפי של הקומפוננטה הזו
// (כדאי להוסיף אותו גם לקובץ הטיפוסים הראשי שלך בהמשך)
export interface ProfileSummaryDisplayDict {
  personalityTitle: string;
  personalityDescription: string;
  lookingForTitle: string;
  lookingForDescription: string;
}

interface ProfileSummaryDisplayProps {
  summary: AiProfileSummaryResult;
  dict: ProfileSummaryDisplayDict;
  locale: string;
}

const ProfileSummaryDisplay: React.FC<ProfileSummaryDisplayProps> = ({
  summary,
  dict,
  locale,
}) => {
  const direction = locale === 'he' ? 'rtl' : 'ltr';

  return (
    <div dir={direction} className="w-full space-y-6">
      {/* כרטיס סיכום אישיות */}
      <Card className="bg-blue-50/30 border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-blue-900">
            <User className="w-5 h-5 text-blue-600" />
            {dict.personalityTitle}
          </CardTitle>
          <CardDescription>
            {dict.personalityDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
            {summary.personalitySummary}
          </p>
        </CardContent>
      </Card>

      {/* כרטיס מה מחפש/ת */}
      <Card className="bg-purple-50/30 border-purple-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-purple-900">
            <Target className="w-5 h-5 text-purple-600" />
            {dict.lookingForTitle}
          </CardTitle>
          <CardDescription>
            {dict.lookingForDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
            {summary.lookingForSummary}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSummaryDisplay;