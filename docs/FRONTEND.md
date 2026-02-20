# FRONTEND.md — Frontend Architecture & Conventions

> Technical documentation for the Next.js frontend application.

---

## Stack

| Technology   | Version  | Purpose                  |
| ------------ | -------- | ------------------------ |
| Next.js      | 14+      | Framework (App Router)   |
| React        | 18+      | UI library               |
| TypeScript   | 5+       | Type safety              |
| CSS Modules  | built-in | Component scoped styling |
| Lucide React | latest   | Icon library             |

---

## Project Structure

```
frontend/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Landing page
│   │   ├── globals.css          # Global styles + CSS variables
│   │   ├── editor/
│   │   │   └── page.tsx         # Editor page
│   │   ├── login/               # [v2]
│   │   │   └── page.tsx
│   │   ├── signup/              # [v2]
│   │   │   └── page.tsx
│   │   └── dashboard/           # [v2]
│   │       └── page.tsx
│   ├── components/              # UI components
│   │   ├── editor/              # Form editor components
│   │   ├── preview/             # Resume preview components
│   │   ├── common/              # Shared components (Button, Input, etc.)
│   │   ├── layout/              # Navbar, Footer
│   │   └── photo/               # Photo upload/crop
│   ├── hooks/                   # Custom React hooks
│   │   ├── useResumeState.ts    # Resume state management hook
│   │   ├── useDebounce.ts       # Debounce utility hook
│   │   ├── useLocalStorage.ts   # localStorage persistence hook
│   │   └── useAutoSave.ts       # Auto-save hook
│   ├── lib/                     # Utilities
│   │   ├── api.ts               # API client
│   │   ├── types.ts             # TypeScript types/interfaces
│   │   ├── constants.ts         # App constants
│   │   ├── validation.ts        # Form validation rules
│   │   └── resume-context.tsx   # React Context + Reducer
│   └── styles/                  # Additional styles
│       ├── variables.css        # CSS custom properties
│       ├── editor.module.css
│       └── preview.module.css
├── public/
│   ├── fonts/                   # Custom fonts for preview
│   └── images/                  # Static images
├── next.config.js
├── tsconfig.json
└── package.json
```

---

## Key Architectural Decisions

### 1. Server vs Client Components

| Component          | Type   | Phase | Reason                      |
| ------------------ | ------ | ----- | --------------------------- |
| Landing page       | Server | v1    | Static content, SEO         |
| Navbar             | Client | v1    | Interactive (auth state v2) |
| Editor page        | Client | v1    | Heavy interactivity         |
| Resume form        | Client | v1    | Forms, state, events        |
| Resume preview     | Client | v1    | Real-time rendering         |
| Login/Signup forms | Client | v2    | Forms, API calls            |
| Dashboard          | Client | v2    | Data fetching, interactions |

### 2. State Management

**Choice**: React Context + `useReducer` (not Redux/Zustand)

**Rationale**:

- Resume state is a single concern — one context is sufficient
- `useReducer` provides predictable state transitions
- No need for global state library overhead
- If performance becomes an issue, split into multiple contexts

### 3. Styling

**Choice**: CSS Modules + CSS Custom Properties

**Rationale**:

- CSS Modules give component scoping without runtime cost
- CSS Custom Properties enable theming (fonts, colors) without JS
- No build tool dependency (Tailwind) — just standard CSS
- Full control over animations and responsive behavior

### 4. Form Handling

**Choice**: Custom form handling (not React Hook Form or Formik)

**Rationale**:

- Our forms are unique (resume sections with add/remove/reorder)
- Libraries add complexity for our non-standard form patterns
- Direct control over validation timing and error display
- Could reconsider if form complexity grows significantly

---

## Data Flow

```
┌─────────────┐     dispatch()     ┌──────────────────┐
│  Form Input  │ ───────────────→  │  Resume Reducer   │
└─────────────┘                    └────────┬─────────┘
                                            │ new state
                                   ┌────────▼─────────┐
                                   │  Resume Context   │
                                   └────┬────────┬────┘
                                        │        │
                               ┌────────▼──┐ ┌───▼──────────┐
                               │  Preview   │ │  localStorage │
                               │  Component │ │  (auto-save)  │
                               └────────────┘ └──────────────┘
```

---

## Performance Guidelines

1. **Debounce preview updates**: 300ms after last keystroke
2. **Memoize preview components**: Use `React.memo` for section components
3. **Lazy load non-critical components**: Photo upload modal, settings panel
4. **Font loading**: `next/font` for UI fonts, CSS `@font-face` with `display: swap` for resume fonts
5. **Image optimization**: Next.js `<Image>` for static assets, client-side resize for uploads

---

## Testing Strategy

| Test Type | Tool                   | What to Test                                               |
| --------- | ---------------------- | ---------------------------------------------------------- |
| Unit      | Jest                   | Reducer logic, validation functions, utility functions     |
| Component | React Testing Library  | Form interactions, preview rendering, button states        |
| E2E       | Playwright             | Full user flow: fill form → preview updates → download PDF |
| Visual    | Playwright screenshots | Preview matches expected output                            |

---

## Environment Variables

| Variable                     | Required | Description                              |
| ---------------------------- | -------- | ---------------------------------------- |
| `NEXT_PUBLIC_API_URL`        | Yes      | Go backend URL                           |
| `NEXT_PUBLIC_APP_NAME`       | No       | App display name (default: Resume Maker) |
| `NEXT_PUBLIC_MAX_PHOTO_SIZE` | No       | Max upload size in bytes (default: 5MB)  |
