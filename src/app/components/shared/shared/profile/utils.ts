// src/components/shared/profile/utils.ts
import type { UserProfile } from "@/types/next-auth";

export const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export const formatProfileData = (profile: UserProfile) => {
  return {
    ...profile,
    age: calculateAge(new Date(profile.birthDate)),
    // Add any other formatting needed
  };
};

export const validateProfileData = (data: Partial<UserProfile>) => {
  const errors: Record<string, string> = {};
  
  // Add validation rules as needed
  if (data.height && (data.height < 100 || data.height > 250)) {
    errors.height = "גובה חייב להיות בין 100 ל-250 ס\"מ";
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};