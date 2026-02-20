# Design Documents — Index

> Central index for all design documents in the Resume Maker project.

---

## Active Design Docs

| Document                          | Status     | Description                                           |
| --------------------------------- | ---------- | ----------------------------------------------------- |
| [Core Beliefs](./core-beliefs.md) | ✅ Active  | Engineering principles and product philosophy         |
| PDF Generation Strategy           | 📋 Planned | Comparison of Go PDF libraries and rendering approach |
| Template System Design            | 📋 Planned | How templates are structured, stored, and rendered    |
| Resume Data Schema                | 📋 Planned | JSON schema for resume data, validation rules         |

---

## How to Use This Directory

### When to Write a Design Doc

- Before building any new feature or module
- When making a significant architectural decision
- When changing an existing pattern or convention
- When there are multiple approaches and a decision needs to be recorded

### Design Doc Template

Every design doc should include:

1. **Problem Statement** — What problem are we solving?
2. **Context** — What's the current state? Why now?
3. **Proposed Solution** — What do we want to build?
4. **Alternatives Considered** — What else did we evaluate?
5. **Decision** — What did we choose and why?
6. **Trade-offs** — What are we giving up?
7. **Implementation Notes** — Key technical details for whoever builds this

### Naming Convention

- Use lowercase with hyphens: `pdf-generation-strategy.md`
- Prefix with status emoji in the index table:
  - ✅ Active — Currently in effect
  - 📋 Planned — Not yet written
  - 🔄 In Review — Written, awaiting approval
  - ❌ Deprecated — No longer applies
