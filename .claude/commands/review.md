Review the code in: $ARGUMENTS

Check for these issues:
1. **TypeScript**: Missing types, any usage, incorrect type assertions
2. **Prisma**: N+1 queries, missing includes, unoptimized selects, missing indexes
3. **Security**: Exposed sensitive data, missing auth checks, SQL injection risks
4. **Performance**: Unnecessary re-renders, missing React.memo, heavy computations in render
5. **Error handling**: Missing try/catch, unhandled promise rejections, generic error messages
6. **i18n**: Hardcoded Hebrew strings that should use the dictionary
7. **Mobile compatibility**: API routes under `api/mobile/` that differ from web routes
8. **Suggestion status**: Incorrect status transitions or missing status checks

Format the review as:
- 🔴 Critical (must fix)
- 🟡 Important (should fix)
- 🟢 Suggestion (nice to have)

For each issue, show the specific file, line, and proposed fix.
