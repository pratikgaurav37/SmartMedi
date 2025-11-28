# Supabase Cron Job Setup for Telegram Notifications

This guide explains how to set up automated medication reminders using Supabase's `pg_cron` extension and Telegram notifications.

## Overview

Supabase supports PostgreSQL's `pg_cron` extension, which allows you to schedule recurring jobs directly in your database. We'll use this to check for upcoming medication doses and send Telegram notifications.

## Prerequisites

- Supabase project with database access
- Telegram bot token (from `TELEGRAM_BOT_TOKEN` in your `.env`)
- Edge Functions enabled in your Supabase project

## Step 1: Enable pg_cron Extension

1. Go to your Supabase Dashboard
2. Navigate to **Database** → **Extensions**
3. Search for `pg_cron` and enable it

Or run this SQL:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

## Step 2: Create Edge Function for Sending Reminders

Create a Supabase Edge Function to handle the reminder logic:

```bash
# In your project root
supabase functions new send-medication-reminders
```

Create `supabase/functions/send-medication-reminders/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

serve(async (req) => {
	try {
		const supabase = createClient(
			Deno.env.get("SUPABASE_URL")!,
			Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
		);

		// Get current time
		const now = new Date();
		const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
		const todayStr = now.toISOString().split("T")[0];

		// Find all medications with scheduled times matching current time (±5 min window)
		const { data: medications, error: medsError } = await supabase
			.from("medications")
			.select("*");

		if (medsError) throw medsError;

		for (const med of medications || []) {
			// Check if any of the medication's times match current time
			for (const time of med.times || []) {
				const [hours, minutes] = time.split(":").map(Number);
				const scheduledDate = new Date();
				scheduledDate.setHours(hours, minutes, 0, 0);

				const timeDiff = Math.abs(now.getTime() - scheduledDate.getTime());
				const isWithinWindow = timeDiff <= 5 * 60 * 1000; // 5 minutes

				if (isWithinWindow) {
					const logId = `${med.id}_${todayStr}_${time}`;

					// Check if already logged
					const { data: existingLog } = await supabase
						.from("dose_logs")
						.select("*")
						.eq("id", logId)
						.single();

					if (!existingLog) {
						// Get user profile for Telegram chat ID
						const { data: profile } = await supabase
							.from("user_profiles")
							.select("telegram_chat_id, name")
							.eq("id", med.user_id)
							.single();

						if (profile?.telegram_chat_id) {
							// Send Telegram notification
							const message =
								`💊 Medication Reminder\n\n` +
								`Hi ${profile.name}!\n` +
								`Time to take: ${med.name}\n` +
								`Dosage: ${med.dosage}\n` +
								`Scheduled: ${time}`;

							await fetch(
								`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
								{
									method: "POST",
									headers: { "Content-Type": "application/json" },
									body: JSON.stringify({
										chat_id: profile.telegram_chat_id,
										text: message,
										parse_mode: "HTML",
									}),
								}
							);

							console.log(
								`Sent reminder for ${med.name} to user ${med.user_id}`
							);
						}
					}
				}
			}
		}

		return new Response(
			JSON.stringify({ success: true, message: "Reminders processed" }),
			{ headers: { "Content-Type": "application/json" } }
		);
	} catch (error) {
		console.error("Error:", error);
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
});
```

## Step 3: Deploy Edge Function

```bash
# Deploy the function
supabase functions deploy send-medication-reminders

# Set environment variables
supabase secrets set TELEGRAM_BOT_TOKEN=your_bot_token_here
```

## Step 4: Create Cron Job

Run this SQL in your Supabase SQL Editor:

```sql
-- Schedule the job to run every 5 minutes
SELECT cron.schedule(
  'send-medication-reminders',  -- Job name
  '*/5 * * * *',                -- Cron expression (every 5 minutes)
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-medication-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_ANON_KEY'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

**Replace:**

- `YOUR_PROJECT_REF` with your Supabase project reference
- `YOUR_ANON_KEY` with your anon/public key from Supabase settings

## Step 5: Verify Cron Job

Check if the cron job is scheduled:

```sql
SELECT * FROM cron.job;
```

View cron job execution history:

```sql
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

## Alternative: Simpler Database-Only Approach

If you prefer not to use Edge Functions, you can create a PostgreSQL function:

```sql
-- Create function to send Telegram notifications
CREATE OR REPLACE FUNCTION send_telegram_notification(
  chat_id TEXT,
  message TEXT
) RETURNS void AS $$
DECLARE
  bot_token TEXT := 'YOUR_BOT_TOKEN';
  telegram_url TEXT;
BEGIN
  telegram_url := 'https://api.telegram.org/bot' || bot_token || '/sendMessage';

  PERFORM net.http_post(
    url := telegram_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'chat_id', chat_id,
      'text', message
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check and send reminders
CREATE OR REPLACE FUNCTION check_medication_reminders()
RETURNS void AS $$
DECLARE
  med RECORD;
  profile RECORD;
  current_time TIME;
  scheduled_time TIME;
  log_id TEXT;
  today_str TEXT;
  message TEXT;
BEGIN
  current_time := CURRENT_TIME;
  today_str := CURRENT_DATE::TEXT;

  FOR med IN
    SELECT * FROM medications WHERE deleted_at IS NULL
  LOOP
    FOR scheduled_time IN
      SELECT unnest(med.times)::TIME
    LOOP
      -- Check if within 5-minute window
      IF ABS(EXTRACT(EPOCH FROM (current_time - scheduled_time))) <= 300 THEN
        log_id := med.id || '_' || today_str || '_' || scheduled_time::TEXT;

        -- Check if not already logged
        IF NOT EXISTS (SELECT 1 FROM dose_logs WHERE id = log_id) THEN
          -- Get user profile
          SELECT * INTO profile
          FROM user_profiles
          WHERE id = med.user_id;

          IF profile.telegram_chat_id IS NOT NULL THEN
            message := '💊 Medication Reminder' || E'\n\n' ||
                      'Hi ' || profile.name || '!' || E'\n' ||
                      'Time to take: ' || med.name || E'\n' ||
                      'Dosage: ' || med.dosage || E'\n' ||
                      'Scheduled: ' || scheduled_time::TEXT;

            PERFORM send_telegram_notification(
              profile.telegram_chat_id,
              message
            );
          END IF;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule the cron job
SELECT cron.schedule(
  'medication-reminders',
  '*/5 * * * *',  -- Every 5 minutes
  'SELECT check_medication_reminders();'
);
```

## Cron Expression Reference

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, Sunday = 0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

Examples:

- `*/5 * * * *` - Every 5 minutes
- `0 * * * *` - Every hour
- `0 8,12,18 * * *` - At 8 AM, 12 PM, and 6 PM
- `*/15 * * * *` - Every 15 minutes

## Monitoring and Debugging

### View cron job logs:

```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'medication-reminders')
ORDER BY start_time DESC;
```

### Manually trigger the job:

```sql
SELECT check_medication_reminders();
```

### Unschedule a job:

```sql
SELECT cron.unschedule('medication-reminders');
```

## Best Practices

1. **Use Edge Functions** for complex logic and external API calls
2. **Set appropriate intervals** - Every 5 minutes is reasonable for medication reminders
3. **Add error handling** - Log failures to a separate table
4. **Monitor execution** - Regularly check `cron.job_run_details`
5. **Use service role key** for Edge Functions to bypass RLS
6. **Add rate limiting** - Prevent spam if something goes wrong
7. **Test thoroughly** - Use manual triggers before scheduling

## Troubleshooting

**Cron job not running:**

- Check if `pg_cron` extension is enabled
- Verify the cron expression syntax
- Check `cron.job_run_details` for errors

**Telegram messages not sending:**

- Verify `TELEGRAM_BOT_TOKEN` is correct
- Check user has `telegram_chat_id` in their profile
- Test the Telegram API directly with curl

**Performance issues:**

- Add indexes on frequently queried columns
- Limit the time window for checking medications
- Consider batching notifications

## Next Steps

1. Enable `pg_cron` extension in Supabase
2. Choose between Edge Function or database-only approach
3. Deploy and test with a single user
4. Monitor logs for the first few days
5. Adjust timing and logic as needed
