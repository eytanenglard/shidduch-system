import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  UserCheck,
  Users,
  Calendar,
  Sparkles,
  Heart,
  CheckCheck,
  BarChart4,
  Zap,
  Award,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UserStatsProps {
  totalQuestionsAnswered: number;
  totalQuestionsCount: number;
  activeMatches?: number; // מספר התאמות פעילות
  pendingMatches?: number; // מספר התאמות ממתינות
  matchScore?: number; // ציון התאמה כללי (0-100)
  profileCompletion?: number; // אחוז השלמת הפרופיל
  activeWorldsCompleted?: string[]; // עולמות שהושלמו
  personalityTraits?: Array<{
    trait: string;
    score: number;
  }>;
  activityLevel?: "low" | "medium" | "high"; // רמת פעילות המשתמש
  registrationDate?: Date; // תאריך הרשמה
  lastActive?: Date; // פעילות אחרונה
  className?: string;
}

export default function UserStats({
  totalQuestionsAnswered,
  totalQuestionsCount,
  activeMatches = 0,
  pendingMatches = 0,
  matchScore = 0,
  profileCompletion = 0,
  activeWorldsCompleted = [],
  personalityTraits = [],
  activityLevel = "medium",
  registrationDate,
  className,
}: UserStatsProps) {
  // חישוב תאריכים יפים להצגה
  const formatDate = (date?: Date) => {
    if (!date) return "לא זמין";
    return date.toLocaleDateString("he-IL");
  };

  // זמן בשירות
  const getDaysActive = () => {
    if (!registrationDate) return 0;
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - registrationDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // רמת פעילות בצבע מתאים
  const getActivityLevelColor = () => {
    switch (activityLevel) {
      case "high":
        return "text-green-600 bg-green-100";
      case "medium":
        return "text-blue-600 bg-blue-100";
      case "low":
        return "text-amber-600 bg-amber-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* כרטיס התאמות */}
      <Card className="shadow-sm hover:shadow-md transition-shadow border-blue-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <UserCheck className="h-5 w-5 mr-2 text-blue-500" />
            סטטיסטיקת התאמות
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* התאמות פעילות */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <div className="text-xs text-gray-600 mb-1">התאמות פעילות</div>
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-2xl font-semibold">{activeMatches}</span>
              </div>
            </div>

            {/* ממתינות לאישור */}
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
              <div className="text-xs text-gray-600 mb-1">ממתינות לבדיקה</div>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-amber-600 mr-2" />
                <span className="text-2xl font-semibold">{pendingMatches}</span>
              </div>
            </div>

            {/* ציון התאמה */}
            <div className="col-span-2 bg-gray-50 p-3 rounded-lg border">
              <div className="flex justify-between mb-1">
                <div className="text-xs text-gray-600">ציון התאמה</div>
                <Badge variant="outline" className="text-xs">
                  {matchScore}%
                </Badge>
              </div>
              <Progress
                value={matchScore}
                className={cn(
                  "h-2",
                  matchScore > 70
                    ? "[--progress-foreground:theme(colors.green.500)]"
                    : "[--progress-foreground:theme(colors.blue.500)]"
                )}
              />
            </div>

            {/* פעיל מתאריך */}
            <div className="col-span-2 flex justify-between text-sm p-2">
              <div className="flex items-center text-gray-600">
                <Sparkles className="h-4 w-4 mr-1 text-blue-400" />
                פעיל {getDaysActive()} ימים
              </div>
              <div className="text-gray-600">
                הצטרפת בתאריך {formatDate(registrationDate)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* כרטיס פרופיל והתקדמות */}
      <Card className="shadow-sm hover:shadow-md transition-shadow border-blue-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <BarChart4 className="h-5 w-5 mr-2 text-blue-500" />
            התקדמות והשלמת פרופיל
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* אחוז השלמת פרופיל */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <div className="flex items-center">
                  <CheckCheck className="h-4 w-4 mr-1 text-blue-500" />
                  השלמת פרופיל
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    profileCompletion >= 80
                      ? "border-green-500 text-green-600"
                      : "border-amber-500 text-amber-600"
                  )}
                >
                  {profileCompletion}%
                </Badge>
              </div>
              <Progress
                value={profileCompletion}
                className={cn(
                  "h-2",
                  profileCompletion < 30
                    ? "[--progress-foreground:theme(colors.red.500)]"
                    : profileCompletion < 70
                    ? "[--progress-foreground:theme(colors.amber.500)]"
                    : "[--progress-foreground:theme(colors.green.500)]"
                )}
              />
            </div>

            {/* שאלות שנענו */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <div className="flex items-center">
                  <Zap className="h-4 w-4 mr-1 text-amber-500" />
                  שאלות שנענו
                </div>
                <span className="text-xs text-gray-600">
                  {totalQuestionsAnswered} מתוך {totalQuestionsCount}
                </span>
              </div>
              <Progress
                value={(totalQuestionsAnswered / totalQuestionsCount) * 100}
                className="h-2"
              />
            </div>

            {/* עולמות פעילים */}
            <div className="pt-2">
              <div className="text-sm mb-2 flex items-center">
                <Heart className="h-4 w-4 mr-1 text-pink-500" />
                <span>עולמות שהושלמו:</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { id: "PERSONALITY", name: "אישיות", color: "blue" },
                  { id: "VALUES", name: "ערכים", color: "emerald" },
                  { id: "RELATIONSHIP", name: "זוגיות", color: "purple" },
                  { id: "PARTNER", name: "פרטנר", color: "pink" },
                  { id: "RELIGION", name: "דת", color: "indigo" },
                ].map((world) => {
                  const isCompleted = activeWorldsCompleted.includes(world.id);
                  return (
                    <Badge
                      key={world.id}
                      variant={isCompleted ? "default" : "outline"}
                      className={
                        isCompleted
                          ? `bg-${world.color}-100 hover:bg-${world.color}-200 text-${world.color}-800 border-${world.color}-200`
                          : `text-gray-500 border-gray-200 bg-gray-50`
                      }
                    >
                      {isCompleted && <CheckCheck className="h-3 w-3 mr-1" />}
                      {world.name}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* רמת פעילות */}
            {activityLevel && (
              <div className="flex justify-between items-center pt-2 text-sm text-gray-600">
                <div>רמת פעילות:</div>
                <Badge
                  variant="outline"
                  className={cn(
                    "font-normal border-0",
                    getActivityLevelColor()
                  )}
                >
                  {activityLevel === "high" && "גבוהה"}
                  {activityLevel === "medium" && "בינונית"}
                  {activityLevel === "low" && "נמוכה"}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* מאפייני אישיות */}
      {personalityTraits && personalityTraits.length > 0 && (
        <Card className="shadow-sm hover:shadow-md transition-shadow border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Award className="h-5 w-5 mr-2 text-blue-500" />
              מאפייני אישיות בולטים
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {personalityTraits.map((trait, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <div className="flex items-center">
                            <Star className="h-3.5 w-3.5 mr-1 text-amber-500" />
                            {trait.trait}
                          </div>
                          <span className="text-xs">{trait.score}%</span>
                        </div>
                        <Progress
                          value={trait.score}
                          className={cn(
                            "h-1.5",
                            "relative overflow-hidden",
                            "before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-400",
                            trait.score < 40
                              ? "before:to-blue-500"
                              : trait.score < 70
                              ? "before:to-purple-500"
                              : "before:to-pink-500"
                          )}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>ציון: {trait.score}/100</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
