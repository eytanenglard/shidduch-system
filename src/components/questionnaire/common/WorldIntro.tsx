// src/components/questionnaire/common/WorldIntro.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Scroll,
  Heart,
  Users,
  UserCheck,
  ArrowRight,
  Clock,
  HelpCircle,
  CheckCircle2,
  User,
  Sparkles,
  Brain,
} from 'lucide-react';
import type { WorldId, Question } from '../types/types';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '../hooks/useMediaQuery';
import type { WorldIntroDict } from '@/types/dictionary';

interface WorldIntroProps {
  worldId: WorldId;
  allQuestions: Question[];
  onStart: () => void;
  className?: string;
  dict: WorldIntroDict;
}

// אובייקט קונפיגורציה ויזואלי (נשאר בקוד)
const worldVisualConfig = {
  PERSONALITY: { Icon: User, themeColor: 'sky' },
  VALUES: { Icon: Heart, themeColor: 'rose' },
  RELATIONSHIP: { Icon: Users, themeColor: 'purple' },
  PARTNER: { Icon: UserCheck, themeColor: 'teal' },
  RELIGION: { Icon: Scroll, themeColor: 'amber' },
};

const WORLD_ORDER: WorldId[] = [
  'PERSONALITY',
  'VALUES',
  'RELATIONSHIP',
  'PARTNER',
  'RELIGION',
];

export default function WorldIntro({
  worldId,
  allQuestions,
  onStart,
  className = '',
  dict,
}: WorldIntroProps) {
  const visualConfig = worldVisualConfig[worldId];
  const content = dict.worldsContent[worldId];

  const { Icon, themeColor } = visualConfig;
  const {
    title,
    subtitle,
    whyIsItImportant,
    whatYouWillDiscover,
    guidingThought,
  } = content;

  const isMobile = useMediaQuery('(max-width: 1023px)');

  // חישובים דינמיים
  const totalQuestions = allQuestions.length;
  const requiredQuestions = allQuestions.filter((q) => q.isRequired).length;
  const estimatedTime = Math.max(5, Math.round(totalQuestions * 0.4));
  const worldIndex = WORLD_ORDER.indexOf(worldId) + 1;

  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: 'circOut', staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  };

  const stats = [
    {
      label: dict.stats.estimatedTime,
      value: `~${estimatedTime} ${dict.statsValues.minutes}`,
      IconComp: Clock,
    },
    {
      label: dict.stats.totalQuestions,
      value: totalQuestions,
      IconComp: HelpCircle,
    },
    {
      label: dict.stats.requiredQuestions,
      value: requiredQuestions,
      IconComp: CheckCircle2,
    },
  ];

  const ActionButton = () => (
    <Button
      onClick={onStart}
      size="lg"
      className={cn(
        'w-full text-lg font-medium py-3 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105',
        `bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white`
      )}
    >
      {dict.startButton}
      <ArrowRight className="w-5 h-5 mr-2 animate-pulse-fast" />
    </Button>
  );

  return (
    <div className={cn('bg-slate-50 px-4 sm:px-6', className)}>
      <motion.div
        className="w-full max-w-4xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Card className="overflow-hidden shadow-xl rounded-xl border-slate-200 bg-white">
          <CardContent className="p-0">
            {isMobile && (
              <div className="p-6 border-b">
                <ActionButton />
              </div>
            )}
            <div className="grid lg:grid-cols-2">
              <motion.div
                variants={itemVariants}
                className={`bg-${themeColor}-50/50 p-6 sm:p-8 flex flex-col justify-between`}
              >
                <div>
                  <Badge
                    variant="outline"
                    className={`border-${themeColor}-300 bg-white text-${themeColor}-700 mb-4`}
                  >
                    {dict.world} {worldIndex} {dict.of} {WORLD_ORDER.length}
                  </Badge>
                  <div
                    className={`mb-4 inline-block p-4 rounded-xl bg-gradient-to-br from-${themeColor}-500 to-${themeColor}-600 shadow-lg`}
                  >
                    <Icon className="w-12 h-12 text-white" />
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-800">
                    {title}
                  </h1>
                  <p
                    className={`mt-2 text-lg text-${themeColor}-800 font-medium`}
                  >
                    {subtitle}
                  </p>
                </div>
                <div className="mt-8 space-y-4">
                  {stats.map((stat, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`p-2 rounded-md bg-${themeColor}-100`}>
                        <stat.IconComp
                          className={`w-5 h-5 text-${themeColor}-600`}
                        />
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">
                          {stat.label}
                        </div>
                        <div className="font-semibold text-slate-700">
                          {stat.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="p-6 sm:p-8 flex flex-col justify-between"
              >
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-700 flex items-center">
                      <Sparkles
                        className={`w-5 h-5 mr-2 text-${themeColor}-500`}
                      />
                      {dict.whyTitle}
                    </h3>
                    <p className="mt-2 text-slate-600 leading-relaxed">
                      {whyIsItImportant}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-700 flex items-center">
                      <Brain
                        className={`w-5 h-5 mr-2 text-${themeColor}-500`}
                      />
                      {dict.whatYouWillDiscoverTitle}
                    </h3>
                    <ul className="mt-2 space-y-1 list-disc list-inside text-slate-600">
                      {whatYouWillDiscover.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div
                    className={`border-r-4 border-${themeColor}-300 pr-4 py-2 bg-${themeColor}-50/60 rounded-r-md`}
                  >
                    <p className="text-slate-700 italic">{guidingThought}</p>
                  </div>
                </div>

                {!isMobile && (
                  <div className="mt-8 pt-6 border-t border-slate-200">
                    <ActionButton />
                  </div>
                )}
              </motion.div>
            </div>
            {isMobile && (
              <div className="p-6 border-t">
                <ActionButton />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
      <style jsx global>{`
        @keyframes pulse-fast {
          0%,
          100% {
            opacity: 1;
            transform: translateX(0);
          }
          50% {
            opacity: 0.8;
            transform: translateX(2px);
          }
        }
        .animate-pulse-fast {
          animation: pulse-fast 1.5s ease-in-out infinite;
        }
        .bg-sky-50\\/50,
        .bg-sky-100,
        .bg-sky-600,
        .hover\\:bg-sky-700,
        .text-sky-600,
        .text-sky-700,
        .text-sky-800,
        .border-sky-300 {
        }
        .bg-rose-50\\/50,
        .bg-rose-100,
        .bg-rose-600,
        .hover\\:bg-rose-700,
        .text-rose-600,
        .text-rose-700,
        .text-rose-800,
        .border-rose-300 {
        }
        .bg-purple-50\\/50,
        .bg-purple-100,
        .bg-purple-600,
        .hover\\:bg-purple-700,
        .text-purple-600,
        .text-purple-700,
        .text-purple-800,
        .border-purple-300 {
        }
        .bg-teal-50\\/50,
        .bg-teal-100,
        .bg-teal-600,
        .hover\\:bg-teal-700,
        .text-teal-600,
        .text-teal-700,
        .text-teal-800,
        .border-teal-300 {
        }
        .bg-amber-50\\/50,
        .bg-amber-100,
        .bg-amber-600,
        .hover\\:bg-amber-700,
        .text-amber-600,
        .text-amber-700,
        .text-amber-800,
        .border-amber-300 {
        }
      `}</style>
    </div>
  );
}
