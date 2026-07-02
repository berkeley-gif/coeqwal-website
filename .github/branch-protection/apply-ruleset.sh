#!/usr/bin/env bash
# Apply the coeqwal-limited branch-ruleset extension to berkeley-gif/coeqwal-website.
#
# What it does: updates the existing repository ruleset "coeqwal-limited"
# (which already targets the default branch, `dev`) to the state in
# ruleset.coeqwal-limited.json: enforcement active, pull requests required,
# and the `gate` status check (produced by .github/workflows/ci.yml) required.
# See README.md in this directory for context and options.
#
# Requirements: `gh` CLI authenticated as a REPOSITORY ADMIN, and `jq`.
# Contributors without admin get a 404/403 from the ruleset endpoints.
#
# Usage:
#   ./apply-ruleset.sh            # dry run (default): show the current-vs-target diff
#   ./apply-ruleset.sh --apply    # write the target state, then verify
#
# Idempotent: if the live ruleset already matches the target on every field
# this script manages, it exits 0 without writing. The comparison projects
# both sides onto the managed fields only, because the API's GET response may
# include server-added parameter keys with default values that the target
# file does not spell out. Fails loudly on any API error (set -e; no silent
# fallback).
#
# bypass_actors is intentionally not sent: the target keeps the list empty.
# If bypass actors are ever added out-of-band, confirm after a re-apply that
# they survived (the PUT semantics for omitted fields are not documented).

set -euo pipefail

REPO="berkeley-gif/coeqwal-website"
RULESET_ID="14169070" # existing "coeqwal-limited" ruleset
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_FILE="$HERE/ruleset.coeqwal-limited.json"

MODE="dry-run"
if [ "${1:-}" = "--apply" ]; then
  MODE="apply"
elif [ -n "${1:-}" ] && [ "${1:-}" != "--dry-run" ]; then
  echo "usage: $0 [--dry-run|--apply]" >&2
  exit 2
fi

command -v gh >/dev/null || { echo "gh (GitHub CLI) is required" >&2; exit 2; }
command -v jq >/dev/null || { echo "jq is required" >&2; exit 2; }

# Projection of the fields this script manages. Explicit key selection makes
# the idempotence check immune to server-added defaults in GET responses.
PROJECT='{
  enforcement,
  conditions,
  rule_types: ([.rules[].type] | sort),
  pull_request: ([.rules[] | select(.type == "pull_request") | .parameters | {
    required_approving_review_count,
    dismiss_stale_reviews_on_push,
    require_code_owner_review,
    require_last_push_approval,
    required_review_thread_resolution,
    allowed_merge_methods: ((.allowed_merge_methods // []) | sort)
  }]),
  required_checks: ([.rules[] | select(.type == "required_status_checks") | .parameters | {
    strict: .strict_required_status_checks_policy,
    checks: ((.required_status_checks // []) | sort_by(.context))
  }])
}'

current="$(gh api "repos/$REPO/rulesets/$RULESET_ID")"
current_proj="$(printf '%s' "$current" | jq -S "$PROJECT")"
target_proj="$(jq -S "$PROJECT" "$TARGET_FILE")"

if [ "$current_proj" = "$target_proj" ]; then
  echo "Ruleset $RULESET_ID already matches the target on all managed fields."
  exit 0
fi

echo "=== current (live) vs target (file), managed fields only ==="
diff <(printf '%s\n' "$current_proj") <(printf '%s\n' "$target_proj") || true
echo

if [ "$MODE" = "dry-run" ]; then
  echo "Dry run only: no changes written. Re-run with --apply to write."
  exit 0
fi

gh api --method PUT "repos/$REPO/rulesets/$RULESET_ID" --input "$TARGET_FILE" >/dev/null
echo "Applied. Verifying live state:"
gh api "repos/$REPO/rulesets/$RULESET_ID" |
  jq '{enforcement, rules: [.rules[].type], required_checks: [.rules[] | select(.type == "required_status_checks") | .parameters.required_status_checks[].context]}'
