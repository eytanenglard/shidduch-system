Generate API documentation for: $ARGUMENTS

If a specific route is given, document that route. If a directory is given, document all routes in it.

1. **Read the route file(s)** and extract:
   - HTTP method (GET, POST, PUT, DELETE)
   - URL path with parameters
   - Authentication requirement (NextAuth session / Mobile JWT / Public)
   - Required role (CANDIDATE, MATCHMAKER, ADMIN, or any)
   - Request body schema (from Zod validation)
   - Query parameters
   - Response schema (success and error cases)
   - Rate limiting rules

2. **Document format for each endpoint:**
   ```
   ## METHOD /api/path/:param

   **Auth:** NextAuth (MATCHMAKER) | Mobile JWT | Public
   **Rate Limit:** Yes/No (multiplier)

   ### Request
   - Params: `id` (string) — description
   - Query: `page` (number, optional) — description
   - Body:
     ```json
     { "field": "type — description" }
     ```

   ### Response (200)
   ```json
   { "success": true, "data": { ... } }
   ```

   ### Errors
   - 401: Unauthorized
   - 403: Forbidden (wrong role)
   - 404: Not found
   - 422: Validation error
   ```

3. **For mobile routes** (`api/mobile/`):
   - Note CORS requirements
   - Show the `OPTIONS` preflight response
   - Reference the mobile service wrapper if it exists

4. **Cross-reference:**
   - Link to related routes (e.g., GET + POST + PUT for same resource)
   - Note if a web route has a corresponding mobile route
   - List which services the route calls

Do NOT create a separate documentation file. Output the documentation directly in the conversation.
