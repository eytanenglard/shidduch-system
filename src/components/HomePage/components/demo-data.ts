// src/components/HomePage/components/demo-data.ts

import type { Locale } from '../../../../i18n-config';
import type { ExtendedMatchSuggestion, PartyInfo } from '@/components/suggestions/types';
import type { QuestionnaireResponse as QuestionnaireResponseType } from '@/types/next-auth';
import type { AiSuggestionAnalysisResult } from '@/lib/services/aiService';
import { ReligiousJourney, ServiceType, Gender, AvailabilityStatus, KippahType } from '@prisma/client';

const getDemoContent = async (locale: Locale) => {
  if (locale === 'en') {
    return await import('./demo-content/en');
  }
  return await import('./demo-content/he');
};

export const generateDemoData = async (locale: Locale) => {
  const content = await getDemoContent(locale);
  const { femaleProfileContent, maleProfileContent, suggestionContent, aiAnalysisContent, matchmakerContent } = content;
  
  // Directly use the hardcoded formattedAnswers from the content files
  const noaQuestionnaireResponse: QuestionnaireResponseType = {
    id: 'qr-demo-noa-updated', userId: 'demo-profile-noa',
    personalityAnswers: {}, // Raw answers aren't critical as we have formattedAnswers
    valuesAnswers: {},
    relationshipAnswers: {},
    partnerAnswers: {},
    religionAnswers: {},
    valuesCompleted: true, personalityCompleted: true, relationshipCompleted: true, partnerCompleted: true, religionCompleted: true,
    worldsCompleted: ['VALUES', 'RELATIONSHIP', 'PARTNER', 'PERSONALITY', 'RELIGION'],
    completed: true, startedAt: new Date(), completedAt: new Date(), lastSaved: new Date(), createdAt: new Date(), updatedAt: new Date(),
    formattedAnswers: femaleProfileContent.formattedAnswers,
  };

  const danielQuestionnaireResponse: QuestionnaireResponseType = {
    id: 'qr-demo-daniel-updated', userId: 'demo-profile-daniel',
    personalityAnswers: {},
    valuesAnswers: {},
    relationshipAnswers: {},
    partnerAnswers: {},
    religionAnswers: {},
    valuesCompleted: true, personalityCompleted: true, relationshipCompleted: true, partnerCompleted: true, religionCompleted: true,
    worldsCompleted: ['VALUES', 'PERSONALITY', 'PARTNER', 'RELATIONSHIP', 'RELIGION'],
    completed: true, startedAt: new Date(), completedAt: new Date(), lastSaved: new Date(), createdAt: new Date(), updatedAt: new Date(),
    formattedAnswers: maleProfileContent.formattedAnswers,
  };
  
  const noaProfile: PartyInfo = {
    id: 'demo-profile-noa', email: 'noa.demo@example.com', firstName: femaleProfileContent.firstName, lastName: femaleProfileContent.lastName, isProfileComplete: true,
    images: [
        { id: 'img1', url: 'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753967771/IMG-20250731-WA0077_ekb71p.jpg', isMain: true, userId: 'demo-profile-noa', createdAt: new Date(), updatedAt: new Date(), cloudinaryPublicId: null },
        { id: 'img2', url: 'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753967772/IMG-20250731-WA0078_l5mhu1.jpg', isMain: false, userId: 'demo-profile-noa', createdAt: new Date(), updatedAt: new Date(), cloudinaryPublicId: null },
        { id: 'img3', url: 'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753967770/IMG-20250731-WA0076_wy6uhe.jpg', isMain: false, userId: 'demo-profile-noa', createdAt: new Date(), updatedAt: new Date(), cloudinaryPublicId: null },
    ],
    profile: {
      id: 'profile-noa-demo', userId: 'demo-profile-noa', gender: Gender.FEMALE, birthDate: new Date('1996-05-15T00:00:00.000Z'), height: 168, maritalStatus: 'single',
      occupation: femaleProfileContent.occupation, education: femaleProfileContent.education, city: femaleProfileContent.city, religiousLevel: femaleProfileContent.religiousLevel,
      shomerNegiah: false, serviceType: ServiceType.NATIONAL_SERVICE_TWO_YEARS, serviceDetails: femaleProfileContent.serviceDetails, about: femaleProfileContent.about,
      profileHeadline: femaleProfileContent.profileHeadline, birthDateIsApproximate: false, nativeLanguage: 'עברית', educationLevel: 'academic_ba', origin: 'מעורב (אשכנזי-מזרחי)',
      religiousJourney: ReligiousJourney.BORN_INTO_CURRENT_LIFESTYLE, additionalLanguages: ['אנגלית'], hasChildrenFromPrevious: false, createdAt: new Date(), updatedAt: new Date(),
      headCovering: null, kippahType: null, manualEntryText: null, profileCharacterTraits: ['optimistic', 'creative', 'empathetic'], profileHobbies: ['travel', 'reading', 'art_crafts'],
      aliyaCountry: null, aliyaYear: null, humorStory: 'Humor story', inspiringCoupleStory: 'Inspiring couple story', influentialRabbi: 'Influential rabbi',
      parentStatus: 'נשואים באושר', fatherOccupation: 'יועץ פיננסי', motherOccupation: 'אמנית ובעלת סטודיו לקרמיקה', siblings: 2, position: 2,
      hasMedicalInfo: false, isMedicalInfoVisible: false, medicalInfoDetails: null, medicalInfoDisclosureTiming: null, preferredAgeMin: 28, preferredAgeMax: 35,
      preferredHeightMin: 175, preferredHeightMax: 190, preferredReligiousLevels: ['dati_leumi_liberal', 'masorti_strong'], preferredLocations: ['תל אביב', 'רמת גן', 'גבעתיים'],
      preferredEducation: ['academic_ba'], preferredOccupations: [], contactPreference: 'both', preferredHasChildrenFromPrevious: false, preferredMaritalStatuses: ['single'],
      preferredShomerNegiah: 'flexible', preferredPartnerHasChildren: 'no_preferred', preferredOrigins: [], preferredServiceTypes: [], preferredHeadCoverings: [],
      preferredKippahTypes: [], preferredCharacterTraits: [], preferredHobbies: [], preferredAliyaStatus: 'no_preference', preferredReligiousJourneys: [],
      isProfileVisible: true, preferredMatchmakerGender: null, matchingNotes: '', verifiedBy: null, availabilityStatus: AvailabilityStatus.AVAILABLE,
      availabilityNote: null, availabilityUpdatedAt: null, lastActive: null, hasViewedProfilePreview: false, needsAiProfileUpdate: false,
    },
    questionnaireResponses: [noaQuestionnaireResponse],
  };

  const danielProfile: PartyInfo = {
    id: 'demo-profile-daniel', email: 'daniel.demo@example.com', firstName: maleProfileContent.firstName, lastName: maleProfileContent.lastName, isProfileComplete: true,
    images: [
        { id: 'img1m', url: 'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753967649/IMG-20250731-WA0059_mqskdw.jpg', isMain: true, userId: 'demo-profile-daniel', createdAt: new Date(), updatedAt: new Date(), cloudinaryPublicId: null },
        { id: 'img2m', url: 'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753967649/IMG-20250731-WA0060_ia8nka.jpg', isMain: false, userId: 'demo-profile-daniel', createdAt: new Date(), updatedAt: new Date(), cloudinaryPublicId: null },
        { id: 'img3m', url: 'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753967649/IMG-20250731-WA0061_aug5ix.jpg', isMain: false, userId: 'demo-profile-daniel', createdAt: new Date(), updatedAt: new Date(), cloudinaryPublicId: null },
    ],
    profile: {
      id: 'profile-daniel-demo', userId: 'demo-profile-daniel', gender: Gender.MALE, birthDate: new Date('1994-08-20T00:00:00.000Z'), height: 182, maritalStatus: 'single',
      occupation: maleProfileContent.occupation, education: maleProfileContent.education, city: maleProfileContent.city, religiousLevel: maleProfileContent.religiousLevel,
      shomerNegiah: true, serviceType: ServiceType.MILITARY_OFFICER, serviceDetails: maleProfileContent.serviceDetails, about: maleProfileContent.about, profileHeadline: maleProfileContent.profileHeadline,
      birthDateIsApproximate: false, nativeLanguage: 'עברית', additionalLanguages: ['אנגלית'], educationLevel: 'academic_student', origin: 'אנגלו-סקסי',
      religiousJourney: ReligiousJourney.BORN_INTO_CURRENT_LIFESTYLE, kippahType: KippahType.KNITTED_SMALL, hasChildrenFromPrevious: false, createdAt: new Date(), updatedAt: new Date(),
      headCovering: null, manualEntryText: null, profileCharacterTraits: ['driven', 'honest', 'family_oriented'], profileHobbies: ['travel', 'music_playing_instrument'],
      aliyaCountry: 'ארה"ב', aliyaYear: 2004, humorStory: 'Humor story', inspiringCoupleStory: 'Inspiring couple story', influentialRabbi: 'Influential rabbi',
      parentStatus: 'נשואים', fatherOccupation: 'מהנדס תוכנה', motherOccupation: 'רופאת משפחה', siblings: 3, position: 2,
      hasMedicalInfo: false, isMedicalInfoVisible: false, medicalInfoDetails: null, medicalInfoDisclosureTiming: null, preferredAgeMin: 26, preferredAgeMax: 32,
      preferredHeightMin: 160, preferredHeightMax: 175, preferredReligiousLevels: ['dati_leumi_torani', 'dati_leumi_standard'], preferredLocations: ['ירושלים והסביבה'],
      preferredEducation: [], preferredOccupations: [], contactPreference: 'matchmaker', preferredHasChildrenFromPrevious: false, preferredMaritalStatuses: ['single'],
      preferredShomerNegiah: 'yes', preferredPartnerHasChildren: 'no_preferred', preferredOrigins: [], preferredServiceTypes: [], preferredHeadCoverings: [],
      preferredKippahTypes: [], preferredCharacterTraits: [], preferredHobbies: [], preferredAliyaStatus: 'no_preference', preferredReligiousJourneys: [],
      isProfileVisible: true, preferredMatchmakerGender: null, matchingNotes: '', verifiedBy: null, availabilityStatus: AvailabilityStatus.AVAILABLE,
      availabilityNote: null, availabilityUpdatedAt: null, lastActive: null, hasViewedProfilePreview: false, needsAiProfileUpdate: false,
    },
    questionnaireResponses: [danielQuestionnaireResponse],
  };

  const baseFirstParty: PartyInfo = {
    id: 'visitor-user-id', email: 'visitor@example.com',
    firstName: locale === 'he' ? 'המשתמש/ת' : 'Our', lastName: locale === 'he' ? 'שלנו' : 'User',
    isProfileComplete: true, profile: null, images: [], questionnaireResponses: [],
  };

  const demoSuggestionDataMale: ExtendedMatchSuggestion = {
    id: 'demo-suggestion-homepage-male', firstPartyId: 'visitor-user-id', secondPartyId: 'demo-profile-daniel', status: 'PENDING_FIRST_PARTY', priority: 'HIGH',
    matchingReason: suggestionContent.femaleToMaleReason, firstPartyNotes: suggestionContent.femaleToMalePersonalNote, secondPartyNotes: null,
    internalNotes: null, followUpNotes: null, responseDeadline: null,     matchmaker: { firstName: matchmakerContent.eytan.firstName, lastName: matchmakerContent.eytan.lastName },
    secondParty: danielProfile, firstParty: baseFirstParty, matchmakerId: 'matchmaker-demo-2', createdAt: new Date(), updatedAt: new Date(),
    lastActivity: new Date(), category: 'ACTIVE', decisionDeadline: new Date(), lastStatusChange: new Date(), previousStatus: 'DRAFT',
    firstPartySent: new Date(), firstPartyResponded: null, secondPartySent: null, secondPartyResponded: null, firstMeetingScheduled: null, closedAt: null,
    statusHistory: [],
  };

  const demoSuggestionDataFemale: ExtendedMatchSuggestion = {
    id: 'demo-suggestion-homepage-female', firstPartyId: 'visitor-user-id', secondPartyId: 'demo-profile-noa', status: 'PENDING_FIRST_PARTY', priority: 'HIGH',
    matchingReason: suggestionContent.maleToFemaleReason, firstPartyNotes: suggestionContent.maleToFemalePersonalNote, secondPartyNotes: null,
    internalNotes: null, followUpNotes: null, responseDeadline: null,  matchmaker: { firstName: matchmakerContent.dina.firstName, lastName: matchmakerContent.dina.lastName },
    secondParty: noaProfile, firstParty: baseFirstParty, matchmakerId: 'matchmaker-demo', createdAt: new Date(), updatedAt: new Date(),
    lastActivity: new Date(), category: 'ACTIVE', decisionDeadline: new Date(), lastStatusChange: new Date(), previousStatus: 'DRAFT',
    firstPartySent: new Date(), firstPartyResponded: null, secondPartySent: null, secondPartyResponded: null, firstMeetingScheduled: null, closedAt: null,
    statusHistory: [],
  };
  
  const demoAiAnalysisForDaniel: AiSuggestionAnalysisResult = {
    overallScore: 91, matchTitle: aiAnalysisContent.forMaleTitle, matchSummary: aiAnalysisContent.forMaleSummary,
    compatibilityPoints: [], pointsToConsider: [], suggestedConversationStarters: [],
  };

  const demoAiAnalysisForNoa: AiSuggestionAnalysisResult = {
    overallScore: 91, matchTitle: aiAnalysisContent.forFemaleTitle, matchSummary: aiAnalysisContent.forFemaleSummary,
    compatibilityPoints: [], pointsToConsider: [], suggestedConversationStarters: [],
  };

  return { demoSuggestionDataFemale, demoSuggestionDataMale, demoAiAnalysisForDaniel, demoAiAnalysisForNoa };
};