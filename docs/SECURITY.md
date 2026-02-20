# SECURITY.md — Security Practices

> Security guidelines and threat mitigations for the Resume Maker application.
>
> **Phase note:** Sections marked **[v2]** apply only after authentication and
> database persistence are implemented. In v1 (MVP), no user accounts exist
> and no PII is stored server-side.

---

## Threat Model

### Assets to Protect

1. **User credentials** — email, password hashes
2. **Resume data** — personal information (name, phone, email, work history)
3. **Uploaded photos** — profile images
4. **Generated PDFs** — contain all resume data
5. **Server infrastructure** — prevent unauthorized access

### Potential Attackers

- **Opportunistic**: Automated scanners, bots
- **Targeted**: Someone trying to access another user's resume data
- **Internal**: Compromised dependency, supply chain attack

---

## Authentication Security [v2]

### Password Handling

- Hash with **bcrypt** (cost factor ≥ 12)
- Never store plaintext passwords
- Never log passwords or password hashes
- Enforce minimum password length: 8 characters
- Rate limit login attempts: max 5 per minute per IP

### JWT Implementation

- **Access token**: Short-lived (15 minutes)
- **Refresh token**: Longer-lived (7 days), stored in httpOnly cookie
- Sign with **HS256** using a strong secret (≥32 bytes, from environment variable)
- Include: `user_id`, `email`, `iat`, `exp`
- Never include sensitive data in JWT payload
- Validate on every API request via middleware

### Session Management [v2]

- Invalidate refresh tokens on password change
- Support explicit logout (delete refresh token)
- Future: token revocation list for compromised tokens

---

## API Security

### Input Validation

- Validate all input on the server (never trust client-side validation alone)
- Sanitize text fields to prevent XSS in generated PDFs
- Limit request body size: 10MB max (for photo uploads)
- Validate file types server-side (not just extension — check magic bytes)

### CORS

- Allow only the frontend origin (`CORS_ALLOWED_ORIGINS` env var)
- No wildcard (`*`) in production
- Restrict methods to those actually used: GET, POST, PUT, DELETE, OPTIONS

### Rate Limiting

| Endpoint                         | Limit       | Window              |
| -------------------------------- | ----------- | ------------------- |
| `/api/v1/auth/login`             | 5 requests  | per minute per IP   |
| `/api/v1/auth/signup`            | 3 requests  | per minute per IP   |
| `/api/v1/resumes/*/generate-pdf` | 10 requests | per minute per user |
| All other endpoints              | 60 requests | per minute per user |

### Headers

Set these security headers via middleware:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains (production only)
Content-Security-Policy: default-src 'self'
```

---

## Data Security

### PII Handling

- Resume data is PII — treat it with care
- Encrypt at rest (PostgreSQL with disk encryption or managed DB encryption)
- Encrypt in transit (HTTPS everywhere, TLS 1.2+)
- Never log resume content, personal info, or email addresses
- Log only: user_id, resume_id, action, timestamp

### File Upload Security

- Validate MIME type server-side (accept only `image/jpeg`, `image/png`)
- Check file magic bytes (don't trust Content-Type header alone)
- Limit file size: 5MB for photos
- Generate random filenames (UUIDs) — never use user-provided filenames
- Store in S3 with private ACL — access only via pre-signed URLs
- Scan for embedded scripts or malicious content (stretch goal)

### Database Security

- Use parameterized queries exclusively — zero tolerance for string concatenation in queries
- Database user has minimal privileges (no DROP, no schema modification in production)
- Connection via SSL in production
- Regular backups with encryption

---

## Dependency Security

- Run `npm audit` and `go mod tidy` regularly
- Keep dependencies updated (quarterly review at minimum)
- Pin dependency versions (lock files committed)
- Review changelogs before major version upgrades
- Use GitHub Dependabot or similar for automated vulnerability alerts

---

## Environment Variables

**Sensitive values that MUST be environment variables (never hardcoded)**:

- `JWT_SECRET` — JWT signing key
- `DATABASE_URL` — PostgreSQL connection string
- `S3_ACCESS_KEY`, `S3_SECRET_KEY` — Storage credentials
- `CORS_ALLOWED_ORIGINS` — Allowed frontend origins

**Rules**:

- Never commit `.env` files (add to `.gitignore`)
- Provide `.env.example` with placeholder values
- Use different secrets for development, staging, production
- Rotate secrets if any are accidentally committed

---

## Security Checklist (Pre-Launch)

- [ ] All passwords hashed with bcrypt
- [ ] JWT implemented with short expiry
- [ ] CORS restricted to frontend origin
- [ ] Rate limiting on auth and PDF endpoints
- [ ] Input validation on all API endpoints
- [ ] File uploads validated (type, size, content)
- [ ] Security headers set
- [ ] HTTPS enforced in production
- [ ] No secrets in code or logs
- [ ] Dependency audit passes
- [ ] SQL injection: parameterized queries verified
- [ ] XSS: output encoding in PDF generation
- [ ] `.env.example` provided, `.env` in `.gitignore`
