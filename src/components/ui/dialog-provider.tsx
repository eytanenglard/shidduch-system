// src/components/ui/dialog-provider.tsx
"use client"
 
import {
  DialogPortal,
  DialogOverlay,
  DialogContent,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
 
function DialogProvider({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogContent className={cn(className)}>
        {children}
      </DialogContent>
    </DialogPortal>
  )
}
 
export { DialogProvider }