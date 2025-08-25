// src/app/[locale]/(authenticated)/profile/components/advisor/AnalysisResultDisplay.tsx
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
} from 'lucide-react';
import { AiProfileAnalysisResult } from '@/lib/services/aiService';
import { cn } from '@/lib/utils';
import { AnalysisResultDisplayDict } from '@/types/dictionary';

interface AnalysisResultDisplayProps {
  analysis: AiProfileAnalysisResult;
  dict: AnalysisResultDisplayDict;
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

interface ReportItemProps {
  area: string;
  status: 'COMPLETE' | 'PARTIAL' | 'MISSING';
  feedback: string;
  dict: AnalysisResultDisplayDict['completeness']['status'];
}

const ReportItem: React.FC<ReportItemProps> = ({ area, status, feedback, dict }) => {
  const statusConfig = {
    COMPLETE: { icon: CheckCircle2, color: 'text-green-600', text: dict.complete },
    PARTIAL: { icon: AlertCircle, color: 'text-amber-600', text: dict.partial },
    MISSING: { icon: XCircle, color: 'text-red-600', text: dict.missing },
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
  dict,
}) => {
  return (
    <div className="w-full">
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1.5 bg-slate-200/70 rounded-lg">
          <TabsTrigger value="summary">{dict.tabs.summary}</TabsTrigger>
          <TabsTrigger value="completeness">{dict.tabs.completeness}</TabsTrigger>
          <TabsTrigger value="tips">{dict.tabs.tips}</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="text-blue-500" />
                  {/* תיקון: שימוש בשמות הנכונים מהמילון */}
                  {dict.summary.myPersonalityTitle}
                </CardTitle>
                <CardDescription>
                  {/* תיקון: שימוש בשמות הנכונים מהמילון */}
                  {dict.summary.myPersonalityDescription}
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
                  {dict.summary.lookingForTitle}
                </CardTitle>
                <CardDescription>
                  {dict.summary.lookingForDescription}
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
                  {dict.completeness.title}
                </CardTitle>
                <CardDescription>
                  {dict.completeness.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0 divide-y">
                  {analysis.completenessReport.map((item, index) => (
                    <ReportItem key={index} {...item} dict={dict.completeness.status} />
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
                  {dict.tips.title}
                </CardTitle>
                <CardDescription>
                  {dict.tips.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.actionableTips.map((tip, index) => (
                  <TipCard key={index} area={tip.area} tip={tip.tip} />
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default AnalysisResultDisplay;