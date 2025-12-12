/**
 * Tooltip components
 * 
 * This directory contains a standardized tooltip system.
 * 
 * ## Component overview
 * 
 * - **HybridTooltip**: Device-adaptive tooltip (hover on desktop, click on touch)
 * - **ClickTooltip**: Always click-to-open tooltip (consistent across devices)
 * 
 * Both components support two variants:
 * - `variant="tooltip"` (default): MUI Tooltip with arrow, auto-positioned
 * - `variant="overlay"`: Custom centered overlay, better for complex content
 * 
 * @see HybridTooltip - For simple hints where hover feels natural on desktop
 * @see ClickTooltip - For explicit open/close control on all devices
 */

export { HybridTooltip } from "./HybridTooltip"
export type { HybridTooltipProps } from "./HybridTooltip"

export { ClickTooltip } from "./ClickTooltip"
export type { ClickTooltipProps } from "./ClickTooltip"

