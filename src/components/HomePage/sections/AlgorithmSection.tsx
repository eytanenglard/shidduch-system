// src/components/HomePage/sections/AlgorithmSection.tsx

'use client';

import React, { useState, useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { 
  Brain, 
  Heart, 
  Shield, 
  Users, 
  Zap, 
  Target, 
  TrendingUp,
  Lock,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Cpu,
  UserCheck,
  Eye,
  Clock,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// =================== עמודות המידע הראשיות ===================
const ALGORITHM_FEATURES = [
  {
    icon: Brain,
    title: "AI חכם + שדכן מנוסה",
    subtitle: "השילוב המנצח",
    description: "האלגוריתם שלנו מנתח 50+ פרמטרים, והשדכן מוסיף את הניסיון האנושי. השילוב הזה יוצר התאמות מדויקות פי 7 יותר מאפליקציות רגילות.",
    color: "from-cyan-500 to-blue-600",
    stats: { number: 50, suffix: "+", label: "פרמטרי התאמה" },
    details: [
      "ניתוח עמוק של אישיות וערכים",
      "התאמה גיאוגרפית ותרבותית", 
      "בדיקת תאימות רגשית",
      "ניתוח דפוסי התנהגות"
    ]
  },
  {
    icon: TrendingUp,
    title: "למידה מתמשכת",
    subtitle: "משתפר עם כל אינטראקציה",
    description: "המערכת לומדת מכל משוב, מכל דייט, מכל החלטה. כל יום ההתאמות שלכם נעשות חכמות ומדויקות יותר.",
    color: "from-pink-500 to-purple-600", 
    stats: { number: 95, suffix: "%", label: "שיעור שביעות רצון" },
    details: [
      "למידה מדייטים קודמים",
      "התאמת העדפות אוטומטית",
      "שיפור אלגוריתם מתמיד",
      "ניתוח טרנדים ודפוסים"
    ]
  },
  {
    icon: Shield,
    title: "פרטיות מוחלטת",
    subtitle: "הנתונים שלכם מוגנים",
    description: "הצפנה צבאית, אפס שיתוף מידע, בקרה מלאה שלכם על הנתונים. הפרטיות שלכם היא הקדושה שלנו.",
    color: "from-green-500 to-teal-600",
    stats: { number: 100, suffix: "%", label: "הצפנה מלאה" },
    details: [
      "הצפנה מקצה לקצה",
      "אין מכירת נתונים לצדדים שלישיים", 
      "בקרה מלאה על הפרטיות",
      "מחיקת נתונים בכל עת"
    ]
  }
];

// =================== סטטיסטיקות ליווי ===================
const LIVE_STATS = [
  { icon: Users, number: 2847, suffix: "", label: "משתמשים פעילים", color: "text-cyan-600" },
  { icon: Heart, number: 156, suffix: "", label: "זוגות השבוע", color: "text-pink-600" },
  { icon: CheckCircle, number: 89, suffix: "%", label: "שיעור הצלחה", color: "text-green-600" },
  { icon: Clock, number: 12, suffix: "", label: "ימים ממוצע למציאת התאמה", color: "text-purple-600" }
];

// =================== קומפוננטת ספירה אנימטית ===================
const AnimatedCounter: React.FC<{
  target: number;
  suffix?: string;
  duration?: number;
  inView: boolean;
}> = ({ target, suffix = "", duration = 2, inView }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (inView) {
      const animation = animate(count, target, { duration });
      const unsubscribe = rounded.onChange(setDisplayValue);
      return () => {
        animation.stop();
        unsubscribe();
      };
    }
  }, [count, rounded, target, duration, inView]);

  return (
    <span className="font-bold text-2xl">
      {displayValue}
      {suffix}
    </span>
  );
};

// =================== כרטיס פיצ'ר עם אנימציה ===================
const FeatureCard: React.FC<{
  feature: typeof ALGORITHM_FEATURES[0];
  index: number;
  isActive: boolean;
  onHover: (index: number | null) => void;
}> = ({ feature, index, isActive, onHover }) => {
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      className={`
        relative p-8 rounded-3xl border transition-all duration-500 cursor-pointer group
        ${isActive 
          ? 'bg-white shadow-2xl border-transparent scale-105' 
          : 'bg-white/60 backdrop-blur-sm border-white/40 shadow-lg hover:shadow-xl'
        }
      `}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
    >
      {/* רקע גרדיאנט אנימטי */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${feature.color} rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
      
      {/* תוכן הכרטיס */}
      <div className="relative z-10">
        {/* אייקון עם אנימציה */}
        <motion.div 
          className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
          whileHover={{ rotate: 5 }}
        >
          <feature.icon className="w-8 h-8 text-white" />
        </motion.div>

        {/* כותרות */}
        <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
        <p className={`text-sm font-medium bg-gradient-to-r ${feature.color} bg-clip-text text-transparent mb-4`}>
          {feature.subtitle}
        </p>

        {/* תיאור */}
        <p className="text-gray-600 leading-relaxed mb-6">
          {feature.description}
        </p>

        {/* סטטיסטיקה מרכזית */}
        <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-2xl">
          <div>
            <AnimatedCounter 
              target={feature.stats.number} 
              suffix={feature.stats.suffix}
              inView={isInView && isActive}
            />
            <p className="text-sm text-gray-500 mt-1">{feature.stats.label}</p>
          </div>
          <BarChart3 className={`w-8 h-8 text-gray-400`} />
        </div>

        {/* רשימת פרטים */}
        <div className="space-y-3">
          {feature.details.map((detail, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0.7, x: -10 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center gap-3"
            >
              <CheckCircle className={`w-4 h-4 text-green-500 flex-shrink-0`} />
              <span className="text-sm text-gray-600">{detail}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* אינדיקטור פעיל */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className={`absolute -inset-1 bg-gradient-to-r ${feature.color} rounded-3xl opacity-20`}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </motion.div>
  );
};

// =================== סטטיסטיקה חיה ===================
const LiveStatsBar: React.FC = () => {
  const statsRef = useRef(null);
  const isInView = useInView(statsRef, { once: true });

  return (
    <motion.div
      ref={statsRef}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.8 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-white/60"
    >
      {LIVE_STATS.map((stat, index) => (
        <div key={index} className="text-center">
          <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-3`} />
          <div className={`text-2xl font-bold ${stat.color} mb-1`}>
            <AnimatedCounter 
              target={stat.number} 
              suffix={stat.suffix}
              inView={isInView}
              duration={2.5}
            />
          </div>
          <p className="text-sm text-gray-600">{stat.label}</p>
        </div>
      ))}
    </motion.div>
  );
};

// =================== דמו קוד אינטראקטיבי ===================
const InteractiveCodeDemo: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const demoRef = useRef(null);
  const isInView = useInView(demoRef, { once: true });

  const codeSteps = [
    {
      title: "שלב 1: איסוף נתונים",
      code: `// איסוף נתוני המשתמש\nconst userProfile = {\n  age: 28,\n  location: "תל אביב",\n  values: ["משפחתיות", "קריירה"],\n  lifestyle: "דתי-מודרני"\n};`,
      highlight: "text-cyan-400"
    },
    {
      title: "שלב 2: ניתוח AI",
      code: `// ניתוח התאמה חכם\nconst compatibility = AI.analyze({\n  userProfile,\n  candidateProfiles,\n  historicalData,\n  preferences: user.preferences\n});`,
      highlight: "text-pink-400"
    },
    {
      title: "שלב 3: סינון שדכן",
      code: `// בדיקה אנושית מקצועית\nconst finalMatches = matchmaker.review({\n  aiSuggestions: compatibility,\n  intuition: "high",\n  experience: "15 years"\n});`,
      highlight: "text-green-400"
    }
  ];

  useEffect(() => {
    if (!isInView) return;
    
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % codeSteps.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isInView, codeSteps.length]);

  return (
    <div ref={demoRef} className="relative">
      <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
        {/* כותרת החלון */}
        <div className="flex items-center justify-between bg-gray-800 px-6 py-4">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="text-gray-300 text-sm font-mono">neshamatech-algorithm.js</div>
        </div>

        {/* האזור הפעיל */}
        <div className="p-6">
          <div className="mb-4">
            <h4 className="text-white font-semibold mb-2">{codeSteps[currentStep].title}</h4>
            <div className="flex space-x-1 mb-4">
              {codeSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    index === currentStep ? 'bg-cyan-400 w-8' : 'bg-gray-600 w-2'
                  }`}
                />
              ))}
            </div>
          </div>

          <motion.pre
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-sm overflow-x-auto"
          >
            <code className="text-gray-300 leading-relaxed">
              {codeSteps[currentStep].code}
            </code>
          </motion.pre>

          {/* מחוון התקדמות */}
          <div className="mt-6 flex items-center gap-3">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <div className="flex-1 bg-gray-700 rounded-full h-2">
              <motion.div
                className={`h-2 rounded-full ${codeSteps[currentStep].highlight.replace('text-', 'bg-')}`}
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / codeSteps.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-gray-400 text-sm">
              {currentStep + 1}/{codeSteps.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// =================== הקומפוננטה הראשית ===================
const AlgorithmSection: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<number | null>(0);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  // אוטו-מעבר בין הפיצ'רים
  useEffect(() => {
    if (!isInView) return;
    
    const interval = setInterval(() => {
      setActiveFeature(prev => {
        if (prev === null) return 0;
        return (prev + 1) % ALGORITHM_FEATURES.length;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <section 
      ref={sectionRef}
      className="py-20 md:py-28 px-4 bg-gradient-to-b from-gray-50 via-white to-cyan-50/30 relative overflow-hidden"
    >
      {/* רקע אנימטי */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-cyan-200/20 to-blue-300/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-pink-200/20 to-purple-300/20 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-200/10 to-teal-300/10 rounded-full blur-3xl animate-spin-slow" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* כותרת מרכזית משופרת */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-white/60 mb-8">
            <Sparkles className="w-6 h-6 text-cyan-500" />
            <span className="text-cyan-700 font-semibold">טכנולוגיה + אנושיות</span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-800 mb-8 leading-tight">
            איך אנחנו מוצאים לכם את
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-pink-600 to-purple-600 animate-gradient">
              ההתאמה המושלמת
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            שילוב ייחודי של בינה מלאכותית מתקדמת עם הניסיון והאינטואיציה של שדכנים מקצועיים.
            <br />
            <span className="font-semibold text-cyan-700">
              התוצאה: התאמות מדויקות פי 7 יותר מכל מערכת אחרת.
            </span>
          </p>
        </motion.div>

        {/* סטטיסטיקות חיות */}
        <div className="mb-20">
          <LiveStatsBar />
        </div>

        {/* הפיצ'רים המרכזיים */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          {ALGORITHM_FEATURES.map((feature, index) => (
            <FeatureCard
              key={index}
              feature={feature}
              index={index}
              isActive={activeFeature === index}
              onHover={setActiveFeature}
            />
          ))}
        </div>

        {/* דמו האלגוריתם */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              הצצה לתוך
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-purple-600">
                {" "}האלגוריתם{" "}
              </span>
              שלנו
            </h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              כך נראה התהליך שמאחורי כל התאמה מוצלחת - שילוב של טכנולוגיה וחוכמה אנושית
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <InteractiveCodeDemo />
          </div>
        </motion.div>

        {/* קול קורא לפעולה */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center"
        >
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute -inset-6 bg-gradient-to-r from-cyan-500/20 via-pink-500/20 to-purple-500/20 rounded-3xl blur-2xl" />
            
            <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/60">
              <div className="mb-8">
                <Eye className="w-16 h-16 mx-auto mb-6 text-cyan-600" />
                <h3 className="text-3xl font-bold text-gray-800 mb-4">
                  מוכנים לראות איך זה עובד
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-pink-600">
                    {" "}עבורכם?{" "}
                  </span>
                </h3>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                  הצטרפו למערכת הכי מתקדמת לשידוכים בישראל ותגלו איך טכנולוגיה וליווי אישי יוצרים יחד את ההתאמה המושלמת עבורכם.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link href="/auth/register">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden px-10 py-6 text-lg font-bold"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
                    <span className="relative z-10 flex items-center justify-center">
                      בואו נתחיל!
                      <ArrowRight className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </Link>

                <Link href="/how-it-works">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-cyan-200 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-300 transition-all duration-300 rounded-full px-8 py-6"
                  >
                    למידע נוסף על התהליך
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>הרשמה חינם</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>פרטיות מוחלטת</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-green-500" />
                  <span>ליווי אישי</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* סגנונות CSS מותאמים אישית */}
      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 4s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 1.5s ease-in-out;
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </section>
  );
};

export default AlgorithmSection;