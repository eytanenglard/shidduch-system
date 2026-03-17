# תוכנית: ביטול הצעה על ידי יוזר (Proposal Cancellation)

## הבעיה
כרגע, ברגע שיוזר מאשר הצעה (FIRST_PARTY_APPROVED), אין לו דרך לחזור בו. אם הוא מתחרט, הוא צריך לפנות לשדכן.
מצד שני — **אסור** לאפשר ביטול אחרי שהשדכן כבר שלח את ההצעה לצד השני, כי זה יוצר מצב מביך.

## המצב הנוכחי
```
PENDING_FIRST_PARTY → (יוזר מאשר) → FIRST_PARTY_APPROVED → (שדכן שולח) → PENDING_SECOND_PARTY
```
- המעבר מ-FIRST_PARTY_APPROVED ל-PENDING_SECOND_PARTY נעשה **ידנית על ידי השדכן** (דרך resend route)
- יש חלון זמן טבעי בין אישור היוזר לבין שליחה לצד שני
- השדה `secondPartySent` מתעדכן כשהשדכן שולח לצד השני

## הפתרון המוצע

### שני מסלולי ביטול:

#### 1. Grace Period — חלון חרטה (5 דקות)
- מיד אחרי אישור, מוצג טיימר של 5 דקות
- בזמן הזה מוצג כפתור "בטל אישור" בולט
- לחיצה מחזירה את ההצעה ל-`PENDING_FIRST_PARTY` (כאילו לא קרה כלום)
- **לא נשלחת התראה לשדכן** על הביטול ב-grace period — כך מבחינת השדכן זה כאילו היוזר עדיין לא ענה
- אחרי 5 דקות הכפתור נעלם ונשלחת ההתראה הרגילה לשדכן שהיוזר אישר

#### 2. ביטול לפני שליחה לצד שני
- כל עוד הסטטוס הוא `FIRST_PARTY_APPROVED` (השדכן עדיין לא שלח לצד שני)
- מוצג כפתור "בטל אישור" (פחות בולט מה-grace period)
- לחיצה → **מודל אישור** עם הודעה: "האם אתה בטוח? השדכן/ית יקבל/תקבל הודעה על ביטול האישור"
- ביטול מחזיר ל-`FIRST_PARTY_DECLINED` עם הערה "המועמד חזר בו מהאישור"
- **נשלחת התראה לשדכן** שהיוזר ביטל את האישור

### מה לא מאפשרים:
- ❌ ביטול אחרי `PENDING_SECOND_PARTY` — ההצעה כבר נשלחה לצד שני
- ❌ ביטול אחרי כל סטטוס מתקדם — רק השדכן יכול לבטל
- ❌ שינוי דעה חוזר (אישור → ביטול → אישור) — ברגע שביטלת (לא ב-grace period), זה נחשב דחייה

---

## שינויים נדרשים

### 1. API — ראוט חדש לביטול
**קובץ חדש:** `src/app/api/suggestions/[id]/withdraw/route.ts`

```
POST /api/suggestions/[id]/withdraw
Body: { type: "grace_period" | "before_second_party" }
```

**לוגיקה:**
- בדיקת הרשאות: רק CANDIDATE שהוא firstParty של ההצעה
- בדיקת סטטוס: חייב להיות `FIRST_PARTY_APPROVED`
- אם `type === "grace_period"`:
  - בדיקה ש-`firstPartyResponded` היה לפני פחות מ-5 דקות
  - מעבר ל-`PENDING_FIRST_PARTY`
  - **ללא** התראה לשדכן
  - מחיקת `firstPartyResponded` (reset)
- אם `type === "before_second_party"`:
  - בדיקה ש-`secondPartySent` הוא null (השדכן לא שלח עדיין)
  - מעבר ל-`FIRST_PARTY_DECLINED` עם הערה
  - שליחת התראה לשדכן (email + push)
- יצירת רשומת SuggestionStatusHistory

**ראוט מובייל חדש:** `src/app/api/mobile/suggestions/[id]/withdraw/route.ts`
- אותה לוגיקה בדיוק, עם CORS ו-mobile auth

### 2. StatusTransitionLogic — הוספת פעולה ליוזר
**קובץ:** `src/components/matchmaker/suggestions/services/suggestions/StatusTransitionLogic.ts`

ב-`getAvailableActions`, להוסיף ל-`FIRST_PARTY_APPROVED`:
```typescript
FIRST_PARTY_APPROVED: {
  firstParty: [
    { id: "withdraw", label: "ביטול אישור", nextStatus: MatchSuggestionStatus.FIRST_PARTY_DECLINED }
  ],
  matchmaker: [/* existing */]
}
```

### 3. קומפוננטת הצעות — UI לביטול
**קבצים עיקריים:**
- `src/components/suggestions/modals/SuggestionDetailsModal.tsx`
- `src/components/suggestions/list/SuggestionsList.tsx` (אם כפתורים מופיעים גם שם)

**שינויים ב-UI:**

#### א. Grace Period Banner
- אחרי אישור, מוצג באנר עם טיימר (countdown 5:00 → 0:00)
- כפתור "חזרה מהאישור" בצבע כתום/אזהרה
- טקסט: "ניתן לבטל את האישור עד XX:XX"
- הבאנר נעלם אחרי 5 דקות (רענון אוטומטי)

#### ב. כפתור ביטול רגיל (אחרי grace period)
- כפתור משני/קטן "ביטול אישור" באזור הפעולות
- מוצג רק כשסטטוס = FIRST_PARTY_APPROVED
- לחיצה פותחת מודל אישור:
  - כותרת: "האם אתה בטוח?"
  - טקסט: "ביטול האישור ייחשב כדחיית ההצעה. השדכן/ית יקבל/תקבל הודעה."
  - כפתורים: "כן, בטל" (אדום) | "חזרה" (neutral)

#### ג. הודעת הצלחה
- Toast: "האישור בוטל בהצלחה" (grace period)
- Toast: "ההצעה בוטלה. השדכן/ית עודכן/ה" (ביטול רגיל)

### 4. תזמון התראות — דחיית ההתראה לשדכן
**שינוי חשוב:** כרגע, כשיוזר מאשר, ההתראה לשדכן נשלחת **מיד**.
צריך לדחות את שליחת ההתראה ב-5 דקות כדי לאפשר grace period.

**שתי גישות אפשריות:**

**גישה א' — דחיית התראה בצד שרת (מומלץ):**
- בזמן אישור: שמירת `approvedAt` ו-flag `notificationPending: true`
- Cron job / setTimeout שרץ אחרי 5 דקות ובודק:
  - אם הסטטוס עדיין FIRST_PARTY_APPROVED → שולח התראה לשדכן
  - אם הסטטוס חזר ל-PENDING_FIRST_PARTY (grace period cancel) → לא שולח

**גישה ב' — שליחה מיד, עם התייחסות ל-grace:**
- ההתראה נשלחת מיד לשדכן כרגיל
- אם היוזר מבטל ב-grace period → נשלחת התראה נוספת "המועמד עדיין לא סיים לשקול"
- פחות אלגנטי — השדכן רואה "אישור" ואז "עדיין שוקל"

**המלצה: גישה א'** — יותר נקי. השדכן רואה רק את התוצאה הסופית.

**מימוש גישה א':**
- להוסיף שדה `notificationDelayedUntil: DateTime?` ל-MatchSuggestion (או להשתמש בטבלת jobs)
- בזמן אישור: לא שולחים התראה, אלא שומרים `notificationDelayedUntil = now + 5min`
- API route חדש (או cron) שכל דקה בודק הצעות עם `notificationDelayedUntil < now` ושולח התראות

**OR פשוט יותר — בלי שדה חדש:**
- בזמן אישור: `sendNotifications: false` ב-StatusTransitionService
- מפעילים `setTimeout` בראוט (או Edge function) של 5 דקות
- אחרי 5 דקות: בודקים אם הסטטוס עדיין FIRST_PARTY_APPROVED ושולחים ידנית
- **חיסרון:** אם השרת עולה מחדש, ההתראה אבדה. לכן עדיף שדה + cron.

### 5. i18n — הוספת מחרוזות
**קבצים:** `src/dictionaries/he.json`, `src/dictionaries/en.json`

```json
{
  "suggestions": {
    "withdraw": {
      "gracePeriodTitle": "ניתן לבטל את האישור",
      "gracePeriodTimer": "נותרו {minutes}:{seconds}",
      "gracePeriodButton": "חזרה מהאישור",
      "withdrawButton": "ביטול אישור",
      "confirmTitle": "האם אתה בטוח?",
      "confirmMessage": "ביטול האישור ייחשב כדחיית ההצעה. השדכן/ית יקבל/תקבל הודעה.",
      "confirmButton": "כן, בטל את האישור",
      "cancelButton": "חזרה",
      "successGrace": "האישור בוטל בהצלחה",
      "successWithdraw": "ההצעה בוטלה. השדכן/ית עודכן/ה",
      "errorExpired": "חלון הביטול נסגר"
    }
  }
}
```

### 6. DB Migration (אופציונלי — תלוי בגישה)
**אם בוחרים בגישה א' לדחיית התראות:**
- שדה חדש: `notificationDelayedUntil DateTime?` ב-MatchSuggestion
- OR: טבלת `DelayedNotification` נפרדת

**אם בוחרים בגישה הפשוטה (setTimeout):**
- אין צורך ב-migration

---

## סיכום קבצים לשינוי

| קובץ | שינוי |
|-------|-------|
| `src/app/api/suggestions/[id]/withdraw/route.ts` | **חדש** — ראוט ביטול |
| `src/app/api/mobile/suggestions/[id]/withdraw/route.ts` | **חדש** — ראוט ביטול למובייל |
| `src/components/matchmaker/suggestions/services/suggestions/StatusTransitionLogic.ts` | הוספת withdraw action ל-firstParty |
| `src/components/suggestions/modals/SuggestionDetailsModal.tsx` | UI ביטול + grace period timer |
| `src/components/suggestions/list/SuggestionsList.tsx` | כפתור ביטול בכרטיס |
| `src/app/api/suggestions/[id]/status/route.ts` | דחיית התראה (sendNotifications: false) + trigger delayed send |
| `src/app/api/mobile/suggestions/[id]/respond/route.ts` | אותו שינוי — דחיית התראה |
| `src/dictionaries/he.json` | מחרוזות i18n |
| `src/dictionaries/en.json` | מחרוזות i18n |
| `prisma/schema.prisma` | **אופציונלי** — שדה notificationDelayedUntil |

---

## שאלות פתוחות לדיון

1. **Grace period — 5 דקות מספיק?** אפשר 3, 5, או 10 דקות.
2. **גישה לדחיית התראות** — גישה א' (cron+שדה) או גישה פשוטה (setTimeout)?
3. **האם לאפשר "ביטול + אישור מחדש"?** כרגע התוכנית: grace period → חזרה ל-PENDING. ביטול רגיל → DECLINED (סופי).
4. **מובייל** — האם לממש את אותו UI גם באפליקציה? (צריך עבודה נפרדת ב-React Native)
