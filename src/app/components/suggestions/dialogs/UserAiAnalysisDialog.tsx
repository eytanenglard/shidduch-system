// src/app/components/suggestions/dialogs/UserAiAnalysisDialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  Sparkles,
  AlertTriangle,
  Bot,
  Brain,
  Heart,
  Users,
  Target,
  FileText,
  BookOpen,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Star,
  Download,
  Share2,
  Bookmark,
  ArrowLeft,
  ArrowRight,
  Info,
  Lightbulb,
  Shield,
  Award,
  Clock,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import UserAiAnalysisDisplay from '../compatibility/UserAiAnalysisDisplay';
import type { AiSuggestionAnalysisResult } from '@/lib/services/aiService';

interface UserAiAnalysisDialogProps {
  suggestedUserId: string;
  isDemo?: boolean;
  demoAnalysisData?: AiSuggestionAnalysisResult | null;
  currentUserName?: string;
  suggestedUserName?: string;
}

interface AnalysisSection {
  title: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  data?: any;
}

interface CompatibilityScore {
  overall: number;
  values: number;
  lifestyle: number;
  personality: number;
  spiritual: number;
}

interface AnalysisInsight {
  type: 'strength' | 'challenge' | 'recommendation';
  title: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
  icon: React.ElementType;
}

export const UserAiAnalysisDialog: React.FC<UserAiAnalysisDialogProps> = ({
  suggestedUserId,
  isDemo = false,
  demoAnalysisData = null,
  currentUserName = "המועמד הנוכחי",
  suggestedUserName = "המועמד המוצע"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [analysis, setAnalysis] = useState<AiSuggestionAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedInsights, setExpandedInsights] = useState<string[]>([]);

  // שלבי הטעינה
  const loadingSteps = [
    { icon: Brain, label: 'מעבד פרופילים', description: 'קורא ומנתח את הפרופילים האישיים' },
    { icon: Heart, label: 'בוחן ערכים', description: 'משווה ערכים, אמונות ויעדי חיים' },
    { icon: Users, label: 'מודד תאימות', description: 'מחשב רמת התאימות בתחומים שונים' },
    { icon: Target, label: 'מציע תובנות', description: 'מכין המלצות והכוונה מקצועית' },
    { icon: Sparkles, label: 'מסיים ניתוח', description: 'מעצב את הדוח הסופי' }
  ];

  // נתוני דמו לדוגמה
  const mockCompatibilityScore: CompatibilityScore = {
    overall: 87,
    values: 92,
    lifestyle: 78,
    personality: 85,
    spiritual: 94
  };

  const mockInsights: AnalysisInsight[] = [
    {
      type: 'strength',
      title: 'התאמה רוחנית מעולה',
      description: 'שני הצדדים חולקים רמת דתיות דומה ומחויבות לערכים יהודיים, מה שיוצר בסיס חזק למערכת יחסים.',
      importance: 'high',
      icon: Award
    },
    {
      type: 'strength',
      title: 'יעדי חיים משותפים',
      description: 'שני הצדדים מחפשים אותו סוג של חיי משפחה ויש להם חזון דומה לעתיד.',
      importance: 'high',
      icon: Target
    },
    {
      type: 'challenge',
      title: 'הבדל גיאוגרפי',
      description: 'המרחק הפיזי עלול ליצור אתגר בתחילת ההכרות. מומלץ לתכנן פגישות באזור נוח לשני הצדדים.',
      importance: 'medium',
      icon: AlertCircle
    },
    {
      type: 'recommendation',
      title: 'נושאי שיחה מומלצים',
      description: 'התחילו עם שיחה על תחביבים משותפים כמו קריאה וטיולים, זה יכול ליצור קשר מהיר.',
      importance: 'medium',
      icon: MessageSquare
    }
  ];

  // הרצת אנימציית הטעינה
  useEffect(() => {
    if (isLoading && isDemo) {
      const timer = setInterval(() => {
        setLoadingProgress(prev => {
          const newProgress = prev + 2;
          const newStep = Math.floor(newProgress / 20);
          if (newStep !== currentStep && newStep < loadingSteps.length) {
            setCurrentStep(newStep);
          }
          return Math.min(newProgress, 100);
        });
      }, 100);

      return () => clearInterval(timer);
    }
  }, [isLoading, isDemo, currentStep]);

  const handleGetAnalysis = async () => {
    if (analysis && !isDemo) {
      setIsOpen(true);
      return;
    }

    setIsOpen(true);
    setIsLoading(true);
    setError(null);
    setLoadingProgress(0);
    setCurrentStep(0);

    if (isDemo) {
      // אנימציית טעינה של 5 שניות
      setTimeout(() => {
        if (demoAnalysisData) {
          setAnalysis(demoAnalysisData);
        } else {
          // נתוני דמו אם לא סופקו
          setAnalysis({
            compatibilityScore: mockCompatibilityScore,
            insights: mockInsights,
            summary: 'זהו ניתוח דמו המציג את היכולות של המערכת'
          } as any);
        }
        setIsLoading(false);
        setActiveTab("overview");
      }, 5000);
      return;
    }

    // לוגיקה קיימת עבור המערכת החיה
    try {
      const response = await fetch('/api/ai/analyze-suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ suggestedUserId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'שגיאה בקבלת ניתוח ההצעה.');
      }

      setAnalysis(result.data);
      setActiveTab("overview");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'אירעה שגיאה לא צפויה.';
      setError(errorMessage);
      toast.error('שגיאה בתהליך הניתוח', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setError(null);
      setLoadingProgress(0);
      setCurrentStep(0);
      if (isDemo) {
        setAnalysis(null);
      }
    }
  };

  const toggleInsightExpansion = (insightId: string) => {
    setExpandedInsights(prev => 
      prev.includes(insightId) 
        ? prev.filter(id => id !== insightId)
        : [...prev, insightId]
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'מעולה';
    if (score >= 80) return 'טוב מאוד';
    if (score >= 70) return 'טוב';
    return 'מאתגר';
  };

  const renderLoadingScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-8 p-8">
      {/* כותרת ואנימציה מרכזית */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 animate-pulse border-4 border-white shadow-xl"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
        {/* אפקט זוהר */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-20 animate-ping"></div>
      </div>

      {/* טקסט מרכזי */}
      <div className="space-y-3">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          מנתח התאמה עמוקה...
        </h3>
        <p className="text-gray-600 max-w-md text-lg">
          אנו בוחנים עשרות פרמטרים כדי לספק לך תמונה מקיפה ומדויקת של ההתאמה
        </p>
      </div>

      {/* בר התקדמות */}
      <div className="w-full max-w-md space-y-4">
        <Progress 
          value={loadingProgress} 
          className="h-3 bg-gray-200 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:via-purple-500 [&>div]:to-pink-500 [&>div]:transition-all [&>div]:duration-500"
        />
        <p className="text-sm text-gray-500 font-medium">
          {loadingProgress}% הושלם
        </p>
      </div>

      {/* שלב נוכחי */}
      {currentStep < loadingSteps.length && (
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-lg border border-gray-100"
        >
          <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg">
            {React.createElement(loadingSteps[currentStep].icon, { size: 20 })}
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-800">
              {loadingSteps[currentStep].label}
            </p>
            <p className="text-sm text-gray-600">
              {loadingSteps[currentStep].description}
            </p>
          </div>
        </motion.div>
      )}

      {/* אינדיקטורי שלבים */}
      <div className="flex gap-2 mt-8">
        {loadingSteps.map((step, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index <= currentStep
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 scale-110'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );

  const renderErrorScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
      <div className="p-6 rounded-full bg-gradient-to-br from-red-50 to-pink-50 border-4 border-white shadow-xl">
        <AlertTriangle className="h-16 w-16 text-red-500" />
      </div>
      
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-gray-800">
          משהו השתבש בדרך...
        </h3>
        <Alert variant="destructive" className="max-w-md border-red-200 bg-red-50/50 backdrop-blur-sm">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-red-800 font-semibold">
            לא הצלחנו להשלים את הניתוח
          </AlertTitle>
          <AlertDescription className="text-red-700 mt-2">
            <p>אנו מתנצלים על התקלה. אנא נסו שוב או פנו לתמיכה.</p>
            {error && <p className="text-xs mt-2 opacity-80 font-mono bg-red-100 p-2 rounded">{error}</p>}
          </AlertDescription>
        </Alert>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleGetAnalysis}
          variant="default"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Brain className="w-4 h-4 ml-2" />
          נסה שוב
        </Button>
        <Button
          onClick={() => setIsOpen(false)}
          variant="outline"
          className="border-gray-300 hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4 ml-2" />
          חזור
        </Button>
      </div>
    </div>
  );

  const renderAnalysisContent = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col" dir="rtl">
      <TabsList className="grid w-full grid-cols-4 bg-gray-50/80 backdrop-blur-sm rounded-xl p-1 border border-gray-200">
        <TabsTrigger 
          value="overview" 
          className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-gray-200 transition-all duration-200"
        >
          <Eye className="w-4 h-4 ml-2" />
          סקירה כללית
        </TabsTrigger>
        <TabsTrigger 
          value="compatibility"
          className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-gray-200 transition-all duration-200"
        >
          <Heart className="w-4 h-4 ml-2" />
          תאימות
        </TabsTrigger>
        <TabsTrigger 
          value="insights"
          className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-gray-200 transition-all duration-200"
        >
          <Lightbulb className="w-4 h-4 ml-2" />
          תובנות
        </TabsTrigger>
        <TabsTrigger 
          value="recommendations"
          className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-gray-200 transition-all duration-200"
        >
          <Target className="w-4 h-4 ml-2" />
          המלצות
        </TabsTrigger>
      </TabsList>

      <div className="flex-1 overflow-y-auto">
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* ציון כללי */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-8 border border-gray-200"
          >
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">ציון התאימות הכללי</h3>
            </div>
            
            <div className="space-y-4">
              <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {mockCompatibilityScore.overall}%
              </div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 font-semibold ${getScoreColor(mockCompatibilityScore.overall)}`}>
                <Star className="w-4 h-4" />
                {getScoreLabel(mockCompatibilityScore.overall)}
              </div>
              <p className="text-gray-600 max-w-md mx-auto text-lg">
                בהתבסס על ניתוח מקיף של הפרופילים, ההתאמה מציגה פוטנציאל גבוה להצלחה
              </p>
            </div>
          </motion.div>

          {/* סיכום מהיר */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <h4 className="font-semibold text-gray-800">נקודות חיבור חזקות</h4>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  רקע רוחני דומה
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  יעדי חיים משותפים
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  תחביבים משותפים
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <Info className="w-5 h-5 text-blue-500" />
                <h4 className="font-semibold text-gray-800">נקודות לתשומת לב</h4>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  הבדל גיאוגרפי
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  סגנונות תקשורת שונים
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  קצב חיים שונה
                </li>
              </ul>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="compatibility" className="mt-6 space-y-6">
          <div className="grid gap-6">
            {[
              { key: 'values', label: 'ערכים ואמונות', icon: Heart, score: mockCompatibilityScore.values },
              { key: 'lifestyle', label: 'אורח חיים', icon: Users, score: mockCompatibilityScore.lifestyle },
              { key: 'personality', label: 'אישיות', icon: Brain, score: mockCompatibilityScore.personality },
              { key: 'spiritual', label: 'רוחניות', icon: Sparkles, score: mockCompatibilityScore.spiritual }
            ].map((item, index) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100">
                      <item.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-800">{item.label}</h4>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(item.score)}`}>
                    {item.score}%
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Progress 
                    value={item.score} 
                    className="h-2 bg-gray-100 [&>div]:transition-all [&>div]:duration-1000"
                    style={{
                      '--progress-color': item.score >= 80 ? '#10b981' : item.score >= 70 ? '#3b82f6' : '#f59e0b'
                    } as any}
                  />
                  <p className="text-sm text-gray-600">
                    {item.score >= 90 && "התאמה יוצאת דופן - בסיס חזק ביותר למערכת יחסים"}
                    {item.score >= 80 && item.score < 90 && "התאמה טובה מאוד - פוטנציאל גבוה להצלחה"}
                    {item.score >= 70 && item.score < 80 && "התאמה סבירה - דורש תשומת לב והבנה הדדית"}
                    {item.score < 70 && "אתגר משמעותי - נדרש דיון מעמיק והתמודדות מודעת"}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="mt-6 space-y-4">
          {mockInsights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-xl border-r-4 shadow-sm hover:shadow-md transition-all duration-200 ${
                insight.type === 'strength' ? 'border-r-emerald-500' :
                insight.type === 'challenge' ? 'border-r-yellow-500' : 'border-r-blue-500'
              }`}
            >
              <div 
                className="p-6 cursor-pointer"
                onClick={() => toggleInsightExpansion(`insight-${index}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${
                      insight.type === 'strength' ? 'bg-emerald-50 text-emerald-600' :
                      insight.type === 'challenge' ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      <insight.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">{insight.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            insight.type === 'strength' ? 'bg-emerald-100 text-emerald-700' :
                            insight.type === 'challenge' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {insight.type === 'strength' ? 'נקודת חוזק' :
                           insight.type === 'challenge' ? 'אתגר' : 'המלצה'}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs border ${
                            insight.importance === 'high' ? 'border-red-200 text-red-600' :
                            insight.importance === 'medium' ? 'border-yellow-200 text-yellow-600' : 'border-gray-200 text-gray-600'
                          }`}
                        >
                          {insight.importance === 'high' ? 'חשיבות גבוהה' :
                           insight.importance === 'medium' ? 'חשיבות בינונית' : 'חשיבות נמוכה'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {expandedInsights.includes(`insight-${index}`) ? 
                    <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  }
                </div>
                
                <AnimatePresence>
                  {expandedInsights.includes(`insight-${index}`) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 pt-4 border-t border-gray-100"
                    >
                      <p className="text-gray-700 leading-relaxed">{insight.description}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="recommendations" className="mt-6 space-y-6">
          <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg">
                <Lightbulb className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">המלצות מקצועיות</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  נושאי שיחה מומלצים לפגישה הראשונה
                </h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• תחביבים משותפים - קריאה וטיולים</li>
                  <li>• חזון משפחתי ויעדי חיים</li>
                  <li>• תכניות לעתיד הקרוב</li>
                </ul>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  תזמון והכנה
                </h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• תכננו פגישה באזור נוח לשני הצדדים</li>
                  <li>• הקדישו זמן מספיק - לפחות שעתיים</li>
                  <li>• בחרו מקום שקט ונעים לשיחה</li>
                </ul>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  נקודות להתמקדות
                </h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• הדגישו את הערכים המשותפים</li>
                  <li>• היו פתוחים לגבי הציפיות</li>
                  <li>• תנו מקום לשאלות הדדיות</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                סיכויי הצלחה
              </h4>
              <div className="text-3xl font-bold text-green-600 mb-2">גבוהים</div>
              <p className="text-sm text-gray-600">
                ההתאמה מציגה בסיס חזק עם פוטנציאל טוב להתפתחות יחסים משמעותיים
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                זמן מומלץ להחלטה
              </h4>
              <div className="text-3xl font-bold text-blue-600 mb-2">3-5</div>
              <p className="text-sm text-gray-600">
                מספר פגישות מומלץ לפני קבלת החלטה סופית על המשך
              </p>
            </div>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );

  const renderActionButtons = () => (
    <div className="flex flex-wrap gap-3 p-6 bg-gray-50/80 backdrop-blur-sm border-t border-gray-200 rounded-b-3xl">
      <Button
        variant="default"
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <Download className="w-4 h-4 ml-2" />
        ייצא לPDF
      </Button>
      
      <Button
        variant="outline"
        className="border-gray-300 hover:bg-white hover:shadow-md transition-all duration-200"
      >
        <Share2 className="w-4 h-4 ml-2" />
        שתף עם שדכן
      </Button>
      
      <Button
        variant="outline"
        className="border-gray-300 hover:bg-white hover:shadow-md transition-all duration-200"
      >
        <Bookmark className="w-4 h-4 ml-2" />
        שמור בפרופיל
      </Button>

      <div className="mr-auto">
        <Button
          onClick={() => setIsOpen(false)}
          variant="ghost"
          className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 ml-2" />
          סגור
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          onClick={handleGetAnalysis}
          variant="outline"
          size="lg"
          className="relative overflow-hidden group bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200 text-blue-700 hover:from-blue-100 hover:via-purple-100 hover:to-pink-100 hover:border-blue-300 transition-all duration-300 shadow-lg hover:shadow-xl rounded-2xl px-8 py-4 font-semibold text-lg"
          disabled={isLoading}
        >
          {/* אפקט זוהר */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -translate-x-full group-hover:animate-shimmer"></div>

          <div className="relative z-10 flex items-center gap-3">
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            ) : (
              <div className="relative">
                <Brain className="w-6 h-6 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 text-blue-600" />
                <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            )}
            <span className="text-lg font-bold">
              {isLoading ? 'מכין ניתוח חכם...' : 'ניתוח התאמה מבוסס AI'}
            </span>
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent
        className="max-w-6xl w-[95vw] h-[90vh] flex flex-col p-0 border-0 shadow-2xl rounded-3xl bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-lg"
        dir="rtl"
      >
        <DialogHeader className="p-8 border-b border-blue-100 bg-white/90 backdrop-blur-sm rounded-t-3xl">
          <DialogTitle className="flex items-center gap-4 text-3xl font-bold text-gray-800">
            <div className="p-4 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white shadow-xl">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                ניתוח התאמה חכם
              </span>
              <div className="text-sm font-normal text-gray-600 mt-1">
                {currentUserName} ⟵ {suggestedUserName}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="text-lg text-gray-600 mt-3">
            ניתוח מקיף ומקצועי של רמת ההתאמה, נקודות החוזק והאתגרים הפוטנציאליים
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-hidden">
          {isLoading ? renderLoadingScreen() : 
           error ? renderErrorScreen() : 
           analysis ? renderAnalysisContent() : 
           <div className="flex items-center justify-center h-full">
             <div className="text-center space-y-4">
               <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto">
                 <Brain className="w-10 h-10 text-blue-600" />
               </div>
               <p className="text-gray-600 font-medium text-lg">מכין את הניתוח החכם...</p>
             </div>
           </div>
          }
        </div>

        {/* כפתורי פעולה - מוצגים רק כשיש ניתוח */}
        {analysis && !isLoading && !error && renderActionButtons()}
      </DialogContent>
      
      {/* הוספת סטיילים מותאמים אישית */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .group:hover .animate-shimmer {
          animation-duration: 1.5s;
        }
      `}</style>
    </Dialog>
  );
};