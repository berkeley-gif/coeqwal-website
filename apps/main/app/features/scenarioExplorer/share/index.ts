/**
 * Public surface of the share/ feature.
 */

export { default as ShareDrawer } from "./ShareDrawer"
export { default as ShareItemView } from "./ShareItemView"
export { default as ShareCardShell } from "./ShareCardShell"
export { default as ShareUrlVersionNotice } from "./ui/ShareUrlVersionNotice"

export { default as ShareScenarioCard } from "./cards/ShareScenarioCard"
export { default as ShareRadarCard } from "./cards/ShareRadarCard"
export { default as ShareSnapshotCard } from "./cards/ShareSnapshotCard"
export { default as ResilienceShareCard } from "./cards/ResilienceShareCard"
export { default as SvgThumbnail } from "./cards/SvgThumbnail"

export { default as ShareRadarLiveChart } from "./live/ShareRadarLiveChart"
export { default as ShareResilienceLiveChart } from "./live/ShareResilienceLiveChart"

export {
  default as ShareItemNoteBlock,
  SHARE_NOTE_PLACEHOLDER,
} from "./note/ShareItemNoteBlock"

export {
  normalizeShareRadarHydro,
  buildShareRadarLiveDataFields,
  type ShareRadarHydroKey,
  type ShareRadarLiveDataFields,
} from "./utils/shareRadarLiveData"

export {
  getResilienceShareCardContent,
  type ResilienceShareItem,
  type ResilienceShareCardLookups,
} from "./utils/getResilienceShareCardContent"

export type { ShareItem, ShareItemPatch, PersistedShareItem } from "./types"
export {
  loadShareState,
  saveShareState,
  SHARE_STORAGE_KEY,
  SHARE_STORAGE_VERSION,
} from "./persist"
export {
  SHARE_URL_VERSION,
  encodeShareItems,
  parseShareItemsParam,
  parseShareUrl,
  type ParsedShareUrl,
} from "./url"

export {
  offscreenCapture,
  type OffscreenCaptureInput,
  type OffscreenCaptureResult,
} from "./capture/OffscreenCaptureHost"

export {
  VARIANT_REGISTRY,
  handlerForItem,
  getHandlerByUrlPrefix,
  type VariantHandler,
  type RenderContext,
  type CsvLookups,
  type DataRehydrationContext,
  type ShareItemScenarioInfo,
} from "./variants"

export {
  default as ShareDataRehydrationHost,
  useShareDataReady,
  type ShareDataRehydrationHostProps,
} from "./ShareDataRehydrationHost"
