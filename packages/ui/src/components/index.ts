// Navigation components
export { BaseHeader } from "./navigation/BaseHeader"
export type { BaseHeaderProps, SecondaryNavItem } from "./navigation/BaseHeader"
export { AppHeader } from "./navigation/AppHeader"
export type { AppHeaderProps } from "./navigation/AppHeader"
export { NavDropdown } from "./navigation/NavDropdown"
export type {
  NavDropdownProps,
  NavDropdownOption,
} from "./navigation/NavDropdown"
export { LanguageSwitcher } from "./navigation/LanguageSwitcher"
export { MultiDrawer } from "./navigation/MultiDrawer"
export { AppMultiDrawer } from "./navigation/AppMultiDrawer"
export { ScrollToButton } from "./navigation/ScrollToButton"
export type { TabKey } from "./navigation/MultiDrawer"
export type { AppMultiDrawerProps } from "./navigation/AppMultiDrawer"
export type { GlossaryTerm, TierInfo } from "../lib/glossary"

// Common components
export { Card, ScenarioCard } from "./common/Card"
export type { CardProps, ScenarioCardProps } from "./common/Card"
export { Logo } from "./common/Logo"
export { GlossaryLinkedText } from "./common/GlossaryLinkedText"
export { LeadingMarkerText } from "./common/LeadingMarkerText"
export { ArrowHead } from "./icons/ArrowHead"
export { RoundedDownArrow } from "./icons/RoundedDownArrow"
export type { RoundedDownArrowProps } from "./icons/RoundedDownArrow"
export { RoundedRightArrow } from "./icons/RoundedRightArrow"
export type { RoundedRightArrowProps } from "./icons/RoundedRightArrow"
// Legacy tooltip components (still in common/)
export { BaseTooltip } from "./common/BaseTooltip"
export type { BaseTooltipProps } from "./common/BaseTooltip"
export { MapMarkerTooltip } from "./common/MapMarkerTooltip"
export type { MapMarkerTooltipProps } from "./common/MapMarkerTooltip"
export { InfoTooltip } from "./common/InfoTooltip"
export type { InfoTooltipProps } from "./common/InfoTooltip"

// New standardized tooltip system (in tooltips/)
export { ClickTooltip } from "./common/tooltips/ClickTooltip"
export type { ClickTooltipProps } from "./common/tooltips/ClickTooltip"
export { HybridTooltip } from "./common/tooltips/HybridTooltip"
export type { HybridTooltipProps } from "./common/tooltips/HybridTooltip"
export { Dropdown } from "./common/Dropdown"
export type { DropdownProps, DropdownOption } from "./common/Dropdown"
export { DiscreteSlider } from "./common/DiscreteSlider"
export type { DiscreteSliderProps } from "./common/DiscreteSlider"
export { InfoIconButton } from "./common/InfoIconButton"
export type { InfoIconButtonProps } from "./common/InfoIconButton"
export { SortButton } from "./common/SortButton"
export type { SortButtonProps } from "./common/SortButton"
export { StyledTextInput } from "./common/StyledTextInput"
export type { StyledTextInputProps } from "./common/StyledTextInput"

// Panel components
export { OneColumnPanel } from "./panels/OneColumnPanel"
export { Spacer } from "./panels/Spacer"
export {
  DashboardPanel,
  DashboardGrid,
  DashboardCardContainer,
} from "./panels/DashboardPanel"
export type {
  DashboardPanelProps,
  DashboardGridProps,
  DashboardCardContainerProps,
} from "./panels/DashboardPanel"

// Custom icons
export {
  DocumentListIcon,
  DocumentCheckedIcon,
  DocumentExpandedIcon,
  DocumentCollapsedIcon,
} from "./icons/DocumentIcons"

// Call-response UI components
export { CallResponsePanel } from "../call-response-ui/CallResponsePanel"
export type { CallResponsePanelProps } from "../call-response-ui/CallResponsePanel"
