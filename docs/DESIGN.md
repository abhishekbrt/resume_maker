# DESIGN.md — Design System & UI Guidelines

> Visual design principles, patterns, and guidelines for the Resume Maker application UI.

---

## Design Philosophy

1. **Content-first**: The resume preview is the hero — UI stays out of the way
2. **Professional aesthetic**: Clean, minimal, trustworthy — matches the resume output tone
3. **Instant feedback**: Every user action has immediate visual response
4. **Accessibility**: WCAG 2.1 AA compliance — proper contrast, keyboard navigation, screen reader support

---

## Layout Architecture

### Editor Page (Primary View)

```
┌──────────────────────────────────────────────────────────────┐
│  Navbar (fixed top)                              [Download]  │
├────────────────────────────┬─────────────────────────────────┤
│                            │                                 │
│   Form Editor Panel        │     Resume Preview Panel        │
│   (scrollable, 40% width)  │     (sticky, 60% width)        │
│                            │                                 │
│   ┌──────────────────┐     │     ┌───────────────────────┐   │
│   │ Personal Info ▼  │     │     │                       │   │
│   ├──────────────────┤     │     │   Live HTML Preview   │   │
│   │ Summary ▶        │     │     │   (scaled to fit)     │   │
│   ├──────────────────┤     │     │                       │   │
│   │ Experience ▶     │     │     │                       │   │
│   ├──────────────────┤     │     │                       │   │
│   │ Education ▶      │     │     └───────────────────────┘   │
│   ├──────────────────┤     │                                 │
│   │ Skills ▶         │     │     [Zoom: -  100%  +]          │
│   └──────────────────┘     │                                 │
│   [+ Add Section]          │                                 │
│                            │                                 │
│   Settings ─────────       │                                 │
│   Font: [Dropdown]         │                                 │
│   Photo: [Toggle]          │                                 │
│                            │                                 │
└────────────────────────────┴─────────────────────────────────┘
```

### Key UI Decisions

- **Split-pane layout**: Form left, preview right — standard pattern for document editors
- **Preview scales to fit**: Uses CSS `transform: scale()` to fit A4 page in available space
- **Accordion sections**: Only one expanded at a time to reduce cognitive load
- **Sticky preview**: Doesn't scroll with the form — always visible
- **Settings at bottom**: Not primary interaction, kept accessible but not prominent

---

## Component Design Specifications

### Section Accordion

- Collapsed: 48px height, section name + item count badge + chevron
- Expanded: Full form with fields, add/remove buttons
- Transition: height 200ms ease-out
- Drag handle (left side) for reordering when multiple sections exist

### Form Fields

- Label above input (not floating — better accessibility)
- Placeholder text shows example content (e.g., "Google" for company name)
- Validation: inline error messages below field, red border
- Date fields: month/year picker (not full date)

### Experience/Education Entry

- Card-style container with subtle border
- Drag handle for reordering entries
- Delete button (trash icon) top-right, with confirmation
- "Add bullet point" button within each entry

### Profile Photo Upload

- Click to upload or drag-and-drop zone
- Client-side crop dialog (circular mask)
- Preview thumbnail in form
- Remove button

### Download Button

- Primary CTA in navbar (always visible)
- States: Default → Loading (spinner) → Success (checkmark, 2s) → Default
- Disabled state when form has validation errors

---

## Resume Preview Rendering

The preview panel renders the resume as HTML/CSS, matching the PDF output as closely as possible:

- **Container**: White background, A4 aspect ratio, drop shadow
- **Scale**: CSS `transform: scale(X)` to fit the panel width
- **Page breaks**: Visual indicator showing where page 2 would start
- **Fonts**: Load the same fonts used in PDF generation (Times, Garamond, etc.)
- **Updates**: React re-render on state change, debounced 300ms from form input

---

## Dark Mode Considerations

v1 ships with light mode only. If dark mode is added later:

- Editor panel: dark background, light text
- Preview panel: **always white** (it's a document preview)
- Toggle in navbar or system preference detection

---

## Responsive Behavior

| Breakpoint | Layout Change                                        |
| ---------- | ---------------------------------------------------- |
| ≥1024px    | Side-by-side (form + preview)                        |
| 768-1023px | Stacked vertically (form above, preview below)       |
| <768px     | Form only, with "Preview" tab/toggle to switch views |

---

## Icon System

Use a consistent icon library (recommendation: Lucide React):

- Form sections: `User`, `Briefcase`, `GraduationCap`, `Wrench`
- Actions: `Plus`, `Trash2`, `GripVertical`, `Download`, `Eye`
- Navigation: `ChevronDown`, `ChevronRight`, `Menu`, `X`
