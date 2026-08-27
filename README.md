# Farm SaaS — Multi-Tenant Livestock Management Platform

[![Stack](https://img.shields.io/badge/Stack-Expo%20%7C%20React%20Native%20%7C%20Express%20%7C%20Supabase-blue)](https://expo.dev)
[![License](https://img.shields.io/badge/License-ISC-green.svg)](LICENSE)

A cross-platform (iOS, Android, Web) multi-tenant farm management SaaS designed for livestock tracking, pedigree management, veterinary compliance (withdrawal period enforcement), feed records, and data analytics.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Key Features](#-key-features)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#1-installation)
  - [Database Setup](#2-database-setup)
  - [Environment Configuration](#3-environment-configuration)
  - [Running the App](#4-running-the-app)
- [Core Architecture & Layering](#-core-architecture--layering)
- [Multi-Tenancy & Security](#-multi-tenancy--security)
- [NPM Scripts Reference](#-npm-scripts-reference)
- [Contributing & Code Style](#-contributing--code-style)

---

## 🌾 Overview

**Farm SaaS** digitizes traditional Excel-based farm records into a unified mobile and web application. Key highlights:

- **Zero Data Loss Onboarding**: Bulk CSV import pipeline designed to migrate legacy spreadsheets.
- **Strict Compliance Engine**: Automatically computes veterinary medication withdrawal dates and enforces safety rules (e.g. blocking status change to `Sold` for animals under active drug withdrawal).
- **Pedigree & Family Tracking**: First-class support for lineage metadata (`Sire ID`, `Dam ID`, `Family Line`).
- **Multi-Tenant Access**: Enables farm owners to manage multiple farms and veterinarians to service multiple farms through role-based access.

---

## 🛠 Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React Native (Expo Router v6), TypeScript, NativeWind / Tailwind CSS |
| **Backend** | Node.js, Express 5, TypeScript (`tsx`) |
| **Database & Auth** | Supabase (PostgreSQL, Row Level Security, Supabase Auth) |
| **Monorepo Management** | npm Workspaces, `concurrently` |
| **Target Platforms** | iOS, Android, Web |

---

## 📁 Project Architecture

The project is structured as an **npm workspace monorepo**:

```text
/
├── frontend/                  -- Expo Router cross-platform app (iOS, Android, Web)
│   ├── app/                   -- File-based routing ((auth), (app)/[farmId])
│   ├── components/            -- Generic UI and domain components (AnimalCard, etc.)
│   ├── contexts/              -- AuthContext, FarmContext, ThemeContext
│   ├── hooks/                 -- Data-fetching custom hooks (useAnimals, useVetRecords)
│   ├── services/              -- Axios API client and setup
│   ├── theme/                 -- Styling tokens and NativeWind config
│   └── types/                 -- TypeScript interfaces (mirrors DTOs)
│
├── backend/                   -- Node.js + Express + TypeScript service
│   ├── src/
│   │   ├── controllers/       -- HTTP request handlers & response validation
│   │   ├── services/          -- Core business logic (withdrawal checks, import pipeline)
│   │   ├── repositories/      -- Database queries via Supabase client
│   │   ├── middleware/        -- Auth verification & farmMembership multi-tenant guard
│   │   ├── routes/            -- Express endpoints (farm, animal, vet, feed, import)
│   │   └── config/            -- Supabase configuration
│   └── schema.sql             -- PostgreSQL database schema & RLS policies
│
├── docs/                      -- Public developer & architecture documentation
├── dev_docs/                  -- (Git-ignored) Internal specs & roadmap
├── package.json               -- Root monorepo configuration & workspaces
└── .gitignore                 -- Root ignore rules
```

---

## ✨ Key Features

1. **Animal Herd Management**
   - Track individual animal records, breeds, birth dates, sex, and status (`active`, `sold`, `culled`).
   - Lineage tracing with father (`sire_id`) and mother (`dam_id`) pedigree hierarchy.

2. **Veterinary & Withdrawal Tracking**
   - Record treatments, batch numbers, dosage, route (`oral`, `injection`, `topical`), and withdrawal duration in days.
   - Real-time calculation of `withdrawal_end_date` with built-in compliance warnings.

3. **Feed Records & Yield Tracking**
   - Log base forage, nutrient supplements, quantity per head, and response outcomes.

4. **CSV Bulk Import**
   - Drag-and-drop CSV parser with header mapping to seamlessly onboard legacy herd spreadsheets.

5. **Multi-Farm Context & Roles**
   - Switch active farm context seamlessly in the UI.
   - Roles: `Owner` (full read/write control) and `Vet` (read records + write vet treatments).

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your developer machine:
- **Node.js**: `v18.x` or higher
- **npm**: `v9.x` or higher
- **Supabase Account**: A free Supabase project instance (or local Supabase CLI)

### 1. Installation

Clone the repository and install root dependencies:

```bash
git clone <repository-url>
cd farm
npm install
```

This command automatically installs workspace dependencies for both `frontend` and `backend`.

---

### 2. Database Setup

1. Open your **Supabase Dashboard** -> **SQL Editor**.
2. Copy the contents of [`backend/schema.sql`](file:///c:/Users/mbugu/Desktop/Code/React/farm/backend/schema.sql) and execute the script.
3. This creates all tables (`profiles`, `farms`, `farm_members`, `animals`, `vet_records`, `feed_records`, `notifications`), enums, triggers, views (`vet_withdrawal_status`), and Row Level Security (RLS) policies.

---

### 3. Environment Configuration

#### Backend Environment Variables
Create a `.env` file in the `backend/` directory:

```env
PORT=5000
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

#### Frontend Environment Variables
Create a `.env` file in the `frontend/` directory:

```env
EXPO_PUBLIC_API_URL=http://localhost:5000
EXPO_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

### 4. Running the App

#### Concurrent Development (Frontend + Backend)
To launch both the Node.js backend server and the Expo frontend simultaneously:

```bash
npm run dev:all
```

#### Run Backend Separately
```bash
npm run dev:backend
```

#### Run Frontend Separately
```bash
npm run dev:frontend
```

Press `w` in the Expo terminal output to open in a web browser, or scan the QR code with **Expo Go** on iOS/Android.

---

## 🏗 Core Architecture & Layering

To maintain code clarity and prevent bugs, the project follows strict architectural boundaries:

```text
HTTP Request  ──►  Middleware  ──►  Controller  ──►  Service  ──►  Repository  ──►  Database
                    (Auth/RLS)     (Validate)      (Logic)      (Supabase)
```

1. **Controllers**: Parse and validate HTTP request params/body. Delegates business logic to services.
2. **Services**: Pure business logic (e.g. withdrawal safety check, spreadsheet data cleaning). No Express `req`/`res` or direct DB access.
3. **Repositories**: The only layer containing raw Supabase client query calls.
4. **Frontend Hooks**: UI components consume custom hooks (`useAnimals`, `useVetRecords`) and never invoke raw HTTP requests directly.

---

## 🔒 Multi-Tenancy & Security

Multi-tenancy isolation is protected using **Defense in Depth**:

1. **Row Level Security (RLS)**: PostgreSQL policies on Supabase guarantee that users can only access rows belonging to farms where they have an active `farm_members` record.
2. **Backend Guard Middleware (`farmMembership`)**: Verifies that the requested `farm_id` in API routes belongs to the authenticated user before reaching controller logic.
3. **Frontend Context (`FarmContext`)**: UI views automatically inject the currently selected `farm_id` into custom hooks.

---

## 📜 NPM Scripts Reference

From the root directory:

| Script | Action |
| --- | --- |
| `npm run dev:all` | Runs backend (watch mode) and frontend (Expo start) concurrently |
| `npm run dev:backend` | Starts the Express server with live reload via `tsx watch` |
| `npm run dev:frontend` | Starts Expo dev server (`expo start --offline`) |

From the `backend/` directory:
- `npm run dev`: Start backend dev server
- `npm run build`: Compile TypeScript to `dist/`
- `npm run start`: Run compiled production server

From the `frontend/` directory:
- `npm run start`: Start Expo
- `npm run web`: Run Expo Web
- `npm run android`: Run on Android emulator
- `npm run ios`: Run on iOS simulator

---

## 📖 Additional Documentation

Detailed documentation and guides are available under the [`docs/`](file:///c:/Users/mbugu/Desktop/Code/React/farm/docs/README.md) directory:

- [Architecture & Layering Guide](file:///c:/Users/mbugu/Desktop/Code/React/farm/docs/ARCHITECTURE.md)
- [Database Schema Reference](file:///c:/Users/mbugu/Desktop/Code/React/farm/docs/SCHEMA.md)
- [API Route Specifications](file:///c:/Users/mbugu/Desktop/Code/React/farm/docs/API.md)

---

## 🤝 Support & Contribution

If you have questions or encounter issues, please review the documentation in `docs/` or reach out to the project lead. Happy farming! 🌾
