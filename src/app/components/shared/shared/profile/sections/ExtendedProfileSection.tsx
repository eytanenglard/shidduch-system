"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ExtendedProfileData } from "@/types/profile-extended";
import { UserProfile } from "@/types/next-auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Pencil, Save, X } from "lucide-react";

interface ExtendedProfileSectionProps {
  profile: (UserProfile & { extendedData?: ExtendedProfileData }) | null;
  isEditing: boolean;
  viewOnly?: boolean;
  setIsEditing: (value: boolean) => void;
  onSave: (
    data: Partial<UserProfile & { extendedData: ExtendedProfileData }>
  ) => void;
}

type NestedChangeValue =
  | string
  | number
  | boolean
  | string[]
  | { [key: string]: string }
  | { location: string; proximity: "קרוב למשפחה" | "קרוב לקהילה" | "גמיש" };

const ExtendedProfileSection: React.FC<ExtendedProfileSectionProps> = ({
  profile,
  isEditing,
  viewOnly = false,
  setIsEditing,
  onSave,
}) => {
  const [formData, setFormData] = useState<ExtendedProfileData>({});
  const [initialData, setInitialData] = useState<ExtendedProfileData>({});

  useEffect(() => {
    if (profile?.extendedData) {
      setFormData(profile.extendedData);
      setInitialData(profile.extendedData);
    }
  }, [profile]);

  const handleChange = (
    field: keyof ExtendedProfileData,
    value: string | string[] | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedChange = (
    category: keyof ExtendedProfileData,
    field: string,
    value: NestedChangeValue
  ) => {
    setFormData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    if (profile) {
      onSave({
        ...profile,
        extendedData: formData,
      });
    }
    setIsEditing(false);
    setInitialData(formData);
  };

  const handleCancel = () => {
    setFormData(initialData);
    setIsEditing(false);
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">פרופיל מורחב</h1>
              <p className="text-sm text-muted-foreground">
                פרטים נוספים להתאמה מיטבית
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

      <div className="container mx-auto py-6 space-y-6">
        {/* תכונות אישיות */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">תכונות אישיות</CardTitle>
            <CardDescription>אפיון אישיותי ודפוסי התנהגות</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>מזג</Label>
                <Select
                  value={formData.personalityTraits?.temperament}
                  onValueChange={(value) =>
                    handleNestedChange(
                      "personalityTraits",
                      "temperament",
                      value
                    )
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר מזג" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="מופנם">מופנם</SelectItem>
                    <SelectItem value="מעורב">מעורב</SelectItem>
                    <SelectItem value="חברותי">חברותי</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>סגנון קבלת החלטות</Label>
                <Select
                  value={formData.personalityTraits?.decisionMaking}
                  onValueChange={(value) =>
                    handleNestedChange(
                      "personalityTraits",
                      "decisionMaking",
                      value
                    )
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר סגנון" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ספונטני">ספונטני</SelectItem>
                    <SelectItem value="מתוכנן">מתוכנן</SelectItem>
                    <SelectItem value="משולב">משולב</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>התמודדות עם לחץ</Label>
                <Select
                  value={formData.personalityTraits?.stressManagement}
                  onValueChange={(value) =>
                    handleNestedChange(
                      "personalityTraits",
                      "stressManagement",
                      value
                    )
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר סגנון התמודדות" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="רגוע">רגוע</SelectItem>
                    <SelectItem value="לחוץ">לחוץ</SelectItem>
                    <SelectItem value="משתנה">משתנה</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>סגנון תקשורת</Label>
                <Select
                  value={formData.personalityTraits?.communicationStyle}
                  onValueChange={(value) =>
                    handleNestedChange(
                      "personalityTraits",
                      "communicationStyle",
                      value
                    )
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר סגנון תקשורת" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ישיר">ישיר</SelectItem>
                    <SelectItem value="עקיף">עקיף</SelectItem>
                    <SelectItem value="דיפלומטי">דיפלומטי</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* פרופיל רוחני */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">פרופיל רוחני</CardTitle>
            <CardDescription>השקפת עולם והשתייכות קהילתית</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>נוסח תפילה</Label>
                <Select
                  value={formData.spiritualProfile?.prayerStyle}
                  onValueChange={(value) =>
                    handleNestedChange("spiritualProfile", "prayerStyle", value)
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר נוסח" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ספרד">ספרד</SelectItem>
                    <SelectItem value="אשכנז">אשכנז</SelectItem>
                    <SelectItem value="תימני">תימני</SelectItem>
                    <SelectItem value="אחר">אחר</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>גישה ללימודי חול</Label>
                <Select
                  value={formData.spiritualProfile?.secularStudiesAttitude}
                  onValueChange={(value) =>
                    handleNestedChange(
                      "spiritualProfile",
                      "secularStudiesAttitude",
                      value
                    )
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר גישה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="חיובי">חיובי</SelectItem>
                    <SelectItem value="שלילי">שלילי</SelectItem>
                    <SelectItem value="מסויג">מסויג</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>רמת הקפדה בצניעות</Label>
                <Select
                  value={formData.spiritualProfile?.modestyLevel}
                  onValueChange={(value) =>
                    handleNestedChange(
                      "spiritualProfile",
                      "modestyLevel",
                      value
                    )
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר רמת הקפדה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="מחמיר">מחמיר</SelectItem>
                    <SelectItem value="מקובל">מקובל</SelectItem>
                    <SelectItem value="מודרני">מודרני</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>גישה לחינוך ילדים</Label>
                <Textarea
                  value={
                    formData.spiritualProfile?.childrenEducationApproach || ""
                  }
                  onChange={(e) =>
                    handleNestedChange(
                      "spiritualProfile",
                      "childrenEducationApproach",
                      e.target.value
                    )
                  }
                  disabled={!isEditing}
                  className="mt-1"
                  placeholder="תאר/י את גישתך לחינוך ילדים..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* רקע משפחתי */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">רקע משפחתי</CardTitle>
            <CardDescription>פרטים על המשפחה והתמיכה המשפחתית</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>רמה רוחנית של ההורים</Label>
                <Input
                  value={formData.familyBackground?.parentsSpiritualLevel || ""}
                  onChange={(e) =>
                    handleNestedChange(
                      "familyBackground",
                      "parentsSpiritualLevel",
                      e.target.value
                    )
                  }
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>עיסוק האב</Label>
                <Input
                  value={
                    formData.familyBackground?.parentsOccupations?.father || ""
                  }
                  onChange={(e) =>
                    handleNestedChange(
                      "familyBackground",
                      "parentsOccupations",
                      {
                        ...formData.familyBackground?.parentsOccupations,
                        father: e.target.value,
                      }
                    )
                  }
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>עיסוק האם</Label>
                <Input
                  value={
                    formData.familyBackground?.parentsOccupations?.mother || ""
                  }
                  onChange={(e) =>
                    handleNestedChange(
                      "familyBackground",
                      "parentsOccupations",
                      {
                        ...formData.familyBackground?.parentsOccupations,
                        mother: e.target.value,
                      }
                    )
                  }
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>דינמיקה משפחתית</Label>
                <Textarea
                  value={formData.familyBackground?.familyDynamics || ""}
                  onChange={(e) =>
                    handleNestedChange(
                      "familyBackground",
                      "familyDynamics",
                      e.target.value
                    )
                  }
                  disabled={!isEditing}
                  className="mt-1"
                  placeholder="תאר/י את היחסים במשפחה..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* סגנון חיים */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">סגנון חיים</CardTitle>
            <CardDescription>העדפות ושאיפות לעתיד</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label>שאיפות קריירה</Label>
                <Textarea
                  value={formData.lifestylePreferences?.careerAspiration || ""}
                  onChange={(e) =>
                    handleNestedChange(
                      "lifestylePreferences",
                      "careerAspiration",
                      e.target.value
                    )
                  }
                  disabled={!isEditing}
                  className="mt-1"
                  placeholder="תאר/י את שאיפותיך המקצועיות..."
                />
              </div>

              <div>
                <Label>תכניות לימודים עתידיות</Label>
                <Textarea
                  value={formData.lifestylePreferences?.futureStudyPlans || ""}
                  onChange={(e) =>
                    handleNestedChange(
                      "lifestylePreferences",
                      "futureStudyPlans",
                      e.target.value
                    )
                  }
                  disabled={!isEditing}
                  className="mt-1"
                  placeholder="תאר/י את תכניות הלימוד העתידיות שלך..."
                />
              </div>

              <div>
                <Label>העדפות מגורים</Label>
                <Select
                  value={
                    formData.lifestylePreferences?.livingPreferences?.proximity
                  }
                  onValueChange={(value) =>
                    handleNestedChange(
                      "lifestylePreferences",
                      "livingPreferences",
                      {
                        ...formData.lifestylePreferences?.livingPreferences,
                        proximity: value,
                      }
                    )
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר העדפת מגורים" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="קרוב למשפחה">קרוב למשפחה</SelectItem>
                    <SelectItem value="קרוב לקהילה">קרוב לקהילה</SelectItem>
                    <SelectItem value="גמיש">גמיש</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* בריאות ואורח חיים */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              בריאות ואורח חיים
            </CardTitle>
            <CardDescription>מידע רפואי והרגלי חיים</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>מצב בריאותי</Label>
                <Textarea
                  value={formData.healthProfile?.generalHealth || ""}
                  onChange={(e) =>
                    handleNestedChange(
                      "healthProfile",
                      "generalHealth",
                      e.target.value
                    )
                  }
                  disabled={!isEditing}
                  className="mt-1"
                  placeholder="תאר/י את מצבך הבריאותי..."
                />
              </div>

              <div>
                <Label>הגבלות תזונתיות</Label>
                <Input
                  value={
                    formData.healthProfile?.dietaryRestrictions?.join(", ") ||
                    ""
                  }
                  onChange={(e) =>
                    handleNestedChange(
                      "healthProfile",
                      "dietaryRestrictions",
                      e.target.value.split(",").map((item) => item.trim())
                    )
                  }
                  disabled={!isEditing}
                  className="mt-1"
                  placeholder="הפרד/י בפסיקים..."
                />
              </div>

              <div>
                <Label>פעילות גופנית</Label>
                <Select
                  value={formData.healthProfile?.physicalActivity}
                  onValueChange={(value) =>
                    handleNestedChange(
                      "healthProfile",
                      "physicalActivity",
                      value
                    )
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר רמת פעילות" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="נמוכה">נמוכה</SelectItem>
                    <SelectItem value="בינונית">בינונית</SelectItem>
                    <SelectItem value="גבוהה">גבוהה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ערכים אישיים ומעורבות קהילתית */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              ערכים ומעורבות קהילתית
            </CardTitle>
            <CardDescription>ערכים אישיים ותרומה לקהילה</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label>חשיבות כיבוד הורים (1-5)</Label>
                <Slider
                  value={[formData.personalValues?.parentalRespect || 3]}
                  min={1}
                  max={5}
                  step={1}
                  onValueChange={(value) =>
                    handleNestedChange(
                      "personalValues",
                      "parentalRespect",
                      value[0]
                    )
                  }
                  disabled={!isEditing}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>התנדבות ומעורבות קהילתית</Label>
                <Textarea
                  value={formData.personalValues?.communityInvolvement || ""}
                  onChange={(e) =>
                    handleNestedChange(
                      "personalValues",
                      "communityInvolvement",
                      e.target.value
                    )
                  }
                  disabled={!isEditing}
                  className="mt-1"
                  placeholder="תאר/י את מעורבותך בקהילה..."
                />
              </div>
              <div>
                <Label>תחומי התנדבות מועדפים</Label>
                <Select
                  value={formData.personalValues?.volunteeringPreferences}
                  onValueChange={(value) =>
                    handleNestedChange(
                      "personalValues",
                      "volunteeringPreferences",
                      value
                    )
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר תחום" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="חינוך">חינוך</SelectItem>
                    <SelectItem value="בריאות">בריאות</SelectItem>
                    <SelectItem value="רווחה">רווחה</SelectItem>
                    <SelectItem value="קשישים">קשישים</SelectItem>
                    <SelectItem value="נוער">נוער</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>גישה לניהול כספים</Label>
                <Select
                  value={formData.personalValues?.financialManagement}
                  onValueChange={(value) =>
                    handleNestedChange(
                      "personalValues",
                      "financialManagement",
                      value
                    )
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר גישה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="שמרני">שמרני</SelectItem>
                    <SelectItem value="מאוזן">מאוזן</SelectItem>
                    <SelectItem value="נועז">נועז</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* שאיפות וציפיות */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">שאיפות וציפיות</CardTitle>
            <CardDescription>מטרות אישיות וציפיות לעתיד</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>מטרות לחמש השנים הקרובות</Label>
                <Textarea
                  value={formData.futureGoals?.join("\n") || ""}
                  onChange={(e) =>
                    handleChange("futureGoals", e.target.value.split("\n"))
                  }
                  disabled={!isEditing}
                  className="mt-1"
                  placeholder="רשום/י כל מטרה בשורה נפרדת..."
                />
              </div>

              <div>
                <Label>ציפיות מהזוגיות</Label>
                <Textarea
                  value={
                    formData.lifestylePreferences?.relationshipExpectations ||
                    ""
                  }
                  onChange={(e) =>
                    handleNestedChange(
                      "lifestylePreferences",
                      "relationshipExpectations",
                      e.target.value
                    )
                  }
                  disabled={!isEditing}
                  className="mt-1"
                  placeholder="תאר/י את ציפיותיך מהזוגיות..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExtendedProfileSection;
