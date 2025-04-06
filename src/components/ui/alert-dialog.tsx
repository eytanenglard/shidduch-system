import React, { createContext, useContext, useCallback, useState } from "react";

type AlertDialogContextType = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const AlertDialogContext = createContext<AlertDialogContextType>({
  open: false,
  setOpen: () => {}, // Remove the unused parameter
});

// Root component
type AlertDialogProps = {
  children: React.ReactNode;
  open?: boolean; 
  onOpenChange?: (open: boolean) => void;
};

const AlertDialog = ({
  children,
  open: externalOpen,
  onOpenChange
}: AlertDialogProps): JSX.Element => {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // אם סופקו props חיצוניים, השתמש בהם, אחרת השתמש במצב הפנימי
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  
  const setOpen = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    // עדכון המצב הפנימי
    if (typeof value === 'function') {
      const newValue = value(open);
      setInternalOpen(newValue);
      onOpenChange?.(newValue);
    } else {
      setInternalOpen(value);
      onOpenChange?.(value);
    }
  }, [open, onOpenChange]);

  const contextValue = {
    open,
    setOpen,
  };

  return (
    <AlertDialogContext.Provider value={contextValue}>
      {children}
    </AlertDialogContext.Provider>
  );
};

// Content wrapper
const AlertDialogContent = ({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { open } = useContext(AlertDialogContext);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 animate-in fade-in-0" />
      <div
        className={`fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%] sm:rounded-lg ${className}`}
        {...props}
      >
        {children}
      </div>
    </>
  );
};

// Header component
const AlertDialogHeader = ({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`flex flex-col space-y-2 text-center sm:text-left ${className}`}
    {...props}
  >
    {children}
  </div>
);

// Footer component
const AlertDialogFooter = ({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}
    {...props}
  >
    {children}
  </div>
);

// Title component
const AlertDialogTitle = ({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={`text-lg font-semibold ${className}`} {...props}>
    {children}
  </h2>
);

// Description component
const AlertDialogDescription = ({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-sm text-gray-500 ${className}`} {...props}>
    {children}
  </p>
);

// Action button component
const AlertDialogAction = ({
  className = "",
  children,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const { setOpen } = useContext(AlertDialogContext);
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      setOpen(false);
    },
    [onClick, setOpen]
  );

  return (
    <button
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-slate-50 hover:bg-slate-900/90 h-10 px-4 py-2 ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};

// Cancel button component
const AlertDialogCancel = ({
  className = "",
  children,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const { setOpen } = useContext(AlertDialogContext);
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      setOpen(false);
    },
    [onClick, setOpen]
  );

  return (
    <button
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white hover:bg-slate-100 h-10 px-4 py-2 mt-2 sm:mt-0 ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};