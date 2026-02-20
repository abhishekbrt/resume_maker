# Execution Plans (ExecPlans)

This document describes the requirements for an execution plan ("ExecPlan"), a design document that a coding agent or developer can follow to deliver a working feature or system change for the Resume Maker project. Treat the reader as a complete beginner to this repository: they have only the current working tree and the single ExecPlan file you provide. There is no memory of prior plans and no external context.

ExecPlans live in `docs/exec-plans/active/` when in progress and are moved to `docs/exec-plans/completed/` when finished. This file (`docs/PLANS.md`) defines the format and rules — it is not itself a plan.

## How to Use ExecPlans

When authoring an ExecPlan, follow this document to the letter. If it is not in your context, refresh your memory by reading the entire `docs/PLANS.md` file before proceeding. Be thorough in reading and re-reading source material to produce an accurate specification.

When creating an ExecPlan, start from the skeleton at the bottom of this file and flesh it out as you do your research. Name the file descriptively using lowercase with hyphens (for example, `pdf-generation-engine.md`) and place it in `docs/exec-plans/active/`.

When implementing an ExecPlan, do not prompt the user for "next steps"; simply proceed to the next milestone. Keep all living-document sections up to date. Add or split entries in the Progress section at every stopping point to affirmatively state the progress made and next steps. Resolve ambiguities autonomously and commit frequently.

When discussing an ExecPlan, record decisions in the Decision Log section for posterity. It should be unambiguously clear why any change to the specification was made. ExecPlans are living documents, and it should always be possible to restart from only the ExecPlan and no other work.

When researching a design with challenging requirements or significant unknowns, use milestones to implement proof of concepts, "toy implementations", and spikes that allow validating whether a proposal is feasible. Read the source code of libraries by finding or acquiring them, research deeply, and include prototypes to guide a fuller implementation.

## Non-Negotiable Requirements

Every ExecPlan must be fully self-contained. Self-contained means that in its current form it contains all knowledge and instructions needed for a novice to succeed. A reader should never need to consult an external blog post, documentation site, or a separate plan that is not checked into the repository.

Every ExecPlan is a living document. Contributors are required to revise it as progress is made, as discoveries occur, and as design decisions are finalized. Each revision must remain fully self-contained.

Every ExecPlan must enable a complete novice to implement the feature end-to-end without prior knowledge of this repository. The Resume Maker project uses a Next.js frontend in `frontend/` and a Go backend in `backend/`. If the plan touches either of these, explain what the reader needs to know about that part of the codebase right there in the plan.

Every ExecPlan must produce a demonstrably working behavior, not merely code changes to "meet a definition." The result must be something a human can see, click, or run.

Every ExecPlan must define every term of art in plain language or not use it. For example, if you write "ATS-friendly," explain that ATS stands for Applicant Tracking System and that it means the PDF text must be machine-parseable so automated hiring software can read it. If you write "JSONB," explain that it is a PostgreSQL column type that stores structured JSON data and allows querying individual fields.

Purpose and intent come first. Begin by explaining, in a few sentences, why the work matters from a user's perspective: what someone can do after this change that they could not do before, and how to see it working. Then guide the reader through the exact steps to achieve that outcome, including what to edit, what to run, and what they should observe.

## Formatting

Write in plain prose. Prefer sentences over lists. Avoid checklists, tables, and long enumerations unless brevity would obscure meaning. Checklists are permitted only in the Progress section, where they are mandatory. Narrative sections must remain prose-first.

Use two newlines after every heading. Use standard Markdown heading levels (#, ##, ###) and correct syntax for ordered and unordered lists.

When you need to show commands, transcripts, diffs, or code, present them as indented blocks (four spaces of indentation). This avoids issues with nested code fences that can break parsing.

When writing an ExecPlan to a standalone Markdown file (which is the normal case), write plain Markdown without wrapping the entire document in a code fence.

## Guidelines

Self-containment and plain language are paramount. If you introduce a phrase that is not ordinary English, define it immediately and remind the reader how it manifests in this repository. For example, if you mention the "pdfgen module," explain that it lives at `backend/internal/pdfgen/` and is responsible for converting a resume data struct into PDF bytes. Do not say "as defined in ARCHITECTURE.md." Include the needed explanation in the plan itself, even if you repeat yourself.

Avoid common failure modes. Do not rely on undefined jargon. Do not describe a feature so narrowly that the resulting code compiles but does nothing meaningful. Do not outsource key decisions to the reader. When ambiguity exists, resolve it in the plan itself and explain why you chose that path. Err on the side of over-explaining user-visible effects and under-specifying incidental implementation details.

Anchor the plan with observable outcomes. State what the user can do after implementation, the commands to run, and the outputs they should see. Acceptance should be phrased as behavior a human can verify. For example, "after running `docker-compose up` and opening `http://localhost:3000/editor`, typing a name in the Personal Info section causes the preview panel on the right to update within half a second" rather than "add a ResumePreview component." If a change is internal, explain how its impact can still be demonstrated, for example by running tests that fail before and pass after.

Specify repository context explicitly. Name files with full repository-relative paths (for example, `backend/internal/pdfgen/renderer.go`), name functions and modules precisely, and describe where new files should be created. If the plan touches both frontend and backend, include a short orientation paragraph that explains how those parts fit together so a novice can navigate confidently.

When running commands, show the working directory and exact command line. For the Resume Maker project, the typical patterns are:

    Working directory: resume_maker/frontend
    Command: npm run dev

    Working directory: resume_maker/backend
    Command: go run cmd/server/main.go

When outcomes depend on environment, state the assumptions and provide alternatives when reasonable.

Be idempotent and safe. Write the steps so they can be run multiple times without causing damage or drift. If a step can fail halfway, include how to retry or adapt. If a migration or destructive operation is necessary, spell out backups or safe fallbacks. Prefer additive, testable changes that can be validated as you go.

Validation is not optional. Include instructions to run tests, to start the system if applicable, and to observe it doing something useful. Describe comprehensive testing for any new features or capabilities. Include expected outputs and error messages so a novice can tell success from failure. State the exact test commands and how to interpret their results. For this project, the typical test commands are:

    Working directory: resume_maker/backend
    Command: go test ./...
    Expected: all tests pass with no failures

    Working directory: resume_maker/frontend
    Command: npm test
    Expected: all test suites pass

Capture evidence. When steps produce terminal output, short diffs, or logs, include them as indented examples. Keep them concise and focused on what proves success.

## Milestones

Milestones are narrative, not bureaucracy. If you break the work into milestones, introduce each with a brief paragraph that describes the scope, what will exist at the end of the milestone that did not exist before, the commands to run, and the acceptance you expect to observe. Keep it readable as a story: goal, work, result, proof.

Progress and milestones are distinct. Milestones tell the story of what will be built. Progress tracks the granular current state of the work. Both must exist in every ExecPlan.

Never abbreviate a milestone merely for the sake of brevity. Do not leave out details that could be crucial to a future implementation. Each milestone must be independently verifiable and incrementally implement the overall goal of the execution plan.

## Prototyping and Spikes

It is acceptable and often encouraged to include explicit prototyping milestones when they de-risk a larger change. Examples include building a standalone Go program that generates a simple PDF to validate the `go-pdf/fpdf` library before integrating it into the full backend, or creating a minimal React component that renders HTML matching the PDF layout before wiring it to the full form state.

Keep prototypes additive and testable. Clearly label the scope as "prototyping." Describe how to run and observe results. State the criteria for promoting or discarding the prototype.

When working with multiple new libraries or feature areas, consider creating spikes that evaluate the feasibility of these features independently of one another, proving that each external library performs as expected in isolation before combining them.

## Living Document Sections

Every ExecPlan must contain and maintain these four sections. They are not optional.

The Progress section uses checkboxes to track granular steps. Every stopping point must be documented, even if it requires splitting a partially completed task into two entries ("done so far" and "remaining"). This section must always reflect the actual current state of the work. Use timestamps to measure the rate of progress.

The Surprises and Discoveries section captures unexpected behaviors, bugs, performance tradeoffs, or insights discovered during implementation. Provide concise evidence, ideally test output or command transcripts.

The Decision Log records every significant decision made while working on the plan. Each entry includes the decision, the rationale, and the date. If you change course mid-implementation, document why here and reflect the implications in Progress.

The Outcomes and Retrospective section summarizes what was achieved, what remains, and lessons learned. Write this at completion of each major milestone and at the end of the full plan. Compare the result against the original purpose.

## Skeleton of a Good ExecPlan

Below is the template to copy when starting a new ExecPlan. Save it to `docs/exec-plans/active/<descriptive-name>.md`.

---

    # <Short, action-oriented description>

    This ExecPlan is a living document. The sections Progress, Surprises & Discoveries, Decision Log,
    and Outcomes & Retrospective must be kept up to date as work proceeds. This document must be
    maintained in accordance with docs/PLANS.md.


    ## Purpose / Big Picture

    Explain in a few sentences what someone gains after this change and how they can see it working.
    State the user-visible behavior you will enable.


    ## Context and Orientation

    Describe the current state relevant to this task as if the reader knows nothing. Name the key
    files and modules by full repository-relative path. Define any non-obvious term you will use.
    Do not refer to prior plans or external documents — include any necessary context here.


    ## Plan of Work

    Describe, in prose, the sequence of edits and additions. For each edit, name the file and
    location (function, module) and what to insert or change. Keep it concrete and minimal.

    If the work is large, break it into milestones. Introduce each milestone with a paragraph that
    describes the scope, what will exist at the end, the commands to run, and the acceptance criteria.


    ## Interfaces and Dependencies

    Name the libraries, modules, and services to use and why. Specify the types, interfaces, and
    function signatures that must exist at the end of each milestone. Use full paths.


    ## Concrete Steps

    State the exact commands to run and where to run them (working directory). When a command
    generates output, show a short expected transcript so the reader can compare. This section
    must be updated as work proceeds.


    ## Validation and Acceptance

    Describe how to start or exercise the system and what to observe. Phrase acceptance as behavior,
    with specific inputs and outputs. If tests are involved, specify the command to run and the
    expected outcome.


    ## Idempotence and Recovery

    If steps can be repeated safely, say so. If a step is risky, provide a safe retry or rollback
    path. Keep the environment clean after completion.


    ## Progress

    - [ ] Example incomplete step.


    ## Surprises & Discoveries

    _None yet._


    ## Decision Log

    _No decisions recorded yet._


    ## Outcomes & Retrospective

    _Plan not yet started._


    ## Revision Notes

    When you revise this plan, add a dated note here describing the change and the reason why.

---

## Closing Principle

If you follow the guidance above, a single, stateless agent — or a human novice — can read your ExecPlan from top to bottom and produce a working, observable result. That is the bar: self-contained, self-sufficient, novice-guiding, outcome-focused.

When you revise a plan, you must ensure your changes are comprehensively reflected across all sections, including the living document sections. ExecPlans must describe not just the what but the why for almost everything.
