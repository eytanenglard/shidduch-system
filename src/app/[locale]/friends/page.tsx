// src/app/[locale]/friends/page.tsx
// דף הרשמה למפנים - קמפיין חברים מביאים חברים

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Users,
  Gift,
  Trophy,
  Share2,
  Heart,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  Coffee,
  UtensilsCrossed,
  Crown,
  Zap,
  MessageCircle,
  Star,
  TrendingUp,
  ChevronDown,
  Loader2,
  AlertCircle,
  PartyPopper,
  Send,
  Search,
  KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useParams } from 'next/navigation';

// ================== Dynamic Background ==================
const DynamicBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
    <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-teal-50/30 to-orange-50/20" />
    <div className="absolute top-10 left-10 w-72 h-72 bg-teal-300/20 rounded-full blur-3xl animate-float-slow" />
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
const HeroSection: React.FC<{ locale: string; onScrollToForm: () => void }> = ({
  locale,
  onScrollToForm,
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const isHebrew = locale === 'he';

  const content = isHebrew
    ? {
        badge: 'קמפיין מיוחד לזמן מוגבל',
        titleLine1: 'חברים מביאים',
        titleHighlight: 'את הזיווג שלהם',
        subtitle: (
          <>
            הזמינו חברים ל-NeshamaTech וקבלו פרסים מדהימים.
            <br />
            <span className="font-semibold text-teal-700">
              המפנה המוביל יזכה בארוחת זוגות מפנקת! 🎉
            </span>
          </>
        ),
        cta: 'רוצה להצטרף? בואו נתחיל!',
        stats: [
          { value: '3', label: 'פרסים' },
          { value: '₪400', label: 'פרס ראשון' },
          { value: '∞', label: 'ללא הגבלה' },
        ],
      }
    : {
        badge: 'Special Limited Time Campaign',
        titleLine1: 'Friends Bring',
        titleHighlight: 'Their Match',
        subtitle: (
          <>
            Invite friends to NeshamaTech and win amazing prizes.
            <br />
            <span className="font-semibold text-teal-700">
              The top referrer wins a luxurious couple&lsquo;s dinner! 🎉
            </span>
          </>
        ),
        cta: "Want to join? Let's start!",
        stats: [
          { value: '3', label: 'Prizes' },
          { value: '₪400', label: 'Grand Prize' },
          { value: '∞', label: 'Unlimited' },
        ],
      };

  return (
    <motion.section
      ref={ref}
      className="relative min-h-[85vh] flex items-center justify-center px-4 py-16"
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 1 }}
    >
      <div className="max-w-5xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 via-orange-100 to-rose-100 rounded-full px-6 py-3 mb-8 shadow-lg border border-amber-200/50"
        >
          <PartyPopper className="w-5 h-5 text-amber-600" />
          <span className="font-bold text-amber-700">{content.badge}</span>
          <Sparkles className="w-5 h-5 text-orange-500" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight"
        >
          {content.titleLine1}
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 animate-gradient">
            {content.titleHighlight}
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10"
        >
          {content.subtitle}
        </motion.p>

        {/* Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="relative max-w-md mx-auto mb-12 h-28 flex items-center justify-center"
        >
          <div className="absolute left-8 w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-xl border-4 border-white">
            <Users className="w-10 h-10 text-white" />
          </div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-2xl border-4 border-white z-10">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <div className="absolute right-8 w-20 h-20 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-xl border-4 border-white">
            <Heart className="w-10 h-10 text-white" />
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
        >
          <Button
            onClick={onScrollToForm}
            size="lg"
            className="text-xl font-bold px-12 py-8 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all group"
          >
            <Zap className="w-6 h-6 ml-2 group-hover:rotate-12 transition-transform" />
            {content.cta}
            {isHebrew ? (
              <ArrowLeft className="w-6 h-6 mr-2 group-hover:-translate-x-1 transition-transform" />
            ) : (
              <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
            )}
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1 }}
          className="flex flex-wrap justify-center gap-6 mt-12"
        >
          {content.stats.map((stat, i) => {
            const icons = [Gift, Trophy, Users];
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
                  <div className="text-xl font-bold text-gray-900">
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

// ================== How It Works ==================
const HowItWorksSection: React.FC<{ locale: string }> = ({ locale }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const isHebrew = locale === 'he';

  const title = isHebrew ? 'איך זה עובד?' : 'How It Works?';
  const steps = isHebrew
    ? [
        {
          title: 'הירשמו',
          desc: 'מלאו פרטים וקבלו קישור',
          icon: <Users className="w-7 h-7" />,
          gradient: 'from-teal-400 to-emerald-500',
        },
        {
          title: 'שתפו',
          desc: 'שלחו לחברים רווקים',
          icon: <Share2 className="w-7 h-7" />,
          gradient: 'from-orange-400 to-amber-500',
        },
        {
          title: 'צברו',
          desc: 'כל חבר = נקודה',
          icon: <Star className="w-7 h-7" />,
          gradient: 'from-rose-400 to-pink-500',
        },
        {
          title: 'זכו!',
          desc: 'הגיעו ליעדים וקבלו פרסים',
          icon: <Gift className="w-7 h-7" />,
          gradient: 'from-amber-400 to-orange-500',
        },
      ]
    : [
        {
          title: 'Register',
          desc: 'Fill details & get link',
          icon: <Users className="w-7 h-7" />,
          gradient: 'from-teal-400 to-emerald-500',
        },
        {
          title: 'Share',
          desc: 'Send to single friends',
          icon: <Share2 className="w-7 h-7" />,
          gradient: 'from-orange-400 to-amber-500',
        },
        {
          title: 'Earn',
          desc: 'Every friend = 1 point',
          icon: <Star className="w-7 h-7" />,
          gradient: 'from-rose-400 to-pink-500',
        },
        {
          title: 'Win!',
          desc: 'Reach goals & get prizes',
          icon: <Gift className="w-7 h-7" />,
          gradient: 'from-amber-400 to-orange-500',
        },
      ];

  return (
    <section ref={ref} className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="text-3xl md:text-4xl font-extrabold text-center text-gray-900 mb-12"
        >
          {title}
        </motion.h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {steps.map((step, i) => (
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
                {step.icon}
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

// ================== Prizes Section ==================
const PrizesSection: React.FC<{ locale: string }> = ({ locale }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const isHebrew = locale === 'he';

  const content = isHebrew
    ? {
        badge: 'הפרסים',
        title: 'שלושה יעדים, שלושה פרסים',
        verifiedLabel: 'מאומתים',
        grandPrizeBadge: 'פרס מקום ראשון',
        grandPrizeTitle: 'המפנה המוביל יזכה ב:',
        grandPrizeDesc: 'ארוחה זוגית מפנקת + הכרה מיוחדת 🏆',
        prizes: [
          { name: 'קפה ומאפה', val: '50' },
          { name: 'ארוחה במסעדה', val: '150' },
          { name: 'ארוחת זוגות', val: '400' },
        ],
      }
    : {
        badge: 'The Prizes',
        title: 'Three Goals, Three Prizes',
        verifiedLabel: 'Verified',
        grandPrizeBadge: '1st Place Prize',
        grandPrizeTitle: 'Top referrer wins:',
        grandPrizeDesc: "Luxurious Couple's Dinner + Recognition 🏆",
        prizes: [
          { name: 'Coffee & Pastry', val: '50' },
          { name: 'Restaurant Meal', val: '150' },
          { name: "Couple's Dinner", val: '400' },
        ],
      };

  const prizesData = [
    {
      threshold: 3,
      prize: content.prizes[0].name,
      value: content.prizes[0].val,
      icon: <Coffee className="w-8 h-8" />,
      gradient: 'from-teal-400 to-emerald-500',
      bg: 'from-teal-50 to-emerald-50',
    },
    {
      threshold: 7,
      prize: content.prizes[1].name,
      value: content.prizes[1].val,
      icon: <UtensilsCrossed className="w-8 h-8" />,
      gradient: 'from-orange-400 to-amber-500',
      bg: 'from-orange-50 to-amber-50',
    },
    {
      threshold: 15,
      prize: content.prizes[2].name,
      value: content.prizes[2].val,
      icon: <Heart className="w-8 h-8" />,
      gradient: 'from-rose-400 to-pink-500',
      bg: 'from-rose-50 to-pink-50',
    },
  ];

  return (
    <section ref={ref} className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-amber-100 rounded-full px-5 py-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-600" />
            <span className="font-bold text-amber-700">{content.badge}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
            {content.title}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {prizesData.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className={`bg-gradient-to-br ${p.bg} rounded-3xl p-8 shadow-xl border border-white/60 text-center relative overflow-hidden group`}
            >
              <div
                className={`absolute top-3 left-3 bg-gradient-to-br ${p.gradient} text-white text-xs font-bold px-3 py-1 rounded-full`}
              >
                {p.threshold}+ {content.verifiedLabel}
              </div>
              <div
                className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${p.gradient} flex items-center justify-center text-white mb-4 shadow-xl group-hover:rotate-6 transition-transform`}
              >
                {p.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {p.prize}
              </h3>
              <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-orange-600">
                ₪{p.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Grand Prize */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className={`mt-10 bg-gradient-to-br from-amber-50 via-white to-orange-50 rounded-3xl p-8 shadow-2xl border-2 border-amber-200/50 flex flex-col md:flex-row items-center gap-6 text-center ${isHebrew ? 'md:text-right' : 'md:text-left'}`}
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-red-500 flex items-center justify-center shadow-2xl flex-shrink-0">
            <Crown className="w-12 h-12 text-white" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-100 rounded-full px-4 py-1 mb-2 text-sm">
              <Trophy className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-amber-700">
                {content.grandPrizeBadge}
              </span>
            </div>
            <h3 className="text-2xl font-extrabold text-gray-900">
              {content.grandPrizeTitle}
            </h3>
            <p className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-red-600 font-bold">
              {content.grandPrizeDesc}
            </p>
          </div>
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

  const content = isHebrew
    ? {
        title: 'הצטרפו עכשיו!',
        subtitle: 'מלאו פרטים וקבלו קישור אישי',
        labels: {
          name: 'שם מלא *',
          email: 'אימייל *',
          phone: 'טלפון (אופציונלי)',
          code: 'קוד מועדף (אופציונלי)',
        },
        placeholders: {
          name: 'ישראל ישראלי',
          email: 'email@example.com',
          phone: '050-1234567',
          code: 'DAVID',
        },
        buttons: {
          submit: 'קבלו קישור',
          submitting: 'נרשמים...',
          copy: 'העתק',
          copied: 'הועתק',
          whatsapp: 'שתפו בוואטסאפ',
          dashboard: 'דשבורד',
        },
        messages: {
          linkText: 'הקישור:',
          codeTaken: 'הקוד תפוס',
          successTitle: 'נרשמתם בהצלחה!',
          successDesc: 'הנה הקישור האישי שלכם:',
          whatsappShare: 'היי! 👋\nהמלצה על NeshamaTech:\n',
          genericError: 'שגיאה',
        },
      }
    : {
        title: 'Join Now!',
        subtitle: 'Fill in details & get your personal link',
        labels: {
          name: 'Full Name *',
          email: 'Email *',
          phone: 'Phone (Optional)',
          code: 'Preferred Code (Optional)',
        },
        placeholders: {
          name: 'John Doe',
          email: 'email@example.com',
          phone: '050-1234567',
          code: 'DAVID',
        },
        buttons: {
          submit: 'Get Link',
          submitting: 'Registering...',
          copy: 'Copy',
          copied: 'Copied',
          whatsapp: 'Share on WhatsApp',
          dashboard: 'Dashboard',
        },
        messages: {
          linkText: 'Link:',
          codeTaken: 'Code taken',
          successTitle: 'Registered Successfully!',
          successDesc: 'Here is your personal link:',
          whatsappShare: 'Hey! 👋\nCheck out NeshamaTech:\n',
          genericError: 'Error',
        },
      };

  useEffect(() => {
    if (!form.code || form.code.length < 3) {
      setCodeStatus('idle');
      return;
    }
    const t = setTimeout(async () => {
      setCodeStatus('checking');
      try {
        const r = await fetch(`/api/referral/register?code=${form.code}`);
        const d = await r.json();
        setCodeStatus(d.available ? 'available' : 'taken');
      } catch {
        setCodeStatus('idle');
      }
    }, 500);
    return () => clearTimeout(t);
  }, [form.code]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/referral/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          preferredCode: form.code,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || content.messages.genericError);
      setGeneratedCode(d.referrer.code);
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : content.messages.genericError);
    }
    setLoading(false);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(
      `${window.location.origin}/r/${generatedCode}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsapp = () => {
    const url = `${window.location.origin}/r/${generatedCode}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${content.messages.whatsappShare}${url}`)}`,
      '_blank'
    );
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
              <div className="text-center mb-8">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-teal-500 to-orange-500 flex items-center justify-center text-white mb-4 shadow-lg">
                  <Send className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900">
                  {content.title}
                </h2>
                <p className="text-gray-600">{content.subtitle}</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              <form onSubmit={submit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {content.labels.name}
                  </label>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={content.placeholders.name}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {content.labels.email}
                  </label>
                  <Input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder={content.placeholders.email}
                    className="h-12 rounded-xl"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {content.labels.phone}
                  </label>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder={content.placeholders.phone}
                    className="h-12 rounded-xl"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {content.labels.code}
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
                      placeholder={content.placeholders.code}
                      maxLength={15}
                      className={`h-12 rounded-xl font-mono ${isHebrew ? 'pl-10' : 'pr-10'}`}
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
                  <p className="text-xs text-gray-500 mt-1">
                    {content.messages.linkText} neshamatech.com/r/
                    {form.code || 'YOURCODE'}
                  </p>
                  {codeStatus === 'taken' && (
                    <p className="text-xs text-red-500">
                      {content.messages.codeTaken}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={loading || codeStatus === 'taken'}
                  className="w-full h-12 text-lg font-bold bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 text-white rounded-xl"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                      {content.buttons.submitting}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 ml-2" />
                      {content.buttons.submit}
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
              className="bg-gradient-to-br from-teal-50 via-white to-orange-50 rounded-3xl p-8 shadow-2xl border border-teal-200/50 text-center"
            >
              <div className="text-4xl mb-2">🎉</div>
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mb-4 shadow-xl">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
                {content.messages.successTitle}
              </h2>
              <p className="text-gray-600 mb-6">
                {content.messages.successDesc}
              </p>
              <div className="bg-white rounded-xl p-4 shadow border border-gray-100 mb-6">
                <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg p-3">
                  <code
                    className="text-teal-600 font-mono truncate flex-1"
                    dir="ltr"
                  >
                    {window.location.origin}/r/{generatedCode}
                  </code>
                  <Button onClick={copy} variant="outline" size="sm">
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 ml-1" />
                        {content.buttons.copied}
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 ml-1" />
                        {content.buttons.copy}
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={whatsapp}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-5 rounded-xl"
                >
                  <MessageCircle className="w-5 h-5 ml-2" />
                  {content.buttons.whatsapp}
                </Button>
                <Button
                  onClick={() =>
                    window.open(
                      `/${locale}/referral/dashboard?code=${generatedCode}`,
                      '_blank'
                    )
                  }
                  variant="outline"
                  className="px-6 py-5 rounded-xl"
                >
                  <TrendingUp className="w-5 h-5 ml-2" />
                  {content.buttons.dashboard}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

// ================== Existing Referrer Login ==================
const ExistingReferrerSection: React.FC<{ locale: string }> = ({ locale }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [searchValue, setSearchValue] = useState('');
  const [searchType, setSearchType] = useState<'code' | 'email' | 'phone'>(
    'code'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isHebrew = locale === 'he';

  const content = isHebrew
    ? {
        title: 'כבר נרשמתם?',
        subtitle: 'הכניסו את הפרטים שלכם לצפייה בדשבורד',
        tabs: { code: 'קוד', email: 'אימייל', phone: 'טלפון' },
        placeholders: {
          code: 'הקוד שלכם (למשל: DAVID)',
          email: 'כתובת האימייל',
          phone: 'מספר הטלפון',
        },
        button: { search: 'לדשבורד שלי', searching: 'מחפש...' },
        errors: {
          notFound: 'לא נמצא מפנה עם הפרטים האלה',
          generic: 'שגיאה בחיפוש',
        },
      }
    : {
        title: 'Already registered?',
        subtitle: 'Enter your details to view your dashboard',
        tabs: { code: 'Code', email: 'Email', phone: 'Phone' },
        placeholders: {
          code: 'Your code (e.g. DAVID)',
          email: 'Email address',
          phone: 'Phone number',
        },
        button: { search: 'Go to my dashboard', searching: 'Searching...' },
        errors: {
          notFound: 'No referrer found with these details',
          generic: 'Search error',
        },
      };

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
        setError(content.errors.notFound);
      }
    } catch (err) {
      setError(content.errors.generic);
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
          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-slate-100 to-gray-200 flex items-center justify-center mb-3">
              <KeyRound className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">{content.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{content.subtitle}</p>
          </div>

          {/* Tabs for search type */}
          <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-xl">
            {[
              { type: 'code' as const, label: content.tabs.code },
              { type: 'email' as const, label: content.tabs.email },
              { type: 'phone' as const, label: content.tabs.phone },
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

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={content.placeholders[searchType]}
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
                  {content.button.searching}
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 ml-2" />
                  {content.button.search}
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

// ================== FAQ ==================
const FAQSection: React.FC<{ locale: string }> = ({ locale }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [open, setOpen] = useState<number | null>(null);
  const isHebrew = locale === 'he';

  const title = isHebrew ? 'שאלות נפוצות' : 'Frequently Asked Questions';
  const faqs = isHebrew
    ? [
        {
          q: 'איך הפרסים עובדים?',
          a: 'כל חבר שנרשם ומאמת טלפון = נקודה. 3 נקודות = קפה, 7 = ארוחה, 15 = ארוחת זוגות.',
        },
        { q: 'מתי מקבלים את הפרסים?', a: 'הפרסים מחולקים בסוף כל חודש.' },
        { q: 'האם יש הגבלה?', a: 'לא! אין הגבלה על מספר ההפניות.' },
        {
          q: 'איך עוקבים אחרי ההתקדמות?',
          a: 'יש לכם דשבורד אישי שמראה את כל הסטטיסטיקות.',
        },
      ]
    : [
        {
          q: 'How do prizes work?',
          a: "Every friend who registers & verifies phone = 1 point. 3 points = Coffee, 7 = Meal, 15 = Couple's Dinner.",
        },
        {
          q: 'When are prizes distributed?',
          a: 'Prizes are distributed at the end of each month.',
        },
        {
          q: 'Is there a limit?',
          a: 'No! There is no limit on the number of referrals.',
        },
        {
          q: 'How do I track progress?',
          a: 'You have a personal dashboard showing all statistics.',
        },
      ];

  return (
    <section ref={ref} className="py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="text-3xl font-extrabold text-center text-gray-900 mb-10"
        >
          {title}
        </motion.h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1 }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className={`w-full bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/60 hover:shadow-xl transition-all ${isHebrew ? 'text-right' : 'text-left'}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-bold text-gray-800">{faq.q}</h3>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${open === i ? 'rotate-180' : ''}`}
                  />
                </div>
                <AnimatePresence>
                  {open === i && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="text-gray-600 mt-3 overflow-hidden"
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

// ================== Main Page ==================
export default function FriendsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'he';
  const formRef = useRef<HTMLDivElement>(null);
  const scrollToForm = () =>
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  return (
    <main
      className="min-h-screen relative"
      dir={locale === 'he' ? 'rtl' : 'ltr'}
    >
      <DynamicBackground />
      <HeroSection locale={locale} onScrollToForm={scrollToForm} />
      <HowItWorksSection locale={locale} />
      <PrizesSection locale={locale} />
      <SignupForm locale={locale} formRef={formRef} />
      <ExistingReferrerSection locale={locale} />
      <FAQSection locale={locale} />
      <style>{`
        @keyframes float-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        .animate-float-slow { animation: float-slow 15s ease-in-out infinite; }
        @keyframes gradient { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .animate-gradient { background-size: 200% 200%; animation: gradient 4s ease-in-out infinite; }
      `}</style>
    </main>
  );
}
