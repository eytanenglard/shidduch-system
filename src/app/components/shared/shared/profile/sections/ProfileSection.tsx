"use client";

import React, { useState, useEffect } from "react";
import { Gender, AvailabilityStatus } from "@prisma/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Pencil, Save, X } from "lucide-react";
import { UserProfile } from "@/types/next-auth";

const languageOptions = [
  // שפות נפוצות
  { value: "hebrew", label: "עברית" },
  { value: "english", label: "אנגלית" },
  { value: "yiddish", label: "יידיש" },
  { value: "russian", label: "רוסית" },
  { value: "arabic", label: "ערבית" },
  { value: "french", label: "צרפתית" },
  // שאר השפות לפי א-ב
  { value: "amharic", label: "אמהרית" },
  { value: "italian", label: "איטלקית" },
  { value: "ukrainian", label: "אוקראינית" },
  { value: "spanish", label: "ספרדית" },
  { value: "portuguese", label: "פורטוגזית" },
  { value: "persian", label: "פרסית" },
  { value: "polish", label: "פולנית" },
  { value: "chinese", label: "סינית" },
  { value: "german", label: "גרמנית" },
  { value: "georgian", label: "גאורגית" },
  { value: "dutch", label: "הולנדית" },
  { value: "hungarian", label: "הונגרית" },
  { value: "turkish", label: "טורקית" },
  { value: "ladino", label: "לדינו" },
  { value: "romanian", label: "רומנית" },
];

interface ProfileSectionProps {
  profile: UserProfile | null;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  viewOnly?: boolean;
  onSave: (data: Partial<UserProfile>) => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
  profile,
  isEditing,
  setIsEditing,
  viewOnly = false,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<Partial<UserProfile>>({});

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      const data = await response.json();
      if (data.success && data.profile) {
        const profileData = {
          gender: data.profile.gender || "",
          birthDate: data.profile.birthDate || null,
          nativeLanguage: data.profile.nativeLanguage || "",
          additionalLanguages: data.profile.additionalLanguages || [],
          height: data.profile.height || "",
          maritalStatus: data.profile.maritalStatus || "",
          occupation: data.profile.occupation || "",
          education: data.profile.education || "",
          religiousLevel: data.profile.religiousLevel || "",
          address: data.profile.address || "",
          city: data.profile.city || "",
          origin: data.profile.origin || "",
          parentStatus: data.profile.parentStatus || "",
          siblings: data.profile.siblings || "",
          position: data.profile.position || "",
          referenceName1: data.profile.referenceName1 || "",
          referencePhone1: data.profile.referencePhone1 || "",
          referenceName2: data.profile.referenceName2 || "",
          referencePhone2: data.profile.referencePhone2 || "",
          isProfileVisible: data.profile.isProfileVisible ?? true,
          preferredMatchmakerGender:
            data.profile.preferredMatchmakerGender || "",
          availabilityStatus: data.profile.availabilityStatus || "AVAILABLE",
          availabilityNote: data.profile.availabilityNote || "",
          about: data.profile.about || "",
          hobbies: data.profile.hobbies || "",
        };
        setFormData(profileData);
        setInitialData(profileData);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // טעינה ראשונית של הפרופיל מה-API
  useEffect(() => {
    fetchProfile();
  }, []); // ריק - רץ פעם אחת בטעינה הראשונית

  // עדכון נתונים כאשר ה-prop profile משתנה
  useEffect(() => {
    if (profile) {
      setFormData((prevFormData) => {
        const mergedData = {
          ...prevFormData,
          ...profile,
          gender: profile.gender || prevFormData.gender || "",
          birthDate: profile.birthDate || prevFormData.birthDate || null,
          nativeLanguage:
            profile.nativeLanguage || prevFormData.nativeLanguage || "",
          additionalLanguages:
            profile.additionalLanguages ||
            prevFormData.additionalLanguages ||
            [],
          height: profile.height || prevFormData.height || "",
          maritalStatus:
            profile.maritalStatus || prevFormData.maritalStatus || "",
          occupation: profile.occupation || prevFormData.occupation || "",
          education: profile.education || prevFormData.education || "",
          religiousLevel:
            profile.religiousLevel || prevFormData.religiousLevel || "",
          address: profile.address || prevFormData.address || "",
          city: profile.city || prevFormData.city || "",
          origin: profile.origin || prevFormData.origin || "",
          parentStatus: profile.parentStatus || prevFormData.parentStatus || "",
          siblings: profile.siblings || prevFormData.siblings || "",
          position: profile.position || prevFormData.position || "",
          referenceName1:
            profile.referenceName1 || prevFormData.referenceName1 || "",
          referencePhone1:
            profile.referencePhone1 || prevFormData.referencePhone1 || "",
          referenceName2:
            profile.referenceName2 || prevFormData.referenceName2 || "",
          referencePhone2:
            profile.referencePhone2 || prevFormData.referencePhone2 || "",
          isProfileVisible:
            profile.isProfileVisible ?? prevFormData.isProfileVisible ?? true,
          preferredMatchmakerGender:
            profile.preferredMatchmakerGender ||
            prevFormData.preferredMatchmakerGender ||
            "",
          availabilityStatus:
            profile.availabilityStatus ||
            prevFormData.availabilityStatus ||
            "AVAILABLE",
          availabilityNote:
            profile.availabilityNote || prevFormData.availabilityNote || "",
          about: profile.about || prevFormData.about || "",
          hobbies: profile.hobbies || prevFormData.hobbies || "",
        };
        setInitialData((prevInitial) => {
          if (JSON.stringify(prevInitial) !== JSON.stringify(mergedData)) {
            return mergedData;
          }
          return prevInitial;
        });
        return mergedData;
      });
    }
  }, [profile]);

  const handleChange = (
    field: keyof UserProfile,
    value: UserProfile[keyof UserProfile]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    onSave(formData);
    setIsEditing(false);
    setInitialData(formData);
  };

  const handleCancel = () => {
    setFormData(() => ({
      ...initialData,
      ...profile,
    }));
    setIsEditing(false);
  };

  if (loading) {
    return <div className="text-center p-4">טוען...</div>;
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">פרופיל משתמש</h1>
              <p className="text-sm text-muted-foreground">
                נהל את פרטי הפרופיל שלך
              </p>
            </div>
            {!viewOnly && (
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="shadow-sm hover:shadow-md transition-shadow"
                  >
                    <Pencil className="w-4 h-4 ml-2" />
                    עריכה
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="shadow-sm hover:shadow-md transition-shadow"
                    >
                      <X className="w-4 h-4 ml-2" />
                      ביטול
                    </Button>
                    <Button
                      variant="default"
                      onClick={handleSave}
                      className="shadow-sm hover:shadow-md transition-shadow"
                    >
                      <Save className="w-4 h-4 ml-2" />
                      שמירה
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-6 space-y-6">
        {/* כרטיס פרטים אישיים */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">פרטים אישיים</CardTitle>
            <CardDescription>מידע בסיסי על המועמד</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* שדות קיימים */}
              <div>
                <Label>מגדר</Label>
                <Select
                  value={formData.gender || ""}
                  onValueChange={(value) =>
                    handleChange("gender", value as Gender)
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר מגדר" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">זכר</SelectItem>
                    <SelectItem value="FEMALE">נקבה</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>תאריך לידה</Label>
                <Input
                  type="date"
                  value={
                    formData.birthDate
                      ? new Date(formData.birthDate).toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    handleChange("birthDate", new Date(e.target.value))
                  }
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>שפת אם</Label>
                <Select
                  value={formData.nativeLanguage || ""}
                  onValueChange={(value) =>
                    handleChange("nativeLanguage", value)
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר שפת אם" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <div className="sticky top-0 p-2 bg-white border-b">
                      <Input placeholder="חפש שפה..." className="w-full" />
                    </div>
                    {languageOptions.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>שפות נוספות</Label>
                <Select
                  value={formData.additionalLanguages?.[0] || ""}
                  onValueChange={(value) => {
                    const currentLanguages = formData.additionalLanguages || [];
                    let newLanguages;

                    if (currentLanguages.includes(value)) {
                      newLanguages = currentLanguages.filter(
                        (lang) => lang !== value
                      );
                    } else {
                      newLanguages = [...currentLanguages, value];
                    }

                    handleChange("additionalLanguages", newLanguages);
                  }}
                  disabled={!isEditing}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר שפות נוספות" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    {languageOptions.map((lang) => (
                      <SelectItem
                        key={lang.value}
                        value={lang.value}
                        className={
                          formData.additionalLanguages?.includes(lang.value)
                            ? "bg-gray-100"
                            : ""
                        }
                      >
                        {lang.label}
                        {formData.additionalLanguages?.includes(lang.value) &&
                          " ✓"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(formData.additionalLanguages || []).map((langValue) => {
                    const lang = languageOptions.find(
                      (l) => l.value === langValue
                    );
                    return lang ? (
                      <span
                        key={lang.value}
                        className="bg-gray-100 px-2 py-1 rounded-md text-sm"
                      >
                        {lang.label}
                        {!isEditing ? null : (
                          <button
                            onClick={() => {
                              const newLanguages =
                                formData.additionalLanguages?.filter(
                                  (l) => l !== langValue
                                ) || [];
                              handleChange("additionalLanguages", newLanguages);
                            }}
                            className="ml-2 text-gray-500 hover:text-gray-700"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
              <div>
                <Label>גובה</Label>
                <Input
                  type="number"
                  value={formData.height || ""}
                  onChange={(e) =>
                    handleChange("height", parseInt(e.target.value))
                  }
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>מצב משפחתי</Label>
                <Select
                  value={formData.maritalStatus || ""}
                  onValueChange={(value) =>
                    handleChange("maritalStatus", value)
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר מצב משפחתי" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">רווק/ה</SelectItem>
                    <SelectItem value="divorced">גרוש/ה</SelectItem>
                    <SelectItem value="widowed">אלמן/ה</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>תעסוקה</Label>
                <Input
                  value={formData.occupation || ""}
                  onChange={(e) => handleChange("occupation", e.target.value)}
                  disabled={!isEditing}
                  placeholder="תעסוקה נוכחית"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>השכלה</Label>
                <Input
                  value={formData.education || ""}
                  onChange={(e) => handleChange("education", e.target.value)}
                  disabled={!isEditing}
                  placeholder="השכלה"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>רמת דתיות</Label>
                <Select
                  value={formData.religiousLevel || ""}
                  onValueChange={(value) =>
                    handleChange("religiousLevel", value)
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר רמת דתיות" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="חרדי">חרדי</SelectItem>
                    <SelectItem value="חרדי מודרני">חרדי מודרני</SelectItem>
                    <SelectItem value="דתי">דתי</SelectItem>
                    <SelectItem value="דתי-לייט">דתי-לייט</SelectItem>
                    <SelectItem value="מסורתי">מסורתי</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>כתובת</Label>
                <Input
                  value={formData.address || ""}
                  onChange={(e) => handleChange("address", e.target.value)}
                  disabled={!isEditing}
                  placeholder="כתובת מגורים"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>עיר</Label>
                <Input
                  value={formData.city || ""}
                  onChange={(e) => handleChange("city", e.target.value)}
                  disabled={!isEditing}
                  placeholder="עיר מגורים"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>מוצא</Label>
                <Input
                  value={formData.origin || ""}
                  onChange={(e) => handleChange("origin", e.target.value)}
                  disabled={!isEditing}
                  placeholder="ארץ מוצא / עדה"
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* כרטיס מידע משפחתי */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">מידע משפחתי</CardTitle>
            <CardDescription>פרטים על המשפחה והרקע</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Label>מצב משפחתי של ההורים</Label>
                <Select
                  value={formData.parentStatus || ""}
                  onValueChange={(value) => handleChange("parentStatus", value)}
                  disabled={!isEditing}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר מצב" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="נשואים">נשואים</SelectItem>
                    <SelectItem value="גרושים">גרושים</SelectItem>
                    <SelectItem value="אלמן">אלמן</SelectItem>
                    <SelectItem value="אלמנה">אלמנה</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>מספר אחים ואחיות</Label>
                <Input
                  type="number"
                  value={formData.siblings || ""}
                  onChange={(e) =>
                    handleChange("siblings", parseInt(e.target.value))
                  }
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>מיקום בין האחים</Label>
                <Input
                  type="number"
                  value={formData.position || ""}
                  onChange={(e) =>
                    handleChange("position", parseInt(e.target.value))
                  }
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* כרטיס ממליצים */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">ממליצים</CardTitle>
            <CardDescription>פרטי קשר של ממליצים</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>שם ממליץ/ה 1</Label>
                  <Input
                    value={formData.referenceName1 || ""}
                    onChange={(e) =>
                      handleChange("referenceName1", e.target.value)
                    }
                    disabled={!isEditing}
                    placeholder="שם מלא"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>טלפון ממליץ/ה 1</Label>
                  <Input
                    value={formData.referencePhone1 || ""}
                    onChange={(e) =>
                      handleChange("referencePhone1", e.target.value)
                    }
                    disabled={!isEditing}
                    placeholder="מספר טלפון"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>שם ממליץ/ה 2</Label>
                  <Input
                    value={formData.referenceName2 || ""}
                    onChange={(e) =>
                      handleChange("referenceName2", e.target.value)
                    }
                    disabled={!isEditing}
                    placeholder="שם מלא"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>טלפון ממליץ/ה 2</Label>
                  <Input
                    value={formData.referencePhone2 || ""}
                    onChange={(e) =>
                      handleChange("referencePhone2", e.target.value)
                    }
                    disabled={!isEditing}
                    placeholder="מספר טלפון"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* כרטיס הגדרות פרופיל */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">הגדרות פרופיל</CardTitle>
            <CardDescription>הגדרות פרטיות וזמינות</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>הצג פרופיל למשדכים</Label>
                  <p className="text-sm text-muted-foreground">
                    האם לאפשר למשדכים לצפות בפרופיל שלך
                  </p>
                </div>
                <Switch
                  checked={formData.isProfileVisible || false}
                  onCheckedChange={(checked) =>
                    handleChange("isProfileVisible", checked)
                  }
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label>מגדר מועדף למשדכ/ת</Label>
                <Select
                  value={formData.preferredMatchmakerGender || ""}
                  onValueChange={(value) =>
                    handleChange("preferredMatchmakerGender", value as Gender)
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר העדפה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">משדך</SelectItem>
                    <SelectItem value="FEMALE">שדכנית</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>סטטוס זמינות</Label>
                <Select
                  value={formData.availabilityStatus || "AVAILABLE"}
                  onValueChange={(value) =>
                    handleChange(
                      "availabilityStatus",
                      value as AvailabilityStatus
                    )
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר סטטוס" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">פנוי/ה</SelectItem>
                    <SelectItem value="UNAVAILABLE">לא פנוי/ה</SelectItem>
                    <SelectItem value="DATING">בתהליך היכרות</SelectItem>
                    <SelectItem value="ENGAGED">מאורס/ת</SelectItem>
                    <SelectItem value="MARRIED">נשוי/אה</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>הערת זמינות</Label>
                <Textarea
                  value={formData.availabilityNote || ""}
                  onChange={(e) =>
                    handleChange("availabilityNote", e.target.value)
                  }
                  disabled={!isEditing}
                  placeholder="הוסף הערה לגבי הזמינות שלך..."
                  className="mt-1"
                />
              </div>

              <div className="space-y-4">
                <Label>תיאור אישי</Label>
                {isEditing ? (
                  <Textarea
                    value={formData.about || ""}
                    onChange={(e) => handleChange("about", e.target.value)}
                    className="mt-2"
                    placeholder="ספר/י קצת על עצמך..."
                  />
                ) : (
                  <p className="mt-2 whitespace-pre-wrap">
                    {formData.about || "אין תיאור"}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <Label>תחביבים</Label>
                {isEditing ? (
                  <Textarea
                    value={formData.hobbies || ""}
                    onChange={(e) => handleChange("hobbies", e.target.value)}
                    className="mt-2"
                    placeholder="פרט/י את תחביבייך..."
                  />
                ) : (
                  <p className="mt-2">
                    {formData.hobbies || "לא צוינו תחביבים"}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSection;
