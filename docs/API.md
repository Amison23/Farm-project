# API.md — REST API Specifications

The backend server is an Express application running on Node.js. It acts as an API gateway and business logic enforcement layer over Supabase PostgreSQL.

---

## 1. Authentication & Security Headers

All requests to farm-scoped endpoints require authorization headers:

```http
Authorization: Bearer <supabase-jwt-token>
```

The `auth` middleware verifies the JWT against Supabase Auth. The `farmMembership` middleware verifies that the user belongs to the requested `:farmId`.

---

## 2. API Endpoints Overview

### Farm Management Routes (`/api/farms`)

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| `GET` | `/api/farms` | List all farms user belongs to | Authenticated |
| `POST` | `/api/farms` | Create a new farm | Authenticated |
| `GET` | `/api/farms/:farmId` | Get detailed farm information | Farm Member |
| `PUT` | `/api/farms/:farmId` | Update farm details | Farm Owner |

---

### Animal Herd Routes (`/api/farms/:farmId/animals`)

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| `GET` | `/api/farms/:farmId/animals` | List all animals in herd (supports filter by status/sex) | Farm Member |
| `POST` | `/api/farms/:farmId/animals` | Create a new animal record | Farm Owner |
| `GET` | `/api/farms/:farmId/animals/:id` | Get single animal details & lineage | Farm Member |
| `PUT` | `/api/farms/:farmId/animals/:id` | Update animal record (e.g. status change) | Farm Owner |
| `DELETE` | `/api/farms/:farmId/animals/:id` | Soft/Hard delete animal record | Farm Owner |

---

### Veterinary Records Routes (`/api/farms/:farmId/vet-records`)

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| `GET` | `/api/farms/:farmId/vet-records` | List vet treatment logs | Farm Member |
| `POST` | `/api/farms/:farmId/vet-records` | Log new treatment & compute withdrawal | Owner or Vet |
| `GET` | `/api/farms/:farmId/vet-records/active-withdrawals` | Fetch active medication withdrawal warnings | Farm Member |

---

### Feed Records Routes (`/api/farms/:farmId/feed-records`)

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| `GET` | `/api/farms/:farmId/feed-records` | Fetch feed logs for farm | Farm Member |
| `POST` | `/api/farms/:farmId/feed-records` | Add feed record | Farm Owner |

---

### Import & Onboarding Routes (`/api/farms/:farmId/import`)

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| `POST` | `/api/farms/:farmId/import/animals` | Upload CSV for bulk animal import | Farm Owner |
| `POST` | `/api/farms/:farmId/import/vet-records` | Upload CSV for bulk vet treatment import | Farm Owner |

---

## 3. Standard Response Format

### Success Response (`200 OK` / `201 Created`)
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response (`400`, `401`, `403`, `500`)
```json
{
  "success": false,
  "error": {
    "code": "WITHDRAWAL_PERIOD_ACTIVE",
    "message": "Animal SH-042 is currently under active veterinary drug withdrawal until 2026-09-10."
  }
}
```
