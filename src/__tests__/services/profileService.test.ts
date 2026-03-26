import { describe, it, expect } from 'vitest';
import {
  toNumberOrNull,
  toRequiredDate,
  toDateOrNull,
  emptyStringToNull,
  buildProfileResponse,
} from '@/lib/services/profileService';

// --- Helper function tests ---

describe('toNumberOrNull', () => {
  it('should convert valid number string', () => {
    expect(toNumberOrNull('42')).toBe(42);
  });

  it('should convert number value', () => {
    expect(toNumberOrNull(170)).toBe(170);
  });

  it('should return null for null/undefined', () => {
    expect(toNumberOrNull(null)).toBeNull();
    expect(toNumberOrNull(undefined)).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(toNumberOrNull('')).toBeNull();
    expect(toNumberOrNull('  ')).toBeNull();
  });

  it('should return null for non-numeric string', () => {
    expect(toNumberOrNull('abc')).toBeNull();
  });

  it('should handle zero', () => {
    expect(toNumberOrNull(0)).toBe(0);
    expect(toNumberOrNull('0')).toBe(0);
  });

  it('should handle decimal numbers', () => {
    expect(toNumberOrNull('3.14')).toBe(3.14);
  });
});

describe('toRequiredDate', () => {
  it('should convert valid date string', () => {
    const result = toRequiredDate('2000-01-15', 'birthDate');
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2000);
  });

  it('should pass through Date object', () => {
    const date = new Date('2000-06-15');
    const result = toRequiredDate(date, 'birthDate');
    expect(result).toBe(date);
  });

  it('should throw for null', () => {
    expect(() => toRequiredDate(null, 'birthDate')).toThrow("Required date field 'birthDate' is missing or empty.");
  });

  it('should throw for undefined', () => {
    expect(() => toRequiredDate(undefined, 'birthDate')).toThrow("Required date field 'birthDate'");
  });

  it('should throw for empty string', () => {
    expect(() => toRequiredDate('', 'birthDate')).toThrow();
  });

  it('should throw for invalid date string', () => {
    expect(() => toRequiredDate('not-a-date', 'birthDate')).toThrow("Invalid date value");
  });
});

describe('toDateOrNull', () => {
  it('should convert valid date string', () => {
    const result = toDateOrNull('2024-03-15');
    expect(result).toBeInstanceOf(Date);
  });

  it('should return null for null/undefined/empty', () => {
    expect(toDateOrNull(null)).toBeNull();
    expect(toDateOrNull(undefined)).toBeNull();
    expect(toDateOrNull('')).toBeNull();
  });

  it('should return null for invalid date', () => {
    expect(toDateOrNull('not-a-date')).toBeNull();
  });

  it('should pass through valid Date object', () => {
    const date = new Date('2024-01-01');
    expect(toDateOrNull(date)).toBe(date);
  });

  it('should return null for invalid Date object', () => {
    expect(toDateOrNull(new Date('invalid'))).toBeNull();
  });
});

describe('emptyStringToNull', () => {
  it('should return null for empty string', () => {
    expect(emptyStringToNull('')).toBeNull();
  });

  it('should return null for null/undefined', () => {
    expect(emptyStringToNull(null)).toBeNull();
    expect(emptyStringToNull(undefined)).toBeNull();
  });

  it('should return the string for non-empty values', () => {
    expect(emptyStringToNull('hello')).toBe('hello');
  });
});

// --- buildProfileResponse tests ---

const makeDbProfile = (overrides = {}) => ({
  id: 'profile-1',
  userId: 'user-1',
  gender: 'MALE',
  birthDate: new Date('1995-06-15'),
  birthDateIsApproximate: false,
  height: 175,
  city: 'Jerusalem',
  origin: 'Israel',
  aliyaCountry: '',
  aliyaYear: null,
  about: 'Some bio text',
  isAboutVisible: true,
  profileHeadline: null,
  profileCharacterTraits: ['HONEST', 'KIND'],
  profileHobbies: ['READING'],
  religiousLevel: 'DATI_LEUMI',
  educationLevel: 'BACHELORS',
  education: 'CS',
  occupation: 'Developer',
  serviceType: 'ARMY',
  serviceDetails: 'Combat',
  matchingNotes: '',
  internalMatchmakerNotes: '',
  testimonials: [],
  isProfileVisible: true,
  availabilityStatus: 'AVAILABLE',
  availabilityNote: '',
  availabilityUpdatedAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-06-01'),
  contentUpdatedAt: null,
  lastActive: null,
  hasViewedProfilePreview: false,
  needsAiProfileUpdate: false,
  hasMedicalInfo: true,
  medicalInfoDetails: 'Allergy to peanuts',
  medicalInfoDisclosureTiming: 'FIRST_DATE',
  isMedicalInfoVisible: false,
  cvUrl: null,
  cvSummary: null,
  aiProfileSummary: null,
  priorityScore: null,
  priorityCategory: null,
  redFlags: [],
  greenFlags: [],
  difficultyScore: null,
  readinessLevel: null,
  missingFields: [],
  preferredAgeMin: 22,
  preferredAgeMax: 28,
  preferredHeightMin: null,
  preferredHeightMax: null,
  preferredReligiousLevels: ['DATI_LEUMI'],
  preferredLocations: [],
  preferredEducation: [],
  preferredOccupations: [],
  preferredMaritalStatuses: [],
  preferredOrigins: [],
  preferredServiceTypes: [],
  preferredHeadCoverings: [],
  preferredKippahTypes: [],
  preferredCharacterTraits: [],
  preferredHobbies: [],
  preferredEthnicBackgrounds: [],
  preferredReligiousJourneys: [],
  nativeLanguage: null,
  additionalLanguages: [],
  maritalStatus: null,
  hasChildrenFromPrevious: null,
  parentStatus: null,
  fatherOccupation: '',
  motherOccupation: '',
  siblings: null,
  position: null,
  religiousJourney: null,
  shomerNegiah: null,
  smokingStatus: null,
  preferredSmokingStatus: null,
  headCovering: null,
  kippahType: null,
  inspiringCoupleStory: null,
  influentialRabbi: null,
  manualEntryText: null,
  isNeshamaTechSummaryVisible: true,
  isFriendsSectionVisible: true,
  contactPreference: null,
  preferredMatchmakerGender: null,
  preferredShomerNegiah: null,
  preferredPartnerHasChildren: null,
  preferredAliyaStatus: null,
  verifiedBy: null,
  ...overrides,
});

const makeUser = (overrides = {}) => ({
  id: 'user-1',
  firstName: 'David',
  lastName: 'Cohen',
  email: 'david@example.com',
  phone: '+972501234567',
  isProfileComplete: true,
  ...overrides,
});

describe('buildProfileResponse', () => {
  it('should build a complete profile response', () => {
    const dbProfile = makeDbProfile();
    const user = makeUser();
    const result = buildProfileResponse(dbProfile, user);

    expect(result.id).toBe('profile-1');
    expect(result.userId).toBe('user-1');
    expect(result.gender).toBe('MALE');
    expect(result.city).toBe('Jerusalem');
    expect(result.user.firstName).toBe('David');
    expect(result.user.email).toBe('david@example.com');
    expect(result.isProfileComplete).toBe(true);
  });

  it('should hide medical info details when not owner and not visible', () => {
    const dbProfile = makeDbProfile({
      hasMedicalInfo: true,
      medicalInfoDetails: 'Secret medical info',
      isMedicalInfoVisible: false,
    });
    const user = makeUser();
    const result = buildProfileResponse(dbProfile, user, { isOwner: false });

    expect(result.hasMedicalInfo).toBeDefined();
    expect(result.medicalInfoDetails).toBeUndefined();
  });

  it('should show medical info details when owner', () => {
    const dbProfile = makeDbProfile({
      hasMedicalInfo: true,
      medicalInfoDetails: 'Secret medical info',
      isMedicalInfoVisible: false,
    });
    const user = makeUser();
    const result = buildProfileResponse(dbProfile, user, { isOwner: true });

    expect(result.medicalInfoDetails).toBe('Secret medical info');
  });

  it('should show medical info when isMedicalInfoVisible is true', () => {
    const dbProfile = makeDbProfile({
      hasMedicalInfo: true,
      medicalInfoDetails: 'Visible info',
      isMedicalInfoVisible: true,
    });
    const user = makeUser();
    const result = buildProfileResponse(dbProfile, user, { isOwner: false });

    expect(result.medicalInfoDetails).toBe('Visible info');
  });

  it('should include phone only when provided', () => {
    const withPhone = buildProfileResponse(makeDbProfile(), makeUser({ phone: '+972501234567' }));
    expect(withPhone.user.phone).toBe('+972501234567');

    const withoutPhone = buildProfileResponse(makeDbProfile(), makeUser({ phone: undefined }));
    expect('phone' in withoutPhone.user).toBe(false);
  });

  it('should default isProfileComplete to false when not provided', () => {
    const result = buildProfileResponse(
      makeDbProfile(),
      makeUser({ isProfileComplete: undefined })
    );
    expect(result.isProfileComplete).toBe(false);
  });

  it('should handle missing/null array fields', () => {
    const dbProfile = makeDbProfile({
      profileCharacterTraits: null,
      profileHobbies: null,
      preferredReligiousLevels: null,
      additionalLanguages: null,
    });
    const result = buildProfileResponse(dbProfile, makeUser());

    expect(result.profileCharacterTraits).toEqual([]);
    expect(result.profileHobbies).toEqual([]);
    expect(result.preferredReligiousLevels).toEqual([]);
    expect(result.additionalLanguages).toEqual([]);
  });

  it('should handle missing string fields with defaults', () => {
    const dbProfile = makeDbProfile({
      city: null,
      origin: null,
      about: null,
      education: null,
      occupation: null,
    });
    const result = buildProfileResponse(dbProfile, makeUser());

    expect(result.city).toBe('');
    expect(result.origin).toBe('');
    expect(result.about).toBe('');
    expect(result.education).toBe('');
    expect(result.occupation).toBe('');
  });
});
