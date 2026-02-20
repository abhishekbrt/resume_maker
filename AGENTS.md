# AGENTS.md

> Instructions for AI coding agents working on this codebase.

## Project

**Resume Maker** — structured form data → professional ATS-friendly PDF.

- **Frontend**: Next.js (App Router, TypeScript, CSS Modules)
- **Backend**: Go (Chi router, go-pdf/fpdf for PDF generation)
- **Database**: PostgreSQL via `pgx` **[v2]** — v1 uses localStorage only
- **Storage**: S3/MinIO **[v2]** — v1 sends photo bytes inline

> **v1 MVP**: No auth, no database, no S3. Go backend is a stateless PDF service.

## Commands

### Frontend (`cd frontend`)

| Action       | Command               |
| ------------ | --------------------- |
| Install      | `npm install`         |
| Dev          | `npm run dev`         |
| Build        | `npm run build`       |
| Lint         | `npm run lint`        |
| Test         | `npm test`            |
| Test (watch) | `npm test -- --watch` |

### Backend (`cd backend`)

| Action         | Command                                     |
| -------------- | ------------------------------------------- |
| Install        | `go mod download`                           |
| Run            | `go run cmd/server/main.go`                 |
| Build          | `go build -o bin/server cmd/server/main.go` |
| Test           | `go test ./...`                             |
| Test (verbose) | `go test -v ./...`                          |
| Test (single)  | `go test ./internal/pdfgen/...`             |

### Docker

- Full stack: `docker-compose up`

## File Structure

```
frontend/src/
  app/           → App Router pages (editor/page.tsx is the main page)
  components/    → editor/, preview/, common/, photo/
  hooks/         → custom React hooks
  lib/           → types.ts, api.ts, resume-context.tsx, validation.ts
  styles/        → CSS Modules

backend/
  cmd/server/    → main.go entry point
  internal/
    handlers/    → HTTP handlers (one file per resource)
    service/     → business logic layer
    pdfgen/      → core PDF generation engine
    models/      → data structs (ResumeData, Resume, User)
    middleware/  → CORS, rate limiting, logging, auth [v2]
    config/      → env var loading
    database/    → pgx queries [v2]
    storage/     → S3 interface [v2]
```

## Conventions

**Frontend**: TypeScript mandatory · CSS Modules (no Tailwind) · no inline styles · components in own files · all API types in `lib/types.ts` · state via React Context + `useReducer`

**Backend**: Standard Go Layout · errors wrapped with `fmt.Errorf("context: %w", err)` · structured logging via `slog` · parameterized queries only · never log PII · handler → service → database layering

**API**: REST JSON at `/api/v1/*` · JWT auth **[v2]** (v1 is all public) · see `docs/generated/API_SPEC.md`

**Commits**: `type(scope): description` — types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

## Rules

1. Read relevant docs before making changes
2. Follow existing patterns in the codebase
3. Small, focused changes — one concern per change
4. Always include error handling — no silent failures
5. Form validation happens client-side AND server-side
6. PDF generation must be idempotent — same input = same output
7. Never generate final PDFs client-side — backend is source of truth

## Docs Map

| Doc                           | Purpose                                        |
| ----------------------------- | ---------------------------------------------- |
| `ARCHITECTURE.md`             | System design, invariants, boundaries, codemap |
| `docs/generated/API_SPEC.md`  | Full API endpoint specification                |
| `docs/generated/db-schema.md` | Database schema + ResumeData JSON shape        |
| `docs/design-docs/index.md`   | Design decisions index                         |
| `docs/product-specs/`         | Feature specifications                         |
| `docs/PLANS.md`               | ExecPlan template + active plans               |
| `docs/references/`            | LLM-readable reference files                   |

## ExecPlans

For complex features or refactors, create an ExecPlan in `docs/exec-plans/active/` using the skeleton in `docs/PLANS.md`. Move completed plans to `docs/exec-plans/completed/`.

## Key Decisions

| Decision | Choice              | Rationale                                        |
| -------- | ------------------- | ------------------------------------------------ |
| Frontend | Next.js App Router  | SSR for SEO, React ecosystem                     |
| Backend  | Go + Chi v5         | Fast PDF gen, low memory, idiomatic middleware   |
| PDF lib  | go-pdf/fpdf         | Full layout control, no external deps, ~50-200ms |
| Database | PostgreSQL **[v2]** | JSON columns, reliability                        |
| Auth     | JWT **[v2]**        | Stateless, works with Go + Next.js               |
| Storage  | S3/MinIO **[v2]**   | Scalable blob storage                            |
