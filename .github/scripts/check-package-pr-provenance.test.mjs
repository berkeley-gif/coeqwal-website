// E2E tests for check-package-pr-provenance.mjs, runnable with `node --test`.
//
// Each case builds a throwaway git repo fixture plus a local stub of the
// GitHub REST API (node:http), then runs the script as a child process with
// the same env contract the enforce-package-pr workflow uses. The script
// reads GITHUB_API_URL, which GitHub Actions sets natively, so pointing it
// at the stub exercises the real fetch/retry path with no mocking inside
// the script.
//
// The headline regression: a transient GitHub REST failure (HTML error page
// instead of JSON, as seen on the dev push after PR #196 merged) must be
// retried, and a persistent API outage must fail closed with an availability
// error that is clearly distinct from a policy-violation error.

import assert from "node:assert/strict"
import { execFileSync, spawn } from "node:child_process"
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { createServer } from "node:http"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { after, test } from "node:test"
import { rmSync } from "node:fs"

const SCRIPT = join(
  dirname(fileURLToPath(import.meta.url)),
  "check-package-pr-provenance.mjs",
)

const ZERO_SHA = "0".repeat(40)
const HTML_BODY = "<html><body>503 Service Unavailable</body></html>"

const cleanups = []
after(() => {
  for (const fn of cleanups) fn()
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

// History: base commit, then a packages/ source change, then a markdown-only
// packages/ change. Ranges between those shas drive the individual cases.
function makeFixture() {
  const dir = mkdtempSync(join(tmpdir(), "pr-provenance-test-"))
  cleanups.push(() => rmSync(dir, { recursive: true, force: true }))
  git(dir, "init", "-q")

  mkdirSync(join(dir, "packages", "data", "src"), { recursive: true })
  writeFileSync(join(dir, "packages", "data", "src", "index.ts"), "export {}\n")
  git(dir, "add", "-A")
  git(dir, "commit", "-q", "-m", "base")
  const base = headSha(dir)

  writeFileSync(
    join(dir, "packages", "data", "src", "index.ts"),
    "export const changed = true\n",
  )
  git(dir, "add", "-A")
  git(dir, "commit", "-q", "-m", "change data package")
  const pkgHead = headSha(dir)

  writeFileSync(join(dir, "packages", "data", "README.md"), "docs only\n")
  git(dir, "add", "-A")
  git(dir, "commit", "-q", "-m", "docs-only package change")
  const mdHead = headSha(dir)

  return { dir, base, pkgHead, mdHead }
}

// Stub GitHub API. `responses` is consumed one entry per request; when the
// queue runs dry the last entry repeats, so a persistent-failure case just
// provides one entry. Records every request for assertions.
async function makeApiStub(responses) {
  const requests = []
  const queue = [...responses]
  const server = createServer((req, res) => {
    requests.push({
      path: req.url,
      authorization: req.headers.authorization,
    })
    const next = queue.length > 1 ? queue.shift() : queue[0]
    if (next.json !== undefined) {
      res.writeHead(next.status ?? 200, {
        "content-type": "application/json",
      })
      res.end(JSON.stringify(next.json))
    } else {
      res.writeHead(next.status ?? 503, { "content-type": "text/html" })
      res.end(next.body ?? HTML_BODY)
    }
  })
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
  cleanups.push(() => server.close())
  const { port } = server.address()
  return { url: `http://127.0.0.1:${port}`, requests }
}

function runScript(fixture, { before, after: afterSha, apiUrl }) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [SCRIPT], {
      cwd: fixture.dir,
      env: {
        ...process.env,
        BEFORE_SHA: before,
        AFTER_SHA: afterSha,
        REPO: "example-org/example-repo",
        GH_TOKEN: "test-token",
        GITHUB_API_URL: apiUrl ?? "http://127.0.0.1:9", // unused when no API call expected
        PROVENANCE_RETRY_DELAYS_MS: "0,0,0",
      },
    })
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (d) => (stdout += d))
    child.stderr.on("data", (d) => (stderr += d))
    child.on("close", (status) => resolve({ status, stdout, stderr }))
  })
}

const MERGED_DEV_PR = [
  { number: 7, merged_at: "2026-07-16T12:00:00Z", base: { ref: "dev" } },
]

test("transient non-JSON API responses are retried until JSON succeeds", async () => {
  const fixture = makeFixture()
  const api = await makeApiStub([
    { status: 503 }, // HTML error page
    { status: 200, body: HTML_BODY }, // 200 but not JSON
    { status: 200, json: MERGED_DEV_PR },
  ])
  const run = await runScript(fixture, {
    before: fixture.base,
    after: fixture.pkgHead,
    apiUrl: api.url,
  })

  assert.equal(run.status, 0, `expected exit 0: ${run.stdout}${run.stderr}`)
  assert.equal(api.requests.length, 3, "two failures then one success")
  assert.match(run.stdout, /delivered via PR #7 \(OK\)/)
  assert.match(run.stderr, /attempt 1 .*retrying/i)
})

test("persistent API failure fails closed with an availability error, not a violation", async () => {
  const fixture = makeFixture()
  const api = await makeApiStub([{ status: 503 }])
  const run = await runScript(fixture, {
    before: fixture.base,
    after: fixture.pkgHead,
    apiUrl: api.url,
  })

  assert.equal(run.status, 1)
  assert.equal(api.requests.length, 4, "initial attempt plus three retries")
  assert.match(
    run.stdout,
    /::error title=PR provenance check could not reach the GitHub API::/,
  )
  assert.doesNotMatch(
    run.stdout,
    /Direct package push/,
    "an API outage must never read as a policy violation",
  )
})

test("package-touching commit without a merged dev PR is a violation", async () => {
  const fixture = makeFixture()
  const api = await makeApiStub([
    // An unmerged PR and a PR into another base do not count as provenance.
    {
      status: 200,
      json: [
        { number: 9, merged_at: null, base: { ref: "dev" } },
        {
          number: 10,
          merged_at: "2026-07-16T12:00:00Z",
          base: { ref: "main" },
        },
      ],
    },
  ])
  const run = await runScript(fixture, {
    before: fixture.base,
    after: fixture.pkgHead,
    apiUrl: api.url,
  })

  assert.equal(run.status, 1)
  assert.match(run.stdout, /::error title=Direct package push to dev::/)
  assert.match(run.stdout, new RegExp(fixture.pkgHead))
})

test("package-touching commit delivered via a merged dev PR passes", async () => {
  const fixture = makeFixture()
  const api = await makeApiStub([{ status: 200, json: MERGED_DEV_PR }])
  const run = await runScript(fixture, {
    before: fixture.base,
    after: fixture.pkgHead,
    apiUrl: api.url,
  })

  assert.equal(run.status, 0, `expected exit 0: ${run.stdout}${run.stderr}`)
  assert.match(run.stdout, /All package-touching commits .* merged PRs\./)
  assert.equal(
    api.requests[0].path,
    `/repos/example-org/example-repo/commits/${fixture.pkgHead}/pulls`,
  )
  assert.equal(api.requests[0].authorization, "Bearer test-token")
})

test("markdown-only package changes are skipped without any API call", async () => {
  const fixture = makeFixture()
  const api = await makeApiStub([{ status: 200, json: MERGED_DEV_PR }])
  const run = await runScript(fixture, {
    before: fixture.pkgHead,
    after: fixture.mdHead,
    apiUrl: api.url,
  })

  assert.equal(run.status, 0, `expected exit 0: ${run.stdout}${run.stderr}`)
  assert.equal(api.requests.length, 0)
})

test("branch-creation push (zero before-sha) skips enforcement", async () => {
  const fixture = makeFixture()
  const run = await runScript(fixture, {
    before: ZERO_SHA,
    after: fixture.pkgHead,
  })

  assert.equal(run.status, 0, `expected exit 0: ${run.stdout}${run.stderr}`)
  assert.match(run.stdout, /Branch-creation push/)
})
