# FRONTEND.md — Frontend Architecture & Conventions

> Technical documentation for the Next.js application (`frontend/`).

---

## Stack

| Technology  | Version  | Purpose |
| ----------- | -------- | ------- |
| Next.js     | 14+      | App Router UI + API routes (BFF) |
| React       | 18+      | UI rendering |
| TypeScript  | 5+       | Type safety |
| CSS Modules | built-in | Component-scoped styling |
| Vitest      | latest   | Unit and route tests |

---

## Current Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── editor/
│   │   │   └── page.tsx
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── google/start/route.ts
│   │       │   ├── callback/route.ts
│   │       │   ├── session/route.ts
│   │       │   └── logout/route.ts
│   │       └── v1/resumes/
│   │           ├── route.ts
│   │           ├── [id]/route.ts
│   │           └── generate-pdf/route.ts
│   ├── components/
│   │   ├── editor/
│   │   ├── preview/
│   │   └── home/
│   ├── hooks/
│   │   └── use-auth-session.ts
│   ├── lib/
│   │   ├── api.ts
│   │   ├── auth-api.ts
│   │   ├── resume-context.tsx
│   │   ├── types.ts
│   │   └── validation.ts
│   ├── server/
│   │   ├── auth-user.ts
│   │   ├── http-cookies.ts
│   │   ├── json-error.ts
│   │   ├── pdf-proxy.ts
│   │   ├── pdf-service-auth.ts
│   │   └── supabase-server.ts
│   └── styles/
│       └── *.module.css
├── package.json
└── tsconfig.json
```

---

## Key Architectural Decisions

### 1. Next.js as UI + BFF

The frontend app hosts both:

- user-facing pages (`/`, `/editor`)
- backend-for-frontend route handlers (`/api/*`)

Browser code does not talk directly to Supabase. Protected data access happens through Next.js route handlers.

### 2. Cookie-Based Session from Supabase OAuth

Google OAuth runs through:

- `GET /api/auth/google/start`
- `GET /api/auth/callback`

The callback stores session cookies (`sb-access-token`, `sb-refresh-token`) as `httpOnly` cookies.

### 3. Resume State Management

- Global editor state uses React Context + `useReducer` (`resume-context.tsx`)
- State supports local editing/preview plus PDF request payload generation

### 4. PDF Generation Flow

- Client calls `POST /api/v1/resumes/generate-pdf`
- Next.js route proxies to Go service with HMAC headers
- Client receives PDF blob for download

---

## Client Data Flow

```
┌─────────────┐      fetch(/api/*)      ┌─────────────────────────────┐
│ Browser UI  │ ──────────────────────→ │ Next.js Route Handlers (BFF)│
└─────────────┘                         └───────┬───────────────┬──────┘
                                                │               │
                                                │               │
                                    ┌───────────▼───┐   ┌───────▼────────┐
                                    │ Supabase Auth │   │ Supabase DB     │
                                    │ + getUser()   │   │ resumes table   │
                                    └───────────────┘   └────────────────┘
                                                │
                                                │ proxy PDF
                                         ┌──────▼───────┐
                                         │ Go PDF API    │
                                         └───────────────┘
```

---

## Auth UX Flow

1. Landing page shows `Sign in with Google`
2. `useAuthSession` calls `GET /api/auth/session`
3. If unauthenticated, user starts OAuth via `window.location = /api/auth/google/start`
4. Callback redirects to `/editor`
5. Editor route checks session in client and redirects unauthenticated users to `/?auth=required`

---

## Testing Strategy

| Test Type | Tool | Coverage |
| --------- | ---- | -------- |
| Unit      | Vitest | Helpers, hooks, validation, API clients |
| Route     | Vitest | Next.js route handlers (`src/app/api/**/route.test.ts`) |
| Backend contract smoke | Vitest + Go tests | Proxy and response behavior |

---

## Environment Variables

### Browser-safe (optional)

| Variable              | Required | Description |
| --------------------- | -------- | ----------- |
| `NEXT_PUBLIC_API_URL` | No       | Optional API base override for PDF calls (defaults to same-origin) |
| `NEXT_PUBLIC_APP_URL` | No       | Canonical app URL used for OAuth callback redirects |

### Next.js server-only (required for auth/data)

| Variable                     | Required | Description |
| ---------------------------- | -------- | ----------- |
| `SUPABASE_URL`               | Yes      | Supabase project URL |
| `SUPABASE_ANON_KEY`          | Yes      | Supabase anon key used by server client |
| `GO_PDF_SERVICE_URL`         | Yes      | Go PDF endpoint URL (`.../api/v1/resumes/generate-pdf`) |
| `GO_PDF_SERVICE_HMAC_SECRET` | Yes      | Shared secret used to sign PDF proxy requests |
| `GO_PDF_SERVICE_ID`          | No       | Service ID header value (default: `nextjs-api`) |

---

## Frontend Rules

- TypeScript mandatory
- CSS Modules only (no Tailwind)
- No inline style objects for feature UI
- Keep API payload types in `src/lib/types.ts`
- Keep server-only utilities in `src/server/*` and out of client bundles
