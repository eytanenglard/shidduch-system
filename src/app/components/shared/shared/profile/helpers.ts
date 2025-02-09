import type { UserProfile, UserImage, QuestionnaireResponse } from "@/types/next-auth";
import { VALIDATION_RULES } from "./constants";

/**
 * Calculates the completion percentage of a profile based on required fields
 * @param profile - The user profile to check
 * @returns The percentage of completion (0-100)
 */
export const getProfileCompletion = (profile: UserProfile): number => {
  const requiredFields = [
    'gender',
    'birthDate',
    'height',
    'maritalStatus',
    'city',
    'religiousLevel',
    'occupation',
    'education',
    'about',
    'referenceName1',
    'referencePhone1'
  ];
  
  const completedFields = requiredFields.filter(field => {
    const value = profile[field as keyof UserProfile];
    return value !== null && value !== undefined && value !== '';
  });

  return Math.round((completedFields.length / requiredFields.length) * 100);
};

/**
 * Formats a date for display in the Hebrew locale
 * @param date - The date to format
 * @returns Formatted date string
 */
export const formatDateDisplay = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Gets the main profile image from an array of images
 * @param images - Array of user images
 * @returns The main image or undefined if none exists
 */
export const getMainImage = (images: UserImage[]): UserImage | undefined => {
  return images.find(img => img.isMain);
};

/**
 * Validates a profile field based on predefined rules
 * @param fieldName - Name of the field to validate
 * @param value - Value to validate
 * @returns Validation result with optional error message
 */
export const validateProfileField = (
  fieldName: keyof UserProfile,
  value: any
): { isValid: boolean; error?: string } => {
  // Skip validation if value is empty/null
  if (value === null || value === undefined || value === '') {
    return { isValid: true };
  }

  switch (fieldName) {
    case 'height':
      if (value < VALIDATION_RULES.HEIGHT.MIN || value > VALIDATION_RULES.HEIGHT.MAX) {
        return {
          isValid: false,
          error: `גובה חייב להיות בין ${VALIDATION_RULES.HEIGHT.MIN} ל-${VALIDATION_RULES.HEIGHT.MAX} ס"מ`
        };
      }
      break;
    
    case 'birthDate':
      const age = calculateAge(new Date(value));
      if (age < VALIDATION_RULES.AGE.MIN || age > VALIDATION_RULES.AGE.MAX) {
        return {
          isValid: false,
          error: `גיל חייב להיות בין ${VALIDATION_RULES.AGE.MIN} ל-${VALIDATION_RULES.AGE.MAX}`
        };
      }
      break;

    case 'referenceName1':
    case 'referenceName2':
      if (value.length < VALIDATION_RULES.NAME.MIN_LENGTH || value.length > VALIDATION_RULES.NAME.MAX_LENGTH) {
        return {
          isValid: false,
          error: `שם חייב להיות בין ${VALIDATION_RULES.NAME.MIN_LENGTH} ל-${VALIDATION_RULES.NAME.MAX_LENGTH} תווים`
        };
      }
      break;

    case 'referencePhone1':
    case 'referencePhone2':
      const phoneRegex = /^[\d-]{9,15}$/;
      if (!phoneRegex.test(value)) {
        return {
          isValid: false,
          error: 'מספר טלפון לא תקין'
        };
      }
      break;
  }
  
  return { isValid: true };
};

/**
 * Calculates the questionnaire completion progress
 * @param questionnaire - The questionnaire response object
 * @returns Percentage of completion (0-100)
 */
export const getQuestionnaireProgress = (questionnaire: QuestionnaireResponse): number => {
  const totalWorlds = 5; // values, personality, relationship, religion, partner
  const completedWorlds = questionnaire.worldsCompleted.length;
  return Math.round((completedWorlds / totalWorlds) * 100);
};

/**
 * Checks if a profile has minimum required information for matching
 * @param profile - The user profile to check
 * @returns Whether the profile is ready for matching
 */
export const isProfileReadyForMatching = (profile: UserProfile): boolean => {
  const requiredFields: (keyof UserProfile)[] = [
    'gender',
    'birthDate',
    'height',
    'maritalStatus',
    'city',
    'religiousLevel'
  ];

  return requiredFields.every(field => {
    const value = profile[field];
    return value !== null && value !== undefined && value !== '';
  });
};

/**
 * Generates a profile completion summary with specific missing fields
 * @param profile - The user profile to check
 * @returns Object containing completion status and missing fields
 */
export const getProfileCompletionSummary = (profile: UserProfile): {
  isComplete: boolean;
  missingFields: string[];
} => {
  const missingFields: string[] = [];
  const requiredFields = {
    'gender': 'מגדר',
    'birthDate': 'תאריך לידה',
    'height': 'גובה',
    'maritalStatus': 'מצב משפחתי',
    'city': 'עיר מגורים',
    'religiousLevel': 'רמת דתיות',
    'referenceName1': 'שם ממליץ ראשון',
    'referencePhone1': 'טלפון ממליץ ראשון'
  } as const;

  for (const [field, label] of Object.entries(requiredFields)) {
    const value = profile[field as keyof UserProfile];
    if (!value) {
      missingFields.push(label);
    }
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields
  };
};

/**
 * Formats profile data for display, including calculating age
 * @param profile - The user profile to format
 * @returns Formatted profile data
 */
export const formatProfileForDisplay = (profile: UserProfile) => {
  return {
    ...profile,
    age: calculateAge(new Date(profile.birthDate)),
    formattedBirthDate: formatDateDisplay(profile.birthDate),
    formattedLastUpdate: profile.updatedAt ? formatDateDisplay(profile.updatedAt) : undefined
  };
};

/**
 * Calculates age from birthdate
 * @param birthDate - Date of birth
 * @returns Current age
 */
const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};