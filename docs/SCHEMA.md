# SCHEMA.md — Farm SaaS v1.0.0 (Fixed Relational Schema)

Every column below maps to an Excel field or a confirmed v1 feature. No dynamic/JSON schema in v1.

## Enums

```sql
create type user_role as enum ('owner', 'vet');
create type animal_sex as enum ('male', 'female');
create type animal_status as enum ('active', 'sold', 'culled');
create type treatment_route as enum ('oral', 'injection', 'topical', 'other');
create type notification_type as enum ('withdrawal_ending', 'vaccination_due', 'vet_alert', 'general');
```

## Tables

### `profiles`
Mirrors `auth.users`, created via trigger on signup.

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  created_at timestamptz not null default now()
);
```

### `farms`
```sql
create table farms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);
```

### `farm_members`
Join table enabling: one owner → many farms, one vet → many farms.

```sql
create table farm_members (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role user_role not null,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (farm_id, user_id)
);
```

### `animals`
Maps to Excel `animal` sheet.

```sql
create table animals (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  sheep_id text not null,               -- client-facing identifier
  birth_year int,
  family_line text,                     -- Family Line (FF)
  sire_id uuid references animals(id),  -- pedigree
  dam_id uuid references animals(id),   -- pedigree
  sex animal_sex not null,
  breed text not null,
  date_of_birth date,
  status animal_status not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (farm_id, sheep_id)
);
```

### `vet_records`
Maps to Excel `vet_records` sheet. Withdrawal tracking is derived, not a separate column, to avoid drift.

```sql
create table vet_records (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  animal_id uuid not null references animals(id) on delete cascade,
  treatment_date date not null,
  product_name text not null,
  batch_number text,
  quantity_administered text,
  route treatment_route not null default 'other',
  reason text,
  administered_by text,                 -- free text (no worker accounts in v1)
  withdrawal_period_days int not null default 0,
  veterinarian_name text,
  outcome text,
  notes text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);
```

A generated/derived value (computed in application layer or a view) determines `withdrawal_end_date = treatment_date + withdrawal_period_days`. See view below.

```sql
create view vet_withdrawal_status as
select
  vr.id as vet_record_id,
  vr.animal_id,
  vr.farm_id,
  vr.treatment_date + vr.withdrawal_period_days as withdrawal_end_date,
  (vr.treatment_date + vr.withdrawal_period_days) >= current_date as is_withdrawal_active
from vet_records vr;
```

### `feed_records`
Maps to Excel `feed` sheet.

```sql
create table feed_records (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  animal_id uuid not null references animals(id) on delete cascade,
  feed_date date not null,
  base text not null,
  nutrient_supplement text,
  quantity_per_head text,
  outcome text,
  notes text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);
```

### `notifications`
```sql
create table notifications (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  related_animal_id uuid references animals(id),
  created_by uuid references profiles(id),  -- null for system-generated
  created_at timestamptz not null default now(),
  read_by uuid[] default '{}'
);
```

## Triggers

### Auto-create profile on signup
```sql
create function handle_new_user() returns trigger as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

### `updated_at` maintenance on `animals`
```sql
create function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger animals_set_updated_at
  before update on animals
  for each row execute function set_updated_at();
```

## Row Level Security (RLS)

All tenant-scoped tables (`farms`, `animals`, `vet_records`, `feed_records`, `notifications`) enforce access via `farm_members`.

```sql
alter table farms enable row level security;
alter table animals enable row level security;
alter table vet_records enable row level security;
alter table feed_records enable row level security;
alter table notifications enable row level security;
alter table farm_members enable row level security;

-- Helper: is the current user a member of this farm?
create function is_farm_member(target_farm_id uuid) returns boolean as $$
  select exists (
    select 1 from farm_members
    where farm_id = target_farm_id
    and user_id = auth.uid()
    and accepted_at is not null
  );
$$ language sql security definer stable;

-- farms
create policy "members can view their farms"
  on farms for select using (is_farm_member(id));
create policy "owners can update their farms"
  on farms for update using (
    exists (select 1 from farm_members where farm_id = id and user_id = auth.uid() and role = 'owner')
  );

-- animals
create policy "members can view animals" on animals for select using (is_farm_member(farm_id));
create policy "owners can write animals" on animals for insert with check (
  exists (select 1 from farm_members where farm_id = animals.farm_id and user_id = auth.uid() and role = 'owner')
);
create policy "owners can update animals" on animals for update using (
  exists (select 1 from farm_members where farm_id = animals.farm_id and user_id = auth.uid() and role = 'owner')
);

-- vet_records: owners AND vets can write (vets need write access here specifically)
create policy "members can view vet_records" on vet_records for select using (is_farm_member(farm_id));
create policy "owners and vets can write vet_records" on vet_records for insert with check (
  exists (select 1 from farm_members where farm_id = vet_records.farm_id and user_id = auth.uid() and role in ('owner','vet'))
);

-- feed_records: owner-only write
create policy "members can view feed_records" on feed_records for select using (is_farm_member(farm_id));
create policy "owners can write feed_records" on feed_records for insert with check (
  exists (select 1 from farm_members where farm_id = feed_records.farm_id and user_id = auth.uid() and role = 'owner')
);

-- notifications
create policy "members can view notifications" on notifications for select using (is_farm_member(farm_id));
create policy "members can create notifications" on notifications for insert with check (is_farm_member(farm_id));

-- farm_members
create policy "members can view farm membership" on farm_members for select using (is_farm_member(farm_id));
create policy "owners can manage membership" on farm_members for insert with check (
  exists (select 1 from farm_members fm where fm.farm_id = farm_members.farm_id and fm.user_id = auth.uid() and fm.role = 'owner')
  or farm_members.role = 'owner' -- allow initial owner self-insert on farm creation
);
```

## Compliance Enforcement Note
Blocking an animal's `status` transition to `sold` while `vet_withdrawal_status.is_withdrawal_active = true` is enforced at the **application layer** (not a hard DB constraint), so an explicit owner override with a logged reason remains possible — but the check must run server-side, not just in the UI.
