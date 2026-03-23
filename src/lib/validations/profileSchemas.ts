// src/lib/validations/profileSchemas.ts
// Shared Zod schemas for profile-related API validation

import { z } from 'zod';
import { Gender, Language, ReligiousJourney } from '@prisma/client';

// ==========================================
// Shared validation helpers
// ==========================================

/** Normalize Israeli phone numbers: +9720 → +972 */
export function normalizePhone(val: string): string;
export function normalizePhone(val: unknown): unknown;
export function normalizePhone(val: unknown): unknown {
  if (typeof val !== 'string') return val;
  if (val.startsWith('+9720')) {
    return val.replace('+9720', '+972');
  }
  return val;
}

/** E.164 phone number validation */
export const isValidPhone = (phone: unknown): boolean =>
  typeof phone === 'string' && /^\+[1-9]\d{1,14}$/.test(phone);

/** E.164 phone number pattern */
export const phoneSchema = z.preprocess(
  normalizePhone,
  z.string().refine(
    (phone) => /^\+[1-9]\d{1,14}$/.test(phone),
    { message: 'Invalid international phone number format (E.164 required).' }
  )
);

/** Birth date string — must be valid date, 18+ years old */
export const birthDateSchema = z.string().refine(
  (date) => !isNaN(Date.parse(date)),
  { message: 'Invalid birth date format' }
).refine(
  (date) => {
    const age = Math.floor((Date.now() - new Date(date).getTime()) / 31557600000);
    return age >= 18;
  },
  { message: 'Must be at least 18 years old' }
);

// ==========================================
// Reusable field schemas (building blocks)
// ==========================================

/** Basic personal info fields — shared between profile update & registration */
export const basicInfoFields = {
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  birthDate: z.string().or(z.date()).optional(),
  nativeLanguage: z.string().max(50).optional().nullable(),
  additionalLanguages: z.array(z.string().max(50)).optional(),
  height: z.number().int().min(100).max(250).optional().nullable(),
  city: z.string().max(100).optional(),
  origin: z.string().max(100).optional(),
  aliyaCountry: z.string().max(100).optional(),
  aliyaYear: z.number().int().min(1900).max(2100).optional().nullable(),
  maritalStatus: z.string().max(50).optional(),
  hasChildrenFromPrevious: z.boolean().optional(),
} as const;

/** Family fields */
export const familyFields = {
  parentStatus: z.string().max(50).optional().nullable(),
  fatherOccupation: z.string().max(200).optional(),
  motherOccupation: z.string().max(200).optional(),
  siblings: z.number().int().min(0).max(30).optional().nullable(),
  position: z.number().int().min(0).max(30).optional().nullable(),
} as const;

/** Education & career fields */
export const educationCareerFields = {
  educationLevel: z.string().max(50).optional(),
  education: z.string().max(500).optional(),
  occupation: z.string().max(200).optional(),
  serviceType: z.string().max(50).optional().nullable(),
  serviceDetails: z.string().max(500).optional(),
} as const;

/** Religious fields */
export const religiousFields = {
  religiousLevel: z.string().max(50).optional(),
  religiousJourney: z.string().max(50).optional().nullable(),
  shomerNegiah: z.boolean().optional().nullable(),
  smokingStatus: z.string().max(50).optional().nullable(),
  headCovering: z.string().max(50).optional().nullable(),
  kippahType: z.string().max(50).optional().nullable(),
} as const;

/** Personality & character fields */
export const personalityFields = {
  profileCharacterTraits: z.array(z.string().max(100)).optional(),
  profileHobbies: z.array(z.string().max(100)).optional(),
} as const;

/** Text / about fields */
export const textFields = {
  about: z.string().max(5000).optional(),
  isAboutVisible: z.boolean().optional(),
  profileHeadline: z.string().max(300).optional().nullable(),
  inspiringCoupleStory: z.string().max(2000).optional().nullable(),
  influentialRabbi: z.string().max(200).optional().nullable(),
  manualEntryText: z.string().max(5000).optional().nullable(),
  isNeshamaTechSummaryVisible: z.boolean().optional(),
  isFriendsSectionVisible: z.boolean().optional(),
  matchingNotes: z.string().max(5000).optional(),
} as const;

/** Preference fields */
export const preferenceFields = {
  preferredAgeMin: z.number().int().min(18).max(120).optional().nullable(),
  preferredAgeMax: z.number().int().min(18).max(120).optional().nullable(),
  preferredHeightMin: z.number().int().min(100).max(250).optional().nullable(),
  preferredHeightMax: z.number().int().min(100).max(250).optional().nullable(),
  preferredReligiousLevels: z.array(z.string().max(50)).optional(),
  preferredLocations: z.array(z.string().max(100)).optional(),
  preferredEducation: z.array(z.string().max(100)).optional(),
  preferredOccupations: z.array(z.string().max(200)).optional(),
  preferredMaritalStatuses: z.array(z.string().max(50)).optional(),
  preferredOrigins: z.array(z.string().max(100)).optional(),
  preferredServiceTypes: z.array(z.string().max(50)).optional(),
  preferredHeadCoverings: z.array(z.string().max(50)).optional(),
  preferredKippahTypes: z.array(z.string().max(50)).optional(),
  preferredShomerNegiah: z.boolean().optional().nullable(),
  preferredSmokingStatus: z.string().max(50).optional().nullable(),
  preferredPartnerHasChildren: z.string().max(50).optional().nullable(),
  preferredCharacterTraits: z.array(z.string().max(100)).optional(),
  preferredHobbies: z.array(z.string().max(100)).optional(),
  preferredAliyaStatus: z.string().max(50).optional().nullable(),
  preferredReligiousJourneys: z.array(z.string().max(50)).optional(),
  preferredBodyTypes: z.array(z.string().max(50)).optional(),
  preferredAppearanceTones: z.array(z.string().max(50)).optional(),
  preferredGroomingStyles: z.array(z.string().max(50)).optional(),
} as const;

/** Contact, visibility & system fields */
export const contactVisibilityFields = {
  contactPreference: z.string().max(50).optional(),
  preferredMatchmakerGender: z.string().max(50).optional().nullable(),
  isProfileVisible: z.boolean().optional(),
  availabilityStatus: z.string().max(50).optional(),
  availabilityNote: z.string().max(1000).optional(),
  availabilityUpdatedAt: z.string().or(z.date()).optional().nullable(),
  hasViewedProfilePreview: z.boolean().optional(),
  needsAiProfileUpdate: z.boolean().optional(),
} as const;

/** Medical fields */
export const medicalFields = {
  hasMedicalInfo: z.boolean().optional().nullable(),
  medicalInfoDetails: z.string().max(5000).optional().nullable(),
  medicalInfoDisclosureTiming: z.string().max(100).optional().nullable(),
  isMedicalInfoVisible: z.boolean().optional(),
} as const;

/** Appearance fields */
export const appearanceFields = {
  bodyType: z.string().max(50).optional().nullable(),
  appearanceTone: z.string().max(50).optional().nullable(),
  groomingStyle: z.string().max(50).optional().nullable(),
} as const;

// ==========================================
// Composed schemas
// ==========================================

/** Full profile update schema — used by PUT /api/profile */
export const profileUpdateSchema = z.object({
  ...basicInfoFields,
  ...familyFields,
  ...educationCareerFields,
  ...religiousFields,
  ...personalityFields,
  ...textFields,
  ...preferenceFields,
  ...contactVisibilityFields,
  ...medicalFields,
  ...appearanceFields,
}).passthrough();

/** Profile completion schema — used by POST /api/auth/complete-profile */
export const completeProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name too long'),
  phone: phoneSchema,
  gender: z.nativeEnum(Gender),
  birthDate: birthDateSchema,
  maritalStatus: z.string().min(1, 'Marital status is required'),
  city: z.string().min(1, 'City is required'),

  // Optional
  origin: z.string().optional(),
  height: z.coerce.number().int().min(120).max(220).optional(),
  occupation: z.string().optional(),
  education: z.string().optional(),
  religiousLevel: z.string().optional(),
  religiousJourney: z.nativeEnum(ReligiousJourney).optional(),
  language: z.nativeEnum(Language).optional().default(Language.he),
  about: z.string().max(2000, 'About text is too long').optional(),
  matchingNotes: z.string().max(1000, 'Matching notes text is too long').optional(),

  // Consent
  engagementEmailsConsent: z.boolean().optional().default(false),
  promotionalEmailsConsent: z.boolean().optional().default(false),
});

/** Mobile profile completion schema */
export const mobileCompleteProfileSchema = z.object({
  // Required
  firstName: z.string().min(1, 'שם פרטי הוא שדה חובה.').max(100),
  lastName: z.string().min(1, 'שם משפחה הוא שדה חובה.').max(100),
  phone: z.string().min(1, 'מספר טלפון הוא שדה חובה.').max(20),
  gender: z.enum(['MALE', 'FEMALE'], { errorMap: () => ({ message: 'מגדר הוא שדה חובה.' }) }),
  birthDate: z.string().min(1, 'תאריך לידה הוא שדה חובה.').refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'תאריך לידה לא תקין.' }
  ).refine(
    (val) => {
      const age = Math.floor((Date.now() - new Date(val).getTime()) / 31557600000);
      return age >= 18;
    },
    { message: 'גיל מינימלי להרשמה הוא 18.' }
  ),
  maritalStatus: z.string().min(1, 'מצב משפחתי הוא שדה חובה.').max(50),
  city: z.string().min(1, 'עיר היא שדה חובה.').max(100),

  // Optional
  origin: z.string().max(100).optional().nullable(),
  height: z.union([z.string(), z.number()]).optional().nullable(),
  occupation: z.string().max(200).optional().nullable(),
  education: z.string().max(500).optional().nullable(),
  religiousLevel: z.string().max(50).optional().nullable(),
  religiousJourney: z.string().max(50).optional().nullable(),
  about: z.string().max(5000).optional().nullable(),
  hasChildrenFromPrevious: z.boolean().optional(),
  language: z.enum(['he', 'en']).optional().default('he'),
  engagementEmailsConsent: z.boolean().optional().default(false),
  promotionalEmailsConsent: z.boolean().optional().default(false),
  acceptTerms: z.boolean().optional().default(false),
});

// ==========================================
// Type exports
// ==========================================

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
export type MobileCompleteProfileInput = z.infer<typeof mobileCompleteProfileSchema>;
