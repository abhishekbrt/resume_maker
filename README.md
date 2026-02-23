# Resume Maker

Structured resume data -> professional ATS-friendly PDF.

## What This Repo Contains

- `frontend/`: Next.js App Router app (UI + BFF API routes)
- `backend/`: Go HTTP service for PDF generation
- `supabase/`: SQL migrations for v2 Postgres schema and RLS
- `docs/`: architecture, API spec, schema docs, plans

Current architecture:

1. Browser calls Next.js routes (`/api/*`)
2. Next.js handles auth/session and resume CRUD via Supabase
3. Next.js proxies PDF generation to Go with HMAC service headers
4. Go validates payload and returns PDF bytes

See `ARCHITECTURE.md` for full details.

## Current Status

- Core PDF generation is implemented in Go (`backend/internal/pdfgen`).
- OAuth/session and resume CRUD routes are implemented in Next.js (`frontend/src/app/api`).
- Editor UI state is currently localStorage-first (`frontend/src/lib/resume-context.tsx`).
- Some planned endpoints (photo upload, per-resume PDF route) are not yet implemented.

## Prerequisites

- Node.js 20+
- npm 10+
- Go 1.23+
- Supabase project (required for OAuth + resume CRUD routes)

## Quick Start (Local)

### 1. Start Go PDF Service

```bash
cd backend
go mod download
PORT=8080 GO_PDF_SERVICE_HMAC_SECRET=dev-secret go run cmd/server/main.go
```

### 2. Start Frontend

```bash
cd frontend
npm install
SUPABASE_URL=your_supabase_url \
SUPABASE_ANON_KEY=your_supabase_anon_key \
GO_PDF_SERVICE_URL=http://localhost:8080/api/v1/resumes/generate-pdf \
GO_PDF_SERVICE_HMAC_SECRET=dev-secret \
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

### Frontend (`frontend`)

- `SUPABASE_URL` (required)
- `SUPABASE_ANON_KEY` (required)
- `GO_PDF_SERVICE_URL` (required for PDF proxy; default points to localhost Go route)
- `GO_PDF_SERVICE_HMAC_SECRET` (required by current proxy implementation)
- `GO_PDF_SERVICE_ID` (optional, default `nextjs-api`)
- `NEXT_PUBLIC_APP_URL` (optional, used for OAuth callback redirect)
- `NEXT_PUBLIC_API_URL` (optional, API base override for browser PDF request client)

### Backend (`backend`)

- `PORT` (optional, default `8080`)
- `GO_PDF_SERVICE_HMAC_SECRET` (optional; enables request signature verification when set)
- `GO_PDF_SERVICE_ALLOWED_ID` (optional, default `nextjs-api`)

## Development Commands

### Frontend

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Test: `npm test`

### Backend

- Install deps: `go mod download`
- Run: `go run cmd/server/main.go`
- Build: `go build -o bin/server cmd/server/main.go`
- Test: `go test ./...`

## API Surface (Summary)

### Next.js (browser-facing)

- `GET /api/auth/google/start`
- `GET /api/auth/callback`
- `GET /api/auth/session`
- `POST /api/auth/logout`
- `GET /api/v1/resumes`
- `POST /api/v1/resumes`
- `GET /api/v1/resumes/:id`
- `PATCH /api/v1/resumes/:id`
- `DELETE /api/v1/resumes/:id`
- `POST /api/v1/resumes/generate-pdf`

### Go service (internal)

- `GET /api/v1/health`
- `GET /api/v1/templates`
- `POST /api/v1/resumes/generate-pdf`

For request/response contracts, see `docs/generated/API_SPEC.md`.

## Data Model

- Canonical TypeScript payloads: `frontend/src/lib/types.ts`
- Go request model: `backend/internal/models/resume.go`
- Database schema (v2): `docs/generated/db-schema.md`

## Testing

- Frontend tests: `frontend/src/**/*.test.ts(x)` (Vitest)
- Backend tests: `backend/internal/**/_test.go`
- PDF renderer regression tests include golden fixtures in `backend/internal/pdfgen/testdata`.

## Documentation Map

- Architecture: `ARCHITECTURE.md`
- API spec: `docs/generated/API_SPEC.md`
- DB schema: `docs/generated/db-schema.md`
- Security notes: `docs/SECURITY.md`
- Plans: `docs/PLANS.md`

