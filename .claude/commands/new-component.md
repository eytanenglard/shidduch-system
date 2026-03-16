Create a new React component for: $ARGUMENTS

Follow these conventions:
1. Determine the correct subfolder in `src/components/` (matchmaker/, profile/, suggestions/, chat/, ui/, auth/, admin/)
2. Create a functional component with TypeScript
3. Use Tailwind CSS for styling — follow the brand palette:
   - Primary: Teal shades (teal-500, teal-600, teal-700)
   - Secondary: Orange/Amber (amber-500, orange-500)
   - Accent: Rose/Pink (rose-400, rose-500)
4. Use Radix UI primitives from existing imports when applicable (Dialog, Popover, Select, etc.)
5. Support RTL layout — use `dir="rtl"` aware classes and logical properties
6. Use the i18n dictionary system for ALL user-facing text — no hardcoded Hebrew
7. Use SWR for data fetching if the component needs server data
8. Add Framer Motion animations sparingly for meaningful interactions
9. Use Lucide React for icons (already installed)

Reference existing components for patterns:
- Complex components: `src/components/matchmaker/`
- UI primitives: `src/components/ui/`
- Form patterns: Check existing react-hook-form + zod usage
