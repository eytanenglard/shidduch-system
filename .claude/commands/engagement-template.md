Create a new engagement email template for: $ARGUMENTS

Follow the existing engagement system architecture:

1. **Create Handlebars template:**
   - Location: `src/lib/email/templates/`
   - Use existing templates as reference (check the directory for patterns)
   - Include Hebrew RTL layout (`dir="rtl"`)
   - Use the existing email design system (colors, fonts, spacing)
   - Include unsubscribe link
   - Make it responsive (mobile-friendly)

2. **Add i18n strings:**
   - Add subject line and body text to `dictionaries/email/he.json` and `dictionaries/email/en.json`
   - If email dictionaries don't exist as separate files, add to main `dictionaries/he.json` and `en.json`

3. **Integrate with engagement orchestrator:**
   - Check existing orchestrators in `src/scripts/` and `src/lib/engagement/`
   - Key orchestrators: SmartEngagementOrchestrator, ValueEmailOrchestrator, DailySuggestionOrchestrator
   - Determine which orchestrator should trigger this template (or if a new adapter is needed)
   - Add the template to the appropriate adapter/segment

4. **Template data interface:**
   - Define TypeScript interface for template variables
   - Ensure all variables are provided by the orchestrator
   - Include fallback values for optional fields

5. **Testing:**
   - Show a preview of the rendered template with sample data
   - Verify Hebrew text renders correctly in RTL
   - Check that links and CTAs work

IMPORTANT:
- All user-facing text in Hebrew (with English translation available)
- Email templates use Resend for sending
- WhatsApp messages may also need to be created alongside email (via Twilio)
- Notification failures should not block other operations
- Check `src/lib/email/` for the email sending service pattern
- Rate limiting applies to email sending (check role-based multipliers)
