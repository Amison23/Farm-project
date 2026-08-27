-- ─── 0. CLEANUP LEGACY TABLES ────────────────────────────────────────────────
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.feed_records CASCADE;
DROP TABLE IF EXISTS public.feed CASCADE;
DROP TABLE IF EXISTS public.vet_records CASCADE;
DROP TABLE IF EXISTS public.animals CASCADE;
DROP TABLE IF EXISTS public.farm_members CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.workers CASCADE;
DROP TABLE IF EXISTS public.fields CASCADE;
DROP TABLE IF EXISTS public.farms CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ─── 1. EXTENSIONS ───────────────────────────────────────────────────────────
-- gen_random_uuid() is built-in on Postgres 13+; no extension needed.


-- ─── 2. ENUMS ────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner', 'vet');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE animal_sex AS ENUM ('male', 'female');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE animal_status AS ENUM ('active', 'sold', 'culled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE treatment_route AS ENUM ('oral', 'injection', 'topical', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('withdrawal_ending', 'vaccination_due', 'vet_alert', 'general');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ─── 3. PROFILES ─────────────────────────────────────────────────────────────
-- Mirrors auth.users 1:1. Created automatically by handle_new_user trigger.
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT        NOT NULL DEFAULT '',
  phone       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─── 4. FARMS ────────────────────────────────────────────────────────────────
-- The tenant table. Every piece of operational data belongs to a farm.
CREATE TABLE IF NOT EXISTS public.farms (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  location    TEXT,                            -- e.g. "Imara Daima", "Naivasha"
  created_by  UUID        NOT NULL REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─── 5. FARM MEMBERS ─────────────────────────────────────────────────────────
-- Join table: one user → many farms, one farm → many users.
-- Enables owner and vet personas (per docs/PRD.md §4).
CREATE TABLE IF NOT EXISTS public.farm_members (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id     UUID        NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role        user_role   NOT NULL,
  invited_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,                     -- NULL = pending invitation
  UNIQUE (farm_id, user_id)
);


-- ─── 6. ANIMALS ──────────────────────────────────────────────────────────────
-- Maps to Excel `animal` sheet. All original columns preserved.
CREATE TABLE IF NOT EXISTS public.animals (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id     UUID          NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  sheep_id    TEXT          NOT NULL,           -- client-facing ID (e.g. "SH-001")
  birth_year  INT,
  family_line TEXT,                             -- Family Line (FF) — pedigree group
  sire_id     UUID          REFERENCES public.animals(id) ON DELETE SET NULL,  -- father
  dam_id      UUID          REFERENCES public.animals(id) ON DELETE SET NULL,  -- mother
  sex         animal_sex    NOT NULL,
  breed       TEXT          NOT NULL,           -- e.g. Dorper, Merino
  date_of_birth DATE,
  status      animal_status NOT NULL DEFAULT 'active',
  notes       TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (farm_id, sheep_id)                    -- sheep_id unique within a farm
);


-- ─── 7. VET RECORDS ──────────────────────────────────────────────────────────
-- Maps to Excel `vet_records` sheet.
-- withdrawal_end_date is DERIVED (treatment_date + withdrawal_period_days).
-- See vet_withdrawal_status view below — do not add a separate column.
CREATE TABLE IF NOT EXISTS public.vet_records (
  id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id                 UUID            NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  animal_id               UUID            NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  treatment_date          DATE            NOT NULL,
  product_name            TEXT            NOT NULL,
  batch_number            TEXT,
  quantity_administered   TEXT,
  route                   treatment_route NOT NULL DEFAULT 'other',
  reason                  TEXT,
  administered_by         TEXT,           -- free text; no worker accounts in v1
  withdrawal_period_days  INT             NOT NULL DEFAULT 0,
  veterinarian_name       TEXT,
  outcome                 TEXT,
  notes                   TEXT,
  created_by              UUID            NOT NULL REFERENCES public.profiles(id),
  created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);


-- ─── 8. FEED RECORDS ─────────────────────────────────────────────────────────
-- Maps to Excel `feed` sheet.
CREATE TABLE IF NOT EXISTS public.feed_records (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id             UUID        NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  animal_id           UUID        NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  feed_date           DATE        NOT NULL,
  base                TEXT        NOT NULL,   -- main forage (e.g. "Lucerne")
  nutrient_supplement TEXT,
  quantity_per_head   TEXT,
  outcome             TEXT,
  notes               TEXT,
  created_by          UUID        NOT NULL REFERENCES public.profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─── 9. NOTIFICATIONS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id                UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id           UUID              NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  type              notification_type NOT NULL,
  title             TEXT              NOT NULL,
  body              TEXT,
  related_animal_id UUID              REFERENCES public.animals(id),
  created_by        UUID              REFERENCES public.profiles(id), -- NULL = system
  created_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  read_by           UUID[]            DEFAULT '{}'
);


-- ─── 10. VIEWS ───────────────────────────────────────────────────────────────
-- Withdrawal compliance view.
-- is_withdrawal_active = true if today is before (or on) the withdrawal end date.
CREATE OR REPLACE VIEW public.vet_withdrawal_status AS
SELECT
  vr.id                 AS vet_record_id,
  vr.animal_id,
  vr.farm_id,
  vr.treatment_date + vr.withdrawal_period_days AS withdrawal_end_date,
  (vr.treatment_date + vr.withdrawal_period_days) >= CURRENT_DATE AS is_withdrawal_active
FROM public.vet_records vr;


-- ─── 11. TRIGGERS ────────────────────────────────────────────────────────────

-- Trigger: auto-create profile row when a user signs up via Supabase Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for existing users
INSERT INTO public.profiles (id, full_name)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users
ON CONFLICT (id) DO NOTHING;


-- Trigger: keep animals.updated_at current on every row update.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS animals_set_updated_at ON public.animals;
CREATE TRIGGER animals_set_updated_at
  BEFORE UPDATE ON public.animals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ─── 12. ROW LEVEL SECURITY ──────────────────────────────────────────────────

ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vet_records   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;


-- Helper function: is the calling user an accepted member of this farm?
-- Used by all farm-scoped RLS policies to avoid repetition.
CREATE OR REPLACE FUNCTION public.is_farm_member(target_farm_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.farm_members
    WHERE farm_id   = target_farm_id
      AND user_id   = auth.uid()
      AND accepted_at IS NOT NULL
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- profiles: users can read/update their own profile only.
DROP POLICY IF EXISTS "users can view own profile"   ON public.profiles;
DROP POLICY IF EXISTS "users can update own profile" ON public.profiles;
CREATE POLICY "users can view own profile"   ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());


-- farms: members can view their farms, owners can update, authenticated users can create farms.
DROP POLICY IF EXISTS "members can view their farms"  ON public.farms;
DROP POLICY IF EXISTS "owners can update their farms" ON public.farms;
DROP POLICY IF EXISTS "users can create farms"       ON public.farms;
CREATE POLICY "members can view their farms"
  ON public.farms FOR SELECT USING (is_farm_member(id));
CREATE POLICY "owners can update their farms"
  ON public.farms FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.farm_members
      WHERE farm_id = id AND user_id = auth.uid() AND role = 'owner' AND accepted_at IS NOT NULL
    )
  );
CREATE POLICY "users can create farms"
  ON public.farms FOR INSERT WITH CHECK (true);


-- farm_members: members can view membership; owners can insert (invite or self-insert on farm creation).
DROP POLICY IF EXISTS "members can view farm membership" ON public.farm_members;
DROP POLICY IF EXISTS "owners can manage membership"     ON public.farm_members;
CREATE POLICY "members can view farm membership"
  ON public.farm_members FOR SELECT USING (is_farm_member(farm_id));
CREATE POLICY "owners can manage membership"
  ON public.farm_members FOR INSERT WITH CHECK (
    -- Allow service_role admin client, initial owner self-insert, or existing owner invitations
    auth.role() = 'service_role'
    OR (user_id = auth.uid() AND role = 'owner')
    OR EXISTS (
      SELECT 1 FROM public.farm_members fm
      WHERE fm.farm_id = farm_members.farm_id
        AND fm.user_id = auth.uid()
        AND fm.role = 'owner'
        AND fm.accepted_at IS NOT NULL
    )
  );


-- animals: members read, owners write.
DROP POLICY IF EXISTS "members can view animals"  ON public.animals;
DROP POLICY IF EXISTS "owners can insert animals" ON public.animals;
DROP POLICY IF EXISTS "owners can update animals" ON public.animals;
DROP POLICY IF EXISTS "owners can delete animals" ON public.animals;
CREATE POLICY "members can view animals"  ON public.animals FOR SELECT USING (is_farm_member(farm_id));
CREATE POLICY "owners can insert animals" ON public.animals FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.farm_members WHERE farm_id = animals.farm_id AND user_id = auth.uid() AND role = 'owner' AND accepted_at IS NOT NULL)
);
CREATE POLICY "owners can update animals" ON public.animals FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.farm_members WHERE farm_id = animals.farm_id AND user_id = auth.uid() AND role = 'owner' AND accepted_at IS NOT NULL)
);
CREATE POLICY "owners can delete animals" ON public.animals FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.farm_members WHERE farm_id = animals.farm_id AND user_id = auth.uid() AND role = 'owner' AND accepted_at IS NOT NULL)
);


-- vet_records: members read; owners AND vets can write (vet has write access here specifically).
DROP POLICY IF EXISTS "members can view vet_records"        ON public.vet_records;
DROP POLICY IF EXISTS "owners and vets can write vet_records" ON public.vet_records;
CREATE POLICY "members can view vet_records" ON public.vet_records FOR SELECT USING (is_farm_member(farm_id));
CREATE POLICY "owners and vets can write vet_records" ON public.vet_records FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farm_members
    WHERE farm_id = vet_records.farm_id AND user_id = auth.uid()
      AND role IN ('owner', 'vet') AND accepted_at IS NOT NULL
  )
);


-- feed_records: members read, owners write.
DROP POLICY IF EXISTS "members can view feed_records"  ON public.feed_records;
DROP POLICY IF EXISTS "owners can write feed_records"  ON public.feed_records;
CREATE POLICY "members can view feed_records"  ON public.feed_records FOR SELECT USING (is_farm_member(farm_id));
CREATE POLICY "owners can write feed_records"  ON public.feed_records FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.farm_members WHERE farm_id = feed_records.farm_id AND user_id = auth.uid() AND role = 'owner' AND accepted_at IS NOT NULL)
);


-- notifications: all members can read and create (vet-issued alerts need insert access).
DROP POLICY IF EXISTS "members can view notifications"   ON public.notifications;
DROP POLICY IF EXISTS "members can create notifications" ON public.notifications;
CREATE POLICY "members can view notifications"   ON public.notifications FOR SELECT USING (is_farm_member(farm_id));
CREATE POLICY "members can create notifications" ON public.notifications FOR INSERT WITH CHECK (is_farm_member(farm_id));
