# ROADMAP.md — Farm SaaS v1.0.0 Build Plan

Each phase is independently shippable, verified against `docs/SCHEMA.md`, and scoped to ~1–2 weeks. No phase closes on self-reported completion — DoD items must be demonstrated (screenshot, test run, or working demo) before moving on.

---

#### Phase 0 — Foundations
**Goal**: Monorepo, Supabase project, and schema exist and are provably connected end-to-end.
**Deliverables**:
- [ ] npm workspaces root (`frontend/`, `backend/`) + `concurrently` dev script
- [ ] Supabase project created; `schema.sql` applied (all tables, enums, triggers, RLS from `docs/SCHEMA.md`)
- [ ] Backend `supabaseClient.ts` config + health-check route
- [ ] Frontend Expo app boots on iOS, Android, and Web with a placeholder screen
**Definition of Done**:
- [ ] `npm run dev:all` starts both services with no errors
- [ ] Health-check endpoint returns 200 and confirms DB connectivity
- [ ] App runs on all 3 platforms via Expo Go / Expo Web with no platform-specific crash
**Blocked by**: nothing

---

#### Phase 1 — Auth & Farm Membership
**Goal**: A user can sign up, create a farm, and the multi-tenant membership model works and is provably isolated.
**Deliverables**:
- [ ] Supabase Auth signup/login wired (frontend + `AuthContext`)
- [ ] `handle_new_user` trigger creates `profiles` row
- [ ] `POST /farms` creates farm + owner `farm_members` row
- [ ] Farm Select screen + `FarmContext` (active farm)
- [ ] `farmMembership` backend middleware
**Definition of Done**:
- [ ] Two test accounts, each owning a separate farm, cannot see each other's farm via API or UI (manually verified, not assumed)
- [ ] A single test account can create 2 farms and switch between them
- [ ] RLS policies on `farms`/`farm_members` tested directly in Supabase SQL editor with a non-owner JWT and confirmed to return zero rows for a foreign farm
**Blocked by**: Phase 0

---

#### Phase 2 — Animal Records (Core CRUD)
**Goal**: Full animal record management, including pedigree, works end-to-end on all 3 platforms.
**Deliverables**:
- [x] `animals` repository/service/controller + routes
- [x] Animals list, add, detail, edit screens
- [x] Sire/Dam picker (searches existing animals within farm)
- [x] Lineage view (`GET .../:id/lineage`)
**Definition of Done**:
- [x] Full CRUD verified via API calls (not just UI) against a real Supabase instance
- [x] Pedigree chain (sire → dam → grandparents) renders correctly for a seeded 3-generation test animal
- [x] Status badges (Active/Sold/Culled) render consistently list + detail
- [x] Confirmed working on iOS, Android, Web
**Blocked by**: Phase 1

---

#### Phase 3 — Vet Records & Withdrawal Compliance
**Goal**: Vet record logging works, and the withdrawal-period compliance rule is enforced server-side, not just in the UI.
**Deliverables**:
- [x] `vet_records` repository/service/controller + routes (owner + vet write access)
- [x] `vet_withdrawal_status` view wired into API (`/vet-records/withdrawal-status`)
- [x] Withdrawal-block logic in animal status-change service (`409 WITHDRAWAL_ACTIVE`, override + reason path)
- [x] Vet Records add/list/detail screens
- [x] Withdrawal badge shown on animal cards where active
**Definition of Done**:
- [x] Attempting to mark an animal "sold" during an active withdrawal period is blocked by the API directly (tested via raw API call, bypassing UI) — confirms it's not a client-side-only check
- [x] Override path logs a `notifications` row with the reason
- [x] Vet test account (Amison-equivalent for this project) can write vet records on a farm they're a member of, and is rejected on a farm they're not
**Blocked by**: Phase 2

---

#### Phase 4 — Feed Records
**Goal**: Feed logging complete and linked to animal + outcome tracking.
**Deliverables**:
- [ ] `feed_records` repository/service/controller + routes (owner-only write)
- [ ] Feed Records add/list/detail screens
**Definition of Done**:
- [ ] Full CRUD verified via API
- [ ] Feed history visible from Animal detail screen
**Blocked by**: Phase 2

---

#### Phase 5 — CSV Import (Onboarding)
**Goal**: Owner can bulk-import their existing Excel-derived data without hand-entering every row.
**Deliverables**:
- [x] `/import/preview` — CSV upload, column detection
- [x] Column-mapping UI (map arbitrary headers → fixed schema fields)
- [x] `/import/commit` — validated bulk insert into `animals`
**Definition of Done**:
- [x] A real (anonymized) export of the client's Excel data imports successfully end-to-end with zero silent field loss
- [x] Malformed/missing-required-field rows are rejected with a clear per-row error, not a failed whole-batch import
**Blocked by**: Phase 2

---

#### Phase 6 — Notifications
**Goal**: Push notifications work for withdrawal, vaccination-due, and vet-issued alerts.
**Deliverables**:
- [ ] Expo Notifications wired (push token registration)
- [ ] `notifications` repository/service/controller + routes
- [ ] Rule-based triggers: withdrawal-ending, vaccination-due (cadence-based, no ML)
- [ ] Notifications list screen + unread badge
**Definition of Done**:
- [ ] A seeded vet_record nearing its withdrawal end date produces a notification, verified in the DB and delivered to a real test device
- [ ] Vet-issued alert from one farm does not appear for a different farm's members
**Blocked by**: Phase 3

---

#### Phase 7 — Rule-Based Analytics Dashboard
**Goal**: Dashboard shows real, computed insight — not hardcoded mock stats.
**Deliverables**:
- [ ] `/analytics/*` endpoints (herd composition, treatment frequency, feed trends, withdrawal compliance)
- [ ] Dashboard screen consuming real data, replacing all mock/hardcoded stats
**Definition of Done**:
- [ ] Every number on the dashboard is traceable to a real query against seeded test data (spot-checked manually)
- [ ] Dashboard renders correctly at mobile and web breakpoints
**Blocked by**: Phase 3, Phase 4

---

#### Phase 7.5 — UI Guiding Error Messages & Debug Diagnostics
**Goal**: Standardize user-friendly error banners, field-level validation feedback, and actionable debugging diagnostics across all screens and API routes to make troubleshooting fast and clear.
**Deliverables**:
- [ ] Standardized `ErrorMessageBanner` and `FieldErrorText` components with actionable guidance across all modules
- [ ] Unified API error code dictionary in `frontend/services/api.ts` (`DUPLICATE_SHEEP_ID`, `FORBIDDEN_FARM_ACCESS`, `WITHDRAWAL_ACTIVE`, `NETWORK_ERROR`, etc.) mapping all server controller errors to helpful user guidance
- [ ] Expandable developer debug drawer/toggle showing HTTP status, endpoint, error code, and timestamp in dev builds
- [ ] Inline form field validation highlighting (red border + specific field error text) for all forms
- [ ] Global Error Boundary and toast notification fallback for uncaught network/server failures
**Definition of Done**:
- [ ] Every form and user action across all endpoints presents clear, actionable guidance on error rather than raw stack traces or generic messages
- [ ] In dev mode, expandable debug metadata can be inspected directly in the UI without requiring developer console access
- [ ] Field-specific backend validation errors highlight the exact input field with guidance text across all app modules
**Blocked by**: Phase 7

---

#### Phase 8 — Cross-Platform Polish & Responsive Web
**Goal**: The app looks and works like one product across iOS, Android, and Web — not a mobile app awkwardly stretched.
**Deliverables**:
- [ ] Responsive NativeWind breakpoints applied across all screens (sidebar nav on web, multi-column where appropriate)
- [ ] FotMob-inspired visual pass: color-coded status system, card density, typography consistency
- [ ] Empty states for all list screens
**Definition of Done**:
- [ ] Full walkthrough (auth → farm → animals → vet records → feed → notifications → dashboard) completed on all 3 platforms with no broken layout or missing feature
**Blocked by**: Phase 7.5

---

#### Phase 9 — Release Prep
**Goal**: Client-ready builds exist for all 3 platforms.
**Deliverables**:
- [ ] EAS Build config for iOS + Android
- [ ] Expo Web export + hosting deployment
- [ ] Backend deployed (host per `docs/ARCHITECTURE.md`)
- [ ] Seed/demo data removed from production Supabase project
- [ ] Security Hardening: Remove development Tag ID fallback lookup in animal endpoints (restrict lookups strictly to primary UUIDs)
- [ ] Compliance Guard: Lock Tag ID (`sheep_id`) re-assignment editing after initial animal creation once onboarding phase completes
**Definition of Done**:
- [ ] Installable iOS + Android build handed to a test device, not just simulator/Expo Go
- [ ] Web dashboard live at a real URL
- [ ] Backend production environment variables confirmed separate from dev
**Blocked by**: Phase 8

---

## Deferred to v1.1+
- Custom/dynamic per-farm JSON schemas
- ML/AI-driven analytics or forecasting
- Individual worker login accounts
- Billing/subscription enforcement
- Government livestock traceability integration (if applicable)
