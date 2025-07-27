// src/components/questionnaire/common/WorldIntro.tsx
import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Scroll, Heart, Users, UserCheck, ArrowRight, Star, Brain, Sparkles, Clock, HelpCircle, CheckCircle2, User
} from "lucide-react";
import type { WorldId, Question } from "../types/types";
import { cn } from "@/lib/utils";
import { useMediaQuery } from '../hooks/useMediaQuery';

// --- ממשק Props חדש ופשוט יותר ---
interface WorldIntroProps {
  worldId: WorldId;
  allQuestions: Question[];
  onStart: () => void;
  className?: string;
}

// --- אובייקט קונפיגורציה מרכזי לכל התוכן והעיצוב ---
const worldDisplayConfig = {
  PERSONALITY: {
    Icon: User,
    themeColor: "sky",
    title: "עולם האישיות",
    subtitle: "מי אני באמת?",
    whyIsItImportant: "הבנה עמוקה של מי שאת/ה היא הבסיס לכל קשר בריא. כאן תקבלי/י הזדמנות להציג את עצמך בצורה אותנטית, כדי שנמצא מישהו שיתאהב באדם האמיתי שאת/ה.",
    whatYouWillDiscover: [
      "מהם הכוחות המניעים אותך בחיים",
      "סגנון התקשורת והאינטראקציה החברתית שלך",
      "איך את/ה מתמודד/ת עם אתגרים ומקבל/ת החלטות",
    ],
    guidingThought: "היופי שבזוגיות הוא לא למצוא מישהו מושלם, אלא למצוא מישהו שהחלקים שלכם משלימים זה את זה.",
  },
  VALUES: {
    Icon: Heart,
    themeColor: "rose",
    title: "עולם הערכים",
    subtitle: "מה באמת מניע אותך?",
    whyIsItImportant: "ערכים משותפים הם עמוד השדרה של קשר יציב ומאושר. בעולם זה, נעזור לך לזקק את עקרונות הליבה שלך, כדי לבנות יסודות איתנים לבית המשותף העתידי.",
    whatYouWillDiscover: [
      "מהם סדרי העדיפויות שלך בין משפחה, קריירה ורוחניות",
      "גישתך לכסף, נתינה וצמיחה אישית",
      "איזו קהילה וסביבה חברתית מתאימות לך",
    ],
    guidingThought: "כאשר הערכים שלכם נפגשים, הדרך המשותפת הופכת להיות ברורה וקלה יותר.",
  },
  RELATIONSHIP: {
    Icon: Users,
    themeColor: "purple",
    title: "עולם הזוגיות",
    subtitle: "איך נראית השותפות האידיאלית שלך?",
    whyIsItImportant: "זוגיות טובה היא שותפות. כאן נבין את הציפיות שלך מקשר, את 'שפות האהבה' שלך, ואיך את/ה רואה את חיי היומיום המשותפים. זה המפתח ליצירת קשר שמבוסס על הבנה, כבוד וחברות אמת.",
    whatYouWillDiscover: [
      "מהי תמצית הזוגיות הבריאה בעיניך",
      "סגנון פתרון הקונפליקטים המועדף עליך",
      "האיזון הנכון עבורך בין 'ביחד' ל'לחוד'",
    ],
    guidingThought: "השאלה אינה 'האם תהיו מאושרים?', אלא 'איך תתמודדו יחד כשתהיו פחות מאושרים?'.",
  },
  PARTNER: {
    Icon: UserCheck,
    themeColor: "teal",
    title: "עולם הפרטנר",
    subtitle: "במי תרצה/י לבחור?",
    whyIsItImportant: "הגדרת בן/בת הזוג האידיאלי/ת היא יותר מרשימת תכונות; זו הבנה של מה באמת נחוץ לך כדי לפרוח. כאן נמקד את החיפוש ונבין מהם הדברים שאינם ניתנים לפשרה עבורך.",
    whatYouWillDiscover: [
      "אילו תכונות אופי הן החיוניות ביותר עבורך",
      "מהן העדפותיך לגבי סגנון חיים ורקע",
      "מהם ה'קווים האדומים' שלך בזוגיות",
    ],
    guidingThought: "אל תחפש/י את האדם שתוכל/י לחיות איתו, חפש/י את האדם שאינך יכול/ה לחיות בלעדיו.",
  },
  RELIGION: {
    Icon: Scroll,
    themeColor: "amber",
    title: "דת ומסורת",
    subtitle: "אמונה והלכה בחייך",
    whyIsItImportant: "העולם הרוחני והדתי הוא נדבך יסודי בבניית בית נאמן בישראל. בעולם זה נבין את החיבור האישי שלך, את ההשקפה שלך, ואת החזון שלך לבית יהודי. זהו בסיס הכרחי להרמוניה זוגית וחינוך ילדים.",
    whatYouWillDiscover: [
      "ההגדרה האישית שלך על הרצף הדתי",
      "כיצד ההלכה והמסורת באות לידי ביטוי בחייך",
      "החזון שלך לחינוך דתי ורוחני במשפחה",
    ],
    guidingThought: "בית יהודי נבנה לא רק מלבנים, אלא גם מתפילות, מערכים וממסורת שעוברת מדור לדור.",
  },
};

const WORLD_ORDER: WorldId[] = ["PERSONALITY", "VALUES", "RELATIONSHIP", "PARTNER", "RELIGION"];

// --- Main Component ---
export default function WorldIntro({
  worldId,
  allQuestions,
  onStart,
  className = "",
}: WorldIntroProps) {
  const config = worldDisplayConfig[worldId];
  const { Icon, title, subtitle, whyIsItImportant, whatYouWillDiscover, guidingThought, themeColor } = config;
  const isMobile = useMediaQuery('(max-width: 1023px)');

  // חישובים דינמיים
  const totalQuestions = allQuestions.length;
  const requiredQuestions = allQuestions.filter((q) => q.isRequired).length;
  const estimatedTime = Math.max(5, Math.round(totalQuestions * 0.4)); // כ-24 שניות לשאלה, מינימום 5 דקות
  const worldIndex = WORLD_ORDER.indexOf(worldId) + 1;

  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "circOut", staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  const stats = [
    { label: "זמן משוער", value: `~${estimatedTime} דקות`, IconComp: Clock },
    { label: "סך כל שאלות", value: totalQuestions, IconComp: HelpCircle },
    { label: "שאלות חובה", value: requiredQuestions, IconComp: CheckCircle2 },
  ];

  const ActionButton = () => (
    <Button
      onClick={onStart}
      size="lg"
      className={cn(
        "w-full text-lg font-medium py-3 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105",
        `bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white`
      )}
    >
      בוא/י נתחיל את המסע
      <ArrowRight className="w-5 h-5 mr-2 animate-pulse-fast" />
    </Button>
  );

  return (
    <div className={cn("min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50", className)}>
      <motion.div
        className="w-full max-w-4xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Card className="overflow-hidden shadow-xl rounded-xl border-slate-200 bg-white">
          <CardContent className="p-0">
            {isMobile && (
              <div className="p-6 border-b">
                 <ActionButton />
              </div>
            )}
            <div className="grid lg:grid-cols-2">
              {/* Left Column: Visuals & Stats */}
              <motion.div variants={itemVariants} className={`bg-${themeColor}-50/50 p-6 sm:p-8 flex flex-col justify-between`}>
                <div>
                  <Badge variant="outline" className={`border-${themeColor}-300 bg-white text-${themeColor}-700 mb-4`}>
                    עולם {worldIndex} מתוך {WORLD_ORDER.length}
                  </Badge>
                  <div className={`mb-4 inline-block p-4 rounded-xl bg-gradient-to-br from-${themeColor}-500 to-${themeColor}-600 shadow-lg`}>
                    <Icon className="w-12 h-12 text-white" />
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-800">
                    {title}
                  </h1>
                  <p className={`mt-2 text-lg text-${themeColor}-800 font-medium`}>
                    {subtitle}
                  </p>
                </div>
                <div className="mt-8 space-y-4">
                  {stats.map((stat, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`p-2 rounded-md bg-${themeColor}-100`}>
                        <stat.IconComp className={`w-5 h-5 text-${themeColor}-600`} />
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">{stat.label}</div>
                        <div className="font-semibold text-slate-700">{stat.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Right Column: Content & CTA */}
              <motion.div variants={itemVariants} className="p-6 sm:p-8 flex flex-col justify-between">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-700 flex items-center">
                      <Sparkles className={`w-5 h-5 mr-2 text-${themeColor}-500`} />
                      למה העולם הזה קריטי להצלחה שלך?
                    </h3>
                    <p className="mt-2 text-slate-600 leading-relaxed">{whyIsItImportant}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-700 flex items-center">
                      <Brain className={`w-5 h-5 mr-2 text-${themeColor}-500`} />
                      מה תגלה/י על עצמך?
                    </h3>
                    <ul className="mt-2 space-y-1 list-disc list-inside text-slate-600">
                      {whatYouWillDiscover.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                  </div>
                  <div className={`border-r-4 border-${themeColor}-300 pr-4 py-2 bg-${themeColor}-50/60 rounded-r-md`}>
                    <p className="text-slate-700 italic">{guidingThought}</p>
                  </div>
                </div>

                {!isMobile && (
                  <div className="mt-8 pt-6 border-t border-slate-200">
                    <ActionButton />
                  </div>
                )}
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      <style jsx global>{`
        @keyframes pulse-fast { 0%, 100% { opacity: 1; transform: translateX(0); } 50% { opacity: 0.8; transform: translateX(2px); } }
        .animate-pulse-fast { animation: pulse-fast 1.5s ease-in-out infinite; }
        
        /* Tailwind CSS JIT Purge-safe classes */
        .bg-sky-50\/50, .bg-sky-100, .bg-sky-600, .hover\:bg-sky-700, .text-sky-600, .text-sky-700, .text-sky-800, .border-sky-300 { }
        .bg-rose-50\/50, .bg-rose-100, .bg-rose-600, .hover\:bg-rose-700, .text-rose-600, .text-rose-700, .text-rose-800, .border-rose-300 { }
        .bg-purple-50\/50, .bg-purple-100, .bg-purple-600, .hover\:bg-purple-700, .text-purple-600, .text-purple-700, .text-purple-800, .border-purple-300 { }
        .bg-teal-50\/50, .bg-teal-100, .bg-teal-600, .hover\:bg-teal-700, .text-teal-600, .text-teal-700, .text-teal-800, .border-teal-300 { }
        .bg-amber-50\/50, .bg-amber-100, .bg-amber-600, .hover\:bg-amber-700, .text-amber-600, .text-amber-700, .text-amber-800, .border-amber-300 { }
      `}</style>
    </div>
  );
}