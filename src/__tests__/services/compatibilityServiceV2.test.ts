/**
 * Tests for compatibilityServiceV2 - core matching logic.
 * Tests the pure functions (deal breakers, soft penalties, scoring)
 * without hitting the database.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Gender } from '@prisma/client';

// ───────────────────────────────────────────────────────────
// We need to test the internal functions. Since they're not exported,
// we'll import the module and also test the exported function with mocks.
// For internal functions, we re-implement the test via the public API.
// ───────────────────────────────────────────────────────────

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    profile: {
      findUnique: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

// Mock tag matching service (optional dependency)
vi.mock('@/lib/services/tagMatchingService', () => ({
  calculateTagCompatibility: vi.fn(),
  loadProfileTags: vi.fn().mockResolvedValue(null),
  getSectorGroupFromTags: vi.fn(),
}));

import prisma from '@/lib/prisma';
import { calculatePairCompatibility } from '@/lib/services/compatibilityServiceV2';

// ───────────────────────────────────────────────────────────
// Test helpers
// ───────────────────────────────────────────────────────────

function createMockProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: 'profile-1',
    userId: 'user-1',
    gender: Gender.MALE,
    birthDate: new Date('1995-06-15'),
    height: 175,
    city: 'Jerusalem',
    occupation: 'Software Engineer',
    religiousLevel: 'dati_leumi',
    religiousJourney: 'BORN_INTO_CURRENT_LIFESTYLE',
    nativeLanguage: 'Hebrew',
    additionalLanguages: ['English'],
    hasChildrenFromPrevious: false,
    smokingStatus: 'never',
    shomerNegiah: true,
    headCovering: null,
    kippahType: 'SRUGA',
    bodyType: null,
    appearanceTone: null,
    groomingStyle: null,
    preferredBodyTypes: [],
    preferredAppearanceTones: [],
    preferredGroomingStyles: [],
    preferredAgeMin: 22,
    preferredAgeMax: 30,
    preferredHeightMin: 155,
    preferredHeightMax: 175,
    preferredReligiousLevels: ['dati_leumi', 'dati_lite'],
    preferredReligiousJourneys: [],
    ...overrides,
  };
}

function createMockMetrics(overrides: Record<string, unknown> = {}) {
  return {
    profileId: 'profile-1',
    socialEnergy: 60,
    emotionalExpression: 50,
    stabilityVsSpontaneity: 55,
    independenceLevel: 65,
    optimismLevel: 70,
    religiousStrictness: 60,
    spiritualDepth: 55,
    careerOrientation: 70,
    ambitionLevel: 65,
    financialApproach: 60,
    urbanScore: 70,
    adventureScore: 50,
    nightOwlScore: 40,
    togetherVsAutonomy: 55,
    familyInvolvement: 50,
    growthVsAcceptance: 60,
    englishFluency: 70,
    appearancePickiness: 50,
    backgroundCategory: 'MODERN_ORTHODOX',
    ethnicBackground: 'ASHKENAZI',
    inferredPersonalityType: null,
    inferredAttachmentStyle: null,
    inferredLoveLanguages: [],
    dealBreakersHard: [],
    dealBreakersSoft: [],
    difficultyFlags: [],
    aiInferredDealBreakers: [],
    aiInferredMustHaves: [],
    metricsExplanations: {},
    prefSocialEnergyMin: 30,
    prefSocialEnergyMax: 80,
    prefSocialEnergyWeight: 5,
    prefEmotionalExpressionMin: 20,
    prefEmotionalExpressionMax: 80,
    prefEmotionalExpressionWeight: 5,
    prefStabilityMin: 30,
    prefStabilityMax: 80,
    prefStabilityWeight: 5,
    prefReligiousStrictnessMin: 40,
    prefReligiousStrictnessMax: 80,
    prefReligiousStrictnessWeight: 8,
    prefSpiritualDepthMin: 30,
    prefSpiritualDepthMax: 80,
    prefSpiritualDepthWeight: 5,
    prefCareerOrientationMin: 30,
    prefCareerOrientationMax: 90,
    prefCareerOrientationWeight: 5,
    prefAmbitionMin: 30,
    prefAmbitionMax: 80,
    prefAmbitionWeight: 4,
    prefFinancialMin: 30,
    prefFinancialMax: 80,
    prefFinancialWeight: 4,
    prefUrbanScoreMin: 40,
    prefUrbanScoreMax: 90,
    prefUrbanScoreWeight: 4,
    prefAdventureScoreMin: 20,
    prefAdventureScoreMax: 80,
    prefAdventureScoreWeight: 3,
    prefNightOwlMin: 10,
    prefNightOwlMax: 70,
    prefNightOwlWeight: 2,
    prefTogetherVsAutonomyMin: 30,
    prefTogetherVsAutonomyMax: 80,
    prefTogetherVsAutonomyWeight: 5,
    prefFamilyInvolvementMin: 20,
    prefFamilyInvolvementMax: 80,
    prefFamilyInvolvementWeight: 4,
    prefGrowthVsAcceptanceMin: 30,
    prefGrowthVsAcceptanceMax: 80,
    prefGrowthVsAcceptanceWeight: 3,
    socioEconomicLevel: null,
    jobSeniorityLevel: null,
    educationLevelScore: null,
    prefSocioEconomicMin: null,
    prefSocioEconomicMax: null,
    prefJobSeniorityMin: null,
    prefEducationMin: null,
    ...overrides,
  };
}

function setupMocks(
  profileA: Record<string, unknown>,
  profileB: Record<string, unknown>,
  metricsA: Record<string, unknown>,
  metricsB: Record<string, unknown>
) {
  const mockFindUnique = vi.mocked(prisma.profile.findUnique);
  mockFindUnique.mockImplementation(async ({ where }: { where: { id: string } }) => {
    if (where.id === 'profile-a') return profileA as any;
    if (where.id === 'profile-b') return profileB as any;
    return null;
  });

  const mockQueryRaw = vi.mocked(prisma.$queryRaw);
  mockQueryRaw.mockImplementation(async (query: any) => {
    const queryStr = String(query);
    // Metrics query
    if (queryStr.includes('profile_metrics')) {
      if (queryStr.includes('profile-a')) return [metricsA];
      if (queryStr.includes('profile-b')) return [metricsB];
    }
    // Vector similarity query
    if (queryStr.includes('profile_vectors')) {
      return [];
    }
    return [];
  });
}

// ───────────────────────────────────────────────────────────
// Tests
// ───────────────────────────────────────────────────────────

describe('calculatePairCompatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw when profile not found', async () => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

    await expect(
      calculatePairCompatibility('profile-a', 'profile-b')
    ).rejects.toThrow('One or both profiles not found');
  });

  it('should return score 0 when same gender (deal breaker)', async () => {
    const maleA = createMockProfile({ id: 'profile-a', userId: 'user-a', gender: Gender.MALE });
    const maleB = createMockProfile({ id: 'profile-b', userId: 'user-b', gender: Gender.MALE });
    const metricsA = createMockMetrics({ profileId: 'profile-a' });
    const metricsB = createMockMetrics({ profileId: 'profile-b' });

    setupMocks(maleA, maleB, metricsA, metricsB);

    const result = await calculatePairCompatibility('profile-a', 'profile-b');

    expect(result.symmetricScore).toBe(0);
    expect(result.recommendation).toBe('BLOCKED');
    expect(result.breakdownAtoB.failedDealBreakers).toContain('SAME_GENDER');
  });

  it('should return valid scores for compatible male-female pair', async () => {
    const male = createMockProfile({
      id: 'profile-a', userId: 'user-a', gender: Gender.MALE,
      preferredReligiousLevels: ['dati_leumi', 'dati_lite'],
    });
    const female = createMockProfile({
      id: 'profile-b', userId: 'user-b', gender: Gender.FEMALE,
      birthDate: new Date('1997-03-20'),
      preferredReligiousLevels: ['dati_leumi'],
    });
    const metricsA = createMockMetrics({ profileId: 'profile-a' });
    const metricsB = createMockMetrics({ profileId: 'profile-b' });

    setupMocks(male, female, metricsA, metricsB);

    const result = await calculatePairCompatibility('profile-a', 'profile-b');

    expect(result.symmetricScore).toBeGreaterThan(0);
    expect(result.scoreAtoB).toBeGreaterThanOrEqual(0);
    expect(result.scoreBtoA).toBeGreaterThanOrEqual(0);
    expect(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']).toContain(result.recommendation);
  });

  it('should detect age deal breaker when candidate too young', async () => {
    const male = createMockProfile({
      id: 'profile-a', userId: 'user-a', gender: Gender.MALE,
      preferredAgeMin: 25, preferredAgeMax: 30,
    });
    const female = createMockProfile({
      id: 'profile-b', userId: 'user-b', gender: Gender.FEMALE,
      birthDate: new Date('2005-01-01'), // ~21 years old
      preferredReligiousLevels: ['dati_leumi'],
    });
    const metricsA = createMockMetrics({ profileId: 'profile-a' });
    const metricsB = createMockMetrics({ profileId: 'profile-b' });

    setupMocks(male, female, metricsA, metricsB);

    const result = await calculatePairCompatibility('profile-a', 'profile-b');

    expect(result.breakdownAtoB.failedDealBreakers.some(
      (f: string) => f.includes('AGE_TOO_YOUNG')
    )).toBe(true);
    expect(result.scoreAtoB).toBe(0);
  });

  it('should detect age deal breaker when candidate too old', async () => {
    const male = createMockProfile({
      id: 'profile-a', userId: 'user-a', gender: Gender.MALE,
      preferredAgeMin: 22, preferredAgeMax: 26,
    });
    const female = createMockProfile({
      id: 'profile-b', userId: 'user-b', gender: Gender.FEMALE,
      birthDate: new Date('1990-01-01'), // ~36 years old
      preferredReligiousLevels: ['dati_leumi'],
    });
    const metricsA = createMockMetrics({ profileId: 'profile-a' });
    const metricsB = createMockMetrics({ profileId: 'profile-b' });

    setupMocks(male, female, metricsA, metricsB);

    const result = await calculatePairCompatibility('profile-a', 'profile-b');

    expect(result.breakdownAtoB.failedDealBreakers.some(
      (f: string) => f.includes('AGE_TOO_OLD')
    )).toBe(true);
    expect(result.scoreAtoB).toBe(0);
  });

  it('should apply height soft penalty', async () => {
    const male = createMockProfile({
      id: 'profile-a', userId: 'user-a', gender: Gender.MALE,
      preferredHeightMin: 165, preferredHeightMax: 175,
    });
    const female = createMockProfile({
      id: 'profile-b', userId: 'user-b', gender: Gender.FEMALE,
      height: 155, // 10cm below min
      birthDate: new Date('1997-03-20'),
      preferredReligiousLevels: ['dati_leumi'],
    });
    const metricsA = createMockMetrics({ profileId: 'profile-a' });
    const metricsB = createMockMetrics({ profileId: 'profile-b' });

    setupMocks(male, female, metricsA, metricsB);

    const result = await calculatePairCompatibility('profile-a', 'profile-b');

    expect(result.breakdownAtoB.softPenalties).toBeGreaterThan(0);
    expect(result.breakdownAtoB.appliedSoftPenalties.some(
      (p: { type: string }) => p.type.includes('HEIGHT_SHORT')
    )).toBe(true);
  });

  it('should apply language barrier penalty when English-only meets non-English speaker', async () => {
    const male = createMockProfile({
      id: 'profile-a', userId: 'user-a', gender: Gender.MALE,
      nativeLanguage: 'English',
      additionalLanguages: [],
    });
    const female = createMockProfile({
      id: 'profile-b', userId: 'user-b', gender: Gender.FEMALE,
      nativeLanguage: 'Hebrew',
      additionalLanguages: [],
      birthDate: new Date('1997-03-20'),
      preferredReligiousLevels: ['dati_leumi'],
    });
    const metricsA = createMockMetrics({ profileId: 'profile-a', englishFluency: 95 });
    const metricsB = createMockMetrics({ profileId: 'profile-b', englishFluency: 20 });

    setupMocks(male, female, metricsA, metricsB);

    const result = await calculatePairCompatibility('profile-a', 'profile-b');

    expect(result.breakdownAtoB.appliedSoftPenalties.some(
      (p: { type: string }) => p.type.includes('LANGUAGE')
    )).toBe(true);
  });

  it('should work in one-directional mode', async () => {
    const male = createMockProfile({
      id: 'profile-a', userId: 'user-a', gender: Gender.MALE,
    });
    const female = createMockProfile({
      id: 'profile-b', userId: 'user-b', gender: Gender.FEMALE,
      birthDate: new Date('1997-03-20'),
      preferredReligiousLevels: ['dati_leumi'],
    });
    const metricsA = createMockMetrics({ profileId: 'profile-a' });
    const metricsB = createMockMetrics({ profileId: 'profile-b' });

    setupMocks(male, female, metricsA, metricsB);

    const result = await calculatePairCompatibility('profile-a', 'profile-b', {
      oneDirectional: true,
    });

    expect(result.scoreAtoB).toBe(result.scoreBtoA);
    expect(result.symmetricScore).toBe(result.scoreAtoB);
  });

  it('should detect religious incompatibility deal breaker', async () => {
    const male = createMockProfile({
      id: 'profile-a', userId: 'user-a', gender: Gender.MALE,
      religiousLevel: 'charedi_litai',
      preferredReligiousLevels: ['charedi_litai', 'charedi_hasidi'],
    });
    const female = createMockProfile({
      id: 'profile-b', userId: 'user-b', gender: Gender.FEMALE,
      religiousLevel: 'secular',
      birthDate: new Date('1997-03-20'),
      preferredReligiousLevels: ['secular', 'masorti'],
    });
    const metricsA = createMockMetrics({ profileId: 'profile-a' });
    const metricsB = createMockMetrics({ profileId: 'profile-b' });

    setupMocks(male, female, metricsA, metricsB);

    const result = await calculatePairCompatibility('profile-a', 'profile-b');

    // Should have religious deal breakers
    const hasReligiousDealBreaker = result.breakdownAtoB.failedDealBreakers.some(
      (f: string) => f.includes('RELIGIOUS')
    );
    expect(hasReligiousDealBreaker).toBe(true);
  });

  it('should return default score 50 when no metrics available', async () => {
    const male = createMockProfile({
      id: 'profile-a', userId: 'user-a', gender: Gender.MALE,
      preferredReligiousLevels: [],
    });
    const female = createMockProfile({
      id: 'profile-b', userId: 'user-b', gender: Gender.FEMALE,
      birthDate: new Date('1997-03-20'),
      preferredReligiousLevels: [],
      religiousLevel: 'dati_leumi',
    });

    vi.mocked(prisma.profile.findUnique).mockImplementation(async ({ where }: any) => {
      if (where.id === 'profile-a') return male as any;
      if (where.id === 'profile-b') return female as any;
      return null;
    });

    vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

    const result = await calculatePairCompatibility('profile-a', 'profile-b');

    // With no metrics, should still get a score (default 50 for metrics)
    expect(result.symmetricScore).toBeGreaterThanOrEqual(0);
    expect(result.breakdownAtoB.metricsScore).toBe(50);
  });
});
