# PRD — Farm Management SaaS (v1.0.0)

## 1. Overview
A multi-tenant farm management platform, built first for a sheep farming client in Kenya, architected for resale to other farms. Digitises Excel-based herd, veterinary, and feed records into a cross-platform (iOS, Android, Web) app with real-time sync, compliance tracking, and role-based access.

## 2. Goals
- Replace the client's Excel workflow with zero data loss and zero added friction.
- Preserve pedigree/breeding-value data (Sire ID, Dam ID, Family Line) as first-class data.
- Make legally-required vet withdrawal-period tracking impossible to miss.
- Support a farm owner running multiple farms, and a vet servicing multiple farms.
- Ship lean: every feature traces back to the Excel schema or a confirmed need below.

## 3. Non-Goals (v1.0.0)
- Custom/dynamic per-user schemas (deferred — v1 uses a fixed relational schema).
- ML/AI-driven analytics or forecasting (deferred to v1.1 — v1 ships rule-based analytics only).
- Billing/subscription enforcement (schema supports it; no payment flow in v1).
- Worker-level individual logins (owner/supervisor logs on their behalf in v1).

## 4. User Personas & Roles

| Role | Description | Belongs to |
|---|---|---|
| **Owner** | Runs one or more farms. Full CRUD on their farm(s)' animals, vet records, feed records. Manages farm membership (invites vets). | 1+ farms |
| **Vet** | External, can be invited to and service multiple farms. Read access to animal records on farms they're linked to; write access scoped to `vet_records`. | 1+ farms |
| **Worker** *(data-only in v1)* | Not a login. Referenced as free-text (`administered_by`, logged-by) within records the Owner enters. Individual worker accounts are a v1.1 candidate if farm size warrants it. | n/a |

A single Supabase Auth user (`profiles`) can be linked to multiple farms via a `farm_members` join table with a per-farm role — this is what allows one farmer to run several farms, and one vet to service several farms, without duplicating accounts.

## 5. Core Features (v1.0.0)

### 5.1 Animal Records
Full CRUD mapped 1:1 to the Excel `animal` sheet, including pedigree fields (Sire ID, Dam ID, Family Line/FF) and status lifecycle (Active/Sold/Culled).

### 5.2 Vet / Treatment Records
Full CRUD mapped to the Excel `vet_records` sheet. **Withdrawal period is a compliance feature**: the app computes and surfaces a withdrawal-end date (treatment date + withdrawal days) per animal, and blocks/flags any "Sold" status change while an active withdrawal period is open.

### 5.3 Feed Records
Full CRUD mapped to the Excel `feed` sheet, including outcome/response tracking for basic yield correlation.

### 5.4 CSV/Excel Import (Onboarding)
On first farm setup, the owner can bulk-import their existing Excel records via CSV against the fixed schema (column-mapping step to handle variation in the client's original headers).

### 5.5 Multi-Farm / Multi-Tenant Access
Owner can create and switch between multiple farms. Vet can be invited to a farm and switches between farms they service. Row Level Security guarantees no cross-farm data leakage.

### 5.6 Notifications
Push notifications (Expo Notifications) for:
- Withdrawal period ending soon / animal cleared for sale.
- Vet-issued alerts to a farm (e.g. disease outbreak warning) — vet-initiated, farm-scoped.
- Upcoming/overdue vaccinations (derived from `vet_records` cadence, rule-based, no ML).

### 5.7 Rule-Based Analytics (Dashboard)
Charts and trend summaries computed with straightforward aggregation (no ML in v1):
- Herd composition by status/breed.
- Treatment frequency over time.
- Feed cost/quantity per head over time.
- Withdrawal-period compliance status across the herd.

## 6. Platform & Deployment
- **Platforms**: iOS, Android, Web — single Expo Router + NativeWind codebase, responsive breakpoints for web layout.
- **Testing**: Expo Go during development.
- **Release**: EAS Build for iOS/Android app stores; Expo Web static export/hosting for the web dashboard.
- Library choices must be checked for cross-platform parity (no platform-exclusive dependencies) so no feature is iOS/Android/Web-exclusive by accident.

## 7. Compliance
- Withdrawal period tracking (legal, livestock meat/milk safety) is high priority — see 5.2.
- No other regulatory requirements identified yet (flagged as unknown; revisit if Kenyan livestock traceability requirements surface).

## 8. Out of Scope for v1.0.0 (candidates for v1.1+)
- Custom per-farm dynamic schemas (JSON-defined fields).
- ML-based forecasting/analytics.
- Individual worker login accounts.
- Billing/subscription enforcement.
- Government traceability scheme integration (if one applies).

## 9. Success Criteria
- Client's full Excel dataset importable with zero field loss.
- An owner can run 2+ farms and a vet can service 2+ farms without any data crossover (verified via RLS testing).
- No animal can be marked "Sold" while inside an open withdrawal period without an explicit override + logged reason.
- App is fully usable (all core CRUD + dashboard) on iOS, Android, and Web from the same codebase.
