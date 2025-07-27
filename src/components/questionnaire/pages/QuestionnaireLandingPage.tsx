// src/components/questionnaire/pages/QuestionnaireLandingPage.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Heart,
  User,
  Users,
  Scroll,
  Clock,
  Star,
  Shield,
  CheckCircle,
  Lock,
  ArrowLeft, // Changed from ArrowRight for RTL context
  Loader2,
  Sparkles,
  UserCheck, // More specific icon for Partner world
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

// --- Props Interface ---
interface QuestionnaireLandingPageProps {
  onStartQuestionnaire: () => void;
  hasSavedProgress: boolean;
  isLoading?: boolean;
}

// --- Data Configuration (Easy to update content) ---
interface WorldInfo {
  id: string;
  title: string;
  icon: React.ReactElement;
  colorGradient: string;
  questions: number;
  description: string;
}

const worlds: WorldInfo[] = [
  {
    id: 'PERSONALITY',
    title: 'עולם האישיות',
    icon: <User className="h-7 w-7" />,
    colorGradient: 'from-sky-400 to-blue-500',
    questions: 20,
    description:
      'מי אני באמת? גלה את הכוחות הייחודיים שלך, את סגנון התקשורת ומה מניע אותך.',
  },
  {
    id: 'VALUES',
    title: 'עולם הערכים',
    icon: <Heart className="h-7 w-7" />,
    colorGradient: 'from-rose-400 to-red-500',
    questions: 25,
    description:
      'מה באמת מניע אותך? זקק את עקרונות הליבה שלך ובנה יסודות איתנים לבית המשותף.',
  },
  {
    id: 'RELATIONSHIP',
    title: 'עולם הזוגיות',
    icon: <Users className="h-7 w-7" />,
    colorGradient: 'from-purple-400 to-indigo-500',
    questions: 18,
    description:
      'איך נראית השותפות האידיאלית שלך? עצב את החזון שלך לקשר המבוסס על הבנה וכבוד.',
  },
  {
    id: 'PARTNER',
    title: 'עולם הפרטנר',
    icon: <UserCheck className="h-7 w-7" />,
    colorGradient: 'from-teal-400 to-emerald-500',
    questions: 22,
    description:
      'במי תרצה/י לבחור? הגדר את התכונות והערכים החשובים לך ביותר בבן/בת הזוג.',
  },
  {
    id: 'RELIGION',
    title: 'דת ומסורת',
    icon: <Scroll className="h-7 w-7" />,
    colorGradient: 'from-amber-400 to-orange-500',
    questions: 15,
    description:
      'מה מקום האמונה וההלכה בחייך? נבין את החיבור האישי שלך ואת החזון לבית יהודי.',
  },
];

const features = [
  {
    icon: <Clock className="h-8 w-8 text-sky-600" />,
    title: 'תהליך מותאם אישית',
    description:
      'השאלון מחולק לעולמות נפרדים, כך שניתן למלא אותו בקצב שלך, לעצור ולחזור בכל שלב.',
    bgColor: 'bg-sky-100/60',
  },
  {
    icon: <Shield className="h-8 w-8 text-rose-600" />,
    title: 'פרטיות מוחלטת',
    description:
      'התשובות שלך דיסקרטיות לחלוטין ומשמשות את צוות השדכנים המקצועי שלנו בלבד.',
    bgColor: 'bg-rose-100/60',
  },
  {
    icon: <Star className="h-8 w-8 text-amber-600" />,
    title: 'התאמה מדעית',
    description:
      'מבוסס על מחקרים פסיכולוגיים וניסיון של שדכנים ותיקים ליצירת התאמות עומק.',
    bgColor: 'bg-amber-100/60',
  },
];

export default function QuestionnaireLandingPage({
  onStartQuestionnaire,
  hasSavedProgress,
  isLoading = false,
}: QuestionnaireLandingPageProps) {
  const { status, data: session } = useSession();

  // --- Main Render ---
  return (
    <div className="relative min-h-screen overflow-hidden text-right dir-rtl bg-slate-50">
      {/* --- Section 1: Hero - The Invitation to the Journey --- */}
      <section className="relative py-20 px-4 sm:py-24 text-center overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-50 via-white to-rose-50 -z-10" />
        <div className="absolute top-0 -left-20 w-60 h-60 bg-sky-200/20 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 -right-20 w-72 h-72 bg-rose-200/20 rounded-full filter blur-3xl animate-pulse-slow animation-delay-2000"></div>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 tracking-tight bg-gradient-to-r from-sky-600 to-rose-600 text-transparent bg-clip-text">
            הנתיב שלך לזוגיות משמעותית
          </h1>
          <p className="text-lg md:text-xl text-slate-700 max-w-3xl mx-auto mt-4 leading-relaxed">
            השקעה של כמה דקות בשאלון ההיכרות שלנו היא הצעד הראשון והחשוב ביותר
            שלך בדרך למציאת קשר אמיתי, עמוק ומדויק. בוא/י נצא למסע גילוי משותף.
          </p>

          <div className="mt-12 space-y-4 flex flex-col items-center">
            {/* CTA Button: Adapts to user status */}
            <Button
              size="lg"
              className="w-full max-w-sm text-lg font-semibold px-8 py-7 bg-gradient-to-r from-sky-500 to-rose-500 hover:from-sky-600 hover:to-rose-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden transform hover:-translate-y-1"
              onClick={onStartQuestionnaire}
              disabled={isLoading}
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
              <div className="relative z-10 flex items-center justify-center">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : hasSavedProgress ? (
                  <>
                    <CheckCircle className="h-6 w-6 ms-2" />
                    <span>המשך/י מהנקודה האחרונה</span>
                  </>
                ) : (
                  <>
                    <Heart className="h-6 w-6 ms-2 fill-white" />
                    <span>
                      {session
                        ? `התחל/י את המסע, ${session.user.firstName}`
                        : 'בוא/י נתחיל'}
                    </span>
                  </>
                )}
              </div>
            </Button>

            {status !== 'authenticated' && (
              <Link href="/auth/signin" className="w-full max-w-sm">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full text-md font-medium px-8 py-6 border-2 border-slate-300 text-slate-700 hover:bg-slate-100/50 hover:border-slate-400 rounded-full transition-all duration-300 bg-white/70 backdrop-blur-sm"
                >
                  <Lock className="h-5 w-5 ms-2" />
                  כניסה למשתמשים רשומים
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* --- Section 2: Worlds - The "What to Expect" --- */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3 text-slate-800">
              חמישה עולמות, התאמה אחת מושלמת
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              השאלון מחולק לחמישה עולמות תוכן. כל עולם מתמקד בהיבט אחר של
              אישיותך וציפיותיך, ויחד הם יוצרים תמונה מלאה ועשירה.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {worlds.map((world, index) => (
              <Card
                key={world.id}
                className="overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 bg-white/80 backdrop-blur-sm border border-slate-100 flex flex-col"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6 text-center flex flex-col items-center flex-grow">
                  <div
                    className={cn(
                      'p-4 rounded-full bg-gradient-to-br text-white shadow-lg mb-4',
                      world.colorGradient
                    )}
                  >
                    {world.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">
                    {world.title}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 mb-3">
                    {world.questions} שאלות
                  </p>
                  <p className="text-base text-slate-600 leading-relaxed flex-grow">
                    {world.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* --- Section 3: Features - The "Why Trust Us" --- */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3 text-slate-800">
              הבסיס להצלחה שלך
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              השקענו מחשבה וניסיון רב כדי להפוך את התהליך ליעיל, מכבד ומדויק ככל
              האפשר.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {features.map((feature, index) => (
              <div key={index} className="flex flex-col items-center p-6">
                <div className={cn('p-4 rounded-full mb-5', feature.bgColor)}>
                  {feature.icon}
                </div>
                <h3 className="font-bold text-xl mb-2 text-slate-800">
                  {feature.title}
                </h3>
                <p className="text-base text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Section 4: Final CTA --- */}
      <section className="py-20 px-4 text-center bg-white">
        <div className="max-w-3xl mx-auto">
          <Sparkles className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4 text-slate-800">
            מוכנ/ה להתחיל את המסע?
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto leading-relaxed">
            הזיווג שלך מחכה. הצעד הראשון בדרך אליו הוא להכיר את עצמך לעומק.
            אנחנו כאן כדי ללוות אותך.
          </p>

          <Button
            size="lg"
            onClick={onStartQuestionnaire}
            disabled={isLoading}
            className="w-full max-w-xs text-lg font-semibold px-8 py-7 bg-gradient-to-r from-sky-500 to-rose-500 hover:from-sky-600 hover:to-rose-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden transform hover:-translate-y-1"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
            <div className="relative z-10 flex items-center justify-center">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <ArrowLeft className="h-6 w-6 ms-2" />
                  <span>התחל/י עכשיו</span>
                </>
              )}
            </div>
          </Button>
        </div>
      </section>

      <footer className="text-center py-6 text-slate-500 text-sm bg-slate-50">
        © {new Date().getFullYear()} MatchPoint. כל הזכויות שמורות.
      </footer>

      {/* Add animations to your global CSS (e.g., globals.css) */}
      <style jsx global>{`
        @keyframes pulse-slow {
          50% {
            opacity: 0.7;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
