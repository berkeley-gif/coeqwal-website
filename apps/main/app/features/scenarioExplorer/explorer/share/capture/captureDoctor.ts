/**
 * captureDoctor
 *
 * Dev-mode-only diagnostics around `OffscreenCaptureHost`. Surfaces
 * the kinds of capture failures that are otherwise easy to miss
 * because they happen off-screen, on a hidden React root that
 * never renders to the user's eye:
 *
 *  - Slow captures (the snapshot fired `onReady`, but it took
 *    more than a soft threshold of wall-clock time, suggesting the
 *    chart is unintentionally heavy in capture mode, e.g. forgot
 *    to disable an animation).
 *  - Missing `<svg>` after `onReady` (the chart's snapshot wrapper
 *    fired the callback but did not commit a real SVG to the DOM).
 *  - Capture-kind tags that look generic ("unknown") at lots of
 *    call sites; the doctor encourages each call site to set
 *    `captureKind` explicitly so traces are filterable.
 *
 * The doctor never mutates state and never throws. It logs to the
 * console only when `process.env.NODE_ENV !== "production"`, which
 * means production users see nothing and production bundles can
 * tree-shake all of this away.
 *
 * The hooks are designed so the host calls them at the natural
 * moments (start, ready, success, fail) without any of the chart
 * code knowing about the doctor.
 */

const SLOW_CAPTURE_THRESHOLD_MS = 600

/**
 * In dev only. Returns true when the env hint says we are not in
 * production. Centralized so the call sites stay one-liners.
 */
function isDev(): boolean {
  if (typeof process === "undefined") return false
  return process.env.NODE_ENV !== "production"
}

/**
 * One handle per outstanding capture, returned by `start` and
 * passed back to `ready` / `success` / `fail` so the doctor can
 * attribute timings to the right call.
 */
export interface CaptureDoctorHandle {
  kind: string
  startedAt: number
  /**
   * Wall-clock timestamp at the moment the snapshot fired
   * `onReady`. Set by `ready`. Used to compute the gap between
   * "snapshot says it's done" and "host serialized the SVG", so
   * a stuck post-paint frame shows up as a discrete number.
   */
  readyAt?: number
}

export const captureDoctor = {
  start(kind: string | undefined): CaptureDoctorHandle | null {
    if (!isDev()) return null
    return {
      kind: kind ?? "unknown",
      startedAt: performance.now(),
    }
  },

  ready(handle: CaptureDoctorHandle | null): void {
    if (!handle || !isDev()) return
    handle.readyAt = performance.now()
  },

  success(handle: CaptureDoctorHandle | null): void {
    if (!handle || !isDev()) return
    const total = performance.now() - handle.startedAt
    if (total > SLOW_CAPTURE_THRESHOLD_MS) {
      console.warn(
        `[captureDoctor] slow capture: ${handle.kind} took ${Math.round(total)}ms ` +
          `(threshold ${SLOW_CAPTURE_THRESHOLD_MS}ms). ` +
          "Check that the snapshot has interactive=false and animate=false, " +
          "and that onReady is fired in a single requestAnimationFrame.",
      )
    }
    if (handle.kind === "unknown") {
      console.warn(
        "[captureDoctor] capture started without a `captureKind`. " +
          "Pass a string (e.g. 'radar:single', 'resilience:panel') " +
          "to OffscreenCaptureInput so traces are filterable.",
      )
    }
  },

  fail(handle: CaptureDoctorHandle | null, err: unknown): void {
    if (!handle || !isDev()) return
    const total = performance.now() - handle.startedAt
    const reason =
      err instanceof Error
        ? `${err.name}: ${err.message}`
        : typeof err === "string"
          ? err
          : "(non-error throwable)"
    console.warn(
      `[captureDoctor] capture failed: ${handle.kind} after ${Math.round(total)}ms — ${reason}`,
    )
  },
}
