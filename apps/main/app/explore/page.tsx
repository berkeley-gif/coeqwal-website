// Registers the /explore route.
// All UI is rendered by app/learn/page.tsx — this file just prevents a 404.
// The LearnPage component reads pathname on mount and syncs activeTab to "explore".
export { default } from "../learn/page"