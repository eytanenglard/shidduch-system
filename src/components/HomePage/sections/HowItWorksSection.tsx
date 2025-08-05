// src/components/HomePage/sections/HowItWorksSection.tsx

import React, { useRef } from 'react';
import Image from 'next/image';
import { getRelativeCloudinaryPath } from '@/lib/utils';
import Step from '../components/Step';
import { LiveSuggestionDemo } from '../components/LiveSuggestionDemo';
import {
  demoSuggestionDataFemale,
  demoSuggestionDataMale,
  demoAiAnalysisForDaniel,
  demoAiAnalysisForNoa,
} from '../components/demo-data';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  Heart,
  Users,
  CheckCircle,
  Quote,
  Star,
  Shield,
  Target,
  Lightbulb,
  TrendingUp,
  Award,
  HeartHandshake,
  UserCheck,
} from 'lucide-react';
import { motion, useInView } from 'framer-motion';

// --- Helper Components (UNCHANGED) ---

const DynamicBackground: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 opacity-3">
      <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full blur-2xl animate-pulse-slow" />
      <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-pink-400/20 to-purple-500/20 rounded-full blur-xl animate-float-slow" />
      <div
        className="absolute bottom-32 left-1/4 w-40 h-40 bg-gradient-to-br from-orange-400/15 to-red-500/15 rounded-full blur-3xl animate-pulse-slow"
        style={{ animationDelay: '2s' }}
      />
      <div
        className="absolute bottom-10 right-10 w-28 h-28 bg-gradient-to-br from-green-400/20 to-teal-500/20 rounded-full blur-2xl animate-float-slow"
        style={{ animationDelay: '1s' }}
      />
    </div>
    <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:20px_20px]" />
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1000 1000"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="dynamicGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path
        d="M0,200 C300,100 700,300 1000,200 L1000,0 L0,0 Z"
        fill="url(#dynamicGrad1)"
        className="animate-pulse-slow"
      />
      <path
        d="M0,800 C300,700 700,900 1000,800 L1000,1000 L0,1000 Z"
        fill="url(#dynamicGrad1)"
        className="animate-pulse-slow"
        style={{ animationDelay: '3s' }}
      />
    </svg>
  </div>
);

const KeyBenefit: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'cyan' | 'pink' | 'orange' | 'green';
  delay?: number;
}> = ({ icon, title, description, color, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const colorClasses = {
    cyan: 'from-cyan-500 to-cyan-600',
    pink: 'from-pink-500 to-pink-600',
    orange: 'from-orange-500 to-orange-600',
    green: 'from-green-500 to-green-600',
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay }}
      className="text-center group"
    >
      <div
        className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
      >
        {icon}
      </div>
      <h4 className="font-bold text-lg text-gray-800 mb-2">{title}</h4>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
};

// --- Main Component with UPDATED TEXT ---
const HowItWorksSection: React.FC = () => {
  const demoRef = useRef(null);
  const isDemoInView = useInView(demoRef, { once: true, amount: 0.1 });

  return (
    <section
      id="how-it-works"
      className="relative pb-20 md:pb-28 px-4 bg-gradient-to-b from-white via-cyan-50/20 to-white overflow-hidden"
    >
      <DynamicBackground />

      <div className="relative max-w-7xl mx-auto">
        {/* --- Chapter 1: The Promise (UPDATED) --- */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1 }}
          className="text-center mb-20"
        >
          <div className="inline-block mb-6">
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-white/60">
              <Sparkles className="w-6 h-6 text-cyan-500" />
              <span className="text-cyan-700 font-semibold">
                שיטה חכמה, תוצאה אנושית
              </span>
            </div>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-800 mb-8 leading-tight">
            מהחלטה אמיצה,
            <br />ל
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-pink-600">
              הצעה שמרגישה נכון
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
            אנו מבינים את המסע שלכם. לכן בנינו תהליך המשלב טכנולוגיה חכמה עם
            ליווי אנושי וחם.
            <br />
            <span className="text-cyan-700 font-semibold">
              המטרה המשותפת שלנו: להוביל אתכם אל הרגע המרגש בו תקבלו הצעה שתבינו
              מיד למה היא נכונה עבורכם.
            </span>
          </p>
        </motion.div>

        {/* --- Chapter 2: The Process (UPDATED) --- */}
        <div className="relative mb-20">
          <div className="absolute inset-0 -m-8 bg-gradient-to-br from-cyan-50/50 via-white/80 to-pink-50/50 rounded-3xl backdrop-blur-sm border border-white/40 shadow-2xl" />
          <div className="relative max-w-5xl mx-auto space-y-12 p-8">
            <Step
              number="1"
              title="שלב 1: מסע היכרות אישי"
              description={
                <>
                  זהו הלב של השיטה שלנו. לא עוד טופס, אלא הזמנה למסע אישי שחושף
                  את מה שבאמת חשוב לכם. התשובות המעמיקות שלכם הן המצפן שלנו
                  למציאת התאמות משמעותיות.{' '}
                  <Link
                    href="/questionnaire"
                    className="font-bold text-cyan-600 hover:underline"
                  >
                    התחילו את המסע כאן.
                  </Link>
                </>
              }
              color="cyan"
            />
            <Step
              number="2"
              title="שלב 2: בניית הפרופיל המנצח"
              description="השדכן האישי שלכם לומד את הפרופיל, והמערכת החכמה שלנו מציעה תובנות לשיפור. יחד, אנו מוודאים שהסיפור שלכם מסופר בצורה הטובה והמדויקת ביותר."
              color="green"
            />
            <Step
              number="3"
              title="שלב 3: טכנולוגיה פוגשת אינטואיציה"
              description="האלגוריתם שלנו מסנן אלפי אפשרויות כדי למצוא פוטנציאל. אז, השדכן שלכם נכנס לתמונה עם ניסיון ואינטואיציה אנושית כדי לאשר רק את ההצעות המבטיחות ביותר."
              color="orange"
            />
            <Step
              number="4"
              title="שלב 4: מהצעה מנומקת לדייט מוצלח"
              description="תקבלו הצעות עם נימוק ברור – 'למה אנחנו מאמינים שזה יכול לעבוד'. מכאן, אנחנו מלווים אתכם בתקשורת הראשונית, מעניקים תמיכה ומקשיבים לפידבק שלכם."
              isLast={true}
              color="pink"
            />
          </div>
        </div>

        {/* --- Key Benefits (UPDATED) --- */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">
            הגישה שלנו,
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-pink-600">
              {' '}
              היתרון שלכם
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <KeyBenefit
              icon={<TrendingUp className="w-8 h-8 text-white" />}
              title="יעילות ומיקוד"
              description="חסכו זמן ואנרגיה. המערכת מסננת עבורכם רק את ההצעות הרלוונטיות ביותר, כדי שתוכלו להתמקד במה שחשוב באמת."
              color="cyan"
              delay={0.1}
            />
            <KeyBenefit
              icon={<Award className="w-8 h-8 text-white" />}
              title="איכות ללא פשרות"
              description="כל הצעה עוברת בדיקה כפולה: סינון אלגוריתמי קפדני ואישור סופי של שדכן מנוסה. לא תקבלו הצעות ‘על הדרך’."
              color="pink"
              delay={0.2}
            />
            <KeyBenefit
              icon={<Lightbulb className="w-8 h-8 text-white" />}
              title="מערכת שלומדת אתכם"
              description="המערכת החכמה שלנו לומדת מהפידבק שלכם ומשתפרת עם כל אינטראקציה, כך שההצעות הבאות יהיו מדויקות עוד יותר."
              color="orange"
              delay={0.3}
            />
            <KeyBenefit
              icon={<HeartHandshake className="w-8 h-8 text-white" />}
              title="אתם לא לבד במסע"
              description="שדכן אישי מלווה אתכם, זמין לשאלות, מעניק כלים ונותן רוח גבית מהרגע הראשון ועד למציאת הזיווג."
              color="green"
              delay={0.4}
            />
          </div>
        </motion.div>

        {/* --- Chapter 3: The Proof (UPDATED) --- */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8 }}
          className="relative mb-20"
        >
          <div className="text-center mb-16">
            <div
              id="suggestion-demo"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full px-6 py-3 shadow-lg mb-6"
            >
              <Star className="w-6 h-6" />
              <span className="font-semibold">התוצאה: כך זה נראה</span>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              כך נראית הצעה
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                {' '}
                שנבנתה עבורכם
              </span>
            </h3>
            <p className="text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed">
              לאחר השלמת התהליך, כל הצעה מגיעה עם נימוקים ברורים ורקע עשיר, כדי
              שתוכלו לקבל החלטה ממקום של הבנה אמיתית, לא רק תחושת בטן.
            </p>
          </div>

          <motion.div
            ref={demoRef}
            initial={{ opacity: 0, y: 30 }}
            animate={
              isDemoInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
            }
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 max-w-7xl mx-auto"
          >
            <div className="flex flex-col items-center">
              <h4 className="text-lg font-semibold text-gray-800 text-center px-4 py-2 bg-cyan-100 rounded-full mb-4">
                דוגמה: הצעה לבחורה
              </h4>
              <div className="relative w-full max-w-sm lg:max-w-md">
                <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-pink-500/20 to-cyan-500/20 rounded-3xl blur-xl" />
                <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-white">
                  <LiveSuggestionDemo
                    suggestion={demoSuggestionDataMale}
                    userId="visitor-user-id"
                    demoAiAnalysis={demoAiAnalysisForDaniel}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <h4 className="text-lg font-semibold text-gray-800 text-center px-4 py-2 bg-pink-100 rounded-full mb-4">
                דוגמה: הצעה לבחור
              </h4>
              <div className="relative w-full max-w-sm lg:max-w-md">
                <div className="absolute -inset-4 bg-gradient-to-r from-pink-500/20 via-orange-500/20 to-pink-500/20 rounded-3xl blur-xl" />
                <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-white">
                  <LiveSuggestionDemo
                    suggestion={demoSuggestionDataFemale}
                    userId="visitor-user-id"
                    demoAiAnalysis={demoAiAnalysisForNoa}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* --- Founder's Testimonial (UPDATED) --- */}
        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-8 py-4 shadow-lg border border-white/60 mb-8">
              <Heart className="w-6 h-6 text-pink-500" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-pink-600 font-bold text-lg">
                המסע שמאחורי NeshamaTech
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/60">
              <div className="absolute -top-4 right-8 w-12 h-12 bg-gradient-to-br from-cyan-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                <Quote className="w-6 h-6 text-white" />
              </div>
              <div className="text-center mb-10">
                <p className="text-xl md:text-2xl text-gray-700 leading-relaxed mb-6 font-medium">
                  “המסע האישי שלי, והסיפורים ששמעתי מחברים, הבהירו לי עד כמה
                  הדרך למציאת זוגיות יכולה להיות בודדה ומתסכלת. הקמתי את
                  NeshamaTech מתוך רצון אישי עמוק ליצור מקום אחר - מקום שמבין את
                  הרגישות, שמכבד את התהליך, ושם את האדם במרכז. זו הסיבה שההצלחה
                  שלכם היא המשימה האישית שלי.”
                </p>
              </div>
              <div className="flex items-center justify-center gap-6 p-6 bg-gradient-to-r from-gray-50/80 to-white/80 rounded-2xl backdrop-blur-sm border border-gray-100">
                <div className="relative w-20 h-20 rounded-full overflow-hidden shadow-lg border-2 border-white">
                  <Image
                    src={getRelativeCloudinaryPath(
                      'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753700884/eitan_h9ylkc.jpg'
                    )}
                    alt="איתן אנגלרד, מייסד החברה"
                    fill
                    sizes="80px"
                    className="object-cover object-center"
                    priority
                  />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">
                    איתן אנגלרד
                  </div>
                  <div className="text-lg text-cyan-600 font-semibold">
                    מייסד NeshamaTech
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* --- Final CTA (UPDATED) --- */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.8 }}
          className="relative text-center"
        >
          <div className="absolute inset-0 -m-8 bg-gradient-to-br from-cyan-600/10 via-pink-600/10 to-orange-600/10 rounded-3xl backdrop-blur-sm border border-white/40" />
          <div className="relative max-w-4xl mx-auto p-12">
            <h4 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6 leading-tight">
              הצעד הבא במסע שלכם
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-pink-600">
                מתחיל בהיכרות
              </span>
            </h4>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-3xl mx-auto">
              ראיתם את הגישה שלנו. עכשיו נשמח להכיר את הסיפור שלכם.
              <br />
              ההרשמה הראשונית מאפשרת לנו להתחיל להבין אתכם לעומק, ללא כל
              התחייבות.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden px-10 py-6 text-lg font-bold"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    אני רוצה להתחיל
                    <ArrowLeft className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </Link>
              <div className="flex items-center gap-3 text-gray-600">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">
                  הרשמה ראשונית ללא עלות • ללא התחייבות
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
