// src/components/HomePage/components/demo-data.ts

import type { Locale } from '../../../../i18n-config';
import type { ExtendedMatchSuggestion, PartyInfo } from '@/components/suggestions/types';
import type { QuestionnaireResponse as QuestionnaireResponseType } from '@/types/next-auth';
import type { AiSuggestionAnalysisResult } from '@/lib/services/aiService';
import { ReligiousJourney, ServiceType, Gender, AvailabilityStatus, KippahType, TestimonialStatus, SubmissionSource } from '@prisma/client';

const getDemoContent = async (locale: Locale) => {
  if (locale === 'en') {
    return await import('./demo-content/en');
  }
  return await import('./demo-content/he');
};

export const generateDemoData = async (locale: Locale) => {
  const content = await getDemoContent(locale);
  const { femaleProfileContent, maleProfileContent, suggestionContent, aiAnalysisContent, matchmakerContent } = content;
  const isHebrew = locale === 'he';

  const noaQuestionnaireResponse: QuestionnaireResponseType = {
    id: 'qr-demo-noa-updated', userId: 'demo-profile-noa',
    personalityAnswers: {}, 
    valuesAnswers: {},
    relationshipAnswers: {},
    partnerAnswers: {},
    religionAnswers: {},
    valuesCompleted: true, personalityCompleted: true, relationshipCompleted: true, partnerCompleted: true, religionCompleted: true,
    worldsCompleted: ['VALUES', 'RELATIONSHIP', 'PARTNER', 'PERSONALITY', 'RELIGION'],
    completed: true, startedAt: new Date(), completedAt: new Date(), lastSaved: new Date(), createdAt: new Date(), updatedAt: new Date(),
    formattedAnswers: femaleProfileContent.formattedAnswers,
        currentQuestionIndices: {
      PERSONALITY: 0,
      VALUES: 0,
      RELATIONSHIP: 0,
      PARTNER: 0,
      RELIGION: 0,
    },

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
    currentQuestionIndices: {
      PERSONALITY: 0,
      VALUES: 0,
      RELATIONSHIP: 0,
      PARTNER: 0,
      RELIGION: 0,
    },
  };
  
  const noaProfile: PartyInfo = {
    id: 'demo-profile-noa', email: 'noa.demo@example.com', firstName: femaleProfileContent.firstName, lastName: femaleProfileContent.lastName, isProfileComplete: true,
    images: [
        { id: 'img1', url: 'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753967771/IMG-20250731-WA0077_ekb71p.jpg', isMain: true, userId: 'demo-profile-noa', createdAt: new Date(), updatedAt: new Date(), cloudinaryPublicId: null },
        { id: 'img2', url: 'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753967772/IMG-20250731-WA0078_l5mhu1.jpg', isMain: false, userId: 'demo-profile-noa', createdAt: new Date(), updatedAt: new Date(), cloudinaryPublicId: null },
        { id: 'img3', url: 'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753967770/IMG-20250731-WA0076_wy6uhe.jpg', isMain: false, userId: 'demo-profile-noa', createdAt: new Date(), updatedAt: new Date(), cloudinaryPublicId: null },
    ],
    profile: {
      id: 'profile-noa-demo', userId: 'demo-profile-noa', gender: Gender.FEMALE, birthDate: new Date('1996-05-15T00:00:00.000Z'), height: 168, maritalStatus: 'רווקה',
      occupation: femaleProfileContent.occupation, education: femaleProfileContent.education, city: femaleProfileContent.city, religiousLevel: 'דתי-לאומי ליברלי',
      shomerNegiah: false, serviceType: ServiceType.NATIONAL_SERVICE_TWO_YEARS, serviceDetails: femaleProfileContent.serviceDetails, about: femaleProfileContent.about,
      profileHeadline: femaleProfileContent.profileHeadline, birthDateIsApproximate: false, nativeLanguage: 'עברית', educationLevel: 'תואר ראשון', origin: 'מעורב (אשכנזי-מזרחי)',
      religiousJourney: ReligiousJourney.BORN_INTO_CURRENT_LIFESTYLE, additionalLanguages: ['אנגלית'], hasChildrenFromPrevious: false, createdAt: new Date(), updatedAt: new Date(),
      headCovering: null, kippahType: null, 
      manualEntryText: isHebrew 
        ? 'נועה היא שילוב קסום של נפש אמנית, יצירתיות מתפרצת ולב רחב וקשוב. היא אישה שרואה את היופי בפרטים הקטנים של החיים, ומביאה איתה אופטימיות וחום לכל מקום אליו היא מגיעה.\n\nהמסע שלה שזור בחיבור עמוק לאנשים וליוצרים. החל משירות לאומי משמעותי עם ילדים בעלי צרכים מיוחדים, דרך לימודים במדרשה ועד לקריירה מצליחה כמעצבת, נועה היא אדם שמוצא משמעות בנתינה ובביטוי אישי. היא אשת שיחה מרתקת, אך גם יודעת להעריך את השקט והטבע.\n\nכעת, היא מחפשת שותף אמיתי לדרך, אדם עם טוב לב וראש פתוח, לבנות יחד בית שיהווה מרחב בטוח לצמיחה, לשיחות עומק אל תוך הלילה, ולצחוק פשוט ומתגלגל. היא שואפת לקשר המבוסס על כבוד הדדי, חברות אמת ותקשורת כנה.\n\nאנו ב-NeshamaTech רואים בנועה אישה איכותית ומרשימה, עם עומק ורגישות שנדיר למצוא.'
        : 'Noa is a captivating blend of an artist\'s soul, boundless creativity, and a deeply attentive heart. She is a woman who sees the beauty in life\'s small details and brings optimism and warmth wherever she goes.\n\nHer journey is woven from a deep connection to people and creativity. From her meaningful national service with children with special needs, through her studies at a Midrasha, to a successful career as a designer, Noa is someone who finds meaning in giving and in personal expression. She is an engaging conversationalist who also appreciates quiet, nature, and introspection.\n\nShe is now looking for a true partner for the journey—a person with kindness and an open mind, to build a home that is a safe space for growth, for deep conversations into the night, and for simple, rolling laughter. She aspires to a relationship founded on mutual respect, true friendship, and honest communication.\n\nWe at NeshamaTech see Noa as a remarkable and high-quality woman, with a depth and sensitivity that are truly rare.',
      profileCharacterTraits: ['optimistic', 'creative', 'empathetic'], profileHobbies: ['travel', 'reading', 'art_crafts'],
      aliyaCountry: null, aliyaYear: null,  
      inspiringCoupleStory: isHebrew ? 'ההורים שלי. הם מגיעים מעולמות שונים לגמרי - אבא איש כספים ריאלי ואמא אמנית ויוצרת - והם הצליחו לבנות שותפות מדהימה שמבוססת על כבוד, השלמה הדדית והמון חוש הומור. הם ההוכחה שלי שאהבה אמיתית היא גשר בין עולמות.' : 'My parents. They come from completely different worlds - my dad is a rational finance guy and my mom is an artist and creator - yet they managed to build an amazing partnership based on respect, complementing each other, and a lot of humor. They are my proof that true love bridges worlds.',
      influentialRabbi: 'הרבנית ימימה מזרחי',
      parentStatus: 'נשואים באושר', fatherOccupation: 'יועץ פיננסי', motherOccupation: 'אמנית ובעלת סטודיו לקרמיקה', siblings: 2, position: 2,
      hasMedicalInfo: false, isMedicalInfoVisible: false, medicalInfoDetails: null, medicalInfoDisclosureTiming: null, preferredAgeMin: 28, preferredAgeMax: 35,
      preferredHeightMin: 175, preferredHeightMax: 190, 
      // --- START: עדכון ערכים ---
      preferredReligiousLevels: ['דתי-לאומי ליברלי', 'דתי-לאומי תורני', 'דתי-לאומי סטנדרטי'], 
      preferredLocations: ['תל אביב', 'רמת גן', 'גבעתיים', 'ירושלים'],
      preferredEducation: ['תואר ראשון', 'תואר שני'], 
      preferredOccupations: ['הייטק', 'הנדסה', 'חינוך', 'מחקר'],
      preferredOrigins: ['אנגלו-סקסי', 'מעורב', 'צפון אפריקאי'],
      // --- END: עדכון ערכים ---
      contactPreference: 'both', preferredMaritalStatuses: ['רווק/ה'],
      preferredShomerNegiah: 'flexible', preferredPartnerHasChildren: 'no_preferred', preferredServiceTypes: [], preferredHeadCoverings: [],
      preferredKippahTypes: [], preferredCharacterTraits: [], preferredHobbies: [], preferredAliyaStatus: 'no_preference', preferredReligiousJourneys: [],
      isProfileVisible: true, preferredMatchmakerGender: null, matchingNotes: '', verifiedBy: null, availabilityStatus: AvailabilityStatus.AVAILABLE,
      availabilityNote: null, availabilityUpdatedAt: null, lastActive: null, hasViewedProfilePreview: false, needsAiProfileUpdate: false,
      isAboutVisible: true,
      isFriendsSectionVisible: true,
      isNeshamaTechSummaryVisible: true,
       cvUrl: null,
      cvSummary: null,
      testimonials: [
        {
          id: 'testimonial-noa-1',
          authorName: isHebrew ? 'יעל כהן' : 'Yael Cohen',
          relationship: isHebrew ? 'חברת ילדות' : 'Childhood Friend',
          content: isHebrew ? 'אני מכירה את נועה מאז שהיינו ילדות, ותמיד הערצתי את היכולת שלה לראות את היופי בכל דבר. היא החברה הזאת שתמיד תקשיב עד הסוף, תיתן את העצה הכי אמיתית, ואז תגרום לך לצחוק עד שיכאב. הלב הענק שלה והאופטימיות המדבקת שלה הם מתנה לכל מי שסביבה.' : 'I\'ve known Noa since we were kids, and I\'ve always admired her ability to see the beauty in everything. She\'s that friend who will always listen until the very end, give the most genuine advice, and then make you laugh until it hurts. Her huge heart and contagious optimism are a gift to everyone around her.',
          isPhoneVisibleToMatch: false,
          status: TestimonialStatus.APPROVED,
          submittedBy: SubmissionSource.FRIEND,
          createdAt: new Date(),
        },
        {
          id: 'testimonial-noa-2',
          authorName: isHebrew ? 'דוד לוי' : 'David Levi',
          relationship: isHebrew ? 'קולגה לשעבר' : 'Former Colleague',
          content: isHebrew ? 'עבדתי עם נועה על מספר פרויקטים. מעבר לכישרון העיצובי המדהים שלה, יש לה אינטליגנציה רגשית נדירה. היא יודעת להוביל, אבל תמיד בעדינות ובכבוד, וליצור סביבה שבה כולם מרגישים שותפים. היא מקצוענית אמיתית עם נשמה של אמנית.' : 'I worked with Noa on several projects. Beyond her amazing design talent, she has a rare emotional intelligence. She knows how to lead, but always with gentleness and respect, creating an environment where everyone feels like a partner. She is a true professional with an artist\'s soul.',
          isPhoneVisibleToMatch: false,
          status: TestimonialStatus.APPROVED,
          submittedBy: SubmissionSource.FRIEND,
          createdAt: new Date(),
        },
      ],
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
      id: 'profile-daniel-demo', userId: 'demo-profile-daniel', gender: Gender.MALE, birthDate: new Date('1994-08-20T00:00:00.000Z'), height: 182, maritalStatus: 'רווק',
      occupation: maleProfileContent.occupation, education: maleProfileContent.education, city: maleProfileContent.city, religiousLevel: 'דתי-לאומי תורני',
      shomerNegiah: true, serviceType: ServiceType.MILITARY_OFFICER, serviceDetails: maleProfileContent.serviceDetails, about: maleProfileContent.about, profileHeadline: maleProfileContent.profileHeadline,
      birthDateIsApproximate: false, nativeLanguage: 'עברית', additionalLanguages: ['אנגלית'], educationLevel: 'תואר ראשון', origin: 'אנגלו-סקסי',
      religiousJourney: ReligiousJourney.BORN_INTO_CURRENT_LIFESTYLE, kippahType: KippahType.KNITTED_SMALL, hasChildrenFromPrevious: false, createdAt: new Date(), updatedAt: new Date(),
      headCovering: null, 
      manualEntryText: isHebrew 
        ? 'דניאל הוא איש של חיבורים מרתקים: בין קוד לוגי לעומק של סוגיה תלמודית, ובין אחריות של קצין קרבי לניגון חסידי מלא נשמה. הוא אדם המשלב רצינות, אמינות ושאיפה למצוינות בכל תחום בחייו.\n\nהמסלול שלו משקף אדם המשלב עשייה ומשמעות. שירותו כקצין בהנדסה קרבית עיצב בו תחושת אחריות עמוקה, בעוד שלימודיו בישיבת הר עציון ובטכניון חידדו את יכולותיו האנליטיות ואת חיבורו לעולם התורה. הוא אדם שנמצא בצמיחה מתמדת, הן אינטלקטואלית והן רוחנית.\n\nהוא שואף לבנות בית של תורה ושמחה, המבוסס על שותפות אמת, צמיחה הדדית ופתיחות מחשבתית. הוא מחפש אישה אינטליגנטית וערכית, שתהיה לו חברה לשיח, שותפה לאתגרים, וביחד יבנו עולם מלא בטוב ובמשמעות.\n\nב-NeshamaTech, אנו מתרשמים מהשילוב הנדיר של רצינות, עומק תורני ויכולת ביצוע שדניאל מביא עמו.'
        : 'Daniel is a man of compelling connections: between logical code and the depth of a Talmudic passage, and between the responsibility of a combat officer and a soulful Hasidic melody. He is a person who combines seriousness, reliability, and a drive for excellence in every area of his life.\n\nHis path reflects a man who merges action with meaning. His service as an officer in the Combat Engineering Corps instilled in him a profound sense of responsibility, while his studies at Yeshivat Har Etzion and the Technion sharpened his analytical abilities and his connection to the world of Torah. He is a person in constant growth, both intellectually and spiritually.\n\nHe seeks to build a home of Torah and joy, founded on a true partnership, mutual growth, and open-mindedness. He is looking for an intelligent and value-driven woman to be his partner in conversation and in challenges, to build a world filled with goodness and meaning together.\n\nAt NeshamaTech, we are impressed by the rare blend of seriousness, Torah depth, and practical ability that Daniel embodies.',
      profileCharacterTraits: ['driven', 'honest', 'family_oriented'], profileHobbies: ['travel', 'music_playing_instrument'],
      aliyaCountry: 'ארה"ב', aliyaYear: 2004, 
      inspiringCoupleStory: isHebrew ? 'הסבים והסבתות שלי, שעלו לארץ מארה"ב מתוך אידיאלים ציוניים ובנו כאן חיים לתפארת. החיבור העמוק שלהם למסורת היהודית, יחד עם המחויבות שלהם לבניית המדינה והקהילה, והשותפות החמה והאוהבת ביניהם, הם המצפן שמנחה אותי.' : 'My grandparents, who made Aliyah from the US out of Zionist ideals and built a wonderful life here. Their deep connection to Jewish tradition, combined with their commitment to building the state and the community, and their warm and loving partnership, are the compass that guides me.',
      influentialRabbi: 'הרב זקס זצ"ל',
      parentStatus: 'נשואים', fatherOccupation: 'מהנדס תוכנה', motherOccupation: 'רופאת משפחה', siblings: 3, position: 2,
      hasMedicalInfo: false, isMedicalInfoVisible: false, medicalInfoDetails: null, medicalInfoDisclosureTiming: null, preferredAgeMin: 26, preferredAgeMax: 32,
      preferredHeightMin: 160, preferredHeightMax: 175, 
      // --- START: עדכון ערכים ---
      preferredReligiousLevels: ['דתי-לאומי תורני', 'דתי-לאומי סטנדרטי'], 
      preferredLocations: ['ירושלים', 'גוש עציון', 'מודיעין'],
      preferredEducation: ['תואר ראשון', 'תואר שני'],
      preferredOccupations: ['עיצוב', 'אמנות', 'חינוך', 'טיפול'],
      preferredOrigins: [], // פתוח לכל המוצאים
      // --- END: עדכון ערכים ---
      contactPreference: 'matchmaker', preferredMaritalStatuses: ['רווק/ה'],
      preferredShomerNegiah: 'yes', preferredPartnerHasChildren: 'no_preferred', preferredServiceTypes: [], preferredHeadCoverings: [],
      preferredKippahTypes: [], preferredCharacterTraits: [], preferredHobbies: [], preferredAliyaStatus: 'no_preference', preferredReligiousJourneys: [],
      isProfileVisible: true, preferredMatchmakerGender: null, matchingNotes: '', verifiedBy: null, availabilityStatus: AvailabilityStatus.AVAILABLE,
      availabilityNote: null, availabilityUpdatedAt: null, lastActive: null, hasViewedProfilePreview: false, needsAiProfileUpdate: false,
      isAboutVisible: true,
      isFriendsSectionVisible: true,
      isNeshamaTechSummaryVisible: true,
       cvUrl: null,
      cvSummary: null,
      testimonials: [
        {
          id: 'testimonial-daniel-1',
          authorName: isHebrew ? 'איתי שרמן' : 'Itai Sherman',
          relationship: isHebrew ? 'חבר מהצבא' : 'Army Buddy',
          content: isHebrew ? 'שירתתי עם דניאל כקצינים. הוא מהאנשים האלה שאתה יודע שתמיד יהיו שם בשבילך, לא משנה מה. יש לו עמוד שדרה ערכי חזק, אבל בלי טיפת התנשאות. הוא איש שיחה אמיתי, אפשר לדבר איתו על סוגיה בגמרא ודקה אחרי זה על כדורסל.' : 'I served with Daniel as an officer. He\'s one of those guys you know will always have your back, no matter what. He has a strong ethical backbone, but without a hint of arrogance. He\'s a true conversationalist; you can discuss a Gemara topic with him one minute and basketball the next.',
          isPhoneVisibleToMatch: false,
          status: TestimonialStatus.APPROVED,
          submittedBy: SubmissionSource.FRIEND,
          createdAt: new Date(),
        },
        {
          id: 'testimonial-daniel-2',
          authorName: isHebrew ? 'יונתן אביב' : 'Yonatan Aviv',
          relationship: isHebrew ? 'חברותא מהישיבה' : 'Yeshiva Chavruta (Study Partner)',
          content: isHebrew ? 'למדתי עם דניאל חברותא בהר עציון. הראש האנליטי החד שלו, יחד עם הצמא שלו לאמת ולמשמעות, זה שילוב נדיר. הוא לא מפחד משאלות קשות, לא בתורה ולא בחיים. הוא בחור רציני שיודע גם לנגן ולשמוח.' : 'I learned with Daniel as a chavruta at Har Etzion. His sharp analytical mind, combined with his thirst for truth and meaning, is a rare combination. He isn\'t afraid of tough questions, neither in Torah nor in life. He\'s a serious guy who also knows how to play music and have fun.',
          isPhoneVisibleToMatch: false,
          status: TestimonialStatus.APPROVED,
          submittedBy: SubmissionSource.FRIEND,
          createdAt: new Date(),
        },
      ],
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
    overallScore: 91, 
    matchTitle: aiAnalysisContent.forMaleTitle, 
    matchSummary: aiAnalysisContent.forMaleSummary,
    // עכשיו המערכים האלה יתמלאו מהתוכן שהוספנו
    compatibilityPoints: aiAnalysisContent.compatibilityPoints,
    pointsToConsider: aiAnalysisContent.pointsToConsider,
    suggestedConversationStarters: aiAnalysisContent.suggestedConversationStarters,
  };

  const demoAiAnalysisForNoa: AiSuggestionAnalysisResult = {
    overallScore: 91, 
    matchTitle: aiAnalysisContent.forFemaleTitle, 
    matchSummary: aiAnalysisContent.forFemaleSummary,
    // עכשיו המערכים האלה יתמלאו מהתוכן שהוספנו
    compatibilityPoints: aiAnalysisContent.compatibilityPoints,
    pointsToConsider: aiAnalysisContent.pointsToConsider,
    suggestedConversationStarters: aiAnalysisContent.suggestedConversationStarters,
  };

  return { demoSuggestionDataFemale, demoSuggestionDataMale, demoAiAnalysisForDaniel, demoAiAnalysisForNoa };
};
