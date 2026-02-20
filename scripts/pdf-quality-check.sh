#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR/backend"

echo "[pdf-quality] Running renderer regression tests"
go test ./internal/pdfgen/... -count=1

echo "[pdf-quality] Running handler integration tests"
go test ./internal/handlers/... -count=1
