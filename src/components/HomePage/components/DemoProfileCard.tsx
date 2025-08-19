// src/components/HomePage/components/DemoProfileCard.tsx

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Heart,
  Sparkles,
  BookOpen,
  Target,
  ChevronLeft,
  ChevronRight,
  Quote,
  MapPin,
  Briefcase,
  Star,
  ArrowLeft,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// --- Demo Data (ללא שינוי) ---
const DEMO_PROFILE = {
  firstName: 'נועה',
  age: 29,
  city: 'תל אביב',
  occupation: 'מעצבת UX/UI',
  religiousLevel: 'דתיה ליברלית',
  about:
    'אופטימית וחובבת שיחות עומק על כוס קפה. מוצאת יופי בדברים הקטנים של החיים, בין אם זה טיול בטבע או פלייליסט טוב. אחרי כמה ניסיונות שלא צלחו, אני יודעת היום טוב יותר מה נכון לי, ומחפשת שותף לדרך, לבנות יחד בית שמלא בצחוק, כבוד הדדי וצמיחה משותפת.',
};

const DEMO_IMAGES = [
  {
    id: '1',
    url: 'https://images.pexels.com/photos/3771836/pexels-photo-3771836.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    isMain: true,
  },
  {
    id: '2',
    url: 'https://images.pexels.com/photos/3775164/pexels-photo-3775164.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  },
  {
    id: '3',
    url: 'https://images.pexels.com/photos/3771045/pexels-photo-3771045.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  },
  {
    id: '4',
    url: 'https://images.pexels.com/photos/1758531/pexels-photo-1758531.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  },
  {
    id: '5',
    url: 'https://images.pexels.com/photos/4009409/pexels-photo-4009409.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  },
  {
    id: '6',
    url: 'https://images.pexels.com/photos/718978/pexels-photo-718978.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  },
];

const DEMO_QA = [
  {
    question: 'מה הערך החשוב ביותר שתרצי להנחיל בבית שתקימי?',
    answer:
      'כבוד הדדי. היכולת להקשיב באמת, גם כשלא מסכימים, וליצור מרחב בטוח שבו שנינו יכולים להיות הגרסה הכי אותנטית של עצמנו.',
  },
  {
    question: 'איך את רואה את חלוקת התפקידים בזוגיות מודרנית?',
    answer:
      "אני מאמינה בשותפות מלאה. לא 'תפקידים' קבועים, אלא צוות שפועל יחד. יום אחד אני אהיה החזקה כשהוא צריך תמיכה, ויום אחר הוא יהיה שם בשבילי. הכל בתקשורת וגמישות.",
  },
];

const TABS = [
  { id: 'essence', label: 'המהות', icon: Sparkles },
  { id: 'story', label: 'התשובות', icon: BookOpen },
  { id: 'vision', label: 'החזון', icon: Target },
];

const QandAItem: React.FC<{ q: string; a: string }> = ({ q, a }) => (
  <div className="bg-white/70 p-4 rounded-xl shadow-inner border border-purple-100/50">
    <h4 className="font-bold text-purple-800 mb-2">{q}</h4>
    <p className="text-gray-700 leading-relaxed italic">“{a}”</p>
  </div>
);

// --- Main Component ---
export const DemoProfileCard = () => {
  const [activeTab, setActiveTab] = useState('essence');
  const [mainImageIndex, setMainImageIndex] = useState(0);

  const handleImageNav = (direction: 'next' | 'prev') => {
    setMainImageIndex((prevIndex) => {
      if (direction === 'next') {
        return (prevIndex + 1) % DEMO_IMAGES.length;
      } else {
        return (prevIndex - 1 + DEMO_IMAGES.length) % DEMO_IMAGES.length;
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="w-full max-w-4xl mx-auto bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 rounded-3xl shadow-2xl p-4 sm:p-6 border border-white"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Image Gallery */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg group">
            <AnimatePresence initial={false}>
              <motion.div
                key={mainImageIndex}
                className="absolute inset-0"
                initial={{ opacity: 0.5, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              >
                <Image
                  src={DEMO_IMAGES[mainImageIndex].url}
                  alt={`תמונה של ${DEMO_PROFILE.firstName}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1/2 -translate-y-1/2 left-2 sm:left-4 bg-white/20 text-white backdrop-blur-sm rounded-full hover:bg-white/30"
              onClick={() => handleImageNav('prev')}
              // <<< שינוי נגישות: הוספת תווית ברורה לכפתור אייקון >>>
              aria-label="התמונה הקודמת"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1/2 -translate-y-1/2 right-2 sm:right-4 bg-white/20 text-white backdrop-blur-sm rounded-full hover:bg-white/30"
              onClick={() => handleImageNav('next')}
              // <<< שינוי נגישות: הוספת תווית ברורה לכפתור אייקון >>>
              aria-label="התמונה הבאה"
            >
              <ChevronRight />
            </Button>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {DEMO_IMAGES.map((image, index) => (
              <button
                key={image.id}
                className={cn(
                  'aspect-square rounded-lg overflow-hidden relative transition-all duration-300 transform hover:scale-105',
                  mainImageIndex === index
                    ? 'ring-2 ring-offset-2 ring-purple-500 shadow-md'
                    : 'opacity-60 hover:opacity-100'
                )}
                onClick={() => setMainImageIndex(index)}
                // <<< שינוי נגישות: הוספת תווית ברורה לכפתור תמונה >>>
                aria-label={`הצג תמונה מספר ${index + 1}`}
              >
                <Image
                  src={image.url}
                  alt={`תמונה קטנה ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Profile Info */}
        <div className="bg-white/70 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-white flex flex-col">
          {/* Header */}
          <div className="text-center mb-4">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-800">
              {DEMO_PROFILE.firstName}, {DEMO_PROFILE.age}
            </h3>
            <div className="flex items-center justify-center gap-4 mt-2 text-gray-600">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-cyan-600" />
                <span>{DEMO_PROFILE.city}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-purple-600" />
                <span>{DEMO_PROFILE.occupation}</span>
              </div>
            </div>
          </div>

          {/* <<< שינוי נגישות: הוספת תכונות ARIA למערכת הטאבים >>> */}
          <div
            className="mb-4 bg-purple-100/50 p-1 rounded-full grid grid-cols-3 gap-1"
            role="tablist"
            aria-label="ניווט בפרופיל הדמו"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative w-full rounded-full py-2 text-sm font-semibold transition-colors duration-300',
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-purple-700 hover:bg-white/50'
                )}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="demo-profile-active-tab"
                    className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-1.5">
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </span>
              </button>
            ))}
          </div>

          {/* <<< שינוי נגישות: הוספת תכונות ARIA לפאנלי התוכן >>> */}
          <div className="flex-grow min-h-[250px]">
            <AnimatePresence mode="wait">
              {activeTab === 'essence' && (
                <motion.div
                  key="essence"
                  role="tabpanel"
                  id="panel-essence"
                  aria-labelledby="tab-essence"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="space-y-4"
                >
                  <div className="relative bg-white/60 p-4 rounded-xl shadow-inner border border-purple-100/50">
                    <Quote className="absolute top-2 right-2 w-8 h-8 text-purple-200/50 transform scale-x-[-1]" />
                    <p className="text-lg text-purple-900 italic font-medium leading-relaxed">
                      {DEMO_PROFILE.about}
                    </p>
                  </div>
                  <Badge className="bg-gradient-to-r from-teal-400 to-cyan-500 text-white border-0 shadow-lg px-3 py-1.5 text-sm font-bold flex items-center gap-1.5">
                    <Star className="w-4 h-4" />
                    <span>{DEMO_PROFILE.religiousLevel}</span>
                  </Badge>
                </motion.div>
              )}
              {activeTab === 'story' && (
                <motion.div
                  key="story"
                  role="tabpanel"
                  id="panel-story"
                  aria-labelledby="tab-story"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="space-y-4"
                >
                  {DEMO_QA.map((item, index) => (
                    <QandAItem key={index} q={item.question} a={item.answer} />
                  ))}
                </motion.div>
              )}
              {activeTab === 'vision' && (
                <motion.div
                  key="vision"
                  role="tabpanel"
                  id="panel-vision"
                  aria-labelledby="tab-vision"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="space-y-4"
                >
                  <QandAItem
                    q="איך אני רואה את בן/בת הזוג שלי?"
                    a="אדם עם לב פתוח, חוש הומור, ורצון אמיתי לצמוח יחד. מישהו שהוא גם החבר הכי טוב וגם השותף למסע."
                  />
                  <QandAItem
                    q="מה החזון שלי למשפחה?"
                    a="בית חם ותוסס, פתוח לאורחים, שבו ילדים גדלים עם ערכים של נתינה, אהבת תורה וארץ ישראל."
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CTA */}
          <div className="mt-auto pt-4 text-center">
            <Link href="/auth/register">
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <span className="relative z-10 flex items-center justify-center">
                  רוצים לקבל הצעות כאלה?
                  <ArrowLeft className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
