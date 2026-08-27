# Developer Documentation Index — Farm SaaS

Welcome to the **Farm SaaS** developer documentation directory! This folder contains detailed technical guides and architecture specifications to help you understand, maintain, and extend the project.

---

## 📚 Documentation Table of Contents

| Document | Description |
| --- | --- |
| 📖 [**Root README.md**](../README.md) | High-level project overview, quickstart, setup steps, and environment configuration. |
| 🏛️ [**ARCHITECTURE.md**](./ARCHITECTURE.md) | Monorepo design, application layers, multi-tenancy enforcement, and cross-platform guidelines. |
| 🗄️ [**SCHEMA.md**](./SCHEMA.md) | Database entities, schema design, PostgreSQL views, triggers, and Row Level Security (RLS) rules. |
| 🔌 [**API.md**](./API.md) | REST API endpoints, DTO contracts, middleware stack, authentication, and error codes. |

---

## 🚀 Quick Reference for Developers

### Monorepo Stack

- **Frontend**: React Native + Expo Router v6 + NativeWind v4 (iOS, Android, Web)
- **Backend**: Express v5 + TypeScript (`tsx`) + Supabase Client
- **Database**: Supabase PostgreSQL with RLS policies & real-time sync capabilities
- **Workspace Tooling**: `npm` workspaces + `concurrently`

### Key Design Principles

1. **Defense in Depth Security**: Multi-tenancy is enforced at three distinct layers: RLS policies in Postgres, Express middleware on the backend, and context scoping on the frontend.
2. **Layer Separation**: Strict boundaries between Controllers (HTTP), Services (Business Logic), Repositories (Data Access), and Custom Hooks (Frontend Data Fetching).
3. **Cross-Platform Parity**: Universal components designed with NativeWind and Expo compatibility in mind for seamless deployment across Web, Android, and iOS.
4. **Compliance Enforcement**: Veterinary drug withdrawal tracking is enforced algorithmically to prevent unlawful or unsafe livestock sales.

---

If you have questions about internal roadmap, PRDs, or legacy Excel mapping, refer to internal development documentation or consult with the project maintainers.
