// components/ui/dialog.tsx

"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog"; // ייבוא כל המודול
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal; // אפשר להשתמש ישירות
const DialogOverlay = React.forwardRef< // Overlay ו-Content צריכים עיטוף עם forwardRef ו-styling
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-all duration-100 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  // ה-DialogPortal הקודם שכתבת היה מעט מיותר כי DialogPrimitive.Portal כבר קיים
  // אבל אם אתה רוצה את העיטוף הנוסף ל-centering, אפשר להשאיר אותו או להטמיע את הלוגיקה כאן.
  // לצורך הפשטות וההתאמה ל-shadcn, נשתמש ב-DialogPrimitive.Portal ישירות עם Content.
  <DialogPrimitive.Portal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        "max-h-[85vh] overflow-y-auto", // הוספתי גלילה אם התוכן ארוך
        className // מאפשר דריסה של קלאסים
      )}
      {...props}
    >
      {children}
      {/* אין צורך ב-X כאן, DialogPrimitive.Close משמש לסגירה מכל מקום */}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;


const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-right", // שיניתי ל-text-right כברירת מחדל
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 sm:space-x-reverse", // הוספתי space-x-reverse לכיווניות
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-right", // שיניתי ל-text-right
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground text-right", className)} // שיניתי ל-text-right
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

// זהו החלק החשוב לתיקון השגיאה שלך:
const DialogClose = DialogPrimitive.Close; // הקצאה פשוטה של הקומפוננטה

export {
  Dialog,
  DialogPortal, // אם אתה עדיין רוצה את העיטוף המותאם אישית שלך
  DialogOverlay,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose, // עכשיו DialogClose מיוצא כראוי
  DialogPrimitive, // אופציונלי: אם אתה רוצה גישה לכל DialogPrimitive במקומות אחרים
};