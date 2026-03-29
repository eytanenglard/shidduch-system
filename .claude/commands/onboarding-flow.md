Analyze or modify the onboarding/registration flow for: $ARGUMENTS

The registration flow has 4 gates enforced by middleware:

```
Gate 1: Accept Terms
Gate 2: Complete Profile
Gate 3: Verify Phone
Gate 4: Complete Soul Fingerprint (Questionnaire)
```

1. **Read the key files:**
   - `src/middleware.ts` — gate logic and redirects
   - `src/app/[locale]/(authenticated)/` — protected pages
   - Registration components in `src/components/auth/`
   - Profile components in `src/components/profile/`
   - Questionnaire in `src/components/questionnaire/`

2. **Gate rules:**
   - Gates must be passed IN ORDER — can't skip ahead
   - MATCHMAKER and ADMIN roles skip ALL gates
   - Profile completion requires: `isProfileComplete = true`
   - Phone verification requires: `isPhoneVerified = true`
   - Both flags must be true for user to appear in matchmaking pools
   - Mobile profiles start with `isProfileVisible: false`

3. **If modifying a gate:**
   - Update `middleware.ts` redirect logic
   - Update the corresponding page/component
   - Check mobile onboarding flow in `../neshamatech-mobile/` for sync
   - Verify that existing users aren't broken by the change
   - Test all role types: CANDIDATE, MATCHMAKER, ADMIN

4. **If adding a new gate:**
   - Add after the appropriate existing gate
   - Update middleware.ts with the new check
   - Create the gate page/component
   - Add i18n strings (Hebrew + English)
   - Update mobile app if applicable
   - Consider: what happens to users who registered before this gate existed?

5. **Common issues:**
   - Users stuck in a gate loop (redirecting endlessly)
   - Mobile users not hitting the same gates (separate auth system)
   - Profile flagged incomplete when it shouldn't be
   - Phone verification failing silently

IMPORTANT:
- NEVER remove or reorder existing gates without understanding the full impact
- Test with existing users, not just new registrations
- Mobile onboarding is independent — changes here may need separate mobile work
- Check `TokenUserState` for how the middleware determines user state
