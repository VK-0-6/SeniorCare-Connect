/*
# Extend health_profiles for the full Health Profile module

1. Purpose
The existing `health_profiles` table has core fields (name, age, gender, blood
group, conditions, allergies, doctor, emergency contact, insurance). The full
Health Profile module needs additional columns: date of birth (for auto-calculated
age), height, weight, current medications, disabilities, general notes, and the
emergency contact's relationship.

2. Changes to `health_profiles`
- `date_of_birth` (date, nullable) — used to auto-calculate age on the frontend.
- `height` (text, nullable) — e.g. "5'6" or "168 cm".
- `weight` (text, nullable) — e.g. "70 kg".
- `current_medications` (text[], nullable, default '{}') — array of medication names.
- `disabilities` (text[], nullable, default '{}') — array of disabilities (optional).
- `notes` (text, nullable) — free-form notes field.
- `emergency_contact_relationship` (text, nullable) — relationship to emergency contact.

3. Security
- No RLS policy changes. Existing owner-scoped policies remain in effect.
- All new columns are nullable so existing rows remain valid.

4. Notes
- Uses `DO $$ ... END $$` blocks for conditional column adds so the migration
  is idempotent and safe to re-run.
*/

DO $$ BEGIN
  ALTER TABLE health_profiles ADD COLUMN date_of_birth date;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE health_profiles ADD COLUMN height text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE health_profiles ADD COLUMN weight text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE health_profiles ADD COLUMN current_medications text[] DEFAULT '{}';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE health_profiles ADD COLUMN disabilities text[] DEFAULT '{}';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE health_profiles ADD COLUMN notes text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE health_profiles ADD COLUMN emergency_contact_relationship text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
