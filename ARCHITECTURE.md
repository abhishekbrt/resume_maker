# Architecture

This document describes the high-level architecture of the Resume Maker
application. If you want to familiarize yourself with the codebase, you are in
the right place!

See also `AGENTS.md` for coding conventions and rules.

> **Phase note:** This document describes the full target architecture. Features
> marked **[v2]** are not part of the MVP — they will be built in Phase 2.
> The v1 MVP has no authentication, no database, and no S3 storage. Resume data
> lives in the browser's localStorage, and the Go backend is a stateless PDF
> generation service.

## Bird's Eye View

Resume Maker is a web application that takes structured resume data (JSON) and
produces a professionally formatted PDF. The user interacts with a form-based
editor in the browser, sees a live HTML preview, and can download a PDF
generated server-side by a Go backend.

The core problem is simple: **data in, PDF out**. Everything else — the editor
UI, authentication **[v2]**, storage **[v2]** — exists to support that pipeline.

The system has two main processes:

1. A **Next.js** frontend that runs in the browser (form editor + live preview)
2. A **Go** API server that handles PDF generation (and data persistence in **[v2]**)

These communicate over a JSON REST API. They are deployed independently and
share no code.

## Codemap

### `frontend/`

The Next.js application. Uses App Router (not Pages Router).

`src/app/` contains route pages. The important ones are:

- `page.tsx` — landing page
- `editor/page.tsx` — the main editor, where users spend all their time
- `login/page.tsx` — login page **[v2]**
- `signup/page.tsx` — signup page **[v2]**
- `dashboard/page.tsx` — saved resumes list **[v2]**

`src/components/` is organized by feature area:

- `editor/` — form input components. `ResumeForm` is the root. Each section
  (personal info, experience, education, skills) is a separate component.
- `preview/` — HTML rendering of the resume. `ResumePreview` is the root.
  These components mirror the PDF template layout using HTML/CSS.
- `common/` — generic UI primitives: `Button`, `Input`, `TextArea`, `Select`
- `photo/` — profile photo upload and cropping

`src/lib/` holds non-UI code:

- `resume-context.tsx` — the central state. A React Context with `useReducer`.
  All resume data flows through here. The form writes to it, the preview reads
  from it.
- `types.ts` — TypeScript definitions for `ResumeData`, `ExperienceEntry`,
  `EducationEntry`, etc. These mirror the JSONB schema stored in PostgreSQL.
- `api.ts` — HTTP client for talking to the Go backend.
- `validation.ts` — form validation rules.

`src/styles/` contains CSS Modules. No Tailwind.

### `backend/`

The Go API server.

`cmd/server/main.go` is the entry point. It wires up the router, middleware,
and starts the HTTP server.

`internal/` contains all application logic. Nothing in `internal/` is exported
to external consumers.

- `handlers/` — HTTP handler functions. Thin layer: parse request, call
  service, write response. One file per resource (resumes, upload; auth **[v2]**).
- `service/` — business logic. Validation, orchestration, error wrapping.
  Handlers call services, never the database directly.
- `pdfgen/` — **the core module.** This is where resume JSON becomes a PDF.
  `renderer.go` defines the main rendering interface. `template.go` contains
  the layout logic for positioning text, sections, and images on the page.
  The `assets/` subdirectory holds embedded font files.
- `models/` — data types: `ResumeData` (v1), `Resume`, `User` **[v2]**.
  These are plain structs, not ORM models.
- `database/` — **[v2]** PostgreSQL access. Raw queries via `pgx`, no ORM.
  Parameterized statements only. Not used in v1.
- `storage/` — **[v2]** S3-compatible file storage interface. Used for
  profile photos and generated PDFs. Backed by MinIO locally, S3 in
  production. Not used in v1 (photos are sent inline with the PDF request).
- `middleware/` — request processing: CORS, rate limiting, request ID
  injection, structured logging. Auth (JWT validation) **[v2]**.
- `config/` — reads environment variables, provides typed config struct.

### `docs/`

Project documentation. See `docs/design-docs/index.md` for design decisions,
`docs/product-specs/` for feature specifications,
`docs/generated/db-schema.md` for the database schema and JSONB data shape.

The `docs/references/` directory contains LLM-readable reference files for the
design system, Go PDF libraries, and Next.js conventions.

## Invariants

These are architectural rules that must hold. Some are expressed as the absence
of something, which is hard to see by reading code alone.

**Data/presentation separation.** Resume content is stored as a JSON blob
(`ResumeData` type). The rendering layer reads this blob and produces output.
No rendering logic writes to the data layer. No data-layer code knows about
fonts, coordinates, or page dimensions.

**The backend is the source of truth for PDFs.** The frontend preview is an
HTML/CSS approximation rendered client-side. It is intentionally not
pixel-perfect with the real PDF. The Go `pdfgen` module produces the canonical
output. Never generate final PDFs client-side.

**Handlers don't touch the database.** **[v2]** The call chain is always
`handler → service → database`. Handlers deal with HTTP concerns (parsing,
status codes). Services deal with business rules. Database functions deal with
SQL. No layer skips another. In v1, there is no database layer — handlers call
services, and services operate on data provided in the request.

**No PII in logs.** The logging middleware and all `slog` calls must never log
resume content, email addresses, passwords, or tokens. Log `user_id` and
`resume_id` as opaque identifiers only.

**Parameterized queries only.** There is zero string concatenation in SQL query
construction. Every query uses `$1`, `$2` placeholders. This is non-negotiable.

**No cross-imports between frontend and backend.** They share no code, no types,
no dependencies. The API contract (JSON shapes) is the only coupling. Types are
independently defined in `frontend/src/lib/types.ts` and
`backend/internal/models/`.

## Boundaries

**Frontend ↔ Backend:** The REST API at `/api/v1/*`. The frontend sends JSON
requests and receives JSON responses (or a PDF byte stream for the download
endpoint). In v1, all endpoints are unauthenticated. In **[v2]**,
authentication uses a JWT bearer token in the `Authorization` header.
The frontend never makes direct database or storage calls.

**Service ↔ Database:** The `database` package exposes query functions that
return model structs. Services call these functions but never construct SQL.
The database package never calls services.

**`pdfgen` ↔ everything else:** The PDF generation module receives a
`ResumeData` struct and an optional photo as `[]byte`. It returns PDF bytes.
It does not fetch data from the database or storage — the caller provides
everything. This makes it testable in isolation and idempotent: same input,
same output.

**Storage interface:** **[v2]** The `storage` package defines an interface
(`Store`) with `Upload`, `Download`, and `Delete` methods. The concrete
implementation (S3 or MinIO) is injected at startup. No other package knows
whether we're using S3, MinIO, or a filesystem. In v1, photo bytes are sent
inline with the PDF generation request and no persistent storage is used.

## Cross-Cutting Concerns

**Error handling.** Go errors are wrapped at each layer with context:
`fmt.Errorf("saving resume %s: %w", id, err)`. The handler layer maps internal
errors to HTTP status codes and user-friendly messages. The frontend shows
toast notifications for API errors and inline messages for validation errors.

**Authentication.** **[v2]** JWT-based. Access tokens are short-lived (15 min),
refresh tokens are longer (7 days, httpOnly cookie). The `middleware/auth.go`
validates tokens and injects `user_id` into the request context.
Unauthenticated endpoints (login, signup, anonymous PDF generation) skip this
middleware. In v1, there is no authentication — all endpoints are public.

**Logging.** Structured JSON via Go `slog`. Every request gets a unique
`request_id` assigned by middleware. Log entries include method, path, status
code, and duration. PDF generation events log `resume_id`, template name,
duration, and page count.

**Configuration.** All configuration is via environment variables. The `config`
package loads them at startup with sensible defaults. The frontend uses
`NEXT_PUBLIC_*` variables. In v1, the only required configuration is the
server port and CORS origin. In **[v2]**, secrets (`JWT_SECRET`, `DATABASE_URL`,
S3 keys) are added — these are never committed. See `.env.example` for the
expected shape.

**Concurrency.** PDF generation is the heaviest operation. The server uses a
bounded worker pool to limit concurrent PDF generations. If the pool is full,
requests are queued up to a maximum depth, after which the server returns
`503 Service Unavailable`.

## A Note on the Template

The v1 template is a single-column, ATS-friendly design with serif typography.
The layout logic lives entirely in `pdfgen/template.go`. The key structural
elements are: centered header with name and contact line, section headers with
horizontal rules, company/date pairs with left/right alignment, indented bullet
points, and an optional circular profile photo in the top-right corner.

Adding a new template means adding a new file in `pdfgen/` that implements the
same renderer interface with different layout logic. The `ResumeData` schema
does not change.
