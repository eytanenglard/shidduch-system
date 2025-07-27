// src/components/questionnaire/layout/WorldsMap.tsx

import React from "react";
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Scroll, Heart, Users, User, CheckCircle2, Lock, ArrowRight, Star, UserCheck, Sparkles, Edit3, Award, Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

// ============================================================================
// 1. CONFIGURATION OBJECT (ENHANCED WITH MARKETING & MOTIVATIONAL CONTENT)
// ============================================================================

const worldsConfig = {
  PERSONALITY: {
    icon: User,
    label: "אישיות",
    description: "מי אני באמת? גלה את הכוחות הייחודיים שלך, את סגנון התקשורת שלך ומה מניע אותך בחיים.",
    order: 1,
    themeColor: "sky",
    why: "הבנה עמוקה של מי שאת/ה היא הבסיס לכל קשר בריא. כאן תציג/י את עצמך בצורה אותנטית, כדי שנמצא מישהו שיתאהב בך באמת.",
    discover: [
      "הכוחות המניעים אותך בחיים",
      "סגנון התקשורת שלך",
      "איך את/ה מתמודד/ת עם אתגרים",
    ],
  },
  VALUES: {
    icon: Heart,
    label: "ערכים ואמונות",
    description: "מה באמת מניע אותך? זקק את עקרונות הליבה שלך ובנה יסודות איתנים לבית המשותף.",
    order: 2,
    themeColor: "rose",
    why: "ערכים משותפים הם עמוד השדרה של קשר יציב ומאושר. כאן נבין מהם סדרי העדיפויות שלך ואיזו סביבה מתאימה לך.",
    discover: [
      "סדרי העדיפויות שלך בחיים",
      "גישתך לכסף, נתינה וצמיחה",
      "איזו סביבה חברתית מתאימה לך",
    ],
  },
  RELATIONSHIP: {
    icon: Users,
    label: "זוגיות",
    description: "איך נראית השותפות האידיאלית שלך? עצב את החזון שלך לקשר המבוסס על הבנה, כבוד וחברות.",
    order: 3,
    themeColor: "purple",
    why: "זוגיות טובה היא שותפות. כאן נבין את הציפיות שלך, את 'שפות האהבה' שלך ואיך את/ה רואה את חיי היומיום המשותפים.",
    discover: [
      "תמצית הזוגיות הבריאה בעיניך",
      "סגנון פתרון הקונפליקטים שלך",
      "האיזון הנכון בין 'ביחד' ל'לחוד'",
    ],
  },
  PARTNER: {
    icon: UserCheck,
    label: "הפרטנר האידיאלי",
    description: "במי תרצה/י לבחור? הגדר את התכונות והערכים החשובים לך ביותר בבן/בת הזוג.",
    order: 4,
    themeColor: "teal",
    why: "הגדרת בן/בת הזוג היא יותר מרשימת תכונות; זו הבנה של מה באמת נחוץ לך כדי לפרוח. כאן נמקד את החיפוש.",
    discover: [
      "אילו תכונות אופי חיוניות לך",
      "העדפותיך לגבי סגנון חיים ורקע",
      "מהם ה'קווים האדומים' שלך",
    ],
  },
  RELIGION: {
    icon: Scroll,
    label: "דת ומסורת",
    description: "מה מקום האמונה וההלכה בחייך? נבין את החיבור האישי שלך ואת החזון לבית יהודי.",
    order: 5,
    themeColor: "amber",
    why: "העולם הרוחני הוא נדבך יסודי בבניית בית נאמן בישראל. זהו בסיס הכרחי להרמוניה זוגית וחינוך ילדים.",
    discover: [
      "ההגדרה האישית שלך על הרצף הדתי",
      "כיצד ההלכה באה לידי ביטוי בחייך",
      "החזון שלך לחינוך דתי במשפחה",
    ],
  },
} as const;

type WorldId = keyof typeof worldsConfig;

const WORLD_ORDER: WorldId[] = [
  "PERSONALITY",
  "VALUES",
  "RELATIONSHIP",
  "PARTNER",
  "RELIGION",
];

type WorldStatus = 'completed' | 'recommended' | 'active' | 'available' | 'locked';

// ============================================================================
// 2. TYPE DEFINITIONS & PROPS
// ============================================================================
interface WorldsMapProps {
  currentWorld: WorldId;
  completedWorlds: WorldId[];
  onWorldChange: (worldId: WorldId) => void;
  className?: string;
}

interface WorldCardProps {
  worldId: WorldId;
  status: WorldStatus;
  onSelect: () => void;
}

interface ProgressHeaderProps {
  userName?: string | null;
  completionPercent: number;
  completedCount: number;
  totalCount: number;
  nextRecommendedWorld?: WorldId;
  onGoToRecommended: () => void;
}

// ============================================================================
// 3. SUB-COMPONENTS
// ============================================================================

const ProgressHeader: React.FC<ProgressHeaderProps> = ({ userName, completionPercent, completedCount, totalCount, nextRecommendedWorld, onGoToRecommended }) => (
  <motion.div 
    className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 space-y-4"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
  >
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
        {userName ? `שלום, ${userName}! ברוך הבא למסע שלך` : 'הנתיב שלך לזוגיות משמעותית'}
      </h1>
      <p className="text-md text-slate-500 dark:text-slate-400 mt-1">
        השלמת <span className="font-semibold text-indigo-600 dark:text-indigo-400">{completedCount}</span> מתוך <span className="font-semibold">{totalCount}</span> עולמות.
      </p>
    </div>
    <div className="flex items-center gap-4">
      <Progress value={completionPercent} className="h-2.5 rounded-full" indicatorClassName="bg-gradient-to-r from-sky-400 to-indigo-500" />
      <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">{completionPercent}%</span>
    </div>
    {nextRecommendedWorld && (
      <Button
        size="lg"
        onClick={onGoToRecommended}
        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 animate-pulse-slow"
      >
        <Sparkles className="h-5 w-5 mr-2 fill-current" />
        המשך לעולם המומלץ: {worldsConfig[nextRecommendedWorld].label}
      </Button>
    )}
  </motion.div>
);

const WorldCard: React.FC<WorldCardProps> = ({ worldId, status, onSelect }) => {
  const config = worldsConfig[worldId];
  
  const statusInfo = {
    completed: { Icon: CheckCircle2, text: "הושלם", badge: "bg-green-100 text-green-800 border-green-300", action: "ערוך תשובות", ActionIcon: Edit3 },
    recommended: { Icon: Star, text: "הצעד הבא", badge: "bg-indigo-100 text-indigo-800 border-indigo-300", action: "התחל עולם זה", ActionIcon: Sparkles },
    active: { Icon: Sparkles, text: "פעיל כעת", badge: `bg-${config.themeColor}-100 text-${config.themeColor}-800 border-${config.themeColor}-300`, action: "המשך כאן", ActionIcon: ArrowRight },
    available: { Icon: ArrowRight, text: "זמין", badge: "bg-slate-100 text-slate-800 border-slate-300", action: "התחל עולם זה", ActionIcon: ArrowRight },
    locked: { Icon: Lock, text: "נעול", badge: "bg-slate-200 text-slate-600 border-slate-300", action: "נעול", ActionIcon: Lock },
  }[status];

  const themeClasses = {
    ring: `ring-${config.themeColor}-500`,
    iconBg: `bg-${config.themeColor}-100 dark:bg-${config.themeColor}-800/50`,
    iconColor: `text-${config.themeColor}-600 dark:text-${config.themeColor}-400`,
    actionButton: `bg-${config.themeColor}-600 hover:bg-${config.themeColor}-700 text-white`,
  };

  const isLocked = status === 'locked';

  return (
    <Card 
      className={cn(
        "flex flex-col h-full transition-all duration-300 ease-in-out overflow-hidden shadow-lg hover:shadow-xl dark:bg-slate-800 border-2",
        status === 'recommended' && `border-${config.themeColor}-300 dark:border-${config.themeColor}-600 scale-105 shadow-2xl`,
        isLocked ? "opacity-60 bg-slate-50 dark:bg-slate-800/60 cursor-not-allowed border-slate-200 dark:border-slate-700" : "border-transparent hover:-translate-y-1"
      )}
    >
      <div className="p-6 flex-grow space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className={cn("p-3 rounded-xl flex-shrink-0", themeClasses.iconBg)}>
            <config.icon className={cn("w-8 h-8", themeClasses.iconColor)} />
          </div>
          <Badge variant="outline" className={cn("text-xs font-medium", statusInfo.badge)}>
            <statusInfo.Icon className="w-3.5 h-3.5 ml-1.5" />
            {statusInfo.text}
          </Badge>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{config.label}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-1">{config.description}</p>
        </div>
        
        {status === 'recommended' && (
           <div className="pt-2">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center">
                 <Brain className="w-4 h-4 mr-2 text-indigo-500"/>
                 מה תגלה/י על עצמך?
              </h4>
              <ul className="space-y-1.5">
                {config.discover.map((item, index) => (
                  <li key={index} className="flex items-start text-xs text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-3 h-3 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
           </div>
        )}
      </div>
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 mt-auto">
        <Button
          className={cn("w-full font-medium", themeClasses.actionButton)}
          onClick={onSelect}
          disabled={isLocked}
        >
          <statusInfo.ActionIcon className="w-4 h-4 ml-2" />
          {statusInfo.action}
        </Button>
      </div>
    </Card>
  );
};

// ============================================================================
// 4. MAIN COMPONENT
// ============================================================================
export default function WorldsMap({
  currentWorld,
  completedWorlds,
  onWorldChange,
  className = "",
}: WorldsMapProps) {
  const { data: session } = useSession();

  const completionPercent = Math.round((completedWorlds.length / WORLD_ORDER.length) * 100);
  const nextRecommendedWorld = WORLD_ORDER.find((world) => !completedWorlds.includes(world));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const getWorldStatus = (worldId: WorldId): WorldStatus => {
    if (completedWorlds.includes(worldId)) return 'completed';
    if (worldId === nextRecommendedWorld) return 'recommended';
    if (worldId === currentWorld) return 'active';
    // Add locking logic if needed, for now all are available
    return 'available';
  };
  
  const recommendedCard = nextRecommendedWorld ? (
    <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-1 lg:row-span-2">
      <WorldCard 
        worldId={nextRecommendedWorld} 
        status="recommended" 
        onSelect={() => onWorldChange(nextRecommendedWorld)}
      />
    </motion.div>
  ) : null;

  const otherCards = WORLD_ORDER
    .filter(worldId => worldId !== nextRecommendedWorld)
    .map(worldId => (
      <motion.div variants={itemVariants} key={worldId}>
        <WorldCard 
          worldId={worldId}
          status={getWorldStatus(worldId)} 
          onSelect={() => onWorldChange(worldId)}
        />
      </motion.div>
  ));

  return (
    <div className={cn("p-4 sm:p-6 bg-slate-50 dark:bg-slate-900 min-h-screen", className)}>
      <div className="max-w-7xl mx-auto space-y-8">
        <ProgressHeader
          userName={session?.user?.firstName}
          completionPercent={completionPercent}
          completedCount={completedWorlds.length}
          totalCount={WORLD_ORDER.length}
          nextRecommendedWorld={nextRecommendedWorld}
          onGoToRecommended={() => nextRecommendedWorld && onWorldChange(nextRecommendedWorld)}
        />
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {recommendedCard}
          {otherCards}
        </motion.div>

        {completionPercent === 100 && (
          <motion.div variants={itemVariants} initial="hidden" animate="visible">
            <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center p-8 rounded-2xl shadow-2xl">
              <Award className="w-16 h-16 mx-auto mb-4"/>
              <h2 className="text-3xl font-bold">כל הכבוד, {session?.user?.firstName}!</h2>
              <p className="mt-2 text-lg opacity-90">סיימת את כל עולמות השאלון. עשית צעד ענק במסע שלך!</p>
              <p className="mt-1 text-sm opacity-80">הפרופיל המלא שלך מוכן כעת עבור השדכנים שלנו.</p>
            </Card>
          </motion.div>
        )}
      </div>

      <style jsx global>{`
        @keyframes pulse-slow {
          50% { opacity: 0.9; transform: scale(1.02); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}