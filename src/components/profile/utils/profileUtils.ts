// src/components/profile/utils/profileUtils.ts
// (Moved from utils.ts)

import type { UserProfile } from "@/types/next-auth";
import { VALIDATION_RULES } from "../constants/profileConstants";

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
  };
};

export const validateProfileData = (data: Partial<UserProfile>) => {
  const errors: Record<string, string> = {};

  if (data.height && (data.height < VALIDATION_RULES.HEIGHT.MIN || data.height > VALIDATION_RULES.HEIGHT.MAX)) {
    errors.height = "heightRange";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
