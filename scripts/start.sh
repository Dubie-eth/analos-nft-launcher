#!/usr/bin/env bash
set -Eeuo pipefail

# Environment defaults
export NODE_ENV="${NODE_ENV:-production}"
export NEXT_TELEMETRY_DISABLED="${NEXT_TELEMETRY_DISABLED:-1}"
export PORT="${PORT:-3000}"

child_pid=""

terminate() {
  local sig="$1"
  if [[ -n "${child_pid}" ]] && kill -0 "${child_pid}" 2>/dev/null; then
    kill -"${sig}" "${child_pid}" 2>/dev/null || true
    wait "${child_pid}" 2>/dev/null || true
  fi
  # Exit cleanly on expected termination signals to avoid noisy logs
  if [[ "${sig}" == "TERM" || "${sig}" == "INT" ]]; then
    exit 0
  fi
}

trap 'terminate TERM' TERM
trap 'terminate INT' INT

# Run Next.js directly (avoid npm runtime wrapper to prevent SIGTERM error logs)
node ./node_modules/next/dist/bin/next start &
child_pid=$!

# Wait for the app to exit and propagate its exit code for real failures
wait "${child_pid}"
exit $?
