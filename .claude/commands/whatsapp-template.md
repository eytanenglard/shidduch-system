Create a WhatsApp message template for: $ARGUMENTS

The system uses Twilio for WhatsApp messaging.

1. **Check existing WhatsApp patterns:**
   - Search for Twilio integration in `src/lib/` and `src/lib/services/`
   - Check how existing notifications send WhatsApp messages
   - Look at engagement orchestrators for WhatsApp usage patterns

2. **Template guidelines:**
   - Hebrew first (RTL text works natively in WhatsApp)
   - Keep messages short and personal — WhatsApp is intimate
   - Include a clear CTA with a link when needed
   - Use `NEXT_PUBLIC_BASE_URL` for links
   - Respect Twilio message character limits
   - No HTML — WhatsApp uses *bold*, _italic_, ~strikethrough~, ```monospace```

3. **Personalization variables:**
   - First name (always available)
   - Matchmaker name (for suggestion notifications)
   - Suggestion details (for match-related messages)
   - Link to action (profile, suggestion, questionnaire)

4. **Integration:**
   - Add to the appropriate notification trigger in `StatusTransitionService` or engagement orchestrator
   - Ensure the message is sent alongside email (multi-channel)
   - Handle Twilio failures gracefully — don't block the main operation
   - Check rate limiting rules

5. **Tone:**
   - Warm and personal, not robotic
   - Match the brand tone: authentic, humble, professional
   - Feel like a message from a real matchmaker, not a system notification

IMPORTANT:
- WhatsApp messages should complement emails, not duplicate them
- Notification failures must NOT block status transitions or other operations
- Always include opt-out option
- Test with Hebrew characters to ensure proper encoding
