import type { UserProfile, UserImage, QuestionnaireResponse } from "@/types/next-auth";

// Define specific types for questionnaire updates
export interface QuestionnaireUpdateValue {
  type: 'answer' | 'visibility';
  value?: string;
  isVisible?: boolean;
}

// Interfaces for the main sections
export interface PhotosSectionProps {
  images: UserImage[];
  isUploading: boolean;
  disabled?: boolean;
  onUpload: (file: File) => Promise<void>;
  onSetMain: (imageId: string) => Promise<void>;
  onDelete: (imageId: string) => Promise<void>;
}


export interface PreferencesSectionProps {
  profile: UserProfile | null;
  isEditing: boolean;
  viewOnly?: boolean;
  setIsEditing: (value: boolean) => void;
  onChange: (data: Partial<UserProfile>) => void;
}

export interface QuestionnaireResponsesSectionProps {
  questionnaire: QuestionnaireResponse | null;
  onUpdate?: (world: string, questionId: string, value: QuestionnaireUpdateValue) => Promise<void>;
  isEditable?: boolean;
  viewMode?: "matchmaker" | "candidate";
}

// Types for the extended profile data
export interface ExtendedProfileData {
  personalityTraits?: {
    temperament?: string;
    decisionMaking?: string;
    stressManagement?: string;
    communicationStyle?: string;
  };
  spiritualProfile?: {
    prayerStyle?: string;
    secularStudiesAttitude?: string;
    modestyLevel?: string;
    childrenEducationApproach?: string;
  };
  familyBackground?: {
    parentsSpiritualLevel?: string;
    parentsOccupations?: {
      father?: string;
      mother?: string;
    };
    familyDynamics?: string;
  };
  lifestylePreferences?: {
    careerAspiration?: string;
    futureStudyPlans?: string;
    livingPreferences?: {
      proximity?: string;
    };
    relationshipExpectations?: string;
  };
  healthProfile?: {
    generalHealth?: string;
    dietaryRestrictions?: string[];
    physicalActivity?: string;
  };
  personalValues?: {
    parentalRespect?: number;
    communityInvolvement?: string;
    volunteeringPreferences?: string;
    financialManagement?: string;
  };
  futureGoals?: string[];
  [key: string]: unknown;
}

// Additional utility types
export type ViewMode = "matchmaker" | "candidate";
export type CardSize = "sm" | "md" | "lg";