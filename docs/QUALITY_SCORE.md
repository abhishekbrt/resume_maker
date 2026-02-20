# QUALITY_SCORE.md — Quality Standards & Metrics

> Defines quality standards, scoring rubrics, and acceptance criteria for the Resume Maker project.

---

## Quality Dimensions

### 1. PDF Output Quality (Weight: 35%)

| Criterion           | Score 1 (Poor)                      | Score 3 (Acceptable)                    | Score 5 (Excellent)                         |
| ------------------- | ----------------------------------- | --------------------------------------- | ------------------------------------------- |
| **Layout accuracy** | Misaligned elements, broken spacing | Mostly aligned, minor inconsistencies   | Pixel-perfect match to reference template   |
| **Font rendering**  | Wrong fonts, encoding issues        | Correct fonts, minor kerning issues     | Crisp, professional typography              |
| **Text extraction** | ATS cannot parse text               | Partial text extraction                 | Full text extraction with correct structure |
| **Pagination**      | Content cut off, orphaned headers   | Page breaks work, minor awkwardness     | Smart page breaks, no widows/orphans        |
| **Image embedding** | Photo broken, wrong position        | Photo appears, minor positioning issues | Photo perfectly placed, correctly cropped   |

**Target**: Average ≥ 4.0 across all criteria

---

### 2. User Experience (Weight: 25%)

| Criterion             | Score 1                   | Score 3                          | Score 5                              |
| --------------------- | ------------------------- | -------------------------------- | ------------------------------------ |
| **Time to first PDF** | >10 minutes               | 5-10 minutes                     | <5 minutes                           |
| **Form usability**    | Confusing, errors unclear | Functional, some friction        | Intuitive, clear guidance            |
| **Preview accuracy**  | Doesn't resemble PDF      | Roughly matches PDF              | Closely matches PDF output           |
| **Error handling**    | Crashes, no feedback      | Shows errors, unclear resolution | Clear messages with recovery actions |
| **Responsiveness**    | Broken on non-desktop     | Usable on tablet                 | Smooth on desktop + tablet           |

**Target**: Average ≥ 3.5 (improving to 4.0 by Phase 3)

---

### 3. Performance (Weight: 20%)

| Metric                  | Poor    | Acceptable | Excellent |
| ----------------------- | ------- | ---------- | --------- |
| **PDF generation time** | >5s     | 2-5s       | <2s       |
| **Live preview update** | >1s lag | 300ms-1s   | <300ms    |
| **Page load (editor)**  | >3s     | 1-3s       | <1s       |
| **API response (CRUD)** | >500ms  | 200-500ms  | <200ms    |
| **Memory (Go backend)** | >500MB  | 100-500MB  | <100MB    |

**Target**: All metrics in "Acceptable" or better

---

### 4. Code Quality (Weight: 10%)

| Criterion          | Measure                                                 |
| ------------------ | ------------------------------------------------------- |
| **Test coverage**  | >60% for backend, >40% for frontend                     |
| **Type safety**    | Zero `any` types in TypeScript (except justified cases) |
| **Error handling** | All errors wrapped with context, no silent failures     |
| **Documentation**  | All exported functions have doc comments                |
| **Linting**        | Zero lint warnings in CI                                |

---

### 5. Reliability (Weight: 10%)

| Criterion                       | Measure                                |
| ------------------------------- | -------------------------------------- |
| **PDF generation success rate** | >99.5%                                 |
| **API uptime**                  | >99.9%                                 |
| **Data integrity**              | Zero data loss incidents               |
| **Error recovery**              | Graceful degradation, no white screens |

---

## Quality Review Checklist

Before any feature is considered "done":

### Code Review

- [ ] Code follows project conventions (`AGENTS.md`)
- [ ] TypeScript has no type errors
- [ ] Go code passes `go vet` and `golangci-lint`
- [ ] Tests pass locally and in CI

### Functional Review

- [ ] Feature works as described in the product spec
- [ ] Edge cases from the spec are handled
- [ ] Error states are handled gracefully
- [ ] Form validation works correctly

### PDF Quality Review (for PDF-related changes)

- [ ] Generated PDF matches reference template
- [ ] Text is selectable and copy-pastable
- [ ] ATS parser can extract all fields correctly
- [ ] Multi-page content renders with proper page breaks
- [ ] Profile photo renders correctly (when present)

### PDF Quality Gate (CI)

PDF-related pull requests must pass the `pdf-quality` workflow.

Scope:
- `backend/internal/pdfgen/**`
- `backend/internal/service/**`
- `backend/internal/handlers/**`
- `frontend/src/lib/types.ts`

Gate checks:
- Fixture-driven PDF golden test (`TestPDFGoldenFixtures`)
- Renderer regression tests (fonts, links, photo)
- Handler integration tests for PDF generation paths

### Performance Review

- [ ] No noticeable UI lag during form interaction
- [ ] PDF generates in <2 seconds
- [ ] No memory leaks in long-running sessions

---

## Quality Score Calculation

```
Quality Score = (PDF Quality × 0.35)
             + (UX × 0.25)
             + (Performance × 0.20)
             + (Code Quality × 0.10)
             + (Reliability × 0.10)

Target: ≥ 3.5 at MVP, ≥ 4.0 at Phase 3
```
