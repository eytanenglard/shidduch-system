// src/app/[locale]/friends/page.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  Gift, 
  Users, 
  Link as LinkIcon, 
  Trophy, 
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Share2,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

// ================== Types ==================

interface PrizeTier {
  threshold: number;
  prize: string;
  icon: React.ReactNode;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  preferredCode: string;
  agreeToTerms: boolean;
}

interface RegistrationResult {
  code: string;
  shareUrl: string;
  dashboardUrl: string;
}

// ================== Constants ==================

const PRIZE_TIERS: PrizeTier[] = [
  { threshold: 3, prize: 'שובר קפה בשווי 50₪', icon: <Gift className="w-5 h-5" /> },
  { threshold: 7, prize: 'שובר מסעדה בשווי 150₪', icon: <Gift className="w-5 h-5" /> },
  { threshold: 15, prize: 'ארוחה זוגית עד 400₪', icon: <Trophy className="w-5 h-5" /> },
];

const GRAND_PRIZE = {
  title: 'פרס ראשון בתחרות',
  prize: 'ארוחה זוגית פרימיום + הכרת תודה מיוחדת',
};

// ================== Hero Section ==================

const HeroSection: React.FC<{ onScrollToForm: () => void }> = ({ onScrollToForm }) => {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-orange-50" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-teal-200/30 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '-3s' }} />
      
      <div className="relative z-10 container mx-auto px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-teal-100 mb-6">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-gray-700">קמפיין חברים מביאים חברים</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            עזרו לחברים למצוא אהבה
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500">
              ותזכו בפרסים
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            מכירים רווקים איכותיים שמחפשים קשר אמיתי?
            <br />
            שלחו להם את הקישור שלכם ועזרו להם להצטרף ל-NeshamaTech
          </p>

          {/* CTA Button */}
          <Button
            size="lg"
            onClick={onScrollToForm}
            className="text-lg px-8 py-6 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            אני רוצה להשתתף
            <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          </Button>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="w-6 h-6 text-gray-400 animate-bounce" />
        </motion.div>
      </div>

      {/* Custom styles */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-15px) translateX(10px); }
          50% { transform: translateY(-5px) translateX(20px); }
          75% { transform: translateY(-10px) translateX(5px); }
        }
        .animate-float-slow {
          animation: float-slow 12s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

// ================== How It Works Section ==================

const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      number: '1',
      title: 'הירשמו וקבלו קישור',
      description: 'מלאו את הטופס הקצר וקבלו קישור אישי ייחודי לכם',
      icon: <LinkIcon className="w-6 h-6" />,
      color: 'teal',
    },
    {
      number: '2',
      title: 'שתפו עם חברים',
      description: 'שלחו את הקישור לחברים רווקים שמחפשים קשר רציני',
      icon: <Share2 className="w-6 h-6" />,
      color: 'orange',
    },
    {
      number: '3',
      title: 'צברו נקודות',
      description: 'על כל חבר שנרשם ומאמת את הטלפון - אתם צוברים נקודות',
      icon: <Users className="w-6 h-6" />,
      color: 'rose',
    },
    {
      number: '4',
      title: 'קבלו פרסים',
      description: 'ככל שתביאו יותר חברים - הפרסים משתדרגים!',
      icon: <Gift className="w-6 h-6" />,
      color: 'amber',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
      rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    };
    return colors[color] || colors.teal;
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">איך זה עובד?</h2>
          <p className="text-gray-600 max-w-xl mx-auto">ארבעה צעדים פשוטים להשתתפות בקמפיין</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const colors = getColorClasses(step.color);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative p-6 rounded-2xl ${colors.bg} border ${colors.border} hover:shadow-lg transition-shadow duration-300`}
              >
                <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white ${colors.text} border-2 ${colors.border} flex items-center justify-center font-bold text-sm shadow-sm`}>
                  {step.number}
                </div>
                <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center mb-4 border ${colors.border}`}>
                  {step.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ================== Prizes Section ==================

const PrizesSection: React.FC = () => {
  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">הפרסים שמחכים לכם</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            ככל שתביאו יותר חברים שנרשמים ומאמתים טלפון - כך הפרסים משתדרגים
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {PRIZE_TIERS.map((tier, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-orange-400 to-amber-400" />
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-100 to-orange-100 flex items-center justify-center text-orange-600">
                  {tier.icon}
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">{tier.threshold}+</div>
                  <div className="text-sm text-gray-500">חברים מאומתים</div>
                </div>
              </div>
              <p className="font-medium text-gray-800">{tier.prize}</p>
            </motion.div>
          ))}
        </div>

        {/* Grand Prize */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 p-1"
        >
          <div className="bg-white rounded-[22px] p-8 text-center">
            <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{GRAND_PRIZE.title}</h3>
            <p className="text-lg text-gray-700">{GRAND_PRIZE.prize}</p>
            <p className="text-sm text-gray-500 mt-2">למי שיביא הכי הרבה חברים עד סוף הקמפיין</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// ================== Signup Form Section ==================

const SignupFormSection: React.FC<{ formRef: React.RefObject<HTMLDivElement | null> }> = ({ formRef }) => {  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    preferredCode: '',
    agreeToTerms: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codeStatus, setCodeStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!formData.preferredCode || formData.preferredCode.length < 3) {
      setCodeStatus('idle');
      return;
    }

    const timer = setTimeout(async () => {
      setCodeStatus('checking');
      try {
        const res = await fetch(`/api/referral/register?code=${formData.preferredCode}`);
        const data = await res.json();
        setCodeStatus(data.available ? 'available' : 'taken');
      } catch {
        setCodeStatus('idle');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.preferredCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/referral/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          preferredCode: formData.preferredCode || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResult(data.referrer);
      } else {
        setError(data.error === 'CODE_TAKEN' ? 'הקוד הזה כבר תפוס, נסו אחר' : 'אירעה שגיאה, נסו שוב');
      }
    } catch {
      setError('אירעה שגיאה בתקשורת, נסו שוב');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Success state
  if (result) {
    return (
      <section ref={formRef} className="py-16 bg-gradient-to-br from-teal-50 via-white to-orange-50">
        <div className="container mx-auto px-4 max-w-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl p-8 text-center border border-teal-100"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">מעולה! נרשמתם בהצלחה</h2>
            <p className="text-gray-600 mb-6">הקוד האישי שלכם הוא: <strong className="text-teal-600">{result.code}</strong></p>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <Label className="text-sm text-gray-600 mb-2 block">הקישור שלכם לשיתוף:</Label>
              <div className="flex gap-2">
                <Input value={result.shareUrl} readOnly className="text-center font-mono text-sm" />
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className={copied ? 'bg-teal-50 text-teal-600 border-teal-200' : ''}
                >
                  {copied ? 'הועתק!' : 'העתק'}
                </Button>
              </div>
            </div>

            <Button
              onClick={() => {
                const text = encodeURIComponent(`היי! אני רוצה להמליץ לך על NeshamaTech - מערכת שידוכים מיוחדת שמתמקדת באנשים ולא בסווייפים. הנה הקישור להרשמה: ${result.shareUrl}`);
                window.open(`https://wa.me/?text=${text}`, '_blank');
              }}
              className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white mb-4"
            >
              <Share2 className="ml-2 w-4 h-4" />
              שתפו בוואטסאפ
            </Button>

            <a href={result.dashboardUrl} className="text-teal-600 hover:text-teal-700 text-sm font-medium">
              לדשבורד האישי שלי →
            </a>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section ref={formRef} className="py-16 bg-gradient-to-br from-teal-50 via-white to-orange-50">
      <div className="container mx-auto px-4 max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl shadow-xl p-8 border border-teal-100"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">הצטרפו לקמפיין</h2>
            <p className="text-gray-600">מלאו את הפרטים וקבלו את הקישור האישי שלכם</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="name" className="text-gray-700">שם מלא *</Label>
              <Input
                id="name"
                type="text"
                required
                placeholder="איך קוראים לכם?"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-gray-700">אימייל</Label>
              <Input
                id="email"
                type="email"
                placeholder="לקבלת עדכונים על הפרסים"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1"
                dir="ltr"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-gray-700">טלפון</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="ליצירת קשר לגבי הפרסים"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1"
                dir="ltr"
              />
            </div>

            <div>
              <Label htmlFor="preferredCode" className="text-gray-700">קוד אישי (אופציונלי)</Label>
              <Input
                id="preferredCode"
                type="text"
                placeholder="למשל: DAVID או SARA"
                value={formData.preferredCode}
                onChange={(e) => setFormData({ ...formData, preferredCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                className="mt-1 font-mono"
                dir="ltr"
                maxLength={15}
              />
              <p className="text-xs text-gray-500 mt-1">אותיות באנגלית ומספרים בלבד, 3-15 תווים</p>
              {codeStatus === 'checking' && <p className="text-xs text-gray-500 mt-1">בודק זמינות...</p>}
              {codeStatus === 'available' && <p className="text-xs text-teal-600 mt-1">✓ הקוד פנוי!</p>}
              {codeStatus === 'taken' && <p className="text-xs text-red-500 mt-1">✗ הקוד תפוס, נסו אחר</p>}
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: !!checked })}
                className="mt-1"
              />
              <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                אני מאשר/ת שאשתף את הקישור רק עם אנשים שמחפשים קשר רציני ושהמידע שמסרתי נכון
              </Label>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">{error}</div>
            )}

            <Button
              type="submit"
              disabled={!formData.name || !formData.agreeToTerms || isSubmitting || codeStatus === 'taken'}
              className="w-full py-6 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 text-white rounded-xl shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? 'נרשמים...' : 'קבלו את הקישור שלכם'}
            </Button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

// ================== FAQ Section ==================

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'מה נחשב "חבר מאומת"?',
      answer: 'חבר מאומת הוא מישהו שנרשם דרך הקישור שלכם והשלים אימות טלפון. רק אז הוא נספר לטובת הפרסים שלכם.',
    },
    {
      question: 'איך אני יודע כמה חברים הבאתי?',
      answer: 'יש לכם דשבורד אישי שמראה בזמן אמת כמה לחצו על הקישור, כמה נרשמו וכמה אימתו טלפון. הקישור לדשבורד נשלח אליכם אחרי ההרשמה.',
    },
    {
      question: 'מתי מקבלים את הפרסים?',
      answer: 'פרסי הסף (קפה, מסעדה) נשלחים בסוף כל שבוע למי שעבר את הסף. פרס המקום הראשון יוענק בסיום הקמפיין.',
    },
    {
      question: 'האם אפשר לשתף את הקישור גם בפייסבוק?',
      answer: 'בהחלט! אתם יכולים לשתף את הקישור בכל פלטפורמה - וואטסאפ, פייסבוק, אינסטגרם, או לשלוח ישירות לחברים.',
    },
    {
      question: 'מה קורה אם הקוד שרציתי תפוס?',
      answer: 'המערכת תציע לכם קוד חלופי אוטומטית. אתם גם יכולים לנסות קודים אחרים עד שתמצאו אחד פנוי.',
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">שאלות נפוצות</h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-right flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{faq.question}</span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openIndex === index ? 'rotate-180' : ''}`} />
              </button>
              {openIndex === index && (
                <div className="px-6 py-4 bg-gray-50 text-gray-600 text-sm leading-relaxed">{faq.answer}</div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ================== Main Page Component ==================

export default function FriendsPage() {
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <main className="min-h-screen" dir="rtl">
      <HeroSection onScrollToForm={scrollToForm} />
      <HowItWorksSection />
      <PrizesSection />
      <SignupFormSection formRef={formRef} />
      <FAQSection />
      
      <footer className="py-8 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Image src="/logo.png" alt="NeshamaTech" width={32} height={32} />
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-orange-600">
              NeshamaTech
            </span>
          </div>
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} NeshamaTech. כל הזכויות שמורות.</p>
        </div>
      </footer>
    </main>
  );
}