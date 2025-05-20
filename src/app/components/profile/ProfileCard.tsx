import React, { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// UI Components
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

// Icons
import {
  User,
  Heart,
  FileText,
  Image as ImageIcon,
  Info,
  Eye,
  EyeOff,
  Phone,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  GraduationCap,
  Users,
  Book,
  School,
  Lock,
  Languages,
  Calendar,
  Star,
  MapPin,
  Shield,
  CheckCircle,
  Clock,
} from "lucide-react";

// Types (Assuming these are correctly defined in your project)
import type {
  UserProfile,
  UserImage,
  QuestionnaireResponse,
  ContactPreference,
  AvailabilityStatus,
} from "@/types/next-auth"; // Make sure the path is correct

// Types
type ProfileActionType =
  | "contact"
  | "suggest"
  | "hide"
  | "report"
  | "save"
  | "verify"
  | "update_status"
  | "update_notes"
  | "update_visibility";

type ProfileActionData = {
  profileId?: string;
  userId?: string;
  status?: AvailabilityStatus;
  statusNote?: string;
  matchingNotes?: string;
  visibility?: boolean;
  reportReason?: string;
  reportDetails?: string;
  contactPreference?: ContactPreference;
  verificationDetails?: {
    verifiedBy: string;
    verificationDate: Date;
    notes?: string;
  };
};

// Interfaces
interface WorldConfig {
  key: string;
  title: string;
  icon: React.ElementType;
  color: string; // e.g., 'cyan' or 'pink'
  gradientFrom: string; // e.g., 'from-cyan-50'
  gradientTo: string; // e.g., 'to-cyan-50/20'
  border: string; // e.g., 'border-cyan-100/50'
  text: string; // e.g., 'text-cyan-600'
  iconBg: string; // e.g., 'bg-cyan-100'
}

interface ProfileCardProps {
  profile: UserProfile;
  images?: UserImage[];
  questionnaire?: QuestionnaireResponse | null;
  viewMode?: "matchmaker" | "candidate";
  className?: string;
  onAction?: (type: ProfileActionType, data?: ProfileActionData) => void;
}

// Constants
const WORLDS: Record<string, WorldConfig> = {
  values: {
    key: "values",
    title: "ערכים ואמונות",
    icon: Heart,
    color: "pink",
    gradientFrom: "from-pink-50",
    gradientTo: "to-pink-50/20",
    border: "border-pink-100/50",
    text: "text-pink-600",
    iconBg: "bg-pink-100",
  },
  personality: {
    key: "personality",
    title: "אישיות",
    icon: User,
    color: "blue",
    gradientFrom: "from-blue-50",
    gradientTo: "to-blue-50/20",
    border: "border-blue-100/50",
    text: "text-blue-600",
    iconBg: "bg-blue-100",
  },
  relationship: {
    key: "relationship",
    title: "זוגיות ומשפחה",
    icon: Users,
    color: "purple",
    gradientFrom: "from-purple-50",
    gradientTo: "to-purple-50/20",
    border: "border-purple-100/50",
    text: "text-purple-600",
    iconBg: "bg-purple-100",
  },
  religion: {
    key: "religion",
    title: "דת ומסורת",
    icon: Book,
    color: "indigo",
    gradientFrom: "from-indigo-50",
    gradientTo: "to-indigo-50/20",
    border: "border-indigo-100/50",
    text: "text-indigo-600",
    iconBg: "bg-indigo-100",
  },
  partner: {
    key: "partner",
    title: "העדפות בן/בת זוג",
    icon: Heart, // Consider a different icon if needed
    color: "red",
    gradientFrom: "from-red-50",
    gradientTo: "to-red-50/20",
    border: "border-red-100/50",
    text: "text-red-600",
    iconBg: "bg-red-100",
  },
};

// --- Helper Components ---

// Sensitive Info Wrapper (Matchmaker Only)
const SensitiveInfo: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="relative border border-amber-300 rounded-xl p-4 sm:p-6 bg-gradient-to-br from-amber-50 to-white shadow-md">
    <div className="flex items-center gap-2 mb-4 text-amber-700">
      <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
      <span className="font-medium text-sm sm:text-base">
        מידע לשדכנים בלבד
      </span>
    </div>
    {children}
  </div>
);

// Empty State Placeholder
const EmptyState: React.FC<{ icon: React.ElementType; message: string }> = ({
  icon: Icon,
  message,
}) => (
  <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-gray-400 bg-gray-50/30 rounded-xl border border-gray-100">
    <Icon className="w-10 h-10 sm:w-14 sm:h-14 mb-3 sm:mb-4 opacity-50 text-gray-300" />
    <p className="text-sm sm:text-base font-medium text-gray-500">{message}</p>
  </div>
);

// Section Header Component
const SectionHeader: React.FC<{
  icon: React.ElementType;
  title: string;
  worldKey?: keyof typeof WORLDS;
}> = ({ icon: Icon, title, worldKey }) => {
  const config = worldKey ? WORLDS[worldKey] : null;
  const iconColor = config ? config.text : "text-primary";
  const iconBg = config ? config.iconBg : "bg-primary/10";

  return (
    <div className="flex items-center gap-2 mb-3 sm:mb-4">
      <div className={cn("p-1.5 sm:p-2 rounded-full", iconBg)}>
        <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", iconColor)} />
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
        {title}
      </h3>
    </div>
  );
};

// --- Main Profile Card Component ---

const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  images = [],
  questionnaire,
  viewMode = "candidate",
  className,
  // onAction // Assuming onAction implementation is needed later
}) => {
  // State
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("about");

  // Calculate age from birthDate
  const calculateAge = (birthDate: Date | string): number => {
    try {
      const today = new Date();
      const birth = new Date(birthDate);
      if (isNaN(birth.getTime())) {
        console.error("Invalid birthDate:", birthDate);
        return 0; // Or handle appropriately
      }
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birth.getDate())
      ) {
        age--;
      }
      return age;
    } catch (e) {
      console.error("Error calculating age:", e);
      return 0;
    }
  };

  // Derived values
  const age = profile.birthDate ? calculateAge(profile.birthDate) : 0;
  const mainImage = images?.find((img) => img.isMain);

  // Image handlers
  const handleImageClick = (index: number) => setSelectedImageIndex(index);
  const handleCloseDialog = () => setSelectedImageIndex(null);

  const handleNextImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const handlePreviousImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  return (
    <Card
      dir="rtl" // Ensure RTL direction for the entire card
      className={cn(
        "w-full bg-gradient-to-br from-white via-white to-blue-50/30 shadow-xl rounded-2xl overflow-hidden border-0", // Softer background, more pronounced shadow
        className
      )}
    >
      {/* Header Section with Softer Gradient */}
      <div className="relative p-4 sm:p-6 md:p-8 text-center overflow-hidden bg-gradient-to-br from-cyan-50 via-white to-pink-50">
        {/* Background pattern like Hero */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:20px_20px]"></div>

        {/* Profile Summary */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 max-w-3xl mx-auto">
          {/* Profile Image with enhanced border/shadow */}
          <div className="relative h-28 w-28 sm:h-36 sm:w-36 md:h-44 md:w-44 rounded-full overflow-hidden border-4 border-white shadow-lg transition-transform hover:scale-105 duration-300 ring-2 ring-cyan-200/50 hover:ring-cyan-300">
            {mainImage ? (
              <Image
                src={mainImage.url}
                alt="תמונת פרופיל"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 112px, (max-width: 768px) 144px, 176px"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <User className="w-10 h-10 sm:w-16 sm:h-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Profile Info - RTL aligned, updated styles */}
          <div className="space-y-2 sm:space-y-3 text-center sm:text-right mt-2 sm:mt-0">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
                {" "}
                {/* Removed font-serif */}
                {profile?.user?.firstName} {profile?.user?.lastName}
              </h2>
              {/* Info Tags styled like Hero */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 sm:gap-3 mt-2">
                <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-700 bg-white/80 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-sm border border-gray-100">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-500" />
                  <span>{age > 0 ? `${age} שנים` : "גיל לא זמין"}</span>
                </div>

                {profile.city && (
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-700 bg-white/80 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-sm border border-gray-100">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-pink-500" />
                    <span>{profile.city}</span>
                  </div>
                )}

                {profile.religiousLevel && (
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-700 bg-white/80 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-sm border border-gray-100">
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-600" />
                    <span>{profile.religiousLevel}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status Badges with softer styling */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center sm:justify-start mt-1 sm:mt-2">
              {profile.isProfileVisible && (
                <Badge className="bg-emerald-100 text-emerald-800 border-0 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm shadow-sm">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    פנוי/ה להצעות
                  </div>
                </Badge>
              )}

              {profile.maritalStatus && (
                <Badge
                  variant="outline"
                  className="bg-purple-100 border-purple-200/50 text-purple-700 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm shadow-sm"
                >
                  <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-1" />{" "}
                  {/* Adjusted margin for RTL */}
                  {profile.maritalStatus}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid - Styled like Hero Trust Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-6 bg-white/40 backdrop-blur-sm border-y border-gray-100">
        {/* Age */}
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-white/60 shadow-md border border-cyan-100 hover:shadow-lg transition-all duration-300">
          <div className="p-2 sm:p-2.5 rounded-full bg-cyan-100 text-cyan-600">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-cyan-600 mb-0.5">גיל</p>
            <p className="text-base sm:text-lg font-semibold text-gray-800">
              {age > 0 ? age : "-"}
            </p>
          </div>
        </div>

        {/* Marital Status */}
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-white/60 shadow-md border border-pink-100 hover:shadow-lg transition-all duration-300">
          <div className="p-2 sm:p-2.5 rounded-full bg-pink-100 text-pink-600">
            <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-pink-600 mb-0.5">
              מצב משפחתי
            </p>
            <p className="text-base sm:text-lg font-semibold text-gray-800">
              {profile.maritalStatus || "-"}
            </p>
          </div>
        </div>

        {/* Education */}
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-white/60 shadow-md border border-indigo-100 hover:shadow-lg transition-all duration-300">
          <div className="p-2 sm:p-2.5 rounded-full bg-indigo-100 text-indigo-600">
            <School className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-indigo-600 mb-0.5">השכלה</p>
            <p className="text-base sm:text-lg font-semibold text-gray-800">
              {profile.education || "-"}
            </p>
          </div>
        </div>

        {/* Native Language */}
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-white/60 shadow-md border border-emerald-100 hover:shadow-lg transition-all duration-300">
          <div className="p-2 sm:p-2.5 rounded-full bg-emerald-100 text-emerald-600">
            <Languages className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-emerald-600 mb-0.5">
              שפת אם
            </p>
            <p className="text-base sm:text-lg font-semibold text-gray-800">
              {profile.nativeLanguage || "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Photo Gallery Preview */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold flex items-center gap-1.5 sm:gap-2 text-gray-700">
            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            תמונות
            <span className="text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-full w-5 h-5 sm:w-6 sm:h-6 inline-flex items-center justify-center font-mono">
              {images.length}
            </span>
          </h3>
          {images.length > 0 && (
            <Button
              variant="link" // Changed to link for subtler appearance
              size="sm"
              onClick={() => setActiveTab("photos")}
              className="text-xs text-cyan-600 hover:text-cyan-700 p-1 sm:p-2"
            >
              הצג הכל
            </Button>
          )}
        </div>

        {images.length > 0 ? (
          <ScrollArea dir="rtl" className="w-full pb-2">
            <div className="flex gap-1.5 sm:gap-3 pb-2">
              {images.slice(0, 5).map((image, index) => (
                <div
                  key={image.id}
                  className="relative flex-shrink-0 w-[90px] h-[90px] sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-gray-100 shadow-sm cursor-pointer hover:opacity-90 transition-all duration-300 border border-gray-100"
                  onClick={() => handleImageClick(index)}
                >
                  <Image
                    src={image.url}
                    alt={`תמונת פרופיל ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 90px, 112px"
                  />
                  {image.isMain && (
                    <div className="absolute top-1.5 right-1.5 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full p-1 shadow-md">
                      <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {images.length > 5 && (
                <div
                  className="relative flex-shrink-0 w-[90px] h-[90px] sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center cursor-pointer hover:shadow-md transition-all duration-300 border border-gray-200"
                  onClick={() => setActiveTab("photos")}
                >
                  <div className="text-center">
                    <span className="block text-base sm:text-lg font-bold text-gray-600">
                      +{images.length - 5}
                    </span>
                    <span className="text-xs text-gray-500">עוד</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <EmptyState icon={ImageIcon} message="אין תמונות בפרופיל" />
        )}
      </div>

      {/* Main Tabs Navigation */}
      <div className="p-4 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Styled TabsList background */}
          <div className="bg-gradient-to-r from-cyan-50/50 via-white to-pink-50/50 p-1 rounded-xl mb-4 sm:mb-6 sticky top-0 z-10 shadow-sm">
            <ScrollArea className="w-full overflow-x-visible" dir="rtl">
              <div className="flex pb-1 px-1">
                {/* Removed explicit width, using flex-nowrap */}
                <TabsList className="h-auto inline-flex bg-transparent flex-nowrap justify-start p-0">
                  <TabsTrigger
                    value="about"
                    className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-cyan-600 text-gray-600 hover:bg-white/60 hover:text-gray-800 transition-all"
                  >
                    <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>אודות</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="education"
                    className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-indigo-600 text-gray-600 hover:bg-white/60 hover:text-gray-800 transition-all"
                  >
                    <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">השכלה ותעסוקה</span>
                    <span className="xs:hidden">השכלה</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="family"
                    className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-600 text-gray-600 hover:bg-white/60 hover:text-gray-800 transition-all"
                  >
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>משפחה</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="photos"
                    className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-gray-700 text-gray-600 hover:bg-white/60 hover:text-gray-800 transition-all"
                  >
                    <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>תמונות</span>
                    {images.length > 0 && (
                      <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5 mr-1 hidden sm:inline-block font-mono">
                        {" "}
                        {/* Adjusted margin for RTL */}
                        {images.length}
                      </span>
                    )}
                  </TabsTrigger>

                  {questionnaire && ( // Only show if questionnaire exists
                    <TabsTrigger
                      value="questionnaire"
                      className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-pink-600 text-gray-600 hover:bg-white/60 hover:text-gray-800 transition-all"
                    >
                      <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>שאלון</span>
                    </TabsTrigger>
                  )}

                  {viewMode === "matchmaker" && (
                    <TabsTrigger
                      value="sensitive"
                      className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-amber-600 bg-amber-50/80 text-amber-700 hover:bg-amber-100/80 transition-all"
                    >
                      <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">מידע רגיש</span>
                      <span className="xs:hidden">רגיש</span>
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>
            </ScrollArea>
          </div>

          {/* --- Tab Content Panes --- */}

          {/* About Tab */}
          <TabsContent
            value="about"
            className="mt-2 space-y-6 sm:space-y-8 focus:outline-none"
          >
            {/* Basic Description */}
            <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-white border border-blue-100/50 shadow-md">
              <SectionHeader icon={User} title="אודות" worldKey="personality" />
              {profile.about ? (
                <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                  {profile.about}
                </p>
              ) : (
                <EmptyState icon={User} message="לא הוזן תיאור" />
              )}
            </div>

            {/* Hobbies */}
            <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-pink-50 to-white border border-pink-100/50 shadow-md">
              <SectionHeader icon={Heart} title="תחביבים" worldKey="values" />
              {profile.profileHobbies ? (
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                  {profile.profileHobbies.map((hobby, index) => (
                    <Badge
                      key={index}
                      className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-white text-pink-700 border border-pink-200 shadow-sm hover:bg-pink-50 transition-colors text-xs sm:text-sm font-medium"
                    >
                      {hobby.trim()}
                    </Badge>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Heart} message="לא הוזנו תחביבים" />
              )}
            </div>

            {/* Languages */}
            <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100/50 shadow-md">
              <SectionHeader icon={Languages} title="שפות" />{" "}
              {/* Generic styling */}
              <div className="space-y-3 sm:space-y-4 mt-2 sm:mt-3">
                {/* Native Language */}
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 border border-emerald-100/80">
                  <p className="text-xs sm:text-sm font-medium text-emerald-700 mb-1 sm:mb-2">
                    שפת אם
                  </p>
                  <p className="text-base sm:text-lg font-medium text-gray-800">
                    {profile.nativeLanguage || "-"}
                  </p>
                </div>

                {/* Additional Languages */}
                {profile.additionalLanguages &&
                profile.additionalLanguages.length > 0 ? (
                  <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 border border-emerald-100/80">
                    <p className="text-xs sm:text-sm font-medium text-emerald-700 mb-1 sm:mb-2">
                      שפות נוספות
                    </p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1">
                      {profile.additionalLanguages.map((lang) => (
                        <Badge
                          key={lang}
                          className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs sm:text-sm shadow-sm"
                        >
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/80 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center text-xs sm:text-sm text-gray-500 border border-gray-100">
                    לא הוזנו שפות נוספות
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Education & Employment Tab */}
          <TabsContent
            value="education"
            className="mt-2 space-y-6 sm:space-y-8 focus:outline-none"
          >
            <div className="rounded-xl sm:rounded-2xl bg-white border border-indigo-100/50 shadow-md overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                {/* Education */}
                <div className="p-4 sm:p-6 border-b md:border-b-0 md:border-l border-indigo-100/50 bg-gradient-to-br from-indigo-50 to-white">
                  <SectionHeader
                    icon={GraduationCap}
                    title="השכלה"
                    worldKey="religion"
                  />{" "}
                  {/* Assuming 'religion' theme fits best */}
                  <div className="mt-3 sm:mt-4 space-y-4 sm:space-y-6">
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-5 border border-indigo-100">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 rounded-full bg-indigo-100 text-indigo-600 flex-shrink-0">
                          <GraduationCap className="w-4 h-4 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-indigo-600 mb-0.5 sm:mb-1">
                            רמת השכלה
                          </p>
                          <p className="text-base sm:text-lg font-medium text-gray-800">
                            {profile.education || "לא צוין"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Employment */}
                <div className="p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-white">
                  <SectionHeader
                    icon={Briefcase}
                    title="תעסוקה"
                    worldKey="relationship"
                  />{" "}
                  {/* Assuming 'relationship' theme fits best */}
                  <div className="mt-3 sm:mt-4 space-y-4 sm:space-y-6">
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-5 border border-purple-100">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 rounded-full bg-purple-100 text-purple-600 flex-shrink-0">
                          <Briefcase className="w-4 h-4 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-purple-600 mb-0.5 sm:mb-1">
                            עיסוק נוכחי
                          </p>
                          <p className="text-base sm:text-lg font-medium text-gray-800">
                            {profile.occupation || "לא צוין"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Family Tab */}
          <TabsContent value="family" className="mt-2 focus:outline-none">
            <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-white border border-purple-100/50 shadow-md">
              <SectionHeader
                icon={Users}
                title="מידע משפחתי"
                worldKey="relationship"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 mt-3 sm:mt-4">
                {/* Parent Status */}
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-5 border border-purple-100 transition-all hover:shadow-lg hover:border-purple-200 duration-300">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-full bg-purple-100 text-purple-600 flex-shrink-0">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-purple-600 mb-0.5 sm:mb-1">
                        מצב הורים
                      </p>
                      <p className="text-base sm:text-lg font-medium text-gray-800">
                        {profile.parentStatus || "לא צוין"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Siblings Count */}
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-5 border border-purple-100 transition-all hover:shadow-lg hover:border-purple-200 duration-300">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-full bg-purple-100 text-purple-600 flex-shrink-0">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-purple-600 mb-0.5 sm:mb-1">
                        מספר אחים/אחיות
                      </p>
                      <p className="text-base sm:text-lg font-medium text-gray-800">
                        {profile.siblings ?? "לא צוין"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Family Position */}
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-5 border border-purple-100 transition-all hover:shadow-lg hover:border-purple-200 duration-300">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-full bg-purple-100 text-purple-600 flex-shrink-0">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-purple-600 mb-0.5 sm:mb-1">
                        מיקום במשפחה
                      </p>
                      <p className="text-base sm:text-lg font-medium text-gray-800">
                        {profile.position ?? "לא צוין"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="mt-2 focus:outline-none">
            <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white border border-gray-200/50 shadow-md">
              <SectionHeader icon={ImageIcon} title="גלריית תמונות" />
              {images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-3 sm:mt-4">
                  {images.map((image, index) => (
                    <div
                      key={image.id}
                      className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group shadow-md border border-gray-100"
                      onClick={() => handleImageClick(index)}
                    >
                      <Image
                        src={image.url}
                        alt={`תמונת פרופיל ${index + 1}`}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-2">
                        <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-80 transition-opacity duration-300" />
                      </div>
                      {image.isMain && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-gradient-to-br from-yellow-400 to-amber-500 text-white border-0 shadow-md text-xs px-2 py-1">
                            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 fill-white" />{" "}
                            {/* Adjusted margin for RTL */}
                            ראשי
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={ImageIcon} message="לא הועלו תמונות" />
              )}
            </div>
          </TabsContent>

          {/* Questionnaire Tab */}
          {questionnaire && (
            <TabsContent
              value="questionnaire"
              className="mt-2 focus:outline-none"
            >
              <div className="space-y-4 sm:space-y-6">
                {/* Questionnaire Status */}
                <div className="rounded-lg sm:rounded-xl p-3 sm:p-4 bg-white border border-gray-200 shadow-md flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {questionnaire.completed ? (
                      <div className="p-1.5 sm:p-2 rounded-full bg-emerald-100 text-emerald-600">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                    ) : (
                      <div className="p-1.5 sm:p-2 rounded-full bg-blue-100 text-blue-600">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm sm:text-base font-medium text-gray-900">
                        {questionnaire.completed
                          ? "שאלון הושלם"
                          : "שאלון בתהליך"}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-500">
                        עודכן לאחרונה:{" "}
                        {new Date(questionnaire.lastSaved).toLocaleDateString(
                          "he-IL"
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 font-mono">
                    {`${questionnaire.worldsCompleted?.length || 0}/${
                      Object.keys(WORLDS).length
                    } הושלמו`}
                  </div>
                </div>

                {/* Questionnaire Content by World */}
                {Object.entries(questionnaire.formattedAnswers || {}).map(
                  ([worldKey, answers]) => {
                    if (!Array.isArray(answers) || answers.length === 0)
                      return null;
                    const worldConfig = WORLDS[worldKey as keyof typeof WORLDS];
                    if (!worldConfig) return null; // Skip if world config not found

                    const worldCompleted = questionnaire[
                      `${worldKey}Completed` as keyof QuestionnaireResponse
                    ] as boolean | undefined;

                    return (
                      <div
                        key={worldKey}
                        className={cn(
                          "rounded-xl sm:rounded-2xl p-4 sm:p-6 border shadow-md transition-shadow hover:shadow-lg",
                          `bg-gradient-to-br ${worldConfig.gradientFrom} ${worldConfig.gradientTo}`,
                          worldConfig.border
                        )}
                      >
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                          <h3 className="text-base sm:text-xl font-semibold flex items-center gap-1.5 sm:gap-2">
                            <div
                              className={cn(
                                "p-1.5 sm:p-2 rounded-full",
                                worldConfig.iconBg
                              )}
                            >
                              <worldConfig.icon
                                className={cn(
                                  "h-4 w-4 sm:h-5 sm:h-5",
                                  worldConfig.text
                                )}
                              />
                            </div>
                            <span className="text-gray-800">
                              {worldConfig.title}
                            </span>
                          </h3>
                          <Badge
                            className={cn(
                              "flex items-center gap-1 text-xs px-2 py-1 shadow-sm",
                              worldCompleted
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200/50"
                                : "bg-blue-100 text-blue-800 border-blue-200/50"
                            )}
                          >
                            {worldCompleted ? (
                              <>
                                <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-0.5" />{" "}
                                {/* Adjusted margin for RTL */}
                                הושלם
                              </>
                            ) : (
                              <>
                                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-0.5" />{" "}
                                {/* Adjusted margin for RTL */}
                                בתהליך
                              </>
                            )}
                          </Badge>
                        </div>

                        <div className="grid gap-3 sm:gap-4">
                          {answers
                            .filter(
                              (answer) =>
                                viewMode === "matchmaker" ||
                                answer.isVisible !== false
                            ) // Type guard for isVisible
                            .map((answer) => (
                              <div
                                key={answer.questionId}
                                className={cn(
                                  "bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border transition-shadow hover:shadow-md",
                                  worldConfig.border.replace("/50", "") // Slightly stronger border for answers
                                )}
                              >
                                <div className="flex justify-between items-start mb-2 sm:mb-3 gap-2">
                                  <p className="text-xs sm:text-sm font-medium text-gray-700 flex-1 leading-snug">
                                    {answer.question}
                                  </p>
                                  {/* Visibility Badge */}
                                  {answer.isVisible === false ? ( // Explicitly check for false
                                    <Badge
                                      variant="outline"
                                      className="bg-gray-100 text-gray-500 border-gray-200 text-xs py-0.5 px-1.5 whitespace-nowrap"
                                    >
                                      <EyeOff className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-1" />{" "}
                                      {/* Adjusted margin for RTL */}
                                      מוסתר
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-xs py-0.5 px-1.5 whitespace-nowrap",
                                        `${worldConfig.text}/80 bg-${worldConfig.color}-50 border-${worldConfig.color}-200/50`
                                      )}
                                    >
                                      <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-1" />{" "}
                                      {/* Adjusted margin for RTL */}
                                      מוצג
                                    </Badge>
                                  )}
                                </div>
                                {/* Answer Display */}
                                <div
                                  className={`bg-${worldConfig.color}-50/30 rounded-md sm:rounded-lg p-2.5 sm:p-4 mb-1.5 sm:mb-2`}
                                >
                                  <p className="text-sm sm:text-base font-medium text-gray-800">
                                    {answer.displayText}
                                  </p>
                                </div>
                                {/* Answer Date */}
                                <div className="flex justify-end">
                                  <p className="text-xs text-gray-400 flex items-center">
                                    <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-1" />{" "}
                                    {/* Adjusted margin for RTL */}
                                    {new Date(
                                      answer.answeredAt
                                    ).toLocaleDateString("he-IL")}
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </TabsContent>
          )}

          {/* Fallback if questionnaire is missing */}
          {!questionnaire && activeTab === "questionnaire" && (
            <TabsContent
              value="questionnaire"
              className="mt-2 focus:outline-none"
            >
              <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white border border-gray-200/50 shadow-md text-center">
                <EmptyState icon={FileText} message="שאלון אינו זמין לצפייה" />
              </div>
            </TabsContent>
          )}

          {/* Sensitive Information Tab (Matchmakers Only) */}
          {viewMode === "matchmaker" && (
            <TabsContent value="sensitive" className="mt-2 focus:outline-none">
              <SensitiveInfo>
                {/* Contact Preferences */}
                <div className="space-y-4 sm:space-y-5 mb-6 sm:mb-8">
                  <h3 className="text-base sm:text-lg font-semibold text-amber-800 flex items-center gap-1.5 sm:gap-2">
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    העדפות יצירת קשר
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {/* Contact Method */}
                    <div className="p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl shadow-sm border border-amber-200">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
                          <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-amber-700 mb-1">
                            אופן יצירת קשר מועדף
                          </p>
                          <p className="text-sm sm:text-base font-medium text-gray-800">
                            {profile.contactPreference === "direct"
                              ? "ישירות"
                              : profile.contactPreference === "matchmaker"
                              ? "דרך השדכן/ית"
                              : profile.contactPreference === "both"
                              ? "שתי האפשרויות"
                              : "לא צוין"}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Preferred Matchmaker Gender */}
                    <div className="p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl shadow-sm border border-amber-200">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
                          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-amber-700 mb-1">
                            העדפת מגדר שדכן/ית
                          </p>
                          <p className="text-sm sm:text-base font-medium text-gray-800">
                            {profile.preferredMatchmakerGender === "MALE"
                              ? "גבר"
                              : profile.preferredMatchmakerGender === "FEMALE"
                              ? "אישה"
                              : "אין העדפה / לא צוין"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Matching Notes */}
                {profile.matchingNotes ? (
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-amber-800 flex items-center gap-1.5 sm:gap-2">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                      הערות לשדכנים
                    </h3>
                    <div className="p-3 sm:p-5 bg-white rounded-lg sm:rounded-xl shadow-sm border border-amber-200">
                      <p className="whitespace-pre-wrap text-sm sm:text-base font-medium text-gray-800">
                        {profile.matchingNotes}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-amber-800 flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                      הערות לשדכנים
                    </h3>
                    <EmptyState icon={FileText} message="לא הוזנו הערות" />
                  </div>
                )}
              </SensitiveInfo>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Image Viewer Dialog */}
      {selectedImageIndex !== null && images[selectedImageIndex] && (
        <Dialog
          open={selectedImageIndex !== null}
          onOpenChange={handleCloseDialog}
        >
          <DialogContent className="max-w-4xl p-0 bg-black/90 backdrop-blur-md border-none shadow-2xl overflow-hidden rounded-lg">
            <div className="p-3 sm:p-4 text-white flex justify-between items-center border-b border-gray-700/50">
              <DialogTitle className="text-center text-base sm:text-xl font-semibold flex-grow">
                גלריית תמונות ({selectedImageIndex + 1}/{images.length})
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-300 hover:text-white hover:bg-white/10 h-8 w-8 rounded-full"
                onClick={handleCloseDialog}
              >
                <span className="sr-only">סגור</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </div>

            <div className="relative h-[60vh] sm:h-[70vh] max-h-[700px] w-full overflow-hidden flex items-center justify-center bg-black">
              <Image
                key={images[selectedImageIndex].id} // Add key for potential re-renders
                src={images[selectedImageIndex].url}
                alt={`תמונת פרופיל ${selectedImageIndex + 1}`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                priority
              />

              {/* Navigation Buttons */}
              {selectedImageIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full h-9 w-9 sm:h-12 sm:w-12 shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviousImage();
                  }}
                  aria-label="תמונה קודמת"
                >
                  <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />{" "}
                  {/* ChevronRight for previous in RTL */}
                </Button>
              )}
              {selectedImageIndex < images.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full h-9 w-9 sm:h-12 sm:w-12 shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  aria-label="תמונה הבאה"
                >
                  <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />{" "}
                  {/* ChevronLeft for next in RTL */}
                </Button>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <ScrollArea dir="rtl" className="w-full">
                <div className="flex gap-1.5 sm:gap-2 p-2 sm:p-4 justify-center bg-black/80">
                  {images.map((image, index) => (
                    <div
                      key={image.id}
                      className={cn(
                        "relative flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-md sm:rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200 ease-in-out",
                        selectedImageIndex === index
                          ? "border-cyan-400 ring-2 ring-cyan-400/50 scale-105"
                          : "border-transparent hover:border-gray-400 opacity-60 hover:opacity-100"
                      )}
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      <Image
                        src={image.url}
                        alt={`תמונה ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="64px" // Appropriate size for thumbnails
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};

export default ProfileCard;
