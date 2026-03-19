// src/components/profile/utils/index.ts

// Original utils (moved from utils.ts)
export { calculateAge, formatProfileData, validateProfileData } from './profileUtils';

// New extracted utilities
export {
  formatEnumValue,
  getInitials,
  calculateProfileAge,
  formatAvailabilityStatus,
  formatBooleanPreference,
} from './formatters';

export {
  createMaritalStatusMap,
  createReligiousLevelMap,
  createReligiousJourneyMap,
  createEducationLevelMap,
  createServiceTypeMap,
  createHeadCoveringMap,
  createKippahTypeMap,
  createCharacterTraitMap,
  createHobbiesMap,
  createContactPreferenceMap,
} from './maps';
