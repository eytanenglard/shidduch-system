// src/components/questionnaire/common/QuestionnaireCompletion.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Send,
  CheckCircle2,
  BookUser,
  Loader2,
  Trophy,
  Zap,
  Award,
  Star,
  Target,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { QuestionnaireCompletionDict } from '@/types/dictionary';

interface QuestionnaireCompletionProps {
  onSendToMatching: () => void;
  isLoading?: boolean;
  isLoggedIn?: boolean;
  dict: QuestionnaireCompletionDict;
  // סטטיסטיקות אופציונליות
  totalQuestions?: number;
  answeredQuestions?: number;
  timeSpentMinutes?: number;
  worldsCompleted?: number;
  locale?: 'he' | 'en';
}

// Confetti Component
const Confetti: React.FC = () => {
  const confettiColors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-orange-500',
    'bg-cyan-500',
  ];

  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    rotation: Math.random() * 360,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confettiPieces.map((piece) => (
        <motion.div
          key={piece.id}
          className={cn('absolute w-3 h-3 rounded-sm', piece.color)}
          initial={{
            top: '-5%',
            left: `${piece.left}%`,
            rotate: 0,
            opacity: 1,
          }}
          animate={{
            top: '105%',
            rotate: piece.rotation * 3,
            opacity: 0,
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: 'easeIn',
          }}
        />
      ))}
    </div>
  );
};

// Achievement Badge Component
const AchievementBadge: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}> = ({ icon, title, description, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.5, type: 'spring', stiffness: 200 }}
      className="flex items-start gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border-2 border-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
    >
      <div className="flex-shrink-0 p-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-800 text-sm">{title}</h4>
        <p className="text-xs text-gray-600 mt-0.5">{description}</p>
      </div>
    </motion.div>
  );
};

// Stats Card Component
const StatsCard: React.FC<{
  icon: React.ReactNode;
  value: string | number;
  label: string;
  gradient: string;
  delay: number;
}> = ({ icon, value, label, gradient, delay }) => {
  const [count, setCount] = useState(0);
  const finalValue = typeof value === 'number' ? value : parseInt(value) || 0;

  useEffect(() => {
    if (typeof value === 'number') {
      let start = 0;
      const duration = 2000;
      const increment = finalValue / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= finalValue) {
          setCount(finalValue);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }
  }, [value, finalValue]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, type: 'spring' }}
      whileHover={{ y: -8, scale: 1.05 }}
      className="relative overflow-hidden"
    >
      <div
        className={cn(
          'relative p-6 rounded-3xl bg-gradient-to-br',
          gradient,
          'text-white shadow-2xl border-2 border-white/20'
        )}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full blur-xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              {icon}
            </div>
          </div>
          <div className="text-4xl font-bold mb-1">
            {typeof value === 'number' ? count : value}
          </div>
          <div className="text-sm font-medium text-white/90">{label}</div>
        </div>
      </div>
    </motion.div>
  );
};

const QuestionnaireCompletion: React.FC<QuestionnaireCompletionProps> = ({
  onSendToMatching,
  isLoading = false,
  isLoggedIn = false,
  dict,
  totalQuestions = 0,
  answeredQuestions = 0,
  timeSpentMinutes = 0,
  locale = 'he',
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const isRTL = locale === 'he';

  useEffect(() => {
    // Show confetti immediately
    setShowConfetti(true);
    // Show content after a brief delay
    setTimeout(() => setShowContent(true), 300);
    // Hide confetti after 4 seconds
    setTimeout(() => setShowConfetti(false), 4000);
  }, []);

  const completionPercentage = totalQuestions
    ? Math.round((answeredQuestions / totalQuestions) * 100)
    : 100;

  const achievements = [
    {
      icon: <CheckCircle2 className="w-5 h-5" />,
      title: dict.achievements.completed.title,
      description: dict.achievements.completed.description,
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: dict.achievements.speed.title,
      description: dict.achievements.speed.description.replace(
        '{{minutes}}',
        timeSpentMinutes.toString()
      ),
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: dict.achievements.profile.title,
      description: dict.achievements.profile.description,
    },
  ];

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Background Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 -z-10" />

      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-cyan-200 to-blue-300 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-pink-200 to-rose-300 rounded-full blur-3xl"
        />
      </div>

      {/* Confetti */}
      <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>

      {/* Main Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        <AnimatePresence>
          {showContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Hero Section */}
              <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, type: 'spring', stiffness: 100 }}
                className="text-center space-y-6"
              >
                {/* Trophy Icon with Pulse */}
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: 'reverse',
                  }}
                  className="inline-block"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full blur-xl opacity-50" />
                    <div className="relative p-8 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-full shadow-2xl">
                      <Trophy
                        className="w-20 h-20 text-white"
                        strokeWidth={2.5}
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Title */}
                <div className="space-y-3">
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600"
                  >
                    {dict.title}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="text-xl md:text-2xl text-gray-700 font-medium max-w-2xl mx-auto leading-relaxed"
                  >
                    {isLoggedIn
                      ? dict.loggedInDescription
                      : dict.guestDescription}
                  </motion.p>
                </div>
              </motion.div>

              {/* Stats Grid */}
              {totalQuestions > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatsCard
                    icon={<Star className="w-6 h-6" />}
                    value={completionPercentage}
                    label={dict.stats.completion}
                    gradient="from-purple-500 via-pink-500 to-rose-500"
                    delay={0.7}
                  />
                  <StatsCard
                    icon={<CheckCircle2 className="w-6 h-6" />}
                    value={answeredQuestions}
                    label={dict.stats.answered}
                    gradient="from-cyan-500 via-blue-500 to-indigo-500"
                    delay={0.9}
                  />
                  <StatsCard
                    icon={<Clock className="w-6 h-6" />}
                    value={`${timeSpentMinutes}'`}
                    label={dict.stats.time}
                    gradient="from-emerald-500 via-teal-500 to-green-500"
                    delay={1.1}
                  />
                </div>
              )}

              {/* Achievements Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3, duration: 0.6 }}
                className="bg-white/40 backdrop-blur-md rounded-3xl p-8 border-2 border-white shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {dict.unlocksTitle}
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {achievements.map((achievement, index) => (
                    <AchievementBadge
                      key={index}
                      {...achievement}
                      delay={1.5 + index * 0.2}
                    />
                  ))}
                </div>
              </motion.div>

              {/* CTA Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.1, duration: 0.6 }}
                className="bg-white/60 backdrop-blur-lg rounded-3xl p-8 md:p-10 border-2 border-white shadow-2xl"
              >
                {isLoggedIn ? (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <p className="text-lg font-semibold text-gray-800">
                        {dict.loggedInContent.prompt}
                      </p>
                      <p className="text-gray-600">
                        {dict.loggedInContent.promptSubtitle}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                      <Button
                        onClick={onSendToMatching}
                        disabled={isLoading}
                        size="lg"
                        className={cn(
                          'flex-1 h-14 text-lg font-bold rounded-2xl shadow-xl transition-all duration-300',
                          'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600',
                          'hover:from-purple-700 hover:via-pink-700 hover:to-rose-700',
                          'hover:shadow-2xl hover:scale-105',
                          'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="mr-2">
                              {dict.loggedInContent.sendingButton}
                            </span>
                          </>
                        ) : (
                          <>
                            <Send className="w-6 h-6" />
                            <span className="mr-2">
                              {dict.loggedInContent.sendButton}
                            </span>
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </Button>

                      <Link
                        href="/profile?tab=questionnaire"
                        className="flex-1"
                      >
                        <Button
                          variant="outline"
                          size="lg"
                          disabled={isLoading}
                          className="w-full h-14 text-lg font-semibold rounded-2xl border-2 bg-white hover:bg-gray-50 transition-all duration-300 hover:scale-105"
                        >
                          <BookUser className="w-6 h-6 text-blue-600" />
                          <span className="mr-2">
                            {dict.loggedInContent.reviewButton}
                          </span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-md mx-auto text-center space-y-6">
                    <p className="text-lg text-gray-700">
                      {isRTL
                        ? 'כדי להמשיך ולקבל התאמות, אנא התחבר לחשבון שלך'
                        : 'To continue and receive matches, please log in to your account'}
                    </p>
                    <Button
                      onClick={onSendToMatching}
                      size="lg"
                      className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 hover:scale-105"
                    >
                      <span className="mr-2">
                        {dict.guestContent.loginButton}
                      </span>
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </div>
                )}
              </motion.div>

              {/* Decorative Elements */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5, duration: 1 }}
                className="flex justify-center gap-4 text-4xl"
              >
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🎊
                </motion.span>
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ❤️
                </motion.span>
                <motion.span
                  animate={{ rotate: [0, -15, 15, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🎉
                </motion.span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -100% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
};

export default QuestionnaireCompletion;