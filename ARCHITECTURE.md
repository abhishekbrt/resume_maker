# Architecture

This document describes the current high-level architecture of Resume Maker.
Use this as the source of truth for runtime boundaries and responsibilities.

See also `AGENTS.md` for coding conventions and guardrails.

> **Phase note:** v1 (local-only editor + direct PDF generation) is complete.
> The codebase is now in **v2 transition**: authentication and persistence are
> implemented in the Next.js API layer, while some planned endpoints (photo
> upload, saved-resume PDF generation) are still pending.

## Bird's Eye View

Resume Maker transforms structured resume JSON into an ATS-friendly PDF.

The production runtime is split into four systems:

1. **Browser UI (Next.js frontend)**
2. **Next.js App Router server/API (BFF)**
3. **Go PDF microservice**
4. **Supabase (Auth + Postgres)**

Core flow:

- Browser calls Next.js route handlers under `/api/*`
- Next.js validates session and payloads
- Next.js reads/writes Supabase data for authenticated resources
- Next.js forwards PDF generation requests to Go service using HMAC service auth
- Go returns PDF bytes

## Codemap

### `frontend/`

The Next.js application (App Router).

`src/app/` includes both pages and route handlers:

- `page.tsx` — server wrapper for landing page, passes auth prompt state
- `editor/page.tsx` — guarded editor page (redirects unauthenticated users)
- `api/auth/google/start/route.ts` — starts Google OAuth via Supabase
- `api/auth/callback/route.ts` — exchanges code for session, sets cookies
- `api/auth/session/route.ts` — validates `sb-access-token` and returns user
- `api/auth/logout/route.ts` — clears auth cookies
- `api/v1/resumes/route.ts` — list/create resumes
- `api/v1/resumes/[id]/route.ts` — get/update/delete single resume
- `api/v1/resumes/generate-pdf/route.ts` — proxy to Go PDF service

`src/components/`:

- `editor/` — form UI (`ResumeForm`)
- `preview/` — HTML preview (`ResumePreview`)
- `home/` — authenticated landing content (`home-content.tsx`)

`src/lib/`:

- `resume-context.tsx` — editor state (`useReducer` + local persistence)
- `api.ts` — client API for PDF generation
- `auth-api.ts` — client API for session/Google sign-in/logout actions
- `types.ts` — shared frontend types
- `validation.ts` — client-side validation

`src/hooks/`:

- `use-auth-session.ts` — auth session state machine for UI

`src/server/` (Next server utilities):

- `supabase-server.ts` — Supabase client factory from env vars
- `auth-user.ts` — extracts authenticated user from cookie token
- `pdf-proxy.ts` — forwards requests to Go PDF service
- `pdf-service-auth.ts` — HMAC service headers
- `json-error.ts` — standard API error response helper

### `backend/`

The Go PDF microservice.

- `cmd/server/main.go` — entry point
- `internal/handlers/router.go` — routes and HTTP error mapping
- `internal/service/pdf_service.go` — validation + orchestration
- `internal/pdfgen/renderer.go` — deterministic PDF rendering
- `internal/models/resume.go` — request/data structs

Implemented Go routes:

- `GET /api/v1/health`
- `GET /api/v1/templates`
- `POST /api/v1/resumes/generate-pdf`

### `supabase/`

- `migrations/20260223000000_init_resume_maker_v2.sql` — v2 schema + RLS

## Invariants

**BFF boundary is mandatory.** Browser code never calls Supabase directly.
All authenticated data access goes through Next.js route handlers.

**Go service is PDF-only.** Go does not own user auth or resume persistence.
It renders PDF bytes from request payloads.

**PDF determinism.** Same valid payload should generate equivalent PDF output.

**No PII logging.** Avoid logging resume content, tokens, or secret values.

**SQL ownership.** Schema and RLS live in Supabase migrations.
Next.js code uses Supabase APIs rather than embedding raw SQL in the app.

## Boundaries

### Browser ↔ Next.js API

- Public app endpoints: `/api/auth/*` and `/api/v1/*`
- Auth state is cookie-based (`sb-access-token`, `sb-refresh-token`)

### Next.js API ↔ Supabase

- Next validates the token with `supabase.auth.getUser(accessToken)`
- Resume CRUD uses `resumes` table scoped by `user_id`
- Supabase RLS enforces tenant isolation

### Next.js API ↔ Go PDF service

- Forward target configured by `GO_PDF_SERVICE_URL`
- Requests signed with:
  - `X-Service-Id`
  - `X-Service-Timestamp`
  - `X-Service-Nonce`
  - `X-Service-Signature`

### Go PDF service verification

When `GO_PDF_SERVICE_HMAC_SECRET` is set, Go verifies:

- allowed service id (`GO_PDF_SERVICE_ALLOWED_ID`, default `nextjs-api`)
- timestamp freshness (±300s)
- signature validity (HMAC SHA-256)
- nonce presence

> Current implementation checks nonce presence but does not persist nonce history,
> so replay prevention storage is still a follow-up hardening step.

## Authentication Model

- Provider: **Google OAuth via Supabase Auth**
- Entry: `GET /api/auth/google/start`
- Callback: `GET /api/auth/callback?code=...`
- Session cookies set in callback (`httpOnly`, `sameSite=lax`)
- UI session check: `GET /api/auth/session`
- Logout: `POST /api/auth/logout`

No email/password auth routes are currently implemented.

## Data Model

Supabase schema (see `docs/generated/db-schema.md`):

- Identity source: `auth.users`
- App profile: `public.profiles`
- Resume storage: `public.resumes`
- Template registry: `public.templates`

Resume content remains JSONB in `resumes.data`.

## Configuration

### Frontend/Next.js env

- `NEXT_PUBLIC_APP_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `GO_PDF_SERVICE_URL`
- `GO_PDF_SERVICE_HMAC_SECRET`
- `GO_PDF_SERVICE_ID` (default `nextjs-api`)

### Go service env

- `PORT`
- `GO_PDF_SERVICE_HMAC_SECRET`
- `GO_PDF_SERVICE_ALLOWED_ID`

## Current Gaps (Planned)

- `POST /api/v1/resumes/:id/generate-pdf` not implemented yet
- `POST /api/v1/resumes/:id/photo` not implemented yet
- `DELETE /api/v1/resumes/:id/photo` not implemented yet
- nonce replay-store hardening for service auth not implemented yet
