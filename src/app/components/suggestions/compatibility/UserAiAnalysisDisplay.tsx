// src/app/components/suggestions/compatibility/UserAiAnalysisDisplay.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Heart, Lightbulb, MessageSquareQuote, ShieldAlert, Sparkles } from 'lucide-react';
import type { AiSuggestionAnalysisResult } from '@/lib/services/aiService';
import { motion } from 'framer-motion';

interface UserAiAnalysisDisplayProps {
  analysis: AiSuggestionAnalysisResult;
}

const Section: React.FC<{
  title: string;
  icon: React.ElementType;
  iconColorClass: string;
  children: React.ReactNode;
}> = ({ title, icon: Icon, iconColorClass, children }) => (
  <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-slate-200/60">
    <CardHeader>
      <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
        <div className={`p-2 rounded-full ${iconColorClass.replace('text-', 'bg-').replace('-500', '-100')}`}>
            <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColorClass}`} />
        </div>
        <span>{title}</span>
      </CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const UserAiAnalysisDisplay: React.FC<UserAiAnalysisDisplayProps> = ({ analysis }) => {
  const scoreColor = analysis.overallScore >= 80 ? 'text-green-500' :
                     analysis.overallScore >= 60 ? 'text-blue-500' :
                     'text-amber-500';

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* כותרת וסיכום ראשי */}
      <motion.div variants={itemVariants}>
        <Card className="text-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6 shadow-xl border-purple-200/70">
          <Sparkles className="w-10 h-10 text-purple-500 mx-auto mb-3 animate-pulse" />
          <h2 className="text-xl sm:text-2xl font-bold text-purple-800">{analysis.matchTitle}</h2>
          <p className="text-sm sm:text-base text-purple-700 mt-2 max-w-2xl mx-auto">
            {analysis.matchSummary}
          </p>
          <div className="mt-4">
            <Badge variant="secondary" className={`text-lg font-bold px-4 py-2 rounded-full bg-white shadow-md ${scoreColor}`}>
              ציון התאמה: {analysis.overallScore}%
            </Badge>
            <Progress value={analysis.overallScore} className="max-w-xs mx-auto mt-3 h-2" />
          </div>
        </Card>
      </motion.div>

      {/* נקודות התאמה */}
      <motion.div variants={itemVariants}>
        <Section title="נקודות חיבור חזקות" icon={Heart} iconColorClass="text-rose-500">
          <div className="space-y-4">
            {analysis.compatibilityPoints.map((point, index) => (
              <div key={index} className="p-3 bg-rose-50/70 rounded-lg border border-rose-100">
                <p className="font-semibold text-sm text-rose-800 mb-1">{point.area}</p>
                <p className="text-sm text-rose-900">{point.explanation}</p>
              </div>
            ))}
          </div>
        </Section>
      </motion.div>

      {/* נקודות למחשבה */}
      <motion.div variants={itemVariants}>
        <Section title="נקודות למחשבה וצמיחה" icon={Lightbulb} iconColorClass="text-blue-500">
          <div className="space-y-4">
            {analysis.pointsToConsider.map((point, index) => (
              <div key={index} className="p-3 bg-blue-50/70 rounded-lg border border-blue-100">
                <p className="font-semibold text-sm text-blue-800 mb-1">{point.area}</p>
                <p className="text-sm text-blue-900">{point.explanation}</p>
              </div>
            ))}
          </div>
        </Section>
      </motion.div>

      {/* נושאים לפתיחת שיחה */}
      <motion.div variants={itemVariants}>
        <Section title="נושאים מומלצים לפתיחת שיחה" icon={MessageSquareQuote} iconColorClass="text-emerald-500">
          <ul className="space-y-3 list-inside">
            {analysis.suggestedConversationStarters.map((starter, index) => (
              <li key={index} className="flex items-start gap-3">
                 <div className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                 <span className="text-sm text-emerald-900">{starter}</span>
              </li>
            ))}
          </ul>
        </Section>
      </motion.div>

    </motion.div>
  );
};

export default UserAiAnalysisDisplay;