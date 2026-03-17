# תוכנית: ביטול הצעה על ידי יוזר (Proposal Cancellation)

## סטטוס: מימוש ראשוני הושלם

## הפתרון שמומש

### תהליך משולב — Grace Period + ביטול לפני שליחה לצד שני

```
יוזר לוחץ "אישור"
  → FIRST_PARTY_APPROVED (ההתראה לשדכן מושהית 5 דקות)
  → [5 דקות countdown]
    ├── בתוך 5 דקות: כפתור "חזרה מהאישור" → חוזר ל-PENDING_FIRST_PARTY בשקט
    └── אחרי 5 דקות: התראה נשלחת לשדכן (דרך cron)
  → כל עוד ההצעה לא נשלחה לצד שני:
    └── כפתור "ביטול אישור" + מודל אישור → FIRST_PARTY_DECLINED + התראה לשדכן
  → אחרי PENDING_SECOND_PARTY:
    └── ❌ לא ניתן לבטל — רק דרך פנייה לשדכן
```

### קבצים שנוספו/שונו

| קובץ | שינוי |
|-------|-------|
| `src/app/api/suggestions/[id]/withdraw/route.ts` | **חדש** — API ביטול (web) |
| `src/app/api/mobile/suggestions/[id]/withdraw/route.ts` | **חדש** — API ביטול (mobile) |
| `src/app/api/cron/send-delayed-notifications/route.ts` | **חדש** — cron לשליחת התראות מושהות |
| `prisma/schema.prisma` | שדה `matchmakerNotifiedAt` |
| `src/components/matchmaker/suggestions/services/suggestions/StatusTransitionLogic.ts` | מעברים + actions חדשים |
| `src/components/matchmaker/suggestions/services/suggestions/StatusTransitionService.ts` | מעברים חדשים |
| `src/components/suggestions/modals/SuggestionDetailsModal.tsx` | UI: countdown timer + withdraw buttons |
| `src/components/suggestions/MatchSuggestionsContainer.tsx` | העברת onRefresh למודל |
| `src/app/api/suggestions/[id]/status/route.ts` | דחיית התראה ב-grace period |
| `src/app/api/mobile/suggestions/[id]/respond/route.ts` | דחיית התראה ב-grace period |
| `dictionaries/suggestions/he.json` | מחרוזות i18n |
| `dictionaries/suggestions/en.json` | מחרוזות i18n |
| `src/types/dictionary.d.ts` | טיפוסי withdraw |

### משימות פריסה

1. **DB Migration**: להריץ `prisma db push` או ליצור migration עבור שדה `matchmakerNotifiedAt`
2. **Cron Setup**: להגדיר ב-Heroku Scheduler קריאה כל דקה ל:
   ```
   curl -X POST https://your-app.herokuapp.com/api/cron/send-delayed-notifications \
     -H "Authorization: Bearer $CRON_SECRET"
   ```
3. **בדיקות**: לבדוק את התהליך המלא — אישור → countdown → ביטול (grace) → ביטול (רגיל)
