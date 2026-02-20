# Karpathy Guidelines for Resume Maker

This document defines how we apply Karpathy-style coding discipline in this repo.

## 1. Think Before Coding

Before implementing, write down:
- assumptions
- scope boundaries
- tradeoffs
- success criteria

If a requirement is ambiguous and cannot be discovered from code/docs, ask first.

## 2. Simplicity First

Use the minimum code needed to solve the requested problem.

Rules:
- no speculative features
- no abstractions for hypothetical future use
- no optional knobs unless requested
- no broad refactors when a surgical fix works

Repo examples:
- Adding a new resume field should update only types, reducer, form, preview/PDF, and tests.
- Fixing PDF layout should not also redesign unrelated sections.

## 3. Surgical Changes

Touch only files directly related to the task.

Rules:
- do not reformat or refactor unrelated code
- match existing style in touched files
- remove only dead code introduced by your own changes

## 4. Goal-Driven Execution

Define verifiable goals before coding.

Template:
1. Step: [what changes] -> verify: [test/check]
2. Step: [what changes] -> verify: [test/check]
3. Step: [what changes] -> verify: [test/check]

Examples:
- Validation change -> add failing test, then make it pass.
- Rendering bug fix -> reproduce with a test payload, then verify output.

## Pull Request Checklist

Each PR should include:
- assumptions and constraints
- exact scope (what is in/out)
- success criteria
- verification evidence (tests/lint/build/manual checks)
- note of any known follow-up work

## Enforcement (Current)

Current mode is advisory:
- automated guideline audit reports warnings
- warnings do not block merges in phase 1

This can be promoted to blocking once warning volume is low and stable.
