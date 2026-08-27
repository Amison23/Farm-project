# SCHEMA.md — Database Schema Reference

The database engine is **PostgreSQL** hosted on **Supabase**. The schema is defined in [`backend/schema.sql`](file:///c:/Users/mbugu/Desktop/Code/React/farm/backend/schema.sql).

---

## 1. Custom Types & Enums

- **`user_role`**: `'owner'`, `'vet'`
- **`animal_sex`**: `'male'`, `'female'`
- **`animal_status`**: `'active'`, `'sold'`, `'culled'`
- **`treatment_route`**: `'oral'`, `'injection'`, `'topical'`, `'other'`
- **`notification_type`**: `'withdrawal_ending'`, `'vaccination_due'`, `'vet_alert'`, `'general'`

---

## 2. Core Tables

### `profiles`
Mirrors Supabase Auth `auth.users` 1:1. Created automatically via trigger upon user signup.
- `id` (UUID, Primary Key, Foreign Key to `auth.users.id`)
- `full_name` (TEXT)
- `phone` (TEXT)
- `created_at` (TIMESTAMPTZ)

### `farms`
The core tenant table. Operational records belong to a farm.
- `id` (UUID, Primary Key)
- `name` (TEXT, NOT NULL)
- `location` (TEXT)
- `created_by` (UUID, Foreign Key to `profiles.id`)
- `created_at` (TIMESTAMPTZ)

### `farm_members`
Join table mapping users to farms with specific roles (`owner` or `vet`).
- `id` (UUID, Primary Key)
- `farm_id` (UUID, Foreign Key to `farms.id`)
- `user_id` (UUID, Foreign Key to `profiles.id`)
- `role` (`user_role`: `'owner'` | `'vet'`)
- `invited_at` (TIMESTAMPTZ)
- `accepted_at` (TIMESTAMPTZ, NULL indicates pending invitation)

### `animals`
Stores herd livestock records including pedigree lineage.
- `id` (UUID, Primary Key)
- `farm_id` (UUID, Foreign Key to `farms.id`)
- `sheep_id` (TEXT, client tag ID e.g., "SH-001")
- `birth_year` (INT)
- `family_line` (TEXT, Family Line / FF pedigree identifier)
- `sire_id` (UUID, Foreign Key to `animals.id` - Father)
- `dam_id` (UUID, Foreign Key to `animals.id` - Mother)
- `sex` (`animal_sex`)
- `breed` (TEXT)
- `date_of_birth` (DATE)
- `status` (`animal_status`: `'active'` | `'sold'` | `'culled'`)
- `notes` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### `vet_records`
Stores veterinary treatments and withdrawal durations.
- `id` (UUID, Primary Key)
- `farm_id` (UUID, Foreign Key to `farms.id`)
- `animal_id` (UUID, Foreign Key to `animals.id`)
- `treatment_date` (DATE)
- `product_name` (TEXT)
- `batch_number` (TEXT)
- `quantity_administered` (TEXT)
- `route` (`treatment_route`)
- `reason` (TEXT)
- `administered_by` (TEXT)
- `withdrawal_period_days` (INT, default 0)
- `veterinarian_name` (TEXT)
- `outcome` (TEXT)
- `notes` (TEXT)
- `created_by` (UUID, Foreign Key to `profiles.id`)

### `feed_records`
Logs feed consumption and nutrient supplements.
- `id` (UUID, Primary Key)
- `farm_id` (UUID, Foreign Key to `farms.id`)
- `animal_id` (UUID, Foreign Key to `animals.id`)
- `feed_date` (DATE)
- `base` (TEXT, e.g. "Lucerne")
- `nutrient_supplement` (TEXT)
- `quantity_per_head` (TEXT)
- `outcome` (TEXT)
- `created_by` (UUID, Foreign Key to `profiles.id`)

---

## 3. Database Views & Triggers

### View: `vet_withdrawal_status`
Computes active withdrawal compliance status dynamically:
```sql
SELECT
  vr.id AS vet_record_id,
  vr.animal_id,
  vr.farm_id,
  vr.treatment_date + vr.withdrawal_period_days AS withdrawal_end_date,
  (vr.treatment_date + vr.withdrawal_period_days) >= CURRENT_DATE AS is_withdrawal_active
FROM public.vet_records vr;
```

### Trigger: `on_auth_user_created`
Automatically creates a corresponding record in `public.profiles` whenever a user registers through Supabase Auth.

---

## 4. Row Level Security (RLS) Summary

All major tables have RLS enabled. Helper function `is_farm_member(farm_id)` verifies whether `auth.uid()` is an accepted member of the targeted farm.

- **`animals`**: Members can `SELECT`. Owners can `INSERT`, `UPDATE`, `DELETE`.
- **`vet_records`**: Members can `SELECT`. Owners AND Vets can `INSERT`.
- **`feed_records`**: Members can `SELECT`. Owners can `INSERT`.
- **`farms`**: Members can `SELECT`. Owners can `UPDATE`.
