# API.md — Farm SaaS v1.0.0 REST Contract

Base URL: `/api/v1`
Auth: Supabase JWT via `Authorization: Bearer <token>` (Axios interceptor). All endpoints below (except `/auth/*`) require auth + farm membership check.

## Conventions
- All list endpoints support `?farm_id=` (required — every request is farm-scoped).
- All timestamps ISO 8601. All IDs UUID.
- Errors: `{ "error": { "code": string, "message": string } }` with appropriate HTTP status.
- Pagination: `?page=&limit=` (default limit 25), response includes `{ data: [...], meta: { page, limit, total } }`.

---

## Auth
| Method | Path | Notes |
|---|---|---|
| POST | `/auth/signup` | Supabase Auth signup, triggers `profiles` row |
| POST | `/auth/login` | Returns Supabase session |
| POST | `/auth/logout` | Invalidates session |

## Farms
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/farms` | any | Farms current user is a member of |
| POST | `/farms` | any (becomes owner) | Creates farm + owner `farm_members` row |
| GET | `/farms/:id` | member | |
| PATCH | `/farms/:id` | owner | |
| GET | `/farms/:id/members` | member | List `farm_members` |
| POST | `/farms/:id/members` | owner | Invite a vet/owner by email |
| DELETE | `/farms/:id/members/:userId` | owner | Revoke membership |

## Animals
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/farms/:farmId/animals` | member | Filters: `?status=&breed=&sex=` |
| POST | `/farms/:farmId/animals` | owner | Body matches `animals` schema |
| GET | `/farms/:farmId/animals/:id` | member | Includes pedigree (sire/dam expanded) |
| PATCH | `/farms/:farmId/animals/:id` | owner | Status change to `sold` triggers withdrawal check (see below) |
| DELETE | `/farms/:farmId/animals/:id` | owner | Soft-delete recommended |
| GET | `/farms/:farmId/animals/:id/lineage` | member | Returns sire/dam chain |

**Withdrawal-block behavior**: `PATCH .../animals/:id` with `status: "sold"` returns `409 Conflict` with code `WITHDRAWAL_ACTIVE` if `vet_withdrawal_status.is_withdrawal_active` is true for that animal, unless the request includes `override: true` and `override_reason: string` — in which case it's logged to `notifications` (`type: general`) and allowed.

## Vet Records
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/farms/:farmId/vet-records` | member | Filters: `?animal_id=&from=&to=` |
| POST | `/farms/:farmId/vet-records` | owner, vet | |
| GET | `/farms/:farmId/vet-records/:id` | member | |
| PATCH | `/farms/:farmId/vet-records/:id` | owner, vet (own record) | |
| DELETE | `/farms/:farmId/vet-records/:id` | owner | |
| GET | `/farms/:farmId/vet-records/withdrawal-status` | member | Returns all animals with active withdrawal periods |

## Feed Records
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/farms/:farmId/feed-records` | member | Filters: `?animal_id=&from=&to=` |
| POST | `/farms/:farmId/feed-records` | owner | |
| GET | `/farms/:farmId/feed-records/:id` | member | |
| PATCH | `/farms/:farmId/feed-records/:id` | owner | |
| DELETE | `/farms/:farmId/feed-records/:id` | owner | |

## Import (CSV Onboarding)
| Method | Path | Role | Notes |
|---|---|---|---|
| POST | `/farms/:farmId/import/preview` | owner | Upload CSV, returns detected columns for mapping |
| POST | `/farms/:farmId/import/commit` | owner | Body: column mapping + confirmed rows → bulk insert to `animals` |

## Notifications
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/farms/:farmId/notifications` | member | Filters: `?type=&unread=true` |
| POST | `/farms/:farmId/notifications` | owner, vet | Vet-issued alerts (e.g. disease outbreak) |
| PATCH | `/farms/:farmId/notifications/:id/read` | member | Marks read for current user |

## Analytics (Rule-Based, No ML)
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/farms/:farmId/analytics/herd-composition` | member | Count by status/breed |
| GET | `/farms/:farmId/analytics/treatment-frequency` | member | `?from=&to=&groupBy=month\|week` |
| GET | `/farms/:farmId/analytics/feed-trends` | member | `?animal_id=&from=&to=` |
| GET | `/farms/:farmId/analytics/withdrawal-compliance` | member | % herd currently clear vs. in withdrawal |
