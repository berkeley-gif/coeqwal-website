"use client"

/**
 * ErrorBoundary - Class component that catches errors in children
 *
 * Wrap any component tree to catch rendering errors and display
 * a fallback UI instead of crashing the entire app.
 *
 * @example
 * <ErrorBoundary fallback={<ErrorFallback title="Map failed" />}>
 *   <MapComponent />
 * </ErrorBoundary>
 */

import React from "react"

export interface ErrorBoundaryProps {
  children: React.ReactNode
  /** Fallback UI to show when an error is caught */
  fallback: React.ReactNode
  /** Optional callback when an error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo)

    // Call error handler (e.g., for error tracking services)
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}

export default ErrorBoundary
