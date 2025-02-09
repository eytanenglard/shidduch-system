// src/components/shared/profile/constants.ts
import { Heart, User, Users, Scroll, GraduationCap, Briefcase, MapPin, Globe, Languages, Home } from "lucide-react";

export const WORLDS = {
  values: {
    key: "values",
    title: "ערכים ואמונות",
    icon: Heart,
    color: "text-pink-500",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
  },
  personality: {
    key: "personality",
    title: "אישיות",
    icon: User,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  relationship: {
    key: "relationship",
    title: "זוגיות ומשפחה",
    icon: Users,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  religion: {
    key: "religion",
    title: "דת ומסורת",
    icon: Scroll,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
  },
  partner: {
    key: "partner",
    title: "העדפות בן/בת זוג",
    icon: Heart,
    color: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
} as const;

export const RELIGIOUS_LEVELS = [
  "חרדי",
  "חרדי מודרני",
  "דתי",
  "דתי-לייט",
  "מסורתי"
] as const;

export const MARITAL_STATUS = [
  "single",
  "divorced",
  "widowed"
] as const;

export const EDUCATION_LEVELS = [
  "תיכונית",
  "על תיכונית",
  "אקדמית",
  "תורנית"
] as const;

export const OCCUPATION_TYPES = [
  "עובד/ת",
  "סטודנט/ית",
  "אברך/אברכית",
  "עצמאי/ת"
] as const;

export const LOCATIONS = [
  "צפון",
  "מרכז",
  "דרום",
  "ירושלים",
  "יהודה ושומרון"
] as const;

export const PROFILE_SECTIONS = {
  BASIC_INFO: {
    title: "פרטים אישיים",
    icon: User,
  },
  EDUCATION: {
    title: "השכלה ותעסוקה",
    icon: GraduationCap,
  },
  LOCATION: {
    title: "מיקום",
    icon: MapPin,
  },
  FAMILY: {
    title: "מידע משפחתי",
    icon: Users,
  },
  PREFERENCES: {
    title: "העדפות",
    icon: Heart,
  },
} as const;

export const COMMUNICATION_STYLES = [
  "ישיר",
  "עקיף",
  "דיפלומטי"
] as const;

export const STRESS_MANAGEMENT = [
  "רגוע",
  "לחוץ",
  "משתנה"
] as const;

export const CONTACT_PREFERENCES = [
  { value: "direct", label: "ישירות" },
  { value: "matchmaker", label: "דרך השדכן/ית" },
  { value: "both", label: "שתי האפשרויות" }
] as const;

// הגדרות עבור הוולידציה
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