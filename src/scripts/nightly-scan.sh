#!/bin/bash
# =============================================================================
# scripts/nightly-scan.sh
# סקריפט להפעלת הסריקה הלילית דרך Heroku Scheduler
# =============================================================================
#
# הוראות התקנה ב-Heroku:
# 1. הוסף את Heroku Scheduler: heroku addons:create scheduler:standard
# 2. פתח את הדשבורד: heroku addons:open scheduler
# 3. הוסף Job חדש עם הפקודה: scripts/nightly-scan.sh
# 4. הגדר את התזמון ל-03:00 AM או זמן אחר שמתאים
#
# =============================================================================

# הגדרת משתנים
APP_URL="${NEXT_PUBLIC_APP_URL:-${NEXTAUTH_URL:-https://your-app.herokuapp.com}}"
CRON_SECRET="${CRON_SECRET:-${INTERNAL_API_SECRET}}"

echo "=========================================="
echo "🌙 NeshamaTech Nightly Scan"
echo "=========================================="
echo "Time: $(date)"
echo "App URL: $APP_URL"
echo ""

# בדיקה שהסוד קיים
if [ -z "$CRON_SECRET" ]; then
    echo "❌ Error: CRON_SECRET environment variable is not set"
    exit 1
fi

# הפעלת הסריקה
echo "🚀 Starting batch scan..."

RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "${APP_URL}/api/ai/batch-scan-all" \
    -H "Content-Type: application/json" \
    -H "x-cron-secret: ${CRON_SECRET}" \
    -d '{"method": "algorithmic", "minScoreThreshold": 70}')

# פיצול התגובה לגוף וקוד סטטוס
HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

echo ""
echo "Response Code: $HTTP_CODE"
echo "Response Body: $HTTP_BODY"

# בדיקת הצלחה
if [ "$HTTP_CODE" -eq 200 ]; then
    echo ""
    echo "✅ Scan completed successfully!"
else
    echo ""
    echo "❌ Scan failed with status code: $HTTP_CODE"
    exit 1
fi

echo ""
echo "=========================================="
echo "🏁 Nightly scan finished"
echo "=========================================="
