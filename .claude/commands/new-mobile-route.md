Create a new mobile API route at `src/app/api/mobile/$ARGUMENTS`.

Follow these conventions:

1. **Route file** (`route.ts`):
   - Import `verifyMobileToken` from `@/lib/auth/mobileAuth`
   - Import `corsJson`, `corsError` from `@/lib/cors`
   - Import `prisma` from `@/lib/prisma`
   - Export an `OPTIONS` handler for CORS preflight
   - Use `verifyMobileToken(req)` for authentication (NOT NextAuth)
   - Use Zod for request body validation
   - Return responses with `corsJson()` (not NextResponse)
   - Return errors with `corsError()` (not NextResponse)
   - Response format: `{ success: true, data: ... }` or `{ success: false, error: "message" }`

2. **CORS OPTIONS handler pattern:**
   ```typescript
   export async function OPTIONS() {
     return new Response(null, {
       status: 200,
       headers: {
         'Access-Control-Allow-Origin': '*',
         'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
         'Access-Control-Allow-Headers': 'Content-Type, Authorization',
       },
     });
   }
   ```

3. **Auth pattern:**
   ```typescript
   const tokenUser = await verifyMobileToken(req);
   if (!tokenUser) {
     return corsError('Unauthorized', 401);
   }
   ```

4. **Reference existing routes** in `src/app/api/mobile/` for patterns:
   - GET routes: `src/app/api/mobile/profile/route.ts`
   - POST routes: `src/app/api/mobile/suggestions/*/route.ts`
   - Routes with params: `src/app/api/mobile/suggestions/[id]/route.ts`

5. **After creating the route**, also create the mobile service wrapper:
   - Location: `../neshamatech-mobile/src/services/api/`
   - Use the existing API client pattern from other service files there

IMPORTANT:
- Mobile auth is completely separate from web auth (JWT vs NextAuth)
- Mobile profiles start with `isProfileVisible: false`
- Always add try/catch error handling
- Check if a similar web route exists and reuse the service logic
