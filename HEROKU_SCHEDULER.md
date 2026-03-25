# Heroku Scheduler — NeshamaTech Cron Jobs

> App: `matchpoint`
> All times in **UTC**. Israel = UTC+2 (winter) / UTC+3 (summer).
> Auth: All endpoints require `CRON_SECRET` as Bearer token unless noted otherwise.

---

## Scheduled Jobs Summary

| # | Job | Schedule | Command |
|---|-----|----------|---------|
| 1 | Rebuild Vectors | Daily 02:00 | `curl` → `/api/cron/rebuild-vectors` |
| 2 | Nightly Batch Scan | Daily 03:00 | `bash scripts/nightly-scan.sh` |
| 3 | Smart Engagement (Morning) | Daily 09:00 | `npm run engagement:daily` |
| 4 | Value Emails | Daily 10:00 | `curl` → `/api/cron/value-emails` |
| 5 | Suggestion Reminders | Daily 14:00 | `curl` → `/api/cron/suggestion-reminders` |
| 6 | Daily Auto-Suggestions | Daily 17:00 | `curl` → `/api/cron/daily-suggestions` |
| 7 | Evening Feedback | Daily 17:00 | `npm run engagement:evening` |
| 8 | Expire Suggestions | Daily 06:00 | `curl` → `/api/cron/expire-suggestions` |
| 9 | Chat Alerts | Daily 06:00 + 18:00 | `curl` → `/api/cron/chat-alerts` |
| 10 | Proactive AI Chat | Every 2h | `bash scripts/proactive-chat.sh` |
| 11 | Delayed Notifications | Every 1-2 min | `curl` → `/api/cron/send-delayed-notifications` |

---

## Detailed Commands

### 1. Rebuild Vectors
**Schedule:** Daily 02:00 UTC
**Purpose:** Rebuild stale/missing 3072-dim profile vector embeddings before nightly scan.
**Must run BEFORE nightly scan (job #2).**

```bash
curl -s -X POST $NEXT_PUBLIC_BASE_URL/api/cron/rebuild-vectors \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"
```

---

### 2. Nightly Batch Scan
**Schedule:** Daily 03:00 UTC (after vector rebuild)
**Purpose:** Run hybrid AI matching scan — vector similarity + Gemini analysis. Creates PotentialMatch records.

```bash
bash scripts/nightly-scan.sh
```

> The shell script calls `/api/ai/batch-scan-all` with `x-cron-secret` header.
> Requires: `APP_URL` and `CRON_SECRET` env vars.

---

### 3. Smart Engagement — Morning Campaign
**Schedule:** Daily 09:00 UTC (11:00 Israel)
**Purpose:** Onboarding drip campaign (days 1-7), profile completion nudges, AI insights.

```bash
npm run engagement:daily
```

> Runs `SmartEngagementOrchestrator.runDailyCampaign()`.
> Respects `engagementEmailsConsent` flag.

---

### 4. Value Emails
**Schedule:** Daily 10:00 UTC (only actually sends on **Monday & Thursday**)
**Purpose:** 10-email educational series about relationships, values, personal growth.

```bash
curl -s -X POST $NEXT_PUBLIC_BASE_URL/api/cron/value-emails \
  -H "Authorization: Bearer $CRON_SECRET"
```

> Safe to call daily — internal day-of-week check skips non Mon/Thu.

---

### 5. Suggestion Reminders (NEW)
**Schedule:** Daily 14:00 UTC (16:00 Israel)
**Purpose:** Send reminders for pending auto-suggestions that haven't been answered after 24h.
**Independent of daily-suggestions cron (runs every day, not just Sun/Wed).**

```bash
curl -s -X POST $NEXT_PUBLIC_BASE_URL/api/cron/suggestion-reminders \
  -H "Authorization: Bearer $CRON_SECRET"
```

> Dedup: Max 1 reminder per 24h per suggestion (tracked via SuggestionStatusHistory).
> Only reminds if deadline hasn't passed yet.

---

### 6. Daily Auto-Suggestions
**Schedule:** Daily 17:00 UTC (19:00 Israel)
**Purpose:** Send one auto-suggestion to each eligible user. **Only runs on Sunday & Wednesday** (internal check).

```bash
curl -s -X POST $NEXT_PUBLIC_BASE_URL/api/cron/daily-suggestions \
  -H "Authorization: Bearer $CRON_SECRET"
```

> Fire-and-forget: returns immediately, processes in background.
> Also sends 24h reminders for existing pending auto-suggestions.
> Can be triggered manually from matchmaker dashboard (any day).

---

### 7. Evening Feedback Campaign
**Schedule:** Daily 17:00 UTC (19:00 Israel)
**Purpose:** Evening feedback collection emails — asks users about their day/activity.

```bash
npm run engagement:evening
```

> Runs `SmartEngagementOrchestrator.runEveningCampaign()`.

---

### 8. Expire Suggestions (NEW)
**Schedule:** Daily 06:00 UTC (08:00 Israel)
**Purpose:** Auto-expire suggestions where `decisionDeadline` has passed without a response.

```bash
curl -s -X POST $NEXT_PUBLIC_BASE_URL/api/cron/expire-suggestions \
  -H "Authorization: Bearer $CRON_SECRET"
```

> Transitions PENDING_FIRST_PARTY / PENDING_SECOND_PARTY → EXPIRED.
> Notifies all parties (email + WhatsApp + push).

---

### 9. Chat Alerts
**Schedule:** Twice daily — 06:00 + 18:00 UTC
**Purpose:** Detect unresponsive users (3+ days) and stale suggestions (7+ days). Creates alerts for matchmakers.

```bash
curl -s -X POST $NEXT_PUBLIC_BASE_URL/api/cron/chat-alerts \
  -H "x-cron-secret: $CRON_SECRET"
```

> ⚠️ **Note:** Uses `x-cron-secret` header, NOT `Authorization: Bearer`.

---

### 10. Proactive AI Chat
**Schedule:** Every 2 hours
**Purpose:** Send proactive AI chat messages to users with pending suggestions (24h+ old) and post-decline follow-ups.

```bash
bash scripts/proactive-chat.sh
```

> The shell script calls `/api/ai-chat/proactive` with Bearer token.
> Max 20 messages per run. Sends push notifications.

---

### 11. Delayed Notifications + Stale Matchmaker Reminders
**Schedule:** Every 1-2 minutes
**Purpose:**
- Notify matchmakers when first party approves (after 5-min grace period).
- Remind matchmakers about auto-suggestions stuck in FIRST_PARTY_APPROVED for 12+ hours.

```bash
curl -s -X POST $NEXT_PUBLIC_BASE_URL/api/cron/send-delayed-notifications \
  -H "Authorization: Bearer $CRON_SECRET"
```

> High frequency required for grace period logic.
> Stale reminder dedup: max 1 per 12h per suggestion.

---

## Required Environment Variables

```bash
# These must be set as Heroku Config Vars:
CRON_SECRET=<secret>                    # Auth for all cron endpoints
NEXT_PUBLIC_BASE_URL=https://...        # Public app URL
DATABASE_URL=postgres://...             # PostgreSQL connection
GEMINI_API_KEY=<key>                    # For vector rebuild + AI scans
RESEND_API_KEY=<key>                    # For sending emails
EMAIL_FROM=<email>                      # Sender email address
NEXTAUTH_SECRET=<secret>               # For JWT tokens (opt-out links)
```

---

## Recommended Daily Timeline (UTC)

```
02:00  Rebuild Vectors (prep for scan)
03:00  Nightly Batch Scan (AI matching)
06:00  Expire Suggestions + Chat Alerts (morning)
09:00  Smart Engagement (morning emails)
10:00  Value Emails (Mon/Thu only)
14:00  Suggestion Reminders
17:00  Daily Auto-Suggestions (Sun/Wed) + Evening Feedback
18:00  Chat Alerts (evening)

Every 2h:  Proactive AI Chat
Every 1-2min:  Delayed Notifications
```

---

## Notes

- **Heroku Scheduler** supports: Daily, Hourly, Every 10 minutes.
  For "every 1-2 minutes" (job #11), consider using a worker dyno with a loop or an external cron service.
- All cron endpoints return JSON with `{ success, processed, errors }` format.
- All endpoints have 5-minute max execution time (Next.js).
- `daily-suggestions` uses fire-and-forget (returns immediately).
- Day-of-week filtering is internal — safe to schedule daily.
