import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

export type GlyphVariant = "bars" | "rose" | "quartile"

interface GlyphSettingsState {
  variant: GlyphVariant
  setVariant: (v: GlyphVariant) => void
}

export const useGlyphSettingsStore = create<GlyphSettingsState>()(
  immer<GlyphSettingsState>((set) => ({
    variant: "bars",
    setVariant: (v) =>
      set((state) => {
        state.variant = v
      }),
  }))
)
