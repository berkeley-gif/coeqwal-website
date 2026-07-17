// E2E tests for compute-affected-apps.mjs, runnable with `node --test`.
//
// Each case builds a throwaway git repo fixture, runs the script as a child
// process with the same env contract the notify workflow uses, and asserts
// on exit code, stdout annotations, and the markdown written to
// GITHUB_OUTPUT. No test framework beyond node:test (Node built-ins only,
// matching the workflow's "no pnpm needed" constraint).
//
// The headline regression: pausing code-owner review by commenting out every
// rule in .github/CODEOWNERS must not kill the script. Tracked apps come from
// apps/<name>/package.json on disk; CODEOWNERS only enriches the owner column
// while its /apps/<name>/ entries are active.

import assert from "node:assert/strict"
import { execFileSync, spawnSync } from "node:child_process"
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { after, test } from "node:test"

const SCRIPT = join(
  dirname(fileURLToPath(import.meta.url)),
  "compute-affected-apps.mjs",
)

const PAUSED_CODEOWNERS = [
  "# Code owners for coeqwal-website",
  "# TEMPORARILY DISABLED: rules commented out to pause auto-review-requests.",
  "# /apps/main/                    @someowner",
  "# /packages/                     @someowner",
  "",
].join("\n")

const cleanups = []
after(() => {
  for (const dir of cleanups) rmSync(dir, { recursive: true, force: true })
})

function git(cwd, ...args) {
  execFileSync(
    "git",
    [
      "-c",
      "user.email=fixture@example.invalid",
      "-c",
      "user.name=fixture",
      ...args,
    ],
    { cwd, stdio: "pipe" },
  )
}

function headSha(cwd) {
  return execFileSync("git", ["rev-parse", "HEAD"], {
    cwd,
    encoding: "utf8",
  }).trim()
}

// Builds a git repo shaped like this monorepo: two apps (main depends on
// @repo/data, storyline-flow depends on @repo/ui), one stray apps/ dir with
// no package.json, a data package, and turbo.json. History: base commit,
// then a packages/data change, then a turbo.json change.
function makeFixture({ withApps = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "affected-apps-test-"))
  cleanups.push(dir)
  git(dir, "init", "-q")

  mkdirSync(join(dir, ".github"), { recursive: true })
  writeFileSync(join(dir, ".github", "CODEOWNERS"), PAUSED_CODEOWNERS)
  mkdirSync(join(dir, "packages", "data", "src"), { recursive: true })
  writeFileSync(join(dir, "packages", "data", "src", "index.ts"), "export {}\n")
  writeFileSync(join(dir, "turbo.json"), "{}\n")
  if (withApps) {
    const apps = [
      ["main", "@repo/data"],
      ["storyline-flow", "@repo/ui"],
    ]
    for (const [app, dep] of apps) {
      mkdirSync(join(dir, "apps", app), { recursive: true })
      writeFileSync(
        join(dir, "apps", app, "package.json"),
        JSON.stringify(
          { name: app, dependencies: { [dep]: "workspace:*" } },
          null,
          2,
        ),
      )
    }
    // A directory without package.json is not an app and must be ignored.
    mkdirSync(join(dir, "apps", "scratch"), { recursive: true })
    writeFileSync(join(dir, "apps", "scratch", "notes.txt"), "not an app\n")
  }
  git(dir, "add", "-A")
  git(dir, "commit", "-q", "-m", "base")
  const base = headSha(dir)

  writeFileSync(
    join(dir, "packages", "data", "src", "index.ts"),
    "export const changed = true\n",
  )
  git(dir, "add", "-A")
  git(dir, "commit", "-q", "-m", "change data package")
  const packageChangeHead = headSha(dir)

  writeFileSync(join(dir, "turbo.json"), '{ "tasks": {} }\n')
  git(dir, "add", "-A")
  git(dir, "commit", "-q", "-m", "change turbo.json")
  const broadChangeHead = headSha(dir)

  return { dir, base, packageChangeHead, broadChangeHead }
}

let outputCounter = 0

// Runs the script exactly as the workflow step does. `codeowners` replaces
// the fixture's .github/CODEOWNERS content; pass null to delete the file.
function runScript(fixture, { head, codeowners }) {
  const codeownersPath = join(fixture.dir, ".github", "CODEOWNERS")
  if (codeowners === null) rmSync(codeownersPath, { force: true })
  else writeFileSync(codeownersPath, codeowners)

  const outputFile = join(fixture.dir, `github-output-${outputCounter++}`)
  writeFileSync(outputFile, "")

  const result = spawnSync(process.execPath, [SCRIPT], {
    cwd: fixture.dir,
    encoding: "utf8",
    env: {
      ...process.env,
      BASE_SHA: fixture.base,
      HEAD_SHA: head,
      GITHUB_REPOSITORY: "example-org/example-repo",
      GITHUB_OUTPUT: outputFile,
      // Keep test noise out of the real job summary when run inside CI.
      GITHUB_STEP_SUMMARY: "",
    },
  })

  const raw = readFileSync(outputFile, "utf8")
  const match = raw.match(/^markdown<<(\S+)\n([\s\S]*)\n\1\n/)
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    markdown: match ? match[2] : "",
  }
}

test("paused CODEOWNERS (all rules commented out) still posts the impact comment", () => {
  const fixture = makeFixture()
  const run = runScript(fixture, {
    head: fixture.packageChangeHead,
    codeowners: PAUSED_CODEOWNERS,
  })

  assert.equal(
    run.status,
    0,
    `expected exit 0, got ${run.status}: ${run.stderr}`,
  )
  assert.match(run.markdown, /\| main \|/, "main depends on @repo/data")
  assert.doesNotMatch(
    run.markdown,
    /\| storyline-flow \|/,
    "storyline-flow does not depend on @repo/data",
  )
  assert.match(run.markdown, /_unassigned_/, "owners unknown while paused")
  assert.doesNotMatch(
    run.stdout,
    /::warning/,
    "a fully paused CODEOWNERS is a deliberate state, not drift",
  )
})

test("missing CODEOWNERS file is tolerated", () => {
  const fixture = makeFixture()
  const run = runScript(fixture, {
    head: fixture.packageChangeHead,
    codeowners: null,
  })

  assert.equal(
    run.status,
    0,
    `expected exit 0, got ${run.status}: ${run.stderr}`,
  )
  assert.match(run.markdown, /\| main \|/)
  assert.match(run.markdown, /_unassigned_/)
})

test("active CODEOWNERS entries populate the owner column", () => {
  const fixture = makeFixture()
  const run = runScript(fixture, {
    head: fixture.packageChangeHead,
    codeowners: [
      "/apps/main/            @alice @bob",
      "/apps/storyline-flow/  @carol",
      "",
    ].join("\n"),
  })

  assert.equal(
    run.status,
    0,
    `expected exit 0, got ${run.status}: ${run.stderr}`,
  )
  assert.match(run.markdown, /\| main \| @alice @bob \|/)
  assert.doesNotMatch(run.markdown, /_unassigned_/)
})

test("broad-impact change lists every app discovered on disk", () => {
  const fixture = makeFixture()
  const run = runScript(fixture, {
    head: fixture.broadChangeHead,
    codeowners: PAUSED_CODEOWNERS,
  })

  assert.equal(
    run.status,
    0,
    `expected exit 0, got ${run.status}: ${run.stderr}`,
  )
  assert.match(run.markdown, /\| main \|/)
  assert.match(run.markdown, /\| storyline-flow \|/)
  assert.doesNotMatch(
    run.markdown,
    /\| scratch \|/,
    "apps/ entries without package.json are not apps",
  )
})

test("partially active CODEOWNERS warns about unlisted apps but still tracks them", () => {
  const fixture = makeFixture()
  const run = runScript(fixture, {
    head: fixture.broadChangeHead,
    codeowners: "/apps/main/  @alice\n",
  })

  assert.equal(
    run.status,
    0,
    `expected exit 0, got ${run.status}: ${run.stderr}`,
  )
  assert.match(run.markdown, /\| main \| @alice \|/)
  assert.match(
    run.markdown,
    /\| storyline-flow \| _unassigned_ \|/,
    "unlisted app is still tracked, just unowned",
  )
  assert.match(
    run.stdout,
    /::warning[^\n]*storyline-flow/,
    "partial coverage is drift worth flagging",
  )
})

test("dead CODEOWNERS entry (no matching app dir) warns and is not tracked", () => {
  const fixture = makeFixture()
  const run = runScript(fixture, {
    head: fixture.broadChangeHead,
    codeowners: ["/apps/main/   @alice", "/apps/ghost/  @alice", ""].join("\n"),
  })

  assert.equal(
    run.status,
    0,
    `expected exit 0, got ${run.status}: ${run.stderr}`,
  )
  assert.doesNotMatch(
    run.markdown,
    /\| ghost \|/,
    "the filesystem, not CODEOWNERS, decides what an app is",
  )
  assert.match(run.stdout, /::warning[^\n]*ghost/)
})

test("zero apps on disk fails closed", () => {
  const fixture = makeFixture({ withApps: false })
  const run = runScript(fixture, {
    head: fixture.packageChangeHead,
    codeowners: PAUSED_CODEOWNERS,
  })

  assert.equal(run.status, 1, "a repo with no apps/ is a broken checkout")
  assert.match(run.stderr, /No apps found under apps\//)
})
