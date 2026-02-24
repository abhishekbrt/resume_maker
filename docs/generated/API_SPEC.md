# API Specification

> Current API contract for Resume Maker.
> This covers both:
> - Browser-facing Next.js routes (`frontend/src/app/api/*`)
> - Internal Go PDF service routes (`backend/internal/handlers/router.go`)

---

## Topology

Runtime request flow:

1. Browser calls Next.js API routes on the same origin (`/api/*`)
2. Next.js validates auth session cookies for protected routes
3. Next.js reads/writes data in Supabase Postgres
4. Next.js proxies PDF generation to Go service with HMAC service headers

---

## Conventions

### Base URLs

- **Browser-facing API (Next.js BFF):** same origin as frontend
  - local: `http://localhost:3000`
- **Internal PDF service (Go):** not for direct browser use
  - local: `http://localhost:8080`

### Content Types

- JSON APIs: `application/json`
- PDF responses: `application/pdf`

### Authentication Model

Auth uses **Supabase Google OAuth** with httpOnly cookies managed by Next.js:

- `sb-access-token`
- `sb-refresh-token`

Protected endpoints return `401` when session is missing/invalid.

### Standard Error Shape

Next.js route handlers and Go handlers use this envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message"
  }
}
```

Validation errors from the Go PDF service may also include `details`:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "data.personalInfo.firstName",
        "message": "must not be empty"
      }
    ]
  }
}
```

### Error Codes

| Code                | HTTP Status | Meaning |
| ------------------- | ----------- | ------- |
| `BAD_REQUEST`       | 400         | Malformed request or wrong content type |
| `VALIDATION_ERROR`  | 400         | Input validation failed |
| `UNAUTHORIZED`      | 401         | Missing/invalid auth session or service auth |
| `NOT_FOUND`         | 404         | Resource not found for the authenticated user |
| `PAYLOAD_TOO_LARGE` | 413         | Photo exceeds 5MB limit |
| `BAD_GATEWAY`       | 502         | Next.js could not reach Go PDF service |
| `INTERNAL_ERROR`    | 500         | Unexpected server error |

---

## Browser-Facing Endpoints (Next.js)

These endpoints are served by `frontend/src/app/api/*`.

---

### GET /api/auth/google/start

Start Google OAuth via Supabase PKCE flow and redirect the browser to Google consent.

**Auth required:** No.

**Response (success):**

- `307 Temporary Redirect` to a Google/Supabase authorization URL.

**Response (error):**

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to start Google OAuth flow"
  }
}
```

---

### GET /api/auth/callback?code=...

OAuth callback endpoint. Exchanges PKCE auth code for a Supabase session and sets auth cookies.

**Auth required:** No.

**Query params:**

- `code` (required): OAuth authorization code from Supabase/Google redirect.

**Response (success):**

- `307 Temporary Redirect` to `${NEXT_PUBLIC_APP_URL}/editor` (or current origin fallback).
- Sets cookies:
  - `sb-access-token`
  - `sb-refresh-token`

Cookie options:

- `httpOnly: true`
- `sameSite: lax`
- `path: /`
- `secure: true` only in production

**Response (error):**

- `400 BAD_REQUEST` if `code` is missing
- `401 UNAUTHORIZED` if OAuth provider reports an error (`error` query param)
- `401 UNAUTHORIZED` if token exchange fails

---

### GET /api/auth/session

Return authenticated user from `sb-access-token` cookie.

**Auth required:** Cookie-based auth.

**Response (success):**

```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com"
  }
}
```

**Response (error):**

- `401 UNAUTHORIZED` when cookie missing or session invalid/expired

---

### POST /api/auth/logout

Clears auth cookies.

**Auth required:** No (safe to call even if not logged in).

**Response:**

- `204 No Content`
- Clears:
  - `sb-access-token`
  - `sb-refresh-token`

---

### GET /api/v1/resumes

List resume metadata for current user.

**Auth required:** Yes.

**Response (success):**

```json
{
  "resumes": [
    {
      "id": "resume-uuid",
      "title": "Software Engineer Resume",
      "templateId": "classic",
      "createdAt": "2026-02-20T10:00:00Z",
      "updatedAt": "2026-02-21T11:00:00Z"
    }
  ]
}
```

**Response (error):**

- `401 UNAUTHORIZED` when user is not authenticated
- `500 INTERNAL_ERROR` when Supabase query fails

---

### POST /api/v1/resumes

Create or update the single resume for current user.

**Auth required:** Yes.

**Request body:**

```json
{
  "title": "Software Engineer Resume",
  "templateId": "classic",
  "data": { "personalInfo": { "firstName": "Ada", "lastName": "Lovelace" } }
}
```

**Validation:**

- `title` must be a non-empty string
- `templateId` must be a non-empty string
- `data` must be an object

**Response (success):**

```json
{
  "id": "resume-uuid",
  "title": "Software Engineer Resume",
  "templateId": "classic",
  "data": { "...": "..." },
  "createdAt": "2026-02-20T10:00:00Z",
  "updatedAt": "2026-02-20T10:00:00Z"
}
```

- `201 Created` when no resume existed and a new row is created
- `200 OK` when an existing resume is updated in place

**Response (error):**

- `401 UNAUTHORIZED`
- `400 VALIDATION_ERROR`
- `500 INTERNAL_ERROR`

---

### GET /api/v1/resumes/:id

Fetch one resume by id for current user.

**Auth required:** Yes.

**Response (success):**

```json
{
  "id": "resume-uuid",
  "title": "Software Engineer Resume",
  "templateId": "classic",
  "data": { "...": "..." },
  "photoPath": "photos/user-uuid/file.png",
  "createdAt": "2026-02-20T10:00:00Z",
  "updatedAt": "2026-02-21T11:00:00Z"
}
```

**Response (error):**

- `401 UNAUTHORIZED`
- `404 NOT_FOUND`

---

### PATCH /api/v1/resumes/:id

Patch mutable fields for one resume.

**Auth required:** Yes.

**Mutable fields:**

- `title`
- `templateId`
- `data`

At least one mutable field must be present.

**Request body example:**

```json
{
  "title": "Updated Resume Title",
  "data": { "...": "..." }
}
```

**Response (success):**

```json
{
  "id": "resume-uuid",
  "title": "Updated Resume Title",
  "templateId": "classic",
  "data": { "...": "..." },
  "createdAt": "2026-02-20T10:00:00Z",
  "updatedAt": "2026-02-21T11:15:00Z"
}
```

**Response (error):**

- `401 UNAUTHORIZED`
- `400 VALIDATION_ERROR` (no mutable fields provided)
- `404 NOT_FOUND`

---

### DELETE /api/v1/resumes/:id

Delete one resume by id.

**Auth required:** Yes.

**Response:**

- `204 No Content`

**Response (error):**

- `401 UNAUTHORIZED`
- `500 INTERNAL_ERROR` if delete query fails

---

### POST /api/v1/resumes/generate-pdf

Proxy endpoint from Next.js to Go PDF service.

**Auth required:** No at route level (current implementation).

**Request requirements:**

- `Content-Type` must include `application/json`
- Body must match `GeneratePDFRequest` shape

**Request body shape:**

```json
{
  "data": { "...ResumeData...": "..." },
  "settings": {
    "showPhoto": false,
    "fontSize": "medium",
    "fontFamily": "times"
  },
  "photo": "data:image/png;base64,..."
}
```

**Behavior:**

- Forwards request to `GO_PDF_SERVICE_URL`
- Signs request with HMAC headers using `GO_PDF_SERVICE_HMAC_SECRET`
- Returns upstream status/body
- Copies upstream `Content-Type` and `Content-Disposition` response headers

**Response (error):**

- `400 BAD_REQUEST` if content type is not JSON
- `502 BAD_GATEWAY` if Go service is unreachable or secret is missing in Next.js env

---

## Internal Service Endpoints (Go)

These endpoints are served by `backend` and intended for trusted callers (Next.js BFF).

---

### GET /api/v1/health

Health endpoint.

**Response:**

```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

---

### GET /api/v1/templates

Returns available PDF templates from Go service.

**Response:**

```json
{
  "templates": [
    {
      "id": "classic",
      "name": "Classic",
      "description": "Clean single-column layout with serif typography. ATS-friendly.",
      "isDefault": true
    }
  ]
}
```

---

### POST /api/v1/resumes/generate-pdf

Generate PDF bytes from resume payload.

**Request:** same `GeneratePDFRequest` JSON shape as above.

**Response (success):**

- `200 OK`
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="<derived>.pdf"`

**Validation highlights (Go service):**

- `data.personalInfo.firstName` required
- `data.personalInfo.lastName` required
- at least one of: `experience`, `education`, `projects`, `technicalSkills`
- `settings.fontFamily` must be one of: `times`, `garamond`, `calibri`, `arial`
- `settings.fontSize` must be one of: `small`, `medium`, `large`
- if `settings.showPhoto=true`, `photo` is required
- photo must be base64 JPEG/PNG data URL and <= 5MB decoded

**Error responses:**

- `400 BAD_REQUEST` (bad content type or malformed JSON)
- `400 VALIDATION_ERROR` (field-level validation)
- `401 UNAUTHORIZED` (service auth failure when enabled)
- `413 PAYLOAD_TOO_LARGE` (photo > 5MB)
- `500 INTERNAL_ERROR`

### Service-to-service HMAC auth

When `GO_PDF_SERVICE_HMAC_SECRET` is set on Go service, caller must send:

- `X-Service-Id`
- `X-Service-Timestamp` (unix seconds, ±300s)
- `X-Service-Nonce` (non-empty)
- `X-Service-Signature` (`sha256=<hex>`)

Signature canonical string:

```
<timestamp>\n<METHOD>\n<PATH>\n<SHA256_HEX_OF_RAW_BODY>
```

Allowed service id defaults to `nextjs-api` or `GO_PDF_SERVICE_ALLOWED_ID` if configured.

---

## Planned (Not Implemented Yet)

These are tracked in architecture docs but are not currently implemented:

- `POST /api/v1/resumes/:id/generate-pdf`
- `POST /api/v1/resumes/:id/photo`
- `DELETE /api/v1/resumes/:id/photo`
- nonce replay-store hardening for service-auth

---

## ResumeData Reference

Canonical data shape is documented in:

- `docs/generated/db-schema.md`
- frontend TypeScript source: `frontend/src/lib/types.ts`
