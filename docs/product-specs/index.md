# Product Specifications — Index

> Central index for product specifications. Each spec describes a user-facing feature or flow.

---

## Specs

| Spec                                            | Status     | Description                                                             |
| ----------------------------------------------- | ---------- | ----------------------------------------------------------------------- |
| [New User Onboarding](./new-user-onboarding.md) | ✅ Written | First-time user flow from landing page to first PDF download            |
| Resume Editor UX                                | 📋 Planned | Detailed spec for the form editor, section management, and live preview |
| Template System                                 | 📋 Planned | How users select, preview, and apply templates                          |
| PDF Download Flow                               | 📋 Planned | End-to-end flow from "Download" click to file saved                     |
| Profile Photo Upload                            | 📋 Planned | Image upload, crop, and placement in resume                             |
| Dashboard & Resume Management                   | 📋 Planned | Saving, listing, duplicating, and deleting resumes                      |

---

## How to Write a Product Spec

### Who Writes Them?

Anyone can propose a spec. The spec should be reviewed before implementation begins.

### What Goes in a Spec?

1. **User Story** — As a [user], I want to [action], so that [benefit]
2. **Current Experience** — What happens today (or "nothing, this is new")
3. **Proposed Experience** — Step-by-step flow with UI descriptions
4. **Edge Cases** — What happens when things go wrong?
5. **Success Metrics** — How do we measure if this works?
6. **Out of Scope** — What are we explicitly NOT building?
7. **Open Questions** — Unresolved decisions

### Naming Convention

- Use lowercase with hyphens: `profile-photo-upload.md`
- Keep specs focused — one feature per file
