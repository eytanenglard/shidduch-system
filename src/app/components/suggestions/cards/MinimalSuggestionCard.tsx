// src/app/components/suggestions/cards/MinimalSuggestionCard.tsx

import React from "react";
import Image from "next/image";
import { formatDistanceToNow, isAfter, subDays } from "date-fns";
import { he } from "date-fns/locale";
import {
  User,
  MapPin,
  Briefcase,
  Clock,
  UserCircle,
  Eye,
  CheckCircle,
  XCircle,
  MessageCircle,
  Heart,
  BookOpen,
  Scroll,
  Calendar,
  AlertTriangle,
  Sparkles,
  ChevronLeft,
  Star,
  Quote
} from "lucide-react";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";
import type { ExtendedMatchSuggestion } from "../types";

// --- START OF CHANGE ---
interface MinimalSuggestionCardProps {
  suggestion: ExtendedMatchSuggestion;
  userId: string;
  onClick: (suggestion: ExtendedMatchSuggestion) => void;
  onApprove?: (suggestion: ExtendedMatchSuggestion) => void;
  onInquiry?: (suggestion: ExtendedMatchSuggestion) => void;
  onDecline?: (suggestion: ExtendedMatchSuggestion) => void;
  className?: string;
  isHistory?: boolean;
  isApprovalDisabled?: boolean; // This line was missing
}
// --- END OF CHANGE ---

const calculateAge = (birthDate?: Date | string | null): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null;
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age > 0 ? age : null;
};

// עדכון בקובץ MinimalSuggestionCard.tsx - פונקציית getStatusInfo

const getStatusInfo = (status: string) => {
  switch (status) {
    case "PENDING_FIRST_PARTY":
    case "PENDING_SECOND_PARTY":
      return {
        label: status === "PENDING_FIRST_PARTY" ? "ממתין לתשובתך" : "ממתין לצד השני",
        className: "bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 border-purple-200", // 🟣 סגול!
        icon: <Clock className="w-3 h-3" />,
        pulse: true,
      };
    case "FIRST_PARTY_APPROVED":
    case "SECOND_PARTY_APPROVED":
      return {
        label: status === "FIRST_PARTY_APPROVED" ? "אישרת" : "הצד השני אישר",
        className: "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200", // 🟢 ירוק נשאר לאישורים
        icon: <CheckCircle className="w-3 h-3" />,
        pulse: false,
      };
    case "CONTACT_DETAILS_SHARED":
      return {
        label: "פרטים שותפו",
        className: "bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 border-cyan-200",
        icon: <MessageCircle className="w-3 h-3" />,
        pulse: false,
      };
    case "DATING":
       return {
        label: "בפגישות",
        className: "bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 border-pink-200",
        icon: <Heart className="w-3 h-3" />,
        pulse: false,
      };
    // עדכון הכתום לדחוף - מחזק את הכתום
    case "URGENT": // או כל סטטוס דחוף
      return {
        label: "דחוף",
        className: "bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border-orange-300", // 🧡 כתום מחוזק!
        icon: <AlertTriangle className="w-3 h-3" />,
        pulse: true,
      };
    default:
      return {
        label: "בטיפול",
        className: "bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 border-purple-200", // 🟣 סגול ברירת מחדל
        icon: <Clock className="w-3 h-3" />,
        pulse: false,
      };
  }
};
const MinimalSuggestionCard: React.FC<MinimalSuggestionCardProps> = ({
  suggestion,
  userId,
  onClick,
  onApprove,
  onInquiry,
  onDecline,
  className,
  isHistory = false,
  isApprovalDisabled = false,
}) => {
  const targetParty = suggestion.firstPartyId === userId ? suggestion.secondParty : suggestion.firstParty;
  const isFirstParty = suggestion.firstPartyId === userId;

  if (!targetParty || !targetParty.profile) {
    console.error("MinimalSuggestionCard: targetParty or profile is missing.", { suggestion });
    return null;
  }

  const mainImage = targetParty.images?.find((img) => img.isMain);
  const age = calculateAge(targetParty.profile.birthDate);
  const statusInfo = getStatusInfo(suggestion.status);

  const hasDeadline = suggestion.decisionDeadline && new Date(suggestion.decisionDeadline) > new Date();
  const isUrgent = hasDeadline && subDays(new Date(suggestion.decisionDeadline!), 2) < new Date();
  
  // Truncate matching reason for the teaser
  const reasonTeaser = suggestion.matchingReason
    ? suggestion.matchingReason.length > 100
      ? `${suggestion.matchingReason.substring(0, 100)}...`
      : suggestion.matchingReason
    : 'השדכן/ית זיהו פוטנציאל מיוחד שכדאי לבדוק!';

  return (
    <Card
      className={cn(
        "group w-full rounded-2xl overflow-hidden shadow-lg border-0 bg-white transition-all duration-500 hover:shadow-xl hover:-translate-y-1 cursor-pointer",
        isUrgent && "ring-2 ring-orange-300 ring-opacity-60",
        className
      )}
      onClick={(e) => {
        // Allow clicking the card to open details, but not if a button was clicked
        if (!(e.target as Element).closest("button")) {
          onClick(suggestion);
        }
      }}
    >
      {/* Header עם מידע השדכן */}
      <div className="relative p-4 bg-gradient-to-r from-cyan-50/80 via-white to-emerald-50/50 border-b border-cyan-100/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-white shadow-md">
              <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-emerald-500 text-white font-bold text-sm">
                {getInitials(`${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-cyan-600 font-medium">הצעה מ</p>
              <p className="text-sm font-bold text-gray-800">
                {suggestion.matchmaker.firstName} {suggestion.matchmaker.lastName}
              </p>
            </div>
          </div>
          
          <Badge className={cn("flex items-center gap-1.5 border shadow-sm", statusInfo.className, statusInfo.pulse && "animate-pulse")}>
            {statusInfo.icon}
            <span className="font-semibold text-xs">{statusInfo.label}</span>
          </Badge>
        </div>
        
        {isUrgent && (
          <div className="absolute top-2 left-2">
            <Badge className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                <span className="font-semibold text-xs">דחוף</span>
            </Badge>
          </div>
        )}
      </div>

      {/* Image Section */}
      <div className="relative h-64">
        {mainImage?.url ? (
          <Image
            src={mainImage.url}
            alt={`תמונה של ${targetParty.firstName}`}
            fill
            className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <User className="w-20 h-20 text-slate-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Name and Age overlay */}
        <div className="absolute bottom-4 right-4 left-4 text-white">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-2xl font-bold tracking-tight [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">
                {targetParty.firstName}
              </h3>
              {age && (
                <p className="text-lg font-medium text-white/90 [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]">
                  {age} שנים
                </p>
              )}
            </div>
            
            {/* אייקון מיוחד */}
            <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>
      
      <CardContent className="p-5 space-y-4">
        {/* Core Info Grid */}
        <div className="grid grid-cols-2 gap-3">
            {targetParty.profile.city && (
              <div className="flex items-center gap-2 p-2 bg-cyan-50/50 rounded-lg border border-cyan-100/50">
                  <MapPin className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700 truncate">{targetParty.profile.city}</span>
              </div>
            )}
            {targetParty.profile.occupation && (
              <div className="flex items-center gap-2 p-2 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
                  <Briefcase className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700 truncate">{targetParty.profile.occupation}</span>
              </div>
            )}
            {targetParty.profile.religiousLevel && (
              <div className="flex items-center gap-2 p-2 bg-blue-50/50 rounded-lg border border-blue-100/50">
                  <Scroll className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700 truncate">{targetParty.profile.religiousLevel}</span>
              </div>
            )}
            {targetParty.profile.education && (
              <div className="flex items-center gap-2 p-2 bg-green-50/50 rounded-lg border border-green-100/50">
                  <BookOpen className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700 truncate">{targetParty.profile.education}</span>
              </div>
            )}
        </div>
        
        {/* Matchmaker's reasoning highlight */}
        <div className="relative p-4 bg-gradient-to-r from-cyan-50/50 to-blue-50/50 border border-cyan-100/50 rounded-xl">
            <div className="flex items-start gap-3">
              <Quote className="w-4 h-4 text-cyan-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-cyan-800 mb-1">למה זו התאמה מיוחדת?</h4>
                <p className="text-sm text-cyan-700 leading-relaxed">
                    {reasonTeaser}
                </p>
              </div>
            </div>
            
            {/* זווית עיצובית */}
            <div className="absolute top-0 right-0 w-6 h-6 bg-gradient-to-br from-cyan-200/50 to-blue-200/50 rounded-bl-xl"></div>
        </div>
        
        {/* CTA hint */}
        <div className="text-center py-2">
          <p className="text-xs text-gray-500 font-medium">לחץ לפרטים מלאים ועוד תובנות</p>
        </div>
      </CardContent>

      {!isHistory && (
        <CardFooter className="p-4 bg-gradient-to-r from-gray-50/50 to-slate-50/50 border-t border-gray-100">
          {((suggestion.status === "PENDING_FIRST_PARTY" && isFirstParty) || (suggestion.status === "PENDING_SECOND_PARTY" && !isFirstParty)) ? (
             <div className="grid grid-cols-2 gap-3 w-full">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-xl font-medium transition-all duration-300"
                  onClick={(e) => { e.stopPropagation(); onDecline?.(suggestion); }}
                >
                  <XCircle className="w-4 h-4 ml-2" />
                  לא מתאים
                </Button>
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <div className="w-full">
                        <Button
                          size="sm"
                          variant="default"
                          className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-medium"
                          disabled={isApprovalDisabled}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isApprovalDisabled) {
                              toast.info("לא ניתן לאשר הצעה חדשה", {
                                description: "יש לך כבר הצעה אחרת בתהליך פעיל.",
                              });
                            } else {
                              onApprove?.(suggestion);
                            }
                          }}
                        >
                          <Heart className="w-4 h-4 ml-2" />
                          מעוניין/ת להכיר!
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {isApprovalDisabled && (
                      <TooltipContent>
                        <p>לא ניתן לאשר הצעה חדשה כשיש הצעה בתהליך פעיל.</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
             </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 w-full">
                <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-gray-200 hover:bg-cyan-50 hover:border-cyan-200 rounded-xl font-medium transition-all duration-300"
                    onClick={(e) => { e.stopPropagation(); onInquiry?.(suggestion); }}
                >
                    <MessageCircle className="w-4 h-4 ml-2" />
                    שאלה לשדכן/ית
                </Button>
                <Button
                    size="sm"
                    variant="default"
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-medium"
                    onClick={() => onClick(suggestion)}
                >
                    <Eye className="w-4 h-4 ml-2" />
                    צפה בפרטים
                    <ChevronLeft className="w-3 h-3 mr-1" />
                </Button>
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default MinimalSuggestionCard;