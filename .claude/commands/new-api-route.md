Create a new API route at `src/app/api/$ARGUMENTS`.

Follow these conventions:
1. Create a `route.ts` file with proper Next.js App Router handler
2. Import prisma from `@/lib/prisma`
3. Use NextResponse for responses with proper HTTP status codes
4. Add try/catch error handling
5. For matchmaker routes: verify session and role === 'MATCHMAKER' or 'ADMIN'
6. For user routes: verify session exists
7. For mobile routes under `api/mobile/`: add CORS-compatible headers
8. Use Zod for request body validation when applicable
9. Return JSON responses: `{ success: true, data: ... }` or `{ error: "message" }`

Reference existing patterns in `src/app/api/matchmaker/` and `src/app/api/user/` for style.
