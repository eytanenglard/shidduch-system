// src/app/[locale]/friends/page.tsx
// דף הפניית חברים - קמפיין חנוכה "מוסיפים אור בחנוכה"
// NeshamaTech - מתוקן: מיקום שמש + לוגיקת שעה 17:00

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Users,
  Heart,
  Share2,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  Crown,
  TrendingUp,
  ChevronDown,
  Loader2,
  AlertCircle,
  Search,
  KeyRound,
  Gift,
  Flame,
  X,
  Forward,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useParams } from 'next/navigation';

// ================== Hanukkah Config ==================
// ================== Hanukkah Config ==================
const HANUKKAH_CONFIG = {
  // עדכנתי לתאריך של היום (14.12.2025) כדי שיתחיל מנר ראשון
  startDate: new Date('2025-12-14T00:00:00'), 
};

// חישוב איזה נר היום
const getCurrentCandle = (): number => {
  const now = new Date();
  
  // הגדרת זמן התחלה מדויק: התאריך מהקונפיג בשעה 17:00
  const campaignStart = new Date(HANUKKAH_CONFIG.startDate);
  campaignStart.setHours(17, 0, 0, 0);

  // אם אנחנו לפני השעה 17:00 ביום ההתחלה - מציג נר 1 (ממתין להדלקה)
  if (now < campaignStart) {
    return 1;
  }

  const diffTime = now.getTime() - campaignStart.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // יום 0 (היום בערב) = נר 1
  // יום 1 (מחר בערב) = נר 2
  return Math.min(Math.max(diffDays + 1, 1), 8);
};



// ================== Hanukkiah SVG Component ==================
interface HanukkiahProps {
  litCandles: number;
  className?: string;
}

const Hanukkiah: React.FC<HanukkiahProps> = ({
  litCandles,
  className = '',
}) => {
  // תיקון מיקום השמש: ה-x שונה ל-160 כדי להיות ממורכז
  const candlePositions = [
    { x: 25, height: 35 },
    { x: 55, height: 35 },
    { x: 85, height: 35 },
    { x: 115, height: 35 },
    { x: 160, height: 50 }, // שמש - תוקן למרכז (היה 175)
    { x: 205, height: 35 },
    { x: 235, height: 35 },
    { x: 265, height: 35 },
    { x: 295, height: 35 },
  ];

 const getLitStatus = (index: number): boolean => {
    // השמש (אינדקס 4) תמיד דולק
    if (index === 4) return true; 

    // צד ימין של החנוכייה (אינדקסים 5-8)
    // אינדקס 8 הוא הנר הראשון (הכי ימני), אינדקס 5 הוא הנר הרביעי
    if (index > 4) {
      return litCandles >= (9 - index);
    }
    
    // צד שמאל של החנוכייה (אינדקסים 0-3)
    // אינדקס 3 הוא הנר החמישי, אינדקס 0 הוא הנר השמיני (הכי שמאלי)
    return litCandles >= (8 - index);
  };

  return (
    <svg
      viewBox="0 0 320 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F6E05E" />
          <stop offset="50%" stopColor="#D69E2E" />
          <stop offset="100%" stopColor="#B7791F" />
        </linearGradient>
        <linearGradient id="flameGradient" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="50%" stopColor="#F6AD55" />
          <stop offset="100%" stopColor="#ED8936" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* בסיס החנוכייה */}
      <rect
        x="60"
        y="100"
        width="200"
        height="8"
        rx="2"
        fill="url(#goldGradient)"
      />
      {/* בסיס הקנה המרכזי */}
      <rect
        x="150"
        y="85"
        width="20"
        height="20"
        rx="2"
        fill="url(#goldGradient)"
      />

      {candlePositions.map((pos, index) => {
        const isLit = getLitStatus(index);
        const isShamash = index === 4;
        const baseY = isShamash ? 35 : 50;

        return (
          <g key={index}>
            <rect
              x={pos.x - 4}
              y={baseY}
              width="8"
              height={pos.height}
              rx="2"
              fill={isShamash ? '#FBD38D' : '#E2E8F0'}
              stroke="url(#goldGradient)"
              strokeWidth="1"
            />
            <line
              x1={pos.x}
              y1={baseY}
              x2={pos.x}
              y2={baseY - 5}
              stroke="#4A5568"
              strokeWidth="1"
            />
            {isLit && (
              <g filter="url(#glow)">
                <motion.ellipse
                  cx={pos.x}
                  cy={baseY - 12}
                  rx="5"
                  ry="10"
                  fill="url(#flameGradient)"
                  animate={{
                    scaleY: [0.8, 1, 0.9, 1, 0.8],
                    opacity: [0.8, 1, 0.9, 1, 0.8],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                <motion.ellipse
                  cx={pos.x}
                  cy={baseY - 14}
                  rx="2"
                  ry="5"
                  fill="#FEF3C7"
                  animate={{ scaleY: [0.9, 1.1, 0.9] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </g>
            )}
          </g>
        );
      })}

      {/* קנה מרכזי (שמש) */}
      <rect x="157" y="50" width="6" height="35" fill="url(#goldGradient)" />

      {/* קנים צדדיים */}
      {[25, 55, 85, 115, 205, 235, 265, 295].map((x, i) => (
        <g key={`stand-${i}`}>
          <line
            x1={x}
            y1="85"
            x2={x}
            y2="100"
            stroke="url(#goldGradient)"
            strokeWidth="3"
          />
          <line
            x1={x}
            y1="85"
            x2="160"
            y2="85"
            stroke="url(#goldGradient)"
            strokeWidth="2"
          />
        </g>
      ))}
    </svg>
  );
};

// ================== Small Decorative Hanukkiah ==================
const SmallHanukkiah: React.FC<{ className?: string }> = ({
  className = '',
}) => (
  <svg
    viewBox="0 0 60 40"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="miniFlame" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#F6AD55" stopOpacity="0.6" />
      </linearGradient>
    </defs>
    {/* Simple 9 flames representation */}
    {[8, 16, 24, 32, 30, 38, 46, 54, 62].map((x, i) => (
      <ellipse
        key={i}
        cx={x - 5}
        cy={i === 4 ? 12 : 16}
        rx="3"
        ry="6"
        fill="url(#miniFlame)"
      />
    ))}
    <rect
      x="5"
      y="28"
      width="50"
      height="4"
      rx="1"
      fill="#D69E2E"
      opacity="0.4"
    />
  </svg>
);

// ================== Dreidel SVG ==================
const Dreidel: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 40 50"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <polygon
      points="20,5 35,20 20,45 5,20"
      fill="none"
      stroke="#14b8a6"
      strokeWidth="2"
      opacity="0.3"
    />
    <line
      x1="20"
      y1="0"
      x2="20"
      y2="8"
      stroke="#14b8a6"
      strokeWidth="2"
      opacity="0.3"
    />
    <text
      x="20"
      y="28"
      textAnchor="middle"
      fill="#14b8a6"
      opacity="0.4"
      fontSize="12"
      fontFamily="serif"
    >
      נ
    </text>
  </svg>
);

// ================== תוכן דו-לשוני - חנוכה ==================
const content = {
  he: {
    hero: {
      badge: '🕎 מוסיפים אור בחנוכה',
      title: 'הדליקו אור לחברים',
      subtitle:
        'כמו נס פך השמן - לפעמים דבר קטן יכול להוביל למשהו גדול. הקישור שתשלחו יכול להיות ההתחלה של הזוגיות שהם מחפשים.',
      highlight:
        '🏆 מי שיביא הכי הרבה חברים עד סוף החנוכה - יקבל ארוחה זוגית מפנקת עלינו!',
      cta: 'רוצה להאיר לחברים',
      stats: [
        { value: 'אישי', label: 'ליווי' },
        { value: 'מעמיק', label: 'שאלון' },
        { value: 'דיסקרטי', label: 'תהליך' },
      ],
    },
    howItWorks: {
      title: 'איך מוסיפים אור?',
      steps: [
        {
          title: 'הירשמו',
          desc: 'מלאו פרטים וקבלו קישור אישי',
          gradient: 'from-teal-400 to-emerald-500',
        },
        {
          title: 'שתפו',
          desc: 'שלחו לחברים שמחפשים קשר רציני',
          gradient: 'from-orange-400 to-amber-500',
        },
        {
          title: 'עקבו',
          desc: 'ראו כמה נרות הדלקתם',
          gradient: 'from-rose-400 to-pink-500',
        },
        {
          title: 'האירו',
          desc: 'עזרו להרחיב את הקהילה',
          gradient: 'from-teal-500 to-cyan-500',
        },
      ],
    },
    prize: {
      badge: 'הפרס הגדול 🕎',
      title: 'הארה קטנה, השפעה גדולה',
      text: 'לעזור לחבר למצוא את מי שהוא מחפש - זה כמו להדליק נר. האור מתפשט הלאה. מי שיביא הכי הרבה חברים עד סוף החנוכה - נשמח לפנק בארוחה זוגית.',
      prizeTitle: '🍽️ ארוחה זוגית מפנקת',
      prizeSubtitle: 'למאיר/ת האור הגדול/ה של הקמפיין',
    },
    form: {
      title: 'הצטרפו למאירי האור',
      subtitle: 'מלאו את הפרטים וקבלו קישור אישי לשיתוף',
      labels: {
        name: 'שם מלא',
        email: 'אימייל',
        phone: 'טלפון (אופציונלי)',
        code: 'קוד מועדף (אופציונלי)',
      },
      placeholders: {
        name: 'השם שלכם',
        email: 'email@example.com',
        phone: '050-1234567',
        code: 'למשל: DAVID',
      },
      buttons: {
        submit: 'קבלו קישור אישי',
        submitting: 'רושמים אתכם...',
        copy: 'העתקה',
        copied: 'הועתק!',
        whatsapp: 'שתפו את האור 🕎',
        dashboard: 'לדף המעקב שלי',
      },
      messages: {
        linkPreview: 'הקישור שלכם:',
        codeTaken: 'הקוד הזה כבר תפוס, נסו אחר',
        successTitle: '🕎 נרשמתם בהצלחה!',
        successDesc:
          'הנה הקישור האישי שלכם. שתפו אותו עם חברים והוסיפו אור בחנוכה הזה!',
        genericError: 'משהו השתבש, נסו שוב',
      },
    },
    existing: {
      title: 'כבר יש לכם קישור?',
      subtitle: 'הכניסו את הפרטים שלכם למעבר לדף המעקב',
      tabs: { code: 'קוד', email: 'אימייל', phone: 'טלפון' },
      placeholders: {
        code: 'הקוד שלכם',
        email: 'האימייל שלכם',
        phone: 'הטלפון שלכם',
      },
      button: { search: 'לדף המעקב', searching: 'מחפש...' },
      errors: {
        notFound: 'לא מצאנו מפנה עם הפרטים האלה',
        generic: 'שגיאה בחיפוש',
      },
    },
    faq: {
      title: 'שאלות נפוצות',
      questions: [
        {
          q: 'למי כדאי לשלוח את הקישור?',
          a: 'לחברים רווקים שמחפשים קשר רציני ומשמעותי, שיעריכו גישה אישית ומכבדת לשידוכים.',
        },
        {
          q: 'מה החבר/ה שלי יקבלו?',
          a: 'הם יוכלו להירשם לשירות שלנו, למלא את השאלון המעמיק, ולקבל ליווי אישי מצוות השדכנים שלנו.',
        },
        {
          q: 'עד מתי נמשך הקמפיין?',
          a: 'קמפיין "מוסיפים אור בחנוכה" נמשך לאורך כל ימי החנוכה. בסופו נכריז על המנצח/ת!',
        },
        {
          q: 'מה מקבלים על הפניות?',
          a: 'מי שיביא הכי הרבה חברים מאומתים עד סוף החנוכה יקבל שובר לארוחה זוגית מפנקת.',
        },
        {
          q: 'האם יש הגבלה על מספר ההפניות?',
          a: 'לא, אתם מוזמנים לשתף עם כל מי שאתם חושבים שיתאים. ככל שתוסיפו יותר אור - כך גדל הסיכוי לזכות!',
        },
      ],
    },
    whatsappModal: {
      title: 'שתפו את האור',
      subtitle: 'הזמינו חברים להצטרף בחנוכה',
      messageLabel: 'ההודעה שתשלח:',
      copyMessage: 'העתקת ההודעה',
      copyLink: 'העתקת הקישור בלבד',
      copied: 'הועתק!',
      sendWhatsapp: 'פתיחת וואטסאפ ושליחה לחבר',
      tip: 'כמו שמוסיפים נר כל יום - כל חבר שמצטרף מוסיף אור לקהילה!',
    },
  },
  en: {
    hero: {
      badge: '🕎 Adding Light this Hanukkah',
      title: 'Light the way for friends',
      subtitle:
        "Like the miracle of the oil - sometimes something small can lead to something great. The link you send could be the beginning of the relationship they're looking for.",
      highlight:
        "🏆 Whoever brings the most friends by the end of Hanukkah wins a couple's dinner on us!",
      cta: 'I want to light the way',
      stats: [
        { value: 'Personal', label: 'Guidance' },
        { value: 'Deep', label: 'Questionnaire' },
        { value: 'Discreet', label: 'Process' },
      ],
    },
    howItWorks: {
      title: 'How to add light?',
      steps: [
        {
          title: 'Register',
          desc: 'Fill in details and get your personal link',
          gradient: 'from-teal-400 to-emerald-500',
        },
        {
          title: 'Share',
          desc: 'Send to friends looking for serious relationships',
          gradient: 'from-orange-400 to-amber-500',
        },
        {
          title: 'Track',
          desc: 'See how many candles you lit',
          gradient: 'from-rose-400 to-pink-500',
        },
        {
          title: 'Illuminate',
          desc: 'Help expand the community',
          gradient: 'from-teal-500 to-cyan-500',
        },
      ],
    },
    prize: {
      badge: 'The Grand Prize 🕎',
      title: 'Small light, big impact',
      text: "Helping a friend find who they're looking for - it's like lighting a candle. The light spreads. Whoever brings the most friends by the end of Hanukkah - we'd love to treat to a couple's dinner.",
      prizeTitle: "🍽️ Pampering couple's dinner",
      prizeSubtitle: "For the campaign's biggest light-bringer",
    },
    form: {
      title: 'Join the light-bringers',
      subtitle: 'Fill in your details and get a personal link to share',
      labels: {
        name: 'Full Name',
        email: 'Email',
        phone: 'Phone (Optional)',
        code: 'Preferred Code (Optional)',
      },
      placeholders: {
        name: 'Your name',
        email: 'email@example.com',
        phone: '050-1234567',
        code: 'e.g., DAVID',
      },
      buttons: {
        submit: 'Get my personal link',
        submitting: 'Registering...',
        copy: 'Copy',
        copied: 'Copied!',
        whatsapp: 'Share the light 🕎',
        dashboard: 'Go to my dashboard',
      },
      messages: {
        linkPreview: 'Your link:',
        codeTaken: 'This code is taken, try another',
        successTitle: '🕎 Successfully registered!',
        successDesc:
          'Here is your personal link. Share it with friends and add light this Hanukkah!',
        genericError: 'Something went wrong, please try again',
      },
    },
    existing: {
      title: 'Already have a link?',
      subtitle: 'Enter your details to go to your tracking page',
      tabs: { code: 'Code', email: 'Email', phone: 'Phone' },
      placeholders: {
        code: 'Your code',
        email: 'Your email',
        phone: 'Your phone',
      },
      button: { search: 'Go to dashboard', searching: 'Searching...' },
      errors: {
        notFound: "We couldn't find a referrer with these details",
        generic: 'Search error',
      },
    },
    faq: {
      title: 'Frequently Asked Questions',
      questions: [
        {
          q: 'Who should I send the link to?',
          a: 'Single friends looking for a serious, meaningful relationship who would appreciate a personal and respectful approach to matchmaking.',
        },
        {
          q: 'What will my friend receive?',
          a: 'They can register for our service, complete the in-depth questionnaire, and receive personal guidance from our matchmaking team.',
        },
        {
          q: 'When does the campaign end?',
          a: 'The "Adding Light this Hanukkah" campaign runs throughout the holiday. We\'ll announce the winner at the end!',
        },
        {
          q: 'What do you get for referrals?',
          a: "Whoever brings the most verified friends by the end of Hanukkah wins a voucher for a couple's dinner.",
        },
        {
          q: 'Is there a limit on referrals?',
          a: "No, you're welcome to share with anyone you think would be a good fit. The more light you add, the better your chances!",
        },
      ],
    },
    whatsappModal: {
      title: 'Share the light',
      subtitle: 'Invite friends to join this Hanukkah',
      messageLabel: 'Message to send:',
      copyMessage: 'Copy message',
      copyLink: 'Copy link only',
      copied: 'Copied!',
      sendWhatsapp: 'Open WhatsApp and send',
      tip: 'Like adding a candle each night - every friend who joins adds light to the community!',
    },
  },
};

// ================== WhatsApp Share Modal ==================
interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  locale: string;
}

const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  shareUrl,
  locale,
}) => {
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const isHebrew = locale === 'he';
  const t = isHebrew ? content.he.whatsappModal : content.en.whatsappModal;

  const shareMessage = isHebrew
    ? `חג חנוכה שמח! 🕎✨

בחנוכה הזה אני רוצה להמליץ לך על משהו מיוחד - NeshamaTech, מערכת שידוכים שפועלת אחרת לגמרי מאפליקציות ההיכרויות.

🕯️ מה מיוחד פה?
• שדכנים אמיתיים מחפשים בשבילך - בלי סווייפים אינסופיים
• דיסקרטיות מלאה - הפרטים שלך לא חשופים
• התאמות על בסיס ערכים והשקפת עולם

💫 כמו נס פך השמן - לפעמים דבר קטן יכול להוביל לדבר גדול!

הנה הקישור להרשמה:
${shareUrl}

חג אורים שמח! 🕎`
    : `Happy Hanukkah! 🕎✨

This Hanukkah I want to recommend something special - NeshamaTech, a matchmaking system that works completely different from dating apps.

🕯️ What's special?
• Real matchmakers search for you - no endless swiping
• Complete discretion - your details aren't exposed
• Matches based on values and worldview

💫 Like the miracle of the oil - sometimes something small can lead to something great!

Here's the registration link:
${shareUrl}

Happy Festival of Lights! 🕎`;

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2500);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const openWhatsAppDirect = () => {
    const text = encodeURIComponent(shareMessage);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `whatsapp://send?text=${text}`;
    } else {
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg z-50 max-h-[80vh] overflow-y-auto"
            dir={isHebrew ? 'rtl' : 'ltr'}
          >
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
              {/* Header with Hanukkah colors */}
              <div className="bg-gradient-to-r from-teal-500 via-teal-600 to-orange-500 px-6 py-4 relative">
                <button
                  onClick={onClose}
                  className={`absolute ${isHebrew ? 'left-4' : 'right-4'} top-4 text-white/80 hover:text-white transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="text-center text-white">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-2xl">🕎</span>
                    <h3 className="text-xl font-bold">{t.title}</h3>
                    <span className="text-2xl">🕎</span>
                  </div>
                  <p className="text-sm text-white/90">{t.subtitle}</p>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="relative">
                  <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    {t.messageLabel}
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 text-sm text-gray-700 leading-relaxed max-h-48 overflow-y-auto border border-gray-200">
                    <div className="whitespace-pre-wrap">{shareMessage}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={copyMessage}
                    variant="outline"
                    className={`w-full h-12 text-base transition-all duration-300 ${
                      copiedMessage
                        ? 'bg-teal-50 border-teal-300 text-teal-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {copiedMessage ? (
                      <>
                        <Check
                          className={`${isHebrew ? 'ml-2' : 'mr-2'} w-5 h-5`}
                        />
                        {t.copied}
                      </>
                    ) : (
                      <>
                        <Copy
                          className={`${isHebrew ? 'ml-2' : 'mr-2'} w-5 h-5`}
                        />
                        {t.copyMessage}
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={copyLink}
                    variant="outline"
                    className={`w-full h-12 text-base transition-all duration-300 ${
                      copiedLink
                        ? 'bg-orange-50 border-orange-300 text-orange-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {copiedLink ? (
                      <>
                        <Check
                          className={`${isHebrew ? 'ml-2' : 'mr-2'} w-5 h-5`}
                        />
                        {t.copied}
                      </>
                    ) : (
                      <>
                        <Copy
                          className={`${isHebrew ? 'ml-2' : 'mr-2'} w-5 h-5`}
                        />
                        {t.copyLink}
                      </>
                    )}
                  </Button>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white px-3 text-sm text-gray-500">
                        {isHebrew ? 'או' : 'or'}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={openWhatsAppDirect}
                    className="w-full h-14 text-lg bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg shadow-green-200 hover:shadow-xl transition-all duration-300"
                  >
                    <Forward
                      className={`${isHebrew ? 'ml-2' : 'mr-2'} w-5 h-5`}
                    />
                    {t.sendWhatsapp}
                  </Button>
                </div>

                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-200">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">🕯️</span>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      <span className="font-bold">טיפ:</span> {t.tip}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ================== Original Background + Hanukkah Elements ==================
const DynamicBackground: React.FC = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
    {/* Original gradient background */}
    <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-teal-50/30 to-orange-50/20" />

    {/* Original floating orbs */}
    <div
      className="absolute top-10 left-10 w-72 h-72 bg-teal-300/20 rounded-full blur-3xl animate-float-slow"
      style={{ animationDelay: '0s' }}
    />
    <div
      className="absolute top-1/3 right-20 w-64 h-64 bg-orange-300/20 rounded-full blur-3xl animate-float-slow"
      style={{ animationDelay: '2s' }}
    />
    <div
      className="absolute bottom-20 left-1/3 w-80 h-80 bg-rose-300/15 rounded-full blur-3xl animate-float-slow"
      style={{ animationDelay: '4s' }}
    />

    {/* Original dot pattern */}
    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:30px_30px]" />

    {/* === Hanukkah Elements === */}

    {/* Floating small menorahs */}
    <motion.div
      className="absolute top-20 right-[15%] w-16 h-12 opacity-20"
      animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <SmallHanukkiah />
    </motion.div>

    <motion.div
      className="absolute bottom-32 left-[10%] w-20 h-14 opacity-15"
      animate={{ y: [0, -15, 0], rotate: [0, -3, 0] }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 2,
      }}
    >
      <SmallHanukkiah />
    </motion.div>

    <motion.div
      className="absolute top-1/2 right-[8%] w-14 h-10 opacity-10"
      animate={{ y: [0, -8, 0] }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 1,
      }}
    >
      <SmallHanukkiah />
    </motion.div>

    {/* Floating dreidels */}
    <motion.div
      className="absolute top-40 left-[20%] w-10 h-12"
      animate={{ y: [0, -12, 0], rotate: [0, 15, 0] }}
      transition={{
        duration: 7,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 0.5,
      }}
    >
      <Dreidel />
    </motion.div>

    <motion.div
      className="absolute bottom-40 right-[25%] w-8 h-10"
      animate={{ y: [0, -10, 0], rotate: [0, -10, 0] }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 3,
      }}
    >
      <Dreidel />
    </motion.div>

    {/* Sparkle/star elements */}
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={`sparkle-${i}`}
        className="absolute text-amber-400/30"
        style={{
          top: `${15 + Math.random() * 70}%`,
          left: `${5 + Math.random() * 90}%`,
          fontSize: `${12 + Math.random() * 8}px`,
        }}
        animate={{
          opacity: [0.1, 0.4, 0.1],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 3,
        }}
      >
        ✡
      </motion.div>
    ))}
  </div>
);

// ================== Hero Section (Hanukkah) ==================
const HeroSection: React.FC<{
  locale: string;
  onScrollToForm: () => void;
}> = ({ locale, onScrollToForm }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const isHebrew = locale === 'he';
  const t = isHebrew ? content.he.hero : content.en.hero;
  const currentCandle = getCurrentCandle();

  return (
    <motion.section
      ref={ref}
      className="relative min-h-[90vh] flex items-center justify-center px-4 py-16"
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 1 }}
    >
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-50 via-white to-orange-50 rounded-full px-6 py-3 mb-6 shadow-lg border border-teal-100"
        >
          <span className="font-medium text-gray-700">{t.badge}</span>
        </motion.div>

        {/* Hanukkiah */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.3 }}
          className="max-w-md mx-auto mb-6"
        >
          <Hanukkiah
            litCandles={currentCandle}
            className="w-full h-auto drop-shadow-lg"
          />
          <div className="text-teal-600 text-sm mt-2 font-medium">
            {isHebrew
              ? `נר ${currentCandle} של חנוכה`
              : `Candle ${currentCandle} of Hanukkah`}
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight"
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-teal-500 to-orange-500">
            {t.title}
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-4 leading-relaxed"
        >
          {t.subtitle}
        </motion.p>

        {/* Highlight */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="text-base md:text-lg text-teal-700 font-medium max-w-xl mx-auto mb-10"
        >
          {t.highlight}
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7 }}
        >
          <Button
            onClick={onScrollToForm}
            size="lg"
            className="text-lg font-semibold px-10 py-7 bg-gradient-to-r from-teal-500 via-teal-600 to-orange-500 hover:from-teal-600 hover:via-teal-700 hover:to-orange-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all group"
          >
            <Flame className={`w-5 h-5 ${isHebrew ? 'ml-2' : 'mr-2'}`} />
            {t.cta}
            {isHebrew ? (
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            ) : (
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            )}
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.9 }}
          className="flex flex-wrap justify-center gap-4 mt-12"
        >
          {t.stats.map((stat, i) => {
            const icons = [Users, Heart, CheckCircle2];
            const Icon = icons[i];
            return (
              <div
                key={i}
                className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-lg border border-white/60"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-100 to-orange-100 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-teal-600" />
                </div>
                <div className={isHebrew ? 'text-right' : 'text-left'}>
                  <div className="text-lg font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-600">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </motion.section>
  );
};

// ================== How It Works Section ==================
const HowItWorksSection: React.FC<{ locale: string }> = ({ locale }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const isHebrew = locale === 'he';
  const t = isHebrew ? content.he.howItWorks : content.en.howItWorks;

  const icons = [
    <Users key="icon-1" className="w-7 h-7" />,
    <Share2 key="icon-2" className="w-7 h-7" />,
    <TrendingUp key="icon-3" className="w-7 h-7" />,
    <Heart key="icon-4" className="w-7 h-7" />,
  ];

  return (
    <section ref={ref} className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12"
        >
          {t.title}
        </motion.h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {t.steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1 }}
              className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/60 text-center hover:shadow-xl transition-all group"
            >
              <div
                className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}
              >
                {icons[i]}
              </div>
              <h3 className="font-bold text-gray-800 mb-1">{step.title}</h3>
              <p className="text-sm text-gray-600">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ================== Prize Section ==================
const PrizeSection: React.FC<{ locale: string }> = ({ locale }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const isHebrew = locale === 'he';
  const t = isHebrew ? content.he.prize : content.en.prize;

  return (
    <section ref={ref} className="py-16 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-amber-200">
            <Gift className="w-4 h-4" />
            {t.badge}
          </div>

          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            {t.title}
          </h2>

          {/* Text */}
          <p className="text-gray-600 mb-10 text-base leading-relaxed max-w-xl mx-auto">
            {t.text}
          </p>

          {/* Prize Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 rounded-3xl p-8 md:p-10 shadow-xl border border-amber-100 relative overflow-hidden"
          >
            {/* Decorative elements */}
            <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-gradient-to-br from-amber-200/30 to-transparent blur-xl" />
            <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full bg-gradient-to-br from-orange-200/30 to-transparent blur-xl" />

            <div className="relative z-10">
              {/* Icon */}
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg mb-5">
                <Crown className="w-8 h-8 text-white" />
              </div>

              {/* Prize details */}
              <div className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                {t.prizeTitle}
              </div>
              <div className="text-amber-600 font-medium">
                {t.prizeSubtitle}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

// ================== Signup Form ==================
const SignupForm: React.FC<{
  locale: string;
  formRef: React.RefObject<HTMLDivElement | null>;
}> = ({ locale, formRef }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const isHebrew = locale === 'he';
  const t = isHebrew ? content.he.form : content.en.form;

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    code: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [codeStatus, setCodeStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken'
  >('idle');
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  useEffect(() => {
    if (!form.code || form.code.length < 3) {
      setCodeStatus('idle');
      return;
    }

    const timer = setTimeout(async () => {
      setCodeStatus('checking');
      try {
        const response = await fetch(
          `/api/referral/register?code=${form.code}`
        );
        const data = await response.json();
        setCodeStatus(data.available ? 'available' : 'taken');
      } catch {
        setCodeStatus('idle');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [form.code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/referral/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          preferredCode: form.code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.messages.genericError);
      }

      setGeneratedCode(data.referrer.code);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.messages.genericError);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    const url = `${window.location.origin}/r/${generatedCode}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/r/${generatedCode}`
      : '';

  return (
    <section ref={formRef} className="py-16 px-4">
      <div ref={ref} className="max-w-xl mx-auto">
        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              exit={{ opacity: 0 }}
              className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/60"
            >
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-teal-500 to-orange-500 flex items-center justify-center text-white mb-4 shadow-lg">
                  <Flame className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{t.title}</h2>
                <p className="text-gray-600 mt-1">{t.subtitle}</p>
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.labels.name} *
                  </label>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={t.placeholders.name}
                    className="h-12 rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.labels.email} *
                  </label>
                  <Input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder={t.placeholders.email}
                    className="h-12 rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.labels.phone}
                  </label>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder={t.placeholders.phone}
                    className="h-12 rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.labels.code}
                  </label>
                  <div className="relative">
                    <Input
                      value={form.code}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          code: e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9]/g, ''),
                        })
                      }
                      placeholder={t.placeholders.code}
                      maxLength={15}
                      className={`h-12 rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500 font-mono ${
                        isHebrew ? 'pl-10' : 'pr-10'
                      }`}
                      dir="ltr"
                    />
                    <div
                      className={`absolute ${isHebrew ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2`}
                    >
                      {codeStatus === 'checking' && (
                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                      )}
                      {codeStatus === 'available' && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                      {codeStatus === 'taken' && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    {t.messages.linkPreview} neshamatech.com/r/
                    {form.code || 'YOURCODE'}
                  </p>
                  {codeStatus === 'taken' && (
                    <p className="text-xs text-red-500 mt-1">
                      {t.messages.codeTaken}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || codeStatus === 'taken'}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-teal-500 to-orange-500 hover:from-teal-600 hover:to-orange-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2
                        className={`w-5 h-5 ${isHebrew ? 'ml-2' : 'mr-2'} animate-spin`}
                      />
                      {t.buttons.submitting}
                    </>
                  ) : (
                    <>
                      <Sparkles
                        className={`w-5 h-5 ${isHebrew ? 'ml-2' : 'mr-2'}`}
                      />
                      {t.buttons.submit}
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-teal-50 via-white to-orange-50 rounded-3xl p-8 shadow-2xl border border-teal-100 text-center"
            >
              {/* Success Icon */}
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mb-5 shadow-xl">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>

              {/* Success Message */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t.messages.successTitle}
              </h2>
              <p className="text-gray-600 mb-6">{t.messages.successDesc}</p>

              {/* Link Display */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
                <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg p-3">
                  <code
                    className="text-teal-600 font-mono text-sm truncate flex-1"
                    dir="ltr"
                  >
                    {shareUrl}
                  </code>
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="sm"
                    className={
                      copied ? 'bg-teal-50 text-teal-600 border-teal-200' : ''
                    }
                  >
                    {copied ? (
                      <>
                        <Check
                          className={`w-4 h-4 ${isHebrew ? 'ml-1' : 'mr-1'}`}
                        />
                        {t.buttons.copied}
                      </>
                    ) : (
                      <>
                        <Copy
                          className={`w-4 h-4 ${isHebrew ? 'ml-1' : 'mr-1'}`}
                        />
                        {t.buttons.copy}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => setIsWhatsAppModalOpen(true)}
                  className="bg-gradient-to-r from-teal-500 to-orange-500 hover:from-teal-600 hover:to-orange-600 text-white px-6 py-5 rounded-xl"
                >
                  <Flame className={`w-5 h-5 ${isHebrew ? 'ml-2' : 'mr-2'}`} />
                  {t.buttons.whatsapp}
                </Button>
                <Button
                  onClick={() =>
                    window.open(
                      `/${locale}/referral/dashboard?code=${generatedCode}`,
                      '_blank'
                    )
                  }
                  variant="outline"
                  className="px-6 py-5 rounded-xl border-gray-200"
                >
                  <TrendingUp
                    className={`w-5 h-5 ${isHebrew ? 'ml-2' : 'mr-2'}`}
                  />
                  {t.buttons.dashboard}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* WhatsApp Modal */}
      <WhatsAppShareModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        shareUrl={shareUrl}
        locale={locale}
      />
    </section>
  );
};

// ================== Existing Referrer Section ==================
const ExistingReferrerSection: React.FC<{ locale: string }> = ({ locale }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const isHebrew = locale === 'he';
  const t = isHebrew ? content.he.existing : content.en.existing;

  const [searchValue, setSearchValue] = useState('');
  const [searchType, setSearchType] = useState<'code' | 'email' | 'phone'>(
    'code'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (searchType === 'code') {
        params.set('code', searchValue.toUpperCase());
      } else if (searchType === 'email') {
        params.set('email', searchValue);
      } else {
        params.set('phone', searchValue);
      }

      const response = await fetch(`/api/referral/lookup?${params.toString()}`);
      const data = await response.json();

      if (data.success && data.code) {
        window.location.href = `/${locale}/referral/dashboard?code=${data.code}`;
      } else {
        setError(t.errors.notFound);
      }
    } catch {
      setError(t.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section ref={ref} className="py-12 px-4">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/60"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-slate-100 to-gray-200 flex items-center justify-center mb-3">
              <KeyRound className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">{t.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{t.subtitle}</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-xl">
            {[
              { type: 'code' as const, label: t.tabs.code },
              { type: 'email' as const, label: t.tabs.email },
              { type: 'phone' as const, label: t.tabs.phone },
            ].map((tab) => (
              <button
                key={tab.type}
                onClick={() => {
                  setSearchType(tab.type);
                  setError('');
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  searchType === tab.type
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={t.placeholders[searchType]}
                className={`h-12 rounded-xl ${isHebrew ? 'pr-4 pl-12' : 'pl-4 pr-12'}`}
                dir="ltr"
              />
              <Search
                className={`absolute ${isHebrew ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !searchValue.trim()}
              className="w-full h-11 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white rounded-xl"
            >
              {loading ? (
                <>
                  <Loader2
                    className={`w-4 h-4 ${isHebrew ? 'ml-2' : 'mr-2'} animate-spin`}
                  />
                  {t.button.searching}
                </>
              ) : (
                <>
                  <TrendingUp
                    className={`w-4 h-4 ${isHebrew ? 'ml-2' : 'mr-2'}`}
                  />
                  {t.button.search}
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

// ================== FAQ Section ==================
const FAQSection: React.FC<{ locale: string }> = ({ locale }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const isHebrew = locale === 'he';
  const t = isHebrew ? content.he.faq : content.en.faq;

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section ref={ref} className="py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-10"
        >
          {t.title}
        </motion.h2>

        <div className="space-y-3">
          {t.questions.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className={`w-full bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/60 hover:shadow-xl transition-all ${
                  isHebrew ? 'text-right' : 'text-left'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-bold text-gray-800">{faq.q}</h3>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ${
                      openIndex === i ? 'rotate-180' : ''
                    }`}
                  />
                </div>
                <AnimatePresence>
                  {openIndex === i && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="text-gray-600 mt-3 overflow-hidden leading-relaxed"
                    >
                      {faq.a}
                    </motion.p>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ================== Main Page Component ==================
export default function FriendsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'he';
  const formRef = useRef<HTMLDivElement>(null);
  const isHebrew = locale === 'he';

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <main className="min-h-screen relative" dir={isHebrew ? 'rtl' : 'ltr'}>
      <DynamicBackground />
      <HeroSection locale={locale} onScrollToForm={scrollToForm} />
      <HowItWorksSection locale={locale} />
      <ExistingReferrerSection locale={locale} />
      <PrizeSection locale={locale} />
      <SignupForm locale={locale} formRef={formRef} />
      <FAQSection locale={locale} />

      {/* Footer */}
      <div className="text-center py-8 text-gray-500 text-sm">
        חג אורים שמח! 🕎✨
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-float-slow {
          animation: float-slow 15s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
