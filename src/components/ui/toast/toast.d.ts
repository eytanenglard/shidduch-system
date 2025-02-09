import * as React from "react"

export type ToastProps = {
  id?: string
  className?: string
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: "default" | "destructive"
  action?: ToastActionElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export type ToastActionElement = React.ReactElement<{
  className?: string
  altText?: string
  onClick?: () => void
}>