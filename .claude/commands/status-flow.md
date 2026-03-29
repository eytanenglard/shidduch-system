Analyze or modify suggestion status flow for: $ARGUMENTS

The system has 27 MatchSuggestionStatus values managed by `StatusTransitionService`.

1. **If analyzing a status or transition:**
   - Read `src/components/matchmaker/suggestions/services/suggestions/StatusTransitionService.ts`
   - Read `src/components/matchmaker/suggestions/services/suggestions/StatusTransitionLogic.ts`
   - Show allowed transitions from the given status
   - Show what auto-actions happen (timestamps, notifications)
   - Show which notifications fire (email, WhatsApp, push)

2. **If checking code for status issues:**
   - Search for direct status updates that bypass `StatusTransitionService`
   - Check for missing status validations in API routes
   - Verify that terminal states (MARRIED, CLOSED, EXPIRED, CANCELLED) have no outbound transitions
   - Check that timestamps are set correctly on transitions

3. **If adding a new status or transition:**
   - Update the Prisma enum `MatchSuggestionStatus`
   - Update `StatusTransitionService` with allowed transitions
   - Update `StatusTransitionLogic` with auto-actions
   - Update notification templates if needed
   - Check mobile app status handling: `../neshamatech-mobile/src/types/index.ts`
   - Update any UI components that display status badges/labels

4. **Status flow reference:**
   ```
   DRAFT → PENDING_FIRST_PARTY → FIRST_PARTY_APPROVED/INTERESTED/DECLINED
     → PENDING_SECOND_PARTY → SECOND_PARTY_APPROVED/DECLINED
     → CONTACT_DETAILS_SHARED → DATING → ENGAGED → MARRIED
   ```
   Also: RE_OFFERED_TO_FIRST_PARTY, FIRST_PARTY_NOT_AVAILABLE, SECOND_PARTY_NOT_AVAILABLE
   Terminal: MARRIED, CLOSED, EXPIRED, CANCELLED

IMPORTANT:
- NEVER bypass StatusTransitionService — always use proper state transitions
- Matchmaker/Admin bypass (`skipValidation: true`) should be used with extreme caution
- Every transition should auto-set relevant timestamps
- Multi-channel notifications fire on transitions (can partially fail without blocking)
- Check both web and mobile when modifying statuses
