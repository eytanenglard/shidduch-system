'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Sparkles,
  AlertTriangle,
  Bot,
  Brain,
  Heart,
  Users,
  Target,
  ArrowLeft,
  CheckCircle,
  Info,
  Trophy,
  MessageSquare,
  X,
  XCircle,
  Star,
  Lightbulb,
  TrendingUp,
  Award,
  Crown,
  Zap,
  Copy,
  Share2,
  Download,
  Bookmark,
  RefreshCw,
  Eye,
  ThumbsUp,
  Coffee,
  Compass,
  Puzzle,
  Gift,
  Gem,
  Wand2,
  Rocket,
  Shield,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Timer,
  Calendar,
  MapPin,
  BookOpen,
  GraduationCap,
  Home,
  Phone,
  Clock,
  Music,
  Camera,
  Globe,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AiSuggestionAnalysisResult } from '@/lib/services/aiService';

// --- Interfaces ---
interface UserAiAnalysisDialogProps {
  suggestedUserId: string;
  isDemo?: boolean;
  demoAnalysisData?: AiSuggestionAnalysisResult | null;
  currentUserName?: string;
  suggestedUserName?: string;
}

// --- Demo Data משופר ---
const mockAnalysisResult: AiSuggestionAnalysisResult = {
  overallScore: 87,
  matchTitle: 'שילוב נדיר של עומק וחמימות',
  matchSummary:
    'הקשר הפוטנציאלי בינכם מבוסס על שילוב יוצא דופן של ערכים משותפים, תשוקות דומות ותכונות אופי מקבילות. יש כאן בסיס חזק לזוגיות המבוססת על כבוד הדדי, צמיחה משותפת והבנה עמוקה.',
  compatibilityPoints: [
    {
      area: 'ערכים וחזון משותפים',
      explanation:
        'שניכם מחפשים זוגיות אמיתית המבוססת על שותפות, כבוד הדדי וערכים מסורתיים. הרצון המשותף לבניית בית יהודי חם ויציב יוצר בסיס איתן לקשר ארוך טווח.',
    },
    {
      area: 'אינטליגנציה רגשית גבוהה',
      explanation:
        'שניכם מפגינים בגרות רגשית וחוכמת חיים. היכולת שלכם להקשיב, להבין ולתמוך זה בזה תיצור סביבה בטוחה ותומכת לצמיחה אישית ויחד.',
    },
    {
      area: 'תחומי עניין ותשוקות משלימות',
      explanation:
        'בעוד שיש לכם תחומי עניין משותפים כמו ספרות וטבע, התחומים השונים שלכם (מדעים ואמנות) יעשירו זה את זה ויביאו לגיוון ועניין במערכת היחסים.',
    },
    {
      area: 'דפוסי תקשורת בריאים',
      explanation:
        'שניכם מעדיפים תקשורת פתוחה וכנה. המגמה שלכם לפתור קונפליקטים בשיחה ולא להימנע מהם מעידה על יכולת לבניית קשר חזק ויציב.',
    },
  ],
  pointsToConsider: [
    {
      area: 'קצב חיים ואנרגיה',
      explanation:
        'חשוב לבדוק האם קצב החיים והאנרגיה היומיומית שלכם תואמים. שיחה על העדפות לגבי זמן איכות, פעילויות חברתיות ורגעי שקט עשויה להיות מועילה.',
    },
    {
      area: 'תוכניות קריירה ועתיד',
      explanation:
        'כדאי לדון בתוכניות המקצועיות לטווח הארוך ובאופן שבו תוכלו לתמוך זה בזה בהגשמת החלומות האישיים תוך בניית עתיד משותף.',
    },
    {
      area: 'סגנון חיים דתי ומסורת',
      explanation:
        'למרות הבסיס הדתי המשותף, חשוב לברר פרטים נוספים על סגנון החיים הדתי, מנהגי משפחה וציפיות לגבי קיום מצוות בבית.',
    },
  ],
  suggestedConversationStarters: [
    'איך אתה רואה את האיזון האידיאלי בין זמן איכות יחד לבין מרחב אישי במערכת יחסים?',
    'מה החלום המקצועי הכי גדול שלך, ואיך אתה מדמין שבן/בת זוג יכולים לתמוך זה בזה בהגשמת החלומות?',
    'איזה מסורות ומנהגים חשובים לך במיוחד לשמר בבית שלך בעתיד?',
    'מה הדבר שהכי מרגש אותך בבניית משפחה, ואיך אתה רואה את התפקידים השונים בתוך הבית?',
    'איך אתה מתמודד עם אתגרים או לחצים, ומה עוזר לך הכי הרבה בזמנים קשים?',
  ],
};

// --- Sub-components for better modularity ---

const ScoreCircle: React.FC<{ score: number; size?: 'sm' | 'md' | 'lg' }> = ({
  score,
  size = 'md',
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'from-emerald-500 to-green-600';
    if (score >= 75) return 'from-cyan-500 to-blue-600';
    if (score >= 65) return 'from-blue-500 to-indigo-600';
    return 'from-amber-500 to-orange-600';
  };

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className="relative">
      <div
        className={cn(
          'rounded-full bg-gradient-to-br text-white flex items-center justify-center shadow-2xl border-4 border-white',
          sizeClasses[size],
          getScoreColor(score)
        )}
      >
        <div className="text-center">
          <div className={cn('font-bold', textSizeClasses[size])}>{score}%</div>
          {size === 'lg' && (
            <div className="text-xs opacity-90 font-medium">התאמה</div>
          )}
        </div>
      </div>
      <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-white/20 to-transparent opacity-0 animate-ping"></div>
    </div>
  );
};

const InsightCard: React.FC<{
  icon: React.ElementType;
  iconColor: string;
  title: string;
  description: string;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({
  icon: Icon,
  iconColor,
  title,
  description,
  index,
  isExpanded,
  onToggle,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="group"
  >
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-white to-slate-50/50 hover:-translate-y-1">
      <CardContent className="p-6 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'flex-shrink-0 w-12 h-12 rounded-xl shadow-lg flex items-center justify-center text-white',
              iconColor
            )}
          >
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-gray-800 text-lg leading-tight">
                {title}
              </h4>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-white/80 text-gray-600 border-gray-200 text-xs"
                >
                  פרט #{index + 1}
                </Badge>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
            <AnimatePresence>
              {isExpanded ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-gray-700 leading-relaxed text-base">
                    {description}
                  </p>
                </motion.div>
              ) : (
                <p className="text-gray-600 text-sm line-clamp-2">
                  {description}
                </p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const ConversationStarterCard: React.FC<{
  starter: string;
  index: number;
  onCopy: (text: string) => void;
}> = ({ starter, index, onCopy }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
  >
    <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-blue-50 to-cyan-50 group hover:-translate-y-1">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white flex items-center justify-center shadow-lg font-bold text-sm group-hover:scale-110 transition-transform">
            {index + 1}
          </div>
          <div className="flex-1">
            <p className="text-blue-900 leading-relaxed font-medium text-base mb-3">
              {starter}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCopy(starter)}
                className="text-blue-600 border-blue-200 hover:bg-blue-100 text-xs h-8"
              >
                <Copy className="w-3 h-3 ml-1" />
                העתק
              </Button>
              <Badge
                variant="outline"
                className="bg-white/60 text-blue-600 border-blue-200 text-xs"
              >
                <MessageCircle className="w-3 h-3 ml-1" />
                מוכן לשיחה
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const LoadingScreen: React.FC<{ progress: number; step: number }> = ({
  progress,
  step,
}) => {
  const loadingSteps = [
    {
      icon: Brain,
      label: 'סורק פרופילים',
      detail: 'קורא ומנתח את הנתונים האישיים',
    },
    { icon: Heart, label: 'בוחן ערכים', detail: 'מזהה ערכים והעדפות משותפות' },
    { icon: Users, label: 'מודד תאימות', detail: 'מחשב רמת התאמה מתקדמת' },
    { icon: Target, label: 'מציע תובנות', detail: 'מכין המלצות מותאמות אישית' },
    { icon: Sparkles, label: 'מסיים ניתוח', detail: 'חותם את התהליך בהצלחה' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[600px] text-center space-y-8 p-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Main Loading Animation */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 animate-pulse border-8 border-white shadow-2xl flex items-center justify-center">
          <div className="relative">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
            <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-ping"></div>
          </div>
        </div>

        {/* Floating Icons */}
        <motion.div
          className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 flex items-center justify-center shadow-lg"
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
            scale: { duration: 2, repeat: Infinity },
          }}
        >
          <Heart className="w-6 h-6 text-white" />
        </motion.div>

        <motion.div
          className="absolute -bottom-4 -left-4 w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg"
          animate={{
            rotate: -360,
            y: [-2, 2, -2],
          }}
          transition={{
            rotate: { duration: 6, repeat: Infinity, ease: 'linear' },
            y: { duration: 3, repeat: Infinity },
          }}
        >
          <Star className="w-5 h-5 text-white" />
        </motion.div>
      </div>

      {/* Title and Description */}
      <motion.div
        className="space-y-4 max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          🔮 מנתח התאמה עמוקה
        </h3>
        <p className="text-gray-600 text-lg leading-relaxed">
          האלגוריתם החכם שלנו בוחן{' '}
          <span className="font-bold text-purple-600">עשרות פרמטרים</span> כדי
          לספק לך
          <br />
          <span className="text-transparent bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text font-bold">
            תמונה מקיפה ומדויקת של הפוטנציאל
          </span>
        </p>
      </motion.div>

      {/* Progress Section */}
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-3">
          <Progress value={progress} className="h-4 bg-gray-200 shadow-inner" />
          <div className="flex justify-between items-center text-sm">
            <span className="font-bold text-purple-600">{progress}% הושלם</span>
            <span className="text-gray-500">זמן משוער: 30 שניות</span>
          </div>
        </div>

        {/* Current Step */}
        {step < loadingSteps.length && (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-blue-100 max-w-sm mx-auto"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg">
                {React.createElement(loadingSteps[step].icon, {
                  className: 'w-6 h-6',
                })}
              </div>
              <div className="text-right flex-1">
                <h4 className="font-bold text-gray-800 text-lg">
                  {loadingSteps[step].label}
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {loadingSteps[step].detail}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Fun Facts */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="text-center space-y-2"
      >
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Coffee className="w-4 h-4" />
          <span>זמן מושלם לחשוב על השאלה הראשונה שתרצה לשאול...</span>
        </div>
      </motion.div>
    </div>
  );
};

const ErrorScreen: React.FC<{ error: string; onRetry: () => void }> = ({
  error,
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center space-y-6 p-8">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', bounce: 0.5 }}
    >
      <XCircle className="w-20 h-20 text-red-400" />
    </motion.div>

    <div className="space-y-4 max-w-md">
      <h3 className="text-2xl font-bold text-gray-800">משהו השתבש בדרך...</h3>
      <Alert variant="destructive" className="text-right">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle className="font-semibold">
          לא הצלחנו להשלים את הניתוח
        </AlertTitle>
        <AlertDescription className="mt-2 leading-relaxed">
          {error ||
            'אנו מתנצלים על התקלה. זה לא אמור לקרות, והצוות הטכני שלנו יקבל הודעה על כך.'}
        </AlertDescription>
      </Alert>
    </div>

    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        onClick={onRetry}
        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl"
      >
        <RefreshCw className="w-4 h-4 ml-2" />
        נסה שוב
      </Button>
      <Button variant="outline" onClick={() => window.location.reload()}>
        <Globe className="w-4 h-4 ml-2" />
        רענן דף
      </Button>
    </div>
  </div>
);

// --- Main Dialog Body Component ---
const DialogBody: React.FC<
  UserAiAnalysisDialogProps & { onOpenChange: (open: boolean) => void }
> = ({
  suggestedUserId,
  isDemo = false,
  demoAnalysisData = null,
  currentUserName,
  suggestedUserName,
  onOpenChange,
}) => {
  const [analysis, setAnalysis] = useState<AiSuggestionAnalysisResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedInsights, setExpandedInsights] = useState<Set<number>>(
    new Set()
  );
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAnalysis = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLoadingProgress(0);
    setCurrentStep(0);

    if (isDemo) {
      const timer = setInterval(() => {
        setLoadingProgress((prev) => {
          const newProgress = Math.min(prev + 3, 100);
          setCurrentStep(Math.floor(newProgress / 20));
          return newProgress;
        });
      }, 120);

      setTimeout(() => {
        clearInterval(timer);
        setAnalysis(demoAnalysisData || mockAnalysisResult);
        setIsLoading(false);
      }, 4500);
      return;
    }

    try {
      // Progress simulation
      const progressTimer = setInterval(() => {
        setLoadingProgress((prev) => {
          const newProgress = Math.min(prev + 5, 90);
          setCurrentStep(Math.floor(newProgress / 18));
          return newProgress;
        });
      }, 200);

      const response = await fetch('/api/ai/analyze-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestedUserId }),
      });

      clearInterval(progressTimer);
      setLoadingProgress(100);

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'שגיאה בקבלת ניתוח ההצעה.');
      }

      setAnalysis(result.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'אירעה שגיאה לא צפויה.';
      setError(errorMessage);
      toast.error('שגיאה בתהליך הניתוח', { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [isDemo, demoAnalysisData, suggestedUserId]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const toggleInsight = (index: number) => {
    setExpandedInsights((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('הועתק בהצלחה!', {
        description: 'הטקסט הועתק ללוח העתקה',
      });
    } catch (err) {
      toast.error('שגיאה בהעתקה');
    }
  };

  const getScoreInterpretation = (score: number) => {
    if (score >= 85)
      return {
        level: 'התאמה יוצאת דופן',
        color: 'text-emerald-600',
        bgColor: 'from-emerald-50 to-green-50',
        description: 'זוהי התאמה נדירה עם פוטנציאל עצום להצלחה ארוכת טווח',
      };
    if (score >= 75)
      return {
        level: 'התאמה מעולה',
        color: 'text-cyan-600',
        bgColor: 'from-cyan-50 to-blue-50',
        description: 'בסיס חזק מאוד לקשר משמעותי ויציב',
      };
    if (score >= 65)
      return {
        level: 'התאמה טובה',
        color: 'text-blue-600',
        bgColor: 'from-blue-50 to-indigo-50',
        description: 'פוטנציאל טוב עם נקודות חיבור חשובות',
      };
    return {
      level: 'התאמה מעניינת',
      color: 'text-amber-600',
      bgColor: 'from-amber-50 to-orange-50',
      description: 'דורש השקעה אבל יש פוטנציאל לגילוי מפתיע',
    };
  };

  return (
    <>
      <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                🎯 ניתוח התאמה מקצועי
              </DialogTitle>
              <DialogDescription className="text-base text-gray-600 mt-1">
                {currentUserName && suggestedUserName ? (
                  <>
                    <span className="font-semibold">{currentUserName}</span>
                    <span className="mx-2">←</span>
                    <span className="font-semibold">{suggestedUserName}</span>
                  </>
                ) : (
                  'ניתוח מעמיק מבוסס בינה מלאכותית'
                )}
              </DialogDescription>
            </div>
          </div>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-10 w-10"
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogClose>
        </div>
      </DialogHeader>

      <main className="flex-1 flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loading" exit={{ opacity: 0 }} className="flex-1">
              <LoadingScreen progress={loadingProgress} step={currentStep} />
            </motion.div>
          ) : error ? (
            <motion.div key="error" exit={{ opacity: 0 }} className="flex-1">
              <ErrorScreen error={error} onRetry={fetchAnalysis} />
            </motion.div>
          ) : analysis ? (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="border-b bg-gradient-to-r from-slate-50 to-gray-50">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full flex-1 flex flex-col"
                >
                  {' '}
                  <div className="px-6 py-3">
                    <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm rounded-xl p-1 h-12">
                      <TabsTrigger
                        value="overview"
                        className="flex items-center gap-2 text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg transition-all"
                      >
                        <Crown className="w-4 h-4" />
                        <span className="hidden sm:inline">סקירה כללית</span>
                        <span className="sm:hidden">סקירה</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="strengths"
                        className="flex items-center gap-2 text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white rounded-lg transition-all"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">נקודות חוזק</span>
                        <span className="sm:hidden">חוזק</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="considerations"
                        className="flex items-center gap-2 text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg transition-all"
                      >
                        <Lightbulb className="w-4 h-4" />
                        <span className="hidden sm:inline">נקודות למחשבה</span>
                        <span className="sm:hidden">מחשבה</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="conversation"
                        className="flex items-center gap-2 text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-lg transition-all"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="hidden sm:inline">שיחה</span>
                        <span className="sm:hidden">שיחה</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  <ScrollArea className="flex-1 min-h-0">
                    {' '}
                    <div className="p-6">
                      <TabsContent value="overview" className="mt-0 space-y-6">
                        {/* Hero Section with Score */}
                        <Card
                          className={cn(
                            'border-0 shadow-xl overflow-hidden bg-gradient-to-br',
                            getScoreInterpretation(analysis.overallScore)
                              .bgColor
                          )}
                        >
                          <CardContent className="p-8 relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>

                            <div className="relative z-10 text-center space-y-6">
                              <div className="flex items-center justify-center gap-6">
                                <ScoreCircle
                                  score={analysis.overallScore}
                                  size="lg"
                                />
                                <div className="text-right space-y-2">
                                  <Badge className="bg-white/90 text-gray-800 border-0 shadow-lg text-lg px-4 py-2 font-bold">
                                    <Star className="w-4 h-4 ml-2 text-yellow-500 fill-current" />
                                    {
                                      getScoreInterpretation(
                                        analysis.overallScore
                                      ).level
                                    }
                                  </Badge>
                                  <p
                                    className={cn(
                                      'text-lg font-semibold',
                                      getScoreInterpretation(
                                        analysis.overallScore
                                      ).color
                                    )}
                                  >
                                    {
                                      getScoreInterpretation(
                                        analysis.overallScore
                                      ).description
                                    }
                                  </p>
                                </div>
                              </div>

                              <Separator className="bg-white/20" />

                              <div className="space-y-4">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight">
                                  {analysis.matchTitle}
                                </h2>
                                <p className="text-gray-700 text-lg leading-relaxed max-w-3xl mx-auto">
                                  {analysis.matchSummary}
                                </p>
                              </div>

                              {/* Quick Stats */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center shadow-md">
                                  <div className="text-2xl font-bold text-emerald-600">
                                    {analysis.compatibilityPoints.length}
                                  </div>
                                  <div className="text-sm text-gray-600 font-medium">
                                    נקודות חיבור
                                  </div>
                                </div>
                                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center shadow-md">
                                  <div className="text-2xl font-bold text-amber-600">
                                    {analysis.pointsToConsider.length}
                                  </div>
                                  <div className="text-sm text-gray-600 font-medium">
                                    נקודות לדיון
                                  </div>
                                </div>
                                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center shadow-md">
                                  <div className="text-2xl font-bold text-blue-600">
                                    {
                                      analysis.suggestedConversationStarters
                                        .length
                                    }
                                  </div>
                                  <div className="text-sm text-gray-600 font-medium">
                                    נושאי שיחה
                                  </div>
                                </div>
                                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center shadow-md">
                                  <div className="text-2xl font-bold text-purple-600">
                                    AI
                                  </div>
                                  <div className="text-sm text-gray-600 font-medium">
                                    ניתוח מתקדם
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="strengths" className="mt-0 space-y-6">
                        <div className="text-center mb-8">
                          <h3 className="text-2xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
                            <Trophy className="w-8 h-8 text-yellow-500" />
                            נקודות החיבור החזקות שלכם
                          </h3>
                          <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
                            אלו הם התחומים שבהם אתם הכי מתאימים זה לזה ושיכולים
                            להוביל להצלחה משותפת
                          </p>
                        </div>

                        <div className="space-y-4">
                          {analysis.compatibilityPoints.map((point, index) => (
                            <InsightCard
                              key={index}
                              icon={CheckCircle}
                              iconColor="bg-gradient-to-r from-emerald-500 to-green-600"
                              title={point.area}
                              description={point.explanation}
                              index={index}
                              isExpanded={expandedInsights.has(index)}
                              onToggle={() => toggleInsight(index)}
                            />
                          ))}
                        </div>

                        {analysis.compatibilityPoints.length === 0 && (
                          <div className="text-center py-12">
                            <Heart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">
                              אין תובנות ספציפיות זמינות
                            </h3>
                            <p className="text-gray-500 max-w-md mx-auto">
                              זה לא אומר שאין התאמה - פשוט צריך להכיר יותר לעומק
                            </p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent
                        value="considerations"
                        className="mt-0 space-y-6"
                      >
                        <div className="text-center mb-8">
                          <h3 className="text-2xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
                            <Compass className="w-8 h-8 text-amber-500" />
                            נושאים חשובים לדיון ובירור
                          </h3>
                          <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
                            תחומים שכדאי לחקור יחד כדי להבין טוב יותר איך אתם
                            משלימים זה את זה
                          </p>
                        </div>

                        <div className="space-y-4">
                          {analysis.pointsToConsider.map((point, index) => (
                            <InsightCard
                              key={index}
                              icon={Lightbulb}
                              iconColor="bg-gradient-to-r from-amber-500 to-orange-600"
                              title={point.area}
                              description={point.explanation}
                              index={index}
                              isExpanded={expandedInsights.has(index + 100)} // Different range to avoid conflicts
                              onToggle={() => toggleInsight(index + 100)}
                            />
                          ))}
                        </div>

                        {analysis.pointsToConsider.length === 0 && (
                          <div className="text-center py-12">
                            <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">
                              כל הנתונים נראים מתואמים
                            </h3>
                            <p className="text-gray-500 max-w-md mx-auto">
                              לא זוהו תחומים שדורשים תשומת לב מיוחדת
                            </p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent
                        value="conversation"
                        className="mt-0 space-y-6"
                      >
                        <div className="text-center mb-8">
                          <h3 className="text-2xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
                            <Rocket className="w-8 h-8 text-blue-500" />
                            רעיונות לפתיחת שיחות מעניינות
                          </h3>
                          <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
                            שאלות ונושאים שיעזרו לכם להכיר זה את זה טוב יותר
                            ולבנות חיבור אמיתי
                          </p>
                        </div>

                        <div className="space-y-4">
                          {analysis.suggestedConversationStarters.map(
                            (starter, index) => (
                              <ConversationStarterCard
                                key={index}
                                starter={starter}
                                index={index}
                                onCopy={copyToClipboard}
                              />
                            )
                          )}
                        </div>

                        {analysis.suggestedConversationStarters.length ===
                          0 && (
                          <div className="text-center py-12">
                            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">
                              אין הצעות ספציפיות לשיחה
                            </h3>
                            <p className="text-gray-500 max-w-md mx-auto">
                              תתחילו בשיחה טבעית - זה תמיד הכי טוב
                            </p>
                          </div>
                        )}

                        {/* Tips Section */}
                        <Card className="border-0 shadow-lg bg-gradient-to-r from-cyan-50 to-blue-50">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <div className="p-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg flex-shrink-0">
                                <Gift className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="font-bold text-cyan-800 text-lg mb-3">
                                  💡 טיפים לשיחה מוצלחת
                                </h4>
                                <ul className="space-y-2 text-cyan-700">
                                  <li className="flex items-start gap-2">
                                    <ChevronRight className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                                    <span>
                                      שאלו שאלות פתוחות שמזמינות לחלוק יותר
                                    </span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <ChevronRight className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                                    <span>הקשיבו בקשב ובעניין אמיתי</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <ChevronRight className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                                    <span>
                                      חלקו גם משלכם - זה מזמין חיבור הדדי
                                    </span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <ChevronRight className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                                    <span>
                                      זכרו שהמטרה היא ליהנות ולהכיר - לא לעבור
                                      ראיון
                                    </span>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </div>
                  </ScrollArea>
                </Tabs>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* Footer with Actions */}
      <div className="border-t bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(JSON.stringify(analysis, null, 2))}
              disabled={!analysis}
              className="text-gray-600 border-gray-200 hover:bg-gray-100"
            >
              <Copy className="w-4 h-4 ml-2" />
              העתק ניתוח
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!analysis}
              className="text-gray-600 border-gray-200 hover:bg-gray-100"
            >
              <Share2 className="w-4 h-4 ml-2" />
              שתף
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4 ml-2" />
              סגור
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Note */}
      {analysis && (
        <Card className="mx-6 mb-6 border-0 shadow-lg bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Wand2 className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-purple-800">הערה חשובה</span>
            </div>
            <p className="text-sm text-purple-700 leading-relaxed">
              הניתוח מבוסס על נתונים זמינים ומהווה נקודת מוצא לחשיבה.
              <br />
              <span className="font-semibold">
                כל קשר אנושי הוא ייחודי ודורש הכרות אישית עמוקה יותר.
              </span>
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
};

// --- Main exported wrapper component ---
export const UserAiAnalysisDialog: React.FC<UserAiAnalysisDialogProps> = (
  props
) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasBeenOpened, setHasBeenOpened] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !hasBeenOpened) {
      setHasBeenOpened(true);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="relative overflow-hidden group bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-pink-100 hover:border-blue-300 transition-all duration-500 shadow-xl hover:shadow-2xl rounded-2xl h-16 px-8 text-lg font-bold"
        >
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-x-full group-hover:animate-shimmer" />

          {/* Content */}
          <div className="relative z-10 flex items-center gap-4">
            <div className="relative">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              >
                <Brain className="w-8 h-8 text-blue-600" />
              </motion.div>
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              >
                <Sparkles className="w-4 h-4 text-purple-500" />
              </motion.div>
            </div>

            <div className="text-right">
              <div className="font-bold text-lg text-gray-800">
                🔮 ניתוח התאמה מתקדם
              </div>
              <div className="text-sm text-gray-600 font-medium">
                גלה את הפוטנציאל האמיתי
              </div>
            </div>
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent
        className="max-w-6xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl rounded-3xl bg-white border-0"
        dir="rtl"
      >
        {isOpen && <DialogBody {...props} onOpenChange={handleOpenChange} />}
      </DialogContent>

      <style jsx global>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }

        .animate-pulse-subtle {
          animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse-subtle {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </Dialog>
  );
};

export default UserAiAnalysisDialog;