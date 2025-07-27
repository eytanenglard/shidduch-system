// src/components/questionnaire/onboarding/Welcome.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Heart,
  ShieldCheck,
  Sparkles,
  ArrowLeft, // Changed for RTL context
  LogIn,
  Edit,
} from 'lucide-react';
import { useSession } from 'next-auth/react';

// --- Props Interface ---
interface WelcomeProps {
  onStart: () => void;
  onLearnMore: () => void; // Keeping this for potential future use
  isLoggedIn: boolean;
  hasSavedProgress: boolean; // New prop to handle dynamic CTA
}

// --- Centralized Content Configuration (Programmer's Improvement) ---
// Makes it easy to update marketing copy without touching JSX.
const welcomeContent = {
  mainTitle: 'השער שלך לזוגיות עם משמעות',
  subtitle:
    'השקעה של דקות ספורות בשאלון ההיכרות שלנו היא הצעד הראשון והחשוב ביותר שלך במסע למציאת קשר אמיתי, עמוק ומדויק.',
  loggedInCTA: 'בוא/י נצא למסע',
  resumeCTA: 'להמשיך מהיכן שעצרנו',
  guestCTA: 'התחל/י את המסע (כאורח/ת)',
  loginPrompt: {
    title: 'חשוב לדעת:',
    text: 'כדי שההשקעה שלך לא תרד לטמיון, אנו ממליצים להתחבר. כך נוכל לשמור את התקדמותך, ותוכל/י לחזור ולהשלים את השאלון בכל עת.',
    loginButtonText: 'התחברות וחיסכון בהתקדמות',
  },
  features: [
    {
      icon: <Sparkles className="h-7 w-7 text-purple-500" />,
      title: 'מסע מותאם אישית',
      description:
        'השאלון מחולק לעולמות תוכן, ומאפשר לך להתקדם בקצב שלך, מתוך הבנה וכבוד לזמן שלך.',
      color: 'bg-purple-50',
    },
    {
      icon: <ShieldCheck className="h-7 w-7 text-green-500" />,
      title: 'הפרטיות שלך - ערך עליון',
      description:
        'התשובות שלך דיסקרטיות לחלוטין ומשמשות את צוות השדכנים המנוסה שלנו בלבד, במטרה למצוא לך התאמה.',
      color: 'bg-green-50',
    },
    {
      icon: <Heart className="h-7 w-7 text-rose-500" />,
      title: 'מעבר לאלגוריתם',
      description:
        'מאחורי כל התאמה עומד שדכן אמיתי שמכיר את הסיפור שלך. אנו משלבים טכנולוגיה עם חוכמה אנושית.',
      color: 'bg-rose-50',
    },
  ],
  testimonials: [
    {
      // FIX: Removed quotes from the data string
      quote:
        'בפעם הראשונה הרגשתי שבאמת מנסים להבין מי אני, ולא רק לסמן V ברשימה.',
      author: 'יונתן, 34',
    },
    {
      // FIX: Removed quotes from the data string
      quote:
        'התהליך היה רציני, מכבד ונתן לי תובנות חדשות על עצמי ועל מה שאני מחפשת.',
      author: 'מיכל, 29',
    },
  ],
};

// --- Sub-components for cleaner structure (Programmer's Improvement) ---
const FeatureHighlight: React.FC<(typeof welcomeContent.features)[0]> = ({
  icon,
  title,
  description,
  color,
}) => (
  <div className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-slate-100">
    <div
      className={`mx-auto w-14 h-14 flex items-center justify-center rounded-full mb-4 ${color}`}
    >
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
    <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
  </div>
);

const TestimonialCard: React.FC<(typeof welcomeContent.testimonials)[0]> = ({
  quote,
  author,
}) => (
  <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-sm">
    <CardContent className="pt-6">
      {/* FIX: Used HTML entities for quotes instead of literal characters */}
      <p className="text-slate-700 italic">“{quote}”</p>
      <p className="text-right font-semibold text-slate-500 mt-3">- {author}</p>
    </CardContent>
  </Card>
);

// --- Main Welcome Component ---
export default function Welcome({
  onStart,
  isLoggedIn,
  hasSavedProgress,
}: WelcomeProps) {
  const { data: session } = useSession();
  const userName = session?.user?.firstName;

  // --- Animation Variants (Designer's Improvement) ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100 },
    },
  };

  const renderCTAButton = () => {
    let text = welcomeContent.loggedInCTA;
    let Icon = Heart;

    if (!isLoggedIn) {
      text = welcomeContent.guestCTA;
    } else if (hasSavedProgress) {
      text = welcomeContent.resumeCTA;
      Icon = Edit;
    }

    return (
      <Button
        onClick={onStart}
        size="lg"
        className="w-full sm:w-auto text-lg font-semibold px-8 py-7 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group transform hover:-translate-y-1"
      >
        <div className="flex items-center justify-center">
          <Icon className="w-6 h-6 ms-3 fill-white" />
          <span>{userName && isLoggedIn ? `${text}, ${userName}` : text}</span>
        </div>
      </Button>
    );
  };

  return (
    <motion.div
      className="min-h-screen w-full bg-slate-50 p-4 sm:p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-6xl mx-auto space-y-16 py-12">
        {/* === Hero Section (Shadchan, Marketer & Designer's work combined) === */}
        <motion.section variants={itemVariants} className="text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            {welcomeContent.mainTitle}
          </h1>
          <p className="max-w-3xl mx-auto mt-4 text-lg text-slate-600 leading-relaxed">
            {welcomeContent.subtitle}
          </p>
          <div className="mt-10">{renderCTAButton()}</div>
        </motion.section>

        {/* === Login Prompt for Guests (Shadchan's warm framing) === */}
        {!isLoggedIn && (
          <motion.div variants={itemVariants} className="max-w-2xl mx-auto">
            <Card className="bg-sky-50 border-sky-200 shadow-md">
              <CardContent className="pt-6 text-center space-y-3">
                <h3 className="font-semibold text-sky-800">
                  {welcomeContent.loginPrompt.title}
                </h3>
                <p className="text-sky-700 text-sm">
                  {welcomeContent.loginPrompt.text}
                </p>
                <Button
                  variant="outline"
                  className="bg-white border-sky-300 text-sky-700 hover:bg-white/80"
                  onClick={() => (window.location.href = '/auth/signin')}
                >
                  <LogIn className="w-4 h-4 ms-2" />
                  {welcomeContent.loginPrompt.loginButtonText}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* === Features Section (Benefit-oriented marketing) === */}
        <motion.section variants={itemVariants}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {welcomeContent.features.map((feature, index) => (
              <FeatureHighlight key={index} {...feature} />
            ))}
          </div>
        </motion.section>

        {/* === Testimonials Section (Social Proof) === */}
        <motion.section variants={itemVariants}>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800">
              מה חושבים עלינו?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {welcomeContent.testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
          </div>
        </motion.section>

        {/* === Final CTA & Footer === */}
        <motion.div
          variants={itemVariants}
          className="text-center pt-8 border-t border-slate-200"
        >
          <p className="text-slate-600 mb-6">
            מוכנ/ה להתחיל את הצעד הראשון שלך?
          </p>
          {renderCTAButton()}
        </motion.div>
      </div>
    </motion.div>
  );
}
