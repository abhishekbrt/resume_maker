# Architecture

This document describes the high-level architecture of Resume Maker.
If you want to familiarize yourself with the codebase, start here.

See also:

- `AGENTS.md` for contribution rules and coding conventions
- `docs/generated/API_SPEC.md` for endpoint contracts
- `docs/generated/db-schema.md` for Supabase schema details

## Bird's Eye View

On the highest level, Resume Maker accepts structured resume JSON and produces an
ATS-friendly PDF.

The runtime is split into four systems:

1. Browser UI (Next.js pages/components)
2. Next.js server/API layer (BFF)
3. Supabase (Google OAuth + Postgres + RLS)
4. Go PDF microservice

Request flow in production:

1. Browser calls Next.js routes under `/api/*`
2. Next.js validates session cookies and user identity with Supabase
3. Next.js reads/writes resume rows in Supabase
4. Next.js forwards PDF generation payloads to Go
5. Go returns PDF bytes

The browser never calls Supabase directly and never calls Go directly.

## Code Map

This section answers two questions:

- where is the thing that does X?
- what is this module responsible for?

Pay attention to `Architecture Invariant` and `API Boundary` notes.

### `frontend/src/app`

Application routes (UI pages + API handlers).

Key pages:

- `page.tsx` — landing page shell
- `editor/page.tsx` — editor UI, guarded by session checks

Key API routes:

- `api/auth/google/start/route.ts` — start OAuth flow
- `api/auth/callback/route.ts` — exchange code, set `sb-*` cookies
- `api/auth/session/route.ts` — current session lookup
- `api/auth/logout/route.ts` — clear cookies
- `api/v1/resumes/route.ts` — list/create resumes
- `api/v1/resumes/[id]/route.ts` — get/patch/delete resume
- `api/v1/resumes/generate-pdf/route.ts` — PDF proxy endpoint

**Architecture Invariant:** route handlers own HTTP concerns and boundary checks.
They should delegate shared logic to `frontend/src/server/*` helpers.

**API Boundary:** `/api/auth/*` and `/api/v1/*` are the public backend surface
for the browser.

### `frontend/src/server`

Server-only helper modules used by route handlers.

- `supabase-server.ts` — creates Supabase client from env
- `auth-user.ts` — extracts authenticated user from cookie token
- `http-cookies.ts` — cookie parsing helper
- `pdf-proxy.ts` — forwards PDF requests to Go
- `pdf-service-auth.ts` — HMAC signature/header generation
- `json-error.ts` — standard JSON error response helper

**Architecture Invariant:** secrets and service credentials are handled only in
server modules, never in browser bundles.

### `frontend/src/lib`, `frontend/src/hooks`, `frontend/src/components`

Client-side state, API client wrappers, hooks, and UI components.

- `resume-context.tsx` — editor state machine (`useReducer`)
- `types.ts` — shared frontend payload types
- `validation.ts` — client-side validation for UX feedback
- `api.ts` — PDF request client
- `auth-api.ts` — session/auth client wrappers
- `use-auth-session.ts` — auth session state for UI

**Architecture Invariant:** client-side validation improves UX only.
Authoritative validation remains server-side.

### `backend/internal/handlers`

HTTP router and response mapping for Go service.

- `router.go` defines:
  - `GET /api/v1/health`
  - `GET /api/v1/templates`
  - `POST /api/v1/resumes/generate-pdf`

**Architecture Invariant:** Go handler layer does not depend on Supabase, OAuth,
or browser session semantics.

### `backend/internal/service`, `backend/internal/pdfgen`, `backend/internal/models`

Core PDF domain logic.

- `service/pdf_service.go` — request validation and orchestration
- `pdfgen/renderer.go` — deterministic PDF rendering
- `models/resume.go` — request/data structures

**Architecture Invariant:** PDF generation is pure from the service perspective:
input payload in, PDF bytes out.

### `supabase/migrations`

Database schema and RLS policies.

- `20260223000000_init_resume_maker_v2.sql` creates `profiles`, `templates`,
  `resumes`, indexes, and row-level policies.

**Architecture Invariant:** tenant isolation is enforced by RLS and `user_id`
ownership rules in addition to app-layer checks.

### `docs/`

Project docs and generated contracts.

- `docs/generated/API_SPEC.md` — current endpoint behavior
- `docs/generated/db-schema.md` — Postgres shape + JSONB contract
- `docs/SECURITY.md` — security controls and hardening checklist

## Boundaries

### Browser <-> Next.js API

- Transport: same-origin HTTP (`/api/*`)
- Auth: cookie-based (`sb-access-token`, `sb-refresh-token`)
- Data format: JSON (PDF endpoint returns binary)

### Next.js API <-> Supabase

- Identity verification: `supabase.auth.getUser(accessToken)`
- Persistence: `public.resumes` scoped by `user_id`
- Enforcement: Supabase RLS policies

### Next.js API <-> Go PDF Service

- Target: `GO_PDF_SERVICE_URL`
- Auth: HMAC headers
  - `X-Service-Id`
  - `X-Service-Timestamp`
  - `X-Service-Nonce`
  - `X-Service-Signature`

### Go PDF Service Verification

When `GO_PDF_SERVICE_HMAC_SECRET` is configured, Go verifies:

- allowed service id (`GO_PDF_SERVICE_ALLOWED_ID`, default `nextjs-api`)
- timestamp freshness (±300 seconds)
- HMAC signature correctness
- nonce presence

## Cross-Cutting Concerns

### Authentication

- Provider: Google OAuth via Supabase
- Session source: httpOnly `sb-*` cookies
- Protected Next.js routes require a valid Supabase user lookup

### Error Handling

- Route handlers use a shared JSON error envelope (`jsonError`)
- Go service maps validation vs payload vs internal failures to explicit status codes

### Validation

- Client: immediate feedback for form UX
- Next.js: request shape and auth checks at API boundary
- Go: authoritative PDF payload validation and photo size/type checks

### Logging and Privacy

- Do not log resume payload content, auth tokens, or secrets
- Log operational metadata (request id, status, duration, endpoint)

### Configuration

Next.js critical env:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `GO_PDF_SERVICE_URL`
- `GO_PDF_SERVICE_HMAC_SECRET`
- `GO_PDF_SERVICE_ID`

Go critical env:

- `PORT`
- `GO_PDF_SERVICE_HMAC_SECRET`
- `GO_PDF_SERVICE_ALLOWED_ID`

## Current Gaps (Planned)

The following routes are planned but not implemented yet:

- `POST /api/v1/resumes/:id/generate-pdf`
- `POST /api/v1/resumes/:id/photo`
- `DELETE /api/v1/resumes/:id/photo`

Security hardening gap:

- nonce replay-store persistence for service auth is not implemented yet
