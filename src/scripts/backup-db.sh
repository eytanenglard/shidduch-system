#!/bin/bash
# =============================================================================
# scripts/backup-db.sh
# גיבוי יומי אוטומטי של הדאטאבייס ל-S3
# =============================================================================
#
# הגדרה ב-Heroku Scheduler:
#   1. heroku addons:open scheduler --app matchpoint
#   2. הוסף Job: src/scripts/backup-db.sh
#   3. תזמון: Daily, 03:00 UTC
#
# משתני סביבה נדרשים (ב-Heroku Config Vars):
#   DATABASE_URL          - כתובת הדאטאבייס (כבר קיים)
#   S3_BACKUP_BUCKET      - שם ה-bucket ב-S3 (למשל: eytan-neon-db-backups)
#   AWS_ACCESS_KEY_ID     - מפתח AWS
#   AWS_SECRET_ACCESS_KEY - סוד AWS
#   AWS_DEFAULT_REGION    - אזור (למשל: eu-central-1)
#
# הרצה ידנית:
#   heroku run src/scripts/backup-db.sh --app matchpoint
#
# =============================================================================

set -euo pipefail

echo "=========================================="
echo "📦 NeshamaTech - Database Backup"
echo "=========================================="
echo "Time: $(date)"
echo ""

# --- Validation ---
if [ -z "${DATABASE_URL:-}" ]; then
    echo "❌ DATABASE_URL is not set"
    exit 1
fi

if [ -z "${S3_BACKUP_BUCKET:-}" ]; then
    echo "❌ S3_BACKUP_BUCKET is not set"
    exit 1
fi

# --- Install AWS CLI if not available (Heroku) ---
if ! command -v aws &> /dev/null; then
    echo "📥 Installing AWS CLI..."
    curl -s "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"
    unzip -q /tmp/awscliv2.zip -d /tmp/aws-install
    /tmp/aws-install/aws/install --install-dir /tmp/aws-cli --bin-dir /tmp/aws-bin
    export PATH="/tmp/aws-bin:$PATH"
    echo "✅ AWS CLI installed"
fi

# --- Generate filename ---
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="/tmp/neshamatech_backup_${TIMESTAMP}.dump"
S3_KEY="backups/neshamatech_backup_${TIMESTAMP}.dump"

# --- Run pg_dump ---
echo "🚀 Starting pg_dump..."
START_TIME=$(date +%s)

pg_dump "$DATABASE_URL" \
    --format=custom \
    --compress=6 \
    --no-owner \
    --no-privileges \
    --file="$BACKUP_FILE"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

echo "✅ Dump completed in ${DURATION}s (${FILE_SIZE})"

# --- Upload to S3 ---
echo "☁️  Uploading to s3://${S3_BACKUP_BUCKET}/${S3_KEY}..."

aws s3 cp "$BACKUP_FILE" "s3://${S3_BACKUP_BUCKET}/${S3_KEY}" --quiet

echo "✅ Upload successful"

# --- Cleanup old backups (keep last 30 days) ---
echo "🧹 Cleaning up backups older than 30 days..."

CUTOFF_DATE=$(date -d "30 days ago" +"%Y-%m-%d" 2>/dev/null || date -v-30d +"%Y-%m-%d" 2>/dev/null || echo "")

if [ -n "$CUTOFF_DATE" ]; then
    aws s3 ls "s3://${S3_BACKUP_BUCKET}/backups/" 2>/dev/null | while read -r line; do
        FILE_DATE=$(echo "$line" | awk '{print $1}')
        FILE_NAME=$(echo "$line" | awk '{print $4}')
        if [ -n "$FILE_NAME" ] && [[ "$FILE_DATE" < "$CUTOFF_DATE" ]]; then
            echo "   🗑️  Deleting old backup: $FILE_NAME"
            aws s3 rm "s3://${S3_BACKUP_BUCKET}/backups/${FILE_NAME}" --quiet
        fi
    done
    echo "✅ Cleanup done"
else
    echo "⚠️  Could not determine cutoff date, skipping cleanup"
fi

# --- Cleanup local file ---
rm -f "$BACKUP_FILE"

# --- Summary ---
echo ""
echo "=========================================="
echo "✅ Backup completed successfully!"
echo "=========================================="
echo "   File: ${S3_KEY}"
echo "   Size: ${FILE_SIZE}"
echo "   Time: ${DURATION}s"
echo "   Date: $(date)"
echo "=========================================="
echo ""
echo "📋 To restore:"
echo "   aws s3 cp s3://${S3_BACKUP_BUCKET}/${S3_KEY} backup.dump"
echo "   pg_restore --clean --if-exists -d \$DATABASE_URL backup.dump"
echo "=========================================="
