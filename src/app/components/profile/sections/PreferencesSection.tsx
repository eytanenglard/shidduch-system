// src/app/(authenticated)/profile/components/dashboard/PreferencesSection.tsx
"use client";

import React, { useState, useEffect } from "react";
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
import { UserProfile } from "@/types/next-auth"; // Assuming Gender is also exported or handled within UserProfile
import { cn } from "@/lib/utils";

interface PreferencesSectionProps {
  profile: UserProfile | null;
  isEditing: boolean;
  viewOnly?: boolean;
  setIsEditing: (value: boolean) => void;
  onChange: (data: Partial<UserProfile>) => void;
}

// Reusable Card component with the new style - Fixed ESLint error
interface StyledCardProps {
  children: React.ReactNode;
}
const StyledCard: React.FC<StyledCardProps> = ({ children }) => (
  <div
    className={cn(
      "bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 p-6 md:p-8 text-right"
    )}
  >
    {children}
  </div>
);

// Reusable Header for Cards
const StyledCardHeader: React.FC<{ title: string; description: string }> = ({
  title,
  description,
}) => (
  // Fixed ESLint error: react/no-unescaped-entities by using template literals
  <div className="mb-6 text-right">
    <h3 className="text-lg md:text-xl font-semibold text-gray-800">{title}</h3>
    <p className="text-sm text-gray-500 mt-1">{description}</p>
  </div>
);

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
      const nullToUndefined = <T,>(value: T | null): T | undefined =>
        value === null ? undefined : value;

      // Initialize form data, ensuring nulls become undefined where appropriate,
      // and empty strings remain empty strings for text fields.
      const newFormData: Partial<UserProfile> = {
        ...profile,
        // Numeric fields: convert null to undefined
        preferredAgeMin: nullToUndefined(profile.preferredAgeMin),
        preferredAgeMax: nullToUndefined(profile.preferredAgeMax),
        preferredHeightMin: nullToUndefined(profile.preferredHeightMin),
        preferredHeightMax: nullToUndefined(profile.preferredHeightMax),
        // Assuming height is also numeric or null
        height: profile.height === null ? undefined : profile.height,

        // String fields: convert null to empty string for controlled inputs
     
        matchingNotes: profile.matchingNotes ?? "",
        education: profile.education ?? "",
        occupation: profile.occupation ?? "",

        // Array fields: ensure they are arrays
        preferredLocations: profile.preferredLocations ?? [],
        preferredReligiousLevels: profile.preferredReligiousLevels ?? [],
        preferredEducation: profile.preferredEducation ?? [],
        preferredOccupations: profile.preferredOccupations ?? [],
        // Assuming additionalLanguages is also string[] | null
        additionalLanguages: profile.additionalLanguages ?? [],

        // Enum/Specific types: convert null to undefined
        contactPreference: nullToUndefined(profile.contactPreference),
        // Add other nullable fields here if necessary
      };

      setFormData(newFormData);
      setInitialData(newFormData); // Keep a copy of the initial state
    }
  }, [profile]);

  // Effect for handling edit mode changes
  useEffect(() => {
    if (!isEditing && profile) {
      // Reset only when exiting edit mode AND profile exists
      // Re-apply the initial data logic to reset correctly
      const nullToUndefined = <T,>(value: T | null): T | undefined =>
        value === null ? undefined : value;
      const resetFormData: Partial<UserProfile> = {
        ...profile,
        preferredAgeMin: nullToUndefined(profile.preferredAgeMin),
        preferredAgeMax: nullToUndefined(profile.preferredAgeMax),
        preferredHeightMin: nullToUndefined(profile.preferredHeightMin),
        preferredHeightMax: nullToUndefined(profile.preferredHeightMax),
        height: profile.height === null ? undefined : profile.height,
        matchingNotes: profile.matchingNotes ?? "",
        education: profile.education ?? "",
        occupation: profile.occupation ?? "",
        preferredLocations: profile.preferredLocations ?? [],
        preferredReligiousLevels: profile.preferredReligiousLevels ?? [],
        preferredEducation: profile.preferredEducation ?? [],
        preferredOccupations: profile.preferredOccupations ?? [],
        additionalLanguages: profile.additionalLanguages ?? [],
        contactPreference: nullToUndefined(profile.contactPreference),
      };
      setFormData(resetFormData);
    }
  }, [isEditing, profile]); // Depend on profile to ensure it's loaded

  // --- Input Handlers ---

  // Handles changes for standard Input and Textarea elements
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const field = name as keyof UserProfile;

    setFormData((prev) => {
      let processedValue: string | number | undefined;

      if (type === "number") {
        // For number inputs, parse or set undefined if empty/invalid
        const num = parseInt(value, 10);
        processedValue = isNaN(num) ? undefined : num;
      } else {
        // For text/textarea, use the value directly (can be empty string)
        processedValue = value;
      }

      return {
        ...prev,
        [field]: processedValue,
      };
    });
  };

  // Handles changes for Select components
  const handleSelectChange = (field: keyof UserProfile, value: string) => {
    setFormData((prev) => ({
      ...prev,
      // Set to undefined if the placeholder value "" is selected, otherwise use the value
      [field]: value === "" ? undefined : (value as UserProfile[typeof field]), // Type assertion might be needed based on field
    }));
  };

  // Fixed: This function is now used by multi-select buttons
  // Handles changes for multi-select button groups (toggles value in array)
  const handleMultiSelectChange = (field: keyof UserProfile, value: string) => {
    setFormData((prev) => {
      // Ensure the field exists and is an array, default to empty array if not
      const currentValues =
        (Array.isArray(prev[field]) ? (prev[field] as string[]) : []) ?? [];
      let newValues: string[];

      if (currentValues.includes(value)) {
        // Remove value if it exists
        newValues = currentValues.filter((v) => v !== value);
      } else {
        // Add value if it doesn't exist
        newValues = [...currentValues, value];
      }

      return {
        ...prev,
        [field]: newValues,
      };
    });
  };

  const handleSave = () => {
    // Create a copy to potentially clean up before sending
    const dataToSave: Partial<UserProfile> = { ...formData };

    // Optional: Convert empty strings back to null or undefined based on field type if needed by backend
    // Example:
    // if (dataToSave.matchingNotes === "") {
    //     dataToSave.matchingNotes = null; // Or undefined
    // }

    onChange(dataToSave);
    setIsEditing(false);
    setInitialData(dataToSave); // Update initial data to reflect saved state
  };

  const handleCancel = () => {
    setFormData(initialData); // Reset to last saved/initial state
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Edit/Save/Cancel Buttons */}
      {!viewOnly && (
        <div className="flex justify-end gap-3 mb-6">
          {!isEditing ? (
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="rounded-full px-5 py-2.5 text-sm border-cyan-300 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-400 transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <Pencil className="w-4 h-4 ml-1" />
              {`עריכה`}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                className="rounded-full px-5 py-2.5 text-sm border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <X className="w-4 h-4 ml-1" />
                {`ביטול`}
              </Button>
              <Button
                variant="default"
                onClick={handleSave}
                className="rounded-full px-6 py-2.5 text-sm shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                <Save className="w-4 h-4 ml-1" />
                {`שמירה`}
              </Button>
            </>
          )}
        </div>
      )}

      {/* General Description Card */}
      <StyledCard>
        <StyledCardHeader
          title={`תיאור כללי והעדפות קשר`}
          description={`כמה מילים על העדפותיך הכלליות ואופן יצירת הקשר המועדף.`}
        />
        <div className="space-y-6">
          <div>
            <Label
              htmlFor="matchingNotes"
              className="text-gray-700 font-medium block text-right"
            >{`תיאור כללי על המועמד/ת המבוקש/ת`}</Label>
            {isEditing ? (
              <Textarea
                id="matchingNotes"
                name="matchingNotes" // Ensure name matches the key in UserProfile
                value={formData.matchingNotes || ""} // Use controlled component value
                onChange={handleInputChange} // Use unified input handler
                placeholder={`פרט/י על סוג האדם שאת/ה מחפש/ת, תכונות חשובות, ציפיות וכו'...`}
                className="mt-2 min-h-[100px] rounded-lg border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 text-right"
                rows={4}
              />
            ) : (
              <p className="mt-2 whitespace-pre-wrap text-gray-800 bg-gray-50/50 p-3 rounded-lg text-right">
                {formData.matchingNotes || (
                  <span className="text-gray-400 italic">{`לא הוזן תיאור.`}</span>
                )}
              </p>
            )}
          </div>

          <div>
            <Label
              htmlFor="contactPreference"
              className="text-gray-700 font-medium block text-right"
            >{`אופן יצירת קשר מועדף`}</Label>
            {isEditing ? (
              <Select
                dir="rtl"
                name="contactPreference" // Add name for potential form submission (though handled via state here)
                value={formData.contactPreference || ""} // Use empty string for uncontrolled state or placeholder display
                onValueChange={(value: string) =>
                  handleSelectChange("contactPreference", value)
                } // Use unified select handler
              >
                <SelectTrigger
                  id="contactPreference"
                  className="mt-2 rounded-lg border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 text-right"
                >
                  {/* Use placeholder directly in SelectValue */}
                  <SelectValue placeholder={`בחרו אפשרות...`} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem
                    value="direct"
                    className="cursor-pointer text-right"
                  >{`ישירות`}</SelectItem>
                  <SelectItem
                    value="matchmaker"
                    className="cursor-pointer text-right"
                  >{`דרך השדכן/ית`}</SelectItem>
                  <SelectItem
                    value="both"
                    className="cursor-pointer text-right"
                  >{`שתי האפשרויות`}</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="mt-2 text-gray-800 text-right">
                {(() => {
                  switch (formData.contactPreference) {
                    case "direct":
                      return `ישירות`;
                    case "matchmaker":
                      return `דרך השדכן/ית`;
                    case "both":
                      return `שתי האפשרויות`;
                    default:
                      return (
                        <span className="text-gray-400 italic">{`לא צוין.`}</span>
                      );
                  }
                })()}
              </p>
            )}
          </div>
        </div>
      </StyledCard>

      {/* Age & Height Preferences Card */}
      <StyledCard>
        <StyledCardHeader
          title={`העדפות גיל וגובה`}
          description={`הגדר/י טווחי גיל וגובה רצויים עבור בן/בת הזוג.`}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {/* Age Range */}
          <div className="space-y-3">
            <Label className="text-gray-700 font-medium block text-right">{`טווח גילאים מועדף`}</Label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                name="preferredAgeMin" // Name attribute
                placeholder={`מגיל`}
                aria-label="גיל מינימלי מועדף"
                value={formData.preferredAgeMin ?? ""} // Handle undefined/null correctly
                onChange={handleInputChange} // Use unified handler
                disabled={!isEditing}
                className="rounded-lg border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 disabled:bg-gray-100 text-right"
              />
              <span className="text-gray-500">-</span>
              <Input
                type="number"
                name="preferredAgeMax" // Name attribute
                placeholder={`עד גיל`}
                aria-label="גיל מקסימלי מועדף"
                value={formData.preferredAgeMax ?? ""} // Handle undefined/null correctly
                onChange={handleInputChange} // Use unified handler
                disabled={!isEditing}
                className="rounded-lg border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 disabled:bg-gray-100 text-right"
              />
            </div>
            {!isEditing &&
              !formData.preferredAgeMin &&
              !formData.preferredAgeMax && (
                <p className="text-sm text-gray-400 italic mt-1 text-right">{`לא הוגדר טווח גילאים.`}</p>
              )}
          </div>

          {/* Height Range */}
          <div className="space-y-3">
            <Label className="text-gray-700 font-medium block text-right">{`טווח גבהים מועדף (בס"מ)`}</Label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                name="preferredHeightMin" // Name attribute
                placeholder={`מ-`}
                aria-label="גובה מינימלי מועדף בסנטימטרים"
                value={formData.preferredHeightMin ?? ""} // Handle undefined/null correctly
                onChange={handleInputChange} // Use unified handler
                disabled={!isEditing}
                className="rounded-lg border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 disabled:bg-gray-100 text-right"
              />
              <span className="text-gray-500">-</span>
              <Input
                type="number"
                name="preferredHeightMax" // Name attribute
                placeholder={`עד-`}
                aria-label="גובה מקסימלי מועדף בסנטימטרים"
                value={formData.preferredHeightMax ?? ""} // Handle undefined/null correctly
                onChange={handleInputChange} // Use unified handler
                disabled={!isEditing}
                className="rounded-lg border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 disabled:bg-gray-100 text-right"
              />
            </div>
            {!isEditing &&
              !formData.preferredHeightMin &&
              !formData.preferredHeightMax && (
                <p className="text-sm text-gray-400 italic mt-1 text-right">{`לא הוגדר טווח גבהים.`}</p>
              )}
          </div>
        </div>
      </StyledCard>

      {/* Location & Religious Preferences Card */}
      <StyledCard>
        <StyledCardHeader
          title={`העדפות מיקום ורמה דתית`}
          description={`בחר/י אזורי מגורים ורמות דתיות שמתאימים לך.`}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {/* Preferred Locations */}
          <div className="space-y-3">
            <Label className="text-gray-700 font-medium block text-right">{`אזורי מגורים מועדפים`}</Label>
            <div className="flex flex-wrap justify-end gap-2 mt-2">
              {["צפון", "מרכז", "דרום", "ירושלים", "יהודה ושומרון", 'חו"ל'].map(
                (location) =>
                  isEditing ? (
                    <Button
                      key={location}
                      type="button" // Prevent form submission if inside a form
                      variant={
                        formData.preferredLocations?.includes(location)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      // Fixed: Call handleMultiSelectChange
                      onClick={() =>
                        handleMultiSelectChange("preferredLocations", location)
                      }
                      className={cn(
                        "rounded-full transition-all duration-200",
                        formData.preferredLocations?.includes(location)
                          ? "bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-600"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                      )}
                    >
                      {location}
                    </Button>
                  ) : (
                    // Render badge only if selected in view mode
                    formData.preferredLocations?.includes(location) && (
                      <Badge
                        key={location}
                        variant="secondary"
                        className="rounded-full px-3 py-1 text-sm bg-cyan-100 text-cyan-800"
                      >
                        {location}
                      </Badge>
                    )
                  )
              )}
            </div>
            {!isEditing &&
              (!formData.preferredLocations ||
                formData.preferredLocations.length === 0) && (
                <p className="text-sm text-gray-400 italic mt-1 text-right">{`לא נבחרו אזורי מגורים מועדפים.`}</p>
              )}
          </div>

          {/* Preferred Religious Levels */}
          <div className="space-y-3">
            <Label className="text-gray-700 font-medium block text-right">{`רמות דתיות מועדפות`}</Label>
            <div className="flex flex-wrap justify-end gap-2 mt-2">
              {[
                "חרדי",
                "חרדי מודרני",
                "דתי",
                "דתי-לייט",
                "מסורתי",
                "חילוני",
              ].map((level) =>
                isEditing ? (
                  <Button
                    key={level}
                    type="button"
                    variant={
                      formData.preferredReligiousLevels?.includes(level)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    // Fixed: Call handleMultiSelectChange
                    onClick={() =>
                      handleMultiSelectChange("preferredReligiousLevels", level)
                    }
                    className={cn(
                      "rounded-full transition-all duration-200",
                      formData.preferredReligiousLevels?.includes(level)
                        ? "bg-pink-500 hover:bg-pink-600 text-white border-pink-500"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                    )}
                  >
                    {level}
                  </Button>
                ) : (
                  formData.preferredReligiousLevels?.includes(level) && (
                    <Badge
                      key={level}
                      variant="secondary"
                      className="rounded-full px-3 py-1 text-sm bg-pink-100 text-pink-800"
                    >
                      {level}
                    </Badge>
                  )
                )
              )}
            </div>
            {!isEditing &&
              (!formData.preferredReligiousLevels ||
                formData.preferredReligiousLevels.length === 0) && (
                <p className="text-sm text-gray-400 italic mt-1 text-right">{`לא נבחרו רמות דתיות מועדפות.`}</p>
              )}
          </div>
        </div>
      </StyledCard>

      {/* Education & Occupation Preferences Card */}
      <StyledCard>
        <StyledCardHeader
          title={`העדפות השכלה ותעסוקה`}
          description={`בחר/י את רמות ההשכלה ותחומי העיסוק המועדפים עליך.`}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {/* Preferred Education */}
          <div className="space-y-3">
            <Label className="text-gray-700 font-medium block text-right">{`רמות השכלה מועדפות`}</Label>
            <div className="flex flex-wrap justify-end gap-2 mt-2">
              {["תיכונית", "על תיכונית", "אקדמית", "תורנית", "ללא העדפה"].map(
                (education) =>
                  isEditing ? (
                    <Button
                      key={education}
                      type="button"
                      variant={
                        formData.preferredEducation?.includes(education)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      // Fixed: Call handleMultiSelectChange
                      onClick={() =>
                        handleMultiSelectChange("preferredEducation", education)
                      }
                      className={cn(
                        "rounded-full transition-all duration-200",
                        formData.preferredEducation?.includes(education)
                          ? "bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-600"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                      )}
                    >
                      {education}
                    </Button>
                  ) : (
                    formData.preferredEducation?.includes(education) && (
                      <Badge
                        key={education}
                        variant="secondary"
                        className="rounded-full px-3 py-1 text-sm bg-cyan-100 text-cyan-800"
                      >
                        {education}
                      </Badge>
                    )
                  )
              )}
            </div>
            {!isEditing &&
              (!formData.preferredEducation ||
                formData.preferredEducation.length === 0) && (
                <p className="text-sm text-gray-400 italic mt-1 text-right">{`לא נבחרו רמות השכלה מועדפות.`}</p>
              )}
          </div>

          {/* Preferred Occupations */}
          <div className="space-y-3">
            <Label className="text-gray-700 font-medium block text-right">{`תחומי עיסוק מועדפים`}</Label>
            <div className="flex flex-wrap justify-end gap-2 mt-2">
              {[
                "עובד/ת",
                "סטודנט/ית",
                "אברך/כולל",
                "עצמאי/ת",
                "שירות צבאי/לאומי",
                "ללא העדפה",
              ].map((occupation) =>
                isEditing ? (
                  <Button
                    key={occupation}
                    type="button"
                    variant={
                      formData.preferredOccupations?.includes(occupation)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    // Fixed: Call handleMultiSelectChange
                    onClick={() =>
                      handleMultiSelectChange(
                        "preferredOccupations",
                        occupation
                      )
                    }
                    className={cn(
                      "rounded-full transition-all duration-200",
                      formData.preferredOccupations?.includes(occupation)
                        ? "bg-pink-500 hover:bg-pink-600 text-white border-pink-500"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                    )}
                  >
                    {occupation}
                  </Button>
                ) : (
                  formData.preferredOccupations?.includes(occupation) && (
                    <Badge
                      key={occupation}
                      variant="secondary"
                      className="rounded-full px-3 py-1 text-sm bg-pink-100 text-pink-800"
                    >
                      {occupation}
                    </Badge>
                  )
                )
              )}
            </div>
            {!isEditing &&
              (!formData.preferredOccupations ||
                formData.preferredOccupations.length === 0) && (
                <p className="text-sm text-gray-400 italic mt-1 text-right">{`לא נבחרו תחומי עיסוק מועדפים.`}</p>
              )}
          </div>
        </div>
      </StyledCard>
    </div>
  );
};

export default PreferencesSection;
