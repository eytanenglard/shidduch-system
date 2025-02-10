// types/profile-extended.ts

import { UserProfile } from '@/types/next-auth';


export interface PersonalityTraits {
  temperament: 'מופנם' | 'מעורב' | 'חברותי';
  decisionMaking: 'ספונטני' | 'מתוכנן' | 'משולב';
  communicationStyle: 'ישיר' | 'עקיף' | 'דיפלומטי';
  stressManagement: 'רגוע' | 'לחוץ' | 'משתנה';
}

export interface SpiritualProfile {
  prayerStyle: 'ספרד' | 'אשכנז' | 'תימני' | 'אחר';
  communityType: string;
  secularStudiesAttitude: 'חיובי' | 'שלילי' | 'מסויג';
  modestyLevel: 'מחמיר' | 'מקובל' | 'מודרני';
  childrenEducationApproach: string;
}

export interface FamilyBackground {
  parentsSpiritualLevel: string;
  parentsOccupations: {
    father: string;
    mother: string;
  };
  financialSupport: boolean;
  familyValues: string[];
  familyDynamics: string;
}
export interface ExtendedProfileData {
    personalityTraits?: PersonalityTraits;
    spiritualProfile?: SpiritualProfile;
    familyBackground?: FamilyBackground;
    lifestylePreferences?: LifestylePreferences;
    healthProfile?: HealthProfile;
    personalValues?: PersonalValues;
    specialSkills?: string[];
    futureGoals?: string[];
    expectedSupport?: {
      financial: boolean;
      housing: boolean;
      other: string;
    };
  }
  
export interface LifestylePreferences {
  careerAspiration: string;
  futureStudyPlans: string;
  spouseWorkAttitude: string;
  relationshipExpectations: string; // הוספת שדה חסר
  livingPreferences: {
    location: string;
    proximity: 'קרוב למשפחה' | 'קרוב לקהילה' | 'גמיש';
  };
  financialPriorities: string[];
}

export interface HealthProfile {
  generalHealth: string;
  dietaryRestrictions: string[];
  physicalActivity: string;
  allergies: string[];
  medicalConsiderations: string;
}

export interface PersonalValues {
  parentalRespect: 1 | 2 | 3 | 4 | 5;
  careerPriority: 1 | 2 | 3 | 4 | 5;
  financialManagement: string;
  militaryServiceStance: string;
  volunteeringPreferences: string; // הוספת שדה חסר
  volunteeringInterests: string[];
  communityInvolvement: string;
}

export interface ExtendedUserProfile extends UserProfile {
  personalityTraits: PersonalityTraits;
  spiritualProfile: SpiritualProfile;
  familyBackground: FamilyBackground;
  lifestylePreferences: LifestylePreferences;
  healthProfile: HealthProfile;
  personalValues: PersonalValues;
  specialSkills: string[];
  futureGoals: string[];
  expectedSupport: {
    financial: boolean;
    housing: boolean;
    other: string;
  };
}