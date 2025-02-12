import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Save } from "lucide-react";

interface Preference {
  criteria: string;
  importance: number;
  isRequired: boolean;
}

interface PreferencesFormData {
  ageRange: {
    min: number;
    max: number;
  };
  heightRange: {
    min: number;
    max: number;
  };
  religiousLevels: string[];
  locations: string[];
  maritalStatuses: string[];
  occupations: string[];
  educationLevels: string[];
  preferences: Preference[];
  dealBreakers: string[];
}

type ArrayFields =
  | "religiousLevels"
  | "locations"
  | "maritalStatuses"
  | "occupations"
  | "educationLevels";

type PreferenceField = keyof Preference;
type PreferenceValue = Preference[PreferenceField];

export default function MatchPreferencesForm() {
  const { data: session } = useSession();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<PreferencesFormData>({
    ageRange: { min: 20, max: 40 },
    heightRange: { min: 150, max: 190 },
    religiousLevels: [],
    locations: [],
    maritalStatuses: [],
    occupations: [],
    educationLevels: [],
    preferences: [
      { criteria: "religiousLevel", importance: 5, isRequired: true },
      { criteria: "location", importance: 4, isRequired: false },
      { criteria: "education", importance: 3, isRequired: false },
      { criteria: "occupation", importance: 3, isRequired: false },
    ],
    dealBreakers: [],
  });

  const handleRangeChange = (
    type: "age" | "height",
    field: "min" | "max",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [`${type}Range`]: {
        ...prev[`${type}Range`],
        [field]: parseInt(value) || 0,
      },
    }));
  };

  const handleMultiSelect = (field: ArrayFields, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const handlePreferenceChange = (
    index: number,
    field: PreferenceField,
    value: PreferenceValue
  ) => {
    setFormData((prev) => ({
      ...prev,
      preferences: prev.preferences.map((pref, i) =>
        i === index ? { ...pref, [field]: value } : pref
      ),
    }));
  };

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch("/api/preferences");
        if (response.ok) {
          const data = await response.json();
          console.log("Loaded preferences:", data);
          if (data && Object.keys(data).length > 0) {
            setFormData(data);
          }
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
      }
    };

    if (session?.user) {
      loadPreferences();
    }
  }, [session]);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/preferences/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowSuccessDialog(true);
      } else {
        const data = await response.json();
        throw new Error(data.message || "שגיאה בשמירת ההעדפות");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "שגיאה בשמירת ההעדפות");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            הגדרת העדפות התאמה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* טווח גילאים */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">טווח גילאים</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>מגיל</Label>
                <Input
                  type="number"
                  value={formData.ageRange.min}
                  onChange={(e) =>
                    handleRangeChange("age", "min", e.target.value)
                  }
                  min={18}
                  max={80}
                />
              </div>
              <div className="space-y-2">
                <Label>עד גיל</Label>
                <Input
                  type="number"
                  value={formData.ageRange.max}
                  onChange={(e) =>
                    handleRangeChange("age", "max", e.target.value)
                  }
                  min={18}
                  max={80}
                />
              </div>
            </div>
          </div>

          {/* טווח גבהים */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">טווח גבהים (בס&quot;מ)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>מגובה</Label>
                <Input
                  type="number"
                  value={formData.heightRange.min}
                  onChange={(e) =>
                    handleRangeChange("height", "min", e.target.value)
                  }
                  min={140}
                  max={200}
                />
              </div>
              <div className="space-y-2">
                <Label>עד גובה</Label>
                <Input
                  type="number"
                  value={formData.heightRange.max}
                  onChange={(e) =>
                    handleRangeChange("height", "max", e.target.value)
                  }
                  min={140}
                  max={200}
                />
              </div>
            </div>
          </div>

          {/* רמת דתיות */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">רמת דתיות</h3>
            <div className="flex flex-wrap gap-2">
              {["חרדי", "חרדי מודרני", "דתי", "דתי-לייט"].map((level) => (
                <Button
                  key={level}
                  variant={
                    formData.religiousLevels.includes(level)
                      ? "default"
                      : "outline"
                  }
                  onClick={() => handleMultiSelect("religiousLevels", level)}
                  className="min-w-[100px]"
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>

          {/* אזור מגורים */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">אזור מגורים</h3>
            <div className="flex flex-wrap gap-2">
              {["ירושלים", "מרכז", "צפון", "דרום", "יהודה ושומרון"].map(
                (location) => (
                  <Button
                    key={location}
                    variant={
                      formData.locations.includes(location)
                        ? "default"
                        : "outline"
                    }
                    onClick={() => handleMultiSelect("locations", location)}
                    className="min-w-[100px]"
                  >
                    {location}
                  </Button>
                )
              )}
            </div>
          </div>

          {/* העדפות נוספות */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">חשיבות קריטריונים</h3>
            {formData.preferences.map((pref, index) => (
              <div
                key={pref.criteria}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center"
              >
                <Label>{pref.criteria}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={pref.importance}
                    onChange={(e) =>
                      handlePreferenceChange(
                        index,
                        "importance",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full"
                  />
                  <span className="min-w-[2ch]">{pref.importance}</span>
                </div>
                <Button
                  variant={pref.isRequired ? "default" : "outline"}
                  onClick={() =>
                    handlePreferenceChange(
                      index,
                      "isRequired",
                      !pref.isRequired
                    )
                  }
                >
                  {pref.isRequired ? "חובה" : "רצוי"}
                </Button>
              </div>
            ))}
          </div>

          {/* כפתור שמירה */}
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full md:w-auto"
            >
              <Save className="w-4 h-4 ml-2" />
              {loading ? "שומר..." : "שמירת העדפות"}
            </Button>
          </div>

          {error && (
            <div className="p-4 mt-4 bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>העדפות נשמרו בהצלחה</AlertDialogTitle>
            <AlertDialogDescription>
              העדפות ההתאמה שלך עודכנו במערכת
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>
              אישור
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
