// scripts/export-user-data-for-analysis.js
//
// 🎯 ייצוא נתוני משתמשים לניתוח שאלון טביעת הנשמה
// מייצא פרופילים, תשובות שאלון, תגיות ומטריקות - ללא מידע מזהה
//
// הרצה: node scripts/export-user-data-for-analysis.js
//

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('📊 NeshamaTech - ייצוא נתונים לניתוח שאלון');
  console.log('═'.repeat(60) + '\n');

  // ══════════════════════════════════════════════
  // 1. סטטיסטיקות כלליות
  // ══════════════════════════════════════════════
  console.log('📈 סופר רשומות...');
  const totalUsers = await prisma.user.count({ where: { role: 'CANDIDATE' } });
  const totalProfiles = await prisma.profile.count();
  const totalQuestionnaires = await prisma.questionnaireResponse.count();
  const completedQuestionnaires = await prisma.questionnaireResponse.count({ where: { completed: true } });
  const totalTags = await prisma.profileTags.count();
  const totalMetrics = await prisma.profileMetrics.count();

  console.log(`   משתמשים (CANDIDATE): ${totalUsers}`);
  console.log(`   פרופילים: ${totalProfiles}`);
  console.log(`   שאלונים: ${totalQuestionnaires} (${completedQuestionnaires} הושלמו)`);
  console.log(`   תגיות (ProfileTags): ${totalTags}`);
  console.log(`   מטריקות (ProfileMetrics): ${totalMetrics}`);

  // ══════════════════════════════════════════════
  // 2. ייצוא פרופילים (ללא מידע מזהה)
  // ══════════════════════════════════════════════
  console.log('\n🔍 מייצא פרופילים...');
  const profiles = await prisma.profile.findMany({
    select: {
      id: true,
      userId: true,
      gender: true,
      birthDate: true,
      birthDateIsApproximate: true,
      nativeLanguage: true,
      additionalLanguages: true,
      height: true,
      maritalStatus: true,
      occupation: true,
      education: true,
      educationLevel: true,
      city: true,
      origin: true,
      religiousLevel: true,
      religiousJourney: true,
      shomerNegiah: true,
      serviceType: true,
      serviceDetails: true,
      headCovering: true,
      kippahType: true,
      hasChildrenFromPrevious: true,
      profileCharacterTraits: true,
      profileHobbies: true,
      aliyaCountry: true,
      aliyaYear: true,
      about: true,
      profileHeadline: true,
      inspiringCoupleStory: true,
      influentialRabbi: true,
      parentStatus: true,
      fatherOccupation: true,
      motherOccupation: true,
      siblings: true,
      position: true,
      hasMedicalInfo: true,
      smokingStatus: true,
      preferredSmokingStatus: true,
      bodyType: true,
      appearanceTone: true,
      groomingStyle: true,

      // העדפות
      preferredAgeMin: true,
      preferredAgeMax: true,
      preferredHeightMin: true,
      preferredHeightMax: true,
      preferredReligiousLevels: true,
      preferredLocations: true,
      preferredEducation: true,
      preferredOccupations: true,
      preferredMaritalStatuses: true,
      preferredShomerNegiah: true,
      preferredPartnerHasChildren: true,
      preferredOrigins: true,
      preferredServiceTypes: true,
      preferredHeadCoverings: true,
      preferredKippahTypes: true,
      preferredCharacterTraits: true,
      preferredHobbies: true,
      preferredAliyaStatus: true,
      preferredReligiousJourneys: true,
      preferredBodyTypes: true,
      preferredAppearanceTones: true,
      preferredGroomingStyles: true,
      contactPreference: true,
      preferredMatchmakerGender: true,

      // נתונים מחושבים
      matchingNotes: true,
      matchmakerImpression: true,
      redFlags: true,
      greenFlags: true,
      difficultyScore: true,
      readinessLevel: true,
      profileCompletenessScore: true,
      missingFields: true,
      acceptanceRate: true,
      avgMatchScore: true,
      availabilityStatus: true,

      // AI
      aiProfileSummary: true,
      cvSummary: true,
      conversationSummary: true,

      // מטא
      createdAt: true,
      contentUpdatedAt: true,
    },
  });

  // חישוב גיל במקום תאריך לידה מדויק
  const anonymizedProfiles = profiles.map(p => ({
    ...p,
    age: p.birthDate ? Math.floor((Date.now() - new Date(p.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null,
    birthDate: undefined, // מסיר תאריך לידה מדויק
  }));

  console.log(`   ✅ ${profiles.length} פרופילים`);

  // ══════════════════════════════════════════════
  // 3. ייצוא תשובות שאלון (5 עולמות)
  // ══════════════════════════════════════════════
  console.log('🔍 מייצא תשובות שאלון 5 עולמות...');
  const questionnaires = await prisma.questionnaireResponse.findMany({
    select: {
      id: true,
      userId: true,
      valuesAnswers: true,
      personalityAnswers: true,
      relationshipAnswers: true,
      partnerAnswers: true,
      religionAnswers: true,
      valuesCompleted: true,
      personalityCompleted: true,
      relationshipCompleted: true,
      partnerCompleted: true,
      religionCompleted: true,
      worldsCompleted: true,
      completed: true,
      startedAt: true,
      completedAt: true,
    },
  });
  console.log(`   ✅ ${questionnaires.length} שאלונים`);

  // ══════════════════════════════════════════════
  // 4. ייצוא תגיות (ProfileTags - שאלון טביעת נשמה)
  // ══════════════════════════════════════════════
  console.log('🔍 מייצא תגיות טביעת נשמה...');
  const tags = await prisma.profileTags.findMany({
    select: {
      id: true,
      profileId: true,
      userId: true,
      sectionAnswers: true,
      sectorTags: true,
      backgroundTags: true,
      personalityTags: true,
      careerTags: true,
      lifestyleTags: true,
      familyVisionTags: true,
      relationshipTags: true,
      diasporaTags: true,
      partnerTags: true,
      aiDerivedTags: true,
      customCategories: true,
      completedAt: true,
      source: true,
      version: true,
    },
  });
  console.log(`   ✅ ${tags.length} רשומות תגיות`);

  // ══════════════════════════════════════════════
  // 5. ייצוא מטריקות (ProfileMetrics)
  // ══════════════════════════════════════════════
  console.log('🔍 מייצא מטריקות...');
  const metrics = await prisma.profileMetrics.findMany({
    select: {
      id: true,
      profileId: true,
      calculatedBy: true,
      confidenceScore: true,
      dataCompleteness: true,

      // Self metrics
      socialEnergy: true,
      emotionalExpression: true,
      stabilityVsSpontaneity: true,
      independenceLevel: true,
      optimismLevel: true,
      humorStyle: true,
      careerOrientation: true,
      intellectualOrientation: true,
      financialApproach: true,
      ambitionLevel: true,
      religiousStrictness: true,
      spiritualDepth: true,
      cultureConsumption: true,
      urbanScore: true,
      englishFluency: true,
      americanCompatibility: true,
      ethnicBackground: true,
      backgroundCategory: true,
      togetherVsAutonomy: true,
      familyInvolvement: true,
      parenthoodPriority: true,
      growthVsAcceptance: true,
      nightOwlScore: true,
      adventureScore: true,
      petsAttitude: true,
      communicationStyle: true,
      conflictStyle: true,
      supportStyle: true,
      appearancePickiness: true,
      socioEconomicLevel: true,
      jobSeniorityLevel: true,
      educationLevelScore: true,

      // AI summaries
      aiPersonalitySummary: true,
      aiSeekingSummary: true,
      aiBackgroundSummary: true,
      aiMatchmakerGuidelines: true,
      aiInferredDealBreakers: true,
      aiInferredMustHaves: true,
      difficultyFlags: true,

      // Inferred
      inferredPersonalityType: true,
      inferredAttachmentStyle: true,
      inferredLoveLanguages: true,
      inferredRelationshipGoals: true,

      // Deal breakers
      dealBreakersHard: true,
      dealBreakersSoft: true,

      // Explanations
      metricsExplanations: true,
    },
  });
  console.log(`   ✅ ${metrics.length} רשומות מטריקות`);

  // ══════════════════════════════════════════════
  // 6. ייצוא פידבק דחיות (לניתוח מה חשוב לאנשים)
  // ══════════════════════════════════════════════
  console.log('🔍 מייצא פידבק דחיות...');
  const rejections = await prisma.rejectionFeedback.findMany({
    select: {
      category: true,
      subcategory: true,
      freeText: true,
      wasExpected: true,
      createdAt: true,
    },
  });
  console.log(`   ✅ ${rejections.length} דחיות`);

  // ══════════════════════════════════════════════
  // 7. ייצוא המלצות חברים (FriendTestimonial)
  // ══════════════════════════════════════════════
  console.log('🔍 מייצא המלצות חברים...');
  const testimonials = await prisma.friendTestimonial.findMany({
    select: {
      relationship: true,
      content: true,
      status: true,
    },
  });
  console.log(`   ✅ ${testimonials.length} המלצות`);

  // ══════════════════════════════════════════════
  // 8. יצירת קובץ ייצוא
  // ══════════════════════════════════════════════
  const exportData = {
    exportedAt: new Date().toISOString(),
    stats: {
      totalUsers,
      totalProfiles,
      totalQuestionnaires,
      completedQuestionnaires,
      totalTags,
      totalMetrics,
      totalRejections: rejections.length,
      totalTestimonials: testimonials.length,
    },
    profiles: anonymizedProfiles,
    questionnaires,
    profileTags: tags,
    profileMetrics: metrics,
    rejectionFeedback: rejections,
    friendTestimonials: testimonials,
  };

  const outputDir = path.join(__dirname, '..', 'exports');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outputPath = path.join(outputDir, `user-data-analysis_${timestamp}.json`);

  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf-8');

  const fileSizeBytes = fs.statSync(outputPath).size;
  const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);

  console.log('\n' + '═'.repeat(60));
  console.log('✅ הייצוא הושלם בהצלחה!');
  console.log('═'.repeat(60));
  console.log(`   📁 קובץ: ${outputPath}`);
  console.log(`   📦 גודל: ${fileSizeMB} MB`);
  console.log('');
  console.log('💡 הקובץ מכיל נתונים אנונימיים (ללא שמות, טלפונים, מיילים)');
  console.log('   ניתן לשלוח אותו לניתוח בבטחה.');
  console.log('═'.repeat(60));
  console.log('');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ שגיאה:', e.message);
  await prisma.$disconnect();
  process.exit(1);
});
