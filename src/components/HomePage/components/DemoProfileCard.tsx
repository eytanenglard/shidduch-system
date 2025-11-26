// src/components/HomePage/components/DemoProfileCard.tsx

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Sparkles,
  BookOpen,
  Target,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
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
  // Updated colors to Teal/Orange theme
  <div className="bg-white/60 p-4 rounded-xl shadow-sm border border-orange-100">
    <h4 className="font-bold text-teal-800 mb-2">{q}</h4>
    <p className="text-gray-700 leading-relaxed italic">“{a}”</p>
  </div>
);

// --- Main Component ---
export const DemoProfileCard = ({ locale }: { locale: 'he' | 'en' }) => {
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
      // Updated container background
      className="w-full max-w-4xl mx-auto bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl p-4 sm:p-6 border border-white/60 relative overflow-hidden"
    >
      {/* Background Gradient Blob */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-teal-100/50 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-100/50 rounded-full blur-3xl -z-10" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1/2 -translate-y-1/2 left-2 sm:left-4 bg-black/20 text-white backdrop-blur-sm rounded-full hover:bg-black/40"
              onPointerDown={() => handleImageNav('prev')}
              aria-label="התמונה הקודמת"
            >
              <ChevronLeft />
            </Button>
            {/* Note: Previous code had duplicate Next button with left arrow, fixing to just one Next button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1/2 -translate-y-1/2 right-2 sm:right-4 bg-black/20 text-white backdrop-blur-sm rounded-full hover:bg-black/40"
              onClick={() => handleImageNav('next')}
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
                    ? 'ring-2 ring-offset-2 ring-orange-500 shadow-md' // Highlight color: Orange
                    : 'opacity-60 hover:opacity-100'
                )}
                onPointerDown={() => setMainImageIndex(index)}
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
        <div className="bg-white/50 backdrop-blur-sm p-4 sm:p-6 rounded-2xl border border-white/80 flex flex-col">
          {/* Header */}
          <div className="text-center mb-4">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-800">
              {DEMO_PROFILE.firstName}, {DEMO_PROFILE.age}
            </h3>
            <div className="flex items-center justify-center gap-4 mt-2 text-gray-600">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-teal-600" />
                <span>{DEMO_PROFILE.city}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-orange-500" />
                <span>{DEMO_PROFILE.occupation}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs - Updated Colors */}
          <div
            className="mb-4 bg-slate-100 p-1 rounded-full grid grid-cols-3 gap-1"
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
                onPointerDown={() => setActiveTab(tab.id)}
                className={cn(
                  'relative w-full rounded-full py-2 text-sm font-semibold transition-colors duration-300',
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-gray-600 hover:bg-white/60 hover:text-teal-700'
                )}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="demo-profile-active-tab"
                    // Active Tab Gradient: Teal to Orange
                    className="absolute inset-0 bg-gradient-to-r from-teal-500 to-orange-500 rounded-full shadow-md"
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

          {/* Content Panels */}
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
                  <div className="relative bg-white/60 p-4 rounded-xl shadow-sm border border-teal-100">
                    <Quote className="absolute top-2 right-2 w-8 h-8 text-teal-200/50 transform scale-x-[-1]" />
                    <p className="text-lg text-gray-800 italic font-medium leading-relaxed">
                      {DEMO_PROFILE.about}
                    </p>
                  </div>
                  <Badge className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-0 shadow-md px-3 py-1.5 text-sm font-bold flex items-center gap-1.5 w-fit mx-auto sm:mx-0">
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

          {/* CTA - Updated Gradient Button */}
          <div className="mt-auto pt-4 text-center">
            <Link href={`/${locale}/auth/register`}>
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group font-bold text-lg h-12"
              >
                <span className="relative z-10 flex items-center justify-center">
                  רוצים לקבל הצעות כאלה?
                  {locale === 'he' ? (
                    <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                  ) : (
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  )}{' '}
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};