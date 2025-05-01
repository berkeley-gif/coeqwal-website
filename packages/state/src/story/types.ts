export type SceneId = "initial-load" | "ar-overview" | "delta-fly"

export interface Scene {
  id: SceneId
  status: "idle" | "running" | "done"
  meta?: Record<string, unknown>
}
