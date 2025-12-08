// src/app/[locale]/friends/page.tsx
// דף הפניית חברים - NeshamaTech
// גרסה סופית מאושרת

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
  MessageCircle,
  TrendingUp,
  ChevronDown,
  Loader2,
  AlertCircle,
  Send,
  Search,
  KeyRound,
  Gift,
  Handshake,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useParams } from 'next/navigation';

// ================== תוכן דו-לשוני ==================
const content = {
  he: {
    hero: {
      badge: 'חברים מביאים חברים',
      title: 'יש לכם חברים שכדאי לנו להכיר?',
      subtitle:
        'יכול להיות שהקישור שתשלחו יהיה ההתחלה של הזוגיות שהם מחפשים. אצלנו הם יקבלו שאלון שבאמת מכיר אותם, ליווי אישי מצוות שדואג, והצעות שמגיעות עם סיפור שלם.',
      highlight: 'מי שיביא הכי הרבה חברים יקבל ארוחה זוגית מפנקת עלינו.',
      cta: 'רוצה להפנות חברים',
      stats: [
        { value: 'אישי', label: 'ליווי' },
        { value: 'מעמיק', label: 'שאלון' },
        { value: 'דיסקרטי', label: 'תהליך' },
      ],
    },
    howItWorks: {
      title: 'איך זה עובד?',
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
          desc: 'ראו מי נרשם דרככם',
          gradient: 'from-rose-400 to-pink-500',
        },
        {
          title: 'תרמו',
          desc: 'עזרו להרחיב את הקהילה',
          gradient: 'from-teal-500 to-cyan-500',
        },
      ],
    },
    prize: {
      badge: 'מגיע לכם',
      title: 'פעולה קטנה, השפעה גדולה',
      text: 'לעזור לחבר למצוא את מי שהוא מחפש - זה משמעותי. מי שיביא הכי הרבה חברים - נשמח לפנק בארוחה זוגית.',
      prizeTitle: 'ארוחה זוגית מפנקת',
      prizeSubtitle: 'למי שיביא הכי הרבה חברים',
    },
    form: {
      title: 'הצטרפו כמפנים',
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
        whatsapp: 'שליחה בוואטסאפ',
        dashboard: 'לדף המעקב שלי',
      },
      messages: {
        linkPreview: 'הקישור שלכם:',
        codeTaken: 'הקוד הזה כבר תפוס, נסו אחר',
        successTitle: 'נרשמתם בהצלחה!',
        successDesc:
          'הנה הקישור האישי שלכם. שתפו אותו עם חברים שמחפשים קשר אמיתי.',
        whatsappText:
          'היי, רציתי להמליץ לך על NeshamaTech - גישה אחרת לשידוכים, עם ליווי אישי ושאלון מעמיק שבאמת מכיר אותך. שווה לבדוק:',
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
          a: 'לחברים רווקים שמחפשים קשר רציני ומשמעותי, שיעריכו גישה אישית ומכבדת לשידוכים. אנשים שמעדיפים איכות על פני כמות.',
        },
        {
          q: 'מה החבר/ה שלי יקבלו?',
          a: 'הם יוכלו להירשם לשירות שלנו, למלא את השאלון המעמיק, ולקבל ליווי אישי מצוות השדכנים שלנו. הכל בדיסקרטיות מלאה.',
        },
        {
          q: 'איך אדע שמישהו נרשם דרכי?',
          a: 'יש לכם דף מעקב אישי שמראה כמה אנשים לחצו על הקישור וכמה מהם השלימו הרשמה.',
        },
        {
          q: 'מה מקבלים על הפניות?',
          a: 'מי שיביא הכי הרבה חברים יקבל שובר לארוחה זוגית מפנקת.',
        },
        {
          q: 'האם יש הגבלה על מספר ההפניות?',
          a: 'לא, אתם מוזמנים לשתף עם כל מי שאתם חושבים שיתאים.',
        },
      ],
    },
  },
  en: {
    hero: {
      badge: 'Friends bring friends',
      title: 'Know someone we should meet?',
      subtitle:
        "The link you send could be the beginning of the relationship they're looking for. With us, they'll get a questionnaire that truly understands them, personal guidance from a caring team, and suggestions that come with a full story.",
      highlight:
        "Whoever brings the most friends will receive a pampering couple's dinner on us.",
      cta: 'I want to refer friends',
      stats: [
        { value: 'Personal', label: 'Guidance' },
        { value: 'Deep', label: 'Questionnaire' },
        { value: 'Discreet', label: 'Process' },
      ],
    },
    howItWorks: {
      title: 'How does it work?',
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
          desc: 'See who registered through you',
          gradient: 'from-rose-400 to-pink-500',
        },
        {
          title: 'Contribute',
          desc: 'Help expand the community',
          gradient: 'from-teal-500 to-cyan-500',
        },
      ],
    },
    prize: {
      badge: 'You deserve it',
      title: 'Small action, big impact',
      text: "Helping a friend find who they're looking for - that's meaningful. Whoever brings the most friends - we'd love to treat them to a couple's dinner.",
      prizeTitle: "Pampering couple's dinner",
      prizeSubtitle: 'For whoever brings the most friends',
    },
    form: {
      title: 'Join as a referrer',
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
        whatsapp: 'Share on WhatsApp',
        dashboard: 'Go to my dashboard',
      },
      messages: {
        linkPreview: 'Your link:',
        codeTaken: 'This code is taken, try another',
        successTitle: 'Successfully registered!',
        successDesc:
          'Here is your personal link. Share it with friends looking for a real connection.',
        whatsappText:
          'Hey, I wanted to recommend NeshamaTech - a different approach to matchmaking, with personal guidance and a deep questionnaire that really gets to know you. Worth checking out:',
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
          a: 'Single friends looking for a serious, meaningful relationship who would appreciate a personal and respectful approach to matchmaking. People who prefer quality over quantity.',
        },
        {
          q: 'What will my friend receive?',
          a: 'They can register for our service, complete the in-depth questionnaire, and receive personal guidance from our matchmaking team. All in complete discretion.',
        },
        {
          q: 'How will I know if someone registered through me?',
          a: 'You have a personal tracking page showing how many people clicked your link and how many completed registration.',
        },
        {
          q: 'What do you get for referrals?',
          a: "Whoever brings the most friends will receive a voucher for a pampering couple's dinner.",
        },
        {
          q: 'Is there a limit on referrals?',
          a: "No, you're welcome to share with anyone you think would be a good fit.",
        },
      ],
    },
  },
};

// ================== Dynamic Background ==================
const DynamicBackground: React.FC = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
    <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-teal-50/30 to-orange-50/20" />
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
    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:30px_30px]" />
  </div>
);

// ================== Hero Section ==================
const HeroSection: React.FC<{
  locale: string;
  onScrollToForm: () => void;
}> = ({ locale, onScrollToForm }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const isHebrew = locale === 'he';
  const t = isHebrew ? content.he.hero : content.en.hero;

  return (
    <motion.section
      ref={ref}
      className="relative min-h-[85vh] flex items-center justify-center px-4 py-16"
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
          className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-50 via-white to-orange-50 rounded-full px-6 py-3 mb-8 shadow-lg border border-teal-100"
        >
          <Handshake className="w-5 h-5 text-teal-600" />
          <span className="font-medium text-gray-700">{t.badge}</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
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

        {/* Visual Element */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.7 }}
          className="relative max-w-sm mx-auto mb-10 h-24 flex items-center justify-center"
        >
          <div className="absolute left-8 w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-xl border-4 border-white">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-2xl border-4 border-white z-10">
            <Heart className="w-7 h-7 text-white" />
          </div>
          <div className="absolute right-8 w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-xl border-4 border-white">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
        >
          <Button
            onClick={onScrollToForm}
            size="lg"
            className="text-lg font-semibold px-10 py-7 bg-gradient-to-r from-teal-500 via-teal-600 to-orange-500 hover:from-teal-600 hover:via-teal-700 hover:to-orange-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all group"
          >
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
          transition={{ delay: 1 }}
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

  // Check code availability
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

  const shareWhatsApp = () => {
    const url = `${window.location.origin}/r/${generatedCode}`;
    const text = `${t.messages.whatsappText}\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

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
                  <Send className="w-7 h-7" />
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
                {/* Name */}
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

                {/* Email */}
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

                {/* Phone */}
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

                {/* Preferred Code */}
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

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading || codeStatus === 'taken'}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-teal-500 to-orange-500 hover:from-teal-600 hover:to-orange-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                      {t.buttons.submitting}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 ml-2" />
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
                    {typeof window !== 'undefined' && window.location.origin}/r/
                    {generatedCode}
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
                        <Check className="w-4 h-4 ml-1" />
                        {t.buttons.copied}
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 ml-1" />
                        {t.buttons.copy}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={shareWhatsApp}
                  className="bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-5 rounded-xl"
                >
                  <MessageCircle className="w-5 h-5 ml-2" />
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
                  <TrendingUp className="w-5 h-5 ml-2" />
                  {t.buttons.dashboard}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  {t.button.searching}
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 ml-2" />
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

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <main
      className="min-h-screen relative"
      dir={locale === 'he' ? 'rtl' : 'ltr'}
    >
      <DynamicBackground />
      <HeroSection locale={locale} onScrollToForm={scrollToForm} />
      <HowItWorksSection locale={locale} />
      <PrizeSection locale={locale} />
      <SignupForm locale={locale} formRef={formRef} />
      <ExistingReferrerSection locale={locale} />
      <FAQSection locale={locale} />

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
