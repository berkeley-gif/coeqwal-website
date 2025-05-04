/**
 * Custom components exports file.
 * Organized by category for ease of use.
 */

// Navigation components
export { Header } from "./navigation/Header"
export type { SecondaryNavItem } from "./navigation/Header"
export { LanguageSwitcher } from "./navigation/LanguageSwitcher"
export { LearnMoreButton } from "./navigation/LearnMoreButton"
export { MiniDrawer } from "./navigation/MiniDrawer"
export { VerticalDivider } from "./navigation/VerticalDivider"
export { ScrollDownIcon } from "./navigation/ScrollDownIcon"
export { default as CustomArrowForwardIcon } from "./navigation/CustomArrowForwardIcon"

// Common components
export { Card } from "./common/Card"
export { Logo } from "./common/Logo"
export { TransitionDiv } from "./common/TransitionDiv"
export { TransitionHeadline } from "./common/TransitionHeadline"
export { VideoBackground } from "./common/VideoBackground"

// Panel components
export { BasePanel } from "./panels/BasePanel"
export { HeroPanel } from "./panels/HeroPanel"
export { HeroQuestionsPanel } from "./panels/HeroQuestionsPanel"
export { TwoColumnPanel } from "./panels/TwoColumnPanel"
export { VideoPanel } from "./panels/VideoPanel"

// Operation components
export { default as OperationCard } from "./operations/OperationCard"
export type { OperationCardProps, SubOption } from "./operations/OperationCard"
