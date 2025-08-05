// src/components/questionnaire/layout/WorldsMap.tsx

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Scroll,
  Heart,
  Users,
  User,
  CheckCircle2,
  Lock,
  ArrowRight,
  Star,
  UserCheck,
  Sparkles,
  Edit3,
  Award,
  Brain,
  BookUser,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

// ============================================================================
// 1. CONFIGURATION OBJECT (REVISED WITH NEW COPYWRITING STRATEGY)
// ============================================================================

const worldsConfig = {
  PERSONALITY: {
    icon: User,
    label: 'אישיות',
    description:
      'כאן תצייר/י תמונה אותנטית של אישיותך, כדי שנוכל להבין לעומק מי את/ה - מעבר לפרטים היבשים.',
    order: 1,
    themeColor: 'sky',
    why: 'תשובותיך כאן מאפשרות לשדכנים ול-AI שלנו להכיר את האדם שמאחורי הפרופיל, ולהציג אותך בצורה המדויקת והמחמיאה ביותר לצד השני.',
    focusPoints: [
      'תכונות האופי המרכזיות שלך',
      'סגנון התקשורת והחברתיות',
      'דרכי התמודדות וקבלת החלטות',
    ],
  },
  VALUES: {
    icon: Heart,
    label: 'ערכים ואמונות',
    description:
      'מהם עמודי התווך של חייך? כאן נגדיר את הערכים והאמונות שמנחים אותך, ומהווים בסיס לבית משותף.',
    order: 2,
    themeColor: 'rose',
    why: 'זהו החלק החשוב ביותר לסינון מדויק. התאמה ערכית היא המפתח לקשר יציב וארוך טווח, ואנו מתייחסים לכך בכובד הראש הראוי.',
    focusPoints: [
      'סדרי העדיפויות שלך בחיים',
      'גישתך לכסף, נתינה וצמיחה',
      'השקפת עולמך והחזון למשפחה',
    ],
  },
  RELATIONSHIP: {
    icon: Users,
    label: 'זוגיות',
    description:
      'מהי זוגיות עבורך? כאן תפרט/י את ציפיותיך מהקשר ואת החזון שלך לשותפות ארוכת טווח.',
    order: 3,
    themeColor: 'purple',
    why: 'כדי למצוא שותפ/ה לחיים, עלינו להבין איך נראית השותפות האידיאלית בעיניך. המידע כאן מונע אי הבנות וממקד את החיפוש באנשים עם ציפיות דומות.',
    focusPoints: [
      'הגדרת "שפות האהבה" שלך',
      'סגנון תקשורת ופתרון קונפליקטים',
      'האיזון הרצוי בין "ביחד" ל"לחוד"',
    ],
  },
  PARTNER: {
    icon: UserCheck,
    label: 'הפרטנר האידיאלי',
    description:
      'מי האדם שאת/ה מחפש/ת? בעולם זה נמקד את החיפוש ונבין מהן התכונות החיוניות לך בבן/בת הזוג.',
    order: 4,
    themeColor: 'teal',
    why: 'הגדרה מדויקת של מה שאת/ה מחפש/ת מאפשרת לנו לבצע חיפוש יעיל וחכם, ולחסוך לך הצעות שאינן רלוונטיות.',
    focusPoints: [
      'תכונות האופי החשובות לך ביותר',
      'העדפות לגבי רקע וסגנון חיים',
      'הגדרת ה"קווים האדומים" שלך',
    ],
  },
  RELIGION: {
    icon: Scroll,
    label: 'דת ומסורת',
    description:
      'מהו החיבור שלך ליהדות? כאן תפרט/י את זהותך הדתית, השקפתך והאופן בו המסורת באה לידי ביטוי בחייך.',
    order: 5,
    themeColor: 'amber',
    why: 'התאמה רוחנית ודתית היא קריטית במגזר. תשובות מדויקות כאן הן המפתח לבניית בית נאמן בישראל על בסיס משותף ויציב.',
    focusPoints: [
      'ההגדרה המדויקת שלך על הרצף הדתי',
      'הביטוי המעשי של ההלכה בחייך',
      'החזון שלך לחינוך דתי במשפחה',
    ],
  },
} as const;

type WorldId = keyof typeof worldsConfig;

const WORLD_ORDER: WorldId[] = [
  'PERSONALITY',
  'VALUES',
  'RELATIONSHIP',
  'PARTNER',
  'RELIGION',
];

type WorldStatus =
  | 'completed'
  | 'recommended'
  | 'active'
  | 'available'
  | 'locked';

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

const ProgressHeader: React.FC<ProgressHeaderProps> = ({
  userName,
  completionPercent,
  completedCount,
  totalCount,
  nextRecommendedWorld,
  onGoToRecommended,
}) => (
  <motion.div
    className="bg-white/95 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/60 space-y-4"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: 'easeOut' }}
  >
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
        {userName
          ? `שלום, ${userName}! ברוך הבא למסע שלך`
          : 'הנתיב שלך לזוגיות משמעותית'}
      </h1>
      <p className="text-md text-gray-600 mt-1">
        השלמת{' '}
        <span className="font-semibold text-teal-600">
          {completedCount}
        </span>{' '}
        מתוך <span className="font-semibold">{totalCount}</span> עולמות.
      </p>
    </div>
    <div className="flex items-center gap-4">
      <Progress
        value={completionPercent}
        className="h-2.5 rounded-full"
        indicatorClassName="bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500"
      />
      <span className="font-bold text-teal-600 text-lg">
        {completionPercent}%
      </span>
    </div>
    {nextRecommendedWorld && (
      <Button
        size="lg"
        onClick={onGoToRecommended}
        className="w-full sm:w-auto bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 animate-pulse-slow"
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
    completed: {
      Icon: CheckCircle2,
      text: 'הושלם',
      badge: 'bg-green-100 text-green-800 border-green-300',
      action: 'ערוך תשובות',
      ActionIcon: Edit3,
    },
    recommended: {
      Icon: Star,
      text: 'הצעד הבא',
      badge: 'bg-gradient-to-r from-teal-100 to-orange-100 text-teal-800 border-teal-300',
      action: 'התחל עולם זה',
      ActionIcon: Sparkles,
    },
    active: {
      Icon: Sparkles,
      text: 'פעיל כעת',
      badge: `bg-${config.themeColor}-100 text-${config.themeColor}-800 border-${config.themeColor}-300`,
      action: 'המשך כאן',
      ActionIcon: ArrowRight,
    },
    available: {
      Icon: ArrowRight,
      text: 'זמין',
      badge: 'bg-gray-100 text-gray-800 border-gray-300',
      action: 'התחל עולם זה',
      ActionIcon: ArrowRight,
    },
    locked: {
      Icon: Lock,
      text: 'נעול',
      badge: 'bg-gray-200 text-gray-600 border-gray-300',
      action: 'נעול',
      ActionIcon: Lock,
    },
  }[status];

  const themeClasses = {
    ring: `ring-${config.themeColor}-500`,
    iconBg: `bg-${config.themeColor}-100`,
    iconColor: `text-${config.themeColor}-600`,
    actionButton: `bg-${config.themeColor}-600 hover:bg-${config.themeColor}-700 text-white`,
  };

  const isLocked = status === 'locked';

  return (
    <Card
      className={cn(
        'flex flex-col h-full transition-all duration-300 ease-in-out overflow-hidden shadow-lg hover:shadow-xl bg-white/90 backdrop-blur-sm border-2',
        status === 'recommended' &&
          'border-gradient-to-r from-teal-300 to-orange-300 scale-105 shadow-2xl ring-2 ring-teal-200',
        isLocked
          ? 'opacity-60 bg-gray-50 cursor-not-allowed border-gray-200'
          : 'border-white/60 hover:-translate-y-1'
      )}
    >
      <div className="p-6 flex-grow space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div
            className={cn('p-3 rounded-xl flex-shrink-0', themeClasses.iconBg)}
          >
            <config.icon className={cn('w-8 h-8', themeClasses.iconColor)} />
          </div>
          <Badge
            variant="outline"
            className={cn('text-xs font-medium', statusInfo.badge)}
          >
            <statusInfo.Icon className="w-3.5 h-3.5 ml-1.5" />
            {statusInfo.text}
          </Badge>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            {config.label}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed mt-1">
            {config.description}
          </p>
        </div>

        {status === 'recommended' && (
          <div className="pt-2">
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <Brain className="w-4 h-4 mr-2 text-teal-500" />
              במה נתמקד?
            </h4>
            <ul className="space-y-1.5">
              {config.focusPoints.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start text-xs text-gray-600"
                >
                  <CheckCircle2 className="w-3 h-3 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="p-4 bg-gray-50/80 mt-auto">
        <Button
          className={cn('w-full font-medium', themeClasses.actionButton)}
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
  className = '',
}: WorldsMapProps) {
  const { data: session } = useSession();

  const completionPercent = Math.round(
    (completedWorlds.length / WORLD_ORDER.length) * 100
  );
  const nextRecommendedWorld = WORLD_ORDER.find(
    (world) => !completedWorlds.includes(world)
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
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
    <motion.div
      variants={itemVariants}
      className="md:col-span-2 lg:col-span-1 lg:row-span-2"
    >
      <WorldCard
        worldId={nextRecommendedWorld}
        status="recommended"
        onSelect={() => onWorldChange(nextRecommendedWorld)}
      />
    </motion.div>
  ) : null;

  const otherCards = WORLD_ORDER.filter(
    (worldId) => worldId !== nextRecommendedWorld
  ).map((worldId) => (
    <motion.div variants={itemVariants} key={worldId}>
      <WorldCard
        worldId={worldId}
        status={getWorldStatus(worldId)}
        onSelect={() => onWorldChange(worldId)}
      />
    </motion.div>
  ));

  return (
    <div
      className={cn(
        'p-4 sm:p-6 bg-gradient-to-b from-white via-teal-50/20 to-white min-h-screen relative overflow-hidden',
        className
      )}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-teal-200/30 to-orange-200/20 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-amber-200/30 to-orange-200/20 rounded-full blur-2xl animate-float-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-gradient-to-br from-teal-200/25 to-amber-200/20 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '4s' }} />
        <div className="absolute bottom-10 right-10 w-28 h-28 bg-gradient-to-br from-orange-200/30 to-amber-200/25 rounded-full blur-2xl animate-float-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-7xl mx-auto space-y-8 relative">
        <ProgressHeader
          userName={session?.user?.firstName}
          completionPercent={completionPercent}
          completedCount={completedWorlds.length}
          totalCount={WORLD_ORDER.length}
          nextRecommendedWorld={nextRecommendedWorld}
          onGoToRecommended={() =>
            nextRecommendedWorld && onWorldChange(nextRecommendedWorld)
          }
        />

        {completedWorlds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
          >
            <Card className="bg-white/90 backdrop-blur-md shadow-md border border-white/60">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-teal-100 rounded-lg">
                    <BookUser className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      רוצה לסקור את התשובות שלך?
                    </h3>
                    <p className="text-sm text-gray-600">
                      צפה/י בכל התשובות שמילאת עד כה במקום אחד.
                    </p>
                  </div>
                </div>
                <Link href="/profile?tab=questionnaire">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto bg-white/80 border-teal-200 text-teal-600 hover:bg-teal-50 hover:border-teal-300"
                  >
                    <ArrowRight className="w-4 h-4 ml-2" />
                    לסקירת התשובות
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}

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
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className="bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 text-white text-center p-8 rounded-2xl shadow-2xl">
              <Award className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-3xl font-bold">
                כל הכבוד, {session?.user?.firstName}!
              </h2>
              <p className="mt-2 text-lg opacity-90">
                סיימת את כל עולמות השאלון. עשית צעד ענק במסע שלך!
              </p>
              <p className="mt-1 text-sm opacity-80">
                הפרופיל המלא שלך מוכן כעת עבור השדכנים שלנו.
              </p>
            </Card>
          </motion.div>
        )}
      </div>

      <style jsx global>{`
        @keyframes pulse-slow {
          50% {
            opacity: 0.9;
            transform: scale(1.02);
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(0.5deg); }
          75% { transform: translateY(3px) rotate(-0.5deg); }
        }
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}