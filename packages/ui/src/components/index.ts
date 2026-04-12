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

// Text utilities
export { TruncatedText } from "./common/TruncatedText"
export type { TruncatedTextProps } from "./common/TruncatedText"

// Panel components
export { Panel } from "./panels/Panel"
export type { PanelProps } from "./panels/Panel"
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

// Call-response UI components
export { CallResponsePanel } from "../call-response-ui/CallResponsePanel"
export type { CallResponsePanelProps } from "../call-response-ui/CallResponsePanel"

// Chip components
export { ToggleChip, TierChip, LocationChip, ScenarioBadge } from "./Chip"
export type {
  ToggleChipProps,
  TierChipProps,
  LocationChipProps,
  ScenarioBadgeProps,
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

// Modal components
export { MobileModal } from "./common/MobileModal"
export type { MobileModalProps } from "./common/MobileModal"
