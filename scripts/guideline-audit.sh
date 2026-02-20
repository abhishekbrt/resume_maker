#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

warn_count=0

warn() {
  warn_count=$((warn_count + 1))
  echo "::warning title=Guideline Audit::$1"
}

info() {
  echo "[guideline-audit] $1"
}

resolve_base() {
  if [[ -n "${GITHUB_BASE_REF:-}" ]] && git rev-parse --verify "origin/${GITHUB_BASE_REF}" >/dev/null 2>&1; then
    git merge-base HEAD "origin/${GITHUB_BASE_REF}"
    return
  fi

  if git rev-parse --verify HEAD~1 >/dev/null 2>&1; then
    echo "HEAD~1"
    return
  fi

  echo ""
}

BASE_REF="$(resolve_base)"

if [[ -n "$BASE_REF" ]]; then
  mapfile -t changed_files < <(git diff --name-only "$BASE_REF"...HEAD)
  info "Comparing against base: $BASE_REF"
else
  mapfile -t changed_files < <(git ls-files)
  info "No base ref found; auditing all tracked files"
fi

if [[ "${#changed_files[@]}" -eq 0 ]]; then
  info "No changed files detected"
  exit 0
fi

if [[ "${#changed_files[@]}" -gt 20 ]]; then
  warn "Large change surface detected (${#changed_files[@]} files). Consider splitting into smaller PRs."
fi

text_files=()
frontend_src_changed=0
backend_src_changed=0
frontend_test_changed=0
backend_test_changed=0

for file in "${changed_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    continue
  fi

  text_files+=("$file")

  if [[ "$file" == frontend/src/* ]]; then
    frontend_src_changed=1
    if [[ "$file" == *.test.ts || "$file" == *.test.tsx ]]; then
      frontend_test_changed=1
    fi
  fi

  if [[ "$file" == backend/internal/* ]]; then
    backend_src_changed=1
    if [[ "$file" == *_test.go ]]; then
      backend_test_changed=1
    fi
  fi

  line_count=$(wc -l < "$file" | tr -d ' ')
  if [[ "$line_count" -gt 700 ]]; then
    warn "Touched large file ($file, ${line_count} lines). Consider extracting focused units."
  fi

done

if [[ "${#text_files[@]}" -gt 0 ]]; then
  if rg -n "TODO|FIXME|HACK|XXX" "${text_files[@]}" >/dev/null 2>&1; then
    warn "TODO/FIXME/HACK markers found in changed files. Confirm they are intentional."
  fi

  ts_files=()
  for file in "${text_files[@]}"; do
    if [[ "$file" == *.ts || "$file" == *.tsx ]]; then
      ts_files+=("$file")
    fi
  done

  if [[ "${#ts_files[@]}" -gt 0 ]] && rg -n "\bany\b" "${ts_files[@]}" >/dev/null 2>&1; then
    warn "TypeScript 'any' detected in changed files. Verify it is necessary."
  fi
fi

if [[ "$frontend_src_changed" -eq 1 && "$frontend_test_changed" -eq 0 ]]; then
  warn "Frontend source changed without frontend tests in the same change set."
fi

if [[ "$backend_src_changed" -eq 1 && "$backend_test_changed" -eq 0 ]]; then
  warn "Backend source changed without backend tests in the same change set."
fi

if [[ "$warn_count" -eq 0 ]]; then
  info "No advisory warnings."
else
  info "Completed with ${warn_count} advisory warning(s)."
fi

# Advisory mode: never fail the job in phase 1.
exit 0
