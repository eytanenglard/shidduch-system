// src/components/HomePage/sections/NeshmaInsightSectionB.tsx

'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Heart,
  Target,
  FileText,
  User,
  CheckCheck,
  Lightbulb,
  ArrowLeft,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { getRelativeCloudinaryPath } from '@/lib/utils';

import Image from 'next/image'; // ← נוסף

// הגדרת טיפוסים פנימיים לרכיב
interface Message {
  id: number;
  text: string;
  sender: 'friend' | 'user';
  timestamp: string;
  isEureka?: boolean;
  typingDelay?: number;
}

interface NeshmaInsightProps {
  locale: 'he' | 'en';
}

// הרכיב המלא עם כל השיפורים והתיקונים
export default function NeshmaInsightSectionB({ locale }: NeshmaInsightProps) {
  const ref = useRef(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  const isHebrew = locale === 'he';
  const direction = isHebrew ? 'rtl' : 'ltr';

  // ניהול מצב (State) של הרכיב
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingSender, setTypingSender] = useState<'friend' | 'user' | null>(
    null
  );
  const [showPhone, setShowPhone] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showTransitionText, setShowTransitionText] = useState(false);
  const [showTransitionCTA, setShowTransitionCTA] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  const [finalMessageRead, setFinalMessageRead] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  // ▼▼▼ 1. הוספת state חדש לשליטה בכותרת המעבר ▼▼▼
  const [showPostConversationTransition, setShowPostConversationTransition] =
    useState(false);
  // ▲▲▲ סוף ההוספה ▲▲▲

  const t = {
    badge: 'שיחה אמיתית. תוצאות אמיתיות.',
    title: {
      part1: '"אז מה אתה',
      highlight: 'באמת מחפש',
      part2: '?"',
    },
    subtitle: 'הבעיה המוכרת שגורמת לבזבוז זמן יקר - והפתרון שיקצר לכם את הדרך.',
    chatHeader: {
      name: 'דניאל, החבר שלך מהעבודה',
      status: 'פעיל עכשיו',
    },
    conversation: [
      {
        sender: 'user',
        text: 'היה לי עוד דייט... שוב לא הוביל לשום מקום 😞',
        typingDelay: 1200,
      },
      { sender: 'friend', text: 'אוף. מה קרה?', typingDelay: 800 },
      {
        sender: 'user',
        text: 'לא יודע... היא נחמדה והכל, אבל משהו פשוט לא "זה".',
        typingDelay: 1500,
      },
      {
        sender: 'friend',
        text: 'אז מה זה "זה" הזה שאתה מחפש? 🎯',
        typingDelay: 1000,
      },
      {
        sender: 'user',
        text: 'שאלה טובה... מישהי עם ערכים טובים? שיהיה כיף איתה? אני לא באמת יודע להגדיר 😅',
        typingDelay: 2000,
      },
      {
        sender: 'friend',
        text: 'בדיוק! זו הבעיה. איך תדע שמצאת אם אתה לא יודע מה אתה מחפש?',
        isEureka: true,
        typingDelay: 1800,
      },
      { sender: 'user', text: 'וואו. נכון. אז מה הפתרון?', typingDelay: 1000 },
      {
        sender: 'friend',
        text: 'שמע, NeshamaTech בנו שאלון עומק שמייצר לך בסוף "דוח נשמה" אישי. זה מסמך PDF שאתה מקבל, כמו מפת דרכים לעצמך ולזוגיות שאתה רוצה.',
        typingDelay: 2500,
      },
      {
        sender: 'user',
        text: 'נשמע רציני. זה בטח לוקח שעות.',
        typingDelay: 1000,
      },
      {
        sender: 'friend',
        text: 'ממש לא, 20-30 דקות. חבר שלי אמר שזה חסך לו חודשים של דייטים לא רלוונטיים.',
        typingDelay: 1800,
      },
      {
        sender: 'user',
        text: 'אוקיי, שכנעת אותי. איפה מתחילים? 💪',
        typingDelay: 1200,
      },
    ],
    insights: {
      title: 'איך 20 דקות של מיקוד יכולות לשנות את כל התמונה?',
      items: [
        {
          title: 'גילוי עצמי',
          description:
            "קבלו 'דוח נשמה' אישי שמזקק את הערכים והצרכים האמיתיים שלכם.",
        },
        {
          title: 'חיפוש ממוקד',
          description: "תפסיקו לבזבז אנרגיה על דייטים שנגמרים ב'זה לא זה'.",
        },
        {
          title: 'בטחון ובהירות',
          description: 'תגיעו לדייט הבא כשאתם יודעים בדיוק מה אתם מביאים לקשר.',
        },
      ],
    },
    transitionText: 'רגע... זה בדיוק מה שקורה אצלך עכשיו, נכון? 🤔',
    transitionCTA: 'אז מה עושים עם התובנות האלה? 👇',
    cta: {
      button: 'אני רוצה לקבל את דוח הנשמה שלי',
      subtitle: 'התחילו עכשיו וגלו את הדרך לזוגיות שתמיד רציתם.',
    },
    placeholder: 'הודעה...',
    progressLabels: ['התחלה', 'השאלה', 'ההארה', 'הפתרון', 'הסיום'],
  };
  const conversation = t.conversation;

  const insightDetails = [
    {
      icon: Heart,
      gradient: 'from-rose-400 to-pink-500',
      ...t.insights.items[0],
    },
    {
      icon: Target,
      gradient: 'from-emerald-400 to-teal-500',
      ...t.insights.items[1],
    },
    {
      icon: Zap,
      gradient: 'from-amber-400 to-orange-500',
      ...t.insights.items[2],
    },
  ];

  useEffect(() => {
    if (isInView && !showPhone) {
      setTimeout(() => setShowPhone(true), 500);
      setTimeout(() => playConversation(0), 1500);
    }
  }, [isInView]);

  const playConversation = (index: number) => {
    if (index >= conversation.length) {
      setIsTyping(false);
      setTimeout(() => setFinalMessageRead(true), 500);
      setTimeout(() => setShowTransitionText(true), 1000);
      setTimeout(() => setShowInsights(true), 2500);
      setTimeout(() => setShowTransitionCTA(true), 3500);
      setTimeout(() => setShowCTA(true), 4500);
      // ▼▼▼ 2. הפעלת האנימציה של כותרת המעבר בסוף התהליך ▼▼▼
      setTimeout(() => setShowPostConversationTransition(true), 5500);
      // ▲▲▲ סוף ההוספה ▲▲▲
      setProgressStep(5);
      return;
    }

    const currentMessage = conversation[index];
    const sender = currentMessage.sender as 'friend' | 'user';

    if (index === 0) setProgressStep(1);
    if (index === 3) setProgressStep(2);
    if (index === 5) setProgressStep(3);
    if (index === 8) setProgressStep(4);

    setIsTyping(true);
    setTypingSender(sender);

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
        sender: currentMessage.sender as 'friend' | 'user', // <-- זה התיקון
        isEureka: currentMessage.isEureka,
        typingDelay: currentMessage.typingDelay,
        timestamp: new Date().toLocaleTimeString('he-IL', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setMessages((prev) => [...prev, newMessage]);

      const pauseBeforeNext = currentMessage.isEureka ? 1200 : 600;
      setTimeout(() => playConversation(index + 1), pauseBeforeNext);
    }, typingDuration);
  };

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
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
    },
  };
  const typingVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.1 } },
  };

  return (
    <motion.section
      ref={ref}
      className="relative py-20 md:py-32 bg-gradient-to-br from-slate-50 via-purple-50/30 to-rose-50/40 overflow-hidden"
      dir={direction}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-purple-200/20 to-pink-200/10 rounded-full blur-3xl animate-float-slow"></div>
        <div
          className="absolute bottom-40 right-10 w-96 h-96 bg-gradient-to-br from-cyan-200/15 to-blue-200/10 rounded-full blur-3xl animate-float-slow"
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-br from-rose-200/15 to-orange-200/10 rounded-full blur-3xl animate-float-slow"
          style={{ animationDelay: '4s' }}
        ></div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl relative">
        {/* ... (כל הקוד הקיים של הכותרות, הטלפון והתובנות נשאר כאן ללא שינוי) ... */}

        {/* ======================================================= */}
        {/* כאן נמצא כל הקוד של הכותרות, הטלפון, התובנות וה-CTA      */}
        {/* שהיה קיים בקובץ המקורי. הוא לא השתנה.                   */}
        {/* ======================================================= */}
        <motion.div className="flex justify-center mb-10" variants={fadeInUp}>
          <div className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-md rounded-full px-8 py-4 shadow-lg border border-purple-100">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <span className="text-purple-700 font-bold text-lg">{t.badge}</span>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 leading-tight mb-6">
            {t.title.part1}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500">
              {t.title.highlight}
            </span>
            {t.title.part2}
          </h2>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t.subtitle}
          </p>
        </motion.div>

        <AnimatePresence>
          {showPhone && (
            <motion.div
              variants={phoneVariants}
              initial="hidden"
              animate="visible"
              className="max-w-md mx-auto mb-20"
            >
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-rose-400/20 rounded-[2.9rem] blur-xl"></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-[2.5rem] p-1.5 border border-purple-100 shadow-2xl transition-transform duration-500 group-hover:-rotate-1">
                  <div className="bg-white rounded-[2rem] overflow-hidden">
                    <div className="px-4 pt-6 pb-3 relative z-10 flex items-center gap-3 border-b border-purple-100/60">
                      <div className="relative">
                        {/* ▼▼▼ כאן השינוי ▼▼▼ */}
                        <div className="relative w-10 h-10 rounded-full shadow-md overflow-hidden">
                          <Image
src={getRelativeCloudinaryPath('https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753967649/IMG-20250731-WA0059_mqskdw.jpg')}                            alt={t.chatHeader.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        {/* ▲▲▲ סוף השינוי ▲▲▲ */}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                      </div>
                      <div>
                        <h3 className="text-gray-800 font-bold text-sm">
                          {t.chatHeader.name}
                        </h3>
                        <p className="text-gray-500 text-xs">
                          {t.chatHeader.status}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 py-2 bg-purple-50/50 border-b border-purple-100/40">
                      <div className="flex items-center justify-between gap-1">
                        {[0, 1, 2, 3, 4, 5].map((step) => (
                          <div
                            key={step}
                            className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                              progressStep > step
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div
                      aria-live="polite"
                      className="h-[450px] md:h-[500px] overflow-y-auto p-4 bg-gradient-to-br from-purple-50/20 to-rose-50/20"
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
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-lg'
                                    : `bg-white text-gray-800 border border-gray-100 rounded-bl-lg ${
                                        message.isEureka
                                          ? 'border-amber-400/80 ring-4 ring-amber-400/10 animate-pulse-glow'
                                          : ''
                                      }`
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
                                {message.sender === 'friend' && (
                                  <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
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
                              <motion.div
                                className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                                animate={{ y: [0, -3, 0] }}
                                transition={{
                                  duration: 0.9,
                                  repeat: Infinity,
                                  delay: 0,
                                }}
                              />
                              <motion.div
                                className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                                animate={{ y: [0, -3, 0] }}
                                transition={{
                                  duration: 0.9,
                                  repeat: Infinity,
                                  delay: 0.2,
                                }}
                              />
                              <motion.div
                                className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                                animate={{ y: [0, -3, 0] }}
                                transition={{
                                  duration: 0.9,
                                  repeat: Infinity,
                                  delay: 0.4,
                                }}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="border-t border-gray-200/80 bg-gray-50/50 p-3">
                      <div className="bg-gray-100 rounded-full px-4 py-2 text-gray-400 text-sm cursor-not-allowed text-center">
                        {t.placeholder}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                  {t.transitionText}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                {t.insights.title}
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
                      rotateY: 5,
                      transition: { duration: 0.3 },
                    }}
                    className="group perspective-1000"
                  >
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl hover:border-purple-200 transition-all duration-300 h-full relative overflow-hidden">
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

        <AnimatePresence>
          {showTransitionCTA && !showCTA && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full px-6 py-3 shadow-md">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <p className="text-lg font-semibold text-gray-800">
                  {t.transitionCTA}
                </p>
              </div>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="mt-4"
              >
                <ArrowLeft
                  className={`w-8 h-8 text-purple-500 mx-auto ${isHebrew ? '' : 'rotate-180'}`}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
                  whileTap={{ scale: 0.98 }}
                  className="group relative inline-flex items-center gap-4 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:via-pink-700 hover:to-rose-700 text-white font-bold py-5 px-12 md:px-16 rounded-full text-xl md:text-2xl shadow-2xl hover:shadow-3xl transition-all duration-300"
                >
                  <FileText className="w-7 h-7 group-hover:rotate-6 transition-transform" />
                  <span>{t.cta.button}</span>
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
                {t.cta.subtitle}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ▼▼▼ 3. הוספת בלוק ה-JSX של כותרת המעבר ▼▼▼ */}
      <AnimatePresence>
        {showPostConversationTransition && (
          <motion.div
            className="text-center max-w-3xl mx-auto mt-16 md:mt-24 px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h3 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight">
              אז איך מתחילים לענות על השאלה &quot;מה אני באמת מחפש/ת&quot;?
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                בנינו עבורך מסע לגילוי עצמי.
              </span>
            </h3>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ▲▲▲ סוף ההוספה ▲▲▲ */}

      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(0) translateX(20px); }
          75% { transform: translateY(20px) translateX(10px); }
        }
        .animate-float-slow { animation: float-slow 20s ease-in-out infinite; }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 5px rgba(251, 191, 36, 0.3); }
          50% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.6); }
        }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        
        .perspective-1000 { perspective: 1000px; }
      `}</style>
    </motion.section>
  );
}