# SECURITY.md — Security Practices

> Security guidance for the current Resume Maker architecture:
> Next.js BFF + Supabase Auth/Postgres + Go PDF microservice.

---

## Threat Model

### Assets to Protect

1. **OAuth session tokens** (`sb-access-token`, `sb-refresh-token`)
2. **Resume data (PII)** stored in `public.resumes`
3. **Generated PDFs** containing user profile/work history
4. **Service auth secret** used between Next.js and Go (`GO_PDF_SERVICE_HMAC_SECRET`)
5. **Supabase credentials and project data**

### Potential Attackers

- Automated bot traffic and scanning
- Authenticated user attempting tenant breakout (accessing other users' resumes)
- Actor attempting to call Go PDF service directly
- Accidental secret leakage through logs or repo

---

## Authentication Security

### Identity Provider

- Google OAuth through Supabase Auth
- Identity source of truth: `auth.users`
- No email/password auth routes in application code

### Session Cookies

Set by `GET /api/auth/callback`:

- `sb-access-token`
- `sb-refresh-token`

Cookie policy:

- `httpOnly: true`
- `sameSite: lax`
- `path: /`
- `secure: true` in production

### Session Validation

Protected Next.js routes call `supabase.auth.getUser(accessToken)`.
If missing/invalid, route returns `401 UNAUTHORIZED`.

---

## API Boundary Security

### BFF Boundary

- Browser must call Next.js API routes only
- Browser should not hold direct DB credentials or run SQL
- Supabase access for user data happens server-side in Next.js route handlers

### Input Validation

- Validate at client and server layers
- PDF payload validation is enforced in Go service
- Photo payload must be JPEG/PNG data URL and <=5MB decoded

### CORS

Go service currently allows:

- `http://localhost:3000`
- `http://127.0.0.1:3000`

Production deployments should restrict this list to exact frontend origins.

---

## Service-to-Service Security (Next.js -> Go)

When `GO_PDF_SERVICE_HMAC_SECRET` is configured, Go enforces signed requests.

Required headers:

- `X-Service-Id`
- `X-Service-Timestamp`
- `X-Service-Nonce`
- `X-Service-Signature` (`sha256=<hex>`)

Verification controls:

- service id must match `GO_PDF_SERVICE_ALLOWED_ID` (default `nextjs-api`)
- timestamp freshness window: +/-300 seconds
- HMAC signature over method/path/body hash
- nonce must be present

Current gap:

- nonce replay store is not implemented yet (nonce presence only)

---

## Data Security

### Supabase Postgres

- Per-user access control via RLS policies on `profiles` and `resumes`
- `user_id` ownership checks enforced in policy and in app queries
- Use HTTPS/TLS for all production DB and API traffic

### PII Handling

- Never log resume content, access/refresh tokens, or secrets
- Log operational metadata only (request id, endpoint, timing, user id where needed)

### PDF Handling

- Go service returns PDF bytes directly (no server-side long-term PDF storage by default)
- If storage is added later, object storage must be private with signed URL access only

---

## Secrets & Configuration

Sensitive environment variables (must never be hardcoded):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `GO_PDF_SERVICE_HMAC_SECRET`
- `GO_PDF_SERVICE_ALLOWED_ID`

Operational rules:

- Never commit `.env` files
- Keep `.env.example` up to date
- Use distinct secrets per environment
- Rotate secrets after suspected exposure

---

## Security Checklist

- [ ] Google OAuth configured with correct redirect URL(s)
- [ ] `sb-*` cookies are httpOnly and secure in production
- [ ] All protected resume routes return `401` when unauthenticated
- [ ] Supabase RLS enabled and tested for tenant isolation
- [ ] `GO_PDF_SERVICE_HMAC_SECRET` set in both Next.js and Go production environments
- [ ] `GO_PDF_SERVICE_ALLOWED_ID` set explicitly in production
- [ ] No secrets or PII in logs
- [ ] Dependency vulnerability checks run (`npm audit`, `go list -m -u`, scanner of choice)
- [ ] HTTPS enabled end-to-end in production
