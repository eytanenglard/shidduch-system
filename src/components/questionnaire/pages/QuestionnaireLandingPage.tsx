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
import type { QuestionnaireLandingPageDict } from '@/types/dictionary'; // ייבוא טיפוס המילון

// --- Props Interface ---
interface QuestionnaireLandingPageProps {
  onStartQuestionnaire: () => void;
  hasSavedProgress: boolean;
  isLoading?: boolean;
  dict: QuestionnaireLandingPageDict; // קבלת המילון כ-prop
}

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const staggeredCardVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
      scale: { type: 'spring', stiffness: 260, damping: 20 },
    },
  },
};

// --- Background Components ---
const DynamicBackground: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 opacity-30">
      <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-teal-200/40 to-orange-300/30 rounded-full blur-3xl animate-float-slow" />
      <div
        className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-amber-200/40 to-orange-300/30 rounded-full blur-2xl animate-float-slow"
        style={{ animationDelay: '2s' }}
      />
      <div
        className="absolute bottom-32 left-1/4 w-40 h-40 bg-gradient-to-br from-teal-200/30 to-amber-300/25 rounded-full blur-3xl animate-float-slow"
        style={{ animationDelay: '4s' }}
      />
      <div
        className="absolute bottom-10 right-10 w-28 h-28 bg-gradient-to-br from-orange-200/35 to-amber-300/30 rounded-full blur-2xl animate-float-slow"
        style={{ animationDelay: '1s' }}
      />
    </div>
    <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:20px_20px]" />
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1000 1000"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="bgGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0d9488" stopOpacity="0.08" />
          <stop offset="50%" stopColor="#f97316" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <path
        d="M0,200 C300,100 700,300 1000,200 L1000,0 L0,0 Z"
        fill="url(#bgGrad1)"
        className="animate-pulse-slow"
      />
      <path
        d="M0,800 C300,700 700,900 1000,800 L1000,1000 L0,1000 Z"
        fill="url(#bgGrad1)"
        className="animate-pulse-slow"
        style={{ animationDelay: '3s' }}
      />
    </svg>
  </div>
);

export default function QuestionnaireLandingPage({
  onStartQuestionnaire,
  hasSavedProgress,
  isLoading = false,
  dict,
}: QuestionnaireLandingPageProps) {
  const { status, data: session } = useSession();
  const isMobile = useIsMobile();

  // World visual configuration remains in code
  const worldVisuals = [
    {
      id: 'PERSONALITY',
      icon: <User className="h-7 w-7" />,
      colorGradient: 'from-sky-400 to-blue-500',
      questions: 20,
    },
    {
      id: 'VALUES',
      icon: <Heart className="h-7 w-7" />,
      colorGradient: 'from-rose-400 to-red-500',
      questions: 25,
    },
    {
      id: 'RELATIONSHIP',
      icon: <Users className="h-7 w-7" />,
      colorGradient: 'from-purple-400 to-indigo-500',
      questions: 18,
    },
    {
      id: 'PARTNER',
      icon: <UserCheck className="h-7 w-7" />,
      colorGradient: 'from-teal-400 to-emerald-500',
      questions: 22,
    },
    {
      id: 'RELIGION',
      icon: <Scroll className="h-7 w-7" />,
      colorGradient: 'from-amber-400 to-orange-500',
      questions: 15,
    },
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
        'relative min-h-screen overflow-hidden text-right dir-rtl bg-gradient-to-b from-white via-rose-50/30 to-white',
        isMobile && 'pb-28'
      )}
    >
      <DynamicBackground />
      <motion.section
        className="relative py-20 px-4 sm:py-24 text-center overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-4xl mx-auto relative">
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
          <motion.div
            className="relative max-w-3xl mx-auto mt-6"
            variants={fadeInUp}
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/60 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-100/50 to-transparent rounded-full transform translate-x-16 -translate-y-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-purple-100/50 to-transparent rounded-full transform -translate-x-12 translate-y-12" />
              <div className="relative">
                <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
                  {dict.hero.subtitle}
                </p>
              </div>
            </div>
          </motion.div>
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

      <motion.section
        className="py-16 px-4 relative"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={containerVariants}
      >
        <div className="absolute inset-0 -m-8 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60" />
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
              return (
                <motion.div key={world.id} variants={cardVariants}>
                  <Card className="overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white/90 backdrop-blur-sm border border-white/60 flex flex-col h-full group">
                    <CardContent className="p-6 text-center flex flex-col items-center flex-grow relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/50 to-white/80 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-2xl" />
                      <div className="relative z-10 flex flex-col items-center flex-grow">
                        <div
                          className={cn(
                            'p-4 rounded-full bg-gradient-to-br text-white shadow-lg mb-4 group-hover:scale-110 transition-all duration-300',
                            world.colorGradient
                          )}
                        >
                          {world.icon}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {worldContent.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-3">
                          {worldContent.questionsLabel.replace(
                            '{{count}}',
                            world.questions.toString()
                          )}
                        </p>
                        <p className="text-base text-gray-600 leading-relaxed flex-grow">
                          {worldContent.description}
                        </p>
                      </div>
                      <div className="absolute top-2 right-2 w-2 h-2 bg-gradient-to-br from-teal-300/50 to-orange-300/50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500" />
                      <div
                        className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-gradient-to-br from-orange-300/50 to-amber-300/50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700"
                        style={{ transitionDelay: '0.2s' }}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="py-16 px-4 relative"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={containerVariants}
      >
        <div className="max-w-5xl mx-auto relative">
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
                className="flex flex-col items-center p-6 relative group"
                variants={cardVariants}
              >
                <div className="absolute inset-0 bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/40 opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-105" />
                <div className="relative z-10 flex flex-col items-center">
                  {/* Icons can be mapped here if needed, or kept static */}
                  <div className="p-4 rounded-full mb-5 group-hover:scale-110 transition-all duration-300">
                    {index === 0 && <Clock className="h-8 w-8 text-sky-600" />}
                    {index === 1 && (
                      <Shield className="h-8 w-8 text-rose-600" />
                    )}
                    {index === 2 && <Star className="h-8 w-8 text-amber-600" />}
                  </div>
                  <h3 className="font-bold text-xl mb-2 text-gray-800 group-hover:text-gray-900 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="py-20 px-4 text-center relative"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={containerVariants}
      >
        <div className="absolute inset-0 -m-8 bg-gradient-to-br from-teal-600/10 via-orange-600/10 to-amber-600/10 rounded-3xl backdrop-blur-sm border border-white/40" />
        <div className="max-w-3xl mx-auto relative">
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

      <footer className="text-center py-6 text-gray-500 text-sm bg-white/50 backdrop-blur-sm">
        {dict.footer.copyright.replace(
          '{{year}}',
          new Date().getFullYear().toString()
        )}
      </footer>

      <style jsx global>{`
        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-3px) rotate(0.5deg);
          }
          75% {
            transform: translateY(3px) rotate(-0.5deg);
          }
        }
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.8;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.02);
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
