// src/components/questionnaire/QuestionnairePage.tsx
"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import MatchmakingQuestionnaire from "@/components/questionnaire/MatchmakingQuestionnaire";
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
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
// Enum to track questionnaire flow stages

export default function QuestionnairePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State for tracking current stage in the flow
  const [, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  // Check for existing progress when component mounts
  useEffect(() => {
    const checkExistingProgress = async () => {
      if (status === "loading") return;

      setIsLoading(true);

      try {
        // If user is logged in, check for saved progress
        if (session?.user?.id) {
          const response = await fetch("/api/questionnaire");
          const data = await response.json();

          if (data.success && data.data) {
            setHasSavedProgress(true);
          }
        }
      } catch (err) {
        console.error("Error checking questionnaire progress:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingProgress();
  }, [session, status]);

  // Handler when questionnaire is completed
  const handleQuestionnaireComplete = async () => {
    try {
      await router.push("/questionnaire/complete");
    } catch (err) {
      console.error("Error completing questionnaire:", err);
      setError("אירעה שגיאה בסיום השאלון. אנא נסה שוב.");
    }
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg font-medium">טוען...</p>
          <p className="text-sm text-gray-500 mt-2">מאחזר את נתוני השאלון</p>
        </Card>
      </div>
    );
  }

  if (showQuestionnaire) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-0">
            <MatchmakingQuestionnaire
              userId={session?.user?.id}
              onComplete={handleQuestionnaireComplete}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="relative py-12 px-4 sm:py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              ברוכים הבאים לשאלון ההיכרות
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-4">
              שאלון מקיף ומעמיק שיעזור לנו להכיר אותך ולמצוא את ההתאמה הטובה
              ביותר. מבוסס על מחקר מתקדם בתחום ההתאמה הזוגית.
            </p>
          </div>

          <div className="mt-8">
            {/* Show different button based on login and progress state */}
            {hasSavedProgress ? (
              <Button
                size="lg"
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md"
                onClick={() => setShowQuestionnaire(true)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-5 w-5 mr-2" />
                )}
                המשך מהנקודה האחרונה
              </Button>
            ) : (
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md"
                onClick={() => setShowQuestionnaire(true)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Heart className="h-5 w-5 mr-2" />
                )}
                {status === "authenticated"
                  ? "התחל/י בשאלון"
                  : "התחל/י כאורח/ת"}
              </Button>
            )}

            {/* Show login option if not authenticated */}
            {status !== "authenticated" && (
              <div className="mt-4">
                <Link href="/auth/signin">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto bg-white"
                  >
                    <Lock className="h-5 w-5 mr-2" />
                    התחברות למשתמשים רשומים
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-center">
            <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse bg-blue-50 rounded-full px-4 py-2 text-sm text-blue-700">
              <Clock className="h-5 w-5 text-blue-500" />
              <span>
                זמן מילוי משוער: 30-40 דקות • ניתן לשמור ולחזור בכל שלב
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Worlds Section */}
      <section className="py-8 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">
              חמישה עולמות, התאמה אחת מושלמת
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              השאלון מחולק לחמישה &quotעולמות&quot שונים, כל אחד מתמקד בהיבט אחר
              של האישיות והציפיות שלך.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                id: "PERSONALITY",
                title: "אישיות",
                icon: <User className="h-6 w-6" />,
                color: "from-blue-400 to-blue-600",
                questions: 20,
                description: "מי אתה באמת? הבנת האישיות, התכונות והשאיפות שלך",
              },
              {
                id: "VALUES",
                title: "ערכים ואמונות",
                icon: <Heart className="h-6 w-6" />,
                color: "from-pink-400 to-pink-600",
                questions: 25,
                description: "מה באמת חשוב לך? עקרונות, אמונות וערכי הליבה שלך",
              },
              {
                id: "RELATIONSHIP",
                title: "זוגיות",
                icon: <Users className="h-6 w-6" />,
                color: "from-purple-400 to-purple-600",
                questions: 18,
                description:
                  "מה אתה מחפש בזוגיות? ציפיות ורצונות במערכת היחסים",
              },
              {
                id: "PARTNER",
                title: "פרטנר",
                icon: <Heart className="h-6 w-6" />,
                color: "from-amber-400 to-amber-600",
                questions: 22,
                description:
                  "איזה בן/בת זוג אתה מחפש? תכונות וערכים בבן/בת הזוג",
              },
              {
                id: "RELIGION",
                title: "דת ומסורת",
                icon: <Scroll className="h-6 w-6" />,
                color: "from-emerald-400 to-emerald-600",
                questions: 15,
                description:
                  "מה היחס שלך לדת, מסורת ואמונה? רוחניות וערכי יהדות",
              },
            ].map((world) => (
              <Card
                key={world.id}
                className="overflow-hidden hover:shadow-md transition-shadow border-blue-100"
              >
                <div className={cn("h-2 bg-gradient-to-r", world.color)}></div>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse mb-2">
                    <div
                      className={cn(
                        "p-2 rounded-full bg-gradient-to-r",
                        world.color,
                        "text-white"
                      )}
                    >
                      {world.icon}
                    </div>
                    <div>
                      <h3 className="font-bold">{world.title}</h3>
                      <p className="text-xs text-gray-500">
                        {world.questions} שאלות
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{world.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 px-4 bg-blue-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">למה לבחור במערכת שלנו?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: <Clock className="h-6 w-6 text-blue-500" />,
                title: "מהיר ונוח",
                description:
                  "השאלון מתחלק לעולמות נפרדים, כך שאפשר למלא חלק בכל פעם",
              },
              {
                icon: <Shield className="h-6 w-6 text-blue-500" />,
                title: "פרטיות מוחלטת",
                description: "הנתונים שלך מאובטחים ונשמרים בסודיות מלאה",
              },
              {
                icon: <Star className="h-6 w-6 text-blue-500" />,
                title: "התאמה מדויקת",
                description:
                  "אלגוריתם חכם המזהה את המועמדים המתאימים ביותר עבורך",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center bg-white p-6 rounded-lg shadow-sm border border-blue-100"
              >
                <div className="p-3 bg-blue-50 rounded-full mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">
            מוכנים להתחיל במסע למציאת האהבה?
          </h2>
          <p className="text-gray-600 mb-6">
            מילוי השאלון הוא הצעד הראשון לקראת מציאת בן/בת זוג מתאימים.
          </p>

          <Button
            size="lg"
            onClick={() => setShowQuestionnaire(true)}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <ArrowRight className="h-5 w-5 mr-2" />
            )}
            התחל/י עכשיו
          </Button>
        </div>
      </section>
    </div>
  );
}
