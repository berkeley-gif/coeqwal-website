// Enforces the shared-package PR rule for pushes to dev: every commit in the
// push range that touches packages/**, pnpm-lock.yaml, pnpm-workspace.yaml,
// turbo.json, or root package.json (markdown excluded) must belong to a
// merged PR whose base is dev. Runs from the enforce-package-pr workflow.
//
// The GitHub API lookup retries with backoff and distinguishes two fail-closed
// outcomes: a policy violation (direct package push) and API unavailability
// (retries exhausted). A transient REST hiccup, e.g. an HTML error page where
// JSON was expected, must never be reported as a violation; it asks for a
// re-run instead. Enforcement never fails open: API trouble still exits 1.
//
// Inputs (env):
//   BEFORE_SHA                 previous branch head (github.event.before);
//                              40 zeros on branch creation, which skips
//                              enforcement
//   AFTER_SHA                  new branch head (github.sha)
//   REPO                       owner/name (github.repository)
//   GH_TOKEN                   token for the API lookup
//   GITHUB_API_URL             API base; set natively by GitHub Actions,
//                              defaults to https://api.github.com
//   PROVENANCE_RETRY_DELAYS_MS optional comma-separated backoff waits in ms
//                              (default "2000,5000,10000"; tests use "0,0,0")
//
// Side effects: logs to stdout/stderr (including ::error workflow commands)
// and exits 0 (compliant or nothing to check) / 1 (violation, API
// unavailable, or misconfiguration).

import { execFileSync } from "node:child_process"
import { setTimeout as sleep } from "node:timers/promises"

const beforeSha = process.env.BEFORE_SHA
const afterSha = process.env.AFTER_SHA
const repo = process.env.REPO
const token = process.env.GH_TOKEN

if (!beforeSha || !afterSha || !repo || !token) {
  console.error(
    "Missing required env. Need BEFORE_SHA, AFTER_SHA, REPO, GH_TOKEN",
  )
  process.exit(1)
}

const apiUrl = process.env.GITHUB_API_URL || "https://api.github.com"
const retryDelaysMs = (
  process.env.PROVENANCE_RETRY_DELAYS_MS || "2000,5000,10000"
)
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isFinite(n) && n >= 0)

// First push to a new branch reports BEFORE_SHA as 40 zeros. Branch creation
// is not a package-change push by itself, so there is nothing to enforce.
if (beforeSha === "0".repeat(40)) {
  console.log("Branch-creation push (no prior history). Skipping enforcement.")
  process.exit(0)
}

const WATCHED =
  /^(packages\/|pnpm-lock\.yaml$|pnpm-workspace\.yaml$|turbo\.json$|package\.json$)/
const DOCS = /\.(md|mdx)$/

function gitLines(args) {
  return execFileSync("git", args, { encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

// Fetches the PRs containing a commit, retrying on any failure shape a
// flaky API can produce: network error, non-2xx status, or a body that is
// not a JSON array (GitHub outage pages are HTML served with either 5xx or
// 200). Returns the parsed array, or null when every attempt failed.
async function fetchPullsWithRetry(sha) {
  for (let attempt = 0; attempt <= retryDelaysMs.length; attempt++) {
    try {
      const res = await fetch(`${apiUrl}/repos/${repo}/commits/${sha}/pulls`, {
        headers: {
          accept: "application/vnd.github+json",
          authorization: `Bearer ${token}`,
          "user-agent": "coeqwal-website-ci",
          "x-github-api-version": "2022-11-28",
        },
      })
      const text = await res.text()
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const parsed = JSON.parse(text)
      if (!Array.isArray(parsed)) {
        throw new Error(`expected a JSON array, got ${typeof parsed}`)
      }
      return parsed
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      if (attempt < retryDelaysMs.length) {
        console.error(
          `GitHub API attempt ${attempt + 1} for ${sha} failed (${detail}); retrying in ${retryDelaysMs[attempt]}ms`,
        )
        await sleep(retryDelaysMs[attempt])
      } else {
        console.error(
          `GitHub API attempt ${attempt + 1} for ${sha} failed (${detail}); giving up`,
        )
      }
    }
  }
  return null
}

const commits = gitLines(["rev-list", `${beforeSha}..${afterSha}`])
const violations = []

for (const sha of commits) {
  // Watched package paths touched by this commit, with .md and .mdx filtered
  // out so a docs-only change inside packages/ does not count. For merge
  // commits `git show` prints the combined diff, which is empty for clean
  // merges, so merges are effectively checked via their parents.
  const touched = gitLines([
    "show",
    "--name-only",
    "--pretty=format:",
    sha,
  ]).filter((file) => WATCHED.test(file) && !DOCS.test(file))
  if (touched.length === 0) continue

  const pulls = await fetchPullsWithRetry(sha)
  if (pulls === null) {
    console.log(
      `::error title=PR provenance check could not reach the GitHub API::Provenance of commit ${sha} could not be verified after ${retryDelaysMs.length + 1} attempts (the API kept returning errors or non-JSON responses). This is an API availability problem, not a policy violation. Re-run this workflow once GitHub recovers.`,
    )
    process.exit(1)
  }

  const merged = pulls.filter(
    (pr) => pr.merged_at != null && pr.base?.ref === "dev",
  )
  if (merged.length === 0) {
    violations.push(sha)
  } else {
    console.log(`Commit ${sha} delivered via PR #${merged[0].number} (OK)`)
  }
}

if (violations.length === 0) {
  console.log(
    "All package-touching commits in this push were delivered via merged PRs.",
  )
  process.exit(0)
}

console.log(
  "::error title=Direct package push to dev::One or more commits in this push touched packages/**, the lockfile, the workspace file, turbo.json, or root package.json without going through a pull request. Project policy requires a PR for these paths so the Notify package changes workflow can run and the right owners are pinged. See the run log for the offending commit shas.",
)
// Surface every violating sha in the run log so the failed-run email has
// actionable information without needing to open the run.
console.log("Violating commits:")
console.log(violations.join("\n"))
process.exit(1)
