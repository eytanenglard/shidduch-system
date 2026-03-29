Write tests for: $ARGUMENTS

Follow these conventions:

1. **Framework:** Vitest (already configured)
2. **Location:** `src/__tests__/` — mirror the source file structure
   - Services: `src/__tests__/services/`
   - API routes: `src/__tests__/api/`
   - Components: `src/__tests__/components/`
   - Utils/lib: `src/__tests__/lib/`

3. **Test file naming:** `<filename>.test.ts` (or `.test.tsx` for components)

4. **Reference existing tests for patterns:**
   - `src/__tests__/services/compatibilityServiceV2.test.ts` — service testing pattern
   - `src/__tests__/lib/rate-limiter.test.ts` — utility testing pattern
   - `src/__tests__/lib/api-error.test.ts` — error handling pattern

5. **Mock patterns:**
   - Mock Prisma: `vi.mock('@/lib/prisma')` with specific method mocks
   - Mock services: Mock at the module level, not inline
   - Mock NextAuth: `vi.mock('next-auth')` for session-dependent routes
   - Do NOT mock the function you're testing

6. **Domain-specific test cases to always consider:**
   - Male/Female pairing (all matching is MALE↔FEMALE)
   - MatchSuggestionStatus transitions (27 statuses with strict flow)
   - Deal breakers (hard vs soft, score = 0 vs penalty)
   - Hebrew/RTL text handling
   - Role-based access (CANDIDATE vs MATCHMAKER vs ADMIN)
   - Edge cases: missing profile, unverified phone, incomplete questionnaire
   - Inferred values fallback chain: explicit → inferred → default

7. **Test structure:**
   ```typescript
   describe('ServiceName', () => {
     describe('methodName', () => {
       it('should handle the happy path', () => { ... });
       it('should handle edge case X', () => { ... });
       it('should throw on invalid input', () => { ... });
     });
   });
   ```

8. **Run tests after writing:** `npm test -- --run <test-file-path>`

IMPORTANT:
- Focus on business logic, not implementation details
- Test the public API of each module, not internal functions
- Include both positive and negative test cases
- For matching services: always test both directions (A→B and B→A)
