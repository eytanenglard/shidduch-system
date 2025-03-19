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
      <div className="relative border border-amber-300 rounded-xl p-6 bg-gradient-to-br from-amber-50 to-white shadow-inner">
        <div className="flex items-center gap-2 mb-4 text-amber-700">
          <Lock className="w-5 h-5" />
          <span className="font-medium">מידע לשדכנים בלבד</span>
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
    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
      <Icon className="w-12 h-12 mb-3 opacity-50" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );

  // Section header component
  const SectionHeader: React.FC<{
    icon: React.ElementType;
    title: string;
    iconColor?: string;
  }> = ({ icon: Icon, title, iconColor = "text-primary" }) => (
    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
      <Icon className={cn("w-5 h-5", iconColor)} />
      <span>{title}</span>
    </h3>
  );

  return (
    <Card
      className={cn(
        "w-full bg-white shadow-xl rounded-xl overflow-hidden border-0",
        className
      )}
    >
      {/* Header Section with Gradient Background */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-8 text-center relative overflow-hidden">
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
        <div className="relative z-10 space-y-5">
          {/* Name and Basic Info */}
          <div>
            <h2 className="text-3xl font-serif font-bold text-gray-800 mb-1">
              {profile?.user?.firstName} {profile?.user?.lastName}
            </h2>
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-blue-500" />
                {age} שנים
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-red-500" />
                {profile.city}
              </span>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2 justify-center">
            {profile.isProfileVisible && (
              <Badge className="bg-emerald-100 text-emerald-800 border-0 px-3 py-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  פנוי/ה להצעות
                </div>
              </Badge>
            )}
            {profile.religiousLevel && (
              <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 px-3 py-1">
                <Shield className="w-3.5 h-3.5 mr-1" />
                {profile.religiousLevel}
              </Badge>
            )}
            {profile.maritalStatus && (
              <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700 px-3 py-1">
                <Heart className="w-3.5 h-3.5 mr-1" />
                {profile.maritalStatus}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Image and Thumbnails Section */}
      <div className="bg-gradient-to-b from-white to-gray-50 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-center gap-6 max-w-3xl mx-auto">
          {/* Main Large Image */}
          <div
            className="relative w-full sm:w-72 h-96 rounded-2xl overflow-hidden bg-gray-100 shadow-lg cursor-pointer transition-transform hover:scale-[1.02] duration-300 group"
            onClick={() =>
              mainImage &&
              handleImageClick(
                images.findIndex((img) => img.id === mainImage.id)
              )
            }
          >
            {mainImage ? (
              <>
                <Image
                  src={mainImage.url}
                  alt="תמונת פרופיל ראשית"
                  fill
                  className="object-cover transition-all duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 288px"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-3 left-3 bg-white/90 rounded-full px-2 py-1 text-xs font-medium shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  תמונה ראשית
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <User className="w-20 h-20 text-gray-300 mb-4" />
                <p className="text-gray-400 text-sm">אין תמונה ראשית</p>
              </div>
            )}
          </div>

          {/* Thumbnails Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-1 gap-2">
            {images.slice(0, 6).map((image, index) => {
              // Skip the main image
              if (image.isMain) return null;
              
              return (
                <div
                  key={image.id}
                  className="relative w-full h-24 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-white shadow-sm cursor-pointer 
                           hover:opacity-90 transition-all duration-300 hover:shadow-md"
                  onClick={() => handleImageClick(images.findIndex(img => img.id === image.id))}
                >
                  <Image
                    src={image.url}
                    alt={`תמונת פרופיל ${index + 2}`}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
              );
            })}
            
            {/* Show more button if there are more than 6 images */}
            {images.length > 7 && (
              <div 
                className="relative w-full h-24 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-black/10 
                        cursor-pointer hover:bg-black/20 transition-colors duration-300 flex items-center justify-center"
                onClick={() => setActiveTab("photos")}
              >
                <div className="text-center text-gray-700">
                  <span className="block text-lg font-bold">+{images.length - 6}</span>
                  <span className="text-xs">תמונות</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid with Improved Layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-6 bg-white border-t border-b border-gray-100">
        {/* Age */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100">
          <div className="p-2.5 rounded-full bg-blue-100 text-blue-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-blue-600 mb-0.5">גיל</p>
            <p className="text-lg font-semibold text-gray-800">{age}</p>
          </div>
        </div>

        {/* Marital Status */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-pink-50 to-white border border-pink-100">
          <div className="p-2.5 rounded-full bg-pink-100 text-pink-600">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-pink-600 mb-0.5">מצב משפחתי</p>
            <p className="text-lg font-semibold text-gray-800">{profile.maritalStatus || "-"}</p>
          </div>
        </div>

        {/* Education */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100">
          <div className="p-2.5 rounded-full bg-indigo-100 text-indigo-600">
            <School className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-indigo-600 mb-0.5">השכלה</p>
            <p className="text-lg font-semibold text-gray-800">{profile.education || "-"}</p>
          </div>
        </div>

        {/* Native Language */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100">
          <div className="p-2.5 rounded-full bg-emerald-100 text-emerald-600">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-emerald-600 mb-0.5">שפת אם</p>
            <p className="text-lg font-semibold text-gray-800">{profile.nativeLanguage || "-"}</p>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation with Improved Styling */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <ScrollArea className="w-full mb-6" dir="rtl">
            <TabsList className="w-full justify-start inline-flex p-1.5 bg-gray-100/80 rounded-xl">
              <TabsTrigger 
                value="about" 
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:text-primary"
              >
                <Info className="w-4 h-4" />
                <span>אודות</span>
              </TabsTrigger>

              <TabsTrigger
                value="education"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:text-primary"
              >
                <GraduationCap className="w-4 h-4" />
                <span>השכלה ותעסוקה</span>
              </TabsTrigger>

              <TabsTrigger 
                value="family" 
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:text-primary"
              >
                <Users className="w-4 h-4" />
                <span>משפחה</span>
              </TabsTrigger>

              <TabsTrigger 
                value="photos" 
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:text-primary"
              >
                <ImageIcon className="w-4 h-4" />
                <span>תמונות</span>
                {images.length > 0 && (
                  <span className="text-xs bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 ml-1">
                    {images.length}
                  </span>
                )}
              </TabsTrigger>

              {questionnaire && (
                <TabsTrigger
                  value="questionnaire"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:text-primary"
                >
                  <FileText className="w-4 h-4" />
                  <span>שאלון</span>
                </TabsTrigger>
              )}

              {viewMode === "matchmaker" && (
                <TabsTrigger
                  value="sensitive"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:text-amber-600 bg-amber-50/80 text-amber-700"
                >
                  <Lock className="w-4 h-4" />
                  <span>מידע נוסף</span>
                </TabsTrigger>
              )}
            </TabsList>
          </ScrollArea>

          {/* About Tab */}
          <TabsContent value="about" className="mt-2 space-y-8 focus:outline-none">
            {/* Basic Description */}
            <div className="rounded-2xl p-6 bg-gradient-to-br from-blue-50 to-blue-50/20 border border-blue-100/50">
              <SectionHeader icon={User} title="אודות" iconColor="text-blue-600" />
              {profile.about ? (
                <p className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">
                  {profile.about}
                </p>
              ) : (
                <EmptyState icon={User} message="לא הוזן תיאור" />
              )}
            </div>

            {/* Hobbies */}
            <div className="rounded-2xl p-6 bg-gradient-to-br from-pink-50 to-pink-50/20 border border-pink-100/50">
              <SectionHeader icon={Heart} title="תחביבים" iconColor="text-pink-600" />
              {profile.hobbies ? (
                <div className="flex flex-wrap gap-2 mt-3">
                  {profile.hobbies.split(',').map((hobby, index) => (
                    <Badge 
                      key={index} 
                      className="px-3 py-1.5 bg-white text-pink-700 border border-pink-200 hover:bg-pink-50 transition-colors"
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
            <div className="rounded-2xl p-6 bg-gradient-to-br from-green-50 to-green-50/20 border border-green-100/50">
              <SectionHeader icon={Languages} title="שפות" iconColor="text-green-600" />
              <div className="space-y-6 mt-3">
                {/* Native Language */}
                <div className="bg-white rounded-xl shadow-sm p-4 border border-green-100/80">
                  <p className="text-sm font-medium text-green-700 mb-2">שפת אם</p>
                  <p className="text-xl font-medium text-gray-800">
                    {profile.nativeLanguage || "-"}
                  </p>
                </div>

                {/* Additional Languages */}
                {profile.additionalLanguages && profile.additionalLanguages.length > 0 ? (
                  <div className="bg-white rounded-xl shadow-sm p-4 border border-green-100/80">
                    <p className="text-sm font-medium text-green-700 mb-2">שפות נוספות</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {profile.additionalLanguages.map((lang) => (
                        <Badge 
                          key={lang} 
                          className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200"
                        >
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/80 rounded-xl p-4 text-center text-gray-500 border border-gray-100">
                    לא הוזנו שפות נוספות
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Education & Employment Tab */}
          <TabsContent value="education" className="mt-2 space-y-8 focus:outline-none">
            <div className="rounded-2xl bg-white border border-indigo-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                {/* Education */}
                <div className="p-6 border-b md:border-b-0 md:border-l border-indigo-100 bg-gradient-to-br from-indigo-50 to-indigo-50/10">
                  <SectionHeader icon={GraduationCap} title="השכלה" iconColor="text-indigo-600" />
                  
                  <div className="mt-4 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-indigo-100">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                          <GraduationCap className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-indigo-600 mb-1">רמת השכלה</p>
                          <p className="text-xl font-medium text-gray-800">
                            {profile.education || "לא צוין"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Employment */}
                <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-50/10">
                  <SectionHeader icon={Briefcase} title="תעסוקה" iconColor="text-purple-600" />
                  
                  <div className="mt-4 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-purple-100">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                          <Briefcase className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-purple-600 mb-1">עיסוק נוכחי</p>
                          <p className="text-xl font-medium text-gray-800">
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
            <div className="rounded-2xl p-6 bg-gradient-to-br from-purple-50 to-purple-50/20 border border-purple-100/50">
              <SectionHeader icon={Users} title="מידע משפחתי" iconColor="text-purple-600" />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
                {/* Parent Status */}
                <div className="bg-white rounded-xl shadow-sm p-5 border border-purple-100 transition-all hover:shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-600 mb-1">מצב הורים</p>
                      <p className="text-xl font-medium text-gray-800">
                        {profile.parentStatus || "לא צוין"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Siblings Count */}
                <div className="bg-white rounded-xl shadow-sm p-5 border border-purple-100 transition-all hover:shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-600 mb-1">מספר אחים/אחיות</p>
                      <p className="text-xl font-medium text-gray-800">
                        {profile.siblings || "לא צוין"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Family Position */}
                <div className="bg-white rounded-xl shadow-sm p-5 border border-purple-100 transition-all hover:shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-600 mb-1">מיקום במשפחה</p>
                      <p className="text-xl font-medium text-gray-800">
                        {profile.position || "לא צוין"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="mt-2 focus:outline-none">
            <div className="rounded-2xl p-6 bg-gradient-to-br from-gray-50 to-white border border-gray-200/50">
              <SectionHeader icon={ImageIcon} title="גלריית תמונות" />
              
              {images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                  {images.map((image, index) => (
                    <div
                      key={image.id}
                      className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group shadow-sm border border-gray-100"
                      onClick={() => handleImageClick(index)}
                    >
                      <Image
                        src={image.url}
                        alt={`תמונת פרופיל ${index + 1}`}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      {image.isMain && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-amber-100 text-amber-800 border border-amber-200 shadow-sm">
                            <Star className="w-3 h-3 mr-1 fill-amber-500 text-amber-500" />
                            ראשי
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  icon={ImageIcon} 
                  message="לא הועלו תמונות" 
                />
              )}
            </div>
          </TabsContent>

          {/* Questionnaire Tab */}
          {questionnaire && (
            <TabsContent value="questionnaire" className="mt-2 focus:outline-none">
              <div className="space-y-8">
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
                        "rounded-2xl p-6 border",
                        world === "values" && "bg-gradient-to-br from-pink-50 to-pink-50/20 border-pink-100/50",
                        world === "personality" && "bg-gradient-to-br from-blue-50 to-blue-50/20 border-blue-100/50",
                        world === "relationship" && "bg-gradient-to-br from-purple-50 to-purple-50/20 border-purple-100/50",
                        world === "religion" && "bg-gradient-to-br from-indigo-50 to-indigo-50/20 border-indigo-100/50",
                        world === "partner" && "bg-gradient-to-br from-red-50 to-red-50/20 border-red-100/50",
                      )}
                    >
                      <h3 className="text-xl font-semibold flex items-center gap-2 mb-6">
                        {worldConfig && (
                          <worldConfig.icon
                            className={cn("h-5 w-5", worldConfig.color)}
                          />
                        )}
                        {worldConfig?.title || world}
                      </h3>

                      <div className="grid gap-4">
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
                                "bg-white rounded-xl p-5 shadow-sm border transition-shadow hover:shadow-md",
                                world === "values" && "border-pink-100",
                                world === "personality" && "border-blue-100",
                                world === "relationship" && "border-purple-100",
                                world === "religion" && "border-indigo-100",
                                world === "partner" && "border-red-100",
                              )}
                            >
                              <p className="text-sm font-medium mb-2 text-gray-500">
                                {answer.question}
                              </p>
                              <p className="text-lg font-medium text-gray-800">
                                {answer.displayText}
                              </p>
                              <div className="flex justify-end mt-3">
                                <p className="text-xs text-gray-400 flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {new Date(answer.answeredAt).toLocaleDateString("he-IL")}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          )}

          {/* Sensitive Information Tab (Matchmakers Only) */}
          {viewMode === "matchmaker" && (
            <TabsContent value="sensitive" className="mt-2 focus:outline-none">
              <SensitiveInfo>
                {/* References */}
                {(profile.referenceName1 || profile.referenceName2) ? (
                  <div className="space-y-4 mb-8">
                    <h3 className="text-xl font-semibold text-amber-800 flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      ממליצים
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.referenceName1 && (
                        <div className="p-5 bg-white rounded-xl shadow-sm border border-amber-200">
                          <h4 className="font-medium mb-3 text-amber-700">ממליץ/ה 1</h4>
                          <div className="space-y-3">
                            <p className="flex items-center gap-2">
                              <div className="p-2 rounded-full bg-amber-100">
                                <User className="w-4 h-4 text-amber-700" />
                              </div>
                              <span className="font-medium">{profile.referenceName1}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <div className="p-2 rounded-full bg-amber-100">
                                <Phone className="w-4 h-4 text-amber-700" />
                              </div>
                              <span dir="ltr" className="font-medium">{profile.referencePhone1}</span>
                            </p>
                          </div>
                        </div>
                      )}

                      {profile.referenceName2 && (
                        <div className="p-5 bg-white rounded-xl shadow-sm border border-amber-200">
                          <h4 className="font-medium mb-3 text-amber-700">ממליץ/ה 2</h4>
                          <div className="space-y-3">
                            <p className="flex items-center gap-2">
                              <div className="p-2 rounded-full bg-amber-100">
                                <User className="w-4 h-4 text-amber-700" />
                              </div>
                              <span className="font-medium">{profile.referenceName2}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <div className="p-2 rounded-full bg-amber-100">
                                <Phone className="w-4 h-4 text-amber-700" />
                              </div>
                              <span dir="ltr" className="font-medium">{profile.referencePhone2}</span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-amber-800 flex items-center gap-2 mb-4">
                      <Phone className="w-5 h-5" />
                      ממליצים
                    </h3>
                    <EmptyState icon={Phone} message="לא הוזנו ממליצים" />
                  </div>
                )}

                {/* Contact Preferences */}
                <div className="mt-6 space-y-4 mb-8">
                  <h3 className="text-xl font-semibold text-amber-800 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    העדפות יצירת קשר
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 bg-white rounded-xl shadow-sm border border-amber-200">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-full bg-amber-100 text-amber-700">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-amber-700 mb-1">
                            אופן יצירת קשר מועדף
                          </p>
                          <p className="text-lg font-medium">
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
                    <div className="p-5 bg-white rounded-xl shadow-sm border border-amber-200">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-full bg-amber-100 text-amber-700">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-amber-700 mb-1">
                            העדפת מגדר שדכן/ית
                          </p>
                          <p className="text-lg font-medium">
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
                  <div className="mt-6 space-y-4">
                    <h3 className="text-xl font-semibold text-amber-800 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      הערות לשדכנים
                    </h3>
                    <div className="p-5 bg-white rounded-xl shadow-sm border border-amber-200">
                      <p className="whitespace-pre-wrap text-lg font-medium">
                        {profile.matchingNotes}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold text-amber-800 flex items-center gap-2 mb-4">
                      <FileText className="w-5 h-5" />
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
          <DialogContent className="max-w-4xl p-6 bg-white/95 backdrop-blur-sm border-none shadow-2xl">
            <DialogTitle className="text-center text-xl font-semibold mb-4">גלריית תמונות</DialogTitle>
            <div className="relative h-[70vh] max-h-[600px] w-full bg-gray-50 rounded-xl overflow-hidden">
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full h-12 w-12 shadow-md"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviousImage();
                  }}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}

              {selectedImageIndex < images.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full h-12 w-12 shadow-md"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}

              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 px-4 py-2 rounded-full shadow-md">
                {selectedImageIndex + 1} / {images.length}
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 mt-6 overflow-x-auto p-2 justify-center">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className={cn(
                    "relative w-16 h-16 rounded-lg overflow-hidden cursor-pointer shadow-sm border-2 transition-all",
                    selectedImageIndex === index 
                      ? "ring-2 ring-primary border-primary transform scale-110"
                      : "border-transparent hover:border-gray-200"
                  )}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <Image
                    src={image.url}
                    alt={`תמונה ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
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