# New User Onboarding — Product Spec

> How a first-time user goes from discovering the site to downloading their first resume PDF.

---

## User Story

**As a** first-time visitor,
**I want to** quickly create a professional resume,
**so that** I can apply for jobs without spending hours manually formatting a document.

---

## Proposed Experience

### Step 1: Landing Page

User arrives at the homepage. They see:

- A compelling headline (e.g., "Build Your Professional Resume in Minutes")
- A preview of the resume template
- A clear CTA button: **"Create Your Resume →"**
- No signup required to start (reduces friction)

### Step 2: Editor Page

Clicking the CTA takes them to `/editor`. The page has two panels:

```
┌─────────────────────────┬───────────────────────────┐
│                         │                           │
│     Form Editor         │     Live Preview          │
│     (scrollable)        │     (fixed/sticky)        │
│                         │                           │
│  [Personal Info]        │   ┌───────────────────┐   │
│  [Summary]              │   │                   │   │
│  [Experience]           │   │   Resume Preview  │   │
│  [Education]            │   │   (HTML render)   │   │
│  [Skills & Other]       │   │                   │   │
│                         │   └───────────────────┘   │
│  [+ Add Section]        │                           │
│                         │   [Download PDF] button   │
└─────────────────────────┴───────────────────────────┘
```

- Each section is a collapsible accordion
- Personal Info is expanded by default
- The form has placeholder/example text to guide the user
- Live preview updates as the user types (debounced, ~300ms delay)

### Step 3: Filling In Data

User fills in sections top to bottom:

1. **Personal Info**: Name, location, phone, email, LinkedIn (optional)
   - Option to upload profile photo (toggle: "Add Photo")
2. **Summary**: Free-text paragraph
3. **Experience**: Add entries with company, role, dates, bullet points
   - "Add another position" button
   - Each entry has a delete button
4. **Education**: Add entries with university, degree, date, optional bullets
5. **Skills & Other**: Key-value pairs (Skills, Volunteering, Projects, etc.)
   - "Add another item" button

### Step 4: Optional Configuration

Below or above the form, a small settings bar:

- **Font**: Dropdown (Times New Roman, Garamond, Calibri)
- **Photo**: Toggle on/off
- **Section order**: Drag handles to reorder sections (stretch goal)

### Step 5: Download

User clicks **"Download PDF"**:

- Button shows a loading spinner
- Backend generates PDF (target: < 2 seconds)
- Browser auto-downloads the file as `FirstName_LastName_Resume.pdf`
- Success toast: "Your resume has been downloaded!"

### Step 6: Save (Optional)

After download, a prompt appears:

- "Want to save your resume for later? Create a free account."
- If they sign up, the resume is saved to their account
- If they skip, data remains in localStorage for 7 days

---

## Edge Cases

| Scenario                                         | Behavior                                                             |
| ------------------------------------------------ | -------------------------------------------------------------------- |
| User leaves all fields empty and clicks Download | Show validation: "Please fill in at least your name and one section" |
| User has very long content (overflows 1 page)    | PDF generates 2+ pages with proper page breaks                       |
| User uploads a very large image (>5MB)           | Client-side validation: "Image must be under 5MB"                    |
| User uploads non-image file                      | Client-side validation: "Please upload a JPG or PNG image"           |
| PDF generation fails                             | Show error toast with "Try Again" button, log error server-side      |
| User refreshes the page                          | Form data persists via localStorage                                  |
| Slow connection during PDF download              | Show progress indicator, timeout after 30 seconds                    |

---

## Success Metrics

1. **Time to first PDF** — Target: under 5 minutes from landing to download
2. **Completion rate** — % of users who start the editor and successfully download a PDF
3. **Bounce rate** — % of users who leave the editor without filling anything
4. **Signup conversion** — % of downloaders who create an account

---

## Out of Scope (v1)

- Multiple resume templates (v1 has one template only)
- AI-powered content suggestions
- DOCX export
- Resume sharing via link
- Team/organization accounts
- Resume analytics (view tracking)

---

## Open Questions

1. Should we require signup before download, or allow anonymous downloads?
   - **Recommendation**: Allow anonymous download — reduces friction, increases adoption
2. Should the live preview be pixel-perfect with the PDF, or an approximation?
   - **Recommendation**: Close approximation — pixel-perfect requires server-round-trip for every change
3. Mobile experience — should the editor work on mobile?
   - **Recommendation**: v1 desktop-only, with a "best on desktop" notice on mobile
