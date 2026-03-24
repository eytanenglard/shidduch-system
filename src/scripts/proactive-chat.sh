#!/bin/bash
# =============================================================================
# scripts/proactive-chat.sh
# סקריפט להפעלת הודעות פרואקטיביות של הצ'אט בוט דרך Heroku Scheduler
# רץ כל שעה - שולח תזכורות ומעקבים אוטומטיים
# =============================================================================

APP_URL="${NEXT_PUBLIC_BASE_URL:-${NEXTAUTH_URL:-https://neshamatech.com}}"
CRON_SECRET="${CRON_SECRET:-${INTERNAL_API_SECRET}}"

echo "=========================================="
echo "Proactive AI Chat Messages"
echo "=========================================="
echo "Time: $(date)"
echo "App URL: $APP_URL"
echo ""

if [ -z "$CRON_SECRET" ]; then
    echo "Error: CRON_SECRET environment variable is not set"
    exit 1
fi

echo "Sending proactive messages..."

RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "${APP_URL}/api/ai-chat/proactive" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${CRON_SECRET}")

HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

echo ""
echo "Response Code: $HTTP_CODE"
echo "Response Body: $HTTP_BODY"

if [ "$HTTP_CODE" -eq 200 ]; then
    echo ""
    echo "Proactive messages sent successfully!"
else
    echo ""
    echo "Failed with status code: $HTTP_CODE"
    exit 1
fi

echo ""
echo "=========================================="
echo "Done"
echo "=========================================="
