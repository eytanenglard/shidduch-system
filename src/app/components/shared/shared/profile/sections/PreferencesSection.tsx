// src/app/(authenticated)/profile/components/dashboard/PreferencesSection.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Save, X } from "lucide-react";
import { UserProfile, ContactPreference } from "@/types/next-auth";

interface PreferencesSectionProps {
  profile: UserProfile | null;
  isEditing: boolean;
  viewOnly?: boolean;
  setIsEditing: (value: boolean) => void;
  onChange: (data: Partial<UserProfile>) => void;
}

const PreferencesSection: React.FC<PreferencesSectionProps> = ({
  profile,
  isEditing,
  viewOnly = false,
  setIsEditing,
  onChange,
}) => {
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [initialData, setInitialData] = useState<Partial<UserProfile>>({});

  // Effect for handling initial data and profile updates
  useEffect(() => {
    if (profile) {
      // Helper function to convert null to undefined
      const nullToUndefined = <T,>(value: T | null): T | undefined =>
        value === null ? undefined : value;

      const newFormData: Partial<UserProfile> = {
        ...profile,
        // Handle numeric fields - explicitly convert null to undefined
        preferredAgeMin: nullToUndefined(profile.preferredAgeMin),
        preferredAgeMax: nullToUndefined(profile.preferredAgeMax),
        preferredHeightMin: nullToUndefined(profile.preferredHeightMin),
        preferredHeightMax: nullToUndefined(profile.preferredHeightMax),
        height: nullToUndefined(profile.height),

        // Handle reference fields
        referenceName1: profile.referenceName1 ?? "",
        referencePhone1: profile.referencePhone1 ?? "",
        referenceName2: profile.referenceName2 ?? "",
        referencePhone2: profile.referencePhone2 ?? "",

        // Handle array fields with empty array defaults
        preferredLocations: profile.preferredLocations ?? [],
        preferredReligiousLevels: profile.preferredReligiousLevels ?? [],
        preferredEducation: profile.preferredEducation ?? [],
        preferredOccupations: profile.preferredOccupations ?? [],

        // Handle other optional fields
        matchingNotes: profile.matchingNotes ?? "",
        contactPreference: profile.contactPreference ?? undefined,
        education: profile.education ?? "",
        occupation: profile.occupation ?? "",
      };

      console.log("Initialized form data:", newFormData);
      setFormData(newFormData);
      setInitialData(newFormData);
    }
  }, [profile]);

  // Debug current form data
  useEffect(() => {
    console.log("Current form data:", formData);
  }, [formData]);

  // Effect for handling edit mode changes
  useEffect(() => {
    if (!isEditing) {
      // When exiting edit mode, reset form data to initial data
      setFormData(initialData);
    }
  }, [isEditing, initialData]);

  const handleChange = <K extends keyof UserProfile>(
    field: K,
    value: UserProfile[K] | undefined
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value !== undefined && value !== null ? value : prev[field],
    }));
  };

  const handleSave = () => {
    onChange(formData);
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
              <h1 className="text-2xl font-bold">העדפות שידוך</h1>
              <p className="text-sm text-muted-foreground">
                נהל את העדפות השידוך שלך
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
        {/* Additional Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">תיאור כללי</CardTitle>
            <CardDescription>
              כתיבה חופשית על הבן זוג או הבת זוג
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label>תיאור</Label>
                {isEditing ? (
                  <Textarea
                    value={formData.matchingNotes || ""}
                    onChange={(e) =>
                      handleChange("matchingNotes", e.target.value)
                    }
                    placeholder="הוסף/י הערות והעדפות ..."
                    className="mt-2"
                  />
                ) : (
                  <p className="mt-2 whitespace-pre-wrap">
                    {formData.matchingNotes || "אין הערות "}
                  </p>
                )}
              </div>

              <div>
                <Label>אופן יצירת קשר מועדף</Label>
                {isEditing ? (
                  <Select
                    value={formData.contactPreference || undefined}
                    onValueChange={(value: string) => {
                      if (
                        value === "direct" ||
                        value === "matchmaker" ||
                        value === "both"
                      ) {
                        handleChange(
                          "contactPreference",
                          value as ContactPreference
                        );
                      }
                    }}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="בחר אפשרות" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">ישירות</SelectItem>
                      <SelectItem value="matchmaker">דרך השדכן/ית</SelectItem>
                      <SelectItem value="both">שתי האפשרויות</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="mt-2">
                    {(() => {
                      switch (formData.contactPreference) {
                        case "direct":
                          return "ישירות";
                        case "matchmaker":
                          return "דרך השדכן/ית";
                        case "both":
                          return "שתי האפשרויות";
                        default:
                          return "לא צוין אופן יצירת קשר מועדף";
                      }
                    })()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Age & Height Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              העדפות גיל וגובה
            </CardTitle>
            <CardDescription>הגדר/י טווחי גיל וגובה מועדפים</CardDescription>{" "}
          </CardHeader>
          <CardContent>
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-6 grid-flow-col-dense"
              dir="rtl"
            >
              <div className="space-y-4">
                <Label>טווח גילאים</Label>
                <div className="flex gap-4">
                  <div>
                    <Input
                      type="number"
                      placeholder="מ-"
                      value={formData.preferredAgeMin || ""}
                      onChange={(e) =>
                        handleChange(
                          "preferredAgeMin",
                          parseInt(e.target.value)
                        )
                      }
                      disabled={!isEditing}
                    />
                    <span className="text-sm text-muted-foreground">
                      מינימום
                    </span>
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="עד-"
                      value={formData.preferredAgeMax || ""}
                      onChange={(e) =>
                        handleChange(
                          "preferredAgeMax",
                          parseInt(e.target.value)
                        )
                      }
                      disabled={!isEditing}
                    />
                    <span className="text-sm text-muted-foreground">
                      מקסימום
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label>טווח גבהים (בסמ)</Label>

                <div className="flex gap-4">
                  <div>
                    <Input
                      type="number"
                      placeholder="מ-"
                      value={formData.preferredHeightMin || ""}
                      onChange={(e) =>
                        handleChange(
                          "preferredHeightMin",
                          parseInt(e.target.value)
                        )
                      }
                      disabled={!isEditing}
                    />
                    <span className="text-sm text-muted-foreground">
                      מינימום
                    </span>
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="עד-"
                      value={formData.preferredHeightMax || ""}
                      onChange={(e) =>
                        handleChange(
                          "preferredHeightMax",
                          parseInt(e.target.value)
                        )
                      }
                      disabled={!isEditing}
                    />
                    <span className="text-sm text-muted-foreground">
                      מקסימום
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location & Religious Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              העדפות מיקום ודת
            </CardTitle>
            <CardDescription>העדפות מיקום ורמת דתיות</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-6 grid-flow-col-dense"
              dir="rtl"
            >
              <div className="space-y-4">
                <Label>אזורי מגורים מועדפים</Label>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {["צפון", "מרכז", "דרום", "ירושלים", "יהודה ושומרון"].map(
                      (location) => (
                        <Button
                          key={location}
                          variant={
                            formData.preferredLocations?.includes(location)
                              ? "default"
                              : "outline"
                          }
                          onClick={() => {
                            const locations = formData.preferredLocations || [];
                            const newLocations = locations.includes(location)
                              ? locations.filter((l) => l !== location)
                              : [...locations, location];
                            handleChange("preferredLocations", newLocations);
                          }}
                          className="min-w-[100px]"
                        >
                          {location}
                        </Button>
                      )
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {formData.preferredLocations?.map((location) => (
                      <Badge key={location} variant="secondary">
                        {location}
                      </Badge>
                    )) || "לא צוינו אזורים מועדפים"}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <Label>רמות דתיות מועדפות</Label>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {["חרדי", "חרדי מודרני", "דתי", "דתי-לייט", "מסורתי"].map(
                      (level) => (
                        <Button
                          key={level}
                          variant={
                            formData.preferredReligiousLevels?.includes(level)
                              ? "default"
                              : "outline"
                          }
                          onClick={() => {
                            const levels =
                              formData.preferredReligiousLevels || [];
                            const newLevels = levels.includes(level)
                              ? levels.filter((l) => l !== level)
                              : [...levels, level];
                            handleChange("preferredReligiousLevels", newLevels);
                          }}
                          className="min-w-[100px]"
                        >
                          {level}
                        </Button>
                      )
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {formData.preferredReligiousLevels?.map((level) => (
                      <Badge key={level} variant="secondary">
                        {level}
                      </Badge>
                    )) || "לא צוינו רמות דתיות מועדפות"}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Education & Occupation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">השכלה ותעסוקה</CardTitle>
            <CardDescription>העדפות בתחום ההשכלה והתעסוקה</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-6 grid-flow-col-dense"
              dir="rtl"
            >
              <div className="space-y-4">
                <Label>רמות השכלה מועדפות</Label>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {["תיכונית", "על תיכונית", "אקדמית", "תורנית"].map(
                      (education) => (
                        <Button
                          key={education}
                          variant={
                            formData.preferredEducation?.includes(education)
                              ? "default"
                              : "outline"
                          }
                          onClick={() => {
                            const educations =
                              formData.preferredEducation || [];
                            const newEducations = educations.includes(education)
                              ? educations.filter((e) => e !== education)
                              : [...educations, education];
                            handleChange("preferredEducation", newEducations);
                          }}
                          className="min-w-[100px]"
                        >
                          {education}
                        </Button>
                      )
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {formData.preferredEducation?.map((education) => (
                      <Badge key={education} variant="secondary">
                        {education}
                      </Badge>
                    )) || "לא צוינו רמות השכלה מועדפות"}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <Label>תחומי עיסוק מועדפים</Label>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {["עובד/ת", "סטודנט/ית", "אברך/אברכית", "עצמאי/ת"].map(
                      (occupation) => (
                        <Button
                          key={occupation}
                          variant={
                            formData.preferredOccupations?.includes(occupation)
                              ? "default"
                              : "outline"
                          }
                          onClick={() => {
                            const occupations =
                              formData.preferredOccupations || [];
                            const newOccupations = occupations.includes(
                              occupation
                            )
                              ? occupations.filter((o) => o !== occupation)
                              : [...occupations, occupation];
                            handleChange(
                              "preferredOccupations",
                              newOccupations
                            );
                          }}
                          className="min-w-[100px]"
                        >
                          {occupation}
                        </Button>
                      )
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {formData.preferredOccupations?.map((occupation) => (
                      <Badge key={occupation} variant="secondary">
                        {occupation}
                      </Badge>
                    )) || "לא צוינו תחומי עיסוק מועדפים"}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PreferencesSection;
