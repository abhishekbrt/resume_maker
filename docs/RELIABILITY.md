# RELIABILITY.md — Reliability & Operations

> How we ensure the Resume Maker is reliable, observable, and recoverable.

---

## Reliability Goals

| Metric                           | Target                     | Measurement              |
| -------------------------------- | -------------------------- | ------------------------ |
| **API uptime**                   | 99.9% (8.7h downtime/year) | Health check monitoring  |
| **PDF generation success rate**  | 99.5%                      | Success/failure counters |
| **Mean time to recovery (MTTR)** | <30 minutes                | Incident response time   |
| **Data durability**              | 99.99% (no data loss)      | Database backups         |
| **P99 latency (API)**            | <1s                        | Request metrics          |
| **P99 latency (PDF gen)**        | <5s                        | PDF generation metrics   |

---

## Error Handling Strategy

### Backend (Go)

```
Layer 1: Handler → validates input, returns 400 for bad requests
Layer 2: Service → business logic errors (e.g., "resume not found"), returns structured errors
Layer 3: Infrastructure → DB/S3 errors, wraps with context, returns 500
```

**Rules**:

- Every error is wrapped with context: `fmt.Errorf("generating pdf for resume %s: %w", id, err)`
- Errors are logged at the layer that handles them, not every layer
- Never return raw Go errors to the client — map to user-friendly messages
- Panics are caught by recovery middleware — never crash the server

### Frontend (React)

- **Error boundaries**: Catch rendering errors, show "Something went wrong" + retry button
- **API errors**: Caught in API client, displayed as toast notifications
- **Form errors**: Inline validation messages per field
- **Network errors**: "Connection lost" banner with auto-retry

---

## Observability

### Logging (Go Backend)

- Use `slog` with JSON output
- Log levels: `DEBUG`, `INFO`, `WARN`, `ERROR`
- Every request gets a unique `request_id` (set by middleware)
- Log: request start, request end (with duration), errors, PDF generation events

**What to log**:

- API requests: method, path, status, duration, user_id
- PDF generation: resume_id, template, duration, page_count, success/failure
- Auth events: login success/failure, token refresh
- Errors: full error chain with context

**What NOT to log**:

- Passwords, tokens, full resume content (PII)
- Request/response bodies (except in DEBUG mode)

### Metrics (Future)

When ready for production monitoring:

- Prometheus metrics endpoint (`/metrics`)
- Key metrics: request count, latency histograms, error rates, PDF gen duration
- Grafana dashboards for visualization

### Health Checks

- `GET /healthz` — basic liveness (server is running)
- `GET /readyz` — readiness (DB connected, dependencies available)
- Used by Docker health checks and load balancers

---

## Failure Modes & Recovery

| Failure                  | Impact                   | Detection             | Recovery                                                                    |
| ------------------------ | ------------------------ | --------------------- | --------------------------------------------------------------------------- |
| **Go server crash**      | API unavailable          | Docker restart policy | Auto-restart via `restart: always`                                          |
| **PostgreSQL down** [v2] | No save/load             | Readiness check fails | Reconnect with exponential backoff; frontend works offline via localStorage |
| **S3/MinIO down** [v2]   | No photo upload/download | Upload API errors     | Show "upload temporarily unavailable", resume works without photo           |
| **PDF generation fails** | User can't download      | Error counter spikes  | Return error to user with "try again"; log root cause                       |
| **Out of memory**        | Server OOM killed        | Docker OOM events     | Set memory limits; queue PDF generation to bound concurrency                |
| **Slow PDF generation**  | User waits too long      | Latency spike         | Timeout after 30s; show error; investigate backlog                          |

---

## Concurrency Control

PDF generation is the heaviest operation. We must bound concurrency:

- **Worker pool**: Limit concurrent PDF generations (e.g., max 10)
- **Queue**: If pool is full, queue requests (max queue size: 50)
- **Timeout**: PDF generation times out after 30 seconds
- **Backpressure**: If queue is full, return 503 Service Unavailable

---

## Backup Strategy

### Database

- **Local dev**: Not needed (docker volume, recreatable)
- **Production**: Daily automated backups, 30-day retention
- **Point-in-time recovery**: PostgreSQL WAL archiving (if on managed DB)

### User Uploads (S3)

- **Production**: S3 versioning enabled, lifecycle policy for old versions
- **Local dev**: MinIO data in docker volume

---

## Incident Response

### Severity Levels

| Level  | Definition                       | Response Time     | Example                              |
| ------ | -------------------------------- | ----------------- | ------------------------------------ |
| **S1** | Service down, all users affected | Immediate         | Server won't start, DB corrupted     |
| **S2** | Major feature broken             | <1 hour           | PDF generation failing for all users |
| **S3** | Minor feature broken             | <4 hours          | Photo upload not working             |
| **S4** | Cosmetic / minor                 | Next business day | Preview font slightly off            |

### Response Process

1. **Detect** — Monitor alerts or user reports
2. **Assess** — Determine severity and impact
3. **Mitigate** — Apply quick fix or rollback
4. **Resolve** — Root cause fix and deploy
5. **Review** — Post-incident note in `docs/exec-plans/completed/`
