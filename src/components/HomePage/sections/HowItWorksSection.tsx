// src/components/HomePage/sections/HowItWorksSection.tsx
'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { getRelativeCloudinaryPath } from '@/lib/utils';
import Step from '../components/Step';
import { LiveSuggestionDemo } from '../components/LiveSuggestionDemo';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  ArrowRight,
  Heart,
  CheckCircle,
  Quote,
  Star,
  Lightbulb,
  TrendingUp,
  Award,
  HeartHandshake,
  Zap,
} from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import type {
  HowItWorksDict,
  SuggestionsDictionary,
  ProfileCardDict,
} from '@/types/dictionary';
import { generateDemoData } from '../components/demo-data';

type DemoData = Awaited<ReturnType<typeof generateDemoData>>;

interface HowItWorksProps {
  dict: HowItWorksDict;
  suggestionsDict: SuggestionsDictionary;
  profileCardDict: ProfileCardDict;
  demoData: DemoData;
  locale: 'he' | 'en';
}

// --- START: Helper Components ---

// 1. רקע דינמי משודרג (מותאם ב-100% לפלטת ה-Hero)
const DynamicBackground: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
    <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-teal-50/30 to-orange-50/20" />
    <div className="absolute inset-0 opacity-30">
      {/* Teal Orb */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-teal-300/20 rounded-full blur-3xl animate-float-slow" />
      {/* Orange Orb */}
      <div
        className="absolute top-1/3 right-20 w-64 h-64 bg-orange-300/20 rounded-full blur-3xl animate-float-slow"
        style={{ animationDelay: '2s' }}
      />
      {/* Rose Orb */}
      <div
        className="absolute bottom-20 left-1/3 w-80 h-80 bg-rose-300/15 rounded-full blur-3xl animate-float-slow"
        style={{ animationDelay: '4s' }}
      />
      {/* Amber Orb */}
      <div
        className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-amber-300/20 rounded-full blur-3xl animate-float-slow"
        style={{ animationDelay: '6s' }}
      />
    </div>
    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:30px_30px]" />
  </div>
);

// 2. כרטיס יתרון עם צבעים מעודכנים (תואם ל-DesktopPrincipleCard מה-Hero)
const KeyBenefit: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'teal' | 'rose' | 'amber' | 'orange';
  delay?: number;
}> = ({ icon, title, description, color, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const colorClasses = {
    // Teal / Knowledge style
    teal: {
      bg: 'from-teal-400 via-teal-500 to-emerald-500',
      shadow: 'shadow-teal-500/25',
    },
    // Rose / Personal style
    rose: {
      bg: 'from-rose-400 via-pink-500 to-red-500',
      shadow: 'shadow-rose-500/25',
    },
    // Amber style
    amber: {
      bg: 'from-amber-400 via-yellow-500 to-orange-500',
      shadow: 'shadow-amber-500/25',
    },
    // Orange / Privacy style (Updated to match Hero)
    orange: {
      bg: 'from-orange-400 via-amber-500 to-yellow-500',
      shadow: 'shadow-orange-500/25',
    },
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay }}
      className="text-center group p-6 bg-gradient-to-br from-white via-white to-slate-50 backdrop-blur-md rounded-3xl border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 h-full"
    >
      <div
        className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${colorClasses[color].bg} ${colorClasses[color].shadow} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 text-white`}
      >
        {icon}
      </div>
      <h4 className="font-bold text-lg text-gray-800 mb-2">{title}</h4>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
};
// --- END: Helper Components ---

const HowItWorksSection: React.FC<HowItWorksProps> = ({
  dict,
  suggestionsDict,
  demoData,
  profileCardDict,
  locale,
}) => {
  const demoRef = useRef(null);
  const isDemoInView = useInView(demoRef, { once: true, amount: 0.1 });

  // מערך צבעים תואם לפלטת ה-Hero (Teal, Amber, Rose, Orange)
  const stepColors = ['teal', 'amber', 'rose', 'orange'] as const;

  const benefitDetails = [
    {
      icon: <TrendingUp className="w-8 h-8" />,
      color: 'teal' as const,
    },
    { icon: <Award className="w-8 h-8" />, color: 'rose' as const },
    {
      icon: <Lightbulb className="w-8 h-8" />,
      color: 'amber' as const,
    },
    {
      icon: <HeartHandshake className="w-8 h-8" />,
      color: 'orange' as const,
    },
  ];

  const ArrowIcon = locale === 'he' ? ArrowLeft : ArrowRight;

  return (
    <section
      id="how-it-works"
      className="relative pb-20 md:pb-28 px-4 overflow-hidden"
    >
      <DynamicBackground />

      <div className="relative max-w-7xl mx-auto pt-16">
        {/* --- Chapter 1: The Promise --- */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1 }}
          className="text-center mb-20"
        >
          <div className="inline-block mb-6">
            <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-teal-100/50">
              <Sparkles className="w-5 h-5 text-teal-500" />
              <span className="text-teal-700 font-bold text-sm tracking-wide">
                {dict.promise.header}
              </span>
            </div>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-800 mb-8 leading-tight tracking-tight">
            {dict.promise.title_line1}
            <br />
            {dict.promise.title_line2_part1}{' '}
            {/* Updated Gradient: Teal -> Orange -> Amber (Matching Hero) */}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 animate-gradient">
              {dict.promise.title_line2_part2}
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
            {dict.promise.subtitle_line1}
            <br />
            <span className="text-teal-700 font-semibold bg-teal-50 px-2 rounded-lg">
              {dict.promise.subtitle_line2}
            </span>
          </p>
        </motion.div>

        {/* --- Chapter 2: The Process --- */}
        <div className="relative mb-24">
          {/* Card Background Updated: White/Teal/Orange Mix */}
          <div className="absolute inset-0 -m-8 bg-gradient-to-br from-white/80 via-teal-50/40 to-orange-50/40 rounded-[3rem] backdrop-blur-xl border border-white/60 shadow-2xl" />
          <div className="relative max-w-5xl mx-auto space-y-12 p-8">
            {dict.process.steps.map((step, index) => (
              <Step
                key={index}
                number={`${index + 1}`}
                title={step.title}
                description={
                  <>
                    {step.description}
                    {step.linkText && (
                      <Link
                        href={`/${locale}/questionnaire`}
                        className="font-bold text-teal-600 hover:text-teal-700 hover:underline decoration-2 underline-offset-4 transition-all"
                      >
                        {' '}
                        {step.linkText}
                      </Link>
                    )}
                  </>
                }
                color={stepColors[index]}
                isLast={index === dict.process.steps.length - 1}
              />
            ))}
          </div>
        </div>

        {/* --- Chapter 3: The Proof --- */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.02 }}
          transition={{ duration: 0.8 }}
          className="relative mb-24"
        >
          <div className="text-center mb-16">
            <div
              id="suggestion-demo"
              // Badge: Orange -> Rose Gradient
              className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-full px-6 py-3 shadow-lg mb-6"
            >
              <Star className="w-5 h-5 fill-white" />
              <span className="font-bold tracking-wide">
                {dict.proof.header}
              </span>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              {dict.proof.title_part1}
              {/* Gradient: Orange -> Amber -> Red */}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-red-600">
                {' '}
                {dict.proof.title_part2}
              </span>
            </h3>
            <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
              {dict.proof.subtitle}
            </p>
          </div>

          <motion.div
            ref={demoRef}
            initial={{ opacity: 0, y: 30 }}
            animate={
              isDemoInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
            }
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col lg:flex-row gap-8 lg:gap-16 justify-center items-center max-w-5xl mx-auto"
          >
            <div className="flex flex-col items-center w-full lg:w-auto group">
              <h4 className="text-lg font-bold text-teal-800 text-center px-6 py-2 bg-teal-100/80 rounded-full mb-6 backdrop-blur-sm">
                {dict.proof.demo_female}
              </h4>
              <div className="relative w-full max-w-xs mx-auto transition-transform duration-500 group-hover:-translate-y-2">
                <div className="absolute -inset-4 bg-gradient-to-tr from-teal-400/30 via-emerald-400/30 to-teal-400/30 rounded-[3rem] blur-2xl opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <LiveSuggestionDemo
                    suggestion={demoData.demoSuggestionDataMale}
                    userId="visitor-user-id"
                    demoAiAnalysis={demoData.demoAiAnalysisForDaniel}
                    suggestionsDict={suggestionsDict}
                    profileCardDict={profileCardDict}
                    suggestionDemoDict={dict.suggestionDemo}
                    locale={locale}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center w-full lg:w-auto group">
              <h4 className="text-lg font-bold text-orange-800 text-center px-6 py-2 bg-orange-100/80 rounded-full mb-6 backdrop-blur-sm">
                {dict.proof.demo_male}
              </h4>
              <div className="relative w-full max-w-xs mx-auto transition-transform duration-500 group-hover:-translate-y-2">
                <div className="absolute -inset-4 bg-gradient-to-bl from-orange-400/30 via-rose-400/30 to-orange-400/30 rounded-[3rem] blur-2xl opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <LiveSuggestionDemo
                    suggestion={demoData.demoSuggestionDataFemale}
                    userId="visitor-user-id"
                    demoAiAnalysis={demoData.demoAiAnalysisForNoa}
                    suggestionsDict={suggestionsDict}
                    profileCardDict={profileCardDict}
                    suggestionDemoDict={dict.suggestionDemo}
                    locale={locale}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* --- Key Benefits --- */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8 }}
          className="mb-24"
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-800 inline-block relative z-10">
              {dict.keyBenefits.title_part1}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500">
                {' '}
                {dict.keyBenefits.title_part2}
              </span>
              <div className="absolute -bottom-2 left-0 right-0 h-3 bg-amber-200/40 -z-10 skew-x-12" />
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {dict.keyBenefits.benefits.map((benefit, index) => (
              <KeyBenefit
                key={index}
                icon={benefitDetails[index].icon}
                title={benefit.title}
                description={benefit.description}
                color={benefitDetails[index].color}
                delay={0.1 * (index + 1)}
              />
            ))}
          </div>
        </motion.div>

        {/* --- Founder's Testimonial (The Team Component) --- */}
        <div className="mb-24">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            {/* Header Badge: Matching Hero 'Principles' colors */}
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-teal-50 to-orange-50 backdrop-blur-sm rounded-full px-8 py-3 shadow-lg border border-teal-200/60">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              <span className="text-gray-800 font-bold text-lg">
                {dict.testimonial.header}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-6xl mx-auto"
          >
            {/* Updated Card Gradient to match Hero Cards exactly */}
            <div className="relative bg-gradient-to-br from-white via-teal-50/40 to-orange-50/40 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white/60 overflow-hidden">
              {/* Subtle mesh background inside */}
              <div className="absolute inset-0 opacity-40">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-100 rounded-full blur-3xl mix-blend-multiply" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-100 rounded-full blur-3xl mix-blend-multiply" />
              </div>

              <div className="relative grid md:grid-cols-[auto_1fr] gap-8 md:gap-12 p-10 md:p-14 items-center z-10">
                {/* Left side - Author */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="flex flex-col items-center md:items-start gap-6"
                >
                  <div className="relative">
                    {/* Decorative elements around image - Updated to Hero Palette */}
                    <div className="absolute -inset-4 bg-gradient-to-br from-teal-400/30 to-orange-400/30 rounded-full blur-xl" />
                    
                    {/* Floating accents */}
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl rotate-12 shadow-lg z-20" />
                    <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg -rotate-12 shadow-lg z-20" />

                    <div className="relative w-32 h-32 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white ring-4 ring-teal-100/50 transform hover:scale-105 transition-transform duration-300">
                      <Image
                        src={getRelativeCloudinaryPath(
                          'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753700884/eitan_h9ylkc.jpg'
                        )}
                        alt={dict.testimonial.author_name}
                        fill
                        sizes="128px"
                        className="object-cover object-center"
                      />
                    </div>
                  </div>

                  <div className="text-center md:text-right rtl:md:text-left">
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {dict.testimonial.author_name}
                    </div>
                    {/* Role Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-teal-200/60 shadow-sm">
                      <Sparkles className="w-4 h-4 text-teal-500" />
                      <span className="text-sm font-semibold text-teal-700 uppercase tracking-wider">
                        {dict.testimonial.author_role}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Right side - Quote */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="relative"
                >
                  {/* Large decorative quote mark - Teal */}
                  <div className="absolute -top-6 right-4 rtl:left-4 rtl:right-auto opacity-10">
                    <Quote className="w-24 h-24 text-teal-600 transform rotate-180" />
                  </div>

                  <div className="relative bg-white/60 backdrop-blur-sm rounded-3xl p-8 md:p-10 border border-white/80 shadow-lg group hover:shadow-xl transition-shadow duration-300">
                    <p className="text-xl md:text-2xl text-gray-700 leading-relaxed font-medium relative z-10">
                      &quot;{dict.testimonial.quote}&quot;
                    </p>
                  </div>

                  {/* Small decorative quote mark - Orange */}
                  <div className="absolute -bottom-4 left-4 rtl:right-4 rtl:left-auto opacity-10">
                    <Quote className="w-16 h-16 text-orange-600" />
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* --- Final CTA --- */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.8 }}
          className="relative text-center pb-10"
        >
          {/* Background updated to glass/gradient */}
          <div className="relative max-w-4xl mx-auto p-12 bg-gradient-to-br from-white/90 via-teal-50/60 to-orange-50/60 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white/60">
            <h4 className="text-3xl md:text-5xl font-extrabold text-gray-800 mb-6 leading-tight">
              {dict.finalCta.title_line1}
              <br />
              {/* Gradient Title: Teal -> Orange -> Amber */}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 animate-gradient">
                {dict.finalCta.title_line2}
              </span>
            </h4>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto">
              {dict.finalCta.subtitle_line1}
              <br className="hidden sm:inline" /> {dict.finalCta.subtitle_line2}
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href={`/${locale}/auth/register`}>
                {/* Button Style copied EXACTLY from HeroSection for perfect match */}
                <Button
                  size="lg"
                  className="text-xl font-bold px-12 py-8 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 group relative overflow-hidden transform hover:-translate-y-1"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/40 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
                  <div className="relative z-10 flex items-center justify-center gap-3">
                    <Zap className="h-6 w-6 group-hover:rotate-12 transition-transform" />
                    <span>{dict.finalCta.button}</span>
                    <ArrowIcon className="h-6 w-6 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                  </div>
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center justify-center gap-2 text-gray-500 font-medium">
              <CheckCircle className="w-5 h-5 text-teal-500" />
              <span>{dict.finalCta.features}</span>
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-25px) translateX(15px);
          }
          50% {
            transform: translateY(-10px) translateX(25px);
          }
          75% {
            transform: translateY(-20px) translateX(10px);
          }
        }
        .animate-float-slow {
          animation: float-slow 20s ease-in-out infinite;
        }

        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2.5s infinite;
        }

        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 4s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default HowItWorksSection;