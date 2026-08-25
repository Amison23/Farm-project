# ARCHITECTURE.md — Farm SaaS v1.0.0

## Monorepo Structure

```
/
├── frontend/                  -- Expo Router app (iOS, Android, Web)
│   ├── app/
│   │   ├── (auth)/
│   │   └── (app)/
│   │       └── [farmId]/
│   ├── components/
│   │   ├── ui/                -- generic, cross-screen (Badge, Card, Button)
│   │   └── farm/               -- domain-specific (AnimalCard, WithdrawalBadge)
│   ├── contexts/               -- AuthContext, FarmContext (active farm), ThemeContext
│   ├── services/
│   │   └── api.ts              -- Axios instance, interceptors
│   ├── hooks/                  -- useAnimals, useVetRecords, useFeedRecords, useAnalytics
│   ├── types/                  -- shared TS types (mirrors backend DTOs)
│   └── theme/                  -- NativeWind config, color tokens, responsive breakpoints
│
├── backend/                    -- Node.js + Express + TypeScript
│   ├── src/
│   │   ├── routes/             -- farmRoutes, animalRoutes, vetRecordRoutes, feedRecordRoutes,
│   │   │                          notificationRoutes, analyticsRoutes, importRoutes
│   │   ├── controllers/
│   │   ├── services/           -- business logic (e.g. withdrawal-check service)
│   │   ├── repositories/       -- Supabase query layer
│   │   ├── middleware/          -- auth (JWT verify), farmMembership (RLS-mirroring guard)
│   │   ├── types/
│   │   └── config/             -- supabaseClient.ts
│   └── schema.sql               -- source of truth, mirrors docs/SCHEMA.md
│
├── docs/
│   ├── PRD.md
│   ├── SCHEMA.md
│   ├── API.md
│   ├── UI_FLOWS.md
│   └── ARCHITECTURE.md
│
├── package.json                -- npm workspaces root
└── ROADMAP.md
```

## Naming Conventions
- **Files**: `camelCase.ts` for logic files, `PascalCase.tsx` for components, `kebab-case` for route segments (Expo Router convention).
- **DB**: `snake_case` tables/columns (Postgres convention), mapped to `camelCase` at the API boundary (controllers/DTOs), not further up.
- **Types**: one `types/<domain>.ts` per domain (e.g. `types/animal.ts`), shared shape between frontend and backend kept manually in sync (no shared package in v1 — revisit if drift becomes painful).

## Layering Rules
- **Controllers**: parse/validate request, call service, shape response. No direct Supabase calls.
- **Services**: business logic only (e.g. withdrawal-period check, import row validation). No Express req/res objects passed in.
- **Repositories**: only place Supabase client is used directly. One repository per table/domain.
- Frontend **hooks** are the only place screens talk to `services/api.ts` — no raw Axios calls inside components.

## Multi-Tenancy Enforcement (Defense in Depth)
1. **RLS** (Supabase) — the ultimate backstop, enforced at the DB layer regardless of app bugs.
2. **`farmMembership` middleware** (backend) — checks `farm_id` in the route against the caller's `farm_members` before hitting a controller, so bad requests fail fast with a clear 403 rather than relying solely on RLS silently returning empty sets.
3. **`FarmContext`** (frontend) — every data-fetching hook reads the active `farm_id` from context; there is no code path that lets a component request another farm's `farm_id` without explicitly switching context first.

## Cross-Platform Discipline
- Any new npm package must be checked for Expo Web + native compatibility before adoption — no platform-exclusive dependency gets added without an explicitly documented fallback for the other platforms.
- Platform-specific code, if unavoidable, lives in `*.native.tsx` / `*.web.tsx` file pairs (Expo/Metro convention) rather than inline `Platform.OS` branching, to keep components readable.

## Environment & Config
- `frontend/.env` — `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- `backend/.env` — `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PORT`.
- `concurrently` (`npm run dev:all`) runs both dev servers from root.

## Deployment
- **Backend**: containerized Node service (host TBD — Railway/Render candidate based on prior project experience).
- **Frontend mobile**: EAS Build → App Store / Play Store.
- **Frontend web**: Expo Web static export, hosted separately (Vercel/Netlify candidate).
