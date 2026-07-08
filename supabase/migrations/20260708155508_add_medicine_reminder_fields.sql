/*
# Extend medicines and reminder_logs for the Medicine Reminder module

1. Purpose
The existing `medicines` and `reminder_logs` tables were created in an earlier
phase with a minimal column set. The full Medicine Reminder module needs
additional fields to capture purpose, date range, food-timing instructions,
and richer log statuses (taken / missed / upcoming).

2. Changes to `medicines`
- `purpose` (text, nullable) — what the medicine is for, e.g. "Blood pressure".
- `start_date` (date, nullable) — when the reminder schedule begins.
- `end_date` (date, nullable) — when the reminder schedule ends (null = ongoing).
- `food_timing` (text, nullable) — "before_food" | "after_food" | "with_food" | "anytime".
  A CHECK constraint restricts to those values.

3. Changes to `reminder_logs`
- `scheduled_time` (timestamptz, nullable) — the time the dose was scheduled for.
- The `status` CHECK constraint is replaced to allow: "taken" | "missed" | "upcoming" | "skipped".
  (Previously: "taken" | "skipped" | "snoozed".)
- `taken_at` is made nullable so "upcoming" and "missed" logs can exist without a taken timestamp.

4. Indexes
- `reminder_logs_user_id_created_at_idx` — speeds up history queries per user.
- `reminder_logs_medicine_id_created_at_idx` — speeds up per-medicine history.

5. Security
- No RLS policy changes. Existing owner-scoped policies remain in effect.
- All new columns are nullable so existing rows remain valid.

6. Notes
- Uses `DO $$ ... END $$` blocks for conditional column adds so the migration
  is idempotent and safe to re-run.
- The status CHECK is dropped and recreated (not IF NOT EXISTS) — safe because
  the table is empty in this environment.
*/

-- medicines: add new columns
DO $$ BEGIN
  ALTER TABLE medicines ADD COLUMN purpose text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE medicines ADD COLUMN start_date date;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE medicines ADD COLUMN end_date date;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE medicines ADD COLUMN food_timing text
    CHECK (food_timing IS NULL OR food_timing IN ('before_food', 'after_food', 'with_food', 'anytime'));
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- reminder_logs: add scheduled_time
DO $$ BEGIN
  ALTER TABLE reminder_logs ADD COLUMN scheduled_time timestamptz;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- reminder_logs: make taken_at nullable (it defaults to now() but upcoming/missed logs have no taken time)
DO $$ BEGIN
  ALTER TABLE reminder_logs ALTER COLUMN taken_at DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- reminder_logs: replace status CHECK to include 'missed' and 'upcoming'
DO $$ BEGIN
  ALTER TABLE reminder_logs DROP CONSTRAINT IF EXISTS reminder_logs_status_check;
  ALTER TABLE reminder_logs ADD CONSTRAINT reminder_logs_status_check
    CHECK (status IN ('taken', 'missed', 'upcoming', 'skipped'));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Indexes for faster history queries
CREATE INDEX IF NOT EXISTS reminder_logs_user_id_created_at_idx
  ON reminder_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS reminder_logs_medicine_id_created_at_idx
  ON reminder_logs (medicine_id, created_at DESC);
