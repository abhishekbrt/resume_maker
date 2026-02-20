# API Specification

> Complete REST API contract between the Next.js frontend and the Go backend.
> This is the single source of truth for all endpoint behavior, request/response
> shapes, and error formats.
>
> **Phase note:** Endpoints marked **[v2]** are not part of the MVP. In v1, all
> endpoints are public (no authentication required).

---

## Conventions

### Base URL

All endpoints are prefixed with `/api/v1`. In local development the Go server
runs on `http://localhost:8080`, so the full base URL is
`http://localhost:8080/api/v1`.

### Content Type

All request and response bodies are JSON (`Content-Type: application/json`)
unless otherwise noted. The PDF download endpoint returns
`application/pdf`.

### Naming

Endpoint paths use lowercase with hyphens for multi-word segments. Resource
names are plural nouns. Actions that don't map to CRUD use verb sub-paths.

    /api/v1/resumes               — the resumes collection
    /api/v1/resumes/:id           — a single resume
    /api/v1/resumes/generate-pdf  — action endpoint (verb)
    /api/v1/auth/login            — auth action

### Request IDs

Every response includes an `X-Request-Id` header set by the server middleware.
Include this value when reporting errors.

### Authentication [v2]

When authentication is implemented, protected endpoints require a JWT bearer
token in the `Authorization` header:

    Authorization: Bearer <access_token>

Unauthenticated requests to protected endpoints return `401 Unauthorized`.
In v1, all endpoints are public and no `Authorization` header is needed.

---

## Error Response Format

All error responses follow this shape:

    {
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "A human-readable description of what went wrong.",
        "details": [
          {
            "field": "personalInfo.email",
            "message": "must be a valid email address"
          }
        ]
      }
    }

The `details` array is present only for validation errors. The `code` field is
a machine-readable error code from the table below.

### Error Codes

| Code                  | HTTP Status | Meaning                                          |
| --------------------- | ----------- | ------------------------------------------------ |
| `VALIDATION_ERROR`    | 400         | Request body failed validation                   |
| `BAD_REQUEST`         | 400         | Malformed request (bad JSON, wrong content type) |
| `UNAUTHORIZED`        | 401         | Missing or invalid auth token [v2]               |
| `FORBIDDEN`           | 403         | Token valid but insufficient permissions [v2]    |
| `NOT_FOUND`           | 404         | Resource does not exist                          |
| `PAYLOAD_TOO_LARGE`   | 413         | Request body exceeds size limit                  |
| `RATE_LIMITED`        | 429         | Too many requests                                |
| `INTERNAL_ERROR`      | 500         | Unexpected server error                          |
| `SERVICE_UNAVAILABLE` | 503         | PDF generation queue is full, try again later    |

---

## v1 Endpoints (MVP)

These endpoints ship in Phase 1. No authentication is required.

---

### POST /api/v1/resumes/generate-pdf

Generate a PDF from resume data. This is the core endpoint of the entire
application. The frontend sends the full resume JSON, the server renders it
using the Go `pdfgen` module, and returns the PDF as a binary stream.

**Request:**

    POST /api/v1/resumes/generate-pdf
    Content-Type: application/json

    {
      "data": { ... },
      "settings": {
        "showPhoto": false,
        "fontSize": "medium",
        "fontFamily": "times"
      }
    }

The `data` field contains the full `ResumeData` JSON shape as defined in
`docs/generated/db-schema.md`. The `settings` object controls template
rendering options.

When `showPhoto` is `true`, the photo must be included as a base64-encoded
string in a `photo` field at the top level:

    {
      "data": { ... },
      "settings": { "showPhoto": true, ... },
      "photo": "data:image/jpeg;base64,/9j/4AAQSkZJR..."
    }

**Response (success):**

    HTTP 200 OK
    Content-Type: application/pdf
    Content-Disposition: attachment; filename="FirstName_LastName_Resume.pdf"

    <binary PDF bytes>

The filename is derived from `data.personalInfo.firstName` and
`data.personalInfo.lastName`. If either is missing, the filename defaults to
`Resume.pdf`.

**Response (error):**

    HTTP 400 Bad Request  — if data fails validation
    HTTP 413 Payload Too Large — if photo exceeds 5MB
    HTTP 503 Service Unavailable — if the PDF generation queue is full

**Validation rules:**

- `data.personalInfo.firstName` is required (non-empty string)
- `data.personalInfo.lastName` is required (non-empty string)
- At least one content section must have data (experience, education, or skills)
- If `photo` is provided, it must be a valid base64-encoded JPEG or PNG, max 5MB decoded
- `settings.fontFamily` must be one of: `times`, `garamond`, `calibri`, `arial`
- `settings.fontSize` must be one of: `small`, `medium`, `large`

**Rate limit:** 10 requests per minute per IP.

**Timing:** Target response time is under 2 seconds for a typical 1-page resume.

---

### GET /api/v1/health

Basic health check. Used by Docker health checks and load balancers.

**Request:**

    GET /api/v1/health

**Response:**

    HTTP 200 OK
    Content-Type: application/json

    {
      "status": "ok",
      "version": "1.0.0"
    }

---

### GET /api/v1/templates

List available resume templates. In v1, this returns a single template.

**Request:**

    GET /api/v1/templates

**Response:**

    HTTP 200 OK
    Content-Type: application/json

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

---

## v2 Endpoints (Phase 2 — Auth & Persistence)

These endpoints are not part of the MVP. They are documented here for planning
purposes. All v2 endpoints require a valid JWT access token unless noted.

---

### POST /api/v1/auth/signup

Create a new user account.

**Auth required:** No.

**Request:**

    POST /api/v1/auth/signup
    Content-Type: application/json

    {
      "email": "user@example.com",
      "password": "securepassword123",
      "fullName": "Jane Doe"
    }

**Response (success):**

    HTTP 201 Created

    {
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "user@example.com",
        "fullName": "Jane Doe",
        "createdAt": "2026-02-17T07:00:00Z"
      },
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 900
    }

A refresh token is set as an `httpOnly` cookie named `refresh_token`.

**Validation:**

- `email` must be a valid email address, unique across all users
- `password` must be at least 8 characters
- `fullName` is optional

**Rate limit:** 3 requests per minute per IP.

---

### POST /api/v1/auth/login

Authenticate an existing user.

**Auth required:** No.

**Request:**

    POST /api/v1/auth/login
    Content-Type: application/json

    {
      "email": "user@example.com",
      "password": "securepassword123"
    }

**Response (success):**

    HTTP 200 OK

    {
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "user@example.com",
        "fullName": "Jane Doe"
      },
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 900
    }

**Response (error):**

    HTTP 401 Unauthorized — invalid email or password

**Rate limit:** 5 requests per minute per IP.

---

### POST /api/v1/auth/refresh

Refresh an expired access token using the refresh token cookie.

**Auth required:** No (uses refresh token cookie).

**Request:**

    POST /api/v1/auth/refresh

    (No body. The httpOnly refresh_token cookie is sent automatically.)

**Response:**

    HTTP 200 OK

    {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 900
    }

---

### POST /api/v1/auth/logout

Invalidate the refresh token.

**Auth required:** Yes.

**Request:**

    POST /api/v1/auth/logout

**Response:**

    HTTP 204 No Content

The `refresh_token` cookie is cleared.

---

### GET /api/v1/resumes

List all resumes belonging to the authenticated user.

**Auth required:** Yes.

**Request:**

    GET /api/v1/resumes

**Response:**

    HTTP 200 OK

    {
      "resumes": [
        {
          "id": "resume-uuid-1",
          "title": "Software Engineer Resume",
          "templateId": "classic",
          "updatedAt": "2026-02-17T06:30:00Z",
          "createdAt": "2026-02-15T10:00:00Z"
        }
      ]
    }

This endpoint returns metadata only, not the full resume data. Use the
single-resume endpoint to get the full data.

---

### POST /api/v1/resumes

Create a new resume.

**Auth required:** Yes.

**Request:**

    POST /api/v1/resumes
    Content-Type: application/json

    {
      "title": "Software Engineer Resume",
      "templateId": "classic",
      "data": { ... }
    }

**Response:**

    HTTP 201 Created

    {
      "id": "resume-uuid-1",
      "title": "Software Engineer Resume",
      "templateId": "classic",
      "data": { ... },
      "createdAt": "2026-02-17T07:00:00Z",
      "updatedAt": "2026-02-17T07:00:00Z"
    }

---

### GET /api/v1/resumes/:id

Get a single resume with full data.

**Auth required:** Yes. Returns `404` if the resume belongs to another user.

**Request:**

    GET /api/v1/resumes/resume-uuid-1

**Response:**

    HTTP 200 OK

    {
      "id": "resume-uuid-1",
      "title": "Software Engineer Resume",
      "templateId": "classic",
      "data": { ... },
      "photoUrl": "https://storage.example.com/photos/uuid.jpg",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-17T06:30:00Z"
    }

---

### PATCH /api/v1/resumes/:id

Update a resume. Supports partial updates — only the fields included in the
request body are updated.

**Auth required:** Yes.

**Request:**

    PATCH /api/v1/resumes/resume-uuid-1
    Content-Type: application/json

    {
      "title": "Updated Title",
      "data": { ... }
    }

**Response:**

    HTTP 200 OK

    {
      "id": "resume-uuid-1",
      "title": "Updated Title",
      "templateId": "classic",
      "data": { ... },
      "updatedAt": "2026-02-17T07:15:00Z"
    }

---

### DELETE /api/v1/resumes/:id

Delete a resume.

**Auth required:** Yes.

**Request:**

    DELETE /api/v1/resumes/resume-uuid-1

**Response:**

    HTTP 204 No Content

---

### POST /api/v1/resumes/:id/generate-pdf

Generate a PDF for a saved resume. Uses the stored resume data and photo.

**Auth required:** Yes.

**Request:**

    POST /api/v1/resumes/resume-uuid-1/generate-pdf

    (No body. Uses the resume data stored on the server.)

**Response:**

    HTTP 200 OK
    Content-Type: application/pdf
    Content-Disposition: attachment; filename="Jane_Doe_Resume.pdf"

    <binary PDF bytes>

---

### POST /api/v1/resumes/:id/photo

Upload a profile photo for a resume.

**Auth required:** Yes.

**Request:**

    POST /api/v1/resumes/resume-uuid-1/photo
    Content-Type: multipart/form-data

    photo: <file upload, JPEG or PNG, max 5MB>

**Response:**

    HTTP 200 OK

    {
      "photoUrl": "https://storage.example.com/photos/new-uuid.jpg"
    }

**Validation:**

- File must be JPEG or PNG (validated by magic bytes, not just extension)
- Max file size: 5MB
- Server generates a random UUID filename — user-provided filenames are ignored

---

### DELETE /api/v1/resumes/:id/photo

Remove the profile photo from a resume.

**Auth required:** Yes.

**Request:**

    DELETE /api/v1/resumes/resume-uuid-1/photo

**Response:**

    HTTP 204 No Content

---

## ResumeData JSON Shape (Quick Reference)

The full schema is documented in `docs/generated/db-schema.md`. This is a
condensed reference for API consumers:

    {
      "personalInfo": {
        "firstName": "string (required)",
        "lastName": "string (required)",
        "location": "string",
        "phone": "string",
        "email": "string",
        "linkedin": "string (URL, optional)",
        "website": "string (URL, optional)"
      },
      "summary": "string (optional)",
      "experience": [
        {
          "id": "uuid",
          "company": "string",
          "location": "string",
          "role": "string",
          "startDate": "YYYY-MM",
          "endDate": "YYYY-MM or 'Present'",
          "bullets": ["string"]
        }
      ],
      "education": [
        {
          "id": "uuid",
          "institution": "string",
          "location": "string",
          "degree": "string",
          "graduationDate": "YYYY-MM",
          "bullets": ["string"]
        }
      ],
      "skills": ["string"],
      "sections": [
        {
          "id": "uuid",
          "title": "string",
          "items": [
            { "label": "string", "value": "string" }
          ]
        }
      ],
      "sectionOrder": ["personalInfo", "summary", "experience", ...]
    }

---

## Settings Object Reference

| Field        | Type   | Values                                  | Default  |
| ------------ | ------ | --------------------------------------- | -------- |
| `showPhoto`  | bool   | `true`, `false`                         | `false`  |
| `fontSize`   | string | `small`, `medium`, `large`              | `medium` |
| `fontFamily` | string | `times`, `garamond`, `calibri`, `arial` | `times`  |

---

## Rate Limits Summary

| Endpoint Pattern                        | Limit       | Window     | Scope |
| --------------------------------------- | ----------- | ---------- | ----- |
| `POST /api/v1/auth/login`               | 5 requests  | per minute | IP    |
| `POST /api/v1/auth/signup`              | 3 requests  | per minute | IP    |
| `POST /api/v1/resumes/generate-pdf`     | 10 requests | per minute | IP    |
| `POST /api/v1/resumes/:id/generate-pdf` | 10 requests | per minute | User  |
| All other endpoints                     | 60 requests | per minute | User  |

In v1, all rate limits are scoped by IP since there are no user accounts.
