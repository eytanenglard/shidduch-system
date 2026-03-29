Sync web and mobile app changes for: $ARGUMENTS

The mobile app is at `../neshamatech-mobile/`. When changes are made to the web app, they often need to be reflected in the mobile app.

Follow this process:

1. **Identify what changed** — scan the specified files/area and determine what needs syncing
2. **Check these sync points:**

| Item | Web Location | Mobile Location |
|------|-------------|-----------------|
| Question IDs | `src/components/questionnaire/questions/*Questions.tsx` | `../neshamatech-mobile/src/i18n/questions_he.json` + `questions_en.json` |
| World IDs | `src/components/questionnaire/types/types.ts` | `../neshamatech-mobile/src/types/questionnaire.ts` |
| Question types | `Question.type` enum | `../neshamatech-mobile/src/types/questionnaire.ts` `QuestionDefinition.type` |
| Answer format | Prisma schema (Json fields) | `../neshamatech-mobile/src/services/questionnaireApi.ts` + `questionnaireStore.ts` |
| Profile fields | `prisma/schema.prisma` (Profile model) | `../neshamatech-mobile/src/types/mobileProfile.ts` |
| Suggestion statuses | `MatchSuggestionStatus` enum in Prisma | `../neshamatech-mobile/src/types/index.ts` |
| API contracts | `src/app/api/mobile/*/route.ts` | `../neshamatech-mobile/src/services/api/*.ts` |
| Question translations | `src/dictionaries/soul-fingerprint/` | `../neshamatech-mobile/src/i18n/questions_he.json` + `questions_en.json` |
| i18n strings | `dictionaries/he.json` + `en.json` | `../neshamatech-mobile/src/i18n/he.json` + `en.json` |

3. **For each mismatch found:**
   - Show the web version vs mobile version
   - Explain what needs to change
   - Apply the fix to the mobile app

4. **What does NOT need syncing** (skip these):
   - UI components & styling (Tailwind vs React Native StyleSheet)
   - State management (React state vs Zustand stores)
   - Navigation & routing
   - Auth implementation (NextAuth vs custom JWT)

IMPORTANT:
- Always check both directions — mobile might have changes web doesn't
- Question IDs must be IDENTICAL between web and mobile
- API response shapes must match what the mobile app expects
- When adding a new mobile API route, also check if a service wrapper exists in `../neshamatech-mobile/src/services/api/`
