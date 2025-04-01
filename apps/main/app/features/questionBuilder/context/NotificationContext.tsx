"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"
import { Snackbar, Alert } from "@repo/ui/mui"

// Define alert severity types
type AlertSeverity = "error" | "warning" | "info" | "success"

// Define notification interface
export interface Notification {
  message: string
  severity: AlertSeverity // 'error', 'warning', 'info', 'success'
  open: boolean
}

// Default notification state
const defaultNotification: Notification = {
  message: "",
  severity: "info",
  open: false,
}

// Create context
interface NotificationContextType {
  notification: Notification
  showNotification: (message: string, severity?: AlertSeverity) => void
  hideNotification: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
)

// Provider component
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] =
    useState<Notification>(defaultNotification)

  const showNotification = (
    message: string,
    severity: AlertSeverity = "info",
  ) => {
    setNotification({
      message,
      severity,
      open: true,
    })
  }

  const hideNotification = () => {
    setNotification((prev) => ({
      ...prev,
      open: false,
    }))
  }

  return (
    <NotificationContext.Provider
      value={{
        notification,
        showNotification,
        hideNotification,
      }}
    >
      {children}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={hideNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={hideNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  )
}

// Custom hook for using the notification context
export function useNotification() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    )
  }
  return context
}
