import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { test, expect } from "@playwright/test"

// SWR's preload() returns the fetch promise. A prefetch that nobody awaits
// and that has no rejection handler surfaces as an uncaught "Failed to fetch"
// when one request of the Explore cold-load fan-out drops. SWR keeps the
// original promise for the hook that later reads the same key, so handling
// the rejection at the prefetch site hides nothing from that hook. This guard
// fails when a preload() call under app/ is not chained into a .catch()
// (directly or after .then() links) whose handler does not rethrow.

const APP_DIR = fileURLToPath(new URL("../app", import.meta.url))

const listSources = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return listSources(path)
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : []
  })

// Blank out comments and the contents of string literals (keeping newlines
// and quote characters) so parentheses or "//" inside them cannot mislead the
// scan, and line numbers still match the file.
const blankCommentsAndStrings = (source: string) => {
  const out = source.split("")
  const blank = (from: number, to: number) => {
    for (let i = from; i < to; i++) if (out[i] !== "\n") out[i] = " "
  }
  let i = 0
  while (i < source.length) {
    const two = source.slice(i, i + 2)
    if (two === "//") {
      const end = source.indexOf("\n", i)
      const stop = end === -1 ? source.length : end
      blank(i, stop)
      i = stop
    } else if (two === "/*") {
      const end = source.indexOf("*/", i + 2)
      const stop = end === -1 ? source.length : end + 2
      blank(i, stop)
      i = stop
    } else if (source[i] === '"' || source[i] === "'" || source[i] === "`") {
      const quote = source[i]
      let j = i + 1
      while (j < source.length && source[j] !== quote) {
        j += source[j] === "\\" ? 2 : 1
      }
      blank(i + 1, j)
      i = j + 1
    } else {
      i++
    }
  }
  return out.join("")
}

// Index just past the parenthesis that closes the one opened at `open`.
const closeParen = (code: string, open: number) => {
  let depth = 0
  for (let i = open; i < code.length; i++) {
    if (code[i] === "(") depth++
    if (code[i] === ")" && --depth === 0) return i + 1
  }
  return code.length
}

// True when the call ending at `end` is chained into a .catch() whose handler
// does not rethrow, allowing any number of .then(...) links before it.
const isCaught = (code: string, end: number): boolean => {
  const link = /^\s*\.(then|catch)\s*\(/.exec(code.slice(end))
  if (!link) return false
  const open = end + link[0].length - 1
  const close = closeParen(code, open)
  if (link[1] === "then") return isCaught(code, close)
  const handler = code.slice(open + 1, close - 1)
  return !/\bthrow\b|Promise\s*\.\s*reject\b/.test(handler)
}

const findUncaughtPreloads = () =>
  listSources(APP_DIR).flatMap((file) => {
    const code = blankCommentsAndStrings(readFileSync(file, "utf8"))
    const where = (index: number) =>
      `${file.slice(APP_DIR.length + 1)}:${code.slice(0, index).split("\n").length}`
    // An aliased import would hide calls from the scan below.
    const aliased = [...code.matchAll(/\bpreload\s+as\s+\w+/g)].map(
      (m) => `${where(m.index)} (aliased import)`,
    )
    if (!/import\s*{[^}]*\bpreload\b[^}]*}\s*from/.test(code)) return aliased
    const uncaught = [...code.matchAll(/\bpreload\s*\(/g)]
      .filter(
        (m) => !isCaught(code, closeParen(code, m.index + m[0].length - 1)),
      )
      .map((m) => where(m.index))
    return [...aliased, ...uncaught]
  })

test("guard: every SWR preload() under app/ handles its rejection", () => {
  expect(findUncaughtPreloads()).toEqual([])
})

test("guard self-check: the scanner tells caught from uncaught calls", () => {
  const check = (source: string) => {
    const code = blankCommentsAndStrings(source)
    return isCaught(code, closeParen(code, code.indexOf("(")))
  }
  expect(check("preload(k, () => f(a, b)).catch(() => {})")).toBe(true)
  expect(
    check("preload(k, () => f()).then((r) => r.x).catch(() => null)"),
  ).toBe(true)
  expect(check("preload(k, () => f())\nnext()")).toBe(false)
  expect(check("preload(k, () => f()).then((r) => r)")).toBe(false)
  // A handler that rethrows leaves a new unhandled rejection.
  expect(check("preload(k, () => f()).catch((e) => { throw e })")).toBe(false)
  expect(check("preload(k, () => f()).catch((e) => Promise.reject(e))")).toBe(
    false,
  )
  // Parentheses and comment markers inside strings do not count.
  expect(check('preload(k, () => f(")")).catch(() => {})')).toBe(true)
  expect(check('preload(k, () => f(").catch(")).then(() => 1)')).toBe(false)
  expect(check('preload(k, () => f("//")).catch(() => {})')).toBe(true)
})
