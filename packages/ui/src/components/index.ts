/**
 * Custom components exports file.
 * Organized by category for ease of use.
 */

// Navigation components
export { Header } from "./navigation/Header"
export type { SecondaryNavItem } from "./navigation/Header"
export { LanguageSwitcher } from "./navigation/LanguageSwitcher"
export { LearnMoreButton } from "./navigation/LearnMoreButton"
export { SearchScenariosButton } from "./navigation/SearchScenariosButton"
export { MiniDrawer } from "./navigation/MiniDrawer"
export { MultiDrawer } from "./navigation/MultiDrawer"
export type { TabKey } from "./navigation/MultiDrawer"
export { VerticalDivider } from "./navigation/VerticalDivider"
export { ScrollDownIcon } from "./navigation/ScrollDownIcon"
export { default as CustomArrowForwardIcon } from "./navigation/CustomArrowForwardIcon"
export { default as CustomArrowDownIcon } from "./navigation/CustomArrowDownIcon"

// Common components
export { Card } from "./common/Card"
export { Logo } from "./common/Logo"
export { TransitionDiv } from "./common/TransitionDiv"
export { TransitionHeadline } from "./common/TransitionHeadline"
export { VideoBackground } from "./common/VideoBackground"
export { default as CustomScrollContainer } from "./common/CustomScrollContainer"

// Panel components
export { BasePanel } from "./panels/BasePanel"
export { HeroPanel } from "./panels/HeroPanel"
export { TwoColumnPanel } from "./panels/TwoColumnPanel"
export { VideoPanel } from "./panels/VideoPanel"

// Operation components
export { default as OperationCard } from "./operations/OperationCard"
export type { OperationCardProps, SubOption } from "./operations/OperationCard"
