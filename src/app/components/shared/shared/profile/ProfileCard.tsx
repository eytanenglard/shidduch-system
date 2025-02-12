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
      <div className="relative border-2 border-yellow-400 rounded-xl p-6 bg-yellow-50/50">
        <div className="flex items-center gap-2 mb-4 text-yellow-700">
          <Lock className="w-5 h-5" />
          <span className="font-medium">מידע לשדכנים בלבד</span>
        </div>
        {children}
      </div>
    );
  };

  return (
    <Card
      className={cn(
        "w-full bg-white shadow-xl rounded-xl overflow-hidden",
        className
      )}
    >
      {/* Header Section */}
      <div className="bg-gradient-to-b from-white to-gray-50 p-6 text-center">
        <div className="space-y-4">
          {/* Name and Basic Info */}
          <div>
            <h2 className="text-3xl font-serif font-semibold text-gray-900">
              {profile?.user?.firstName} {profile?.user?.lastName}
            </h2>
            <p className="text-gray-600 mt-1">
              {age} שנים | {profile.city}
            </p>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2 justify-center">
            {profile.isProfileVisible && (
              <Badge className="bg-green-100 text-green-800">
                פנוי/ה להצעות
              </Badge>
            )}
            {profile.religiousLevel && (
              <Badge variant="secondary">{profile.religiousLevel}</Badge>
            )}
            {profile.maritalStatus && (
              <Badge variant="secondary">{profile.maritalStatus}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Image Section */}
      <div className="relative bg-gradient-to-r from-gray-50 to-white p-6">
        <div className="flex justify-center gap-4">
          {/* Main Large Image */}
          <div
            className="relative w-64 h-80 rounded-xl overflow-hidden bg-gray-100 shadow-lg cursor-pointer"
            onClick={() =>
              mainImage &&
              handleImageClick(
                images.findIndex((img) => img.id === mainImage.id)
              )
            }
          >
            {mainImage ? (
              <Image
                src={mainImage.url}
                alt="תמונת פרופיל ראשית"
                fill
                className="object-cover"
                sizes="256px"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-16 h-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          <div className="flex flex-col gap-2">
            {(images ?? []).slice(1, 4).map((image, index) => (
              <div
                key={image.id}
                className="relative w-20 h-20 rounded-lg overflow-hidden bg-white shadow-sm cursor-pointer 
                                         hover:opacity-90 transition-opacity"
                onClick={() => handleImageClick(index + 1)}
              >
                <Image
                  src={image.url}
                  alt={`תמונת פרופיל ${index + 2}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50">
        {/* Age */}
        <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
          <Calendar className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm text-gray-500">גיל</p>
            <p className="font-medium">{age}</p>
          </div>
        </div>

        {/* Marital Status */}
        <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
          <Heart className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm text-gray-500">מצב משפחתי</p>
            <p className="font-medium">{profile.maritalStatus || "-"}</p>
          </div>
        </div>

        {/* Education */}
        <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
          <School className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm text-gray-500">השכלה</p>
            <p className="font-medium">{profile.education || "-"}</p>
          </div>
        </div>

        {/* Native Language */}
        <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
          <Languages className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm text-gray-500">שפת אם</p>
            <p className="font-medium">{profile.nativeLanguage || "-"}</p>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <ScrollArea className="w-full" dir="rtl">
            <TabsList className="w-full justify-start inline-flex p-1">
              <TabsTrigger value="about" className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                <span>אודות</span>
              </TabsTrigger>

              <TabsTrigger
                value="education"
                className="flex items-center gap-2"
              >
                <GraduationCap className="w-4 h-4" />
                <span>השכלה ותעסוקה</span>
              </TabsTrigger>

              <TabsTrigger value="family" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>משפחה</span>
              </TabsTrigger>

              <TabsTrigger value="photos" className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                <span>תמונות</span>
                {images.length > 0 && (
                  <span className="text-xs">({images.length})</span>
                )}
              </TabsTrigger>

              {questionnaire && (
                <TabsTrigger
                  value="questionnaire"
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>שאלון</span>
                </TabsTrigger>
              )}

              {viewMode === "matchmaker" && (
                <TabsTrigger
                  value="sensitive"
                  className="flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>מידע נוסף</span>
                </TabsTrigger>
              )}
            </TabsList>
          </ScrollArea>

          {/* About Tab */}
          <TabsContent value="about" className="mt-6">
            <div className="space-y-6">
              {/* Basic Description */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  אודות
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {profile.about || "לא הוזן תיאור"}
                </p>
              </div>

              {/* Hobbies */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  תחביבים
                </h3>
                <p className="text-gray-700">
                  {profile.hobbies || "לא הוזנו תחביבים"}
                </p>
              </div>

              {/* Languages */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Languages className="w-5 h-5" />
                  שפות
                </h3>
                <div className="space-y-4">
                  {/* Native Language */}
                  <div>
                    <p className="text-sm text-gray-500">שפת אם</p>
                    <p className="font-medium mt-1">
                      {profile.nativeLanguage || "-"}
                    </p>
                  </div>

                  {/* Additional Languages */}
                  {profile.additionalLanguages &&
                    profile.additionalLanguages.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500">שפות נוספות</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {profile.additionalLanguages.map((lang) => (
                            <Badge key={lang} variant="secondary">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Education & Employment Tab */}
          <TabsContent value="education" className="mt-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Education */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    השכלה
                  </h3>
                  <div className="p-4 bg-white rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500">רמת השכלה</p>
                    <p className="font-medium mt-1">
                      {profile.education || "-"}
                    </p>
                  </div>
                </div>

                {/* Employment */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    תעסוקה
                  </h3>
                  <div className="p-4 bg-white rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500">עיסוק נוכחי</p>
                    <p className="font-medium mt-1">
                      {profile.occupation || "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Family Tab */}
          <TabsContent value="family" className="mt-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Users className="w-5 h-5" />
                מידע משפחתי
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-sm text-gray-500">מצב הורים</p>
                  <p className="font-medium mt-1">
                    {profile.parentStatus || "-"}
                  </p>
                </div>

                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-sm text-gray-500">מספר אחים/אחיות</p>
                  <p className="font-medium mt-1">{profile.siblings || "-"}</p>
                </div>

                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-sm text-gray-500">מיקום במשפחה</p>
                  <p className="font-medium mt-1">{profile.position || "-"}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="mt-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                גלריית תמונות
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                    onClick={() => handleImageClick(index)}
                  >
                    <Image
                      src={image.url}
                      alt={`תמונת פרופיל ${index + 1}`}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                    {image.isMain && (
                      <Badge className="absolute top-2 right-2 bg-white/90">
                        ראשי
                      </Badge>
                    )}
                  </div>
                ))}
                {images.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-12">
                    <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                    <p className="text-gray-500">לא הועלו תמונות</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Questionnaire Tab */}
          {questionnaire && (
            <TabsContent value="questionnaire" className="mt-6">
              <div className="bg-gray-50 rounded-xl p-6">
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
                      <div key={world} className="space-y-4">
                        <h3 className="text-xl font-semibold flex items-center gap-2">
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
                                className="bg-white rounded-lg p-4 shadow-sm"
                              >
                                <p className="text-sm text-gray-500 mb-2">
                                  {answer.question}
                                </p>
                                <p className="text-gray-800">
                                  {answer.displayText}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {new Date(
                                    answer.answeredAt
                                  ).toLocaleDateString("he-IL")}
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          )}

          {/* Sensitive Information Tab (Matchmakers Only) */}
          {viewMode === "matchmaker" && (
            <TabsContent value="sensitive" className="mt-6">
              <SensitiveInfo>
                {/* References */}
                {(profile.referenceName1 || profile.referenceName2) && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-yellow-900 flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      ממליצים
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.referenceName1 && (
                        <div className="p-4 bg-white/80 rounded-lg">
                          <h4 className="font-medium mb-2">ממליץ/ה 1</h4>
                          <div className="space-y-2">
                            <p className="flex items-center gap-2">
                              <User className="w-4 h-4 text-yellow-700" />
                              <span>{profile.referenceName1}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-yellow-700" />
                              <span dir="ltr">{profile.referencePhone1}</span>
                            </p>
                          </div>
                        </div>
                      )}

                      {profile.referenceName2 && (
                        <div className="p-4 bg-white/80 rounded-lg">
                          <h4 className="font-medium mb-2">ממליץ/ה 2</h4>
                          <div className="space-y-2">
                            <p className="flex items-center gap-2">
                              <User className="w-4 h-4 text-yellow-700" />
                              <span>{profile.referenceName2}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-yellow-700" />
                              <span dir="ltr">{profile.referencePhone2}</span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Preferences */}
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-semibold text-yellow-900 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    העדפות יצירת קשר
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/80 rounded-lg">
                      <p className="text-sm text-yellow-800 mb-1">
                        אופן יצירת קשר מועדף
                      </p>
                      <p>
                        {profile.contactPreference === "direct"
                          ? "ישירות"
                          : profile.contactPreference === "matchmaker"
                          ? "דרך השדכן/ית"
                          : profile.contactPreference === "both"
                          ? "שתי האפשרויות"
                          : "לא צוין"}
                      </p>
                    </div>
                    <div className="p-4 bg-white/80 rounded-lg">
                      <p className="text-sm text-yellow-800 mb-1">
                        העדפת מגדר שדכן/ית
                      </p>
                      <p>
                        {profile.preferredMatchmakerGender === "MALE"
                          ? "שדכן"
                          : profile.preferredMatchmakerGender === "FEMALE"
                          ? "שדכנית"
                          : "לא צוין"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Matching Notes */}
                {profile.matchingNotes && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-semibold text-yellow-900 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      הערות לשדכנים
                    </h3>
                    <div className="p-4 bg-white/80 rounded-lg">
                      <p className="whitespace-pre-wrap">
                        {profile.matchingNotes}
                      </p>
                    </div>
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
          <DialogContent className="max-w-4xl p-4">
            <DialogTitle className="text-center">תצוגת תמונות</DialogTitle>
            <div className="relative h-[500px] w-full">
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
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}

              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 px-3 py-1 rounded-full">
                {selectedImageIndex + 1} / {images.length}
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 mt-4 overflow-x-auto p-2">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className={cn(
                    "relative w-16 h-16 rounded-lg overflow-hidden cursor-pointer",
                    selectedImageIndex === index && "ring-2 ring-primary"
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
