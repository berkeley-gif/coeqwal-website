// Computes which apps in apps/* are affected by a PR's changes to
// packages/, the lockfile, the workspace file, turbo.json, or the root
// package.json. Renders a Markdown body for the sticky PR comment.
//
// Inputs (env):
//   BASE_SHA            PR base commit (github.event.pull_request.base.sha)
//   HEAD_SHA            PR head commit (github.event.pull_request.head.sha)
//   GITHUB_REPOSITORY   owner/name, used to build dispatch links
//   GITHUB_OUTPUT       path to the step's output file
//
// Outputs (to $GITHUB_OUTPUT):
//   skip=true             if no apps are affected (the sticky-comment step is gated on this)
//   markdown=<multiline>  the Markdown body otherwise

import { execSync } from "node:child_process"
import { appendFileSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

const baseSha = process.env.BASE_SHA
const headSha = process.env.HEAD_SHA
const repo = process.env.GITHUB_REPOSITORY
const ghOutput = process.env.GITHUB_OUTPUT

if (!baseSha || !headSha || !repo || !ghOutput) {
  console.error(
    "Missing required env. Need BASE_SHA, HEAD_SHA, GITHUB_REPOSITORY, GITHUB_OUTPUT",
  )
  process.exit(1)
}

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
  else if (file === "pnpm-workspace.yaml") broadImpact.add("pnpm-workspace.yaml")
  else if (file === "turbo.json") broadImpact.add("turbo.json")
  else if (file === "package.json") broadImpact.add("package.json")
}

console.log(
  `Changed packages: ${[...changedPackages].sort().join(", ") || "(none)"}`,
)
console.log(
  `Broad-impact files: ${[...broadImpact].sort().join(", ") || "(none)"}`,
)

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
  console.error("No tracked apps found in .github/CODEOWNERS (looking for /apps/<name>/ entries)")
  process.exit(1)
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

if (affected.size === 0) {
  appendFileSync(ghOutput, "skip=true\n")
  console.log("No affected apps. Sticky comment will be skipped.")
  process.exit(0)
}

const repoUrl = `https://github.com/${repo}`
const workflowUrl = `${repoUrl}/actions/workflows/deploy-amplify.yml`

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
    "> A broad-impact file changed (lockfile, workspace, `turbo.json`, or root `package.json`). All apps are listed because their builds could be affected.",
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

const markdown = lines.join("\n")
const delimiter = `EOF_${Math.random().toString(36).slice(2)}`
appendFileSync(ghOutput, `markdown<<${delimiter}\n${markdown}\n${delimiter}\n`)
console.log("Comment markdown written to $GITHUB_OUTPUT")
