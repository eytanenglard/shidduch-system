import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  X,
  MessageCircle,
  User,
  MapPin,
  Calendar,
  GraduationCap,
  Briefcase,
  Sparkles,
  Star,
  BookOpen,
  ChevronsDown,
  ChevronsUp,
  Music,
  Coffee,
  Bookmark,
  ExternalLink,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MatchTrait {
  name: string;
  score: number; // 0-100
  description?: string;
}

interface CommonInterest {
  name: string;
  category:
    | "hobby"
    | "value"
    | "lifestyle"
    | "religion"
    | "education"
    | "other";
  icon?: React.ReactNode;
}

interface MatchResultCardProps {
  id: string;
  name: string;
  age: number;
  location: string;
  distance?: number; // בקילומטרים
  profileImage?: string;
  matchPercentage: number;
  occupation?: string;
  education?: string;
  about?: string;
  matchTraits?: MatchTrait[];
  commonInterests?: CommonInterest[];
  lastActive?: Date;
  conversationStarted?: boolean;
  bookmarked?: boolean;
  className?: string;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onMessage?: (id: string) => void;
  onViewProfile?: (id: string) => void;
  onBookmark?: (id: string, bookmarked: boolean) => void;
  isPremium?: boolean;
}

export default function MatchResultCard({
  id,
  name,
  age,
  location,
  distance,
  profileImage,
  matchPercentage,
  occupation,
  education,
  about,
  matchTraits = [],
  commonInterests = [],
  lastActive,
  conversationStarted = false,
  bookmarked = false,
  className,
  onAccept,
  onReject,
  onMessage,
  onViewProfile,
  onBookmark,
  isPremium = false,
}: MatchResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(bookmarked);
  const [showConfirmReject, setShowConfirmReject] = useState(false);

  // מיפוי אייקון לקטגוריות תחומי עניין משותפים
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "hobby":
        return <Music className="h-3.5 w-3.5" />;
      case "value":
        return <Heart className="h-3.5 w-3.5" />;
      case "lifestyle":
        return <Coffee className="h-3.5 w-3.5" />;
      case "religion":
        return <BookOpen className="h-3.5 w-3.5" />;
      case "education":
        return <GraduationCap className="h-3.5 w-3.5" />;
      default:
        return <Star className="h-3.5 w-3.5" />;
    }
  };

  // פורמט לזמן פעילות אחרונה
  const formatLastActive = (date?: Date) => {
    if (!date) return "לא ידוע";

    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return "היום";
    if (diffInDays === 1) return "אתמול";
    if (diffInDays < 7) return `לפני ${diffInDays} ימים`;
    if (diffInDays < 30) return `לפני ${Math.floor(diffInDays / 7)} שבועות`;
    return `לפני ${Math.floor(diffInDays / 30)} חודשים`;
  };

  // טיפול בשמירה במועדפים
  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    if (onBookmark) {
      onBookmark(id, !isBookmarked);
    }
  };

  // קביעת צבע לפי אחוז התאמה
  const getMatchColor = () => {
    if (matchPercentage >= 90) return "from-green-400 to-emerald-500";
    if (matchPercentage >= 80) return "from-emerald-400 to-green-500";
    if (matchPercentage >= 70) return "from-blue-400 to-blue-500";
    if (matchPercentage >= 60) return "from-blue-400 to-cyan-500";
    return "from-cyan-400 to-blue-500";
  };

  // אנימציות
  const expandVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: {
      height: "auto",
      opacity: 1,
      transition: {
        height: { duration: 0.3 },
        opacity: { duration: 0.3, delay: 0.1 },
      },
    },
  };

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all border",
        isExpanded ? "shadow-md" : "shadow-sm hover:shadow-md",
        isPremium ? "border-amber-200" : "border-blue-100",
        className
      )}
    >
      {/* Premium Badge */}
      {isPremium && (
        <div className="absolute top-0 left-0 bg-gradient-to-r from-amber-400 to-amber-600 text-white px-2 py-0.5 text-xs rounded-br-md z-10">
          <Sparkles className="h-3 w-3 inline-block mr-1" />
          התאמה מומלצת
        </div>
      )}

      {/* Top Section */}
      <div className="p-4 flex md:flex-row flex-col gap-4">
        {/* Image */}
        <div className="relative">
          <Avatar className="w-24 h-24 rounded-lg border-2 border-white shadow-sm">
            <AvatarImage src={profileImage} alt={name} />
            <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 text-3xl">
              {name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          {/* Match Percentage */}
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
            <Badge
              className={cn(
                "rounded-full bg-gradient-to-r px-2 text-white border-0 shadow-sm",
                getMatchColor()
              )}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {matchPercentage}% התאמה
            </Badge>
          </div>
        </div>

        {/* Basic Info */}
        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium">
                {name}, {age}
              </h3>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-3.5 w-3.5 mr-1" />
                {location}
                {distance && <span className="mr-1">({distance} ק&quotמ)</span>}
              </div>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-full",
                      isBookmarked ? "text-amber-500" : "text-gray-400"
                    )}
                    onClick={handleBookmark}
                  >
                    <Bookmark className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isBookmarked ? "הסר ממועדפים" : "הוסף למועדפים"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Occupation + Education */}
          <div className="space-y-1">
            {occupation && (
              <div className="flex items-center text-sm text-gray-600">
                <Briefcase className="h-3.5 w-3.5 mr-1 text-gray-500" />
                {occupation}
              </div>
            )}

            {education && (
              <div className="flex items-center text-sm text-gray-600">
                <GraduationCap className="h-3.5 w-3.5 mr-1 text-gray-500" />
                {education}
              </div>
            )}
          </div>

          {/* Common Interests Preview */}
          {commonInterests.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {commonInterests.slice(0, 3).map((interest, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200 text-xs py-0 h-5"
                >
                  {interest.icon || getCategoryIcon(interest.category)}
                  <span className="mr-1 truncate max-w-[100px]">
                    {interest.name}
                  </span>
                </Badge>
              ))}

              {commonInterests.length > 3 && (
                <Badge
                  variant="outline"
                  className="bg-gray-50 text-gray-600 border-gray-200 text-xs"
                >
                  +{commonInterests.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-3 flex gap-2 justify-center">
        {onReject &&
          (showConfirmReject ? (
            <>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={() => onReject(id)}
              >
                לאשר דחייה
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowConfirmReject(false)}
              >
                בטל
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => setShowConfirmReject(true)}
            >
              <X className="h-4 w-4 mr-1" />
              לא מתאים
            </Button>
          ))}

        {onAccept && (
          <Button
            variant="default"
            size="sm"
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            onClick={() => onAccept(id)}
          >
            <Heart className="h-4 w-4 mr-1" />
            מעוניין/ת
          </Button>
        )}

        {conversationStarted && onMessage && (
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => onMessage(id)}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            המשך שיחה
          </Button>
        )}
      </div>

      {/* Expand/Collapse Button */}
      <div className="px-4 pb-2 text-center">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-gray-500 hover:text-gray-700"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronsUp className="h-3.5 w-3.5 mr-1" />
              הסתר פרטים נוספים
            </>
          ) : (
            <>
              <ChevronsDown className="h-3.5 w-3.5 mr-1" />
              הצג פרטים נוספים
            </>
          )}
        </Button>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            variants={expandVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="border-t border-gray-100"
          >
            <CardContent className="p-4 space-y-5">
              {/* About Section */}
              {about && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center">
                    <User className="h-4 w-4 mr-1 text-blue-500" />
                    קצת על {name}
                  </h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border">
                    {about}
                  </p>
                </div>
              )}

              {/* Match Traits */}
              {matchTraits.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center">
                    <Sparkles className="h-4 w-4 mr-1 text-blue-500" />
                    תחומי התאמה בולטים
                  </h4>

                  <div className="space-y-2">
                    {matchTraits.map((trait, index) => (
                      <TooltipProvider key={index}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>{trait.name}</span>
                                <span className="text-sm text-gray-600">
                                  {trait.score}%
                                </span>
                              </div>
                              <Progress
                                value={trait.score}
                                className="h-2"
                                indicatorClassName={cn(
                                  trait.score >= 80
                                    ? "bg-green-500"
                                    : trait.score >= 60
                                    ? "bg-blue-500"
                                    : "bg-blue-400"
                                )}
                              />
                            </div>
                          </TooltipTrigger>
                          {trait.description && (
                            <TooltipContent side="top" className="max-w-xs">
                              <p>{trait.description}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
              )}

              {/* All Common Interests */}
              {commonInterests.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center">
                    <Heart className="h-4 w-4 mr-1 text-blue-500" />
                    תחומי עניין משותפים
                  </h4>

                  <div className="flex flex-wrap gap-2">
                    {commonInterests.map((interest, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className={cn(
                          "bg-blue-50 text-blue-700 border-blue-200",
                          interest.category === "value" &&
                            "bg-pink-50 text-pink-700 border-pink-200",
                          interest.category === "religion" &&
                            "bg-purple-50 text-purple-700 border-purple-200",
                          interest.category === "education" &&
                            "bg-emerald-50 text-emerald-700 border-emerald-200"
                        )}
                      >
                        {interest.icon || getCategoryIcon(interest.category)}
                        <span className="mr-1">{interest.name}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Last Active */}
              {lastActive && (
                <div className="text-sm text-gray-500 flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                  פעילות אחרונה: {formatLastActive(lastActive)}
                </div>
              )}
            </CardContent>

            {/* Footer */}
            <CardFooter className="px-4 py-3 bg-gray-50 flex justify-between">
              {onViewProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onViewProfile(id)}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  צפייה בפרופיל מלא
                </Button>
              )}
            </CardFooter>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
