# ARCHITECTURE.md — Farm SaaS Architecture & Guidelines

## 1. Monorepo Structure

```text
/
├── frontend/                  -- Expo Router app (iOS, Android, Web)
│   ├── app/
│   │   ├── (auth)/            -- Login, Signup screens
│   │   └── (app)/
│   │       └── [farmId]/      -- Farm-scoped dashboard, animals, vet, feed screens
│   ├── components/
│   │   ├── ui/                -- Generic cross-screen components (Button, Card, Badge)
│   │   └── farm/              -- Domain components (AnimalCard, WithdrawalBadge)
│   ├── contexts/              -- AuthContext, FarmContext, ThemeContext
│   ├── services/
│   │   └── api.ts             -- Axios instance with auth interceptors
│   ├── hooks/                 -- useAnimals, useVetRecords, useFeedRecords, useAnalytics
│   ├── types/                 -- Shared frontend TypeScript types
│   └── theme/                 -- NativeWind theme configuration
│
├── backend/                   -- Node.js + Express + TypeScript
│   ├── src/
│   │   ├── routes/            -- farmRoutes, animalRoutes, vetRecordRoutes, etc.
│   │   ├── controllers/       -- HTTP handling, input validation, response formatting
│   │   ├── services/          -- Pure business logic (withdrawal calculations, CSV validation)
│   │   ├── repositories/      -- Database access layer (Supabase SDK)
│   │   ├── middleware/        -- Auth verification & farmMembership guard
│   │   ├── types/             -- Backend DTOs & request definitions
│   │   └── config/            -- Supabase client singleton setup
│   └── schema.sql             -- Complete database schema & RLS definitions
│
├── docs/                      -- Public developer documentation
└── package.json               -- Root npm workspaces configuration
```

---

## 2. Coding & Naming Conventions

- **Files**: `camelCase.ts` for logic files, `PascalCase.tsx` for React components, `kebab-case` for route directories (Expo Router standard).
- **Database**: `snake_case` for database tables and columns (PostgreSQL standard). Mapped to `camelCase` at the API boundary in DTOs.
- **Types**: Domain types are stored under `types/<domain>.ts` (e.g. `types/animal.ts`). Frontend and backend DTO definitions are kept cleanly structured and synchronized.

---

## 3. Backend Layering Rules

To keep the backend codebase scalable and easy to test:

```text
[ Express Route ]
       │
       ▼
[ Controller ]   ---> Validates request body/params, handles HTTP errors. NO direct DB calls.
       │
       ▼
[ Service ]      ---> Pure business logic (e.g., drug withdrawal checks). NO req/res objects.
       │
       ▼
[ Repository ]   ---> Database queries using Supabase SDK. ONLY place Supabase client is invoked.
```

- **Controllers**: Parse input, validate payloads (e.g., via Zod), call service methods, and return standard HTTP JSON responses.
- **Services**: Contain business rules (e.g. calculating `withdrawal_end_date`, validating pedigree parent references).
- **Repositories**: Execute database queries against Supabase tables and views.

---

## 4. Multi-Tenancy Enforcement (Defense in Depth)

Data isolation between different farms is secured by **three complementary layers**:

1. **Database Row Level Security (RLS)**: Enforced directly inside PostgreSQL on Supabase. Guarantees that users cannot query or mutate data for a farm unless they have an active row in `farm_members`.
2. **Backend Express Middleware (`farmMembership`)**: Intercepts requests containing a `farm_id` parameter and verifies membership before the request reaches the controller.
3. **Frontend Context (`FarmContext`)**: Data fetching hooks automatically read the active `farm_id` from the global `FarmContext`, preventing accidental cross-farm queries.

---

## 5. Cross-Platform Discipline (Expo + Web)

- **Dependency Auditing**: Any npm package added to `frontend` must support Expo Web, iOS, and Android seamlessly.
- **Platform Separation**: Avoid messy inline platform conditions where possible. Use Metro platform-specific file extensions (`Component.native.tsx` / `Component.web.tsx`) when platform behavior differs significantly.

---

## 6. Environment & Configuration Summary

| Variable | Environment | Purpose |
| --- | --- | --- |
| `PORT` | Backend `.env` | Express server port (default: 5000) |
| `SUPABASE_URL` | Backend `.env` | Supabase API connection URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend `.env` | Admin key for backend database operations |
| `EXPO_PUBLIC_API_URL` | Frontend `.env` | Backend API URL endpoint |
| `EXPO_PUBLIC_SUPABASE_URL` | Frontend `.env` | Public Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Frontend `.env` | Anonymous client key for Supabase Auth |
