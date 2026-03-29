Check performance issues in: $ARGUMENTS

Analyze the specified file, route, or service for performance problems.

1. **Prisma query optimization:**
   - 🔴 N+1 queries: Look for queries inside loops (`.map()`, `.forEach()`, `for...of`)
   - 🔴 Missing `select`: Queries that load entire models when only a few fields are needed
   - 🔴 Unnecessary `include` of heavy relations (especially `ProfileVector` with 3072-dim arrays)
   - 🟡 Missing pagination: `findMany()` without `take`/`skip` on large tables
   - 🟡 Missing `where` filters that could narrow results
   - 🟢 Consider `findFirst` vs `findUnique` when only one result is expected

2. **React component performance (for .tsx files):**
   - 🔴 Heavy computations inside render (no useMemo/useCallback)
   - 🔴 Unnecessary re-renders from object/array literals in props
   - 🟡 Missing React.memo on list item components
   - 🟡 Large lists without virtualization
   - 🟢 Inline function definitions in event handlers within loops

3. **API route performance:**
   - 🔴 Sequential DB calls that could be parallelized with `Promise.all()`
   - 🔴 Loading all records when only a count is needed (`count()` vs `findMany()`)
   - 🟡 Missing caching for expensive operations (check Upstash Redis usage)
   - 🟡 Heavy processing that could be moved to background jobs
   - 🟢 Response payload size (don't return unused fields)

4. **Matching system specific:**
   - 🔴 Vector loading when not needed (3072-dim = ~24KB per vector)
   - 🔴 ScannedPair not being checked before re-scoring
   - 🟡 AI batch sizes > 10 (AI_BATCH_SIZE = 10)
   - 🟡 Not respecting RESCAN_COOLDOWN_DAYS (7 days)
   - 🟢 Metrics recalculation when profile hasn't changed

Output format:
- 🔴 Critical (fix now) — with specific line numbers and proposed fix
- 🟡 Important (should fix) — with explanation of impact
- 🟢 Suggestion (nice to have) — with optimization idea

For each issue, show the current code and the optimized version.
