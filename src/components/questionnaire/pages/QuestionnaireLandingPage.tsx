// src/components/questionnaire/pages/QuestionnaireLandingPage.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Heart,
  User,
  Users,
  Scroll,
  Clock,
  ArrowRight,
  Star,
  Shield,
  CheckCircle,
  Lock,
  ArrowLeft,
  Loader2,
  Sparkles,
  UserCheck,
  Target,
  Lightbulb,
  FileText,
  Zap,
  AlertCircle,
  MessageCircle,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { useIsMobile } from '../hooks/useMediaQuery';
import { motion, useInView } from 'framer-motion';
import type { QuestionnaireLandingPageDict } from '@/types/dictionary';

// --- Props Interface ---
interface QuestionnaireLandingPageProps {
  onStartQuestionnaire: () => void;
  hasSavedProgress: boolean;
  isLoading?: boolean;
  dict: QuestionnaireLandingPageDict;
  locale: string;
}

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

const staggeredCardVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

// --- Enhanced Background Component ---
const DynamicBackground: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 opacity-30">
      <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-br from-teal-300/30 to-cyan-400/20 rounded-full blur-3xl animate-float-slow" />
      <div
        className="absolute top-1/3 right-20 w-64 h-64 bg-gradient-to-br from-orange-300/30 to-amber-400/20 rounded-full blur-3xl animate-float-slow"
        style={{ animationDelay: '2s' }}
      />
      <div
        className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-br from-pink-300/25 to-rose-400/20 rounded-full blur-3xl animate-float-slow"
        style={{ animationDelay: '4s' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-gradient-to-br from-purple-300/25 to-indigo-400/20 rounded-full blur-3xl animate-float-slow"
        style={{ animationDelay: '6s' }}
      />
    </div>
    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:30px_30px]" />
    <svg
      className="absolute inset-0 w-full h-full opacity-5"
      viewBox="0 0 1000 1000"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#f97316" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <path
        d="M0,300 Q250,200 500,300 T1000,300 L1000,0 L0,0 Z"
        fill="url(#grad1)"
        className="animate-pulse-slow"
      />
      <path
        d="M0,700 Q250,800 500,700 T1000,700 L1000,1000 L0,1000 Z"
        fill="url(#grad1)"
        className="animate-pulse-slow"
        style={{ animationDelay: '3s' }}
      />
    </svg>
  </div>
);

// --- Problem Card Component ---
interface ProblemCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}

const ProblemCard: React.FC<ProblemCardProps> = ({
  icon,
  title,
  description,
  delay = 0,
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -30 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
      transition={{ duration: 0.6, delay }}
      className="flex items-start gap-4 p-6 bg-rose-50/80 backdrop-blur-sm rounded-2xl border-2 border-rose-200/60 shadow-sm hover:shadow-lg transition-all duration-300 group"
    >
      <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-rose-400 to-red-500 text-white shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-lg text-gray-800 mb-2">{title}</h4>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
};

// --- Solution Card Component ---
interface SolutionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  delay?: number;
}

const SolutionCard: React.FC<SolutionCardProps> = ({
  icon,
  title,
  description,
  gradient,
  delay = 0,
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative overflow-hidden rounded-3xl bg-white/90 backdrop-blur-sm p-8 shadow-lg hover:shadow-2xl border border-white/60 transition-all duration-500 h-full"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/40 to-transparent rounded-bl-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/30 to-transparent rounded-tr-full blur-xl" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-center mb-6">
          <div
            className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-xl transform group-hover:rotate-12 transition-transform duration-500`}
          >
            {icon}
            <div className="absolute inset-0 rounded-2xl bg-white/20 backdrop-blur-sm" />
          </div>
        </div>
        <h4 className="font-bold text-gray-800 text-xl mb-4 text-center leading-tight">
          {title}
        </h4>
        <p className="text-gray-600 text-base leading-relaxed text-center flex-1">
          {description}
        </p>
        <div className="mt-6 w-12 h-1 bg-gradient-to-r from-transparent via-gray-300/60 to-transparent rounded-full mx-auto" />
      </div>
    </motion.div>
  );
};

// --- Main Component ---
export default function QuestionnaireLandingPage({
  onStartQuestionnaire,
  hasSavedProgress,
  isLoading = false,
  dict,
  locale,
}: QuestionnaireLandingPageProps) {
  const { status, data: session } = useSession();
  const isMobile = useIsMobile();
  const isRTL = locale === 'he';

  const worldVisuals = [
    { id: 'PERSONALITY', icon: <User className="h-7 w-7" />, color: 'sky' },
    { id: 'VALUES', icon: <Heart className="h-7 w-7" />, color: 'rose' },
    { id: 'RELATIONSHIP', icon: <Users className="h-7 w-7" />, color: 'purple' },
    { id: 'PARTNER', icon: <UserCheck className="h-7 w-7" />, color: 'teal' },
    { id: 'RELIGION', icon: <Scroll className="h-7 w-7" />, color: 'amber' },
  ] as const;

  const getCtaText = () => {
    if (hasSavedProgress) return dict.cta.continue;
    if (session?.user?.firstName)
      return dict.cta.startAsUser.replace('{{name}}', session.user.firstName);
    return dict.cta.startDefault;
  };

  const CtaIcon = hasSavedProgress ? CheckCircle : Heart;
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const backArrowIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div
      className={cn(
        'relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-teal-50/30 to-slate-50',
        isRTL ? 'dir-rtl text-right' : 'dir-ltr text-left',
        isMobile && 'pb-28'
      )}
    >
      <DynamicBackground />

      {/* SECTION 1: HERO - The Invitation */}
      <motion.section
        className="relative py-16 sm:py-20 px-4 text-center"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-white/60 mb-8"
            variants={fadeInUp}
          >
            <Sparkles className="w-5 h-5 text-teal-500" />
            <span className="text-teal-700 font-bold text-sm">
              {dict.hero.badge}
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight leading-tight"
            variants={fadeInUp}
          >
            <span className="text-gray-800">{dict.hero.title1}</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-orange-500 to-rose-600 animate-gradient">
              {dict.hero.title2}
            </span>
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed mb-4"
            variants={fadeInUp}
          >
            {dict.hero.subtitle1}
            <br className="hidden sm:inline" />
            {dict.hero.subtitle2}{' '}
            <span className="font-bold text-teal-700">
              {dict.hero.subtitleHighlight}
            </span>{' '}
            {dict.hero.subtitle3}
          </motion.p>

          <motion.div
            className="inline-flex items-center gap-2 bg-amber-100/80 rounded-full px-5 py-2 border border-amber-300/60 mb-10"
            variants={fadeInUp}
          >
            <Clock className="w-4 h-4 text-amber-700" />
            <span className="text-amber-800 font-semibold text-sm">
              {dict.hero.timeEstimate}
            </span>
          </motion.div>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            variants={fadeInUp}
          >
            <Button
              size="lg"
              className="w-full sm:w-auto text-lg font-bold px-10 py-7 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 group relative overflow-hidden transform hover:-translate-y-1"
              onClick={onStartQuestionnaire}
              disabled={isLoading}
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
              <div className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <CtaIcon className="h-6 w-6 fill-white" />
                    <span>{getCtaText()}</span>
                    <ArrowIcon className="h-5 w-5" />
                  </>
                )}
              </div>
            </Button>

            {status !== 'authenticated' && (
              <Link href="/auth/signin">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-base font-medium px-8 py-6 border-2 border-teal-300 text-teal-700 hover:bg-teal-50 hover:border-teal-400 rounded-full transition-all duration-300 bg-white/80 backdrop-blur-sm"
                >
                  <Lock className={cn('h-5 w-5', isRTL ? 'ms-2' : 'me-2')} />
                  {dict.cta.login}
                </Button>
              </Link>
            )}
          </motion.div>
        </div>
      </motion.section>

      {/* SECTION 2: THE PROBLEM - The Pain Point */}
      <motion.section
        className="py-20 px-4 relative"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={containerVariants}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-16" variants={fadeInUp}>
            <div className="inline-flex items-center gap-3 bg-rose-100/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-md border border-rose-200/60 mb-6">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <span className="text-rose-700 font-bold">
                {dict.problemSection.badge}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-gray-800 leading-tight">
              {dict.problemSection.title1}
              <br />
              <span className="text-2xl sm:text-3xl text-gray-600 font-normal">
                {dict.problemSection.title2}
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
            <ProblemCard
              icon={<MessageCircle className="w-6 h-6" />}
              title={dict.problemSection.cards.generalAnswers.title}
              description={dict.problemSection.cards.generalAnswers.description}
              delay={0}
            />
            <ProblemCard
              icon={<Calendar className="w-6 h-6" />}
              title={dict.problemSection.cards.wastedTime.title}
              description={dict.problemSection.cards.wastedTime.description}
              delay={0.15}
            />
            <ProblemCard
              icon={<Target className="w-6 h-6" />}
              title={dict.problemSection.cards.lackOfFocus.title}
              description={dict.problemSection.cards.lackOfFocus.description}
              delay={0.3}
            />
            <ProblemCard
              icon={<AlertCircle className="w-6 h-6" />}
              title={dict.problemSection.cards.frustration.title}
              description={dict.problemSection.cards.frustration.description}
              delay={0.45}
            />
          </div>

          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="inline-block bg-gradient-to-r from-amber-100 via-orange-100 to-rose-100 rounded-3xl px-8 py-5 shadow-xl border-2 border-amber-300/60">
              <p className="text-xl md:text-2xl font-bold text-gray-800">
                {dict.problemSection.insight}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* SECTION 3: THE SOLUTION - The Questionnaire */}
      <motion.section
        className="py-20 px-4 relative bg-white/60 backdrop-blur-sm"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={containerVariants}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-16" variants={fadeInUp}>
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-teal-100 to-cyan-100 backdrop-blur-sm rounded-full px-6 py-3 shadow-md border border-teal-300/60 mb-6">
              <Lightbulb className="w-5 h-5 text-teal-600" />
              <span className="text-teal-700 font-bold">
                {dict.solutionSection.badge}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-gray-800 leading-tight">
              {dict.solutionSection.title}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-orange-600">
                {dict.solutionSection.titleHighlight}
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {dict.solutionSection.subtitle1}
              <br className="hidden sm:inline" />
              {dict.solutionSection.subtitle2}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <SolutionCard
              icon={<Heart className="w-8 h-8" />}
              title={dict.solutionSection.cards.selfDiscovery.title}
              description={dict.solutionSection.cards.selfDiscovery.description}
              gradient="from-rose-400 to-pink-500"
              delay={0}
            />
            <SolutionCard
              icon={<FileText className="w-8 h-8" />}
              title={dict.solutionSection.cards.soulReport.title}
              description={dict.solutionSection.cards.soulReport.description}
              gradient="from-teal-400 to-cyan-500"
              delay={0.15}
            />
            <SolutionCard
              icon={<Target className="w-8 h-8" />}
              title={dict.solutionSection.cards.focusedSearch.title}
              description={dict.solutionSection.cards.focusedSearch.description}
              gradient="from-amber-400 to-orange-500"
              delay={0.3}
            />
          </div>

          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="inline-block bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 rounded-2xl p-8 shadow-lg border border-purple-200/60">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Zap className="w-6 h-6 text-orange-500" />
                <h3 className="text-2xl font-bold text-gray-800">
                  {dict.solutionSection.result.title}
                </h3>
                <Zap className="w-6 h-6 text-orange-500" />
              </div>
              <p className="text-lg text-gray-600 leading-relaxed max-w-2xl">
                {dict.solutionSection.result.description}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* SECTION 4: THE WORLDS - The Journey */}
      <motion.section
        className="py-20 px-4 relative"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={containerVariants}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-16" variants={fadeInUp}>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-800">
              {dict.worldsSection.title}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 mx-auto rounded-full mb-6" />
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {dict.worldsSection.subtitle}
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6"
            variants={staggeredCardVariants}
          >
            {worldVisuals.map((world, index) => {
              const colorClasses = {
                sky: 'from-sky-400 to-blue-500',
                rose: 'from-rose-400 to-red-500',
                purple: 'from-purple-400 to-indigo-500',
                teal: 'from-teal-400 to-emerald-500',
                amber: 'from-amber-400 to-orange-500',
              };
              
              const worldInfo = dict.worldsSection.worlds[world.id];

              return (
                <motion.div key={world.id} variants={fadeInUp}>
                  <div className="relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white/95 backdrop-blur-sm border-2 border-white/60 flex flex-col h-full group p-8 text-center items-center">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/50 to-transparent rounded-bl-full blur-xl" />
                    <div
                      className={cn(
                        'relative p-5 rounded-2xl bg-gradient-to-br text-white shadow-xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300',
                        colorClasses[world.color]
                      )}
                    >
                      <div className="absolute inset-0 rounded-2xl bg-white/20 backdrop-blur-sm" />
                      <div className="relative z-10">{world.icon}</div>
                    </div>
                    <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-gray-100 mb-4">
                      <span className="text-xs font-bold text-gray-600">
                        {dict.worldsSection.worldLabel.replace('{{number}}', (index + 1).toString())}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-3 leading-tight">
                      {worldInfo.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {worldInfo.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </motion.section>

      {/* SECTION 5: ADDITIONAL FEATURES */}
      <motion.section
        className="py-20 px-4 bg-gradient-to-b from-white/80 to-teal-50/40"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={containerVariants}
      >
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-16" variants={fadeInUp}>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-800">
              {dict.featuresSection.title}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 mx-auto rounded-full mb-6" />
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
            variants={staggeredCardVariants}
          >
            <motion.div
              className="flex flex-col items-center p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-white/60 group"
              variants={fadeInUp}
            >
              <div className="p-5 rounded-2xl mb-6 bg-gradient-to-br from-sky-400 to-cyan-500 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-800">
                {dict.featuresSection.cards.fast.title}
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                {dict.featuresSection.cards.fast.description}
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col items-center p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-white/60 group"
              variants={fadeInUp}
            >
              <div className="p-5 rounded-2xl mb-6 bg-gradient-to-br from-rose-400 to-pink-500 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-800">
                {dict.featuresSection.cards.private.title}
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                {dict.featuresSection.cards.private.description}
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col items-center p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-white/60 group"
              variants={fadeInUp}
            >
              <div className="p-5 rounded-2xl mb-6 bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-800">
                {dict.featuresSection.cards.instantResult.title}
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                {dict.featuresSection.cards.instantResult.description}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* SECTION 6: FINAL CTA */}
      <motion.section
        className="py-24 px-4 text-center relative"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={containerVariants}
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="relative bg-gradient-to-br from-white/95 via-teal-50/80 to-orange-50/80 backdrop-blur-xl rounded-3xl p-12 md:p-16 shadow-2xl border-2 border-white/60"
            variants={fadeInUp}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2">
              <div className="bg-gradient-to-r from-teal-500 via-orange-500 to-rose-500 rounded-full p-4 shadow-xl">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="absolute top-4 right-8 w-24 h-24 bg-gradient-to-br from-teal-200/30 to-transparent rounded-full blur-2xl" />
            <div className="absolute bottom-4 left-8 w-32 h-32 bg-gradient-to-tr from-orange-200/30 to-transparent rounded-full blur-2xl" />

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-gray-800 leading-tight">
                {dict.finalCta.title1}
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-orange-600 to-rose-600">
                  {dict.finalCta.title2}
                </span>
              </h2>
              <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto whitespace-pre-line">
                {dict.finalCta.subtitle}
              </p>

              <motion.div variants={fadeInUp}>
                <Button
                  size="lg"
                  onClick={onStartQuestionnaire}
                  disabled={isLoading}
                  className="text-xl font-bold px-12 py-8 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 group relative overflow-hidden transform hover:-translate-y-1 hover:scale-105"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/40 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
                  <div className="relative z-10 flex items-center justify-center gap-3">
                    {isLoading ? (
                      <Loader2 className="h-7 w-7 animate-spin" />
                    ) : (
                      <>
                        <FileText className="h-7 w-7 group-hover:rotate-12 transition-transform" />
                        <span>{dict.finalCta.buttonText}</span>
                        <ArrowIcon className="h-6 w-6 group-hover:-translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </Button>
              </motion.div>

              <motion.div
                className="mt-8 flex items-center justify-center gap-3 text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <CheckCircle className="w-5 h-5 text-teal-500" />
                <span className="font-medium">{dict.finalCta.assurance}</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* MOBILE STICKY CTA */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t-2 border-teal-200/80 shadow-2xl z-50">
          <Button
            size="lg"
            className="w-full text-base font-bold py-4 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 text-white rounded-xl shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden"
            onClick={onStartQuestionnaire}
            disabled={isLoading}
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
            <div className="relative z-10 flex items-center justify-center gap-2">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <CtaIcon className="h-5 w-5 fill-white" />
                  <span>{getCtaText()}</span>
                </>
              )}
            </div>
          </Button>
        </div>
      )}

      <footer className="text-center py-8 text-gray-500 text-sm bg-slate-50/80">
        {dict.footer.copyright.replace('{{year}}', new Date().getFullYear().toString())}
      </footer>

      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-25px) translateX(15px); }
          50% { transform: translateY(-10px) translateX(25px); }
          75% { transform: translateY(-20px) translateX(10px); }
        }
        .animate-float-slow {
          animation: float-slow 20s ease-in-out infinite;
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
        
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2.5s infinite;
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 4s ease-in-out infinite;
        }

        .shadow-3xl {
          box-shadow: 0 35px 60px -15px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}