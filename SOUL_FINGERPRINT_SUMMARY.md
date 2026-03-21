# מפת הנשמה (Soul Fingerprint) — מסמך מסכם

## סקירה כללית

מפת הנשמה היא מערכת שאלון מקיפה שמפתה את האישיות, הערכים, אורח החיים והעדפות הזוגיות של כל משתמש באמצעות **תגיות קשיחות ורכות**. המטרה: ליצור "טביעת אצבע" ייחודית שמשמשת כשכבת סינון וניקוד באלגוריתם ההתאמה.

מיושם בווב (Next.js) ובמובייל (React Native / Expo).

---

## ארכיטקטורה

```
┌─────────────────────────────────────────────────┐
│                   UI Layer                       │
│  ┌──────────────────┐  ┌─────────────────────┐  │
│  │   Web (Next.js)  │  │  Mobile (Expo/RN)   │  │
│  │  17 components   │  │  11 components      │  │
│  │  3 hooks         │  │  1 Zustand store    │  │
│  └────────┬─────────┘  └──────────┬──────────┘  │
│           │                       │              │
│           ▼                       ▼              │
│  ┌──────────────────────────────────────────┐   │
│  │        API: /api/user/soul-fingerprint   │   │
│  │        GET / POST / PATCH                │   │
│  └────────────────────┬─────────────────────┘   │
│                       │                          │
│           ┌───────────┴───────────┐              │
│           ▼                       ▼              │
│  ┌─────────────────┐   ┌──────────────────────┐ │
│  │  ProfileTags    │   │  AI Enrichment       │ │
│  │  (Prisma/DB)    │   │  (Gemini API)        │ │
│  └────────┬────────┘   └──────────────────────┘ │
│           │                                      │
│           ▼                                      │
│  ┌──────────────────────────────────────────┐   │
│  │  Scanning / Matching                     │   │
│  │  tagMatchingService + scanSingleUserV2   │   │
│  │  + compatibilityServiceV2                │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## מבנה קבצים

### ווב (Next.js)

```
src/components/soul-fingerprint/
  types.ts                           # טיפוסים, isQuestionVisible(), deriveTagsFromAnswers(), derivePartnerTagsFromAnswers()
  questions.ts                       # ~125 שאלות ב-8 סקשנים + שאלות partner
  SoulFingerprintFlow.tsx            # אורקסטרטור ראשי (welcome → questionnaire → complete)
  SoulFingerprintWelcome.tsx         # מסך פתיחה
  SoulFingerprintComplete.tsx        # מסך סיום עם tag cloud
  SoulFingerprintCTA.tsx             # כרטיס CTA בפרופיל
  components/
    QuestionRenderer.tsx             # מרנדר שאלה לפי type
    SingleChoiceQuestion.tsx          # בחירה יחידה
    MultiSelectQuestion.tsx           # בחירה מרובה עם "לא משנה לי"
    SliderQuestion.tsx                # סליידר (למשל: introvert ↔ extrovert)
    OpenTextQuestion.tsx              # טקסט חופשי
    SelfPartnerTabs.tsx              # טאבים: עליי / מחפש/ת
    ProgressIndicator.tsx             # 8 נקודות עם % השלמה
    NavigationButtons.tsx             # הבא/הקודם עם ולידציה
  hooks/
    useSoulFingerprint.ts            # state management מרכזי
    useAutoSave.ts                   # שמירה אוטומטית (debounce 3s)
    useVisibleQuestions.ts           # סינון שאלות לפי נראות

src/app/[locale]/(authenticated)/soul-fingerprint/
  page.tsx                           # Server component
  SoulFingerprintPageClient.tsx      # Client wrapper

src/app/api/user/soul-fingerprint/
  route.ts                           # GET/POST/PATCH endpoints

src/lib/services/
  tagMatchingService.ts              # ניקוד תגיות 0-50 + hard filter
  soulFingerprintAIService.ts        # AI enrichment via Gemini

src/dictionaries/soul-fingerprint/
  he.json                            # ~1,200 מפתחות עברית
  en.json                            # ~1,200 מפתחות אנגלית
```

### מובייל (React Native / Expo)

```
neshamatech-mobile/
  src/data/
    soulFingerprintQuestions.ts       # העתקה של questions.ts
    soulFingerprintTypes.ts           # העתקה של types.ts
  src/stores/
    soulFingerprintStore.ts           # Zustand store
  src/components/soul-fingerprint/
    SFWelcomeScreen.tsx
    SFQuestionScreen.tsx
    SFCompletionScreen.tsx
    SFSingleChoice.tsx
    SFMultiSelect.tsx
    SFSlider.tsx
    SFOpenText.tsx
    SFProgressBar.tsx
    SFSelfPartnerTabs.tsx
    SFNavigationBar.tsx
    index.ts
  app/soul-fingerprint/
    _layout.tsx
    index.tsx
    [sectionId].tsx
    complete.tsx
```

---

## 8 סקשנים — 125 שאלות

| # | סקשן | ID | אייקון | שאלות self | שאלות partner | סה"כ |
|---|-------|-----|--------|------------|---------------|------|
| 1 | עוגן | anchor | 🌟 | 4 | 0 | 4 |
| 2 | זהות | identity | 🪞 | 14 | 4 | 18 |
| 3 | שורשים | background | 🌳 | 8 | 1 | 9 |
| 4 | אישיות | personality | ✨ | 9 | 10 | 19 |
| 5 | קריירה | career | 💼 | 10 | 6 | 16 |
| 6 | אורח חיים | lifestyle | 🎯 | 12 | 13 | 25 |
| 7 | משפחה | family | 🏡 | 5 | 7 | 12 |
| 8 | זוגיות | relationship | 💞 | 7 | 9 | 16 |
| | **סה"כ** | | | **~69** | **~50** | **~125** |

---

## Branching Logic — שאלות מותנות

השאלון הוא **דינמי**: שאלות מופיעות ונעלמות בהתאם ל:

- **sector** — חרדי ליטאי, חסידי, דתי-לאומי, חילוני, מסורתי, חוזר בתשובה, תפוצות
- **sectorGroup** — קבוצת על: charedi, dati_leumi, masorti, hiloni, chozer_bteshuva, diaspora
- **lifeStage** — נישואין ראשונים, גרוש/ה, אלמן/ה
- **gender** — זכר / נקבה
- **requiredAnswers** — תשובות קודמות (למשל: סוג ישיבה → ישיבה ספציפית)
- **excludeAnswers** — תשובות שמונעות הצגה

### דוגמה: בחור חרדי ליטאי

```
anchor_sector = charedi_litvish
  → מוצגות: שאלות כולל, לימוד/עבודה, שמירת נגיעה
  → לא מוצגות: שאלות צבא, ציונות, זהות חילונית, תפוצות
```

### דוגמה: אישה דתי-לאומית

```
anchor_sector = dati_leumi_classic, gender = FEMALE
  → מוצגות: סוג שירות (שנת שירות/מדרשה), ציונות, ישיבות הסדר (לא)
  → לא מוצגות: כולל, לימוד חרדי
```

---

## מערכת תגיות — 8 קטגוריות

### תגיות Self (נגזרות מ-`deriveTagsFromAnswers()`)

| קטגוריה | דוגמאות תגים | מקור |
|---------|-------------|------|
| **sectorTags** | `charedi_litvish`, `hasidic_chabad`, `full_kollel`, `negiah_fully_shomer` | anchor + identity |
| **backgroundTags** | `ashkenazi`, `sabra`, `parents_married`, `big_family_origin` | background |
| **personalityTags** | `humorous`, `introverted`, `embraces_change`, `very_sensitive` | personality + AI |
| **careerTags** | `tech_hi_tech`, `bachelor`, `career_center`, `money_tool` | career |
| **lifestyleTags** | `reading`, `mehadrin`, `non_smoker`, `casual_dress`, `israel_only` | lifestyle |
| **familyVisionTags** | `three_four`, `full_sharing`, `edu_state_religious` | family |
| **relationshipTags** | `deep_trust`, `quality_time`, `balanced_closeness`, `pace_slow` | relationship |
| **diasporaTags** | `mo_yeshivish`, `aliyah_planning` | diaspora questions |

### תגיות Partner (נגזרות מ-`derivePartnerTagsFromAnswers()`)

מבנה `PartnerTagPreferences`:
```typescript
{
  sectorTags: string[];         // מגזרים מועדפים
  backgroundTags: string[];     // רקע מועדף
  personalityTags: string[];    // אופי מועדף
  careerTags: string[];         // קריירה מועדפת
  lifestyleTags: string[];      // אורח חיים מועדף
  familyVisionTags: string[];   // חזון משפחתי
  relationshipTags: string[];   // סגנון זוגיות
  doesntMatterCategories: string[]; // קטגוריות ש"לא משנה"
}
```

### תגיות AI (נגזרות מ-`soulFingerprintAIService.ts`)

50 תגים מוגדרים מראש שה-AI יכול לגזור מתשובות טקסט חופשי:

- **אישיות**: optimistic, pessimistic, perfectionist, flexible, stubborn, independent, ambitious, sensitive, resilient, patient, curious, romantic, pragmatic, idealist, realist
- **חברתי/רגשי**: emotionally_available, guarded, confident, self_aware, people_pleaser, boundary_setter, conflict_resolver
- **אורח חיים**: minimalist, luxurious, health_conscious, intellectual, nature_lover, city_person, homebody, social_butterfly, early_riser, night_owl, workaholic, work_life_balanced
- **זוגיות**: needs_space, needs_closeness, communicator, action_oriented, quality_time_focused, gift_giver, verbal_affection
- **ערכים**: family_first, career_driven, community_focused, spiritually_seeking, growth_oriented, stability_oriented, adventure_seeking, peace_seeking

---

## חיבור לסריקה

### Tier 1.5 — Tag Hard Filter

ממוקם אחרי Tier 1 (deal breakers SQL) ולפני Tier 2-3 (compatibility):

```
Tier 1: SQL deal breakers (גיל, מגדר, סטטוס)
  ↓
Tier 1.5: Tag sector filter ← חדש!
  אם המשתמש ציין מגזרים מועדפים (p_sector_preference)
  ואין חפיפה עם מגזר המועמד → מסנן
  ↓
Tier 2-3: Compatibility scoring (metrics + vectors + tags)
```

### Tag Compatibility Score (0-50)

`tagMatchingService.ts` — ניקוד לפי קטגוריה:

| קטגוריה | ניקוד מקסימלי | hard filter? |
|---------|-------------|-------------|
| sector | 15 | כן |
| personality | 10 | לא |
| lifestyle | 8 | לא |
| family | 7 | לא |
| relationship | 5 | לא |
| career | 3 | לא |
| background | 2 | לא |
| **סה"כ** | **50** | |

### נוסחת ציון סופי

```
ללא תגים:  metrics 70% + vectors 30%
עם תגים:   metrics 50% + vectors 20% + tags 30%
ללא vectors: metrics 65% + tags 35%
```

---

## AI Enrichment

### מתי רץ

1. **מיידית** — כשהמשתמש מסיים את השאלון (fire-and-forget)
2. **cron יומי** — `batchEnrichSoulFingerprints()` — מעשיר פרופילים שהושלמו ללא AI tags

### איך עובד

1. שולף `ProfileTags` + `sectionAnswers`
2. מוציא תשובות טקסט חופשי (`s3_open_character`, `s7_open_partner`)
3. שולח ל-Gemini API עם existing tags כ-context
4. מקבל 5-10 תגיות חדשות מתוך 50 מוגדרות מראש
5. מאמת (רק תגים מהרשימה, לא כפילויות)
6. שומר ב-`aiDerivedTags` עם `source: 'HYBRID'`

---

## דאטה בייס — ProfileTags Model

```prisma
model ProfileTags {
  id               String   @id @default(cuid())
  profileId        String   @unique
  userId           String   @unique

  sectionAnswers   Json?              // תשובות גולמיות
  sectorTags       String[]           // תגי מגזר
  backgroundTags   String[]           // תגי רקע
  personalityTags  String[]           // תגי אישיות
  careerTags       String[]           // תגי קריירה
  lifestyleTags    String[]           // תגי אורח חיים
  familyVisionTags String[]           // תגי חזון משפחתי
  relationshipTags String[]           // תגי זוגיות
  diasporaTags     String[]           // תגי תפוצות
  partnerTags      Json?              // PartnerTagPreferences
  aiDerivedTags    String[]           // תגי AI
  customCategories Json?              // קטגוריות דינמיות
  completedAt      DateTime?
  source           String   @default("SELF_REPORTED")
  version          Int      @default(1)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

**לא נדרש שינוי בסכמה** — המבנה גמיש מספיק: תגים חדשים נוספים למערכים, תשובות חדשות נשמרות ב-JSON.

---

## UX — פיצ'רים עיקריים

1. **טאבים Self/Partner** — כל סקשן מציג קודם "עליי" ואז "מחפש/ת"
2. **"לא משנה לי"** — בשאלות partner, בחירה ב-"doesn't matter" מנקה אחרות ומוסיפה ל-doesntMatterCategories
3. **אנימציית מעבר** — מסך ביניים אנימטיבי כשעוברים מ-self ל-partner
4. **Auto-save** — debounced כל 3 שניות
5. **ולידציה** — כפתור "הבא" disabled כשיש שאלות חובה שלא נענו
6. **ניווט מוגבל** — ProgressIndicator מאפשר ניווט רק לסקשנים שהושלמו
7. **Scroll to top** — גלילה אוטומטית בכל מעבר סקשן
8. **Resume** — חזרה לשאלון ממשיכה מהסקשן האחרון שלא הושלם
9. **Invalidation** — שינוי anchor_sector מוחק תשובות תלויות
10. **כוכבית אדומה** — סימון ויזואלי לשאלות חובה שטרם נענו
11. **הודעות שמירה** — status indicators: saving, saved, error
12. **RTL מלא** — כל הקומפוננטות תומכות בכיוון ימין-לשמאל

---

## i18n — מילון תרגום

**~1,200 מפתחות לשפה** מחולקים ל:

- `welcome.*` — מסך פתיחה (badge, title, subtitle, description, whyMatters, time, privacy, cta)
- `sections.*` — 8 כותרות סקשנים
- `progress.*` — תוויות progress (sectionOf, anchor..relationship)
- `labels.*` — תוויות UI (selfLabel, partnerLabel, skip, next, back, saving, saved, saveError, noPartnerQuestions, noSelfQuestions, partnerTransitionTitle/Subtitle)
- `completion.*` — מסך סיום (title, subtitle, description, tagsTitle, cta, edit, categories.*)
- `questions.*` — ~117 טקסטים של שאלות
- `options.*` — ~800+ תוויות של אפשרויות

---

## סטטיסטיקות

| מדד | כמות |
|-----|------|
| קבצי ווב חדשים | 19 |
| קבצי מובייל חדשים | 16 |
| קבצים ששונו | 5 |
| סה"כ שורות קוד (ווב) | ~3,100 |
| סה"כ שורות קוד (מובייל) | ~2,500 |
| סה"כ שורות i18n | ~2,450 |
| שאלות | ~125 |
| קטגוריות תגים | 8 |
| תגי AI | 50 |
| מפתחות i18n לשפה | ~1,200 |
| API endpoints | 3 (GET/POST/PATCH) |
| שירותים חדשים | 2 (tagMatching, AIEnrichment) |
