// src/components/HomePage/sections/NeshmaInsightSectionB.tsx

'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Heart,
  Target,
  FileText,
  CheckCheck,
  Lightbulb,
  ArrowLeft,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { getRelativeCloudinaryPath } from '@/lib/utils';
import type { NeshmaInsightDict } from '@/types/dictionary';

// --- Type Definitions ---
interface Message {
  id: number;
  text: string;
  sender: 'friend' | 'user';
  timestamp: string;
  isEureka?: boolean;
}

interface NeshmaInsightProps {
  locale: 'he' | 'en';
  dict: NeshmaInsightDict;
}
// --- End: Type Definitions ---

export default function NeshmaInsightSectionB({
  locale,
  dict,
}: NeshmaInsightProps) {
  const ref = useRef(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  const isHebrew = locale === 'he';
  const direction = isHebrew ? 'rtl' : 'ltr';

  // --- State Management ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showTransitionText, setShowTransitionText] = useState(false);
  const [showTransitionCTA, setShowTransitionCTA] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [showPostConversationTransition, setShowPostConversationTransition] =
    useState(false);

  // --- Memoized Data from Dictionary ---
  const conversation = useMemo(() => {
    const logic = [
      { typingDelay: 1200 },
      { typingDelay: 800 },
      { typingDelay: 1500 },
      { typingDelay: 1000 },
      { typingDelay: 2000 },
      { isEureka: true, typingDelay: 1800 },
      { typingDelay: 1000 },
      { typingDelay: 2500 },
      { typingDelay: 1000 },
      { typingDelay: 1800 },
      { typingDelay: 1200 },
    ];
    return dict.conversation.map((msg, index) => ({
      ...msg,
      ...logic[index],
    }));
  }, [dict.conversation]);

  const insightDetails = useMemo(
    () => [
      {
        icon: Heart,
        // Rose palette (Match Hero)
        gradient: 'from-rose-400 via-pink-500 to-red-500',
        ...dict.insights.items[0],
      },
      {
        icon: Target,
        // Teal palette (Match Hero)
        gradient: 'from-teal-400 via-teal-500 to-emerald-500',
        ...dict.insights.items[1],
      },
      {
        icon: Zap,
        // Orange/Amber palette (Match Hero)
        gradient: 'from-orange-400 via-amber-500 to-yellow-500',
        ...dict.insights.items[2],
      },
    ],
    [dict.insights.items]
  );

  // --- Animation Logic ---
  useEffect(() => {
    const playConversation = (index: number) => {
      if (index >= conversation.length) {
        setIsTyping(false);
        // מיד אחרי סיום השיחה - הכותרת והמעבר מופיעים
        setTimeout(() => setShowTransitionText(true), 300);
        setTimeout(() => setShowPostConversationTransition(true), 300);
        setTimeout(() => setShowInsights(true), 1000);
        setTimeout(() => setShowTransitionCTA(true), 1700);
        setTimeout(() => setShowCTA(true), 2500);
        setProgressStep(5);
        return;
      }

      const currentMessage = conversation[index];

      if (index === 0) setProgressStep(1);
      if (index === 3) setProgressStep(2);
      if (index === 5) setProgressStep(3);
      if (index === 8) setProgressStep(4);

      setIsTyping(true);

      const baseTypingDuration =
        currentMessage.typingDelay ||
        Math.max(currentMessage.text.length * 40, 1000);
      const typingDuration = currentMessage.isEureka
        ? baseTypingDuration * 1.5
        : baseTypingDuration;

      setTimeout(() => {
        setIsTyping(false);
        const newMessage: Message = {
          id: Date.now() + index,
          text: currentMessage.text,
          sender: currentMessage.sender,
          isEureka: currentMessage.isEureka,
          timestamp: new Date().toLocaleTimeString(
            locale === 'he' ? 'he-IL' : 'en-US',
            {
              hour: '2-digit',
              minute: '2-digit',
            }
          ),
        };
        setMessages((prev) => [...prev, newMessage]);

        const pauseBeforeNext = currentMessage.isEureka ? 1200 : 600;
        setTimeout(() => playConversation(index + 1), pauseBeforeNext);
      }, typingDuration);
    };

    if (isInView && !showPhone) {
      setTimeout(() => setShowPhone(true), 500);
      setTimeout(() => playConversation(0), 1500);
    }
  }, [isInView, showPhone, conversation, locale]);

  // Auto-scroll logic - גלילה רק בתוך אזור ההודעות
  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        150;

      if (isNearBottom) {
        requestAnimationFrame(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTo({
              top: messagesContainerRef.current.scrollHeight,
              behavior: 'smooth',
            });
          }
        });
      }
    }
  }, [messages, isTyping]);

  // --- Animation Variants ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };
  const phoneVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 30 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.7, ease: 'easeOut' },
    },
  };
  const messageVariants = {
    hidden: { opacity: 0, y: 8, scale: 0.99 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };
  const typingVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.1 } },
  };

  // --- Render ---
  return (
    <motion.section
      ref={ref}
      // Updated Background to match Hero (Slate -> Teal -> Orange)
      className="relative py-20 md:py-32 bg-gradient-to-b from-slate-50 via-teal-50/30 to-orange-50/20 overflow-hidden"
      dir={direction}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {/* Background Elements - Updated to match Hero Orbs (Teal, Orange, Rose) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-teal-200/20 to-emerald-200/10 rounded-full blur-3xl animate-float-slow"></div>
        <div
          className="absolute bottom-40 right-10 w-96 h-96 bg-gradient-to-br from-orange-200/15 to-amber-200/10 rounded-full blur-3xl animate-float-slow"
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-br from-rose-200/15 to-pink-200/10 rounded-full blur-3xl animate-float-slow"
          style={{ animationDelay: '4s' }}
        ></div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl relative">
        {/* Header */}
        <motion.div className="flex justify-center mb-10" variants={fadeInUp}>
          <div className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-md rounded-full px-8 py-4 shadow-lg border border-teal-100">
            <Sparkles className="w-6 h-6 text-teal-500" />
            <span className="text-teal-700 font-bold text-lg">
              {dict.badge}
            </span>
          </div>
        </motion.div>

        {/* Title - Updated Highlight Gradient to match Hero (Teal-Orange-Amber) */}
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 leading-tight mb-6">
            {dict.title.part1}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500">
              {dict.title.highlight}
            </span>
            {dict.title.part2}
          </h2>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {dict.subtitle}
          </p>
        </motion.div>

        {/* Phone Animation */}
        <AnimatePresence>
          {showPhone && (
            <motion.div
              variants={phoneVariants}
              initial="hidden"
              animate="visible"
              className="max-w-md mx-auto mb-20"
            >
              <div className="relative group">
                {/* Updated Glow to Match Hero's Palette */}
                <div className="absolute -inset-2 bg-gradient-to-r from-teal-400/20 via-orange-400/20 to-amber-400/20 rounded-[2.9rem] blur-xl"></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-[2.5rem] p-1.5 border border-teal-100 shadow-2xl transition-transform duration-500 group-hover:-rotate-1">
                  <div className="bg-white rounded-[2rem] overflow-hidden">
                    {/* Phone Header */}
                    <div className="px-4 pt-6 pb-3 relative z-10 flex items-center gap-3 border-b border-teal-100/60">
                      <div className="relative">
                        <div className="relative w-10 h-10 rounded-full shadow-md overflow-hidden">
                          <Image
                            src={getRelativeCloudinaryPath(
                              'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753967649/IMG-20250731-WA0059_mqskdw.jpg'
                            )}
                            alt={dict.chatHeader.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                      </div>
                      <div>
                        <h3 className="text-gray-800 font-bold text-sm">
                          {dict.chatHeader.name}
                        </h3>
                        <p className="text-gray-500 text-xs">
                          {dict.chatHeader.status}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar - Updated Gradient */}
                    <div className="px-4 py-2 bg-teal-50/50 border-b border-teal-100/40">
                      <div className="flex items-center justify-between gap-1">
                        {dict.progressLabels.map((_, step) => (
                          <div
                            key={step}
                            className={`flex-1 h-1 rounded-full transition-all duration-500 ${progressStep > step ? 'bg-gradient-to-r from-teal-500 to-amber-500' : 'bg-gray-200'}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Messages Area - גלילה משופרת */}
                    <div
                      ref={messagesContainerRef}
                      aria-live="polite"
                      className="messages-container h-[450px] md:h-[500px] overflow-y-auto p-4 bg-gradient-to-br from-teal-50/20 to-orange-50/20"
                    >
                      <AnimatePresence>
                        {messages.map((message) => (
                          <motion.div
                            key={message.id}
                            layout
                            variants={messageVariants}
                            initial="hidden"
                            animate="visible"
                            className={`flex items-end gap-2 mb-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`flex flex-col max-w-[80%] ${message.sender === 'user' ? 'items-end' : 'items-start'}`}
                            >
                              <div
                                className={`relative z-10 rounded-2xl px-4 py-2.5 shadow-md flex items-center gap-2 ${
                                  message.sender === 'user'
                                    ? 'bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 text-white rounded-br-lg' // Updated User Bubble
                                    : `bg-white text-gray-800 border border-gray-100 rounded-bl-lg ${message.isEureka ? 'border-amber-400/80 ring-4 ring-amber-400/10 animate-pulse-glow' : ''}`
                                }`}
                              >
                                {message.isEureka && (
                                  <motion.div
                                    animate={{
                                      scale: [1, 1.2, 1],
                                      rotate: [0, 10, -10, 0],
                                    }}
                                    transition={{
                                      duration: 0.6,
                                      repeat: 2,
                                      repeatDelay: 0.3,
                                    }}
                                  >
                                    <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0" />
                                  </motion.div>
                                )}
                                <p className="text-[15px] leading-relaxed">
                                  {message.text}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1.5 px-1">
                                <span className="text-[11px] text-gray-400">
                                  {message.timestamp}
                                </span>
                                {message.sender === 'user' && (
                                  <CheckCheck className="w-3.5 h-3.5 text-teal-500" />
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      <AnimatePresence>
                        {isTyping && (
                          <motion.div
                            layout
                            {...typingVariants}
                            className="flex items-end gap-2 mb-4 justify-start"
                          >
                            <div className="flex items-center gap-1.5 p-3 rounded-2xl shadow-md bg-white/80 border border-gray-200 rounded-bl-lg">
                              {[0, 0.2, 0.4].map((delay) => (
                                <motion.div
                                  key={delay}
                                  className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                                  animate={{ y: [0, -3, 0] }}
                                  transition={{
                                    duration: 0.9,
                                    repeat: Infinity,
                                    delay,
                                  }}
                                />
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div ref={messagesEndRef} className="h-4" />
                    </div>

                    {/* Input Area */}
                    <div className="border-t border-gray-200/80 bg-gray-50/50 p-3">
                      <div className="bg-gray-100 rounded-full px-4 py-2 text-gray-400 text-sm cursor-not-allowed text-center">
                        {dict.placeholder}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transition Text - מופיע מיד אחרי סיום השיחה */}
        <AnimatePresence>
          {showTransitionText && !showInsights && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center mb-12"
            >
              <div className="inline-block bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl px-8 py-4 shadow-lg border-2 border-amber-300">
                <p className="text-xl font-bold text-gray-800">
                  {dict.transitionText}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Insights Section */}
        <AnimatePresence>
          {showInsights && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-20"
            >
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
                {dict.insights.title}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {insightDetails.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.15 }}
                    whileHover={{
                      y: -8,
                      scale: 1.02,
                      transition: { duration: 0.3 },
                    }}
                    className="group"
                  >
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl hover:border-teal-200 transition-all duration-300 h-full relative overflow-hidden flex flex-col items-center text-center">
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                      />
                      <div
                        className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${item.gradient} text-white mb-6 shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative z-10`}
                      >
                        <item.icon className="w-8 h-8" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-800 mb-4 relative z-10">
                        {item.title}
                      </h4>
                      <p className="text-gray-600 leading-relaxed relative z-10">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transition CTA */}
        <AnimatePresence>
          {showTransitionCTA && !showCTA && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-teal-100 to-orange-100 rounded-full px-6 py-3 shadow-md">
                <TrendingUp className="w-5 h-5 text-teal-600" />
                <p className="text-lg font-semibold text-gray-800">
                  {dict.transitionCTA}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Final CTA */}
        <AnimatePresence>
          {showCTA && (
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <Link href={`/${locale}/questionnaire`}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  // Updated Gradient to match Hero CTA
                  className="group relative inline-flex items-center gap-4 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 text-white font-bold py-5 px-12 md:px-16 rounded-full text-xl md:text-2xl shadow-2xl hover:shadow-3xl transition-all duration-300"
                >
                  <FileText className="w-7 h-7 group-hover:rotate-6 transition-transform" />
                  <span>{dict.cta.button}</span>
                  <ArrowLeft
                    className={`w-6 h-6 group-hover:${isHebrew ? '-translate-x-1' : 'translate-x-1'} transition-transform ${isHebrew ? '' : 'rotate-180'}`}
                  />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000"></div>
                </motion.button>
              </Link>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-6 text-gray-600 text-lg italic"
              >
                {dict.cta.subtitle}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Post-Conversation Transition - מופיע מיד אחרי סיום השיחה */}
        <AnimatePresence>
          {showPostConversationTransition && (
            <motion.div
              className="text-center max-w-3xl mx-auto mt-16 md:mt-24 px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <h3 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight">
                {dict.postConversationTransition.line1}
                <br />
                {/* Updated Gradient to match Hero Text */}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-orange-500 to-amber-600">
                  {dict.postConversationTransition.line2}
                </span>
              </h3>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Styles - כולל גלילה משופרת */}
      <style>{`
        @keyframes float-slow { 0%, 100% { transform: translateY(0) translateX(0); } 25% { transform: translateY(-20px) translateX(10px); } 50% { transform: translateY(0) translateX(20px); } 75% { transform: translateY(20px) translateX(10px); } }
        .animate-float-slow { animation: float-slow 20s ease-in-out infinite; }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 5px rgba(251, 191, 36, 0.3); } 50% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.6); } }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        
        /* גלילה משופרת לאזור ההודעות */
        .messages-container {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
          touch-action: pan-y;
          scrollbar-width: thin;
          scrollbar-color: #14b8a6 rgba(243, 244, 246, 0.5);
        }
        
        .messages-container::-webkit-scrollbar {
          width: 8px;
        }
        .messages-container::-webkit-scrollbar-track {
          background: rgba(243, 244, 246, 0.5);
          border-radius: 10px;
          margin: 4px 0;
        }
        .messages-container::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #14b8a6, #f97316);
          border-radius: 10px;
          border: 2px solid rgba(243, 244, 246, 0.5);
        }
        .messages-container::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #0d9488, #ea580c);
        }
        .messages-container::-webkit-scrollbar-thumb:active {
          background: linear-gradient(to bottom, #0f766e, #c2410c);
        }
      `}</style>
    </motion.section>
  );
}
