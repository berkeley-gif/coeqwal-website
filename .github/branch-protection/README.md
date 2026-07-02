# Branch protection for `dev` - admin handoff

This directory contains everything a **repository admin** needs to turn on
branch protection for the default branch (`dev`), requiring pull requests and
the `gate` status check produced by `.github/workflows/ci.yml`. Contributors
without admin rights cannot apply it (the ruleset endpoints return 404/403).

## What gets applied

The existing repository ruleset **`coeqwal-limited`** (id `14169070`) already
targets the default branch but is `disabled` and only forbids force-pushes.
`ruleset.coeqwal-limited.json` extends it to:

| Rule                           | Effect                                               |
| ------------------------------ | ---------------------------------------------------- |
| `non_fast_forward`             | (kept) no force-pushes                               |
| `pull_request`                 | changes reach `dev` only via a PR - no direct pushes |
| `required_status_checks: gate` | the PR cannot merge until the `gate` check passes    |

- **`gate` is the only required context** - this is deliberate. The CI
  workflow's `gate` job is a default-deny roll-up over its `needs` list, so
  future checks become required by editing `gate.needs` in `ci.yml`;
  **the ruleset never needs to change again.**
- The check name `gate` is the observed check-run name from real runs (proven
  green on real PRs, #168 and #170, and on the `dev` tip after merge). The
  check is pinned to `integration_id` 15368 (GitHub Actions), so only
  Actions-produced check runs satisfy it.
- Enforcement becomes `active`.
- Note for rollout: PRs that were opened before `ci.yml` reached `dev` and
  have not pushed since will show `gate` as "Expected" (blocking) until their
  next push, synchronize, or close/reopen triggers a run on a fresh merge ref.

## Why (the motivating failure)

With no protection, two PRs merged 6 minutes apart while CI was first landing:
the earlier one (#169) never ran any checks and put unformatted /
lint-failing code on `dev`, which broke the first CI run on the branch and
needed a follow-up fix PR (#170). A required `gate` makes that impossible --
every PR runs the same checks before merge, and direct pushes (the other way
around the gate) are blocked.

## How to apply

```sh
cd .github/branch-protection
./apply-ruleset.sh            # dry run: shows current-vs-target diff, writes nothing
./apply-ruleset.sh --apply    # writes the ruleset, then prints the live state
```

The script is idempotent - if the live ruleset already matches, it exits
without writing. Equivalent UI path: Settings → Rules → Rulesets →
`coeqwal-limited` → add the two rules above and set Enforcement to Active.

## Dials left at the loose setting (raise deliberately, not by default)

- `required_approving_review_count: 0` - a PR is required, an approval is not.
  Raise to 1 (and/or `require_code_owner_review: true`) to make CODEOWNERS
  review blocking. Left at 0 so a two-person team is not deadlocked by an
  absent reviewer; the merge-convention today is an ordinary CODEOWNERS review.
- `strict_required_status_checks_policy: false` - a green `gate` on a slightly
  stale merge ref still merges. Setting `true` forces every PR to be up to
  date with `dev` before merging (closes the "two PRs green in parallel,
  broken together" race at the cost of rebase churn). Consider `true` if
  post-merge breaks recur.
- No bypass actors are configured, and rulesets do NOT exempt admins by
  default: once active, the `pull_request` rule blocks direct pushes to `dev`
  for everyone, admins included. This deliberately retires the old
  "markdown-only edits may be pushed directly" convention; add an admin-only
  bypass actor instead if an emergency direct-push path is wanted (anyone
  with bypass can skip the gate entirely).

## Also worth an admin's attention

- Root `CODEOWNERS` (`*`) is down to a **single owner** - a bus-factor risk
  for a rule set that may later require code-owner review.
- `main` is not covered (`~DEFAULT_BRANCH` = `dev` only). If `main` gains a
  release role, duplicate the ruleset with a `main` condition.
- CI needs the repository **variable** (not secret) `NEXT_PUBLIC_MAPBOX_TOKEN`
  (a public, URL-restricted token; `NEXT_PUBLIC_*` values are inlined into the
  static export). Until it is set, CI builds compile with a non-functional map.
