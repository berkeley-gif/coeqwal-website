// Computes which apps in apps/* are affected by a PR's changes to
// packages/, the lockfile, the workspace file, turbo.json, or the root
// package.json. Renders a Markdown body for the sticky PR comment.
//
// The sticky comment ALWAYS posts. When no apps are affected (e.g., a
// lockfile-regen-only PR) the comment explains why so the PR has a record
// instead of silent silence.
//
// Inputs (env):
//   BASE_SHA            PR base commit (github.event.pull_request.base.sha)
//   HEAD_SHA            PR head commit (github.event.pull_request.head.sha)
//   GITHUB_REPOSITORY   owner/name, used to build dispatch links
//   GITHUB_OUTPUT       path to the step's output file
//   GITHUB_STEP_SUMMARY path to the job summary file (optional, GH-provided)
//   PR_LABELS           comma-separated labels on the PR (used for opt-outs)
//
// Outputs (to $GITHUB_OUTPUT):
//   markdown=<multiline>  Markdown body for the sticky comment

import { execSync } from "node:child_process"
import {
  appendFileSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs"
import { join } from "node:path"

const baseSha = process.env.BASE_SHA
const headSha = process.env.HEAD_SHA
const repo = process.env.GITHUB_REPOSITORY
const ghOutput = process.env.GITHUB_OUTPUT
const ghSummary = process.env.GITHUB_STEP_SUMMARY
const prLabels = (process.env.PR_LABELS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)

if (!baseSha || !headSha || !repo || !ghOutput) {
  console.error(
    "Missing required env. Need BASE_SHA, HEAD_SHA, GITHUB_REPOSITORY, GITHUB_OUTPUT",
  )
  process.exit(1)
}

const lockfileRegen = prLabels.includes("lockfile-regen")

const diff = execSync(`git diff --name-only ${baseSha}...${headSha}`, {
  encoding: "utf8",
}).trim()

const changedPackages = new Set()
const broadImpact = new Set()

for (const file of diff.split("\n")) {
  if (!file) continue
  const m = file.match(/^packages\/([^/]+)\//)
  if (m) {
    changedPackages.add(m[1])
    continue
  }
  if (file === "pnpm-lock.yaml") broadImpact.add("pnpm-lock.yaml")
  else if (file === "pnpm-workspace.yaml")
    broadImpact.add("pnpm-workspace.yaml")
  else if (file === "turbo.json") broadImpact.add("turbo.json")
  else if (file === "package.json") broadImpact.add("package.json")
}

console.log(
  `Changed packages: ${[...changedPackages].sort().join(", ") || "(none)"}`,
)
console.log(
  `Broad-impact files: ${[...broadImpact].sort().join(", ") || "(none)"}`,
)
console.log(`PR labels: ${prLabels.join(", ") || "(none)"}`)

// Lockfile dedupe: when packages/** changed in the same PR, the lockfile
// change is almost certainly downstream of the package change. Don't
// double-flag every app on top of the package-specific list.
const lockfileDeduped = changedPackages.size > 0 && broadImpact.has("pnpm-lock.yaml")
if (lockfileDeduped) {
  broadImpact.delete("pnpm-lock.yaml")
  console.log(
    "Suppressing pnpm-lock.yaml broad-impact (packages/** changed in the same PR)",
  )
}

// Source of truth for "which apps does this monorepo deploy + who owns them"
// is CODEOWNERS. A line like `/apps/main/  @user1 @user2` means main is a
// tracked app with those owners.
const appOwners = {}
const codeowners = readFileSync(".github/CODEOWNERS", "utf8")
for (const rawLine of codeowners.split("\n")) {
  const line = rawLine.trim()
  if (!line || line.startsWith("#")) continue
  const parts = line.split(/\s+/)
  const pattern = parts[0]
  const owners = parts.slice(1)
  const m = pattern.match(/^\/apps\/([^/]+)\/$/)
  if (m && owners.length) appOwners[m[1]] = owners
}

const appNames = Object.keys(appOwners).sort()
if (appNames.length === 0) {
  console.error(
    "No tracked apps found in .github/CODEOWNERS (looking for /apps/<name>/ entries)",
  )
  process.exit(1)
}

// CODEOWNERS drift guard: compare the apps/ directory on disk to the set of
// apps registered in CODEOWNERS. Drift in either direction is a maintenance
// gap. Warn loudly so it shows up as a workflow annotation, but don't fail.
const onDisk = new Set()
try {
  for (const entry of readdirSync("apps")) {
    if (statSync(join("apps", entry)).isDirectory()) onDisk.add(entry)
  }
} catch {
  // apps/ missing is its own problem, but not for this script to fix
}
const inCodeowners = new Set(appNames)
const missingFromCodeowners = [...onDisk].filter((a) => !inCodeowners.has(a))
const missingFromDisk = [...inCodeowners].filter((a) => !onDisk.has(a))
if (missingFromCodeowners.length > 0) {
  console.log(
    `::warning title=CODEOWNERS drift::apps/ on disk has ${missingFromCodeowners.join(", ")} which is not registered in .github/CODEOWNERS as /apps/<name>/. New apps are invisible to the package-impact comment until added.`,
  )
}
if (missingFromDisk.length > 0) {
  console.log(
    `::warning title=CODEOWNERS drift::.github/CODEOWNERS lists ${missingFromDisk.join(", ")} but no matching apps/<name>/ directory exists. The entry is dead.`,
  )
}

const appDeps = {}
for (const app of appNames) {
  let pkg
  try {
    pkg = JSON.parse(readFileSync(join("apps", app, "package.json"), "utf8"))
  } catch {
    continue
  }
  const all = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
  appDeps[app] = new Set(
    Object.keys(all)
      .filter((d) => d.startsWith("@repo/"))
      .map((d) => d.slice("@repo/".length)),
  )
}

const affected = new Set()
if (broadImpact.size > 0) {
  for (const app of appNames) affected.add(app)
} else {
  for (const app of appNames) {
    for (const pkg of changedPackages) {
      if (appDeps[app]?.has(pkg)) {
        affected.add(app)
        break
      }
    }
  }
}

const repoUrl = `https://github.com/${repo}`
const workflowUrl = `${repoUrl}/actions/workflows/deploy-amplify.yml`

// Decide whether to post the impact comment or a skip-reason comment.
// "Skip-reason" still posts a sticky comment so the PR has a record; this is
// a deliberate change from the old behavior of posting nothing on skip.
const lockfileOnlyBroadImpact =
  broadImpact.size === 1 && broadImpact.has("pnpm-lock.yaml")
const lockfileRegenSkip =
  lockfileRegen &&
  changedPackages.size === 0 &&
  lockfileOnlyBroadImpact

let markdown
let summaryLine

if (lockfileRegenSkip) {
  // Honor the lockfile-regen label: don't broaden to all apps for a
  // lockfile-only PR.
  const lines = []
  lines.push("## Package change impact: skipped")
  lines.push("")
  lines.push(
    "This PR only modifies `pnpm-lock.yaml` and is labelled `lockfile-regen`. The package-impact comment was suppressed because the change is a regeneration that does not require any app to redeploy.",
  )
  lines.push("")
  lines.push(
    "If a transitive bump in this lockfile actually does affect a runtime dependency, remove the `lockfile-regen` label to re-run the workflow and get the full app list.",
  )
  markdown = lines.join("\n")
  summaryLine = `Skipped (lockfile-regen label, lockfile-only PR)`
} else if (affected.size === 0) {
  const lines = []
  lines.push("## Package change impact: no apps flagged")
  lines.push("")
  if (changedPackages.size === 0 && broadImpact.size === 0) {
    lines.push(
      "No `packages/**` or broad-impact files were detected in this PR's diff against the base branch.",
    )
    lines.push("")
    lines.push(
      "This usually means the workflow's path filter matched a file that the script does not classify (likely a future addition under one of the watched paths). If you expected an app list here, ping the deploy maintainers.",
    )
    summaryLine = `Skipped (no packages/** or broad-impact files in diff)`
  } else {
    const list = [...changedPackages]
      .sort()
      .map((p) => `\`@repo/${p}\``)
      .join(", ")
    lines.push(
      `Changed packages: ${list || "(none)"}. None of the tracked apps in CODEOWNERS depend on these packages, so no app needs a redeploy.`,
    )
    lines.push("")
    lines.push(
      "If you have just introduced a new dependency that should be visible to one of the apps, add `@repo/<package>` to that app's `package.json` and re-run.",
    )
    summaryLine = `Skipped (no app depends on changed packages: ${[...changedPackages].sort().join(", ")})`
  }
  markdown = lines.join("\n")
} else {
  const lines = []
  lines.push("## Package change impact")
  lines.push("")
  lines.push(
    "This PR changes one or more shared workspaces. The apps below depend on the changed code and may need a manual deploy after merge.",
  )
  lines.push("")

  if (changedPackages.size > 0) {
    const list = [...changedPackages]
      .sort()
      .map((p) => `\`@repo/${p}\``)
      .join(", ")
    lines.push(`**Changed packages**: ${list}`)
  }
  if (broadImpact.size > 0) {
    const list = [...broadImpact]
      .sort()
      .map((f) => `\`${f}\``)
      .join(", ")
    lines.push(`**Broad-impact files changed**: ${list}`)
    lines.push("")
    lines.push(
      "> A broad-impact file changed (lockfile, workspace, `turbo.json`, or root `package.json`). All apps are listed because their builds could be affected. For lockfile-only regenerations, add the `lockfile-regen` label to suppress this.",
    )
  }
  if (lockfileDeduped) {
    lines.push("")
    lines.push(
      "> `pnpm-lock.yaml` also changed but was suppressed because `packages/**` changed in the same PR (the lockfile change is almost certainly downstream).",
    )
  }

  lines.push("")
  lines.push("| App | Owner(s) | Dispatch |")
  lines.push("|---|---|---|")
  for (const app of [...affected].sort()) {
    const owners = (appOwners[app] || []).join(" ")
    const link = `[Deploy ${app}](${workflowUrl})`
    lines.push(`| ${app} | ${owners} | ${link} |`)
  }
  lines.push("")
  lines.push(
    "> No app will auto-deploy from this PR. When you are ready to ship the package change into your app, click your row's **Dispatch** link and run `Deploy to Amplify` with your app and branch `dev`.",
  )

  markdown = lines.join("\n")
  summaryLine = `Flagged apps: ${[...affected].sort().join(", ")}`
}

const delimiter = `EOF_${Math.random().toString(36).slice(2)}`
appendFileSync(ghOutput, `markdown<<${delimiter}\n${markdown}\n${delimiter}\n`)

if (ghSummary) {
  const summary = []
  summary.push("### Package change impact")
  summary.push("")
  summary.push(`- Decision: **${summaryLine}**`)
  if (changedPackages.size > 0) {
    summary.push(
      `- Changed packages: ${[...changedPackages].sort().map((p) => `\`@repo/${p}\``).join(", ")}`,
    )
  }
  if (broadImpact.size > 0) {
    summary.push(
      `- Broad-impact files: ${[...broadImpact].sort().map((f) => `\`${f}\``).join(", ")}`,
    )
  }
  if (lockfileDeduped) {
    summary.push("- `pnpm-lock.yaml` deduped (packages/** also changed)")
  }
  if (lockfileRegen) {
    summary.push("- PR has `lockfile-regen` label")
  }
  if (missingFromCodeowners.length > 0) {
    summary.push(
      `- :warning: CODEOWNERS drift: missing entries for ${missingFromCodeowners.join(", ")}`,
    )
  }
  if (missingFromDisk.length > 0) {
    summary.push(
      `- :warning: CODEOWNERS drift: dead entries for ${missingFromDisk.join(", ")}`,
    )
  }
  appendFileSync(ghSummary, summary.join("\n") + "\n")
}

console.log(`Decision: ${summaryLine}`)
console.log("Comment markdown written to $GITHUB_OUTPUT")
