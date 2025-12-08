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
          <span className="font-bold text-amber-700">
            קמפיין מיוחד לזמן מוגבל
          </span>
          <Sparkles className="w-5 h-5 text-orange-500" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight"
        >
          חברים מביאים
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 animate-gradient">
            את הזיווג שלהם
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10"
        >
          הזמינו חברים ל-NeshamaTech וקבלו פרסים מדהימים.
          <br />
          <span className="font-semibold text-teal-700">
            המפנה המוביל יזכה בארוחת זוגות מפנקת! 🎉
          </span>
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
            רוצה להצטרף? בואו נתחיל!
            <ArrowLeft className="w-6 h-6 mr-2 group-hover:-translate-x-1 transition-transform" />
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1 }}
          className="flex flex-wrap justify-center gap-6 mt-12"
        >
          {[
            { value: '3', label: 'פרסים', icon: Gift },
            { value: '₪400', label: 'פרס ראשון', icon: Trophy },
            { value: '∞', label: 'ללא הגבלה', icon: Users },
          ].map((stat, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-lg border border-white/60"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-100 to-orange-100 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-teal-600" />
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-600">{stat.label}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
};

// ================== How It Works ==================
const HowItWorksSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const steps = [
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
  ];

  return (
    <section ref={ref} className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="text-3xl md:text-4xl font-extrabold text-center text-gray-900 mb-12"
        >
          איך זה עובד?
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
const PrizesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const prizes = [
    {
      threshold: 3,
      prize: 'קפה ומאפה',
      value: 50,
      icon: <Coffee className="w-8 h-8" />,
      gradient: 'from-teal-400 to-emerald-500',
      bg: 'from-teal-50 to-emerald-50',
    },
    {
      threshold: 7,
      prize: 'ארוחה במסעדה',
      value: 150,
      icon: <UtensilsCrossed className="w-8 h-8" />,
      gradient: 'from-orange-400 to-amber-500',
      bg: 'from-orange-50 to-amber-50',
    },
    {
      threshold: 15,
      prize: 'ארוחת זוגות',
      value: 400,
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
            <span className="font-bold text-amber-700">הפרסים</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
            שלושה יעדים, שלושה פרסים
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {prizes.map((p, i) => (
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
                {p.threshold}+ מאומתים
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
          className="mt-10 bg-gradient-to-br from-amber-50 via-white to-orange-50 rounded-3xl p-8 shadow-2xl border-2 border-amber-200/50 flex flex-col md:flex-row items-center gap-6 text-center md:text-right"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-red-500 flex items-center justify-center shadow-2xl flex-shrink-0">
            <Crown className="w-12 h-12 text-white" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-100 rounded-full px-4 py-1 mb-2 text-sm">
              <Trophy className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-amber-700">פרס מקום ראשון</span>
            </div>
            <h3 className="text-2xl font-extrabold text-gray-900">
              המפנה המוביל יזכה ב:
            </h3>
            <p className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-red-600 font-bold">
              ארוחה זוגית מפנקת + הכרה מיוחדת 🏆
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
      if (!r.ok) throw new Error(d.error || 'שגיאה');
      setGeneratedCode(d.referrer.code);
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה');
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
      `https://wa.me/?text=${encodeURIComponent(`היי! 👋\nהמלצה על NeshamaTech:\n${url}`)}`,
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
                  הצטרפו עכשיו!
                </h2>
                <p className="text-gray-600">מלאו פרטים וקבלו קישור אישי</p>
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
                    שם מלא *
                  </label>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="ישראל ישראלי"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    אימייל *
                  </label>
                  <Input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="email@example.com"
                    className="h-12 rounded-xl"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    טלפון (אופציונלי)
                  </label>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="050-1234567"
                    className="h-12 rounded-xl"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    קוד מועדף (אופציונלי)
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
                      placeholder="DAVID"
                      maxLength={15}
                      className="h-12 rounded-xl font-mono pl-10"
                      dir="ltr"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
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
                    הקישור: neshamatech.com/r/{form.code || 'YOURCODE'}
                  </p>
                  {codeStatus === 'taken' && (
                    <p className="text-xs text-red-500">הקוד תפוס</p>
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
                      נרשמים...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 ml-2" />
                      קבלו קישור
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
                נרשמתם בהצלחה!
              </h2>
              <p className="text-gray-600 mb-6">הנה הקישור האישי שלכם:</p>
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
                        הועתק
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 ml-1" />
                        העתק
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
                  שתפו בוואטסאפ
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
                  דשבורד
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setLoading(true);
    setError('');

    try {
      // חיפוש לפי סוג
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
        // מצאנו - נעבור לדשבורד
        window.location.href = `/${locale}/referral/dashboard?code=${data.code}`;
      } else {
        setError(
          locale === 'he'
            ? 'לא נמצא מפנה עם הפרטים האלה'
            : 'No referrer found with these details'
        );
      }
    } catch (err) {
      setError(locale === 'he' ? 'שגיאה בחיפוש' : 'Search error');
    } finally {
      setLoading(false);
    }
  };

  const placeholders = {
    code:
      locale === 'he' ? 'הקוד שלכם (למשל: DAVID)' : 'Your code (e.g. DAVID)',
    email: locale === 'he' ? 'כתובת האימייל' : 'Email address',
    phone: locale === 'he' ? 'מספר הטלפון' : 'Phone number',
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
            <h3 className="text-xl font-bold text-gray-800">
              {locale === 'he' ? 'כבר נרשמתם?' : 'Already registered?'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {locale === 'he'
                ? 'הכניסו את הפרטים שלכם לצפייה בדשבורד'
                : 'Enter your details to view your dashboard'}
            </p>
          </div>

          {/* Tabs for search type */}
          <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-xl">
            {[
              {
                type: 'code' as const,
                label: locale === 'he' ? 'קוד' : 'Code',
              },
              {
                type: 'email' as const,
                label: locale === 'he' ? 'אימייל' : 'Email',
              },
              {
                type: 'phone' as const,
                label: locale === 'he' ? 'טלפון' : 'Phone',
              },
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
                placeholder={placeholders[searchType]}
                className="h-12 rounded-xl pr-4 pl-12"
                dir={
                  searchType === 'code'
                    ? 'ltr'
                    : searchType === 'email'
                      ? 'ltr'
                      : 'ltr'
                }
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                  {locale === 'he' ? 'מחפש...' : 'Searching...'}
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 ml-2" />
                  {locale === 'he' ? 'לדשבורד שלי' : 'Go to my dashboard'}
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
const FAQSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
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
  ];

  return (
    <section ref={ref} className="py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="text-3xl font-extrabold text-center text-gray-900 mb-10"
        >
          שאלות נפוצות
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
                className="w-full bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/60 text-right hover:shadow-xl transition-all"
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
      <HowItWorksSection />
      <PrizesSection />
      <SignupForm locale={locale} formRef={formRef} />
      <ExistingReferrerSection locale={locale} />
      <FAQSection />
      <style>{`
        @keyframes float-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        .animate-float-slow { animation: float-slow 15s ease-in-out infinite; }
        @keyframes gradient { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .animate-gradient { background-size: 200% 200%; animation: gradient 4s ease-in-out infinite; }
      `}</style>
    </main>
  );
}
