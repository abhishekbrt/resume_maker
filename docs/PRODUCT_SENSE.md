# PRODUCT_SENSE.md — Product Thinking & Decision Framework

> How we make product decisions for Resume Maker.

---

## Who Are We Building For?

### Primary Users

1. **Job-seeking developers / engineers** — Want a clean, professional resume without design hassle
2. **Recent graduates** — Need a structured template for their first resume
3. **Career changers** — Updating resumes regularly as they apply to new roles

### What They Care About

| Priority | What                  | Why                                                    |
| -------- | --------------------- | ------------------------------------------------------ |
| 1        | **ATS compatibility** | Beautiful resume is useless if it gets filtered out    |
| 2        | **Speed**             | They want to create and download in minutes, not hours |
| 3        | **Professional look** | Must look polished without design skills               |
| 4        | **Easy editing**      | Come back and update without starting over             |
| 5        | **Free to use**       | Budget-conscious job seekers won't pay $20/month       |

### What They DON'T Care About

- Fancy animations in the editor
- 50 template options (3-5 good ones is plenty)
- Social features (sharing, collaboration)
- Complex customization (custom CSS, layout editors)

---

## Product Principles

### 1. Less Is More

Every feature we add is complexity the user must navigate. Default to saying "no" unless a feature directly helps users create better resumes faster.

### 2. Defaults Over Options

Choose sensible defaults (font, margins, section order) that work for 90% of users. Advanced options exist but don't clutter the main flow.

### 3. Free Core, Premium Extras

- **Free forever**: Single template, PDF download, basic sections
- **Premium (future)**: Multiple templates, AI suggestions, ATS scoring, cloud storage

### 4. Fast Beats Feature-Rich

A fast, simple tool that does one thing well beats a slow, complex tool with many features.

---

## Decision Log

> Record key product decisions here with rationale.

| Date       | Decision               | Phase | Rationale                                                                              | Alternatives Considered                 |
| ---------- | ---------------------- | ----- | -------------------------------------------------------------------------------------- | --------------------------------------- |
| 2026-02-17 | Single template for v1 | v1    | Focus on quality over quantity; one perfect template is better than five mediocre ones | Multiple templates from day one         |
| 2026-02-17 | Go backend for PDF gen | v1    | 60-80% cost savings, faster PDF generation, better concurrency                         | Node.js + Puppeteer                     |
| 2026-02-17 | Chi router             | v1    | Idiomatic, stdlib-compatible middleware, lightweight, mature ecosystem                 | Fiber (fast but non-stdlib net/http)    |
| 2026-02-17 | go-pdf/fpdf for PDF    | v1    | Full layout control, no external deps, fast (~50-200ms), lightweight                   | maroto (less control), chromedp (heavy) |
| 2026-02-17 | No auth for MVP        | v1    | Reduce friction; let users download without signup barrier                             | Require signup first                    |
| 2026-02-17 | localStorage for v1    | v1    | Simplest persistence, no backend needed for saving                                     | Server-side storage from day one        |

---

## Feature Prioritization Framework

When evaluating new features, score on:

| Criterion               | Weight | Question                                                        |
| ----------------------- | ------ | --------------------------------------------------------------- |
| **User Impact**         | 40%    | How many users benefit? How much does it improve their outcome? |
| **ATS Compatibility**   | 25%    | Does it help or hurt the resume's machine-readability?          |
| **Implementation Cost** | 20%    | How long to build and maintain?                                 |
| **Differentiation**     | 15%    | Does it set us apart from competitors?                          |

### Quick Scoring Example

```
Feature: AI Bullet Point Suggestions
- User Impact: 9/10 (most users struggle with bullet points)
- ATS Compatibility: 7/10 (AI can generate keyword-rich content)
- Implementation Cost: 4/10 (requires OpenAI API, prompt engineering)
- Differentiation: 8/10 (many free tools don't have this)
- Weighted Score: 0.4(9) + 0.25(7) + 0.2(4) + 0.15(8) = 7.35 → BUILD
```

---

## Competitive Landscape

| Competitor                | Strengths                            | Weaknesses                                       | Our Advantage                    |
| ------------------------- | ------------------------------------ | ------------------------------------------------ | -------------------------------- |
| **Canva Resume**          | Beautiful designs, brand recognition | Slow, heavy, many templates are not ATS-friendly | ATS-first, fast, lightweight     |
| **Resume.io**             | Polished UX, good templates          | Paywall on PDF download                          | Free PDF downloads               |
| **Overleaf/LaTeX**        | Perfect typography                   | Steep learning curve                             | No-code, form-based              |
| **Google Docs templates** | Free, accessible                     | Limited formatting, ugly output                  | Professional template, better UX |
| **ChatGPT**               | Good content generation              | No visual output, needs manual formatting        | End-to-end with preview + PDF    |
