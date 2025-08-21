// src/components/profile/constants.ts
import { Heart, User, Users, Scroll, GraduationCap, MapPin } from "lucide-react";

// Keys for WORLDS, titles are now in the dictionary
export const WORLD_KEYS = {
  values: "values",
  personality: "personality",
  relationship: "relationship",
  religion: "religion",
  partner: "partner",
} as const;

export const WORLDS_CONFIG = {
  [WORLD_KEYS.values]: {
    icon: Heart,
    color: "text-pink-500",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
  },
  [WORLD_KEYS.personality]: {
    icon: User,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  [WORLD_KEYS.relationship]: {
    icon: Users,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  [WORLD_KEYS.religion]: {
    icon: Scroll,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
  },
  [WORLD_KEYS.partner]: {
    icon: Heart,
    color: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
} as const;


// Keys for PROFILE_SECTIONS, titles are in the dictionary
export const PROFILE_SECTION_KEYS = {
  BASIC_INFO: "BASIC_INFO",
  EDUCATION: "EDUCATION",
  LOCATION: "LOCATION",
  FAMILY: "FAMILY",
  PREFERENCES: "PREFERENCES",
} as const;

export const PROFILE_SECTIONS_CONFIG = {
  [PROFILE_SECTION_KEYS.BASIC_INFO]: { icon: User },
  [PROFILE_SECTION_KEYS.EDUCATION]: { icon: GraduationCap },
  [PROFILE_SECTION_KEYS.LOCATION]: { icon: MapPin },
  [PROFILE_SECTION_KEYS.FAMILY]: { icon: Users },
  [PROFILE_SECTION_KEYS.PREFERENCES]: { icon: Heart },
} as const;


// Technical constants (keys or values that don't change with language)
export const CONTACT_PREFERENCE_KEYS = {
  DIRECT: "direct",
  MATCHMAKER: "matchmaker",
  BOTH: "both",
} as const;

// Validation rules (non-translatable)
export const VALIDATION_RULES = {
  AGE: {
    MIN: 18,
    MAX: 99
  },
  HEIGHT: {
    MIN: 100,
    MAX: 250
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50
  }
} as const;