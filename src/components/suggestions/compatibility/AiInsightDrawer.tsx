// src/components/suggestions/compatibility/AiInsightDrawer.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { motion } from 'framer-motion';
import {
  Heart,
  Lightbulb,
  MessageSquareQuote,
  Sparkles,
  Copy,
  Check,
  CheckCircle,
  AlertTriangle,
  Bot,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ProgressRing from './ProgressRing';
import type { AiSuggestionAnalysisResult } from '@/lib/services/aiService';
import type { AiInsightDict } from '@/types/dictionary';

interface AiInsightDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: AiSuggestionAnalysisResult;
  currentUserName?: string;
  suggestedUserName?: string;
  dict: AiInsightDict;
  locale: 'he' | 'en';
}

// --- Section Header ---
const SectionHeader: React.FC<{
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  title: string;
}> = ({ icon: Icon, iconColor, bgColor, title }) => (
  <div className="flex items-center gap-2.5 mb-3">
    <div className={cn('p-2 rounded-lg', bgColor)}>
      <Icon className={cn('w-4 h-4', iconColor)} />
    </div>
    <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
  </div>
);

// --- Insight Item ---
const InsightItem: React.FC<{
  area: string;
  explanation: string;
  index: number;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  areaColor: string;
  textColor: string;
}> = ({ area, explanation, index, gradientFrom, gradientTo, borderColor, areaColor, textColor }) => (
  <motion.div
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.08 }}
    className={cn('p-3.5 bg-white/80 backdrop-blur-sm rounded-xl border shadow-sm', borderColor)}
  >
    <div className="flex items-start gap-2.5">
      <div
        className={cn(
          'flex-shrink-0 w-6 h-6 rounded-full text-white flex items-center justify-center text-[11px] font-bold shadow-sm bg-gradient-to-r',
          gradientFrom,
          gradientTo
        )}
      >
        {index + 1}
      </div>
      <div className="flex-1 space-y-1">
        <h4 className={cn('font-semibold text-sm leading-tight', areaColor)}>{area}</h4>
        <p className={cn('text-xs leading-relaxed', textColor)}>{explanation}</p>
      </div>
    </div>
  </motion.div>
);

// --- Conversation Starter with Copy ---
const ConversationStarter: React.FC<{
  starter: string;
  index: number;
  dict: AiInsightDict;
}> = ({ starter, index, dict }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(starter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="flex items-start gap-2.5 p-3 bg-white/70 rounded-xl border border-rose-100 group hover:shadow-sm transition-all"
    >
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 text-white flex items-center justify-center text-[11px] font-bold shadow-sm">
        {index + 1}
      </div>
      <p className="flex-1 text-xs text-rose-900 leading-relaxed font-medium">
        {starter}
      </p>
      <button
        onClick={handleCopy}
        className="flex-shrink-0 p-1.5 rounded-md hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
        title={dict.drawer.copy}
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-teal-500" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-rose-400" />
        )}
      </button>
    </motion.div>
  );
};

const AiInsightDrawer: React.FC<AiInsightDrawerProps> = ({
  open,
  onOpenChange,
  analysis,
  currentUserName,
  suggestedUserName,
  dict,
  locale,
}) => {
  const isHe = locale === 'he';
  const directionArrow = isHe ? '⟵' : '⟶';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] rounded-t-2xl p-0 flex flex-col"
        dir={isHe ? 'rtl' : 'ltr'}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <SheetHeader className="px-5 pb-4 border-b border-teal-100 bg-gradient-to-b from-teal-50/60 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-gradient-to-br from-teal-500 via-orange-500 to-amber-500 text-white shadow-lg">
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <SheetTitle className="text-lg font-bold bg-gradient-to-r from-teal-600 via-orange-500 to-rose-500 bg-clip-text text-transparent">
                {dict.drawer.title}
              </SheetTitle>
              <SheetDescription className="text-xs text-gray-500 mt-0.5">
                {currentUserName} {directionArrow} {suggestedUserName}
              </SheetDescription>
            </div>
            <ProgressRing score={analysis.overallScore} size={56} strokeWidth={4} />
          </div>
        </SheetHeader>

        {/* Scrollable content */}
        <ScrollArea className="flex-1">
          <div className="p-5 space-y-6">
            {/* Match summary */}
            <div className="p-4 bg-gradient-to-r from-teal-50/50 to-emerald-50/50 rounded-xl border border-teal-200/60">
              <p className="text-sm font-semibold text-gray-800 mb-1.5">
                {analysis.matchTitle}
              </p>
              <p className="text-xs text-gray-600 leading-relaxed">
                {analysis.matchSummary}
              </p>
            </div>

            {/* Compatibility Points */}
            <section>
              <SectionHeader
                icon={Heart}
                iconColor="text-teal-600"
                bgColor="bg-teal-100"
                title={dict.drawer.strengths}
              />
              <div className="space-y-2.5">
                {analysis.compatibilityPoints.length > 0 ? (
                  analysis.compatibilityPoints.map((point, i) => (
                    <InsightItem
                      key={i}
                      area={point.area}
                      explanation={point.explanation}
                      index={i}
                      gradientFrom="from-teal-400"
                      gradientTo="to-emerald-500"
                      borderColor="border-teal-100"
                      areaColor="text-teal-800"
                      textColor="text-teal-900/70"
                    />
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-400 text-sm">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    {dict.drawer.noStrengths}
                  </div>
                )}
              </div>
            </section>

            {/* Points to Consider */}
            <section>
              <SectionHeader
                icon={Lightbulb}
                iconColor="text-orange-600"
                bgColor="bg-orange-100"
                title={dict.drawer.considerations}
              />
              <div className="space-y-2.5">
                {analysis.pointsToConsider.length > 0 ? (
                  analysis.pointsToConsider.map((point, i) => (
                    <InsightItem
                      key={i}
                      area={point.area}
                      explanation={point.explanation}
                      index={i}
                      gradientFrom="from-orange-400"
                      gradientTo="to-amber-500"
                      borderColor="border-orange-100"
                      areaColor="text-orange-800"
                      textColor="text-orange-900/70"
                    />
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-400 text-sm">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    {dict.drawer.noConsiderations}
                  </div>
                )}
              </div>
            </section>

            {/* Conversation Starters */}
            {analysis.suggestedConversationStarters.length > 0 && (
              <section>
                <SectionHeader
                  icon={MessageSquareQuote}
                  iconColor="text-rose-600"
                  bgColor="bg-rose-100"
                  title={dict.drawer.conversationStarters}
                />
                <div className="space-y-2">
                  {analysis.suggestedConversationStarters.map((starter, i) => (
                    <ConversationStarter key={i} starter={starter} index={i} dict={dict} />
                  ))}
                </div>
              </section>
            )}

            {/* Important note */}
            <div className="p-3.5 bg-gradient-to-r from-teal-50 to-orange-50 rounded-xl border border-teal-100/60">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-semibold text-teal-800">
                  {dict.drawer.noteTitle}
                </span>
              </div>
              <p className="text-xs text-teal-700 leading-relaxed">
                {dict.drawer.noteText}
              </p>
            </div>
          </div>
        </ScrollArea>

        {/* Footer CTA */}
        <div className="p-4 border-t border-gray-100 bg-white/80 backdrop-blur-sm">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-md rounded-xl h-11 font-semibold text-sm"
          >
            <Send className="w-4 h-4 me-2" />
            {dict.drawer.contactMatchmaker}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AiInsightDrawer;
