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

// Types
import type {
  UserProfile,
  UserImage,
  QuestionnaireResponse,
  ContactPreference,
  AvailabilityStatus,
} from "@/types/next-auth";

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
  color: string;
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
    color: "text-pink-500",
  },
  personality: {
    key: "personality",
    title: "אישיות",
    icon: User,
    color: "text-blue-500",
  },
  relationship: {
    key: "relationship",
    title: "זוגיות ומשפחה",
    icon: Users,
    color: "text-purple-500",
  },
  religion: {
    key: "religion",
    title: "דת ומסורת",
    icon: Book,
    color: "text-indigo-500",
  },
  partner: {
    key: "partner",
    title: "העדפות בן/בת זוג",
    icon: Heart,
    color: "text-red-500",
  },
};

const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  images = [],
  questionnaire,
  viewMode = "candidate",
  className,
}) => {
  // State
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("about");

  // Calculate age from birthDate
  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  // Derived values
  const age = calculateAge(new Date(profile.birthDate));
  const mainImage = images?.find((img) => img.isMain);

  // Image handlers
  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

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

  // Sensitive info component
  const SensitiveInfo: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => {
    if (viewMode !== "matchmaker") return null;

    return (
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
  };

  // Component for empty state with icon
  const EmptyState: React.FC<{
    icon: React.ElementType;
    message: string;
  }> = ({ icon: Icon, message }) => (
    <div className="flex flex-col items-center justify-center py-6 sm:py-10 text-gray-400 bg-gray-50/50 rounded-xl border border-gray-100">
      <Icon className="w-8 h-8 sm:w-12 sm:h-12 mb-2 sm:mb-3 opacity-50" />
      <p className="text-xs sm:text-sm font-medium">{message}</p>
    </div>
  );

  // Section header component
  const SectionHeader: React.FC<{
    icon: React.ElementType;
    title: string;
    iconColor?: string;
  }> = ({ icon: Icon, title, iconColor = "text-primary" }) => (
    <div className="flex items-center gap-2 mb-3 sm:mb-4">
      <div
        className={cn(
          "p-1.5 sm:p-2 rounded-full bg-opacity-10",
          iconColor.replace("text", "bg")
        )}
      >
        <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", iconColor)} />
      </div>
      <h3 className="text-lg sm:text-xl font-semibold">{title}</h3>
    </div>
  );

  return (
    <Card
      className={cn(
        "w-full bg-white shadow-xl rounded-xl overflow-hidden border-0",
        className
      )}
    >
      {/* Header Section with Gradient Background */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-6 md:p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="grid"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 10 0 L 0 0 0 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Profile Summary */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 max-w-3xl mx-auto">
          {/* Profile Image */}
          <div className="relative h-28 w-28 sm:h-36 sm:w-36 md:h-44 md:w-44 rounded-full overflow-hidden border-4 border-white shadow-lg transition-transform hover:scale-105 duration-300">
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

          {/* Profile Info */}
          <div className="space-y-2 sm:space-y-3 text-center sm:text-right mt-2 sm:mt-0">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-gray-800">
                {profile?.user?.firstName} {profile?.user?.lastName}
              </h2>
              <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 sm:gap-3 mt-2">
                <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-700 bg-white/80 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-sm">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                  <span>{age} שנים</span>
                </div>

                <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-700 bg-white/80 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-sm">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                  <span>{profile.city}</span>
                </div>

                {profile.religiousLevel && (
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-700 bg-white/80 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-sm">
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                    <span>{profile.religiousLevel}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center sm:justify-start mt-1 sm:mt-2">
              {profile.isProfileVisible && (
                <Badge className="bg-emerald-100 text-emerald-800 border-0 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    פנוי/ה להצעות
                  </div>
                </Badge>
              )}

              {profile.maritalStatus && (
                <Badge
                  variant="outline"
                  className="bg-purple-50 border-purple-200 text-purple-700 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm"
                >
                  <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" />
                  {profile.maritalStatus}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-6 bg-gray-50">
        {/* Age */}
        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-4 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 shadow-sm hover:shadow-md transition-all">
          <div className="p-1.5 sm:p-2.5 rounded-full bg-blue-100 text-blue-600">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-blue-600 mb-0.5">גיל</p>
            <p className="text-base sm:text-lg font-semibold text-gray-800">
              {age}
            </p>
          </div>
        </div>

        {/* Marital Status */}
        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-4 rounded-xl bg-gradient-to-br from-pink-50 to-white border border-pink-100 shadow-sm hover:shadow-md transition-all">
          <div className="p-1.5 sm:p-2.5 rounded-full bg-pink-100 text-pink-600">
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
        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 shadow-sm hover:shadow-md transition-all">
          <div className="p-1.5 sm:p-2.5 rounded-full bg-indigo-100 text-indigo-600">
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
        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 shadow-sm hover:shadow-md transition-all">
          <div className="p-1.5 sm:p-2.5 rounded-full bg-emerald-100 text-emerald-600">
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
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold flex items-center gap-1 sm:gap-2">
            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            תמונות
            <span className="text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-full w-5 h-5 sm:w-6 sm:h-6 inline-flex items-center justify-center">
              {images.length}
            </span>
          </h3>
          {images.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("photos")}
              className="text-xs text-gray-500 hover:text-gray-700 p-1 sm:p-2"
            >
              הצג הכל
            </Button>
          )}
        </div>

        {images.length > 0 ? (
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 snap-x scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {images.slice(0, 5).map((image, index) => (
              <div
                key={image.id}
                className="relative min-w-[90px] sm:min-w-[120px] w-[90px] h-[90px] sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-gray-100 shadow-sm cursor-pointer snap-start hover:opacity-90 transition-all duration-300"
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
                  <div className="absolute top-1 right-1 bg-yellow-400 rounded-full p-0.5">
                    <Star className="w-2 h-2 sm:w-3 sm:h-3 text-white fill-white" />
                  </div>
                )}
              </div>
            ))}

            {/* Show more button if there are more than 5 images */}
            {images.length > 5 && (
              <div
                className="relative min-w-[90px] sm:min-w-[120px] w-[90px] h-[90px] sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-gray-100/60 flex items-center justify-center cursor-pointer snap-start hover:bg-gray-100 transition-all duration-300"
                onClick={() => setActiveTab("photos")}
              >
                <div className="text-center">
                  <span className="block text-base sm:text-lg font-bold text-gray-600">
                    +{images.length - 5}
                  </span>
                  <span className="text-xs text-gray-500">תמונות</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyState icon={ImageIcon} message="אין תמונות בפרופיל" />
        )}
      </div>

      {/* Main Tabs Navigation */}
      <div className="p-3 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-gray-50 p-0.5 sm:p-1 rounded-xl mb-4 sm:mb-6 sticky top-0 z-10">
            <ScrollArea className="w-full overflow-x-visible" dir="rtl">
              <div className="flex pb-1 px-1">
                <TabsList className="h-auto inline-flex bg-transparent w-full flex-nowrap justify-start">
                  <TabsTrigger
                    value="about"
                    className="flex items-center gap-1 px-2.5 py-2 sm:gap-2 sm:px-4 sm:py-2.5 rounded-lg text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:text-primary"
                  >
                    <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>אודות</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="education"
                    className="flex items-center gap-1 px-2.5 py-2 sm:gap-2 sm:px-4 sm:py-2.5 rounded-lg text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:text-primary"
                  >
                    <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">השכלה ותעסוקה</span>
                    <span className="xs:hidden">השכלה</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="family"
                    className="flex items-center gap-1 px-2.5 py-2 sm:gap-2 sm:px-4 sm:py-2.5 rounded-lg text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:text-primary"
                  >
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>משפחה</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="photos"
                    className="flex items-center gap-1 px-2.5 py-2 sm:gap-2 sm:px-4 sm:py-2.5 rounded-lg text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:text-primary"
                  >
                    <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>תמונות</span>
                    {images.length > 0 && (
                      <span className="text-xs bg-gray-200 text-gray-700 rounded-full px-1.5 py-0.5 ml-1 hidden sm:inline-block">
                        {images.length}
                      </span>
                    )}
                  </TabsTrigger>

                  <TabsTrigger
                    value="questionnaire"
                    className="flex items-center gap-1 px-2.5 py-2 sm:gap-2 sm:px-4 sm:py-2.5 rounded-lg text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:text-primary"
                  >
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>שאלון</span>
                  </TabsTrigger>

                  {viewMode === "matchmaker" && (
                    <TabsTrigger
                      value="sensitive"
                      className="flex items-center gap-1 px-2.5 py-2 sm:gap-2 sm:px-4 sm:py-2.5 rounded-lg text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:text-amber-600 bg-amber-50/80 text-amber-700"
                    >
                      <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">מידע נוסף</span>
                      <span className="xs:hidden">מידע</span>
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>
            </ScrollArea>
          </div>

          {/* About Tab */}
          <TabsContent
            value="about"
            className="mt-2 space-y-6 sm:space-y-8 focus:outline-none"
          >
            {/* Basic Description */}
            <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-50/20 border border-blue-100/50 shadow-sm">
              <SectionHeader
                icon={User}
                title="אודות"
                iconColor="text-blue-600"
              />
              {profile.about ? (
                <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base md:text-lg leading-relaxed">
                  {profile.about}
                </p>
              ) : (
                <EmptyState icon={User} message="לא הוזן תיאור" />
              )}
            </div>

            {/* Hobbies */}
            <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-pink-50 to-pink-50/20 border border-pink-100/50 shadow-sm">
              <SectionHeader
                icon={Heart}
                title="תחביבים"
                iconColor="text-pink-600"
              />
              {profile.hobbies ? (
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                  {profile.hobbies.split(",").map((hobby, index) => (
                    <Badge
                      key={index}
                      className="px-2 py-1 sm:px-3 sm:py-1.5 bg-white text-pink-700 border border-pink-200 hover:bg-pink-50 transition-colors text-xs sm:text-sm"
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
            <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-green-50 to-green-50/20 border border-green-100/50 shadow-sm">
              <SectionHeader
                icon={Languages}
                title="שפות"
                iconColor="text-green-600"
              />
              <div className="space-y-3 sm:space-y-4 mt-2 sm:mt-3">
                {/* Native Language */}
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 border border-green-100/80">
                  <p className="text-xs sm:text-sm font-medium text-green-700 mb-1 sm:mb-2">
                    שפת אם
                  </p>
                  <p className="text-base sm:text-lg md:text-xl font-medium text-gray-800">
                    {profile.nativeLanguage || "-"}
                  </p>
                </div>

                {/* Additional Languages */}
                {profile.additionalLanguages &&
                profile.additionalLanguages.length > 0 ? (
                  <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 border border-green-100/80">
                    <p className="text-xs sm:text-sm font-medium text-green-700 mb-1 sm:mb-2">
                      שפות נוספות
                    </p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1">
                      {profile.additionalLanguages.map((lang) => (
                        <Badge
                          key={lang}
                          className="px-2 py-1 sm:px-3 sm:py-1.5 bg-green-50 text-green-700 border border-green-200 text-xs sm:text-sm"
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
            <div className="rounded-xl sm:rounded-2xl bg-white border border-indigo-100 shadow-sm overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                {/* Education */}
                <div className="p-4 sm:p-6 border-b md:border-b-0 md:border-l border-indigo-100 bg-gradient-to-br from-indigo-50 to-indigo-50/10">
                  <SectionHeader
                    icon={GraduationCap}
                    title="השכלה"
                    iconColor="text-indigo-600"
                  />

                  <div className="mt-3 sm:mt-4 space-y-4 sm:space-y-6">
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-5 border border-indigo-100">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 rounded-full bg-indigo-100 text-indigo-600">
                          <GraduationCap className="w-4 h-4 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-indigo-600 mb-0.5 sm:mb-1">
                            רמת השכלה
                          </p>
                          <p className="text-base sm:text-lg md:text-xl font-medium text-gray-800">
                            {profile.education || "לא צוין"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Employment */}
                <div className="p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-purple-50/10">
                  <SectionHeader
                    icon={Briefcase}
                    title="תעסוקה"
                    iconColor="text-purple-600"
                  />

                  <div className="mt-3 sm:mt-4 space-y-4 sm:space-y-6">
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-5 border border-purple-100">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 rounded-full bg-purple-100 text-purple-600">
                          <Briefcase className="w-4 h-4 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-purple-600 mb-0.5 sm:mb-1">
                            עיסוק נוכחי
                          </p>
                          <p className="text-base sm:text-lg md:text-xl font-medium text-gray-800">
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
            <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-purple-50/20 border border-purple-100/50 shadow-sm">
              <SectionHeader
                icon={Users}
                title="מידע משפחתי"
                iconColor="text-purple-600"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 mt-3 sm:mt-4">
                {/* Parent Status */}
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-5 border border-purple-100 transition-all hover:shadow-md">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-full bg-purple-100 text-purple-600">
                      <Users className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-purple-600 mb-0.5 sm:mb-1">
                        מצב הורים
                      </p>
                      <p className="text-base sm:text-lg md:text-xl font-medium text-gray-800">
                        {profile.parentStatus || "לא צוין"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Siblings Count */}
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-5 border border-purple-100 transition-all hover:shadow-md">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-full bg-purple-100 text-purple-600">
                      <Users className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-purple-600 mb-0.5 sm:mb-1">
                        מספר אחים/אחיות
                      </p>
                      <p className="text-base sm:text-lg md:text-xl font-medium text-gray-800">
                        {profile.siblings ?? "לא צוין"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Family Position */}
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-5 border border-purple-100 transition-all hover:shadow-md">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-full bg-purple-100 text-purple-600">
                      <Users className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-purple-600 mb-0.5 sm:mb-1">
                        מיקום במשפחה
                      </p>
                      <p className="text-base sm:text-lg md:text-xl font-medium text-gray-800">
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
            <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white border border-gray-200/50 shadow-sm">
              <SectionHeader icon={ImageIcon} title="גלריית תמונות" />

              {images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 mt-3 sm:mt-4">
                  {images.map((image, index) => (
                    <div
                      key={image.id}
                      className="relative aspect-square rounded-lg sm:rounded-xl overflow-hidden cursor-pointer group shadow-sm border border-gray-100"
                      onClick={() => handleImageClick(index)}
                    >
                      <Image
                        src={image.url}
                        alt={`תמונת פרופיל ${index + 1}`}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      {image.isMain && (
                        <div className="absolute top-1 sm:top-2 right-1 sm:right-2">
                          <Badge className="bg-amber-100 text-amber-800 border border-amber-200 shadow-sm text-xs">
                            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 fill-amber-500 text-amber-500" />
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
          <TabsContent
            value="questionnaire"
            className="mt-2 focus:outline-none"
          >
            {questionnaire ? (
              <div className="space-y-4 sm:space-y-6">
                {/* Questionnaire Status */}
                <div className="rounded-lg sm:rounded-xl p-3 sm:p-4 bg-white border shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {questionnaire.completed ? (
                      <div className="p-1.5 sm:p-2 rounded-full bg-green-100 text-green-600">
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
                  <div className="text-xs sm:text-sm text-gray-500">
                    {`${
                      questionnaire.worldsCompleted?.length || 0
                    }/5 עולמות הושלמו`}
                  </div>
                </div>

                {/* Questionnaire Content by World */}
                {Object.entries(
                  questionnaire.formattedAnswers || {
                    values: [],
                    personality: [],
                    relationship: [],
                    partner: [],
                    religion: [],
                  }
                ).map(([world, answers]) => {
                  if (answers.length === 0) return null;
                  const worldConfig = WORLDS[world as keyof typeof WORLDS];

                  return (
                    <div
                      key={world}
                      className={cn(
                        "rounded-lg sm:rounded-2xl p-4 sm:p-6 border shadow-sm transition-shadow hover:shadow-md",
                        world === "values" &&
                          "bg-gradient-to-br from-pink-50 to-pink-50/20 border-pink-100/50",
                        world === "personality" &&
                          "bg-gradient-to-br from-blue-50 to-blue-50/20 border-blue-100/50",
                        world === "relationship" &&
                          "bg-gradient-to-br from-purple-50 to-purple-50/20 border-purple-100/50",
                        world === "religion" &&
                          "bg-gradient-to-br from-indigo-50 to-indigo-50/20 border-indigo-100/50",
                        world === "partner" &&
                          "bg-gradient-to-br from-red-50 to-red-50/20 border-red-100/50"
                      )}
                    >
                      <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <h3 className="text-base sm:text-xl font-semibold flex items-center gap-1.5 sm:gap-2">
                          {worldConfig && (
                            <div
                              className={cn(
                                "p-1.5 sm:p-2 rounded-full",
                                worldConfig.color.replace("text", "bg") + "/10"
                              )}
                            >
                              <worldConfig.icon
                                className={cn(
                                  "h-4 w-4 sm:h-5 sm:w-5",
                                  worldConfig.color
                                )}
                              />
                            </div>
                          )}
                          {worldConfig?.title || world}
                        </h3>

                        <Badge
                          variant={
                            questionnaire[
                              `${world}Completed` as keyof QuestionnaireResponse
                            ]
                              ? "success"
                              : "outline"
                          }
                          className={cn(
                            "flex items-center gap-1 text-xs",
                            questionnaire[
                              `${world}Completed` as keyof QuestionnaireResponse
                            ] && "bg-green-100 text-green-800 border-0"
                          )}
                        >
                          {questionnaire[
                            `${world}Completed` as keyof QuestionnaireResponse
                          ] ? (
                            <>
                              <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              הושלם
                            </>
                          ) : (
                            <>
                              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
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
                          )
                          .map((answer) => (
                            <div
                              key={answer.questionId}
                              className={cn(
                                "bg-white rounded-lg sm:rounded-xl p-3 sm:p-5 shadow-sm border transition-shadow hover:shadow-md",
                                world === "values" && "border-pink-100",
                                world === "personality" && "border-blue-100",
                                world === "relationship" && "border-purple-100",
                                world === "religion" && "border-indigo-100",
                                world === "partner" && "border-red-100"
                              )}
                            >
                              <div className="flex justify-between items-start mb-2 sm:mb-3">
                                <p className="text-xs sm:text-sm font-medium text-gray-700 flex-1">
                                  {answer.question}
                                </p>
                                {answer.isVisible ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-primary/5 text-primary border-primary/20 text-xs py-0.5 px-1.5"
                                  >
                                    <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                                    מוצג
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="bg-gray-100 text-gray-500 border-gray-200 text-xs py-0.5 px-1.5"
                                  >
                                    <EyeOff className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                                    מוסתר
                                  </Badge>
                                )}
                              </div>
                              <div className="bg-gray-50 rounded-md sm:rounded-lg p-2.5 sm:p-4 mb-1.5 sm:mb-2">
                                <p className="text-sm sm:text-base md:text-lg font-medium text-gray-800">
                                  {answer.displayText}
                                </p>
                              </div>
                              <div className="flex justify-end">
                                <p className="text-xs text-gray-400 flex items-center">
                                  <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
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
                })}
              </div>
            ) : (
              <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white border border-gray-200/50 shadow-sm text-center">
                <div className="flex flex-col items-center justify-center py-8">
                  <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium text-gray-700 mb-2">
                    אין שאלון זמין
                  </h3>
                  <p className="text-gray-500 max-w-md">
                    המועמד/ת טרם מילא/ה את השאלון או שאין גישה לשאלון זה.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Sensitive Information Tab (Matchmakers Only) */}
          {viewMode === "matchmaker" && (
            <TabsContent value="sensitive" className="mt-2 focus:outline-none">
              <SensitiveInfo>
                {/* References */}
                {profile.referenceName1 || profile.referenceName2 ? (
                  <div className="space-y-3 sm:space-y-4 mb-5 sm:mb-8">
                    <h3 className="text-base sm:text-xl font-semibold text-amber-800 flex items-center gap-1.5 sm:gap-2">
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                      ממליצים
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {profile.referenceName1 && (
                        <div className="p-3 sm:p-5 bg-white rounded-lg sm:rounded-xl shadow-sm border border-amber-200">
                          <h4 className="font-medium mb-2 sm:mb-3 text-xs sm:text-sm text-amber-700">
                            ממליץ/ה 1
                          </h4>
                          <div className="space-y-2 sm:space-y-3">
                            <p className="flex items-center gap-1.5 sm:gap-2">
                              <div className="p-1.5 sm:p-2 rounded-full bg-amber-100">
                                <User className="w-3 h-3 sm:w-4 sm:h-4 text-amber-700" />
                              </div>
                              <span className="font-medium text-sm sm:text-base">
                                {profile.referenceName1}
                              </span>
                            </p>
                            <p className="flex items-center gap-1.5 sm:gap-2">
                              <div className="p-1.5 sm:p-2 rounded-full bg-amber-100">
                                <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-amber-700" />
                              </div>
                              <span
                                dir="ltr"
                                className="font-medium text-sm sm:text-base"
                              >
                                {profile.referencePhone1}
                              </span>
                            </p>
                          </div>
                        </div>
                      )}

                      {profile.referenceName2 && (
                        <div className="p-3 sm:p-5 bg-white rounded-lg sm:rounded-xl shadow-sm border border-amber-200">
                          <h4 className="font-medium mb-2 sm:mb-3 text-xs sm:text-sm text-amber-700">
                            ממליץ/ה 2
                          </h4>
                          <div className="space-y-2 sm:space-y-3">
                            <p className="flex items-center gap-1.5 sm:gap-2">
                              <div className="p-1.5 sm:p-2 rounded-full bg-amber-100">
                                <User className="w-3 h-3 sm:w-4 sm:h-4 text-amber-700" />
                              </div>
                              <span className="font-medium text-sm sm:text-base">
                                {profile.referenceName2}
                              </span>
                            </p>
                            <p className="flex items-center gap-1.5 sm:gap-2">
                              <div className="p-1.5 sm:p-2 rounded-full bg-amber-100">
                                <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-amber-700" />
                              </div>
                              <span
                                dir="ltr"
                                className="font-medium text-sm sm:text-base"
                              >
                                {profile.referencePhone2}
                              </span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mb-5 sm:mb-8">
                    <h3 className="text-base sm:text-xl font-semibold text-amber-800 flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                      ממליצים
                    </h3>
                    <EmptyState icon={Phone} message="לא הוזנו ממליצים" />
                  </div>
                )}

                {/* Contact Preferences */}
                <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4 mb-5 sm:mb-8">
                  <h3 className="text-base sm:text-xl font-semibold text-amber-800 flex items-center gap-1.5 sm:gap-2">
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    העדפות יצירת קשר
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="p-3 sm:p-5 bg-white rounded-lg sm:rounded-xl shadow-sm border border-amber-200">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2.5 rounded-full bg-amber-100 text-amber-700">
                          <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-amber-700 mb-0.5 sm:mb-1">
                            אופן יצירת קשר מועדף
                          </p>
                          <p className="text-sm sm:text-base md:text-lg font-medium">
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
                    <div className="p-3 sm:p-5 bg-white rounded-lg sm:rounded-xl shadow-sm border border-amber-200">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2.5 rounded-full bg-amber-100 text-amber-700">
                          <User className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-amber-700 mb-0.5 sm:mb-1">
                            העדפת מגדר שדכן/ית
                          </p>
                          <p className="text-sm sm:text-base md:text-lg font-medium">
                            {profile.preferredMatchmakerGender === "MALE"
                              ? "שדכן"
                              : profile.preferredMatchmakerGender === "FEMALE"
                              ? "שדכנית"
                              : "לא צוין"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Matching Notes */}
                {profile.matchingNotes ? (
                  <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-xl font-semibold text-amber-800 flex items-center gap-1.5 sm:gap-2">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                      הערות לשדכנים
                    </h3>
                    <div className="p-3 sm:p-5 bg-white rounded-lg sm:rounded-xl shadow-sm border border-amber-200">
                      <p className="whitespace-pre-wrap text-sm sm:text-base md:text-lg font-medium">
                        {profile.matchingNotes}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 sm:mt-6">
                    <h3 className="text-base sm:text-xl font-semibold text-amber-800 flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
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
      {selectedImageIndex !== null && (
        <Dialog
          open={selectedImageIndex !== null}
          onOpenChange={() => setSelectedImageIndex(null)}
        >
          <DialogContent className="max-w-4xl p-0 bg-black/95 backdrop-blur-sm border-none shadow-2xl overflow-hidden">
            <div className="p-2 sm:p-4 text-white">
              <DialogTitle className="text-center text-base sm:text-xl font-semibold">
                גלריית תמונות
              </DialogTitle>
            </div>
            <div className="relative h-[60vh] sm:h-[70vh] max-h-[600px] w-full overflow-hidden">
              <Image
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
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full h-8 w-8 sm:h-12 sm:w-12"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviousImage();
                  }}
                >
                  <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
                </Button>
              )}

              {selectedImageIndex < images.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full h-8 w-8 sm:h-12 sm:w-12"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                >
                  <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
                </Button>
              )}

              {/* Image Counter */}
              <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 sm:px-4 py-1 sm:py-2 rounded-full text-white text-xs sm:text-sm">
                {selectedImageIndex + 1} / {images.length}
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-1.5 sm:gap-2 p-2 sm:p-4 overflow-x-auto bg-black/90 justify-center">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className={cn(
                    "relative w-12 h-12 sm:w-16 sm:h-16 rounded-md sm:rounded-lg overflow-hidden cursor-pointer shadow-sm border-2 transition-all",
                    selectedImageIndex === index
                      ? "ring-2 ring-primary border-primary transform scale-110"
                      : "border-transparent hover:border-gray-200 opacity-70 hover:opacity-100"
                  )}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <Image
                    src={image.url}
                    alt={`תמונה ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 48px, 64px"
                  />
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};

export default ProfileCard;
