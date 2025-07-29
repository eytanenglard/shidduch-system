// src/components/HomePage/sections/HowItWorksSection.tsx

import React, { useRef } from 'react';
import Step from '../components/Step';
import { LiveSuggestionDemo } from '../components/LiveSuggestionDemo';
import {
  demoSuggestionDataFemale,
  demoSuggestionDataMale,
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
  UserCheck, // אייקון חדש שהוספנו
} from 'lucide-react';
import { motion, useInView } from 'framer-motion';

// === קומפוננטות עזר (ללא שינוי מהקובץ החדש שלך) ===

// רקע דינמי עם צורות גיאומטריות
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

// סטטיסטיקה מיני עם אייקון
const ProcessStat: React.FC<{
  icon: React.ReactNode;
  value: string;
  label: string;
  delay?: number;
}> = ({ icon, value, label, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, delay }}
      className="flex items-center gap-3 bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50"
    >
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="font-bold text-lg text-gray-800">{value}</div>
        <div className="text-sm text-gray-600">{label}</div>
      </div>
    </motion.div>
  );
};

// ציטוט משובח עם אנימציה
const EnhancedTestimonial: React.FC<{
  text: string;
  author: string;
  role?: string;
  delay?: number;
}> = ({ text, author, role, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={
        isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }
      }
      transition={{ duration: 0.7, delay }}
      className="relative bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/60 max-w-md"
    >
      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-cyan-400 to-pink-400 rounded-full opacity-20" />
      <div className="flex items-start gap-4">
        <Quote className="w-8 h-8 text-cyan-500 flex-shrink-0 mt-1" />
        <div>
          <p className="text-gray-700 italic leading-relaxed mb-3">“{text}”</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center">
              <span className="text-white text-sm font-bold">{author[0]}</span>
            </div>
            <div>
              <div className="font-semibold text-gray-800 text-sm">
                {author}
              </div>
              {role && <div className="text-xs text-gray-500">{role}</div>}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// הדגשת יתרון מרכזי
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

// === הקומפוננטה הראשית עם כל השינויים והשיפורים ===
const HowItWorksSection: React.FC = () => {
  const demoRef = useRef(null);
  const isDemoInView = useInView(demoRef, { once: true });

  return (
    <section
      id="how-it-works"
      className="relative py-20 md:py-28 px-4 min-h-screen bg-gradient-to-b from-white via-cyan-50/20 to-white overflow-hidden"
    >
      <DynamicBackground />

      <div className="relative max-w-7xl mx-auto">
        {/* פרק 1: ההבטחה - כותרת משופרת עם טקסט משכנע יותר */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="text-center mb-20"
        >
          <div className="inline-block mb-6">
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-white/60">
              <Sparkles className="w-6 h-6 text-cyan-500" />
              <span className="text-cyan-700 font-semibold">
                המסע שלכם לזוגיות מתחיל כאן
              </span>
            </div>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-800 mb-8 leading-tight">
            מהחלטה אמיצה
            <br />ל
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-pink-600">
              הצעה מדויקת
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
            אנו מבינים את המסע שלכם. לכן בנינו תהליך המשלב טכנולוגיה חכמה עם
            ליווי אנושי וחם.
            <br />
            <span className="text-cyan-700 font-semibold">
              המטרה המשותפת שלנו: להוביל אתכם לרגע המרגש של הצעה שמרגישה נכון
              בלב.
            </span>
          </p>

          {/* סטטיסטיקות תהליך - החלפנו את הנתון הבעייתי "48 שעות" */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
            <ProcessStat
              icon={<UserCheck className="w-6 h-6 text-white" />}
              value="שיחה אישית"
              label="עם כל נרשם חדש"
              delay={0.1}
            />
            <ProcessStat
              icon={<Shield className="w-6 h-6 text-white" />}
              value="100%"
              label="דיסקרטיות מובטחת"
              delay={0.2}
            />
            <ProcessStat
              icon={<Target className="w-6 h-6 text-white" />}
              value="50+"
              label="נקודות התאמה"
              delay={0.3}
            />
            <ProcessStat
              icon={<HeartHandshake className="w-6 h-6 text-white" />}
              value="ליווי צמוד"
              label="בכל שלב בדרך"
              delay={0.4}
            />
          </div>
        </motion.div>

        {/* פרק 2: הדרך - שלבי התהליך עם טקסטים ממוקדים ומניעים */}
        <div className="relative mb-20">
          <div className="absolute inset-0 -m-8 bg-gradient-to-br from-cyan-50/50 via-white/80 to-pink-50/50 rounded-3xl backdrop-blur-sm border border-white/40 shadow-2xl" />

          <div className="relative max-w-5xl mx-auto space-y-12 p-8">
            <Step
              number="1"
              title="ההרשמה: מסע אישי לגילוי עצמי"
              description="זה יותר ממילוי פרטים. השאלון הייחודי שלנו הוא הזדמנות עבורכם להבין מה באמת חשוב לכם בזוגיות. זהו הבסיס שמאפשר לשדכן שלכם להכיר אתכם לעומק."
              color="cyan"
            />
            <Step
              number="2"
              title="הפרופיל שלכם, בגרסה המיטבית"
              description="השדכן האישי שלכם עובד יחד אתכם כדי להבליט את הייחודיות שלכם ולקבוע אסטרטגיית חיפוש מנצחת. המערכת החכמה שלנו תציע שיפורים כדי למקסם את סיכויי ההצלחה."
              color="green"
            />
            <Step
              number="3"
              title="השילוב המנצח: טכנולוגיה ואינטואיציה"
              description="כאן קורה הקסם. אלגוריתם מתקדם מנתח אלפי פרופילים, והשדכן מוסיף את הניסיון והמגע האנושי. השילוב הזה יוצר התאמות מדויקות שגורמות לכם לתהות 'איך הם ידעו?!'"
              color="orange"
            />
            <Step
              number="4"
              title="מהצעה מנומקת ועד לליווי צמוד"
              description="כל הצעה מגיעה עם 'למה' ברור ומפורט. אנחנו אתכם בכל צעד, גם אחרי הדייט, כדי לתמוך, לייעץ ולהוביל אתכם בבטחה ובשמחה עד למטרה."
              isLast={true}
              color="pink"
            />
          </div>
        </div>

        {/* יתרונות מרכזיים - עם תיאורים משופרים */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">
            למה התהליך שלנו{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-pink-600">
              פשוט עובד
            </span>
            ?
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
              description="כל הצעה עוברת בדיקה כפולה: סינון אלגוריתמי קפדני ואישור סופי של שדכן מנוסה. לא תקבלו הצעות 'על הדרך'."
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

        {/* פרק 3: ההוכחה - אזור הדמו עם הרקע מהקובץ הישן */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative mb-20"
        >
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full px-6 py-3 shadow-lg mb-6">
              <Star className="w-6 h-6" />
              <span className="font-semibold">הרגע המיוחד</span>
            </div>

            <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              כך נראית{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                הצעת השידוך שלכם
              </span>
            </h3>

            <p className="text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed">
              לאחר השלמת התהליך, תקבלו הצעות איכותיות ומנומקות כמו אלה.
              <br />
              <span className="font-semibold text-cyan-700">
                כל הצעה מותאמת אישית ומלווה בהסבר מדויק למה זה מתאים לכם.
              </span>
            </p>
          </div>

          {/* הדמואים עם הרקע המתוקן מהקובץ הישן */}
          <div ref={demoRef}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={
                isDemoInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
              }
              transition={{ duration: 0.8, delay: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 max-w-7xl mx-auto"
            >
              {/* הצעה לבחורה (מציגה פרופיל גבר) */}
              <div className="flex flex-col items-center">
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-800 text-center px-4 py-2 bg-cyan-100 rounded-full">
                    דוגמה: הצעה לבחורה
                  </h4>
                </div>
                <div className="relative w-full max-w-sm">
                  <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-pink-500/20 to-cyan-500/20 rounded-3xl blur-xl" />{' '}
                  <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-white">
                    <LiveSuggestionDemo
                      suggestion={demoSuggestionDataMale}
                      userId="visitor-user-id"
                    />
                  </div>
                </div>
              </div>

              {/* הצעה לבחור (מציגה פרופיל אישה) */}
              <div className="flex flex-col items-center">
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-800 text-center px-4 py-2 bg-pink-100 rounded-full">
                    דוגמה: הצעה לבחור
                  </h4>
                </div>
                <div className="relative w-full max-w-sm">
                  <div className="absolute -inset-4 bg-gradient-to-r from-pink-500/20 via-orange-500/20 to-pink-500/20 rounded-3xl blur-xl" />
                  <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-white">
                    <LiveSuggestionDemo
                      suggestion={demoSuggestionDataFemale}
                      userId="visitor-user-id"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* ציטוטים של לקוחות - עם טקסטים משופרים */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 max-w-5xl mx-auto">
          <EnhancedTestimonial
            text="ברגע שראיתי את ההצעה הראשונה, הרגשתי שהם באמת הבינו אותי. הרציונל היה כל כך מדויק שזה הרגיש כאילו הם מכירים אותי שנים."
            author="שרה, ירושלים"
            role="מאורסת באושר"
            delay={0.1}
          />
          <EnhancedTestimonial
            text="מה שהכי הרשים אותי זה הליווי הצמוד. השדכן היה זמין, תומך ומלא אכפתיות, מהשיחה הראשונה ועד לחופה. זה נתן לי המון ביטחון."
            author="דוד, תל אביב"
            role="נשוי טרי"
            delay={0.3}
          />
        </div>

        {/* פרק 4: ההזמנה לפעולה - קריאה לפעולה עם מסר מחודד וסטטיסטיקה אמינה */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative text-center"
        >
          <div className="absolute inset-0 -m-8 bg-gradient-to-br from-cyan-600/10 via-pink-600/10 to-orange-600/10 rounded-3xl backdrop-blur-sm border border-white/40" />
          <div className="relative max-w-4xl mx-auto p-12">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500 to-pink-500 text-white rounded-full px-6 py-3 shadow-lg mb-8">
              <Heart className="w-6 h-6" />
              <span className="font-semibold">הגיע הזמן שלכם?</span>
            </div>

            <h4 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6 leading-tight">
              הצעד הראשון לזוגיות שלכם
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-pink-600">
                מתחיל בלחיצת כפתור
              </span>
            </h4>

            <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-3xl mx-auto">
              ראיתם איך נראית הצעה איכותית. עכשיו תורכם לחוות את זה.
              <br />
              <span className="font-bold text-cyan-700">
                ההרשמה בחינם, הליווי מתחיל מיד. ההתחייבות היחידה היא לעצמכם.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden px-10 py-6 text-lg font-bold"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
                  <span className="relative z-10 flex items-center justify-center">
                    אני רוצה להתחיל את המסע!
                    <ArrowLeft className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </Link>
              <div className="flex items-center gap-3 text-gray-600">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">
                  הרשמה חינם • ללא התחייבות • תמיכה מיידית
                </span>
              </div>
            </div>

            {/* סטטיסטיקת אמינות - החלופה למשפט הבעייתי, עם נתונים אמינים */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto text-center pt-8 border-t border-gray-200">
              <div>
                <div className="font-bold text-2xl text-cyan-600 mb-1">
                  מאות
                </div>
                <div className="text-sm text-gray-600">
                  סיפורי הצלחה מתועדים
                </div>
              </div>
              <div>
                <div className="font-bold text-2xl text-pink-600 mb-1">95%</div>
                <div className="text-sm text-gray-600">
                  שביעות רצון מהליווי האישי
                </div>
              </div>
              <div>
                <div className="font-bold text-2xl text-orange-600 mb-1">
                  100%
                </div>
                <div className="text-sm text-gray-600">
                  בדיקה אנושית לכל הצעה
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
