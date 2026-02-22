# Core Beliefs — Engineering & Product Principles

> These principles guide every decision in the Resume Maker project. When in doubt, refer back here.

---

## Product Beliefs

### 1. The Resume is the Product, Not the Tool

The user doesn't care about our tech stack. They care about getting a beautiful, professional resume that lands them interviews. Every feature must serve this goal.

### 2. Simplicity Over Flexibility (for v1)

One excellent template is better than ten mediocre ones. We ship a single, polished, ATS-friendly template and make it work perfectly before adding more.

### 3. Speed Matters

Resume creation should feel instant. Live preview must update in real-time. PDF generation should complete in under 2 seconds. If the user is waiting, we've failed.

### 4. ATS-First Design

A beautiful resume that gets rejected by Applicant Tracking Systems is useless. Every design decision must ensure the output PDF is machine-parseable with clean text extraction.

### 5. No Data Lock-In

Users own their data. They should be able to export their resume as PDF, and their data as JSON, at any time. No paywalls on basic functionality.

---

## Engineering Beliefs

### 1. Separation of Data and Presentation

Resume content (JSON) is completely decoupled from how it looks (template). The same data should render identically across different templates. The backend only knows about data; the template system handles rendering.

### 2. Server-Side is the Source of Truth

The live preview in the browser is an approximation. The Go backend generates the canonical PDF. We must ensure they match closely, but the PDF is always authoritative.

### 3. Boring Technology for Critical Paths

- PostgreSQL, not a trendy new database
- Go standard library where possible, not frameworks for everything
- Google OAuth via Supabase with server-managed session cookies
- S3 for storage, not custom file servers

### 4. Fail Loudly, Recover Gracefully

- Backend errors are logged with full context
- Frontend shows user-friendly error messages with retry options
- PDF generation failures never produce corrupt files — either succeed fully or fail with a clear message

### 5. Test the Output, Not Just the Code

Unit tests are necessary but not sufficient. For a resume maker, the most important test is: **does the generated PDF look correct?** Visual regression tests against reference PDFs are first-class citizens.

### 6. Optimize for the Common Case

- 90% of users have 1-3 jobs, 1 education entry, a handful of skills
- Optimize layout, pagination, and performance for this case
- Handle edge cases (10 jobs, very long bullet points) gracefully but don't over-engineer for them

---

## Operational Beliefs

### 1. Local Development Must Be Effortless

`docker-compose up` should bring up the entire stack. No manual setup steps, no external service dependencies for basic development.

### 2. Documentation is Code

If it's not documented, it doesn't exist. Design decisions, API contracts, and setup instructions must be written down and maintained.

### 3. Ship Incrementally

Build the smallest useful version first, get it working end-to-end, then iterate. Don't build the perfect form editor before the PDF generation works.
