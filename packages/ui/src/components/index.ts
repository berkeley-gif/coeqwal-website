// Navigation components
export { BaseHeader } from "./navigation/BaseHeader"
export type { BaseHeaderProps } from "./navigation/BaseHeader"
export { NavDropdown } from "./navigation/NavDropdown"
export type {
  NavDropdownProps,
  NavDropdownOption,
} from "./navigation/NavDropdown"
export { LanguageSwitcher } from "./navigation/LanguageSwitcher"
export { ScrollToButton } from "./navigation/ScrollToButton"
export { SkipLink } from "./navigation/SkipLink"

// Common components
export { default as AutoHeight } from "./common/AutoHeight"
export { Logo, LogoColor, LogoLight } from "./common/Logo"
export { GlossaryLinkedText } from "./common/GlossaryLinkedText"
export { LeadingMarkerText } from "./common/LeadingMarkerText"
export { ArrowHead } from "./icons/ArrowHead"
export { RoundedRightArrow } from "./icons/RoundedRightArrow"
export type { RoundedRightArrowProps } from "./icons/RoundedRightArrow"
export { NavArrow } from "./common/NavArrow"
export type { NavArrowProps, NavArrowDirection } from "./common/NavArrow"
export { CircularArrowButton } from "./common/CircularArrowButton"
// Tooltip components (all use HybridTooltip internally for device-adaptive behavior)
export { InfoTooltip } from "./common/InfoTooltip"
export type { InfoTooltipProps } from "./common/InfoTooltip"
// Core tooltip system
export { ClickTooltip } from "./common/tooltips/ClickTooltip"
export type { ClickTooltipProps } from "./common/tooltips/ClickTooltip"
export { HybridTooltip } from "./common/tooltips/HybridTooltip"
export type { HybridTooltipProps } from "./common/tooltips/HybridTooltip"
export { TooltipCloseButton } from "./common/tooltips/TooltipCloseButton"
export type { TooltipCloseButtonProps } from "./common/tooltips/TooltipCloseButton"
// Tooltip foundations (shared surface, disclosure state, anchored positioning)
export { tooltipSurface } from "./common/tooltips/tooltipSurface"
export type { TooltipSurfaceOptions } from "./common/tooltips/tooltipSurface"
export { useDisclosure } from "./common/tooltips/useDisclosure"
export type {
  UseDisclosureOptions,
  UseDisclosureResult,
} from "./common/tooltips/useDisclosure"
export { AnchoredPortal } from "./common/tooltips/AnchoredPortal"
export type { AnchoredPortalProps } from "./common/tooltips/AnchoredPortal"
// Standard tooltip surfaces (hover hint + click/anchored popover)
export { HoverTip } from "./common/tooltips/HoverTip"
export type { HoverTipProps } from "./common/tooltips/HoverTip"
export { InfoPopover } from "./common/tooltips/InfoPopover"
export type { InfoPopoverProps } from "./common/tooltips/InfoPopover"
export { InfoIconButton } from "./common/InfoIconButton"
export type { InfoIconButtonProps } from "./common/InfoIconButton"
export { SortButton } from "./common/SortButton"
export type { SortButtonProps } from "./common/SortButton"
export { ToggleSortButton } from "./common/ToggleSortButton"
export type {
  ToggleSortButtonProps,
  SortState,
} from "./common/ToggleSortButton"
export { StyledTextInput } from "./common/StyledTextInput"
export type { StyledTextInputProps } from "./common/StyledTextInput"
export { CompactSearchBar } from "./common/CompactSearchBar"
export type { CompactSearchBarProps } from "./common/CompactSearchBar"
export { InfoOverlay } from "./common/InfoOverlay"
export type { InfoOverlayProps } from "./common/InfoOverlay"
export { CompactSelect } from "./common/CompactSelect"
export type {
  CompactSelectProps,
  CompactSelectOption,
  CompactSelectGroup,
} from "./common/CompactSelect"

// Content components
export { LinedList } from "./common/LinedList"
export type { LinedListProps, LinedListItem } from "./common/LinedList"
export { InfoCard } from "./common/InfoCard"
export type { InfoCardProps } from "./common/InfoCard"
export { InfoCardGrid } from "./common/InfoCardGrid"
export type { InfoCardGridProps } from "./common/InfoCardGrid"
export { BarredColumns } from "./common/BarredColumns"
export type {
  BarredColumnsProps,
  BarredColumnItem,
} from "./common/BarredColumns"

// Text utilities
export { TruncatedText } from "./common/TruncatedText"
export type { TruncatedTextProps } from "./common/TruncatedText"

// Panel components
export { Panel } from "./panels/Panel"
export type { PanelProps } from "./panels/Panel"
export {
  resolveRadius,
  resolveInset,
  DEFAULT_PANEL_INSET_X,
  DEFAULT_PANEL_INSET_Y,
} from "./panels/resolveRadius"
export type {
  RadiusTokenKey,
  RadiusValue,
  RadiusTokens,
  PanelInset,
} from "./panels/resolveRadius"
export { DisplayBlock } from "./panels/DisplayBlock"
export type { DisplayBlockProps } from "./panels/DisplayBlock"
export { TwoColumnInterstitial } from "./panels/TwoColumnInterstitial"
export type {
  TwoColumnInterstitialProps,
  InterstitialLink,
} from "./panels/TwoColumnInterstitial"
export { CoeqwalPanel } from "./panels/CoeqwalPanel"
export type { CoeqwalPanelProps } from "./panels/CoeqwalPanel"
export { ContentPanel } from "./panels/ContentPanel"
export type { ContentPanelProps } from "./panels/ContentPanel"

// Custom icons
export {
  DocumentListIcon,
  DocumentCheckedIcon,
  DocumentExpandedIcon,
  DocumentCollapsedIcon,
  CurrentOpsIcon,
  CurrentOpsMultipleIcon,
} from "./icons/DocumentIcons"
export { WaterDroplet } from "./icons/WaterDroplet"
export type { WaterDropletProps } from "./icons/WaterDroplet"
export { Salmon } from "./icons/Salmon"
export type { SalmonProps } from "./icons/Salmon"
export { EnvironmentalRefuge } from "./icons/EnvironmentalRefuge"
export type { EnvironmentalRefugeProps } from "./icons/EnvironmentalRefuge"

// Call-response UI components
export { CallResponsePanel } from "../call-response-ui/CallResponsePanel"
export type { CallResponsePanelProps } from "../call-response-ui/CallResponsePanel"

// Chip components
export {
  ToggleChip,
  TierChip,
  LocationChip,
  ScenarioBadge,
  HydroclimateBadge,
} from "./Chip"
export type {
  ToggleChipProps,
  TierChipProps,
  LocationChipProps,
  ScenarioBadgeProps,
  HydroclimateBadgeProps,
} from "./Chip"

// Error handling
export { ErrorFallback } from "./common/ErrorFallback"
export type { ErrorFallbackProps } from "./common/ErrorFallback"

// Panel feedback (empty states, errors, info prompts, loading)
export { PanelFeedback } from "./common/PanelFeedback"
export type {
  PanelFeedbackProps,
  PanelFeedbackVariant,
} from "./common/PanelFeedback"

// Chart toast (centered overlay pill for chart guidance states)
export { ChartToast } from "./common/ChartToast"
export type { ChartToastProps } from "./common/ChartToast"

// Modal components
export { MobileModal } from "./common/MobileModal"
export type { MobileModalProps } from "./common/MobileModal"

// CSS-length utility for resolving theme `clamp(...)` strings to pixels
// at runtime. Used for scroll-offset math against `theme.layout.panel.*`.
export { resolveCssLengthPx } from "../themes/measureCssLength"
