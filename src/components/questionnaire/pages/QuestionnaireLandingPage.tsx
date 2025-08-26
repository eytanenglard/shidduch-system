// src/components/questionnaire/pages/QuestionnaireLandingPage.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Heart,
  User,
  Users,
  Scroll,
  Clock,
  Star,
  Shield,
  CheckCircle,
  Lock,
  ArrowLeft,
  Loader2,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { useIsMobile } from '../hooks/useMediaQuery';
import { motion } from 'framer-motion';
import type { QuestionnaireLandingPageDict } from '@/types/dictionary';

// --- Props Interface ---
interface QuestionnaireLandingPageProps {
  onStartQuestionnaire: () => void;
  hasSavedProgress: boolean;
  isLoading?: boolean;
  dict: QuestionnaireLandingPageDict;
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

// --- START: התיקון ---
// הוספת ההגדרה החסרה של האנימציה
const staggeredCardVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};
// --- END: התיקון ---

// --- Background Component ---
const DynamicBackground: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 opacity-40">
      <div className="absolute top-10 left-10 w-40 h-40 bg-gradient-to-br from-teal-200/40 to-orange-300/30 rounded-full blur-3xl animate-float-slow" />
      <div
        className="absolute top-1/2 right-20 w-32 h-32 bg-gradient-to-br from-amber-200/40 to-orange-300/30 rounded-full blur-2xl animate-float-slow"
        style={{ animationDelay: '2s' }}
      />
      <div
        className="absolute bottom-10 left-1/4 w-48 h-48 bg-gradient-to-br from-teal-200/30 to-amber-300/25 rounded-full blur-3xl animate-float-slow"
        style={{ animationDelay: '4s' }}
      />
    </div>
    <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#f97316_0.5px,transparent_0.5px)] [background-size:24px_24px]" />
  </div>
);

// --- Main Component ---
export default function QuestionnaireLandingPage({
  onStartQuestionnaire,
  hasSavedProgress,
  isLoading = false,
  dict,
}: QuestionnaireLandingPageProps) {
  const { status, data: session } = useSession();
  const isMobile = useIsMobile();

  const worldVisuals = [
    { id: 'PERSONALITY', icon: <User />, color: 'sky' },
    { id: 'VALUES', icon: <Heart />, color: 'rose' },
    { id: 'RELATIONSHIP', icon: <Users />, color: 'purple' },
    { id: 'PARTNER', icon: <UserCheck />, color: 'teal' },
    { id: 'RELIGION', icon: <Scroll />, color: 'amber' },
  ];

  const getCtaText = () => {
    if (hasSavedProgress) return dict.cta.continue;
    if (session?.user?.firstName)
      return dict.cta.startAsUser.replace('{{name}}', session.user.firstName);
    return dict.cta.start;
  };
  const CtaIcon = hasSavedProgress ? CheckCircle : Heart;

  return (
    <div
      className={cn(
        'relative min-h-screen overflow-hidden text-right dir-rtl bg-slate-50',
        isMobile && 'pb-28'
      )}
    >
      <DynamicBackground />

      {/* SECTION 1: HERO - The Invitation */}
      <motion.section
        className="relative py-20 px-4 sm:py-24 text-center"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-white/60 mb-8"
            variants={fadeInUp}
          >
            <Sparkles className="w-6 h-6 text-rose-500" />
            <span className="text-rose-700 font-semibold">
              {dict.hero.badge}
            </span>
          </motion.div>
          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 tracking-tight"
            variants={fadeInUp}
          >
            <span className="text-gray-800">{dict.hero.title}</span>
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed"
            variants={fadeInUp}
          >
            {dict.hero.subtitle}
          </motion.p>
          <motion.div
            className="mt-12 space-y-4 flex flex-col items-center"
            variants={fadeInUp}
          >
            <Button
              size="lg"
              className="w-full max-w-sm text-lg font-semibold px-8 py-7 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden transform hover:-translate-y-1"
              onClick={onStartQuestionnaire}
              disabled={isLoading}
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
              <div className="relative z-10 flex items-center justify-center">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <CtaIcon className="h-6 w-6 ms-2 fill-white" />
                    <span>{getCtaText()}</span>
                  </>
                )}
              </div>
            </Button>
            {status !== 'authenticated' && (
              <Link href="/auth/signin" className="w-full max-w-sm">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full text-md font-medium px-8 py-6 border-2 border-teal-200 text-teal-600 hover:bg-teal-50 hover:border-teal-300 rounded-full transition-all duration-300 bg-white/70 backdrop-blur-sm"
                >
                  <Lock className="h-5 w-5 ms-2" />
                  {dict.cta.loginButton}
                </Button>
              </Link>
            )}
          </motion.div>
        </div>
      </motion.section>

      {/* SECTION 2: WORLDS - The Journey's Map */}
      <motion.section
        className="py-16 px-4 relative"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={containerVariants}
      >
        <div className="absolute inset-0 -m-8 bg-white/95 backdrop-blur-xl rounded-t-3xl shadow-2xl border-t border-white/60" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div className="text-center mb-12" variants={fadeInUp}>
            <h2 className="text-3xl font-bold mb-3 text-gray-800">
              {dict.worldsSection.title}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 mx-auto rounded-full mb-6" />
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {dict.worldsSection.subtitle}
            </p>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
            variants={staggeredCardVariants}
          >
            {worldVisuals.map((world) => {
              const worldContent =
                dict.worlds[world.id as keyof typeof dict.worlds];
              const colorClasses = {
                sky: 'from-sky-400 to-blue-500',
                rose: 'from-rose-400 to-red-500',
                purple: 'from-purple-400 to-indigo-500',
                teal: 'from-teal-400 to-emerald-500',
                amber: 'from-amber-400 to-orange-500',
              };
              return (
                <motion.div key={world.id} variants={fadeInUp}>
                  <div className="overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white/90 backdrop-blur-sm border border-white/60 flex flex-col h-full group p-6 text-center items-center">
                    <div
                      className={cn(
                        'p-4 rounded-full bg-gradient-to-br text-white shadow-lg mb-4 group-hover:scale-110 transition-all duration-300',
                        colorClasses[world.color as keyof typeof colorClasses]
                      )}
                    >
                      {React.cloneElement(world.icon as React.ReactElement, {
                        className: 'h-7 w-7',
                      })}
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {worldContent.title}
                    </h3>
                    <p className="text-base text-gray-600 leading-relaxed flex-grow">
                      {worldContent.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </motion.section>

      {/* SECTION 3: FEATURES - The Promise */}
      <motion.section
        className="py-16 px-4 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={containerVariants}
      >
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-12" variants={fadeInUp}>
            <h2 className="text-3xl font-bold mb-3 text-gray-800">
              {dict.featuresSection.title}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 mx-auto rounded-full mb-6" />
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {dict.featuresSection.subtitle}
            </p>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
            variants={staggeredCardVariants}
          >
            {dict.featuresSection.features.map((feature, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center p-6 group"
                variants={fadeInUp}
              >
                <div className="p-4 rounded-full mb-5 transition-all duration-300 bg-slate-100 group-hover:bg-slate-200">
                  {index === 0 && <Clock className="h-8 w-8 text-sky-600" />}
                  {index === 1 && <Shield className="h-8 w-8 text-rose-600" />}
                  {index === 2 && <Star className="h-8 w-8 text-amber-600" />}
                </div>
                <h3 className="font-bold text-xl mb-2 text-gray-800">
                  {feature.title}
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* SECTION 4: FINAL CTA */}
      <motion.section
        className="py-20 px-4 text-center relative bg-slate-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={containerVariants}
      >
        <div className="max-w-3xl mx-auto">
          <motion.h2
            className="text-3xl font-bold mb-4 text-gray-800"
            variants={fadeInUp}
          >
            {dict.finalCta.title}
          </motion.h2>
          <motion.p
            className="text-lg text-gray-600 mb-8 max-w-xl mx-auto leading-relaxed"
            variants={fadeInUp}
          >
            {dict.finalCta.subtitle}
          </motion.p>
          <motion.div variants={fadeInUp}>
            <Button
              size="lg"
              onClick={onStartQuestionnaire}
              disabled={isLoading}
              className="w-full max-w-xs text-lg font-semibold px-8 py-7 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden transform hover:-translate-y-1"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
              <div className="relative z-10 flex items-center justify-center">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <ArrowLeft className="h-6 w-6 ms-2" />
                    <span>{dict.finalCta.buttonText}</span>
                  </>
                )}
              </div>
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/90 backdrop-blur-sm border-t border-teal-200/80 shadow-top z-50">
          <Button
            size="lg"
            className="w-full text-base font-semibold py-3 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow group relative overflow-hidden"
            onClick={onStartQuestionnaire}
            disabled={isLoading}
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
            <div className="relative z-10 flex items-center justify-center">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <CtaIcon className="h-5 w-5 ms-2 fill-white" />
                  <span>{getCtaText()}</span>
                </>
              )}
            </div>
          </Button>
        </div>
      )}

      <footer className="text-center py-6 text-gray-500 text-sm bg-slate-50">
        {dict.footer.copyright.replace(
          '{{year}}',
          new Date().getFullYear().toString()
        )}
      </footer>

      <style jsx global>{`
        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .shadow-top {
          box-shadow:
            0 -4px 6px -1px rgb(0 0 0 / 0.1),
            0 -2px 4px -2px rgb(0 0 0 / 0.1);
        }
      `}</style>
    </div>
  );
}
