import { useMediaQuery } from "@mui/material"

/**
 * True on touch-primary devices (tablets, phones) where there's no
 * persistent hover state — use this to branch UX that currently
 * depends on `onMouseEnter`/`:hover`, which never fires on tap.
 */
export function useIsCoarsePointer(): boolean {
  return useMediaQuery("(pointer: coarse)")
}
