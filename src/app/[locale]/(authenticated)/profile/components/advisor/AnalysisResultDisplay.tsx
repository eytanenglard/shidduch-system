// src/app/(authenticated)/profile/components/advisor/AnalysisResultDisplay.tsx
'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  XCircle,
  User,
  Target,
} from 'lucide-react'; // הסרתי את 'Camera'
import { AiProfileAnalysisResult } from '@/lib/services/aiService';
import { cn } from '@/lib/utils';

interface AnalysisResultDisplayProps {
  analysis: AiProfileAnalysisResult;
}

const TipCard: React.FC<{ area: string; tip: string }> = ({ area, tip }) => (
  <div className="p-4 rounded-lg bg-yellow-50/70 border border-yellow-200/80 flex items-start gap-4">
    <div className="flex-shrink-0 mt-1">
      <Lightbulb className="w-5 h-5 text-yellow-600" />
    </div>
    <div>
      <p className="font-semibold text-sm text-yellow-800">{area}</p>
      <p className="text-sm text-yellow-900 mt-1">{tip}</p>
    </div>
  </div>
);

const ReportItem: React.FC<{
  area: string;
  status: 'COMPLETE' | 'PARTIAL' | 'MISSING';
  feedback: string;
}> = ({ area, status, feedback }) => {
  const statusConfig = {
    COMPLETE: { icon: CheckCircle2, color: 'text-green-600', text: 'הושלם' },
    PARTIAL: { icon: AlertCircle, color: 'text-amber-600', text: 'חלקי' },
    MISSING: { icon: XCircle, color: 'text-red-600', text: 'חסר' },
  };

  const { icon: Icon, color, text } = statusConfig[status];

  return (
    <div className="flex items-start gap-3 p-3 border-b last:border-b-0">
      <div className="flex-shrink-0 mt-1">
        <Icon className={cn('w-5 h-5', color)} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center">
          <p className="font-medium text-sm text-slate-800">{area}</p>
          <Badge
            variant="outline"
            className={cn(
              'text-xs font-mono',
              color.replace('text-', 'border-').replace('-600', '-300')
            )}
          >
            {text}
          </Badge>
        </div>
        <p className="text-sm text-slate-600 mt-1">{feedback}</p>
      </div>
    </div>
  );
};

const AnalysisResultDisplay: React.FC<AnalysisResultDisplayProps> = ({
  analysis,
}) => {
  return (
    <div className="w-full">
      <Tabs defaultValue="summary" className="w-full">
        {/* --- START OF CHANGE --- */}
        <TabsList className="grid w-full grid-cols-3 h-auto p-1.5 bg-slate-200/70 rounded-lg">
          <TabsTrigger value="summary">סיכום</TabsTrigger>
          <TabsTrigger value="completeness">השלמת פרופיל</TabsTrigger>
          <TabsTrigger value="tips">טיפים לשיפור</TabsTrigger>
          {/* לשונית התמונות הוסרה */}
        </TabsList>
        {/* --- END OF CHANGE --- */}

        <div className="mt-4">
          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="text-blue-500" />
                  מי אני? (סיכום AI)
                </CardTitle>
                <CardDescription>
                  כך ה-AI מבין את האישיות שלך על סמך מה שסיפרת.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {analysis.personalitySummary}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="text-green-500" />
                  את מי אני מחפש/ת? (סיכום AI)
                </CardTitle>
                <CardDescription>
                  סיכום ההעדפות שלך לבן/בת הזוג האידיאלי/ת.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {analysis.lookingForSummary}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completeness">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="text-indigo-500" />
                  דוח השלמת פרופיל
                </CardTitle>
                <CardDescription>
                  סקירה של החלקים שהושלמו בפרופיל שלך ואלו שעדיין דורשים
                  התייחסות.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0 divide-y">
                  {analysis.completenessReport.map((item, index) => (
                    <ReportItem key={index} {...item} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tips">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="text-yellow-500" />
                  המלצות וטיפים לשיפור
                </CardTitle>
                <CardDescription>
                  הצעות קונקרטיות שיעזרו לך לשדרג את הפרופיל ולמשוך התאמות טובות
                  יותר.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.actionableTips.map((tip, index) => (
                  <TipCard key={index} area={tip.area} tip={tip.tip} />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- START OF CHANGE --- */}
          {/* כל התוכן של ניתוח התמונות הוסר מכאן */}
          {/* <TabsContent value="photos"> ... </TabsContent> */}
          {/* --- END OF CHANGE --- */}
        </div>
      </Tabs>
    </div>
  );
};

export default AnalysisResultDisplay;
