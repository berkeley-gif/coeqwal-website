// Verifies a Next.js static export (`output: "export"`) produced a real,
// non-empty site. Run in CI after `turbo run build --filter=main`; exits
// non-zero so a broken or empty export cannot pass the build job.
//
// Deliberately not overfit to route names: it asserts the export's structural
// invariants (entry page, not-found page, a real hashed JS bundle, at least one
// routed page beyond the root shells, a real app shell), not a hardcoded list of
// pages — so adding or renaming a page does not break this check.
//
// Usage: node .github/scripts/verify-static-export.mjs [outDir]   (default apps/main/out)

import { existsSync, statSync, readdirSync, readFileSync } from "node:fs"
import { join, sep } from "node:path"

const dir = process.argv[2] ?? "apps/main/out"
const errors = []
const pass = (m) => console.log(`  ok  ${m}`)
const must = (cond, msg) => (cond ? pass(msg) : errors.push(msg))

// Collect every file path under a directory (iterative; does not follow into
// nothing special — symlinked dirs report isDirectory() false, so are not walked).
const walk = (root) => {
  const out = []
  const stack = [root]
  while (stack.length > 0) {
    const cur = stack.pop()
    let ents = []
    try {
      ents = readdirSync(cur, { withFileTypes: true })
    } catch {
      continue
    }
    for (const e of ents) {
      const p = join(cur, e.name)
      if (e.isDirectory()) stack.push(p)
      else out.push(p)
    }
  }
  return out
}

// 1. export directory exists and is non-empty
const dirOk = existsSync(dir) && statSync(dir).isDirectory()
must(dirOk, `export dir exists: ${dir}`)
const entries = dirOk ? readdirSync(dir) : []
must(entries.length > 0, `export dir is non-empty (${entries.length} entries)`)

// 2. entry page + not-found page present
must(existsSync(join(dir, "index.html")), "index.html present")
must(existsSync(join(dir, "404.html")), "404.html present")

// 3. a real hashed JS bundle under _next/static (not just an empty dir)
const staticDir = join(dir, "_next", "static")
const jsChunks = existsSync(staticDir)
  ? walk(staticDir).filter((p) => p.endsWith(".js"))
  : []
must(
  jsChunks.length > 0,
  `_next/static contains at least one .js chunk (found ${jsChunks.length})`,
)

// 4. at least one routed page beyond the root shells (index.html, 404.html)
const underNext = (p) => p.split(sep).includes("_next")
const allHtml = dirOk
  ? walk(dir).filter((p) => p.endsWith(".html") && !underNext(p))
  : []
const rootShells = new Set([join(dir, "index.html"), join(dir, "404.html")])
const routed = allHtml.filter((p) => !rootShells.has(p))
must(
  routed.length >= 1,
  `at least one routed page beyond index/404 (routed ${routed.length}; ${allHtml.length} html total)`,
)

// 5. entry page references the _next runtime (i.e. it is a real app shell)
const indexHtml = existsSync(join(dir, "index.html"))
  ? readFileSync(join(dir, "index.html"), "utf8")
  : ""
must(indexHtml.includes("/_next/"), "index.html references the /_next/ runtime")

if (errors.length > 0) {
  console.error(`\nverify-static-export FAILED (${errors.length} problem(s)):`)
  for (const e of errors) console.error(`  -  ${e}`)
  process.exit(1)
}
console.log(
  `\nverify-static-export OK: ${dir} (${allHtml.length} html pages, ${jsChunks.length} js chunks)`,
)
