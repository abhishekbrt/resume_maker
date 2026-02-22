# Architecture

This document is the code-grounded architecture guide for Resume Maker.
It is written to help contributors quickly answer two questions:

1. Where does behavior live?
2. What boundaries and invariants must not be broken?

If you are new to the codebase, read this in order:

1. Bird's Eye View
2. Runtime Flows
3. Code Map
4. Boundaries and Contracts
5. Cross-Cutting Concerns
6. Current Gaps and Planned Work

See also:

- `AGENTS.md` for coding and contribution rules
- `docs/generated/API_SPEC.md` for route-level contract details
- `docs/generated/db-schema.md` for Supabase schema and JSON shape
- `docs/SECURITY.md` for hardening guidance

## Bird's Eye View

Resume Maker turns structured resume data into ATS-friendly PDF output.

At runtime, the project is split into four systems:

1. Next.js browser UI (App Router pages/components)
2. Next.js API routes (BFF)
3. Supabase (Google OAuth + Postgres)
4. Go PDF service (rendering engine)

High-level call graph:

```text
Browser UI
  -> Next.js /api/auth/* and /api/v1/*
      -> Supabase Auth / Postgres (for auth + resume CRUD)
      -> Go /api/v1/resumes/generate-pdf (for PDF bytes)
```

The browser does not call the Go service directly in the normal flow.

## Runtime Flows

### 1. Authentication and Session

Flow:

1. Browser starts OAuth at `GET /api/auth/google/start`
2. Next.js asks Supabase for OAuth URL and redirects
3. Supabase redirects back to `GET /api/auth/callback?code=...`
4. Next.js exchanges code for session and sets httpOnly cookies:
   - `sb-access-token`
   - `sb-refresh-token`
5. Browser session check uses `GET /api/auth/session`

Main files:

- `frontend/src/app/api/auth/google/start/route.ts`
- `frontend/src/app/api/auth/callback/route.ts`
- `frontend/src/app/api/auth/session/route.ts`
- `frontend/src/app/api/auth/logout/route.ts`
- `frontend/src/hooks/use-auth-session.ts`

### 2. Resume CRUD (Supabase-backed)

Flow:

1. Browser calls `GET/POST /api/v1/resumes` or `GET/PATCH/DELETE /api/v1/resumes/:id`
2. Next.js resolves user identity from `sb-access-token`
3. Next.js reads/writes `public.resumes` in Supabase
4. Responses are mapped to frontend JSON shape (`template_id` -> `templateId`, timestamps)

Main files:

- `frontend/src/app/api/v1/resumes/route.ts`
- `frontend/src/app/api/v1/resumes/[id]/route.ts`
- `frontend/src/server/auth-user.ts`
- `frontend/src/server/supabase-server.ts`

### 3. PDF Generation

Flow:

1. Browser sends `POST /api/v1/resumes/generate-pdf` to Next.js
2. Next.js validates content type and forwards raw body to Go
3. Next.js signs request with HMAC service headers
4. Go verifies service auth (when secret configured), validates payload, renders PDF
5. PDF bytes stream back to browser with `Content-Type` and `Content-Disposition`

Main files:

- `frontend/src/app/api/v1/resumes/generate-pdf/route.ts`
- `frontend/src/server/pdf-proxy.ts`
- `frontend/src/server/pdf-service-auth.ts`
- `backend/internal/handlers/router.go`
- `backend/internal/service/pdf_service.go`
- `backend/internal/pdfgen/renderer.go`

## Code Map

This section is the "where does X live?" reference.

### `frontend/src/app`

Owns route-level HTTP concerns and page composition.

- UI routes:
  - `page.tsx` -> landing page
  - `editor/page.tsx` -> editor workspace and session guard
- API routes:
  - `api/auth/*` -> OAuth/session/logout
  - `api/v1/resumes/*` -> resume CRUD
  - `api/v1/resumes/generate-pdf` -> proxy to Go

Architecture invariant:

- Route handlers stay thin: parse request, enforce boundary checks, delegate to `frontend/src/server/*` helpers.

### `frontend/src/server`

Server-only helpers for API routes.

- `supabase-server.ts` -> Supabase client creation from env
- `auth-user.ts` -> current user lookup from cookie token
- `http-cookies.ts` -> cookie parsing
- `json-error.ts` -> consistent JSON error envelope
- `pdf-proxy.ts` -> Go service call
- `pdf-service-auth.ts` -> HMAC header construction

Architecture invariant:

- Secrets and service credentials stay in server modules; never in client bundles.

### `frontend/src/lib`, `frontend/src/hooks`, `frontend/src/components`

Client-side state and presentation.

- `lib/types.ts` -> shared TypeScript payload contracts
- `lib/resume-context.tsx` -> editor state machine (`useReducer`) + localStorage persistence
- `lib/validation.ts` -> client-side preflight checks
- `lib/api.ts` -> PDF API client
- `lib/auth-api.ts` -> auth/session client wrappers
- `hooks/use-auth-session.ts` -> session state orchestration
- `components/editor/*` + `components/preview/*` -> form and preview UI

Architecture invariant:

- Client validation is UX only; server-side validation remains authoritative.

### `backend/cmd/server` and `backend/internal/handlers`

HTTP edge for Go service.

- `cmd/server/main.go` -> process entrypoint, port selection, router bootstrap
- `internal/handlers/router.go` -> routes, middleware, error mapping, service-auth verification

Current Go API surface:

- `GET /api/v1/health`
- `GET /api/v1/templates`
- `POST /api/v1/resumes/generate-pdf`

Architecture invariant:

- Go handler layer is independent from Supabase/OAuth concerns.

### `backend/internal/service`, `backend/internal/models`, `backend/internal/pdfgen`

Core PDF domain.

- `models/resume.go` -> canonical request structs
- `service/pdf_service.go` -> semantic validation + photo validation + renderer orchestration
- `pdfgen/renderer.go` -> deterministic layout/render pipeline and embedded fonts

Architecture invariant:

- Service contract is pure from caller perspective: request in -> PDF bytes out.

### `supabase/migrations`

Persistence schema and access policy.

- `20260223000000_init_resume_maker_v2.sql` creates:
  - `public.profiles`
  - `public.templates`
  - `public.resumes`
  - indexes and updated-at triggers
  - RLS policies for `profiles` and `resumes`

Architecture invariant:

- Tenant isolation must hold even if app logic regresses.

## Boundaries and Contracts

### Browser <-> Next.js API

- Transport: same-origin HTTP (`/api/*`)
- Auth: cookies (`sb-access-token`, `sb-refresh-token`)
- Payloads: JSON for most routes, binary PDF for download

### Next.js <-> Supabase

- Identity check: `supabase.auth.getUser(accessToken)`
- Data access: `public.resumes`
- App-level ownership filters: `.eq('user_id', user.id)`

Important implementation note:

- The route code currently uses a server Supabase client plus explicit `user_id` filters.
- If strict RLS-by-authenticated-role is required, ensure queries run with user auth context (or equivalent trusted server policy).

### Next.js <-> Go PDF service

- Endpoint: `GO_PDF_SERVICE_URL` (defaults to local dev URL)
- Required secret in Next.js: `GO_PDF_SERVICE_HMAC_SECRET`
- Signed headers:
  - `X-Service-Id`
  - `X-Service-Timestamp`
  - `X-Service-Nonce`
  - `X-Service-Signature`

### Go service auth verification

When `GO_PDF_SERVICE_HMAC_SECRET` is set in Go:

- service id must match `GO_PDF_SERVICE_ALLOWED_ID` (default `nextjs-api`)
- timestamp must be within +/- 300 seconds
- nonce must be present
- signature must match HMAC-SHA256 canonical string

## Cross-Cutting Concerns

### Error model

- Next.js routes use `jsonError()` envelope:

```json
{
  "error": {
    "code": "...",
    "message": "..."
  }
}
```

- Go routes use the same envelope and add field-level `details` for validation failures.

### Validation model

Validation is layered:

1. Client (`frontend/src/lib/validation.ts`) for immediate UX feedback
2. Next.js route boundary checks (content-type/auth/required fields)
3. Go service validation (`backend/internal/service/pdf_service.go`) as final authority for PDF payload semantics

### Deterministic rendering model

`backend/internal/pdfgen/renderer.go` enforces stable rendering behavior via:

- embedded font assets
- fixed creation date and catalog sorting
- constrained font family/size options
- explicit layout constants

Tests (`backend/internal/pdfgen/*_test.go`) assert structural output stability and regression coverage using fixtures/golden signatures.

### Logging and privacy

- Go logs request metadata with `slog` and Chi request IDs
- Never log resume PII payloads, auth tokens, or secrets

### Test strategy (architecture-relevant)

- Frontend: Vitest route + unit tests (`frontend/src/**/*.test.ts(x)`)
- Backend: Go tests for handlers, service validation, and PDF renderer/golden fixtures (`backend/internal/**/_test.go`)

## Configuration Surface

### Next.js critical env

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `GO_PDF_SERVICE_URL`
- `GO_PDF_SERVICE_HMAC_SECRET`
- `GO_PDF_SERVICE_ID` (optional, defaults to `nextjs-api`)
- `NEXT_PUBLIC_APP_URL` (used for OAuth callback redirect)

### Go critical env

- `PORT` (default `8080`)
- `GO_PDF_SERVICE_HMAC_SECRET` (optional; when empty, service auth check is bypassed)
- `GO_PDF_SERVICE_ALLOWED_ID` (default `nextjs-api`)

## Current Gaps and Planned Work

These items are tracked in docs/specs but are not fully closed in current code:

1. Resume editor data path is still localStorage-first (`resume-context.tsx`); CRUD endpoints exist but are not wired into the editor UX yet.
2. Planned resource-scoped endpoints are not implemented yet:
   - `POST /api/v1/resumes/:id/generate-pdf`
   - `POST /api/v1/resumes/:id/photo`
   - `DELETE /api/v1/resumes/:id/photo`
3. Service-auth nonce replay protection is presence-only today; no replay-store persistence yet.
4. PDF proxy route is currently public at route level (`/api/v1/resumes/generate-pdf`), relying on Go service auth and payload validation rather than user session gating.

## Non-Goals (Current Architecture)

- Client-side PDF generation is not part of the architecture.
- Direct browser access to Go service is not a supported production model.
- Storing final PDF artifacts in backend storage is not part of current runtime.
