// src/components/questionnaire/pages/QuestionnaireLandingPage.tsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
  Sparkles, // Added for visual flair potentially
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

// Define the props interface
interface QuestionnaireLandingPageProps {
  onStartQuestionnaire: () => void;
  hasSavedProgress: boolean;
  isLoading?: boolean; // Optional loading state from parent
}

// Define the world structure for clarity
interface WorldInfo {
  id: string;
  title: string;
  icon: React.ReactElement;
  colorGradient: string; // Use gradient for icon background
  questions: number;
  description: string;
}

export default function QuestionnaireLandingPage({
  onStartQuestionnaire,
  hasSavedProgress,
  isLoading = false, // Default to false if not provided
}: QuestionnaireLandingPageProps) {
  const { status } = useSession();

  const worlds: WorldInfo[] = [
    {
      id: "PERSONALITY",
      title: "אישיות",
      icon: <User className="h-6 w-6" />,
      colorGradient: "from-cyan-400 to-cyan-600",
      questions: 20,
      description: "מי אתה באמת? הבנת האישיות, התכונות והשאיפות שלך",
    },
    {
      id: "VALUES",
      title: "ערכים ואמונות",
      icon: <Heart className="h-6 w-6" />,
      colorGradient: "from-pink-400 to-pink-600",
      questions: 25,
      description: "מה באמת חשוב לך? עקרונות, אמונות וערכי הליבה שלך",
    },
    {
      id: "RELATIONSHIP",
      title: "זוגיות",
      icon: <Users className="h-6 w-6" />,
      colorGradient: "from-purple-400 to-purple-600",
      questions: 18,
      description: "מה אתה מחפש בזוגיות? ציפיות ורצונות במערכת היחסים",
    },
    {
      id: "PARTNER",
      title: "פרטנר",
      icon: <Heart className="h-6 w-6" />, // Can use a different icon if desired
      colorGradient: "from-amber-400 to-amber-600",
      questions: 22,
      description: "איזה בן/בת זוג אתה מחפש? תכונות וערכים בבן/בת הזוג",
    },
    {
      id: "RELIGION",
      title: "דת ומסורת",
      icon: <Scroll className="h-6 w-6" />,
      colorGradient: "from-emerald-400 to-emerald-600",
      questions: 15,
      description: "מה היחס שלך לדת, מסורת ואמונה? רוחניות וערכי יהדות",
    },
  ];

  const features = [
    {
      icon: <Clock className="h-6 w-6 text-cyan-600" />,
      title: "מהיר ונוח",
      description: "השאלון מתחלק לעולמות נפרדים, כך שאפשר למלא חלק בכל פעם",
      bgColor: "bg-cyan-100/70",
    },
    {
      icon: <Shield className="h-6 w-6 text-pink-600" />,
      title: "פרטיות מוחלטת",
      description: "הנתונים שלך מאובטחים ונשמרים בסודיות מלאה",
      bgColor: "bg-pink-100/70",
    },
    {
      icon: <Star className="h-6 w-6 text-cyan-600" />,
      title: "התאמה מדויקת",
      description: "אלגוריתם חכם המזהה את המועמדים המתאימים ביותר עבורך",
      bgColor: "bg-cyan-100/70",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden text-right dir-rtl">
      {/* Enhanced Background */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-pink-50 animate-gradient-slow -z-20"
        style={{ backgroundSize: "400% 400%" }}
      />
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:20px_20px] -z-10"></div>

      {/* Floating Orbs (Adjust positions and sizes as needed) */}
      <div className="absolute top-10 -left-10 w-40 h-40 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-cyan-200/20 to-cyan-300/10 animate-float-slow backdrop-blur-sm -z-10" style={{ animationDuration: '15s' }}></div>
      <div className="absolute bottom-5 -right-16 w-48 h-48 md:w-72 md:h-72 rounded-full bg-gradient-to-br from-pink-200/20 to-pink-300/10 animate-float-slow backdrop-blur-sm -z-10" style={{ animationDuration: '18s', animationDelay: '1s' }}></div>

      {/* Hero Section */}
      <section className="relative py-16 px-4 sm:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight bg-gradient-to-r from-cyan-600 to-pink-600 text-transparent bg-clip-text">
              ברוכים הבאים לשאלון ההיכרות
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto mt-4 leading-relaxed">
              שאלון מקיף ומעמיק שיעזור לנו להכיר אותך ולמצוא את ההתאמה הטובה
              ביותר. מבוסס על מחקר מתקדם בתחום ההתאמה הזוגית ומותאם לציבור הדתי.
            </p>
          </div>

          <div className="mt-10 space-y-5 flex flex-col items-center">
            {/* Main Action Button */}
            {hasSavedProgress ? (
              <Button
                size="lg"
                className="w-full max-w-xs text-lg px-8 py-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                onClick={onStartQuestionnaire}
                disabled={isLoading}
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin ms-2" />
                ) : (
                  <CheckCircle className="h-5 w-5 ms-2 group-hover:scale-110 transition-transform" />
                )}
                <span className="relative z-10">המשך מהנקודה האחרונה</span>
              </Button>
            ) : (
              <Button
                size="lg"
                className="w-full max-w-xs text-lg px-8 py-6 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                onClick={onStartQuestionnaire}
                disabled={isLoading}
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin ms-2" />
                ) : (
                  <Heart className="h-5 w-5 ms-2 group-hover:scale-110 transition-transform fill-white" />
                )}
                <span className="relative z-10">
                  {status === "authenticated"
                    ? "התחל/י בשאלון"
                    : "התחל/י כאורח/ת"}
                </span>
              </Button>
            )}

            {/* Login Option */}
            {status !== "authenticated" && (
              <Link href="/auth/signin" className="w-full max-w-xs">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full text-lg px-8 py-6 border-2 border-cyan-300 text-cyan-700 hover:bg-cyan-50/50 hover:border-cyan-400 rounded-full transition-all duration-300 bg-white/70 backdrop-blur-sm"
                >
                  <Lock className="h-5 w-5 ms-2" />
                  התחברות למשתמשים רשומים
                </Button>
              </Link>
            )}
          </div>

          {/* Time Estimation Badge */}
          <div className="mt-12 flex justify-center">
            <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse bg-gradient-to-r from-cyan-100/50 to-pink-100/50 backdrop-blur-sm rounded-full px-5 py-3 text-sm text-gray-700 shadow-md border border-white/50">
              <Clock className="h-5 w-5 text-cyan-600" />
              <span>
                זמן מילוי משוער: 30-40 דקות • ניתן לשמור ולחזור בכל שלב
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Worlds Section */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3 text-gray-800">
              חמישה עולמות, התאמה אחת מושלמת
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              השאלון מחולק לחמישה עולמות שונים, כל אחד מתמקד בהיבט אחר של
              האישיות והציפיות שלך לקראת בניית בית נאמן בישראל.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {worlds.map((world) => (
              <Card
                key={world.id}
                className="overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 bg-white/80 backdrop-blur-sm border border-gray-100"
              >
                <CardContent className="p-6 text-right">
                  <div className="flex items-center space-x-4 rtl:space-x-reverse mb-4">
                    <div
                      className={cn(
                        "p-3 rounded-full bg-gradient-to-br text-white shadow-lg",
                        world.colorGradient
                      )}
                    >
                      {React.cloneElement(world.icon, { className: "h-7 w-7" })}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{world.title}</h3>
                      <p className="text-sm text-gray-500">
                        {world.questions} שאלות
                      </p>
                    </div>
                  </div>
                  <p className="text-base text-gray-600 leading-relaxed">{world.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 px-4 bg-gradient-to-r from-cyan-50/30 to-pink-50/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3 text-gray-800">מדוע לבחור בנו?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
               היתרונות שלנו בשילוב טכנולוגיה מתקדמת וליווי אישי.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex flex-col items-center p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm border border-gray-100"
              >
                <div className={cn("p-3 rounded-full mb-4", feature.bgColor)}>
                  {feature.icon}
                </div>
                <h3 className="font-bold text-xl mb-2 text-gray-800">{feature.title}</h3>
                <p className="text-base text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <Sparkles className="h-12 w-12 text-pink-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4 text-gray-800">
            מוכנים להתחיל במסע למציאת האהבה?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto leading-relaxed">
            מילוי השאלון הוא הצעד הראשון והמשמעותי לקראת מציאת השידוך המדויק עבורך בעזרת ה.
          </p>

          <Button
            size="lg"
            onClick={onStartQuestionnaire}
            disabled={isLoading}
            className="w-full max-w-xs text-lg px-8 py-6 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
          >
             <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
             {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin ms-2" />
                ) : (
                 <ArrowLeft className="h-5 w-5 ms-2 group-hover:scale-110 transition-transform" /> // ArrowLeft for RTL 'start now' -> 'go left'
             )}
            <span className="relative z-10">התחל/י עכשיו</span>
          </Button>
        </div>
      </section>

      {/* Footer placeholder - Add your actual footer here */}
      <footer className="text-center py-6 text-gray-500 text-sm">
         © {new Date().getFullYear()} כל הזכויות שמורות. פותח באהבה ❤️.
      </footer>

    </div>
  );
}

// Add these animations to your global CSS (e.g., globals.css) or Tailwind config:
/*
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply dir-rtl; // Ensure RTL direction globally if needed
  }
}

@layer utilities {
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }
  .animate-float-slow {
    animation: float 10s ease-in-out infinite; // Slower duration
  }

  @keyframes gradient-anim {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .animate-gradient-slow {
    animation: gradient-anim 15s ease infinite;
  }

  @keyframes shimmer {
    100% { transform: translateX(100%); }
  }
  .animate-shimmer {
    animation: shimmer 2.5s infinite linear; // Added linear timing
  }
}
*/