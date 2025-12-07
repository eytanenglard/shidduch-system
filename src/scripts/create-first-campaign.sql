-- ============================================
-- SQL Script to Create First Referral Campaign
-- ============================================

-- יצירת קמפיין ראשון
INSERT INTO "ReferralCampaign" (
  "id",
  "name",
  "slug",
  "description",
  "startDate",
  "endDate",
  "isActive",
  "prizeTiers",
  "grandPrize",
  "settings",
  "createdAt",
  "updatedAt"
) VALUES (
  -- ID ייחודי (אפשר להשתמש ב-cuid generator או uuid)
  'cm_referral_summer_2025',
  
  -- שם הקמפיין (יוצג באדמין)
  'קמפיין חברים מביאים חברים - קיץ 2025',
  
  -- Slug (משמש ל-URL ולזיהוי)
  'summer-2025',
  
  -- תיאור
  'קמפיין ראשון של NeshamaTech - הביאו חברים וזכו בפרסים!',
  
  -- תאריך התחלה
  '2025-06-01T00:00:00.000Z',
  
  -- תאריך סיום (6 שבועות)
  '2025-07-15T23:59:59.000Z',
  
  -- פעיל
  true,
  
  -- פרסי סף (JSON)
  '[
    {"threshold": 3, "prize": "שובר קפה בשווי 50₪", "prizeValue": 50},
    {"threshold": 7, "prize": "שובר מסעדה בשווי 150₪", "prizeValue": 150},
    {"threshold": 15, "prize": "ארוחה זוגית עד 400₪", "prizeValue": 400}
  ]'::jsonb,
  
  -- פרס ראשי (למקום ראשון)
  'ארוחה זוגית פרימיום (600₪) + הכרת תודה מיוחדת',
  
  -- הגדרות
  '{
    "requireVerification": true,
    "requireProfileComplete": false,
    "maxReferralsPerIP": 5,
    "allowSelfReferral": false
  }'::jsonb,
  
  -- תאריכי יצירה ועדכון
  NOW(),
  NOW()
);

-- ============================================
-- הוספת שגרירים ידנית (אופציונלי)
-- ============================================

-- דוגמה להוספת שגריר (חבר קרוב)
/*
INSERT INTO "Referrer" (
  "id",
  "campaignId",
  "name",
  "email",
  "phone",
  "code",
  "tier",
  "notes",
  "clickCount",
  "registrationCount",
  "verifiedCount",
  "completedCount",
  "createdAt",
  "updatedAt"
) VALUES (
  'ref_david_001',
  'cm_referral_summer_2025',
  'דוד כהן',
  'david@example.com',
  '0501234567',
  'DAVID',
  'AMBASSADOR',
  'חבר קרוב, מכיר הרבה רווקים מהתעשייה',
  0, 0, 0, 0,
  NOW(), NOW()
);
*/

-- ============================================
-- שאילתות שימושיות
-- ============================================

-- הצגת כל הקמפיינים הפעילים
-- SELECT * FROM "ReferralCampaign" WHERE "isActive" = true;

-- הצגת כל המפנים בקמפיין
-- SELECT * FROM "Referrer" WHERE "campaignId" = 'cm_referral_summer_2025' ORDER BY "verifiedCount" DESC;

-- הצגת לידרבורד (טופ 10)
-- SELECT "name", "code", "verifiedCount", "clickCount" 
-- FROM "Referrer" 
-- WHERE "campaignId" = 'cm_referral_summer_2025'
-- ORDER BY "verifiedCount" DESC, "createdAt" ASC
-- LIMIT 10;

-- סטטיסטיקות כלליות של קמפיין
-- SELECT 
--   COUNT(*) as total_referrers,
--   SUM("clickCount") as total_clicks,
--   SUM("registrationCount") as total_registrations,
--   SUM("verifiedCount") as total_verified,
--   AVG(CASE WHEN "clickCount" > 0 THEN ("verifiedCount"::float / "clickCount"::float * 100) ELSE 0 END) as avg_conversion_rate
-- FROM "Referrer"
-- WHERE "campaignId" = 'cm_referral_summer_2025';

-- מפנים שזכאים לפרסים (3+ מאומתים)
-- SELECT "name", "code", "email", "phone", "verifiedCount"
-- FROM "Referrer"
-- WHERE "campaignId" = 'cm_referral_summer_2025' AND "verifiedCount" >= 3
-- ORDER BY "verifiedCount" DESC;