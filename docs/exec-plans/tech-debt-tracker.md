# Tech Debt Tracker

> Track known technical debt, shortcuts, and areas that need improvement.

---

## Format

Each entry follows this structure:

```
### [TD-XXX] Short Title
- **Severity**: 🔴 High / 🟡 Medium / 🟢 Low
- **Area**: Backend / Frontend / Infrastructure / Docs
- **Introduced**: Date or PR
- **Description**: What the debt is
- **Impact**: What happens if we don't fix it
- **Proposed Fix**: How to address it
- **Estimated Effort**: Hours / Days
```

---

## Active Debt

_No technical debt tracked yet — project is in initial planning phase._

---

## Resolved Debt

_None yet._

---

## Guidelines

### When to Log Tech Debt

- When you take a shortcut to ship faster (intentional debt)
- When you discover code that doesn't follow current standards (accidental debt)
- When a dependency is outdated or has known issues
- When error handling, logging, or tests are incomplete

### Severity Definitions

- 🔴 **High**: Affects users, security risk, or blocks feature development
- 🟡 **Medium**: Makes development slower or code harder to maintain
- 🟢 **Low**: Nice-to-have improvement, no immediate impact

### Review Cadence

- Review this tracker before each new feature sprint
- Aim to resolve at least one medium+ item per sprint
